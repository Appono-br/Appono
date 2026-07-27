create table if not exists public.eventos_financeiros (
  id_evento bigserial primary key,
  id_pagamento bigint references public.pagamentos(id_pagamento) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  tipo_evento text not null,
  descricao text,
  valor numeric(10, 2),
  criado_em timestamp without time zone not null default now()
);

create index if not exists eventos_financeiros_id_pagamento_idx
  on public.eventos_financeiros (id_pagamento);

create index if not exists eventos_financeiros_id_pedido_idx
  on public.eventos_financeiros (id_pedido);

alter table public.eventos_financeiros enable row level security;

revoke all on table public.eventos_financeiros from anon;
revoke all on table public.eventos_financeiros from authenticated;
