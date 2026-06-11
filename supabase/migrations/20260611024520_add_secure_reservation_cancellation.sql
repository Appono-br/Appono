create or replace function public.cancelar_reserva_propria(reserva_id bigint)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  reserva_cancelada public.reservas;
begin
  if (select auth.uid()) is null then
    raise exception 'Usuario nao autenticado';
  end if;

  update public.reservas reserva
  set status_reserva = 'CANCELADA'
  where reserva.id_reserva = reserva_id
    and reserva.status_reserva in ('PENDENTE', 'CONFIRMADA')
    and (
      reserva.id_cliente in (
        select cliente.id_cliente
        from public.clientes cliente
        where cliente.id_auth = (select auth.uid())
      )
      or reserva.id_restaurante in (
        select restaurante.id_restaurante
        from public.restaurantes restaurante
        where restaurante.id_auth = (select auth.uid())
      )
    )
  returning reserva.* into reserva_cancelada;

  if reserva_cancelada.id_reserva is null then
    raise exception 'Reserva nao encontrada ou nao pode mais ser cancelada';
  end if;

  return reserva_cancelada;
end;
$$;

revoke all on function public.cancelar_reserva_propria(bigint) from public;
grant execute on function public.cancelar_reserva_propria(bigint) to authenticated;
