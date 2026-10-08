alter table public.pedidos
  add column if not exists excluido_historico boolean not null default false,
  add column if not exists excluido_historico_em timestamp without time zone,
  add column if not exists excluido_historico_por uuid;

create index if not exists pedidos_restaurante_historico_visivel_idx
  on public.pedidos (id_restaurante, excluido_historico, data_pedido desc);

comment on column public.pedidos.excluido_historico is
  'Indica que o pedido foi removido da visualização do histórico pelo restaurante.';
