begin;

create table public.preferencias_email_notificacao (
  id_preferencia_email bigserial primary key,
  id_auth uuid not null,
  categoria text not null,
  email_habilitado boolean not null default true,
  horario_silencio_inicio time,
  horario_silencio_fim time,
  atualizado_em timestamptz not null default now(),
  constraint preferencias_email_categoria_check check (categoria in (
    'ROTINA', 'AGENDA', 'RESERVA', 'PAGAMENTO', 'PRESENCA', 'SUPORTE', 'FEEDBACK'
  )),
  constraint preferencias_email_silencio_check check (
    (horario_silencio_inicio is null and horario_silencio_fim is null)
    or (horario_silencio_inicio is not null and horario_silencio_fim is not null)
  ),
  unique (id_auth, categoria)
);
create index preferencias_email_auth_idx on public.preferencias_email_notificacao (id_auth, categoria);

create table public.email_outbox (
  id_email_outbox bigserial primary key,
  id_auth_destinatario uuid not null,
  categoria text not null,
  template text not null,
  dados jsonb not null default '{}'::jsonb,
  chave_idempotencia text not null,
  status text not null default 'PENDENTE',
  tentativas integer not null default 0,
  proxima_tentativa_em timestamptz not null default now(),
  processando_em timestamptz,
  enviado_em timestamptz,
  erro_codigo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint email_outbox_categoria_check check (categoria in ('ROTINA', 'AGENDA', 'RESERVA', 'PAGAMENTO', 'PRESENCA', 'SUPORTE', 'FEEDBACK')),
  constraint email_outbox_template_check check (char_length(trim(template)) between 2 and 80),
  constraint email_outbox_status_check check (status in ('PENDENTE', 'PROCESSANDO', 'ENVIADO', 'FALHA_PERMANENTE', 'CANCELADO')),
  constraint email_outbox_tentativas_check check (tentativas between 0 and 8),
  constraint email_outbox_chave_check check (char_length(trim(chave_idempotencia)) between 8 and 180),
  unique (chave_idempotencia)
);
create index email_outbox_pendente_idx on public.email_outbox (status, proxima_tentativa_em, criado_em);
create index email_outbox_destinatario_idx on public.email_outbox (id_auth_destinatario, criado_em desc);

create trigger set_updated_at_preferencias_email_notificacao
before update on public.preferencias_email_notificacao
for each row execute function public.set_atualizado_em();
create trigger set_updated_at_email_outbox
before update on public.email_outbox
for each row execute function public.set_atualizado_em();

alter table public.preferencias_email_notificacao enable row level security;
alter table public.email_outbox enable row level security;
revoke all on public.preferencias_email_notificacao, public.email_outbox from public, anon, authenticated;
grant all on public.preferencias_email_notificacao, public.email_outbox to service_role;
grant usage, select on sequence public.preferencias_email_notificacao_id_preferencia_email_seq,
  public.email_outbox_id_email_outbox_seq to service_role;

create policy "Usuario le e atualiza suas preferencias de email"
on public.preferencias_email_notificacao for all to authenticated
using (id_auth = (select auth.uid())) with check (id_auth = (select auth.uid()));
grant select, insert, update on public.preferencias_email_notificacao to authenticated;

create or replace function public.reclamar_emails_outbox(p_limite integer default 20)
returns setof public.email_outbox
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_limite < 1 or p_limite > 100 then raise exception using errcode = '22023', message = 'LIMITE_INVALIDO'; end if;
  update public.email_outbox
     set status = 'PENDENTE', processando_em = null,
         proxima_tentativa_em = now()
   where status = 'PROCESSANDO' and processando_em < now() - interval '15 minutes';

  return query
  with selecionados as (
    select id_email_outbox from public.email_outbox
     where status = 'PENDENTE' and proxima_tentativa_em <= now() and tentativas < 8
     order by proxima_tentativa_em, id_email_outbox
     limit p_limite for update skip locked
  ), atualizados as (
    update public.email_outbox o set status = 'PROCESSANDO', processando_em = now(), tentativas = o.tentativas + 1
      from selecionados s where o.id_email_outbox = s.id_email_outbox
    returning o.*
  ) select * from atualizados;
end;
$$;
revoke all on function public.reclamar_emails_outbox(integer) from public, anon, authenticated;
grant execute on function public.reclamar_emails_outbox(integer) to service_role;

create or replace function public.concluir_email_outbox(
  p_id_email_outbox bigint,
  p_status text,
  p_erro_codigo text default null,
  p_proxima_tentativa_em timestamptz default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_status not in ('ENVIADO', 'PENDENTE', 'FALHA_PERMANENTE', 'CANCELADO') then
    raise exception using errcode = '22023', message = 'STATUS_INVALIDO';
  end if;
  update public.email_outbox set status = p_status,
    enviado_em = case when p_status = 'ENVIADO' then now() else enviado_em end,
    processando_em = null,
    tentativas = case when p_status = 'PENDENTE' and p_erro_codigo = 'EMAIL_QUIET_HOURS' then greatest(tentativas - 1, 0) else tentativas end,
    erro_codigo = nullif(left(trim(coalesce(p_erro_codigo,'')),80),''),
    proxima_tentativa_em = case when p_status = 'PENDENTE' then coalesce(p_proxima_tentativa_em, now()) else proxima_tentativa_em end
   where id_email_outbox = p_id_email_outbox and status = 'PROCESSANDO';
  return found;
end;
$$;
revoke all on function public.concluir_email_outbox(bigint,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.concluir_email_outbox(bigint,text,text,timestamptz) to service_role;

commit;
