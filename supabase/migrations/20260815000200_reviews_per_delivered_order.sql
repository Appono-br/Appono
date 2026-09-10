alter table public.avaliacoes_restaurante
  drop constraint if exists avaliacoes_restaurante_id_cliente_id_restaurante_key;

create unique index if not exists avaliacoes_restaurante_pedido_uidx
  on public.avaliacoes_restaurante (id_pedido)
  where id_pedido is not null;

create index if not exists avaliacoes_restaurante_cliente_idx
  on public.avaliacoes_restaurante (id_cliente, created_at desc);

comment on table public.avaliacoes_restaurante is
  'Avaliacoes publicadas por clientes apos a entrega de um pedido. Registros antigos ligados apenas a reserva sao preservados.';
