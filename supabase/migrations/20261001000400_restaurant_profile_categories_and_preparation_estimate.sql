begin;

alter table public.restaurantes
  add column if not exists categorias_culinarias text[] not null default '{}'::text[];

create index if not exists restaurantes_categorias_culinarias_gin
  on public.restaurantes using gin (categorias_culinarias);

alter table public.pedidos
  add column if not exists tempo_estimado_minimo_minutos integer,
  add column if not exists tempo_estimado_maximo_minutos integer,
  add column if not exists tempo_estimado_central_minutos integer,
  add column if not exists tempo_estimado_origem text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pedidos_tempo_estimado_faixa_check') then
    alter table public.pedidos add constraint pedidos_tempo_estimado_faixa_check check (tempo_estimado_minimo_minutos is null or (tempo_estimado_minimo_minutos >= 0 and tempo_estimado_maximo_minutos >= tempo_estimado_minimo_minutos));
  end if;
end $$;

create or replace function public.atualizar_estimativa_preparo_pedido()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pedido public.pedidos; base integer; quantidade integer; fila integer; minimo integer; maximo integer;
begin
  select * into pedido from public.pedidos where id_pedido = new.id_pedido;
  if pedido.id_pedido is null then return new; end if;
  select coalesce(sum(i.quantidade), 0), coalesce(max(coalesce(p.tempo_preparo_minutos, 20)), 20)
    into quantidade, base from public.itens_pedido i join public.produtos p using (id_produto) where i.id_pedido = new.id_pedido;
  select count(*) into fila from public.pedidos p where p.id_restaurante = pedido.id_restaurante and p.status_pedido in ('PENDENTE','CONFIRMADO','EM_PREPARO','PRONTO') and p.id_pedido <> pedido.id_pedido;
  base := greatest(10, base + greatest(0, quantidade - 1) * 4 + least(fila, 8) * 3);
  minimo := greatest(10, round(base * 0.85)::integer); maximo := greatest(minimo, round(base * 1.20)::integer);
  update public.pedidos set tempo_estimado_minimo_minutos = minimo, tempo_estimado_maximo_minutos = maximo, tempo_estimado_central_minutos = round((minimo + maximo) / 2.0)::integer, tempo_estimado_origem = 'ADAPTATIVA_VOLUME_FILA' where id_pedido = pedido.id_pedido;
  return new;
end $$;
drop trigger if exists pedidos_atualizar_estimativa_preparo on public.itens_pedido;
create trigger pedidos_atualizar_estimativa_preparo after insert or update of quantidade on public.itens_pedido for each row execute function public.atualizar_estimativa_preparo_pedido();
notify pgrst, 'reload schema';
commit;
