alter table public.reservas
  alter column status_reserva set default 'CONFIRMADA';

update public.reservas
set status_reserva = 'CONFIRMADA'
where status_reserva = 'PENDENTE';
