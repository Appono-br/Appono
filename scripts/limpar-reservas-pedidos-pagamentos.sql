-- Use apenas em ambiente de teste/desenvolvimento.
-- Limpa o fluxo de reservas, pedidos e pagamentos sem apagar clientes,
-- restaurantes, mesas, cardapios ou produtos.

begin;

delete from public.item_adicional
where id_item in (
  select item.id_item
  from public.itens_pedido item
  join public.pedidos pedido on pedido.id_pedido = item.id_pedido
);

delete from public.itens_pedido
where id_pedido in (
  select pedido.id_pedido
  from public.pedidos pedido
);

delete from public.pagamentos
where id_pedido in (
  select pedido.id_pedido
  from public.pedidos pedido
)
or id_reserva in (
  select reserva.id_reserva
  from public.reservas reserva
);

delete from public.pedidos;

delete from public.reservas;

commit;
