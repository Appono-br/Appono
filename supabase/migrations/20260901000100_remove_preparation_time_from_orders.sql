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

  if reserva_selecionada.status_reserva <> 'CONFIRMADA' then
    raise exception 'O pedido antecipado exige uma reserva confirmada';
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

  if valor_calculado < coalesce(reserva_selecionada.valor_minimo_total, 0) then
    raise exception 'Pedido abaixo do consumo minimo';
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
