-- Evita atualizar public.reservas mais de uma vez no mesmo comando.
-- O PostgreSQL rejeita CTEs que tentam modificar a mesma tupla novamente,
-- inclusive quando as condições parecem mutuamente exclusivas.
create or replace function public.expirar_reservas_nao_comparecidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer := 0;
begin
  drop table if exists pg_temp.reservas_expiracao;
  create temporary table reservas_expiracao (
    id_reserva bigint primary key,
    tipo text not null
  ) on commit drop;

  insert into reservas_expiracao (id_reserva, tipo)
  select reserva.id_reserva,
    case
      when reserva.status_reserva = 'CONFIRMADA'
       and reserva.status_confirmacao_presenca = 'PENDENTE' then 'CONFIRMACAO_EXPIRADA'
      when reserva.status_reserva = 'PENDENTE' then 'PENDENTE_VENCIDA'
      else 'NAO_COMPARECEU'
    end
  from public.reservas reserva
  where (
      reserva.status_reserva = 'CONFIRMADA'
      and reserva.status_confirmacao_presenca = 'PENDENTE'
      and coalesce(
        reserva.prazo_confirmacao_presenca,
        (reserva.data_reserva + reserva.horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo'
      ) < now()
      and not exists (
        select 1 from public.pedidos pedido
        where pedido.id_reserva = reserva.id_reserva
          and pedido.status_pedido in ('EM_PREPARO', 'PRONTO', 'ENTREGUE')
      )
    ) or (
      reserva.status_reserva = 'PENDENTE'
      and reserva.data_reserva + reserva.horario_inicio < timezone('America/Sao_Paulo', now())
      and not exists (
        select 1 from public.pedidos pedido
        where pedido.id_reserva = reserva.id_reserva
          and pedido.status_pedido in ('EM_PREPARO', 'PRONTO', 'ENTREGUE')
      )
    ) or (
      reserva.status_reserva = 'CONFIRMADA'
      and reserva.status_confirmacao_presenca = 'CONFIRMADA'
      and reserva.data_reserva + reserva.horario_fim <= timezone('America/Sao_Paulo', now())
    );

  -- Uma única atualização em reservas elimina o conflito de tupla.
  update public.reservas reserva
  set status_reserva = case
        when expiracao.tipo = 'NAO_COMPARECEU' then 'NAO_COMPARECEU'
        else 'CANCELADA'
      end,
      status_confirmacao_presenca = case
        when expiracao.tipo in ('CONFIRMACAO_EXPIRADA', 'PENDENTE_VENCIDA')
         and reserva.status_confirmacao_presenca = 'PENDENTE' then 'EXPIRADA'
        else reserva.status_confirmacao_presenca
      end,
      confirmacao_presenca_em = case
        when expiracao.tipo in ('CONFIRMACAO_EXPIRADA', 'PENDENTE_VENCIDA')
          then coalesce(reserva.confirmacao_presenca_em, now())
        else reserva.confirmacao_presenca_em
      end,
      prazo_confirmacao_presenca = case
        when expiracao.tipo in ('CONFIRMACAO_EXPIRADA', 'PENDENTE_VENCIDA')
          then coalesce(reserva.prazo_confirmacao_presenca, (reserva.data_reserva + reserva.horario_inicio - interval '1 hour') at time zone 'America/Sao_Paulo')
        else reserva.prazo_confirmacao_presenca
      end,
      motivo_confirmacao_presenca = case
        when expiracao.tipo = 'CONFIRMACAO_EXPIRADA'
          then 'Prazo de confirmacao de presenca expirado sem resposta do cliente.'
        when expiracao.tipo = 'PENDENTE_VENCIDA'
          then coalesce(reserva.motivo_confirmacao_presenca, 'Reserva pendente cancelada automaticamente apos o horario de inicio.')
        else reserva.motivo_confirmacao_presenca
      end
  from reservas_expiracao expiracao
  where reserva.id_reserva = expiracao.id_reserva;

  with pedidos_cancelados as (
    update public.pedidos pedido
    set status_pedido = 'CANCELADO'
    where pedido.id_reserva in (select id_reserva from reservas_expiracao)
      and (
        (pedido.status_pedido in ('PENDENTE', 'CONFIRMADO') and exists (
          select 1 from reservas_expiracao exp where exp.id_reserva = pedido.id_reserva and exp.tipo <> 'NAO_COMPARECEU'
        ))
        or (pedido.status_pedido = 'PENDENTE' and exists (
          select 1 from reservas_expiracao exp where exp.id_reserva = pedido.id_reserva and exp.tipo = 'NAO_COMPARECEU'
        ))
      )
    returning pedido.id_pedido, pedido.id_reserva, pedido.valor_total
  ), pagamentos_cancelados as (
    update public.pagamentos pagamento
    set status_pagamento = 'RECUSADO',
        status_repasse = 'ESTORNADO',
        atualizado_em = now(),
        updated_at = now()
    where pagamento.id_pedido in (select id_pedido from pedidos_cancelados)
      and pagamento.status_pagamento = 'PENDENTE'
    returning pagamento.id_pagamento, pagamento.id_pedido, pagamento.id_reserva, pagamento.valor_pago, pagamento.valor
  )
  insert into public.eventos_financeiros (id_pagamento, id_pedido, id_reserva, tipo_evento, descricao, valor, origem)
  select pagamentos_cancelados.id_pagamento, pagamentos_cancelados.id_pedido, pagamentos_cancelados.id_reserva,
    case when expiracao.tipo = 'NAO_COMPARECEU' then 'PEDIDO_EXPIRADO_NAO_COMPARECIMENTO' else 'PAGAMENTO_RECUSADO_PRESENCA_EXPIRADA' end,
    case when expiracao.tipo = 'NAO_COMPARECEU' then 'Pedido pendente encerrado apos reserva sem check-in.' else 'Checkout pendente encerrado porque o prazo de confirmacao de presenca expirou.' end,
    coalesce(valor_pago, valor, 0), 'SISTEMA'
  from pagamentos_cancelados
  left join reservas_expiracao expiracao on expiracao.id_reserva = pagamentos_cancelados.id_reserva;

  select count(*) into total from reservas_expiracao;
  return total;
end;
$$;

revoke all on function public.expirar_reservas_nao_comparecidas() from public;
grant execute on function public.expirar_reservas_nao_comparecidas() to service_role;
