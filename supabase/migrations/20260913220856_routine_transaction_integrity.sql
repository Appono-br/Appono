begin;

-- Fail with a diagnostic before changing legacy data. No automatic corrections.
do $$
declare invalidos bigint[];
begin
  select array_agg(id_perfil_rotina) into invalidos from public.perfis_rotina_cliente
  where tempo_maximo_minutos not between 30 and 240
    or horario_inicio >= horario_fim
    or tempo_maximo_minutos * 60 > extract(epoch from horario_fim - horario_inicio)
    or cardinality(dias_semana) = 0 or array_position(dias_semana, null) is not null
    or not (dias_semana <@ array['monday','tuesday','wednesday','thursday','friday','saturday','sunday']::text[])
    or raio_km not between 1 and 100
    or orcamento_diario < 0 or orcamento_semanal < 0
    or orcamento_diario = 'NaN'::numeric or orcamento_semanal = 'NaN'::numeric
    or (latitude is null) <> (longitude is null)
    or latitude not between -90 and 90 or longitude not between -180 and 180;
  if invalidos is not null then
    raise exception 'Perfis de rotina incompativeis: %. Corrija com consentimento antes de aplicar.', invalidos;
  end if;
end $$;

alter table public.perfis_rotina_cliente
  drop constraint perfis_rotina_cliente_tempo_check,
  add constraint perfis_rotina_cliente_tempo_check check (tempo_maximo_minutos between 30 and 240),
  add constraint perfis_rotina_cliente_janela_check check (
    tempo_maximo_minutos * 60 <= extract(epoch from horario_fim - horario_inicio)),
  add constraint perfis_rotina_cliente_dias_check check (
    cardinality(dias_semana) > 0 and array_position(dias_semana, null) is null
    and dias_semana <@ array['monday','tuesday','wednesday','thursday','friday','saturday','sunday']::text[]),
  add constraint perfis_rotina_cliente_orcamentos_finitos_check check (
    orcamento_diario is distinct from 'NaN'::numeric and orcamento_semanal is distinct from 'NaN'::numeric),
  add column versao bigint not null default 1 check (versao > 0);
alter table public.planejamentos_rotina
  add column versao bigint not null default 1 check (versao > 0),
  add column versao_perfil_origem bigint;

grant usage on schema appono_private to service_role;

-- Common lock order: client advisory lock, active profile, week, meal.
-- The client lock also covers absent profiles/weeks and cross-week profile edits.
create function appono_private.travar_rotina(actor_id uuid, esperada bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare cliente_id bigint; atual bigint;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = actor_id;
  if cliente_id is null then raise sqlstate '42501' using message = 'Cliente nao autorizado'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('appono.rotina:' || cliente_id, 0));
  select versao into atual from public.perfis_rotina_cliente
    where id_cliente = cliente_id and ativo for update;
  if esperada is null or esperada is distinct from coalesce(atual, 0) then
    raise sqlstate 'PT409' using message = 'A rotina mudou em outra aba. Recarregue os dados antes de continuar.';
  end if;
  return cliente_id;
end $$;
revoke all on function appono_private.travar_rotina(uuid,bigint) from public, anon, authenticated;
grant execute on function appono_private.travar_rotina(uuid,bigint) to service_role;

create function appono_private.resumo_rotina(plano_id bigint)
returns void language sql security invoker set search_path = '' as $$
  update public.planejamentos_rotina p set resumo = p.resumo || jsonb_build_object(
    'total_refeicoes', (select count(*) from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano_id),
    'total_convertidas', (select count(*) from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano_id and r.id_reserva is not null),
    'total_com_sugestao', (select count(*) from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano_id and r.id_restaurante is not null),
    'custo_estimado_total', (select coalesce(sum(preco_estimado),0) from public.refeicoes_planejadas r
      where r.id_planejamento_rotina = plano_id and r.status not in ('RECUSADA','CANCELADA')))
  where p.id_planejamento_rotina = plano_id;
$$;
revoke all on function appono_private.resumo_rotina(bigint) from public, anon, authenticated;
grant execute on function appono_private.resumo_rotina(bigint) to service_role;

-- Only the verified Express API can submit computed recommendations. It supplies
-- actor_id from getUser(), never from the request body or editable metadata.
create function public.mutar_rotina(actor_id uuid, operacao text, versao_perfil bigint,
  versao_planejamento bigint default null, entidade_id bigint default null, dados jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  cliente_id bigint;
  perfil public.perfis_rotina_cliente;
  plano public.planejamentos_rotina;
  refeicao public.refeicoes_planejadas;
  novo public.perfis_rotina_cliente;
  item jsonb; campo text; tipo_item text; permitido jsonb;
  semana date; acao text; soma numeric;
begin
  cliente_id := appono_private.travar_rotina(actor_id, versao_perfil);
  select * into perfil from public.perfis_rotina_cliente where id_cliente = cliente_id and ativo;
  if operacao = 'PERFIL' then
    -- Explicit allowlist prevents changing ownership, versions and timestamps.
    select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into permitido from jsonb_each(dados)
      where key = any(array['nome','endereco_base','latitude','longitude','dias_semana','horario_inicio',
        'horario_fim','tempo_maximo_minutos','orcamento_diario','orcamento_semanal','raio_km',
        'origem_agenda','eventos_importados','janelas_disponiveis']);
    if perfil.id_perfil_rotina is null then
      insert into public.perfis_rotina_cliente(id_cliente) values(cliente_id) returning * into perfil;
      acao := 'PERFIL_CRIADO';
    else
      acao := 'PERFIL_ATUALIZADO';
    end if;
    novo := jsonb_populate_record(perfil, permitido);
    update public.perfis_rotina_cliente set nome = novo.nome, endereco_base = novo.endereco_base,
      latitude = novo.latitude, longitude = novo.longitude, dias_semana = novo.dias_semana,
      horario_inicio = novo.horario_inicio, horario_fim = novo.horario_fim,
      tempo_maximo_minutos = novo.tempo_maximo_minutos, orcamento_diario = novo.orcamento_diario,
      orcamento_semanal = novo.orcamento_semanal, raio_km = novo.raio_km, origem_agenda = novo.origem_agenda,
      eventos_importados = novo.eventos_importados, janelas_disponiveis = novo.janelas_disponiveis,
      versao = versao_perfil + 1
      where id_perfil_rotina = perfil.id_perfil_rotina returning * into perfil;
    foreach campo in array array['preferencias','restaurantes_favoritos_rotina','pratos_favoritos_rotina','restricoes','alergias'] loop
      if not (dados ? campo) then continue; end if;
      if jsonb_typeof(dados->campo) is distinct from 'array' then
        raise sqlstate '22023' using message = 'Selecoes devem ser listas, nao null';
      end if;
      tipo_item := case campo when 'preferencias' then 'PREFERENCIA'
        when 'restaurantes_favoritos_rotina' then 'RESTAURANTE_FAVORITO' when 'pratos_favoritos_rotina' then 'PRATO_FAVORITO'
        when 'restricoes' then 'RESTRICAO' else 'ALERGIA' end;
      if campo in ('restricoes','alergias') then
        delete from public.restricoes_rotina_cliente where id_perfil_rotina = perfil.id_perfil_rotina and tipo = tipo_item;
        insert into public.restricoes_rotina_cliente(id_cliente,id_perfil_rotina,tipo,valor)
          select cliente_id,perfil.id_perfil_rotina,tipo_item,value from jsonb_array_elements_text(dados->campo);
      else
        delete from public.preferencias_rotina_cliente where id_perfil_rotina = perfil.id_perfil_rotina and tipo = tipo_item;
        insert into public.preferencias_rotina_cliente(id_cliente,id_perfil_rotina,tipo,valor,id_restaurante,id_produto)
          select cliente_id,perfil.id_perfil_rotina,tipo_item,
            case when campo = 'preferencias' then value end,
            case when campo = 'restaurantes_favoritos_rotina' then value::bigint end,
            case when campo = 'pratos_favoritos_rotina' then value::bigint end
          from jsonb_array_elements_text(dados->campo);
      end if;
    end loop;
  else
    if perfil.id_perfil_rotina is null then raise sqlstate 'PT404' using message = 'Configure sua rotina'; end if;
    if operacao = 'GERAR' then
      semana := (dados->>'semana_inicio')::date;
      if semana is null or extract(isodow from semana) <> 1 or (dados->>'semana_fim')::date is distinct from semana + 6 then
        raise sqlstate '22023' using message = 'Semana invalida';
      end if;
      select * into plano from public.planejamentos_rotina where id_cliente = cliente_id and semana_inicio = semana for update;
    elsif operacao = 'APROVAR_PLANO' then
      select * into plano from public.planejamentos_rotina where id_cliente = cliente_id and id_planejamento_rotina = entidade_id for update;
    else
      select * into refeicao from public.refeicoes_planejadas where id_refeicao_planejada = entidade_id and id_cliente = cliente_id;
      if not found then raise sqlstate 'PT404' using message = 'Refeicao nao encontrada'; end if;
      select * into plano from public.planejamentos_rotina where id_planejamento_rotina = refeicao.id_planejamento_rotina and id_cliente = cliente_id for update;
    end if;
    if operacao <> 'GERAR' and plano.id_planejamento_rotina is null then
      raise sqlstate 'PT404' using message = 'Planejamento nao encontrado';
    end if;
    if versao_planejamento is null or versao_planejamento is distinct from coalesce(plano.versao,0) then
      raise sqlstate 'PT409' using message = 'O planejamento mudou em outra aba. Recarregue os dados antes de continuar.';
    end if;
    if operacao not in ('GERAR','RECUSAR') and plano.versao_perfil_origem is distinct from perfil.versao then
      raise sqlstate 'PT409' using message = 'O perfil mudou. Gere novas sugestoes antes de aprovar ou editar este planejamento.';
    end if;
    if operacao = 'GERAR' then
      if jsonb_typeof(dados->'refeicoes') is distinct from 'array' then raise exception 'Refeicoes invalidas'; end if;
      if plano.id_planejamento_rotina is null then
        insert into public.planejamentos_rotina(id_cliente,id_perfil_rotina,semana_inicio,semana_fim)
          values(cliente_id,perfil.id_perfil_rotina,semana,semana+6) returning * into plano;
      end if;
      delete from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano.id_planejamento_rotina
        and r.id_reserva is null and r.id_pedido is null and r.status not in ('CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO');
      for item in select value from jsonb_array_elements(dados->'refeicoes') loop
        if (item->>'data_refeicao')::date not between semana and semana+6 then raise exception 'Data fora da semana'; end if;
        if exists(select 1 from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano.id_planejamento_rotina
          and r.data_refeicao = (item->>'data_refeicao')::date
          and (r.id_reserva is not null or r.id_pedido is not null or r.status in ('CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO'))) then
          continue;
        end if;
        insert into public.refeicoes_planejadas(id_cliente,id_planejamento_rotina,id_restaurante,id_produto,
          data_refeicao,dia_semana,horario_sugerido,preco_estimado,distancia_km,tempo_estimado_minutos,motivo_recomendacao,pontuacao,status,metadados)
        values(cliente_id,plano.id_planejamento_rotina,(item->>'id_restaurante')::bigint,(item->>'id_produto')::bigint,
          (item->>'data_refeicao')::date,item->>'dia_semana',(item->>'horario_sugerido')::time,(item->>'preco_estimado')::numeric,
          (item->>'distancia_km')::numeric,(item->>'tempo_estimado_minutos')::int,item->>'motivo_recomendacao',
          coalesce((item->>'pontuacao')::numeric,0),'SUGERIDA',coalesce(item->'metadados','{}'::jsonb));
      end loop;
      update public.planejamentos_rotina set status = 'GERADO', resumo = coalesce(dados->'resumo','{}'::jsonb),
        versao_perfil_origem = perfil.versao where id_planejamento_rotina = plano.id_planejamento_rotina;
      acao := 'PLANEJAMENTO_GERADO';
    elsif operacao = 'APROVAR_PLANO' then
      update public.refeicoes_planejadas set status = 'APROVADA' where id_planejamento_rotina = plano.id_planejamento_rotina
        and status in ('SUGERIDA','ALTERADA') and id_restaurante is not null and id_reserva is null and id_pedido is null;
      update public.planejamentos_rotina set status = 'APROVADO' where id_planejamento_rotina = plano.id_planejamento_rotina;
      acao := 'PLANEJAMENTO_APROVADO';
    elsif operacao in ('EDITAR','APROVAR','RECUSAR') then
      select * into refeicao from public.refeicoes_planejadas where id_refeicao_planejada = entidade_id and id_cliente = cliente_id for update;
      if refeicao.id_reserva is not null or refeicao.id_pedido is not null or refeicao.status not in ('SUGERIDA','ALTERADA','APROVADA','RECUSADA') then
        raise sqlstate 'PT409' using message = 'Esta refeicao nao pode mais ser alterada';
      end if;
      if operacao = 'EDITAR' then
        update public.refeicoes_planejadas set id_restaurante = (dados->>'id_restaurante')::bigint,
          id_produto = (dados->>'id_produto')::bigint, horario_sugerido = (dados->>'horario_sugerido')::time,
          preco_estimado = (dados->>'preco_estimado')::numeric, distancia_km = (dados->>'distancia_km')::numeric,
          tempo_estimado_minutos = (dados->>'tempo_estimado_minutos')::int, pontuacao = (dados->>'pontuacao')::numeric,
          motivo_recomendacao = dados->>'motivo_recomendacao', metadados = '{}'::jsonb, status = 'ALTERADA'
          where id_refeicao_planejada = entidade_id returning * into refeicao;
        acao := 'REFEICAO_ALTERADA';
      else
        if operacao = 'APROVAR' and refeicao.id_restaurante is null then raise exception 'Escolha uma sugestao'; end if;
        update public.refeicoes_planejadas set status = case when operacao = 'APROVAR' then 'APROVADA' else 'RECUSADA' end
          where id_refeicao_planejada = entidade_id returning * into refeicao;
        acao := case when operacao = 'APROVAR' then 'REFEICAO_APROVADA' else 'REFEICAO_RECUSADA' end;
      end if;
      update public.planejamentos_rotina set status = 'PARCIAL' where id_planejamento_rotina = plano.id_planejamento_rotina;
    else
      raise exception 'Operacao invalida';
    end if;
    -- The generator includes converted costs. Verify the resulting budget as well.
    select coalesce(sum(preco_estimado),0) into soma from public.refeicoes_planejadas
      where id_planejamento_rotina = plano.id_planejamento_rotina and status not in ('RECUSADA','CANCELADA');
    if operacao in ('GERAR','EDITAR','APROVAR','APROVAR_PLANO') and perfil.orcamento_semanal is not null and soma > perfil.orcamento_semanal then
      raise sqlstate 'PT409' using message = 'O planejamento ultrapassa o orcamento semanal atual';
    end if;
    update public.planejamentos_rotina set versao = versao_planejamento + 1
      where id_planejamento_rotina = plano.id_planejamento_rotina returning * into plano;
    perform appono_private.resumo_rotina(plano.id_planejamento_rotina);
  end if;
  insert into public.historico_rotina_cliente(id_cliente,id_perfil_rotina,id_planejamento_rotina,id_refeicao_planejada,acao,dados)
    values(cliente_id,perfil.id_perfil_rotina,plano.id_planejamento_rotina,refeicao.id_refeicao_planejada,acao,
      jsonb_build_object('versao_perfil',perfil.versao,'versao_planejamento',plano.versao));
  -- Return the committed snapshot in this RPC, without a fallible REST read after it.
  select * into plano from public.planejamentos_rotina where id_planejamento_rotina = plano.id_planejamento_rotina;
  return jsonb_build_object('perfil',to_jsonb(perfil),'planejamento',to_jsonb(plano),'refeicao',to_jsonb(refeicao),
    'preferencias',coalesce((select jsonb_agg(to_jsonb(p)) from public.preferencias_rotina_cliente p
      where p.id_perfil_rotina = perfil.id_perfil_rotina),'[]'::jsonb),
    'restricoes',coalesce((select jsonb_agg(to_jsonb(r)) from public.restricoes_rotina_cliente r
      where r.id_perfil_rotina = perfil.id_perfil_rotina),'[]'::jsonb),
    'refeicoes',coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object(
      'restaurantes',(select jsonb_build_object('id_restaurante',s.id_restaurante,'nome',s.nome,'endereco',s.endereco,
        'logo_url',s.logo_url,'valor_minimo_reserva_por_pessoa',s.valor_minimo_reserva_por_pessoa) from public.restaurantes s where s.id_restaurante = r.id_restaurante),
      'produtos',(select jsonb_build_object('id_produto',p.id_produto,'nome',p.nome,'descricao',p.descricao,'preco',p.preco,'imagem_url',p.imagem_url)
        from public.produtos p where p.id_produto = r.id_produto),
      'reservas',(select jsonb_build_object('id_reserva',v.id_reserva,'status_reserva',v.status_reserva,'data_reserva',v.data_reserva,'horario_inicio',v.horario_inicio)
        from public.reservas v where v.id_reserva = r.id_reserva),
      'pedidos',(select jsonb_build_object('id_pedido',p.id_pedido,'status_pedido',p.status_pedido,'valor_total',p.valor_total)
        from public.pedidos p where p.id_pedido = r.id_pedido)) order by r.data_refeicao)
      from public.refeicoes_planejadas r where r.id_planejamento_rotina = plano.id_planejamento_rotina),'[]'::jsonb));
end $$;
revoke all on function public.mutar_rotina(uuid,text,bigint,bigint,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.mutar_rotina(uuid,text,bigint,bigint,bigint,jsonb) to service_role;

-- Keep existing reservation/payment business rules in a non-callable helper.
drop function public.converter_refeicao_rotina(bigint,boolean);
alter function appono_private.converter_refeicao_rotina(bigint,boolean) rename to converter_refeicao_rotina_original;
revoke all on function appono_private.converter_refeicao_rotina_original(bigint,boolean) from public,anon,authenticated,service_role;

-- Definer is required to coordinate read-only customer tables and the existing
-- reservation functions. Ownership comes exclusively from the signed auth.uid().
create function appono_private.converter_refeicao_rotina(refeicao_id bigint, com_pedido boolean,
  versao_perfil bigint, versao_planejamento bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare cliente_id bigint; plano public.planejamentos_rotina; resultado jsonb;
begin
  cliente_id := appono_private.travar_rotina((select auth.uid()),versao_perfil);
  select p.* into plano from public.planejamentos_rotina p join public.refeicoes_planejadas r
    on r.id_planejamento_rotina = p.id_planejamento_rotina
    where r.id_refeicao_planejada = refeicao_id and r.id_cliente = cliente_id and p.id_cliente = cliente_id for update of p;
  if not found then raise sqlstate 'PT404' using message = 'Refeicao nao encontrada'; end if;
  if versao_planejamento is null or versao_planejamento is distinct from plano.versao then
    raise sqlstate 'PT409' using message = 'O planejamento mudou em outra aba. Recarregue os dados antes de continuar.';
  end if;
  if plano.versao_perfil_origem is distinct from versao_perfil then
    raise sqlstate 'PT409' using message = 'O perfil mudou. Gere novas sugestoes antes de converter esta refeicao.';
  end if;
  resultado := appono_private.converter_refeicao_rotina_original(refeicao_id,com_pedido);
  if com_pedido then
    update public.refeicoes_planejadas set preco_estimado = (resultado->'pedido'->>'valor_total')::numeric
      where id_refeicao_planejada = refeicao_id;
    resultado := jsonb_set(resultado,'{refeicao}',(select to_jsonb(r) from public.refeicoes_planejadas r where r.id_refeicao_planejada = refeicao_id));
  end if;
  update public.planejamentos_rotina set versao = versao + 1, status = 'PARCIAL'
    where id_planejamento_rotina = plano.id_planejamento_rotina;
  perform appono_private.resumo_rotina(plano.id_planejamento_rotina);
  return resultado;
end $$;
revoke all on function appono_private.converter_refeicao_rotina(bigint,boolean,bigint,bigint) from public,anon;
grant execute on function appono_private.converter_refeicao_rotina(bigint,boolean,bigint,bigint) to authenticated;
create function public.converter_refeicao_rotina(refeicao_id bigint, com_pedido boolean, versao_perfil bigint, versao_planejamento bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select appono_private.converter_refeicao_rotina(refeicao_id,com_pedido,versao_perfil,versao_planejamento);
$$;
revoke all on function public.converter_refeicao_rotina(bigint,boolean,bigint,bigint) from public,anon;
grant execute on function public.converter_refeicao_rotina(bigint,boolean,bigint,bigint) to authenticated;

commit;
