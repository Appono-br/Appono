-- Harden the Appono core schema without changing existing API column shapes.

create extension if not exists btree_gist with schema extensions;

-- Foreign-key and common access-path indexes.
create index if not exists idx_adicionais_id_restaurante on public.adicionais (id_restaurante);
create index if not exists idx_cardapios_id_restaurante on public.cardapios (id_restaurante);
create index if not exists idx_categorias_id_cardapio on public.categorias (id_cardapio);
create index if not exists idx_dados_bancarios_id_restaurante on public.dados_bancarios_restaurante (id_restaurante);
create index if not exists idx_item_adicional_id_adicional on public.item_adicional (id_adicional);
create index if not exists idx_itens_pedido_id_pedido on public.itens_pedido (id_pedido);
create index if not exists idx_itens_pedido_id_produto on public.itens_pedido (id_produto);
create index if not exists idx_pagamentos_id_forma_pagamento on public.pagamentos (id_forma_pagamento);
create index if not exists idx_pedidos_id_reserva on public.pedidos (id_reserva);
create index if not exists idx_produto_adicional_id_adicional on public.produto_adicional (id_adicional);
create index if not exists idx_produto_ingrediente_id_ingrediente on public.produto_ingrediente (id_ingrediente);
create index if not exists idx_produtos_id_categoria on public.produtos (id_categoria);
create index if not exists idx_reservas_id_mesa on public.reservas (id_mesa);
create index if not exists idx_reservas_agenda on public.reservas (id_restaurante, data_reserva, status_reserva);
create index if not exists idx_pedidos_operacao on public.pedidos (id_restaurante, data_pedido, status_pedido);

-- Unique identities used by composite foreign keys.
alter table public.mesas
  add constraint mesas_id_restaurante_key unique (id_mesa, id_restaurante);

alter table public.reservas
  add constraint reservas_contexto_key unique (id_reserva, id_cliente, id_restaurante);

-- A reservation's table must belong to the same restaurant.
alter table public.reservas
  drop constraint fk_reserva_mesa,
  add constraint fk_reserva_mesa_restaurante
    foreign key (id_mesa, id_restaurante)
    references public.mesas (id_mesa, id_restaurante)
    on delete restrict;

-- An order linked to a reservation must keep the same client and restaurant.
alter table public.pedidos
  drop constraint fk_pedido_reserva,
  add constraint fk_pedido_reserva_contexto
    foreign key (id_reserva, id_cliente, id_restaurante)
    references public.reservas (id_reserva, id_cliente, id_restaurante)
    on delete set null (id_reserva);

-- Prevent overlapping active reservations for the same table.
alter table public.reservas
  add constraint reservas_sem_sobreposicao
  exclude using gist (
    id_mesa with =,
    tsrange(data_reserva + horario_inicio, data_reserva + horario_fim, '[)') with &&
  )
  where (status_reserva in ('PENDENTE', 'CONFIRMADA'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'restaurantes', 'dados_bancarios_restaurante', 'clientes', 'cardapios',
    'categorias', 'produtos', 'ingredientes', 'adicionais', 'mesas',
    'reservas', 'formas_pagamento', 'pedidos', 'itens_pedido', 'pagamentos'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.validate_order_item_restaurant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.pedidos pe
    join public.produtos pr on pr.id_produto = new.id_produto
    where pe.id_pedido = new.id_pedido
      and pe.id_restaurante = pr.id_restaurante
  ) then
    raise exception 'O produto deve pertencer ao mesmo restaurante do pedido';
  end if;
  return new;
end;
$$;

create trigger validate_order_item_restaurant
before insert or update of id_pedido, id_produto on public.itens_pedido
for each row execute function public.validate_order_item_restaurant();

create or replace function public.validate_product_additional_restaurant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.produtos p
    join public.adicionais a on a.id_adicional = new.id_adicional
    where p.id_produto = new.id_produto
      and p.id_restaurante = a.id_restaurante
  ) then
    raise exception 'O adicional deve pertencer ao mesmo restaurante do produto';
  end if;
  return new;
end;
$$;

create trigger validate_product_additional_restaurant
before insert or update of id_produto, id_adicional on public.produto_adicional
for each row execute function public.validate_product_additional_restaurant();

create or replace function public.validate_item_additional_restaurant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.itens_pedido i
    join public.pedidos pe on pe.id_pedido = i.id_pedido
    join public.adicionais a on a.id_adicional = new.id_adicional
    where i.id_item = new.id_item
      and pe.id_restaurante = a.id_restaurante
  ) then
    raise exception 'O adicional deve pertencer ao mesmo restaurante do pedido';
  end if;
  return new;
end;
$$;

create trigger validate_item_additional_restaurant
before insert or update of id_item, id_adicional on public.item_adicional
for each row execute function public.validate_item_additional_restaurant();

-- Restrict existing ownership policies to authenticated users and optimize auth.uid().
alter policy "Cliente pode ver o proprio perfil" on public.clientes
  to authenticated using (id_auth = (select auth.uid()));
alter policy "Cliente pode atualizar o proprio perfil" on public.clientes
  to authenticated using (id_auth = (select auth.uid())) with check (id_auth = (select auth.uid()));
alter policy "Cliente pode criar o proprio perfil" on public.clientes
  to authenticated with check (id_auth = (select auth.uid()));

alter policy "Restaurante pode ver o proprio cadastro" on public.restaurantes
  to authenticated using (id_auth = (select auth.uid()));
alter policy "Restaurante pode atualizar o proprio cadastro" on public.restaurantes
  to authenticated using (id_auth = (select auth.uid())) with check (id_auth = (select auth.uid()));
alter policy "Restaurante pode criar o proprio cadastro" on public.restaurantes
  to authenticated with check (id_auth = (select auth.uid()));

alter policy "Restaurante pode gerenciar seus cardapios" on public.cardapios
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode gerenciar categorias dos seus cardapios" on public.categorias
  to authenticated
  using (id_cardapio in (select c.id_cardapio from public.cardapios c join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())))
  with check (id_cardapio in (select c.id_cardapio from public.cardapios c join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode gerenciar seus produtos" on public.produtos
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode gerenciar seus adicionais" on public.adicionais
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode gerenciar suas mesas" on public.mesas
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));

alter policy "Cliente pode criar reserva propria" on public.reservas
  to authenticated with check (id_cliente in (select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())));
alter policy "Cliente pode ver suas reservas" on public.reservas
  to authenticated using (id_cliente in (select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())));
alter policy "Restaurante pode ver reservas recebidas" on public.reservas
  to authenticated using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode atualizar reservas recebidas" on public.reservas
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));

alter policy "Cliente pode criar pedido proprio" on public.pedidos
  to authenticated with check (id_cliente in (select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())));
alter policy "Cliente pode ver seus pedidos" on public.pedidos
  to authenticated using (id_cliente in (select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())));
alter policy "Restaurante pode ver pedidos recebidos" on public.pedidos
  to authenticated using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));
alter policy "Restaurante pode atualizar pedidos recebidos" on public.pedidos
  to authenticated
  using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
  with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));

-- Child-table and sensitive-data policies.
create policy "Restaurante gerencia seus dados bancarios"
on public.dados_bancarios_restaurante for all to authenticated
using (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())))
with check (id_restaurante in (select r.id_restaurante from public.restaurantes r where r.id_auth = (select auth.uid())));

create policy "Leitura publica de ingredientes"
on public.ingredientes for select to anon, authenticated using (true);

create policy "Leitura publica de produto ingrediente"
on public.produto_ingrediente for select to anon, authenticated using (true);
create policy "Restaurante gerencia produto ingrediente"
on public.produto_ingrediente for all to authenticated
using (id_produto in (select p.id_produto from public.produtos p join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())))
with check (id_produto in (select p.id_produto from public.produtos p join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())));

create policy "Leitura publica de produto adicional"
on public.produto_adicional for select to anon, authenticated using (true);
create policy "Restaurante gerencia produto adicional"
on public.produto_adicional for all to authenticated
using (id_produto in (select p.id_produto from public.produtos p join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())))
with check (id_produto in (select p.id_produto from public.produtos p join public.restaurantes r using (id_restaurante) where r.id_auth = (select auth.uid())));

create policy "Cliente gerencia itens de pedido pendente"
on public.itens_pedido for all to authenticated
using (id_pedido in (
  select pe.id_pedido from public.pedidos pe join public.clientes c using (id_cliente)
  where c.id_auth = (select auth.uid()) and pe.status_pedido = 'PENDENTE'
))
with check (id_pedido in (
  select pe.id_pedido from public.pedidos pe join public.clientes c using (id_cliente)
  where c.id_auth = (select auth.uid()) and pe.status_pedido = 'PENDENTE'
));
create policy "Restaurante visualiza itens recebidos"
on public.itens_pedido for select to authenticated
using (id_pedido in (
  select pe.id_pedido from public.pedidos pe join public.restaurantes r using (id_restaurante)
  where r.id_auth = (select auth.uid())
));

create policy "Cliente gerencia adicionais de item pendente"
on public.item_adicional for all to authenticated
using (id_item in (
  select i.id_item from public.itens_pedido i join public.pedidos pe using (id_pedido) join public.clientes c using (id_cliente)
  where c.id_auth = (select auth.uid()) and pe.status_pedido = 'PENDENTE'
))
with check (id_item in (
  select i.id_item from public.itens_pedido i join public.pedidos pe using (id_pedido) join public.clientes c using (id_cliente)
  where c.id_auth = (select auth.uid()) and pe.status_pedido = 'PENDENTE'
));
create policy "Restaurante visualiza adicionais recebidos"
on public.item_adicional for select to authenticated
using (id_item in (
  select i.id_item from public.itens_pedido i join public.pedidos pe using (id_pedido) join public.restaurantes r using (id_restaurante)
  where r.id_auth = (select auth.uid())
));

create policy "Cliente visualiza pagamentos proprios"
on public.pagamentos for select to authenticated
using (id_pedido in (
  select pe.id_pedido from public.pedidos pe join public.clientes c using (id_cliente)
  where c.id_auth = (select auth.uid())
));
create policy "Restaurante visualiza pagamentos recebidos"
on public.pagamentos for select to authenticated
using (id_pedido in (
  select pe.id_pedido from public.pedidos pe join public.restaurantes r using (id_restaurante)
  where r.id_auth = (select auth.uid())
));
