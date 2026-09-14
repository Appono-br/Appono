-- Isolated PostgreSQL fixture: core tables reconstructed for the real SQL
-- reservation functions. This is NOT a dump of the shared Supabase database.
create extension btree_gist;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
create table public.clientes(id_cliente bigserial primary key,id_auth uuid unique not null);
create table public.restaurantes(id_restaurante bigserial primary key,nome text,endereco text,logo_url text,
  ativo boolean default true,valor_minimo_reserva_por_pessoa numeric default 15,configuracao_operacao jsonb);
create table public.produtos(id_produto bigserial primary key,id_restaurante bigint references public.restaurantes,
  nome text,descricao text,imagem_url text,preco numeric,disponivel boolean default true,arquivado boolean default false);
create table public.mesas(id_mesa bigserial primary key,id_restaurante bigint references public.restaurantes,
  numero_mesa integer,capacidade integer);
create table public.reservas(id_reserva bigserial primary key,id_cliente bigint references public.clientes,
  id_restaurante bigint references public.restaurantes,id_mesa bigint references public.mesas,
  data_reserva date,horario_inicio time,horario_fim time,quantidade_pessoas integer,observacoes text,
  valor_minimo_por_pessoa numeric,valor_minimo_total numeric,status_reserva text default 'PENDENTE');
create table public.pedidos(id_pedido bigserial primary key,id_cliente bigint references public.clientes,
  id_restaurante bigint references public.restaurantes,id_reserva bigint references public.reservas,
  status_pedido text,valor_total numeric,observacoes text,horario_entrega_previsto timestamp,iniciar_preparo_em timestamp);
create table public.itens_pedido(id_item bigserial primary key,id_pedido bigint references public.pedidos,
  id_produto bigint references public.produtos,quantidade integer,preco_unitario numeric,observacoes text);
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
grant select on public.clientes to authenticated;
alter table public.clientes enable row level security;
create policy cliente_proprio on public.clientes for select to authenticated using (id_auth = auth.uid());
