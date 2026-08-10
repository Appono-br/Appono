alter table public.notificacoes
  add column if not exists favoritada boolean not null default false,
  add column if not exists apagada boolean not null default false,
  add column if not exists apagada_em timestamp without time zone;

create index if not exists notificacoes_destinatario_favoritada_idx
  on public.notificacoes (id_auth_destinatario, favoritada)
  where apagada = false;

create index if not exists notificacoes_destinatario_apagada_idx
  on public.notificacoes (id_auth_destinatario, apagada);

grant update (lida, lida_em, favoritada, apagada, apagada_em) on table public.notificacoes to authenticated;
