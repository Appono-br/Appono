create table if not exists public.notificacoes (
  id_notificacao bigserial primary key,
  id_auth_destinatario uuid not null references auth.users(id) on delete cascade,
  tipo_destinatario text not null check (tipo_destinatario in ('cliente', 'restaurante', 'admin')),
  titulo text not null,
  mensagem text not null,
  tipo_evento text not null default 'INFORMATIVO',
  link_destino text,
  lida boolean not null default false,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamp without time zone not null default now(),
  lida_em timestamp without time zone
);

create index if not exists notificacoes_destinatario_criado_idx
  on public.notificacoes (id_auth_destinatario, criado_em desc);

create index if not exists notificacoes_destinatario_lida_idx
  on public.notificacoes (id_auth_destinatario, lida);

alter table public.notificacoes enable row level security;

revoke all on table public.notificacoes from anon;
revoke all on table public.notificacoes from authenticated;

grant select on table public.notificacoes to authenticated;
grant update (lida, lida_em) on table public.notificacoes to authenticated;

drop policy if exists "Usuarios leem suas notificacoes" on public.notificacoes;
create policy "Usuarios leem suas notificacoes"
  on public.notificacoes
  for select
  to authenticated
  using (id_auth_destinatario = (select auth.uid()));

drop policy if exists "Usuarios marcam suas notificacoes como lidas" on public.notificacoes;
create policy "Usuarios marcam suas notificacoes como lidas"
  on public.notificacoes
  for update
  to authenticated
  using (id_auth_destinatario = (select auth.uid()))
  with check (id_auth_destinatario = (select auth.uid()));
