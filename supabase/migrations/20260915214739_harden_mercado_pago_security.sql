begin;

alter table public.mercado_pago_conexoes_restaurante
  add column if not exists access_token_cifrado text,
  add column if not exists refresh_token_cifrado text,
  add column if not exists token_cifrado_em timestamptz;

alter table public.mercado_pago_conexoes_restaurante enable row level security;
revoke all on table public.mercado_pago_conexoes_restaurante from public, anon, authenticated;
grant all on table public.mercado_pago_conexoes_restaurante to service_role;

comment on column public.mercado_pago_conexoes_restaurante.access_token_cifrado is
  'AES-256-GCM v1. Tokens legados em texto puro nao sao utilizados pelo backend e devem ser reconectados.';
comment on column public.mercado_pago_conexoes_restaurante.refresh_token_cifrado is
  'AES-256-GCM v1. Tokens legados em texto puro nao sao utilizados pelo backend e devem ser reconectados.';

commit;
