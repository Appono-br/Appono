alter table public.notificacoes
  add column if not exists dedupe_key text;

create unique index if not exists notificacoes_destinatario_dedupe_idx
  on public.notificacoes (id_auth_destinatario, dedupe_key)
  where dedupe_key is not null;

create index if not exists notificacoes_tipo_evento_idx
  on public.notificacoes (tipo_evento);
