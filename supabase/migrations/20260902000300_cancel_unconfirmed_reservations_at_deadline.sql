create or replace function public.expirar_reservas_nao_comparecidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer := 0;
begin
  with confirmacao_expirada as (
    update public.reservas reserva
    set status_reserva = 'CANCELADA',
        status_confirmacao_presenca = 'EXPIRADA',
        confirmacao_presenca_em = now(),
        prazo_confirmacao_presenca = coalesce(
          reserva.prazo_confirmacao_presenca,
          (reserva.data_reserva + reserva.horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo'
        ),
        motivo_confirmacao_presenca = 'Prazo de confirmacao de presenca expirado sem resposta do cliente.'
    where reserva.status_reserva = 'CONFIRMADA'
      and reserva.status_confirmacao_presenca = 'PENDENTE'
      and coalesce(
        reserva.prazo_confirmacao_presenca,
        (reserva.data_reserva + reserva.horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo'
      ) < now()
      and not exists (
        select 1
        from public.pedidos pedido_em_andamento
        where pedido_em_andamento.id_reserva = reserva.id_reserva
          and pedido_em_andamento.status_pedido in ('EM_PREPARO', 'PRONTO', 'ENTREGUE')
      )
    returning reserva.id_reserva
  ), pendentes_vencidas as (
    update public.reservas reserva
    set status_reserva = 'CANCELADA',
        status_confirmacao_presenca = case
          when reserva.status_confirmacao_presenca = 'PENDENTE' then 'EXPIRADA'
          else reserva.status_confirmacao_presenca
        end,
        confirmacao_presenca_em = coalesce(reserva.confirmacao_presenca_em, now()),
        prazo_confirmacao_presenca = coalesce(
          reserva.prazo_confirmacao_presenca,
          (reserva.data_reserva + reserva.horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo'
        ),
        motivo_confirmacao_presenca = coalesce(
          reserva.motivo_confirmacao_presenca,
          'Reserva pendente cancelada automaticamente apos o horario de inicio.'
        )
    where reserva.status_reserva = 'PENDENTE'
      and reserva.data_reserva + reserva.horario_inicio < timezone('America/Sao_Paulo', now())
      and not exists (
        select 1
        from public.pedidos pedido_em_andamento
        where pedido_em_andamento.id_reserva = reserva.id_reserva
          and pedido_em_andamento.status_pedido in ('EM_PREPARO', 'PRONTO', 'ENTREGUE')
      )
    returning reserva.id_reserva
  ), pedidos_cancelados_presenca as (
    update public.pedidos pedido
    set status_pedido = 'CANCELADO'
    where pedido.id_reserva in (
        select id_reserva from confirmacao_expirada
        union
        select id_reserva from pendentes_vencidas
      )
      and pedido.status_pedido in ('PENDENTE', 'CONFIRMADO')
    returning pedido.id_pedido, pedido.id_reserva, pedido.valor_total
  ), pagamentos_pendentes_presenca as (
    update public.pagamentos pagamento
    set status_pagamento = 'RECUSADO',
        status_repasse = 'ESTORNADO',
        atualizado_em = now(),
        updated_at = now()
    where pagamento.id_pedido in (select id_pedido from pedidos_cancelados_presenca)
      and pagamento.status_pagamento = 'PENDENTE'
    returning pagamento.id_pagamento, pagamento.id_pedido, pagamento.id_reserva, pagamento.valor_pago, pagamento.valor
  ), eventos_presenca as (
    insert into public.eventos_financeiros (
      id_pagamento, id_pedido, id_reserva, tipo_evento, descricao, valor, origem
    )
    select id_pagamento, id_pedido, id_reserva, 'PAGAMENTO_RECUSADO_PRESENCA_EXPIRADA',
      'Checkout pendente encerrado porque o prazo de confirmacao de presenca expirou.',
      coalesce(valor_pago, valor, 0), 'SISTEMA'
    from pagamentos_pendentes_presenca
    returning 1
  ), reservas_sem_checkin as (
    update public.reservas reserva
    set status_reserva = 'NAO_COMPARECEU'
    where reserva.status_reserva = 'CONFIRMADA'
      and reserva.status_confirmacao_presenca = 'CONFIRMADA'
      and reserva.data_reserva + reserva.horario_fim <= timezone('America/Sao_Paulo', now())
    returning reserva.id_reserva
  ), pedidos_expirados as (
    update public.pedidos pedido
    set status_pedido = 'CANCELADO'
    where pedido.id_reserva in (select id_reserva from reservas_sem_checkin)
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
  select
    (select count(*) from confirmacao_expirada)
    + (select count(*) from pendentes_vencidas)
    + (select count(*) from reservas_sem_checkin)
  into total;

  return total;
end;
$$;

revoke all on function public.expirar_reservas_nao_comparecidas() from public;
grant execute on function public.expirar_reservas_nao_comparecidas() to service_role;
