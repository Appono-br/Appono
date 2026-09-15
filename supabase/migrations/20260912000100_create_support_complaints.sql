create table if not exists public.chamados_suporte (
  id_chamado bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete restrict,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete restrict,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  id_reembolso bigint references public.solicitacoes_reembolso(id_reembolso) on delete set null,
  motivo text not null,
  descricao text not null,
  status text not null default 'ABERTO',
  prioridade text not null default 'MEDIA',
  procedencia text not null default 'NAO_ANALISADA',
  solicita_reembolso boolean not null default false,
  impacto_reputacao numeric(5, 2) not null default 0,
  evidencias jsonb not null default '[]'::jsonb,
  resolucao text,
  id_auth_responsavel uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  resolvido_em timestamptz,
  cancelado_em timestamptz,
  constraint chamados_suporte_motivo_check check (motivo in (
    'PEDIDO_NAO_PRONTO',
    'PEDIDO_INCORRETO',
    'RESERVA_NAO_RECONHECIDA',
    'MESA_INDISPONIVEL',
    'RESTAURANTE_INDISPONIVEL',
    'PAGAMENTO',
    'REEMBOLSO',
    'ATENDIMENTO',
    'OUTRO'
  )),
  constraint chamados_suporte_status_check check (status in (
    'ABERTO',
    'AGUARDANDO_RESTAURANTE',
    'AGUARDANDO_CLIENTE',
    'EM_ANALISE_ADMIN',
    'RESOLVIDO',
    'RECUSADO',
    'CANCELADO'
  )),
  constraint chamados_suporte_prioridade_check check (prioridade in ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  constraint chamados_suporte_procedencia_check check (procedencia in ('NAO_ANALISADA', 'PROCEDENTE', 'IMPROCEDENTE')),
  constraint chamados_suporte_descricao_check check (char_length(trim(descricao)) between 10 and 1200),
  constraint chamados_suporte_resolucao_check check (resolucao is null or char_length(trim(resolucao)) between 3 and 1200),
  constraint chamados_suporte_impacto_check check (impacto_reputacao >= 0 and impacto_reputacao <= 10),
  constraint chamados_suporte_contexto_check check (
    id_restaurante is not null
    and (id_pedido is not null or id_reserva is not null or id_restaurante is not null)
  )
);

create table if not exists public.mensagens_suporte (
  id_mensagem bigserial primary key,
  id_chamado bigint not null references public.chamados_suporte(id_chamado) on delete cascade,
  id_auth_remetente uuid references auth.users(id) on delete set null,
  tipo_remetente text not null,
  conteudo text not null,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  constraint mensagens_suporte_tipo_remetente_check check (tipo_remetente in ('cliente', 'restaurante', 'admin', 'sistema')),
  constraint mensagens_suporte_conteudo_check check (char_length(trim(conteudo)) between 1 and 1200)
);

create unique index if not exists chamados_suporte_pedido_ativo_uidx
  on public.chamados_suporte (id_cliente, id_pedido, motivo)
  where id_pedido is not null and status not in ('RESOLVIDO', 'RECUSADO', 'CANCELADO');

create unique index if not exists chamados_suporte_reserva_ativo_uidx
  on public.chamados_suporte (id_cliente, id_reserva, motivo)
  where id_reserva is not null and id_pedido is null and status not in ('RESOLVIDO', 'RECUSADO', 'CANCELADO');

create unique index if not exists chamados_suporte_restaurante_ativo_uidx
  on public.chamados_suporte (id_cliente, id_restaurante, motivo)
  where id_reserva is null and id_pedido is null and status not in ('RESOLVIDO', 'RECUSADO', 'CANCELADO');

create index if not exists chamados_suporte_cliente_idx
  on public.chamados_suporte (id_cliente, atualizado_em desc);

create index if not exists chamados_suporte_restaurante_idx
  on public.chamados_suporte (id_restaurante, atualizado_em desc);

create index if not exists chamados_suporte_status_idx
  on public.chamados_suporte (status, prioridade, atualizado_em desc);

create index if not exists mensagens_suporte_chamado_idx
  on public.mensagens_suporte (id_chamado, criado_em asc);

alter table public.chamados_suporte enable row level security;
alter table public.mensagens_suporte enable row level security;

revoke all on table public.chamados_suporte from anon, authenticated;
revoke all on table public.mensagens_suporte from anon, authenticated;

grant select on table public.chamados_suporte to authenticated;
grant select on table public.mensagens_suporte to authenticated;

drop policy if exists "Participantes leem chamados de suporte" on public.chamados_suporte;
create policy "Participantes leem chamados de suporte"
  on public.chamados_suporte
  for select
  to authenticated
  using (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    or id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
  );

drop policy if exists "Cliente cria chamado proprio" on public.chamados_suporte;
create policy "Cliente cria chamado proprio"
  on public.chamados_suporte
  for insert
  to authenticated
  with check (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    and (
      id_pedido is null
      or exists (
        select 1
        from public.pedidos pedido
        where pedido.id_pedido = chamados_suporte.id_pedido
          and pedido.id_cliente = chamados_suporte.id_cliente
          and pedido.id_restaurante = chamados_suporte.id_restaurante
      )
    )
    and (
      id_reserva is null
      or exists (
        select 1
        from public.reservas reserva
        where reserva.id_reserva = chamados_suporte.id_reserva
          and reserva.id_cliente = chamados_suporte.id_cliente
          and reserva.id_restaurante = chamados_suporte.id_restaurante
      )
    )
  );

drop policy if exists "Participantes atualizam chamados de suporte" on public.chamados_suporte;
create policy "Participantes atualizam chamados de suporte"
  on public.chamados_suporte
  for update
  to authenticated
  using (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    or id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
  )
  with check (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    or id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
  );

drop policy if exists "Participantes leem mensagens de suporte" on public.mensagens_suporte;
create policy "Participantes leem mensagens de suporte"
  on public.mensagens_suporte
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chamados_suporte chamado
      where chamado.id_chamado = mensagens_suporte.id_chamado
        and (
          chamado.id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
          or chamado.id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
        )
    )
  );

drop policy if exists "Participantes enviam mensagens de suporte" on public.mensagens_suporte;
create policy "Participantes enviam mensagens de suporte"
  on public.mensagens_suporte
  for insert
  to authenticated
  with check (
    id_auth_remetente = (select auth.uid())
    and exists (
      select 1
      from public.chamados_suporte chamado
      where chamado.id_chamado = mensagens_suporte.id_chamado
        and (
          (tipo_remetente = 'cliente'
            and chamado.id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
          or
          (tipo_remetente = 'restaurante'
            and chamado.id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid())))
        )
    )
  );
