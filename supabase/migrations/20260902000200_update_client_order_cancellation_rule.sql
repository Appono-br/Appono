create or replace function public.cancelar_pedido_proprio(pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  pedido_cancelado public.pedidos;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select cliente.id_cliente
  into cliente_id
  from public.clientes cliente
  where cliente.id_auth = auth.uid();

  if cliente_id is null then
    raise exception 'Apenas clientes podem cancelar pedidos';
  end if;

  update public.pedidos pedido
  set status_pedido = 'CANCELADO'
  where pedido.id_pedido = pedido_id
    and pedido.id_cliente = cliente_id
    and pedido.status_pedido in ('PENDENTE', 'CONFIRMADO')
  returning * into pedido_cancelado;

  if pedido_cancelado.id_pedido is null then
    raise exception 'Pedido nao encontrado ou nao pode mais ser cancelado. O cancelamento so e permitido antes do preparo iniciar';
  end if;

  return pedido_cancelado;
end;
$$;

revoke all on function public.cancelar_pedido_proprio(bigint) from public;
grant execute on function public.cancelar_pedido_proprio(bigint) to authenticated;
