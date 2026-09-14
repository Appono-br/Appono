create table if not exists public.perfis_rotina_cliente (
  id_perfil_rotina bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  nome text not null default 'Rotina principal',
  endereco_base text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  dias_semana text[] not null default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  horario_inicio time not null default '11:30',
  horario_fim time not null default '14:00',
  tempo_maximo_minutos integer not null default 60,
  orcamento_diario numeric(10, 2),
  orcamento_semanal numeric(10, 2),
  raio_km numeric(6, 2) not null default 5,
  origem_agenda text not null default 'MANUAL',
  eventos_importados jsonb not null default '[]'::jsonb,
  janelas_disponiveis jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_rotina_cliente_nome_check check (char_length(trim(nome)) between 2 and 80),
  constraint perfis_rotina_cliente_coordenadas_check check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)
  ),
  constraint perfis_rotina_cliente_horarios_check check (horario_inicio < horario_fim),
  constraint perfis_rotina_cliente_tempo_check check (tempo_maximo_minutos between 20 and 240),
  constraint perfis_rotina_cliente_orcamento_diario_check check (orcamento_diario is null or orcamento_diario >= 0),
  constraint perfis_rotina_cliente_orcamento_semanal_check check (orcamento_semanal is null or orcamento_semanal >= 0),
  constraint perfis_rotina_cliente_raio_check check (raio_km between 1 and 100),
  constraint perfis_rotina_cliente_origem_agenda_check check (origem_agenda in ('MANUAL', 'GOOGLE', 'OUTLOOK'))
);

create unique index if not exists perfis_rotina_cliente_ativo_uidx
  on public.perfis_rotina_cliente (id_cliente)
  where ativo = true;

create index if not exists perfis_rotina_cliente_cliente_idx
  on public.perfis_rotina_cliente (id_cliente, atualizado_em desc);

create table if not exists public.preferencias_rotina_cliente (
  id_preferencia_rotina bigserial primary key,
  id_perfil_rotina bigint not null references public.perfis_rotina_cliente(id_perfil_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  tipo text not null,
  valor text,
  id_restaurante bigint references public.restaurantes(id_restaurante) on delete cascade,
  id_produto bigint references public.produtos(id_produto) on delete cascade,
  criado_em timestamptz not null default now(),
  constraint preferencias_rotina_tipo_check check (tipo in ('PREFERENCIA', 'PRATO_FAVORITO', 'RESTAURANTE_FAVORITO')),
  constraint preferencias_rotina_contexto_check check (
    (tipo = 'PREFERENCIA' and nullif(trim(coalesce(valor, '')), '') is not null)
    or (tipo = 'PRATO_FAVORITO' and id_produto is not null)
    or (tipo = 'RESTAURANTE_FAVORITO' and id_restaurante is not null)
  )
);

create index if not exists preferencias_rotina_cliente_idx
  on public.preferencias_rotina_cliente (id_cliente, tipo);

create table if not exists public.restricoes_rotina_cliente (
  id_restricao_rotina bigserial primary key,
  id_perfil_rotina bigint not null references public.perfis_rotina_cliente(id_perfil_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  tipo text not null,
  valor text not null,
  criado_em timestamptz not null default now(),
  constraint restricoes_rotina_tipo_check check (tipo in ('RESTRICAO', 'ALERGIA')),
  constraint restricoes_rotina_valor_check check (char_length(trim(valor)) between 2 and 80)
);

create index if not exists restricoes_rotina_cliente_idx
  on public.restricoes_rotina_cliente (id_cliente, tipo);

create table if not exists public.planejamentos_rotina (
  id_planejamento_rotina bigserial primary key,
  id_perfil_rotina bigint not null references public.perfis_rotina_cliente(id_perfil_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  semana_inicio date not null,
  semana_fim date not null,
  status text not null default 'GERADO',
  resumo jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint planejamentos_rotina_periodo_check check (semana_fim >= semana_inicio),
  constraint planejamentos_rotina_status_check check (status in ('GERADO', 'APROVADO', 'PARCIAL', 'CANCELADO'))
);

create unique index if not exists planejamentos_rotina_cliente_semana_uidx
  on public.planejamentos_rotina (id_cliente, semana_inicio);

create index if not exists planejamentos_rotina_cliente_idx
  on public.planejamentos_rotina (id_cliente, semana_inicio desc);

create table if not exists public.refeicoes_planejadas (
  id_refeicao_planejada bigserial primary key,
  id_planejamento_rotina bigint not null references public.planejamentos_rotina(id_planejamento_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_restaurante bigint references public.restaurantes(id_restaurante) on delete set null,
  id_produto bigint references public.produtos(id_produto) on delete set null,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  data_refeicao date not null,
  dia_semana text not null,
  horario_sugerido time not null,
  preco_estimado numeric(10, 2),
  distancia_km numeric(8, 2),
  tempo_estimado_minutos integer,
  motivo_recomendacao text,
  pontuacao numeric(8, 2) not null default 0,
  status text not null default 'SUGERIDA',
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint refeicoes_planejadas_status_check check (status in (
    'SUGERIDA',
    'APROVADA',
    'RECUSADA',
    'ALTERADA',
    'CONVERTIDA_RESERVA',
    'CONVERTIDA_PEDIDO',
    'CANCELADA'
  )),
  constraint refeicoes_planejadas_pontuacao_check check (pontuacao >= -100 and pontuacao <= 200)
);

create unique index if not exists refeicoes_planejadas_planejamento_data_uidx
  on public.refeicoes_planejadas (id_planejamento_rotina, data_refeicao);

create index if not exists refeicoes_planejadas_cliente_idx
  on public.refeicoes_planejadas (id_cliente, data_refeicao, status);

create table if not exists public.historico_rotina_cliente (
  id_historico_rotina bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_perfil_rotina bigint references public.perfis_rotina_cliente(id_perfil_rotina) on delete set null,
  id_planejamento_rotina bigint references public.planejamentos_rotina(id_planejamento_rotina) on delete set null,
  id_refeicao_planejada bigint references public.refeicoes_planejadas(id_refeicao_planejada) on delete set null,
  acao text not null,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  constraint historico_rotina_acao_check check (char_length(trim(acao)) between 3 and 80)
);

create index if not exists historico_rotina_cliente_idx
  on public.historico_rotina_cliente (id_cliente, criado_em desc);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_perfis_rotina_cliente on public.perfis_rotina_cliente;
create trigger set_updated_at_perfis_rotina_cliente
before update on public.perfis_rotina_cliente
for each row execute function public.set_atualizado_em();

drop trigger if exists set_updated_at_planejamentos_rotina on public.planejamentos_rotina;
create trigger set_updated_at_planejamentos_rotina
before update on public.planejamentos_rotina
for each row execute function public.set_atualizado_em();

drop trigger if exists set_updated_at_refeicoes_planejadas on public.refeicoes_planejadas;
create trigger set_updated_at_refeicoes_planejadas
before update on public.refeicoes_planejadas
for each row execute function public.set_atualizado_em();

alter table public.perfis_rotina_cliente enable row level security;
alter table public.preferencias_rotina_cliente enable row level security;
alter table public.restricoes_rotina_cliente enable row level security;
alter table public.planejamentos_rotina enable row level security;
alter table public.refeicoes_planejadas enable row level security;
alter table public.historico_rotina_cliente enable row level security;

revoke all on table public.perfis_rotina_cliente from anon, authenticated;
revoke all on table public.preferencias_rotina_cliente from anon, authenticated;
revoke all on table public.restricoes_rotina_cliente from anon, authenticated;
revoke all on table public.planejamentos_rotina from anon, authenticated;
revoke all on table public.refeicoes_planejadas from anon, authenticated;
revoke all on table public.historico_rotina_cliente from anon, authenticated;

grant select, insert, update on table public.perfis_rotina_cliente to authenticated;
grant select, insert, update, delete on table public.preferencias_rotina_cliente to authenticated;
grant select, insert, update, delete on table public.restricoes_rotina_cliente to authenticated;
grant select, insert, update on table public.planejamentos_rotina to authenticated;
grant select, insert, update on table public.refeicoes_planejadas to authenticated;
grant select, insert on table public.historico_rotina_cliente to authenticated;

grant usage, select on sequence public.perfis_rotina_cliente_id_perfil_rotina_seq to authenticated;
grant usage, select on sequence public.preferencias_rotina_cliente_id_preferencia_rotina_seq to authenticated;
grant usage, select on sequence public.restricoes_rotina_cliente_id_restricao_rotina_seq to authenticated;
grant usage, select on sequence public.planejamentos_rotina_id_planejamento_rotina_seq to authenticated;
grant usage, select on sequence public.refeicoes_planejadas_id_refeicao_planejada_seq to authenticated;
grant usage, select on sequence public.historico_rotina_cliente_id_historico_rotina_seq to authenticated;
grant usage, select on sequence public.perfis_rotina_cliente_id_perfil_rotina_seq,
  public.preferencias_rotina_cliente_id_preferencia_rotina_seq,
  public.restricoes_rotina_cliente_id_restricao_rotina_seq,
  public.planejamentos_rotina_id_planejamento_rotina_seq,
  public.refeicoes_planejadas_id_refeicao_planejada_seq,
  public.historico_rotina_cliente_id_historico_rotina_seq to service_role;

drop policy if exists "Cliente gerencia perfil de rotina" on public.perfis_rotina_cliente;
create policy "Cliente gerencia perfil de rotina"
on public.perfis_rotina_cliente
for all to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
with check (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

-- Escritas passam pela API; impedir alteracao de vinculos e historico pela Data API.
revoke insert, update, delete on public.perfis_rotina_cliente, public.preferencias_rotina_cliente,
  public.restricoes_rotina_cliente, public.planejamentos_rotina, public.refeicoes_planejadas,
  public.historico_rotina_cliente from authenticated;
grant all on public.perfis_rotina_cliente, public.preferencias_rotina_cliente,
  public.restricoes_rotina_cliente, public.planejamentos_rotina, public.refeicoes_planejadas,
  public.historico_rotina_cliente to service_role;

create schema if not exists appono_private;
revoke all on schema appono_private from public, anon;
grant usage on schema appono_private to authenticated;

create or replace function appono_private.converter_refeicao_rotina(refeicao_id bigint, com_pedido boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  refeicao public.refeicoes_planejadas;
  reserva public.reservas;
  resultado jsonb;
  cliente_id bigint;
begin
  select c.id_cliente into cliente_id from public.clientes c where c.id_auth = (select auth.uid());
  if cliente_id is null then raise exception 'Cliente nao autenticado'; end if;
  select * into refeicao from public.refeicoes_planejadas r
    where r.id_refeicao_planejada = refeicao_id and r.id_cliente = cliente_id for update;
  if not found then raise exception 'Refeicao nao encontrada'; end if;
  if refeicao.id_reserva is not null then
    raise exception 'Esta refeicao ja foi convertida';
  end if;
  if refeicao.status not in ('APROVADA', 'SUGERIDA', 'ALTERADA') or refeicao.id_restaurante is null then
    raise exception 'Refeicao indisponivel para conversao';
  end if;
  if refeicao.horario_sugerido > '21:59'::time then raise exception 'Horario invalido'; end if;
  if com_pedido then
    if refeicao.id_produto is null then raise exception 'Escolha um prato'; end if;
    resultado := public.criar_reserva_com_pedido_antecipado(
      refeicao.id_restaurante, refeicao.data_refeicao, refeicao.horario_sugerido,
      (refeicao.horario_sugerido + interval '2 hours')::time, 1,
      'Reserva Appono Rotina',
      jsonb_build_array(jsonb_build_object('id_produto', refeicao.id_produto, 'quantidade', 1)),
      'Pedido Appono Rotina'
    );
  else
    reserva := public.criar_reserva_com_mesa_disponivel(
      refeicao.id_restaurante, refeicao.data_refeicao, refeicao.horario_sugerido,
      (refeicao.horario_sugerido + interval '2 hours')::time, 1, 'Reserva Appono Rotina'
    );
    update public.reservas set status_reserva = 'CONFIRMADA'
      where id_reserva = reserva.id_reserva and id_cliente = cliente_id returning * into reserva;
    resultado := jsonb_build_object('reserva', to_jsonb(reserva));
  end if;
  update public.refeicoes_planejadas set
    status = case when com_pedido then 'CONVERTIDA_PEDIDO' else 'CONVERTIDA_RESERVA' end,
    id_reserva = (resultado->'reserva'->>'id_reserva')::bigint,
    id_pedido = (resultado->'pedido'->>'id_pedido')::bigint
    where id_refeicao_planejada = refeicao_id returning * into refeicao;
  insert into public.historico_rotina_cliente (id_cliente, id_planejamento_rotina, id_refeicao_planejada, acao, dados)
    values (cliente_id, refeicao.id_planejamento_rotina, refeicao_id, refeicao.status,
      jsonb_build_object('id_reserva', refeicao.id_reserva, 'id_pedido', refeicao.id_pedido));
  return resultado || jsonb_build_object('refeicao', to_jsonb(refeicao));
end;
$$;
revoke all on function appono_private.converter_refeicao_rotina(bigint, boolean) from public, anon;
grant execute on function appono_private.converter_refeicao_rotina(bigint, boolean) to authenticated;

create or replace function public.converter_refeicao_rotina(refeicao_id bigint, com_pedido boolean default false)
returns jsonb language sql security invoker set search_path = ''
as $$ select appono_private.converter_refeicao_rotina(refeicao_id, com_pedido); $$;
revoke all on function public.converter_refeicao_rotina(bigint, boolean) from public, anon;
grant execute on function public.converter_refeicao_rotina(bigint, boolean) to authenticated;

drop policy if exists "Cliente gerencia preferencias de rotina" on public.preferencias_rotina_cliente;
create policy "Cliente gerencia preferencias de rotina"
on public.preferencias_rotina_cliente
for all to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
with check (
  id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
  and id_perfil_rotina in (
    select id_perfil_rotina from public.perfis_rotina_cliente perfil
    where perfil.id_cliente = preferencias_rotina_cliente.id_cliente
  )
);

drop policy if exists "Cliente gerencia restricoes de rotina" on public.restricoes_rotina_cliente;
create policy "Cliente gerencia restricoes de rotina"
on public.restricoes_rotina_cliente
for all to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
with check (
  id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
  and id_perfil_rotina in (
    select id_perfil_rotina from public.perfis_rotina_cliente perfil
    where perfil.id_cliente = restricoes_rotina_cliente.id_cliente
  )
);

drop policy if exists "Cliente le e atualiza planejamentos de rotina" on public.planejamentos_rotina;
create policy "Cliente le e atualiza planejamentos de rotina"
on public.planejamentos_rotina
for all to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
with check (
  id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
  and id_perfil_rotina in (
    select id_perfil_rotina from public.perfis_rotina_cliente perfil
    where perfil.id_cliente = planejamentos_rotina.id_cliente
  )
);

drop policy if exists "Cliente le e atualiza refeicoes planejadas" on public.refeicoes_planejadas;
create policy "Cliente le e atualiza refeicoes planejadas"
on public.refeicoes_planejadas
for all to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
with check (
  id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
  and id_planejamento_rotina in (
    select id_planejamento_rotina from public.planejamentos_rotina planejamento
    where planejamento.id_cliente = refeicoes_planejadas.id_cliente
  )
);

drop policy if exists "Cliente le historico de rotina" on public.historico_rotina_cliente;
create policy "Cliente le historico de rotina"
on public.historico_rotina_cliente
for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

drop policy if exists "Cliente registra historico de rotina" on public.historico_rotina_cliente;
create policy "Cliente registra historico de rotina"
on public.historico_rotina_cliente
for insert to authenticated
with check (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));
