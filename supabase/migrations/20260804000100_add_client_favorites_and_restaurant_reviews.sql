create table if not exists public.restaurantes_favoritos (
  id_favorito bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  created_at timestamp without time zone not null default current_timestamp,
  unique (id_cliente, id_restaurante)
);

create table if not exists public.avaliacoes_restaurante (
  id_avaliacao bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  nota integer not null check (nota between 1 and 5),
  comentario text,
  created_at timestamp without time zone not null default current_timestamp,
  updated_at timestamp without time zone not null default current_timestamp,
  unique (id_cliente, id_restaurante)
);

create index if not exists restaurantes_favoritos_cliente_idx
  on public.restaurantes_favoritos (id_cliente, id_restaurante);

create index if not exists restaurantes_favoritos_restaurante_idx
  on public.restaurantes_favoritos (id_restaurante);

create index if not exists avaliacoes_restaurante_restaurante_idx
  on public.avaliacoes_restaurante (id_restaurante, nota);

create index if not exists avaliacoes_restaurante_cliente_idx
  on public.avaliacoes_restaurante (id_cliente, id_restaurante);

drop trigger if exists set_updated_at on public.avaliacoes_restaurante;
create trigger set_updated_at
before update on public.avaliacoes_restaurante
for each row execute function public.set_updated_at();

alter table public.restaurantes_favoritos enable row level security;
alter table public.avaliacoes_restaurante enable row level security;

grant select, insert, delete on table public.restaurantes_favoritos to authenticated;
grant select, insert, update on table public.avaliacoes_restaurante to authenticated;
grant select on table public.avaliacoes_restaurante to anon;
grant usage, select on sequence public.restaurantes_favoritos_id_favorito_seq to authenticated;
grant usage, select on sequence public.avaliacoes_restaurante_id_avaliacao_seq to authenticated;

create policy "Cliente gerencia seus restaurantes favoritos"
on public.restaurantes_favoritos for all to authenticated
using (id_cliente in (
  select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())
))
with check (id_cliente in (
  select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())
));

create policy "Leitura publica de avaliacoes"
on public.avaliacoes_restaurante for select to anon, authenticated
using (true);

create policy "Cliente gerencia suas avaliacoes"
on public.avaliacoes_restaurante for all to authenticated
using (id_cliente in (
  select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())
))
with check (id_cliente in (
  select c.id_cliente from public.clientes c where c.id_auth = (select auth.uid())
));
