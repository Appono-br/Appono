alter table public.reservas
  add column if not exists status_confirmacao_presenca text not null default 'PENDENTE',
  add column if not exists prazo_confirmacao_presenca timestamptz,
  add column if not exists confirmacao_presenca_em timestamptz,
  add column if not exists percentual_comissao_ausencia numeric(5, 2) not null default 13,
  add column if not exists valor_retido_ausencia numeric(10, 2),
  add column if not exists valor_reembolso_ausencia numeric(10, 2),
  add column if not exists motivo_confirmacao_presenca text;

alter table public.reservas
  drop constraint if exists reservas_status_confirmacao_presenca_check;

alter table public.reservas
  add constraint reservas_status_confirmacao_presenca_check
  check (status_confirmacao_presenca in ('PENDENTE', 'CONFIRMADA', 'RECUSADA', 'EXPIRADA'));

alter table public.reservas
  drop constraint if exists reservas_percentual_comissao_ausencia_check;

alter table public.reservas
  add constraint reservas_percentual_comissao_ausencia_check
  check (percentual_comissao_ausencia >= 0 and percentual_comissao_ausencia <= 100);

alter table public.reservas
  drop constraint if exists reservas_valor_retido_ausencia_check;

alter table public.reservas
  add constraint reservas_valor_retido_ausencia_check
  check (valor_retido_ausencia is null or valor_retido_ausencia >= 0);

alter table public.reservas
  drop constraint if exists reservas_valor_reembolso_ausencia_check;

alter table public.reservas
  add constraint reservas_valor_reembolso_ausencia_check
  check (valor_reembolso_ausencia is null or valor_reembolso_ausencia >= 0);

alter table public.pagamentos
  add column if not exists valor_reembolsado numeric(10, 2) not null default 0;

alter table public.pagamentos
  drop constraint if exists pagamentos_valor_reembolsado_check;

alter table public.pagamentos
  add constraint pagamentos_valor_reembolsado_check
  check (valor_reembolsado >= 0);

update public.reservas
set prazo_confirmacao_presenca = (data_reserva + horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo'
where prazo_confirmacao_presenca is null
  and data_reserva is not null
  and horario_inicio is not null;

create index if not exists reservas_confirmacao_presenca_idx
  on public.reservas (status_confirmacao_presenca, prazo_confirmacao_presenca);

create or replace function public.expirar_reservas_nao_comparecidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer := 0;
begin
  with vencidas as (
    update public.reservas reserva
    set status_reserva = 'NAO_COMPARECEU',
        status_confirmacao_presenca = case
          when reserva.status_confirmacao_presenca = 'PENDENTE' then 'EXPIRADA'
          else reserva.status_confirmacao_presenca
        end
    where reserva.status_reserva = 'CONFIRMADA'
      and reserva.data_reserva + reserva.horario_fim <= timezone('America/Sao_Paulo', now())
    returning reserva.id_reserva
  ), pedidos_expirados as (
    update public.pedidos pedido
    set status_pedido = 'CANCELADO'
    where pedido.id_reserva in (select id_reserva from vencidas)
      and pedido.status_pedido = 'PENDENTE'
    returning pedido.id_pedido, pedido.id_reserva, pedido.valor_total
  ), pagamentos_expirados as (
    update public.pagamentos pagamento
    set status_pagamento = 'RECUSADO',
        atualizado_em = now(),
        updated_at = now()
    where pagamento.id_pedido in (select id_pedido from pedidos_expirados)
      and pagamento.status_pagamento = 'PENDENTE'
    returning pagamento.id_pagamento
  ), eventos as (
    insert into public.eventos_financeiros (
      id_pedido, id_reserva, tipo_evento, descricao, valor, origem
    )
    select id_pedido, id_reserva, 'PEDIDO_EXPIRADO_NAO_COMPARECIMENTO',
      'Pedido pendente encerrado apos reserva sem check-in.', valor_total, 'SISTEMA'
    from pedidos_expirados
    returning 1
  )
  select count(*) into total from vencidas;
  return total;
end;
$$;

revoke all on function public.expirar_reservas_nao_comparecidas() from public;
grant execute on function public.expirar_reservas_nao_comparecidas() to service_role;
