begin;

create or replace function public.atualizar_estimativa_preparo_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pedido public.pedidos;
  tempo_total integer;
  quantidade integer;
  fila integer;
  minimo integer;
  maximo integer;
begin
  select * into pedido from public.pedidos where id_pedido = new.id_pedido;
  if pedido.id_pedido is null then return new; end if;

  select coalesce(sum(i.quantidade * greatest(coalesce(p.tempo_preparo_minutos, 20), 1)), 0)::integer,
         coalesce(sum(i.quantidade), 0)::integer
    into tempo_total, quantidade
    from public.itens_pedido i
    join public.produtos p using (id_produto)
   where i.id_pedido = new.id_pedido;

  select count(*) into fila
    from public.pedidos p
   where p.id_restaurante = pedido.id_restaurante
     and p.status_pedido in ('PENDENTE','CONFIRMADO','EM_PREPARO','PRONTO')
     and p.id_pedido <> pedido.id_pedido;

  tempo_total := greatest(10, tempo_total + greatest(0, quantidade - 1) * 2 + least(fila, 8) * 3);
  minimo := greatest(10, round(tempo_total * 0.85)::integer);
  maximo := greatest(minimo, round(tempo_total * 1.20)::integer);

  update public.pedidos
     set tempo_estimado_minimo_minutos = minimo,
         tempo_estimado_maximo_minutos = maximo,
         tempo_estimado_central_minutos = round((minimo + maximo) / 2.0)::integer,
         tempo_estimado_origem = 'CARDAPIO_VOLUME_FILA'
   where id_pedido = pedido.id_pedido;
  return new;
end;
$$;

drop trigger if exists pedidos_atualizar_estimativa_preparo on public.itens_pedido;
create trigger pedidos_atualizar_estimativa_preparo
after insert or update of quantidade, id_produto on public.itens_pedido
for each row execute function public.atualizar_estimativa_preparo_pedido();

notify pgrst, 'reload schema';
commit;
