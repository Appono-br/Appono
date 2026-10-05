begin;

create or replace function public.atualizar_estimativa_preparo_pedido()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  pedido public.pedidos;
  grupo record;
  maior numeric := 0;
  carga numeric;
  paralela numeric := 0;
  fila integer;
  minimo integer;
  maximo integer;
begin
  select * into pedido from public.pedidos where id_pedido = new.id_pedido;
  if pedido.id_pedido is null then return new; end if;
  for grupo in
    select i.id_produto, sum(i.quantidade)::numeric quantidade,
           greatest(coalesce(p.tempo_preparo_minutos, 20), 1)::numeric tempo
      from public.itens_pedido i join public.produtos p using (id_produto)
     where i.id_pedido = new.id_pedido
     group by i.id_produto, p.tempo_preparo_minutos
  loop
    carga := grupo.tempo * (1 + least(greatest(grupo.quantidade - 1, 0), 4) * 0.30);
    if carga > maior then maior := carga; end if;
  end loop;
  for grupo in
    select i.id_produto, sum(i.quantidade)::numeric quantidade,
           greatest(coalesce(p.tempo_preparo_minutos, 20), 1)::numeric tempo
      from public.itens_pedido i join public.produtos p using (id_produto)
     where i.id_pedido = new.id_pedido
     group by i.id_produto, p.tempo_preparo_minutos
  loop
    carga := grupo.tempo * (1 + least(greatest(grupo.quantidade - 1, 0), 4) * 0.30);
    if carga < maior then paralela := paralela + carga * 0.35; end if;
  end loop;
  select count(*) into fila from public.pedidos p
   where p.id_restaurante = pedido.id_restaurante
     and p.status_pedido in ('PENDENTE','CONFIRMADO','EM_PREPARO','PRONTO')
     and p.id_pedido <> pedido.id_pedido;
  maior := greatest(10, maior + paralela + least(fila, 8) * 3);
  minimo := greatest(10, round(maior * 0.85)::integer);
  maximo := greatest(minimo, round(maior * 1.20)::integer);
  update public.pedidos set tempo_estimado_minimo_minutos = minimo,
    tempo_estimado_maximo_minutos = maximo,
    tempo_estimado_central_minutos = round((minimo + maximo) / 2.0)::integer,
    tempo_estimado_origem = 'LOTE_PARALELO_FILA'
   where id_pedido = pedido.id_pedido;
  return new;
end $$;

notify pgrst, 'reload schema';
commit;
