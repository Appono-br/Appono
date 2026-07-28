alter table public.pedidos
  add column if not exists ocultado_cozinha boolean not null default false,
  add column if not exists ocultado_cozinha_em timestamp without time zone;

comment on column public.pedidos.ocultado_cozinha is
  'Indica se o pedido foi removido da fila operacional da cozinha pelo restaurante, sem apagar o historico.';

comment on column public.pedidos.ocultado_cozinha_em is
  'Data e hora em que o pedido foi removido da fila operacional da cozinha.';

create index if not exists idx_pedidos_cozinha_visibilidade
  on public.pedidos (id_restaurante, ocultado_cozinha, status_pedido);
