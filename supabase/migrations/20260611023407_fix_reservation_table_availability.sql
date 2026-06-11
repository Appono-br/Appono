create or replace function public.criar_reserva_com_mesa_disponivel(
  restaurante_id bigint,
  data_escolhida date,
  inicio time,
  fim time,
  pessoas integer,
  observacoes_cliente text default null
)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  mesa_id bigint;
  minimo_por_pessoa numeric(10, 2);
  reserva_criada public.reservas;
begin
  if (select auth.uid()) is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if pessoas < 1 or pessoas > 30 then
    raise exception 'Quantidade de pessoas invalida';
  end if;

  if data_escolhida < current_date or fim <= inicio then
    raise exception 'Data ou horario da reserva invalido';
  end if;

  select c.id_cliente
  into cliente_id
  from public.clientes c
  where c.id_auth = (select auth.uid());

  if cliente_id is null then
    raise exception 'Apenas clientes podem criar reservas';
  end if;

  select r.valor_minimo_reserva_por_pessoa
  into minimo_por_pessoa
  from public.restaurantes r
  where r.id_restaurante = restaurante_id
    and r.ativo = true;

  if minimo_por_pessoa is null then
    raise exception 'Restaurante indisponivel';
  end if;

  select m.id_mesa
  into mesa_id
  from public.mesas m
  where m.id_restaurante = restaurante_id
    and m.capacidade >= pessoas
    and not exists (
      select 1
      from public.reservas reserva
      where reserva.id_mesa = m.id_mesa
        and reserva.data_reserva = data_escolhida
        and reserva.status_reserva in ('PENDENTE', 'CONFIRMADA')
        and tsrange(
          reserva.data_reserva + reserva.horario_inicio,
          reserva.data_reserva + reserva.horario_fim,
          '[)'
        ) && tsrange(data_escolhida + inicio, data_escolhida + fim, '[)')
    )
  order by m.capacidade, m.numero_mesa
  for update skip locked
  limit 1;

  if mesa_id is null then
    raise exception 'Nao ha mesa disponivel para este horario e quantidade de pessoas';
  end if;

  insert into public.reservas (
    id_cliente,
    id_restaurante,
    id_mesa,
    data_reserva,
    horario_inicio,
    horario_fim,
    quantidade_pessoas,
    observacoes,
    valor_minimo_por_pessoa,
    valor_minimo_total
  )
  values (
    cliente_id,
    restaurante_id,
    mesa_id,
    data_escolhida,
    inicio,
    fim,
    pessoas,
    nullif(trim(observacoes_cliente), ''),
    minimo_por_pessoa,
    minimo_por_pessoa * pessoas
  )
  returning * into reserva_criada;

  return reserva_criada;
end;
$$;
