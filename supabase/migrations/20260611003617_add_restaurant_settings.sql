alter table public.restaurantes
  add column if not exists preferencias_notificacao jsonb not null default '{}'::jsonb,
  add column if not exists configuracao_operacao jsonb not null default '{}'::jsonb;
