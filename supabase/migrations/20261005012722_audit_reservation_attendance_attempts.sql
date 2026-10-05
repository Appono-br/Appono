begin;

create table if not exists public.auditoria_presenca_reserva (
  id_auditoria bigserial primary key,
  id_reserva bigint not null references public.reservas(id_reserva) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  operacao text not null check (operacao in ('CHECK_IN','CHECK_OUT')),
  resultado text not null check (resultado in ('SUCESSO','CODIGO_INVALIDO','STATUS_INVALIDO','JANELA_INVALIDA','PEDIDOS_ABERTOS','ERRO')),
  codigo_tecnico text,
  criado_em timestamptz not null default now()
);

create index if not exists auditoria_presenca_reserva_idx
  on public.auditoria_presenca_reserva(id_restaurante, id_reserva, criado_em desc);

alter table public.auditoria_presenca_reserva enable row level security;
revoke all on public.auditoria_presenca_reserva from anon, authenticated;

notify pgrst, 'reload schema';
commit;
