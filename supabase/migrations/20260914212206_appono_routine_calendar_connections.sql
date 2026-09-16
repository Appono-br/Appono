begin;

create table public.conexoes_agenda_cliente (
  id_conexao_agenda bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  provedor text not null,
  status text not null default 'PENDENTE',
  escopos text[] not null default '{}'::text[],
  identificador_conta text,
  token_acesso_cifrado text,
  token_refresh_cifrado text,
  expiracao_token timestamptz,
  cursor_sincronizacao text,
  timezone text not null default 'America/Sao_Paulo',
  ultima_sincronizacao_em timestamptz,
  erro_codigo text,
  erro_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint conexoes_agenda_provedor_check check (provedor in ('GOOGLE', 'OUTLOOK')),
  constraint conexoes_agenda_status_check check (status in ('PENDENTE', 'CONECTADO', 'ERRO', 'REVOGADO')),
  constraint conexoes_agenda_tokens_check check (
    (status in ('PENDENTE', 'REVOGADO') and token_acesso_cifrado is null and token_refresh_cifrado is null)
    or (status in ('CONECTADO', 'ERRO') and token_refresh_cifrado is not null)
  ),
  constraint conexoes_agenda_erro_codigo_check check (erro_codigo is null or char_length(erro_codigo) between 2 and 80),
  unique (id_cliente, provedor),
  unique (id_conexao_agenda, id_cliente)
);

create index conexoes_agenda_cliente_status_idx
  on public.conexoes_agenda_cliente (id_cliente, status, atualizado_em desc);

create table public.janelas_ocupadas_rotina (
  id_janela_ocupada bigserial primary key,
  id_conexao_agenda bigint not null,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  inicio_em timestamptz not null,
  fim_em timestamptz not null,
  origem_hash text not null,
  criado_em timestamptz not null default now(),
  constraint janelas_ocupadas_periodo_check check (inicio_em < fim_em),
  constraint janelas_ocupadas_hash_check check (char_length(origem_hash) = 64),
  unique (id_conexao_agenda, inicio_em, fim_em, origem_hash),
  foreign key (id_conexao_agenda, id_cliente)
    references public.conexoes_agenda_cliente(id_conexao_agenda, id_cliente) on delete cascade
);

create index janelas_ocupadas_cliente_periodo_idx
  on public.janelas_ocupadas_rotina (id_cliente, inicio_em, fim_em);

create index janelas_ocupadas_conexao_periodo_idx
  on public.janelas_ocupadas_rotina (id_conexao_agenda, inicio_em, fim_em);

create table public.sincronizacoes_agenda_rotina (
  id_sincronizacao_agenda bigserial primary key,
  id_conexao_agenda bigint not null,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  chave_idempotencia uuid not null,
  status text not null default 'INICIADA',
  inicio_periodo timestamptz not null,
  fim_periodo timestamptz not null,
  intervalos_recebidos integer not null default 0,
  erro_codigo text,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  constraint sincronizacoes_agenda_status_check check (status in ('INICIADA', 'CONCLUIDA', 'FALHOU')),
  constraint sincronizacoes_agenda_periodo_check check (inicio_periodo < fim_periodo),
  constraint sincronizacoes_agenda_contagem_check check (intervalos_recebidos >= 0),
  constraint sincronizacoes_agenda_erro_check check (erro_codigo is null or char_length(erro_codigo) between 2 and 80),
  unique (id_conexao_agenda, chave_idempotencia),
  foreign key (id_conexao_agenda, id_cliente)
    references public.conexoes_agenda_cliente(id_conexao_agenda, id_cliente) on delete cascade
);

create index sincronizacoes_agenda_cliente_idx
  on public.sincronizacoes_agenda_rotina (id_cliente, iniciado_em desc);

create table public.oauth_agenda_tentativas (
  id_tentativa_oauth bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  provedor text not null,
  state_hash text not null,
  code_verifier_cifrado text not null,
  retorno_path text not null default '/cliente/rotina/configurar',
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint oauth_agenda_provedor_check check (provedor in ('GOOGLE', 'OUTLOOK')),
  constraint oauth_agenda_state_hash_check check (char_length(state_hash) = 64),
  constraint oauth_agenda_retorno_check check (retorno_path in ('/cliente/rotina', '/cliente/rotina/configurar')),
  constraint oauth_agenda_expiracao_check check (expira_em > criado_em),
  unique (state_hash)
);

create index oauth_agenda_cliente_expiracao_idx
  on public.oauth_agenda_tentativas (id_cliente, expira_em desc);

create trigger set_updated_at_conexoes_agenda_cliente
before update on public.conexoes_agenda_cliente
for each row execute function public.set_atualizado_em();

alter table public.conexoes_agenda_cliente enable row level security;
alter table public.janelas_ocupadas_rotina enable row level security;
alter table public.sincronizacoes_agenda_rotina enable row level security;
alter table public.oauth_agenda_tentativas enable row level security;

revoke all on table public.conexoes_agenda_cliente from public, anon, authenticated;
revoke all on table public.janelas_ocupadas_rotina from public, anon, authenticated;
revoke all on table public.sincronizacoes_agenda_rotina from public, anon, authenticated;
revoke all on table public.oauth_agenda_tentativas from public, anon, authenticated;

grant all on table public.conexoes_agenda_cliente to service_role;
grant all on table public.janelas_ocupadas_rotina to service_role;
grant all on table public.sincronizacoes_agenda_rotina to service_role;
grant all on table public.oauth_agenda_tentativas to service_role;

grant usage, select on sequence public.conexoes_agenda_cliente_id_conexao_agenda_seq to service_role;
grant usage, select on sequence public.janelas_ocupadas_rotina_id_janela_ocupada_seq to service_role;
grant usage, select on sequence public.sincronizacoes_agenda_rotina_id_sincronizacao_agenda_seq to service_role;
grant usage, select on sequence public.oauth_agenda_tentativas_id_tentativa_oauth_seq to service_role;

create or replace function public.consumir_tentativa_oauth_agenda(
  p_state_hash text,
  p_provedor text
)
returns public.oauth_agenda_tentativas
language plpgsql
security invoker
set search_path = ''
as $$
declare
  tentativa public.oauth_agenda_tentativas;
begin
  update public.oauth_agenda_tentativas
     set usado_em = now()
   where state_hash = p_state_hash
     and provedor = upper(p_provedor)
     and usado_em is null
     and expira_em > now()
  returning * into tentativa;

  if tentativa.id_tentativa_oauth is null then
    raise exception using errcode = 'P0001', message = 'OAUTH_STATE_INVALIDO';
  end if;

  return tentativa;
end;
$$;

revoke all on function public.consumir_tentativa_oauth_agenda(text, text) from public, anon, authenticated;
grant execute on function public.consumir_tentativa_oauth_agenda(text, text) to service_role;

create or replace function public.substituir_janelas_ocupadas_agenda(
  p_id_cliente bigint,
  p_id_conexao_agenda bigint,
  p_chave_idempotencia uuid,
  p_inicio_periodo timestamptz,
  p_fim_periodo timestamptz,
  p_janelas jsonb,
  p_cursor_sincronizacao text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  sincronizacao public.sincronizacoes_agenda_rotina;
  janela jsonb;
  inicio_janela timestamptz;
  fim_janela timestamptz;
  hash_janela text;
begin
  if p_inicio_periodo >= p_fim_periodo or jsonb_typeof(p_janelas) <> 'array' then
    raise exception using errcode = '22023', message = 'PERIODO_OU_JANELAS_INVALIDOS';
  end if;

  perform 1
    from public.conexoes_agenda_cliente
   where id_conexao_agenda = p_id_conexao_agenda
     and id_cliente = p_id_cliente
     and status in ('CONECTADO', 'ERRO')
   for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'CONEXAO_AGENDA_NAO_ENCONTRADA';
  end if;

  insert into public.sincronizacoes_agenda_rotina (
    id_conexao_agenda, id_cliente, chave_idempotencia, status,
    inicio_periodo, fim_periodo
  ) values (
    p_id_conexao_agenda, p_id_cliente, p_chave_idempotencia, 'INICIADA',
    p_inicio_periodo, p_fim_periodo
  )
  on conflict (id_conexao_agenda, chave_idempotencia) do nothing
  returning * into sincronizacao;

  if sincronizacao.id_sincronizacao_agenda is null then
    select * into sincronizacao
      from public.sincronizacoes_agenda_rotina
     where id_conexao_agenda = p_id_conexao_agenda
       and chave_idempotencia = p_chave_idempotencia;
    return to_jsonb(sincronizacao);
  end if;

  delete from public.janelas_ocupadas_rotina
   where id_conexao_agenda = p_id_conexao_agenda
     and inicio_em < p_fim_periodo
     and fim_em > p_inicio_periodo;

  for janela in select value from jsonb_array_elements(p_janelas)
  loop
    inicio_janela := (janela->>'inicio_em')::timestamptz;
    fim_janela := (janela->>'fim_em')::timestamptz;
    hash_janela := janela->>'origem_hash';
    if inicio_janela >= fim_janela or char_length(coalesce(hash_janela, '')) <> 64 then
      raise exception using errcode = '22023', message = 'JANELA_OCUPADA_INVALIDA';
    end if;
    if inicio_janela < p_fim_periodo and fim_janela > p_inicio_periodo then
      insert into public.janelas_ocupadas_rotina (
        id_conexao_agenda, id_cliente, inicio_em, fim_em, origem_hash
      ) values (
        p_id_conexao_agenda, p_id_cliente, inicio_janela, fim_janela, hash_janela
      ) on conflict do nothing;
    end if;
  end loop;

  update public.conexoes_agenda_cliente
     set status = 'CONECTADO', cursor_sincronizacao = p_cursor_sincronizacao,
         ultima_sincronizacao_em = now(), erro_codigo = null, erro_em = null
   where id_conexao_agenda = p_id_conexao_agenda;

  update public.sincronizacoes_agenda_rotina
     set status = 'CONCLUIDA', intervalos_recebidos = jsonb_array_length(p_janelas),
         finalizado_em = now()
   where id_sincronizacao_agenda = sincronizacao.id_sincronizacao_agenda
  returning * into sincronizacao;

  return to_jsonb(sincronizacao);
end;
$$;

revoke all on function public.substituir_janelas_ocupadas_agenda(bigint, bigint, uuid, timestamptz, timestamptz, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.substituir_janelas_ocupadas_agenda(bigint, bigint, uuid, timestamptz, timestamptz, jsonb, text)
  to service_role;

create or replace function public.desconectar_agenda_cliente(
  p_id_cliente bigint,
  p_provedor text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  conexao_id bigint;
begin
  select id_conexao_agenda into conexao_id
    from public.conexoes_agenda_cliente
   where id_cliente = p_id_cliente and provedor = upper(p_provedor)
   for update;
  if conexao_id is null then return false; end if;

  delete from public.janelas_ocupadas_rotina where id_conexao_agenda = conexao_id;
  update public.conexoes_agenda_cliente
     set status = 'REVOGADO', token_acesso_cifrado = null, token_refresh_cifrado = null,
         expiracao_token = null, cursor_sincronizacao = null,
         ultima_sincronizacao_em = null, erro_codigo = null, erro_em = null
   where id_conexao_agenda = conexao_id;
  return true;
end;
$$;

revoke all on function public.desconectar_agenda_cliente(bigint, text) from public, anon, authenticated;
grant execute on function public.desconectar_agenda_cliente(bigint, text) to service_role;

create policy "Cliente le status da propria agenda"
on public.conexoes_agenda_cliente for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

create policy "Cliente le as proprias janelas ocupadas"
on public.janelas_ocupadas_rotina for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

create policy "Cliente le as proprias sincronizacoes"
on public.sincronizacoes_agenda_rotina for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

-- As políticas são defesa em profundidade. O navegador não recebe grants nessas
-- tabelas; toda leitura e escrita passa pela API Express autenticada.

commit;
