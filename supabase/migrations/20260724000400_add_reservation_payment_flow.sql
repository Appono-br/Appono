alter table public.reservas
  alter column status_reserva set default 'PENDENTE';

alter table public.pagamentos
  add column if not exists id_reserva bigint references public.reservas(id_reserva) on delete set null,
  add column if not exists valor numeric(10, 2),
  add column if not exists valor_pago numeric(10, 2),
  add column if not exists status_pagamento text default 'PENDENTE',
  add column if not exists data_pagamento timestamp without time zone,
  add column if not exists provedor text,
  add column if not exists referencia_externa text,
  add column if not exists mercado_pago_preference_id text,
  add column if not exists mercado_pago_payment_id text,
  add column if not exists checkout_url text,
  add column if not exists atualizado_em timestamp without time zone default localtimestamp;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pagamentos'
      and column_name = 'id_pedido'
  ) then
    alter table public.pagamentos alter column id_pedido drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pagamentos'
      and column_name = 'id_forma_pagamento'
  ) then
    alter table public.pagamentos alter column id_forma_pagamento drop not null;
  end if;
end;
$$;

update public.pagamentos
set
  valor = coalesce(valor, valor_pago, 0),
  valor_pago = coalesce(valor_pago, valor, 0),
  status_pagamento = coalesce(status_pagamento, 'PENDENTE');

create index if not exists idx_pagamentos_id_reserva on public.pagamentos (id_reserva);
create unique index if not exists pagamentos_reserva_referencia_unica
  on public.pagamentos (referencia_externa)
  where referencia_externa is not null;

drop policy if exists "Cliente visualiza pagamentos de reservas proprias" on public.pagamentos;
create policy "Cliente visualiza pagamentos de reservas proprias"
on public.pagamentos for select to authenticated
using (id_reserva in (
  select reserva.id_reserva
  from public.reservas reserva
  join public.clientes cliente using (id_cliente)
  where cliente.id_auth = (select auth.uid())
));

drop policy if exists "Restaurante visualiza pagamentos de reservas recebidas" on public.pagamentos;
create policy "Restaurante visualiza pagamentos de reservas recebidas"
on public.pagamentos for select to authenticated
using (id_reserva in (
  select reserva.id_reserva
  from public.reservas reserva
  join public.restaurantes restaurante using (id_restaurante)
  where restaurante.id_auth = (select auth.uid())
));

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

  if exists (
    select 1
    from public.reservas reserva
    where reserva.id_cliente = cliente_id
      and reserva.data_reserva = data_escolhida
      and reserva.status_reserva in ('PENDENTE', 'CONFIRMADA')
      and tsrange(
        reserva.data_reserva + reserva.horario_inicio,
        reserva.data_reserva + reserva.horario_fim,
        '[)'
      ) && tsrange(data_escolhida + inicio, data_escolhida + fim, '[)')
  ) then
    raise exception 'Cliente ja possui reserva ativa neste horario';
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
    'PENDENTE'
  )
  returning * into reserva_criada;

  return reserva_criada;
end;
$$;

revoke all on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) from public;
grant execute on function public.criar_reserva_com_mesa_disponivel(bigint, date, time, time, integer, text) to authenticated;
