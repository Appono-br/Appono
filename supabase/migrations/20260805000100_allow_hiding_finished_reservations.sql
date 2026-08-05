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
  if (select auth.uid()) is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select cliente.id_cliente into cliente_id
  from public.clientes cliente
  where cliente.id_auth = (select auth.uid());

  select restaurante.id_restaurante into restaurante_id
  from public.restaurantes restaurante
  where restaurante.id_auth = (select auth.uid());

  if cliente_id is not null then
    update public.reservas reserva
    set ocultada_cliente = true
    where reserva.id_reserva = reserva_id
      and reserva.id_cliente = cliente_id
      and reserva.status_reserva in ('CANCELADA', 'RECUSADA', 'CONCLUIDA')
    returning reserva.* into reserva_ocultada;
  elsif restaurante_id is not null then
    update public.reservas reserva
    set ocultada_restaurante = true
    where reserva.id_reserva = reserva_id
      and reserva.id_restaurante = restaurante_id
      and reserva.status_reserva in ('CANCELADA', 'RECUSADA', 'CONCLUIDA')
    returning reserva.* into reserva_ocultada;
  end if;

  if reserva_ocultada.id_reserva is null then
    raise exception 'Apenas reservas canceladas ou finalizadas podem ser excluidas da lista';
  end if;

  return reserva_ocultada;
end;
$$;

revoke all on function public.ocultar_reserva_do_historico(bigint) from public;
grant execute on function public.ocultar_reserva_do_historico(bigint) to authenticated;
