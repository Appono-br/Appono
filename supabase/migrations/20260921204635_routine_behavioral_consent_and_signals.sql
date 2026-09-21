begin;

create sequence public.consent_personalizacao_rotina_id_seq;

create table public.consentimentos_personalizacao_rotina (
  id_consentimento_personalizacao bigint primary key default nextval('public.consent_personalizacao_rotina_id_seq'::regclass),
  id_cliente bigint not null unique references public.clientes(id_cliente) on delete cascade,
  habilitado boolean not null default false,
  versao_texto text not null default 'rotina-personalizacao-v1',
  origem text not null default 'CONFIGURACOES',
  concedido_em timestamptz,
  revogado_em timestamptz,
  versao bigint not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint consentimento_rotina_versao_texto_check check (char_length(trim(versao_texto)) between 3 and 80),
  constraint consentimento_rotina_origem_check check (origem in ('CONFIGURACOES','FEEDBACK')),
  constraint consentimento_rotina_instantes_check check (
    (habilitado and concedido_em is not null and revogado_em is null)
    or (not habilitado)
  )
);
alter sequence public.consent_personalizacao_rotina_id_seq
  owned by public.consentimentos_personalizacao_rotina.id_consentimento_personalizacao;

create sequence public.hist_consent_personalizacao_id_seq;

create table public.historico_consentimento_personalizacao_rotina (
  id_historico_consentimento bigint primary key default nextval('public.hist_consent_personalizacao_id_seq'::regclass),
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  habilitado boolean not null,
  versao_texto text not null,
  origem text not null,
  ocorrido_em timestamptz not null default now(),
  constraint historico_consentimento_versao_texto_check check (char_length(trim(versao_texto)) between 3 and 80),
  constraint historico_consentimento_origem_check check (origem in ('CONFIGURACOES','FEEDBACK'))
);
alter sequence public.hist_consent_personalizacao_id_seq
  owned by public.historico_consentimento_personalizacao_rotina.id_historico_consentimento;
create index historico_consentimento_cliente_idx
  on public.historico_consentimento_personalizacao_rotina (id_cliente, ocorrido_em desc);

create sequence public.sinais_comportamentais_rotina_id_seq;

create table public.sinais_comportamentais_rotina (
  id_sinal_comportamental bigint primary key default nextval('public.sinais_comportamentais_rotina_id_seq'::regclass),
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_refeicao_planejada bigint references public.refeicoes_planejadas(id_refeicao_planejada) on delete set null,
  id_restaurante bigint references public.restaurantes(id_restaurante) on delete set null,
  id_produto bigint references public.produtos(id_produto) on delete set null,
  id_janela_alimentacao bigint references public.janelas_alimentacao_rotina(id_janela_alimentacao) on delete set null,
  tipo_evento text not null,
  origem text not null default 'ROTINA_API',
  chave_idempotencia text not null unique,
  ocorreu_em timestamptz not null,
  consentimento_valido boolean not null default false,
  versao_consentimento text,
  atributos_escolhidos jsonb not null default '{}'::jsonb,
  excluido_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint sinais_rotina_tipo_check check (tipo_evento in (
    'APROVACAO','RECUSA','ALTERNATIVA','EDICAO','CONVERSAO_RESERVA','CONVERSAO_PEDIDO'
  )),
  constraint sinais_rotina_origem_check check (origem in ('ROTINA_API','CONVERSAO_API')),
  constraint sinais_rotina_chave_check check (char_length(trim(chave_idempotencia)) between 12 and 180),
  constraint sinais_rotina_versao_consentimento_check check (
    versao_consentimento is null or char_length(trim(versao_consentimento)) between 3 and 80
  ),
  constraint sinais_rotina_atributos_objeto_check check (jsonb_typeof(atributos_escolhidos) = 'object')
);
alter sequence public.sinais_comportamentais_rotina_id_seq
  owned by public.sinais_comportamentais_rotina.id_sinal_comportamental;
create index sinais_rotina_cliente_ocorrido_idx
  on public.sinais_comportamentais_rotina (id_cliente, ocorreu_em desc)
  where excluido_em is null;
create index sinais_rotina_personalizacao_idx
  on public.sinais_comportamentais_rotina (id_cliente, consentimento_valido, ocorreu_em desc)
  where excluido_em is null;

create trigger set_updated_at_consentimentos_personalizacao_rotina
before update on public.consentimentos_personalizacao_rotina
for each row execute function public.set_atualizado_em();

alter table public.consentimentos_personalizacao_rotina enable row level security;
alter table public.historico_consentimento_personalizacao_rotina enable row level security;
alter table public.sinais_comportamentais_rotina enable row level security;

revoke all on table public.consentimentos_personalizacao_rotina,
  public.historico_consentimento_personalizacao_rotina,
  public.sinais_comportamentais_rotina from public, anon, authenticated;
grant all on table public.consentimentos_personalizacao_rotina,
  public.historico_consentimento_personalizacao_rotina,
  public.sinais_comportamentais_rotina to service_role;
grant usage, select on sequence public.consent_personalizacao_rotina_id_seq,
  public.hist_consent_personalizacao_id_seq,
  public.sinais_comportamentais_rotina_id_seq to service_role;

grant select on table public.consentimentos_personalizacao_rotina to authenticated;
create policy "Cliente le seu consentimento de personalizacao"
on public.consentimentos_personalizacao_rotina for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

create or replace function appono_private.alterar_consentimento_personalizacao_rotina(
  p_habilitado boolean,
  p_versao_texto text,
  p_origem text default 'CONFIGURACOES'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  consentimento public.consentimentos_personalizacao_rotina;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  if cliente_id is null then raise sqlstate 'PT401' using message = 'Cliente nao autenticado'; end if;
  if p_versao_texto is null or char_length(trim(p_versao_texto)) not between 3 and 80
    or p_origem not in ('CONFIGURACOES','FEEDBACK') then
    raise sqlstate '22023' using message = 'Consentimento invalido';
  end if;

  insert into public.consentimentos_personalizacao_rotina(
    id_cliente, habilitado, versao_texto, origem, concedido_em, revogado_em
  ) values (
    cliente_id, p_habilitado, trim(p_versao_texto), p_origem,
    case when p_habilitado then now() end,
    case when not p_habilitado then now() end
  )
  on conflict(id_cliente) do update set
    habilitado = excluded.habilitado,
    versao_texto = excluded.versao_texto,
    origem = excluded.origem,
    concedido_em = case
      when excluded.habilitado and not public.consentimentos_personalizacao_rotina.habilitado then now()
      when excluded.habilitado then public.consentimentos_personalizacao_rotina.concedido_em
      else public.consentimentos_personalizacao_rotina.concedido_em
    end,
    revogado_em = case when excluded.habilitado then null else now() end,
    versao = public.consentimentos_personalizacao_rotina.versao + 1
  returning * into consentimento;

  insert into public.historico_consentimento_personalizacao_rotina(
    id_cliente, habilitado, versao_texto, origem
  ) values (cliente_id, consentimento.habilitado, consentimento.versao_texto, consentimento.origem);

  return to_jsonb(consentimento);
end;
$$;
revoke all on function appono_private.alterar_consentimento_personalizacao_rotina(boolean,text,text) from public, anon;
grant execute on function appono_private.alterar_consentimento_personalizacao_rotina(boolean,text,text) to authenticated;

create or replace function public.alterar_consentimento_personalizacao_rotina(
  p_habilitado boolean,
  p_versao_texto text,
  p_origem text default 'CONFIGURACOES'
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select appono_private.alterar_consentimento_personalizacao_rotina(p_habilitado,p_versao_texto,p_origem);
$$;
revoke all on function public.alterar_consentimento_personalizacao_rotina(boolean,text,text) from public, anon;
grant execute on function public.alterar_consentimento_personalizacao_rotina(boolean,text,text) to authenticated;

comment on table public.sinais_comportamentais_rotina is
  'Sinais privados e idempotentes da Rotina. Somente sinais consentidos podem influenciar a Intelligence V2.';

notify pgrst, 'reload schema';

commit;
