create table if not exists public.conversas_chat (
  id_conversa bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  assunto text,
  status text not null default 'ABERTA',
  ocultada_cliente boolean not null default false,
  ocultada_restaurante boolean not null default false,
  lida_cliente_em timestamptz,
  lida_restaurante_em timestamptz,
  ultima_mensagem_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint conversas_chat_status_check check (status in ('ABERTA', 'ENCERRADA')),
  constraint conversas_chat_assunto_check check (assunto is null or char_length(assunto) <= 160)
);

create table if not exists public.mensagens_chat (
  id_mensagem bigserial primary key,
  id_conversa bigint not null references public.conversas_chat(id_conversa) on delete cascade,
  id_auth_remetente uuid not null references auth.users(id) on delete cascade,
  tipo_remetente text not null,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  constraint mensagens_chat_tipo_remetente_check check (tipo_remetente in ('cliente', 'restaurante')),
  constraint mensagens_chat_conteudo_check check (char_length(trim(conteudo)) between 1 and 1200)
);

create unique index if not exists conversas_chat_pedido_unico_idx
  on public.conversas_chat (id_pedido)
  where id_pedido is not null;

create unique index if not exists conversas_chat_reserva_unica_idx
  on public.conversas_chat (id_reserva)
  where id_reserva is not null and id_pedido is null;

create index if not exists conversas_chat_cliente_idx
  on public.conversas_chat (id_cliente, atualizado_em desc);

create index if not exists conversas_chat_restaurante_idx
  on public.conversas_chat (id_restaurante, atualizado_em desc);

create index if not exists mensagens_chat_conversa_criado_idx
  on public.mensagens_chat (id_conversa, criado_em asc);

alter table public.conversas_chat enable row level security;
alter table public.mensagens_chat enable row level security;

revoke all on table public.conversas_chat from anon, authenticated;
revoke all on table public.mensagens_chat from anon, authenticated;

grant select, insert, update on table public.conversas_chat to authenticated;
grant select, insert on table public.mensagens_chat to authenticated;
grant usage, select on sequence public.conversas_chat_id_conversa_seq to authenticated;
grant usage, select on sequence public.mensagens_chat_id_mensagem_seq to authenticated;

drop policy if exists "Participantes leem conversas do chat" on public.conversas_chat;
create policy "Participantes leem conversas do chat"
  on public.conversas_chat
  for select
  to authenticated
  using (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    or id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
  );

drop policy if exists "Participantes criam conversas do chat" on public.conversas_chat;
create policy "Participantes criam conversas do chat"
  on public.conversas_chat
  for insert
  to authenticated
  with check (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    or (
      id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
      and (
        exists (
          select 1
          from public.reservas reserva
          where reserva.id_reserva = conversas_chat.id_reserva
            and reserva.id_cliente = conversas_chat.id_cliente
            and reserva.id_restaurante = conversas_chat.id_restaurante
        )
        or exists (
          select 1
          from public.pedidos pedido
          where pedido.id_pedido = conversas_chat.id_pedido
            and pedido.id_cliente = conversas_chat.id_cliente
            and pedido.id_restaurante = conversas_chat.id_restaurante
        )
      )
    )
  );

drop policy if exists "Participantes atualizam marcadores do chat" on public.conversas_chat;
create policy "Participantes atualizam marcadores do chat"
  on public.conversas_chat
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

drop policy if exists "Participantes leem mensagens do chat" on public.mensagens_chat;
create policy "Participantes leem mensagens do chat"
  on public.mensagens_chat
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversas_chat conversa
      where conversa.id_conversa = mensagens_chat.id_conversa
        and (
          conversa.id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
          or conversa.id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid()))
        )
    )
  );

drop policy if exists "Participantes enviam mensagens do chat" on public.mensagens_chat;
create policy "Participantes enviam mensagens do chat"
  on public.mensagens_chat
  for insert
  to authenticated
  with check (
    id_auth_remetente = (select auth.uid())
    and exists (
      select 1
      from public.conversas_chat conversa
      where conversa.id_conversa = mensagens_chat.id_conversa
        and (
          (tipo_remetente = 'cliente'
            and conversa.id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
          or
          (tipo_remetente = 'restaurante'
            and conversa.id_restaurante in (select id_restaurante from public.restaurantes where id_auth = (select auth.uid())))
        )
    )
  );
