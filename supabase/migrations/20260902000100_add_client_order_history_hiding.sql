alter table public.pedidos
  add column if not exists ocultado_cliente boolean not null default false,
  add column if not exists ocultado_cliente_em timestamp without time zone;

comment on column public.pedidos.ocultado_cliente is
  'Indica se o pedido foi removido do historico do cliente, sem apagar registros financeiros ou operacionais.';

comment on column public.pedidos.ocultado_cliente_em is
  'Data e hora em que o pedido foi removido do historico do cliente.';

create index if not exists idx_pedidos_cliente_visibilidade
  on public.pedidos (id_cliente, ocultado_cliente, status_pedido);
