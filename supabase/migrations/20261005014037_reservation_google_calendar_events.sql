begin;
create table public.eventos_reserva_agenda (
 id_evento_reserva_agenda bigserial primary key,
 id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
 id_reserva bigint not null unique references public.reservas(id_reserva) on delete cascade,
 id_conexao_agenda bigint not null references public.conexoes_agenda_cliente(id_conexao_agenda) on delete cascade,
 provedor text not null default 'GOOGLE' check (provedor='GOOGLE'),
 calendario_externo_id text not null default 'primary',
 evento_externo_id text not null,
 status text not null default 'PENDENTE' check (status in ('PENDENTE','SINCRONIZADO','FALHOU','REMOVIDO')),
 hash_conteudo text,
 erro_codigo text,
 sincronizado_em timestamptz,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique(id_conexao_agenda, evento_externo_id)
);
alter table public.eventos_reserva_agenda enable row level security;
revoke all on table public.eventos_reserva_agenda from public, anon, authenticated;
grant all on table public.eventos_reserva_agenda to service_role;
grant usage, select on sequence public.eventos_reserva_agenda_id_evento_reserva_agenda_seq to service_role;
create index eventos_reserva_agenda_cliente_idx on public.eventos_reserva_agenda(id_cliente,status);
notify pgrst, 'reload schema';
commit;
