-- Cover the composite foreign keys introduced by the core hardening migration.

create index if not exists idx_reservas_mesa_restaurante
  on public.reservas (id_mesa, id_restaurante);

create index if not exists idx_pedidos_reserva_contexto
  on public.pedidos (id_reserva, id_cliente, id_restaurante);
