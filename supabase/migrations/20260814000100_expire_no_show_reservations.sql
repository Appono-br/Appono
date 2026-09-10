alter table public.reservas
  drop constraint if exists reservas_status_reserva_check;

alter table public.reservas
  add constraint reservas_status_reserva_check
  check (status_reserva in (
    'PENDENTE', 'CONFIRMADA', 'CHECK_IN', 'CANCELADA',
    'RECUSADA', 'CONCLUIDA', 'NAO_COMPARECEU'
  ));

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
    set status_reserva = 'NAO_COMPARECEU'
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

create or replace function public.ocultar_reserva_do_historico(reserva_id bigint)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  restaurante_id bigint;
  reserva_ocultada public.reservas;
begin
  if (select auth.uid()) is null then raise exception 'Usuario nao autenticado'; end if;
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  select id_restaurante into restaurante_id from public.restaurantes where id_auth = (select auth.uid());

  if cliente_id is not null then
    update public.reservas set ocultada_cliente = true
    where id_reserva = reserva_id and id_cliente = cliente_id
      and status_reserva in ('CANCELADA', 'RECUSADA', 'CONCLUIDA', 'NAO_COMPARECEU')
    returning * into reserva_ocultada;
  elsif restaurante_id is not null then
    update public.reservas set ocultada_restaurante = true
    where id_reserva = reserva_id and id_restaurante = restaurante_id
      and status_reserva in ('CANCELADA', 'RECUSADA', 'CONCLUIDA', 'NAO_COMPARECEU')
    returning * into reserva_ocultada;
  end if;

  if reserva_ocultada.id_reserva is null then
    raise exception 'Apenas reservas canceladas ou finalizadas podem ser excluidas da lista';
  end if;
  return reserva_ocultada;
end;
$$;

revoke all on function public.ocultar_reserva_do_historico(bigint) from public;
grant execute on function public.ocultar_reserva_do_historico(bigint) to authenticated;
