create or replace function appono_private.resumo_rotina(plano_id bigint)
returns void language sql security invoker set search_path = '' as $$
  update public.planejamentos_rotina p set resumo = p.resumo || jsonb_build_object(
    'total_refeicoes', (select count(*) from public.refeicoes_planejadas r
      where r.id_planejamento_rotina = plano_id and r.status not in ('RECUSADA','CANCELADA')),
    'total_convertidas', (select count(*) from public.refeicoes_planejadas r
      where r.id_planejamento_rotina = plano_id and r.status in ('CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO')),
    'total_com_sugestao', (select count(*) from public.refeicoes_planejadas r
      where r.id_planejamento_rotina = plano_id and r.id_restaurante is not null
        and r.status not in ('RECUSADA','CANCELADA')),
    'custo_estimado_total', (select coalesce(sum(preco_estimado),0) from public.refeicoes_planejadas r
      where r.id_planejamento_rotina = plano_id and r.status not in ('RECUSADA','CANCELADA')))
  where p.id_planejamento_rotina = plano_id;
$$;

revoke all on function appono_private.resumo_rotina(bigint) from public, anon, authenticated;
grant execute on function appono_private.resumo_rotina(bigint) to service_role;

create or replace function appono_private.sincronizar_refeicao_cancelada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  refeicao public.refeicoes_planejadas;
  novo_status text;
  acao text;
  reserva_ativa boolean := false;
begin
  if tg_table_name = 'reservas' then
    if new.status_reserva not in ('CANCELADA', 'RECUSADA', 'NAO_COMPARECEU')
       or new.status_reserva is not distinct from old.status_reserva then
      return new;
    end if;
    novo_status := 'CANCELADA';
    acao := 'REFEICAO_CANCELADA_PELA_RESERVA';
    select * into refeicao
      from public.refeicoes_planejadas r
      where r.id_reserva = new.id_reserva
      limit 1;
  else
    if new.status_pedido <> 'CANCELADO'
       or new.status_pedido is not distinct from old.status_pedido then
      return new;
    end if;
    select v.status_reserva in ('PENDENTE', 'CONFIRMADA', 'CHECK_IN') into reserva_ativa
      from public.reservas v where v.id_reserva = new.id_reserva;
    novo_status := case when coalesce(reserva_ativa, false) then 'CONVERTIDA_RESERVA' else 'CANCELADA' end;
    acao := case when novo_status = 'CONVERTIDA_RESERVA'
      then 'PEDIDO_CANCELADO_RESERVA_MANTIDA'
      else 'REFEICAO_CANCELADA_PELO_PEDIDO' end;
    select * into refeicao
      from public.refeicoes_planejadas r
      where r.id_pedido = new.id_pedido
      limit 1;
  end if;

  if refeicao.id_refeicao_planejada is null or refeicao.status = novo_status then return new; end if;

  update public.refeicoes_planejadas
    set status = novo_status
    where id_refeicao_planejada = refeicao.id_refeicao_planejada;

  update public.planejamentos_rotina
    set status = 'PARCIAL', versao = versao + 1
    where id_planejamento_rotina = refeicao.id_planejamento_rotina;

  perform appono_private.resumo_rotina(refeicao.id_planejamento_rotina);

  insert into public.historico_rotina_cliente(
    id_cliente, id_planejamento_rotina, id_refeicao_planejada, acao, dados
  ) values (
    refeicao.id_cliente, refeicao.id_planejamento_rotina, refeicao.id_refeicao_planejada, acao,
    jsonb_build_object(
      'status_anterior', refeicao.status,
      'status_atual', novo_status,
      'id_reserva', refeicao.id_reserva,
      'id_pedido', refeicao.id_pedido
    )
  );
  return new;
end;
$$;

revoke all on function appono_private.sincronizar_refeicao_cancelada() from public, anon, authenticated;

drop trigger if exists sincronizar_refeicao_apos_cancelamento_reserva on public.reservas;
create trigger sincronizar_refeicao_apos_cancelamento_reserva
after update of status_reserva on public.reservas
for each row execute function appono_private.sincronizar_refeicao_cancelada();

drop trigger if exists sincronizar_refeicao_apos_cancelamento_pedido on public.pedidos;
create trigger sincronizar_refeicao_apos_cancelamento_pedido
after update of status_pedido on public.pedidos
for each row execute function appono_private.sincronizar_refeicao_cancelada();

update public.refeicoes_planejadas r
set status = 'CANCELADA'
from public.reservas v
where r.id_reserva = v.id_reserva
  and r.status in ('CONVERTIDA_RESERVA', 'CONVERTIDA_PEDIDO')
  and v.status_reserva in ('CANCELADA', 'RECUSADA', 'NAO_COMPARECEU');

update public.refeicoes_planejadas r
set status = case
  when v.status_reserva in ('PENDENTE', 'CONFIRMADA', 'CHECK_IN') then 'CONVERTIDA_RESERVA'
  else 'CANCELADA'
end
from public.pedidos p
left join public.reservas v on v.id_reserva = p.id_reserva
where r.id_pedido = p.id_pedido
  and r.status = 'CONVERTIDA_PEDIDO'
  and p.status_pedido = 'CANCELADO';

do $$
declare plano_id bigint;
begin
  for plano_id in
    select distinct r.id_planejamento_rotina
    from public.refeicoes_planejadas r
    where r.status = 'CANCELADA'
       or (r.status = 'CONVERTIDA_RESERVA' and r.id_pedido is not null)
  loop
    perform appono_private.resumo_rotina(plano_id);
  end loop;
end;
$$;
