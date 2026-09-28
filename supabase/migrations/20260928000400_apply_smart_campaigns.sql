begin;

create or replace function appono_private.aplicar_campanha_inteligente(
  p_campanha_id bigint,
  p_restaurante_id bigint,
  p_reserva_id bigint,
  p_pedido_id bigint,
  p_data_reserva date,
  p_horario_inicio time,
  p_quantidade_pessoas integer
) returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  campanha public.campanhas_inteligentes_restaurante;
  assinatura public.assinaturas_restaurante;
  instante_reserva timestamptz;
  valor_elegivel numeric(10,2);
  valor_beneficio numeric(10,2) := 0;
  ha_produtos_restritos boolean;
begin
  if p_campanha_id is null then return 0; end if;
  instante_reserva := (p_data_reserva + p_horario_inicio) at time zone 'America/Sao_Paulo';
  select c.* into campanha from public.campanhas_inteligentes_restaurante c
    where c.id_campanha = p_campanha_id and c.id_restaurante = p_restaurante_id for update;
  if campanha.id_campanha is null then raise exception 'Campanha nao encontrada para este restaurante'; end if;
  select a.* into assinatura from public.assinaturas_restaurante a where a.id_restaurante = p_restaurante_id;
  if assinatura.id_assinatura is null or assinatura.codigo_plano <> 'PROFISSIONAL' or assinatura.status <> 'ATIVA'
    or (assinatura.periodo_fim_em is not null and assinatura.periodo_fim_em < now()) then
    raise exception 'Esta campanha nao esta mais disponivel';
  end if;
  if campanha.status <> 'ATIVA' or campanha.usos_confirmados >= campanha.limite_usos
    or instante_reserva < campanha.inicio_em or instante_reserva >= campanha.fim_em
    or (campanha.minimo_pessoas is not null and p_quantidade_pessoas < campanha.minimo_pessoas) then
    raise exception 'Campanha indisponivel para esta reserva';
  end if;
  if p_pedido_id is not null then
    select exists(select 1 from public.campanhas_inteligentes_produtos cp where cp.id_campanha = campanha.id_campanha) into ha_produtos_restritos;
    select coalesce(sum(ip.preco_unitario * ip.quantidade),0) into valor_elegivel
      from public.itens_pedido ip
      where ip.id_pedido = p_pedido_id and (not ha_produtos_restritos or exists (
        select 1 from public.campanhas_inteligentes_produtos cp where cp.id_campanha = campanha.id_campanha and cp.id_produto = ip.id_produto
      ));
    if campanha.minimo_itens is not null and (select coalesce(sum(quantidade),0) from public.itens_pedido where id_pedido = p_pedido_id) < campanha.minimo_itens then
      raise exception 'O pedido nao atende a quantidade minima da campanha';
    end if;
    if campanha.tipo_beneficio = 'DESCONTO_PERCENTUAL' then valor_beneficio := round(valor_elegivel * campanha.valor_beneficio / 100, 2);
    elsif campanha.tipo_beneficio = 'DESCONTO_FIXO' then valor_beneficio := least(valor_elegivel, campanha.valor_beneficio);
    end if;
    update public.pedidos set valor_total = greatest(0, valor_total - valor_beneficio) where id_pedido = p_pedido_id;
  end if;
  update public.campanhas_inteligentes_restaurante set usos_confirmados = usos_confirmados + 1,
    status = case when usos_confirmados + 1 >= limite_usos then 'ESGOTADA' else status end
    where id_campanha = campanha.id_campanha;
  insert into public.resgates_campanha_inteligente(id_campanha,id_reserva,id_pedido,valor_beneficio,status)
    values(campanha.id_campanha,p_reserva_id,p_pedido_id,valor_beneficio,'RESERVADO');
  insert into public.eventos_campanha_inteligente(id_campanha,tipo,id_cliente,id_reserva,id_pedido)
    select campanha.id_campanha,'RESGATE',r.id_cliente,p_reserva_id,p_pedido_id from public.reservas r where r.id_reserva=p_reserva_id;
  return valor_beneficio;
end;
$$;
revoke all on function appono_private.aplicar_campanha_inteligente(bigint,bigint,bigint,bigint,date,time,integer) from public,anon,authenticated;

create or replace function public.criar_reserva_com_campanha(
  restaurante_id bigint,data_escolhida date,inicio time,fim time,pessoas integer,observacoes_cliente text,p_campanha_id bigint
) returns public.reservas language plpgsql security definer set search_path = '' as $$
declare reserva_criada public.reservas;
begin
  reserva_criada := public.criar_reserva_com_mesa_disponivel(restaurante_id,data_escolhida,inicio,fim,pessoas,observacoes_cliente);
  perform appono_private.aplicar_campanha_inteligente(p_campanha_id,restaurante_id,reserva_criada.id_reserva,null,data_escolhida,inicio,pessoas);
  return reserva_criada;
end;
$$;
revoke all on function public.criar_reserva_com_campanha(bigint,date,time,time,integer,text,bigint) from public,anon;
grant execute on function public.criar_reserva_com_campanha(bigint,date,time,time,integer,text,bigint) to authenticated;

create or replace function public.criar_reserva_com_pedido_antecipado_com_campanha(
  restaurante_id bigint,data_escolhida date,inicio time,fim time,pessoas integer,observacoes_reserva text,itens jsonb,observacoes_pedido text,p_campanha_id bigint
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare resultado jsonb; reserva_criada public.reservas; pedido_criado public.pedidos;
begin
  resultado := public.criar_reserva_com_pedido_antecipado(restaurante_id,data_escolhida,inicio,fim,pessoas,observacoes_reserva,itens,observacoes_pedido);
  select * into reserva_criada from public.reservas where id_reserva = (resultado->'reserva'->>'id_reserva')::bigint;
  select * into pedido_criado from public.pedidos where id_pedido = (resultado->'pedido'->>'id_pedido')::bigint;
  perform appono_private.aplicar_campanha_inteligente(p_campanha_id,restaurante_id,reserva_criada.id_reserva,pedido_criado.id_pedido,data_escolhida,inicio,pessoas);
  select p.* into pedido_criado from public.pedidos p where p.id_pedido = (resultado->'pedido'->>'id_pedido')::bigint;
  return jsonb_build_object('reserva',to_jsonb(reserva_criada),'pedido',to_jsonb(pedido_criado));
end;
$$;
revoke all on function public.criar_reserva_com_pedido_antecipado_com_campanha(bigint,date,time,time,integer,text,jsonb,text,bigint) from public,anon;
grant execute on function public.criar_reserva_com_pedido_antecipado_com_campanha(bigint,date,time,time,integer,text,jsonb,text,bigint) to authenticated;

create unique index if not exists eventos_campanha_pedido_pago_unico
  on public.eventos_campanha_inteligente(id_campanha,id_pedido,tipo)
  where tipo = 'PEDIDO_PAGO' and id_pedido is not null;

notify pgrst, 'reload schema';
commit;
