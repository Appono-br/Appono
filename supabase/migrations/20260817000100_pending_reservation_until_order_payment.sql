create or replace function public.criar_reserva_com_pedido_antecipado(
  restaurante_id bigint,
  data_escolhida date,
  inicio time,
  fim time,
  pessoas integer,
  observacoes_reserva text default null,
  itens jsonb default '[]'::jsonb,
  observacoes_pedido text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  reserva_criada public.reservas;
  pedido_criado public.pedidos;
begin
  if itens is null or jsonb_typeof(itens) <> 'array' or jsonb_array_length(itens) = 0 then
    raise exception 'O pedido deve possuir ao menos um item';
  end if;

  reserva_criada := public.criar_reserva_com_mesa_disponivel(
    restaurante_id,
    data_escolhida,
    inicio,
    fim,
    pessoas,
    observacoes_reserva
  );

  pedido_criado := public.criar_pedido_antecipado(
    reserva_criada.id_reserva,
    itens,
    observacoes_pedido
  );

  update public.reservas
  set status_reserva = 'PENDENTE'
  where id_reserva = reserva_criada.id_reserva
  returning * into reserva_criada;

  return jsonb_build_object(
    'reserva', to_jsonb(reserva_criada),
    'pedido', to_jsonb(pedido_criado)
  );
end;
$$;

revoke all on function public.criar_reserva_com_pedido_antecipado(bigint, date, time, time, integer, text, jsonb, text) from public;
grant execute on function public.criar_reserva_com_pedido_antecipado(bigint, date, time, time, integer, text, jsonb, text) to authenticated;
