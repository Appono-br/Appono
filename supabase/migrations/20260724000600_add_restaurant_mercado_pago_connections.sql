create table if not exists public.mercado_pago_conexoes_restaurante (
  id_conexao bigserial primary key,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  mercado_pago_user_id text,
  public_key text,
  access_token text,
  refresh_token text,
  token_type text,
  scope text,
  live_mode boolean,
  expires_at timestamp without time zone,
  status text not null default 'NAO_CONECTADO',
  oauth_state text unique,
  conectado_em timestamp without time zone,
  desconectado_em timestamp without time zone,
  criado_em timestamp without time zone not null default localtimestamp,
  atualizado_em timestamp without time zone not null default localtimestamp,
  constraint mercado_pago_conexoes_restaurante_status_check
    check (status in ('NAO_CONECTADO', 'AGUARDANDO_AUTORIZACAO', 'CONECTADO', 'ERRO', 'DESCONECTADO'))
);

create unique index if not exists mercado_pago_conexoes_restaurante_unico
  on public.mercado_pago_conexoes_restaurante (id_restaurante);

create index if not exists idx_mercado_pago_conexoes_oauth_state
  on public.mercado_pago_conexoes_restaurante (oauth_state);

alter table public.mercado_pago_conexoes_restaurante enable row level security;

revoke all on table public.mercado_pago_conexoes_restaurante from anon;
revoke all on table public.mercado_pago_conexoes_restaurante from authenticated;

create or replace function public.atualizar_timestamp_mercado_pago_conexao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em = localtimestamp;
  return new;
end;
$$;

drop trigger if exists atualizar_timestamp_mercado_pago_conexao on public.mercado_pago_conexoes_restaurante;
create trigger atualizar_timestamp_mercado_pago_conexao
before update on public.mercado_pago_conexoes_restaurante
for each row execute function public.atualizar_timestamp_mercado_pago_conexao();
