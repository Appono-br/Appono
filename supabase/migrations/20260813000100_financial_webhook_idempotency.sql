create table if not exists public.webhooks_mercado_pago (
  chave_idempotencia text primary key,
  payment_id text not null,
  request_id text,
  status text not null default 'PROCESSANDO' check (status in ('PROCESSANDO', 'PROCESSADO', 'ERRO')),
  tentativas integer not null default 1,
  erro text,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);
alter table public.webhooks_mercado_pago enable row level security;
revoke all on public.webhooks_mercado_pago from anon, authenticated;

create or replace function public.reclamar_webhook_mercado_pago(chave text, pagamento text, requisicao text)
returns boolean language plpgsql security definer set search_path = public as $$
declare adquirido boolean := false;
begin
  insert into public.webhooks_mercado_pago(chave_idempotencia, payment_id, request_id)
  values (chave, pagamento, requisicao)
  on conflict (chave_idempotencia) do update set
    status = 'PROCESSANDO', tentativas = webhooks_mercado_pago.tentativas + 1, erro = null
  where webhooks_mercado_pago.status = 'ERRO'
  returning true into adquirido;
  return coalesce(adquirido, false);
end; $$;
revoke all on function public.reclamar_webhook_mercado_pago(text, text, text) from public;

alter table public.eventos_financeiros add column if not exists request_id text;
alter table public.eventos_financeiros add column if not exists origem text not null default 'APPONO';
alter table public.eventos_financeiros add column if not exists metadados jsonb not null default '{}'::jsonb;
create index if not exists eventos_financeiros_criado_em_idx on public.eventos_financeiros (criado_em desc);

create or replace function public.bloquear_mutacao_evento_financeiro()
returns trigger language plpgsql as $$ begin raise exception 'Eventos financeiros sao imutaveis'; end; $$;
drop trigger if exists eventos_financeiros_append_only on public.eventos_financeiros;
create trigger eventos_financeiros_append_only before update or delete on public.eventos_financeiros
for each row execute function public.bloquear_mutacao_evento_financeiro();
