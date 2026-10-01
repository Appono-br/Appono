-- Existing field names are retained for API compatibility. New reservations use a fixed price.
begin;
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
  preco_reserva numeric(10, 2);
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
  into preco_reserva, configuracao
  from public.restaurantes r
  where r.id_restaurante = restaurante_id
    and r.ativo = true;

  if preco_reserva is null then
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
    preco_reserva,
    preco_reserva,
    case when preco_reserva > 0 then 'PENDENTE' else 'CONFIRMADA' end
  )
  returning * into reserva_criada;

  return reserva_criada;
end;
$$;

revoke all on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) from public;
grant execute on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) to authenticated;

-- Advance orders no longer require a minimum spend.
create or replace function public.criar_pedido_antecipado(
  reserva_id bigint,
  itens jsonb,
  observacoes_cliente text default null
)
returns public.pedidos
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  reserva_selecionada public.reservas;
  pedido_criado public.pedidos;
  valor_calculado numeric(10, 2);
  agora_local timestamp without time zone := now() at time zone 'America/Sao_Paulo';
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if itens is null or jsonb_typeof(itens) <> 'array' or jsonb_array_length(itens) = 0 then
    raise exception 'O pedido deve possuir ao menos um item';
  end if;

  select c.id_cliente
  into cliente_id
  from public.clientes c
  where c.id_auth = auth.uid();

  if cliente_id is null then
    raise exception 'Apenas clientes podem criar pedidos antecipados';
  end if;

  select r.*
  into reserva_selecionada
  from public.reservas r
  where r.id_reserva = reserva_id
    and r.id_cliente = cliente_id
  for update;

  if reserva_selecionada.id_reserva is null then
    raise exception 'Reserva nao encontrada';
  end if;

  if reserva_selecionada.status_reserva not in ('PENDENTE', 'CONFIRMADA') then
    raise exception 'O pedido antecipado exige uma reserva ativa';
  end if;

  if reserva_selecionada.data_reserva + reserva_selecionada.horario_inicio <= agora_local then
    raise exception 'Nao e possivel criar pedido para uma reserva iniciada';
  end if;

  if exists (
    select 1
    from public.pedidos p
    where p.id_reserva = reserva_id
      and p.status_pedido in ('PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO')
  ) then
    raise exception 'Esta reserva ja possui um pedido ativo';
  end if;

  with itens_solicitados as (
    select
      item.id_produto,
      sum(item.quantidade)::integer as quantidade
    from jsonb_to_recordset(itens) as item(id_produto bigint, quantidade integer, observacoes text)
    group by item.id_produto
  )
  select sum(produto.preco * solicitado.quantidade)
  into valor_calculado
  from itens_solicitados solicitado
  join public.produtos produto on produto.id_produto = solicitado.id_produto
  where produto.id_restaurante = reserva_selecionada.id_restaurante
    and produto.disponivel = true
    and produto.arquivado is not true
    and solicitado.quantidade > 0;

  if valor_calculado is null then
    raise exception 'Nenhum produto valido foi informado';
  end if;


  if (
    select count(distinct item.id_produto)
    from jsonb_to_recordset(itens) as item(id_produto bigint, quantidade integer, observacoes text)
  ) <> (
    select count(distinct produto.id_produto)
    from jsonb_to_recordset(itens) as item(id_produto bigint, quantidade integer, observacoes text)
    join public.produtos produto on produto.id_produto = item.id_produto
    where produto.id_restaurante = reserva_selecionada.id_restaurante
      and produto.disponivel = true
      and produto.arquivado is not true
      and item.quantidade > 0
  ) then
    raise exception 'Um ou mais produtos sao invalidos ou indisponiveis';
  end if;

  insert into public.pedidos (
    id_cliente,
    id_restaurante,
    id_reserva,
    status_pedido,
    valor_total,
    observacoes,
    horario_entrega_previsto,
    iniciar_preparo_em
  )
  values (
    cliente_id,
    reserva_selecionada.id_restaurante,
    reserva_selecionada.id_reserva,
    'PENDENTE',
    valor_calculado,
    nullif(trim(observacoes_cliente), ''),
    reserva_selecionada.data_reserva + reserva_selecionada.horario_inicio,
    null
  )
  returning * into pedido_criado;

  insert into public.itens_pedido (
    id_pedido,
    id_produto,
    quantidade,
    preco_unitario,
    observacoes
  )
  select
    pedido_criado.id_pedido,
    item.id_produto,
    sum(item.quantidade)::integer,
    produto.preco,
    nullif(string_agg(nullif(trim(item.observacoes), ''), '; '), '')
  from jsonb_to_recordset(itens) as item(id_produto bigint, quantidade integer, observacoes text)
  join public.produtos produto on produto.id_produto = item.id_produto
  group by item.id_produto, produto.preco;

  return pedido_criado;
end;
$$;

revoke all on function public.criar_pedido_antecipado(bigint, jsonb, text) from public;
grant execute on function public.criar_pedido_antecipado(bigint, jsonb, text) to authenticated;

comment on column public.restaurantes.valor_minimo_reserva_por_pessoa is 'Fixed reservation price; legacy column name retained for compatibility.';
comment on column public.reservas.valor_minimo_total is 'Fixed price snapshot for this reservation, independent of guest count.';
notify pgrst, 'reload schema';
commit;
