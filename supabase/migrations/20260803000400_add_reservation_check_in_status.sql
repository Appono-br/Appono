alter table public.reservas
  drop constraint if exists reservas_status_reserva_check;

alter table public.reservas
  add constraint reservas_status_reserva_check
  check (status_reserva in (
    'PENDENTE',
    'CONFIRMADA',
    'CHECK_IN',
    'CANCELADA',
    'RECUSADA',
    'CONCLUIDA'
  ));

alter table public.reservas
  drop constraint if exists reservas_sem_sobreposicao;

alter table public.reservas
  add constraint reservas_sem_sobreposicao
  exclude using gist (
    id_mesa with =,
    tsrange(data_reserva + horario_inicio, data_reserva + horario_fim, '[)') with &&
  )
  where (status_reserva in ('PENDENTE', 'CONFIRMADA', 'CHECK_IN'));

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
  configuracao jsonb;
  dia_configurado jsonb;
  dia_semana text;
  antecedencia_minutos integer;
  agora_local timestamp without time zone := now() at time zone 'America/Sao_Paulo';
begin
  if (select auth.uid()) is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if pessoas < 1 or pessoas > 30 then
    raise exception 'Quantidade de pessoas invalida';
  end if;

  if data_escolhida < agora_local::date or fim <= inicio then
    raise exception 'Data ou horario da reserva invalido';
  end if;

  select c.id_cliente
  into cliente_id
  from public.clientes c
  where c.id_auth = (select auth.uid());

  if cliente_id is null then
    raise exception 'Apenas clientes podem criar reservas';
  end if;

  select r.valor_minimo_reserva_por_pessoa, r.configuracao_operacao
  into minimo_por_pessoa, configuracao
  from public.restaurantes r
  where r.id_restaurante = restaurante_id
    and r.ativo = true;

  if minimo_por_pessoa is null then
    raise exception 'Restaurante indisponivel';
  end if;

  if configuracao is null
    or jsonb_typeof(configuracao -> 'days') <> 'array'
    or not exists (
      select 1
      from jsonb_array_elements(configuracao -> 'days') dia
      where dia ->> 'enabled' = 'true'
        and jsonb_typeof(dia -> 'shifts') = 'array'
        and exists (
          select 1
          from jsonb_array_elements(dia -> 'shifts') turno
          where coalesce(turno ->> 'open', '') <> ''
            and coalesce(turno ->> 'close', '') <> ''
        )
    )
  then
    raise exception 'Restaurante ainda nao configurou horarios de funcionamento';
  end if;

  dia_semana := case extract(dow from data_escolhida)::integer
    when 0 then 'sunday'
    when 1 then 'monday'
    when 2 then 'tuesday'
    when 3 then 'wednesday'
    when 4 then 'thursday'
    when 5 then 'friday'
    else 'saturday'
  end;

  select dia
  into dia_configurado
  from jsonb_array_elements(configuracao -> 'days') dia
  where dia ->> 'id' = dia_semana
  limit 1;

  if dia_configurado is null or dia_configurado ->> 'enabled' <> 'true' then
    raise exception 'Restaurante fechado nesta data';
  end if;

  antecedencia_minutos := greatest(
    coalesce(nullif(configuracao ->> 'antecedenciaMinutosReserva', '')::integer, 60),
    0
  );

  if data_escolhida + inicio < agora_local + make_interval(mins => antecedencia_minutos) then
    raise exception 'Horario indisponivel pela antecedencia minima da reserva';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(dia_configurado -> 'shifts') turno
    where coalesce(turno ->> 'open', '') ~ '^\d{2}:\d{2}$'
      and coalesce(turno ->> 'close', '') ~ '^\d{2}:\d{2}$'
      and inicio >= (turno ->> 'open')::time
      and fim <= (turno ->> 'close')::time
      and (turno ->> 'open')::time < (turno ->> 'close')::time
  ) then
    raise exception 'Horario fora do funcionamento do restaurante';
  end if;

  if exists (
    select 1
    from public.reservas reserva
    where reserva.id_cliente = cliente_id
      and reserva.data_reserva = data_escolhida
      and reserva.status_reserva in ('PENDENTE', 'CONFIRMADA', 'CHECK_IN')
      and tsrange(
        reserva.data_reserva + reserva.horario_inicio,
        reserva.data_reserva + reserva.horario_fim,
        '[)'
      ) && tsrange(data_escolhida + inicio, data_escolhida + fim, '[)')
  ) then
    raise exception 'Cliente ja possui reserva ativa neste horario';
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
        and reserva.status_reserva in ('PENDENTE', 'CONFIRMADA', 'CHECK_IN')
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
    valor_minimo_total,
    status_reserva
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
    minimo_por_pessoa * pessoas,
    'CONFIRMADA'
  )
  returning * into reserva_criada;

  return reserva_criada;
end;
$$;

revoke all on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) from public;
grant execute on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) to authenticated;
