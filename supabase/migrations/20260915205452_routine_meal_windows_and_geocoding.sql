begin;

alter table public.perfis_rotina_cliente
  add column if not exists endereco_normalizado text,
  add column if not exists geocodificado_em timestamptz,
  add column if not exists status_geocodificacao text not null default 'PENDENTE',
  add constraint perfis_rotina_cliente_geocodificacao_check check (status_geocodificacao in ('PENDENTE','CONFIRMADO','AMBIGUO','FALHOU'));

create table public.janelas_alimentacao_rotina (
  id_janela_alimentacao bigserial primary key,
  id_perfil_rotina bigint not null references public.perfis_rotina_cliente(id_perfil_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  tipo text not null,
  nome text not null,
  dias_semana text[] not null,
  horario_inicio time not null,
  horario_fim time not null,
  tempo_maximo_minutos integer not null,
  orcamento_por_refeicao numeric(10,2),
  raio_km numeric(6,2),
  ativa boolean not null default true,
  ordem smallint not null default 0,
  versao bigint not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint janelas_rotina_tipo_check check (tipo in ('CAFE','ALMOCO','JANTAR','PERSONALIZADA')),
  constraint janelas_rotina_nome_check check (char_length(trim(nome)) between 2 and 50),
  constraint janelas_rotina_horario_check check (horario_inicio < horario_fim),
  constraint janelas_rotina_tempo_check check (tempo_maximo_minutos between 30 and 240 and tempo_maximo_minutos * 60 <= extract(epoch from horario_fim - horario_inicio)),
  constraint janelas_rotina_dias_check check (cardinality(dias_semana) > 0 and array_position(dias_semana, null) is null and dias_semana <@ array['monday','tuesday','wednesday','thursday','friday','saturday','sunday']::text[]),
  constraint janelas_rotina_orcamento_check check (orcamento_por_refeicao is null or orcamento_por_refeicao >= 0),
  constraint janelas_rotina_raio_check check (raio_km is null or raio_km between 1 and 100),
  constraint janelas_rotina_ordem_check check (ordem between 0 and 99)
);
create index janelas_rotina_perfil_idx on public.janelas_alimentacao_rotina(id_perfil_rotina, ativa, ordem);
create unique index janelas_rotina_nome_ativo_uidx on public.janelas_alimentacao_rotina(id_perfil_rotina, lower(nome)) where ativa;
create trigger set_updated_at_janelas_alimentacao_rotina before update on public.janelas_alimentacao_rotina for each row execute function public.set_atualizado_em();
grant usage, select on sequence public.janelas_alimentacao_rotina_id_janela_alimentacao_seq to service_role;

insert into public.janelas_alimentacao_rotina(id_perfil_rotina,id_cliente,tipo,nome,dias_semana,horario_inicio,horario_fim,tempo_maximo_minutos,orcamento_por_refeicao,raio_km,ordem)
select p.id_perfil_rotina,p.id_cliente,'ALMOCO','Almoço',p.dias_semana,p.horario_inicio,p.horario_fim,p.tempo_maximo_minutos,p.orcamento_diario,p.raio_km,0
from public.perfis_rotina_cliente p
where p.ativo and not exists (select 1 from public.janelas_alimentacao_rotina j where j.id_perfil_rotina = p.id_perfil_rotina);

alter table public.refeicoes_planejadas add column if not exists id_janela_alimentacao bigint references public.janelas_alimentacao_rotina(id_janela_alimentacao) on delete restrict;
update public.refeicoes_planejadas r set id_janela_alimentacao = j.id_janela_alimentacao
from public.planejamentos_rotina p join public.janelas_alimentacao_rotina j on j.id_perfil_rotina = p.id_perfil_rotina and j.tipo = 'ALMOCO' and j.ordem = 0
where r.id_planejamento_rotina = p.id_planejamento_rotina and r.id_janela_alimentacao is null;
do $$ begin
  if exists (select 1 from public.refeicoes_planejadas where id_janela_alimentacao is null) then
    raise exception 'Refeicoes antigas sem janela. Corrija antes de aplicar a migration.';
  end if;
end $$;
alter table public.refeicoes_planejadas alter column id_janela_alimentacao set not null;
drop index if exists public.refeicoes_planejadas_planejamento_data_uidx;
create unique index refeicoes_planejadas_planejamento_data_janela_uidx on public.refeicoes_planejadas(id_planejamento_rotina,data_refeicao,id_janela_alimentacao);
create index refeicoes_planejadas_janela_idx on public.refeicoes_planejadas(id_janela_alimentacao,data_refeicao,status);

alter table public.janelas_alimentacao_rotina enable row level security;
revoke all on public.janelas_alimentacao_rotina from public, anon, authenticated;
grant all on public.janelas_alimentacao_rotina to service_role;

create or replace function appono_private.salvar_rotina_com_janelas(p_actor uuid,p_versao_perfil bigint,p_dados jsonb,p_janelas jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare resultado jsonb; perfil_id bigint; cliente_id bigint; item jsonb; janela_id bigint; ids bigint[] := '{}';
begin
  if jsonb_typeof(p_janelas) is distinct from 'array' or jsonb_array_length(p_janelas) < 1 or jsonb_array_length(p_janelas) > 8 then
    raise sqlstate '22023' using message = 'Informe entre uma e oito janelas alimentares';
  end if;
  resultado := public.mutar_rotina(p_actor,'PERFIL',p_versao_perfil,null,null,p_dados);
  perfil_id := (resultado->'perfil'->>'id_perfil_rotina')::bigint;
  cliente_id := (resultado->'perfil'->>'id_cliente')::bigint;
  if p_dados ? 'endereco_normalizado' then
    update public.perfis_rotina_cliente set
      endereco_normalizado = nullif(trim(p_dados->>'endereco_normalizado'), ''),
      status_geocodificacao = coalesce(nullif(p_dados->>'status_geocodificacao', ''), 'CONFIRMADO'),
      geocodificado_em = coalesce((p_dados->>'geocodificado_em')::timestamptz, now())
      where id_perfil_rotina = perfil_id;
  end if;
  for item in select value from jsonb_array_elements(p_janelas) loop
    if (item->>'tipo') not in ('CAFE','ALMOCO','JANTAR','PERSONALIZADA') or char_length(trim(coalesce(item->>'nome',''))) not between 2 and 50
      or jsonb_typeof(item->'dias_semana') is distinct from 'array' then raise sqlstate '22023' using message = 'Janela alimentar invalida'; end if;
    janela_id := nullif(item->>'id_janela_alimentacao','')::bigint;
    if janela_id is not null then
      update public.janelas_alimentacao_rotina set tipo=item->>'tipo',nome=trim(item->>'nome'),dias_semana=array(select jsonb_array_elements_text(item->'dias_semana')),
        horario_inicio=(item->>'horario_inicio')::time,horario_fim=(item->>'horario_fim')::time,tempo_maximo_minutos=(item->>'tempo_maximo_minutos')::int,
        orcamento_por_refeicao=nullif(item->>'orcamento_por_refeicao','')::numeric,raio_km=nullif(item->>'raio_km','')::numeric,ativa=coalesce((item->>'ativa')::boolean,true),ordem=coalesce((item->>'ordem')::smallint,0),versao=versao+1
        where id_janela_alimentacao=janela_id and id_perfil_rotina=perfil_id returning id_janela_alimentacao into janela_id;
      if janela_id is null then raise sqlstate 'PT404' using message = 'Janela alimentar nao encontrada'; end if;
    else
      insert into public.janelas_alimentacao_rotina(id_perfil_rotina,id_cliente,tipo,nome,dias_semana,horario_inicio,horario_fim,tempo_maximo_minutos,orcamento_por_refeicao,raio_km,ativa,ordem)
        values(perfil_id,cliente_id,item->>'tipo',trim(item->>'nome'),array(select jsonb_array_elements_text(item->'dias_semana')),(item->>'horario_inicio')::time,(item->>'horario_fim')::time,(item->>'tempo_maximo_minutos')::int,nullif(item->>'orcamento_por_refeicao','')::numeric,nullif(item->>'raio_km','')::numeric,coalesce((item->>'ativa')::boolean,true),coalesce((item->>'ordem')::smallint,0)) returning id_janela_alimentacao into janela_id;
    end if;
    ids := array_append(ids,janela_id);
  end loop;
  update public.janelas_alimentacao_rotina set ativa=false,versao=versao+1 where id_perfil_rotina=perfil_id and not (id_janela_alimentacao = any(ids));
  select jsonb_set(resultado, '{perfil}', to_jsonb(p), true) into resultado from public.perfis_rotina_cliente p where p.id_perfil_rotina = perfil_id;
  return resultado || jsonb_build_object('janelas_alimentacao',(select coalesce(jsonb_agg(to_jsonb(j) order by j.ordem,j.id_janela_alimentacao),'[]'::jsonb) from public.janelas_alimentacao_rotina j where j.id_perfil_rotina=perfil_id));
end $$;
revoke all on function appono_private.salvar_rotina_com_janelas(uuid,bigint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function appono_private.salvar_rotina_com_janelas(uuid,bigint,jsonb,jsonb) to service_role;
create or replace function public.salvar_rotina_com_janelas(p_actor uuid,p_versao_perfil bigint,p_dados jsonb,p_janelas jsonb)
returns jsonb language sql security invoker set search_path = '' as $$ select appono_private.salvar_rotina_com_janelas(p_actor,p_versao_perfil,p_dados,p_janelas); $$;
revoke all on function public.salvar_rotina_com_janelas(uuid,bigint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.salvar_rotina_com_janelas(uuid,bigint,jsonb,jsonb) to service_role;

-- Evolui a mutacao existente sem alterar a migration historica: refeicoes passam a
-- ser preservadas e recriadas por data e janela, em vez de apenas por data.
create or replace function public.mutar_rotina(actor_id uuid, operacao text, versao_perfil bigint,
  versao_planejamento bigint default null, entidade_id bigint default null, dados jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  cliente_id bigint; perfil public.perfis_rotina_cliente; plano public.planejamentos_rotina;
  refeicao public.refeicoes_planejadas; novo public.perfis_rotina_cliente;
  item jsonb; campo text; tipo_item text; permitido jsonb; semana date; acao text; soma numeric;
begin
  cliente_id := appono_private.travar_rotina(actor_id, versao_perfil);
  select * into perfil from public.perfis_rotina_cliente where id_cliente = cliente_id and ativo;
  if operacao = 'PERFIL' then
    select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into permitido from jsonb_each(dados)
      where key = any(array['nome','endereco_base','latitude','longitude','dias_semana','horario_inicio','horario_fim','tempo_maximo_minutos','orcamento_diario','orcamento_semanal','raio_km','origem_agenda','eventos_importados','janelas_disponiveis']);
    if perfil.id_perfil_rotina is null then
      insert into public.perfis_rotina_cliente(id_cliente) values(cliente_id) returning * into perfil; acao := 'PERFIL_CRIADO';
    else acao := 'PERFIL_ATUALIZADO'; end if;
    novo := jsonb_populate_record(perfil, permitido);
    update public.perfis_rotina_cliente set nome=novo.nome,endereco_base=novo.endereco_base,latitude=novo.latitude,longitude=novo.longitude,
      dias_semana=novo.dias_semana,horario_inicio=novo.horario_inicio,horario_fim=novo.horario_fim,tempo_maximo_minutos=novo.tempo_maximo_minutos,
      orcamento_diario=novo.orcamento_diario,orcamento_semanal=novo.orcamento_semanal,raio_km=novo.raio_km,origem_agenda=novo.origem_agenda,
      eventos_importados=novo.eventos_importados,janelas_disponiveis=novo.janelas_disponiveis,versao=versao_perfil+1
      where id_perfil_rotina=perfil.id_perfil_rotina returning * into perfil;
    foreach campo in array array['preferencias','restaurantes_favoritos_rotina','pratos_favoritos_rotina','restricoes','alergias'] loop
      if not (dados ? campo) then continue; end if;
      if jsonb_typeof(dados->campo) is distinct from 'array' then raise sqlstate '22023' using message='Selecoes devem ser listas, nao null'; end if;
      tipo_item := case campo when 'preferencias' then 'PREFERENCIA' when 'restaurantes_favoritos_rotina' then 'RESTAURANTE_FAVORITO' when 'pratos_favoritos_rotina' then 'PRATO_FAVORITO' when 'restricoes' then 'RESTRICAO' else 'ALERGIA' end;
      if campo in ('restricoes','alergias') then
        delete from public.restricoes_rotina_cliente where id_perfil_rotina=perfil.id_perfil_rotina and tipo=tipo_item;
        insert into public.restricoes_rotina_cliente(id_cliente,id_perfil_rotina,tipo,valor) select cliente_id,perfil.id_perfil_rotina,tipo_item,value from jsonb_array_elements_text(dados->campo);
      else
        delete from public.preferencias_rotina_cliente where id_perfil_rotina=perfil.id_perfil_rotina and tipo=tipo_item;
        insert into public.preferencias_rotina_cliente(id_cliente,id_perfil_rotina,tipo,valor,id_restaurante,id_produto)
          select cliente_id,perfil.id_perfil_rotina,tipo_item,case when campo='preferencias' then value end,case when campo='restaurantes_favoritos_rotina' then value::bigint end,case when campo='pratos_favoritos_rotina' then value::bigint end from jsonb_array_elements_text(dados->campo);
      end if;
    end loop;
  else
    if perfil.id_perfil_rotina is null then raise sqlstate 'PT404' using message='Configure sua rotina'; end if;
    if operacao='GERAR' then
      semana := (dados->>'semana_inicio')::date;
      if semana is null or extract(isodow from semana)<>1 or (dados->>'semana_fim')::date is distinct from semana+6 then raise sqlstate '22023' using message='Semana invalida'; end if;
      select * into plano from public.planejamentos_rotina where id_cliente=cliente_id and semana_inicio=semana for update;
    elsif operacao='APROVAR_PLANO' then
      select * into plano from public.planejamentos_rotina where id_cliente=cliente_id and id_planejamento_rotina=entidade_id for update;
    else
      select * into refeicao from public.refeicoes_planejadas where id_refeicao_planejada=entidade_id and id_cliente=cliente_id;
      if not found then raise sqlstate 'PT404' using message='Refeicao nao encontrada'; end if;
      select * into plano from public.planejamentos_rotina where id_planejamento_rotina=refeicao.id_planejamento_rotina and id_cliente=cliente_id for update;
    end if;
    if operacao<>'GERAR' and plano.id_planejamento_rotina is null then raise sqlstate 'PT404' using message='Planejamento nao encontrado'; end if;
    if versao_planejamento is null or versao_planejamento is distinct from coalesce(plano.versao,0) then raise sqlstate 'PT409' using message='O planejamento mudou em outra aba. Recarregue os dados antes de continuar.'; end if;
    if operacao not in ('GERAR','RECUSAR') and plano.versao_perfil_origem is distinct from perfil.versao then raise sqlstate 'PT409' using message='O perfil mudou. Gere novas sugestoes antes de aprovar ou editar este planejamento.'; end if;
    if operacao='GERAR' then
      if jsonb_typeof(dados->'refeicoes') is distinct from 'array' then raise exception 'Refeicoes invalidas'; end if;
      if plano.id_planejamento_rotina is null then insert into public.planejamentos_rotina(id_cliente,id_perfil_rotina,semana_inicio,semana_fim) values(cliente_id,perfil.id_perfil_rotina,semana,semana+6) returning * into plano; end if;
      delete from public.refeicoes_planejadas r where r.id_planejamento_rotina=plano.id_planejamento_rotina and r.id_reserva is null and r.id_pedido is null and r.status not in ('CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO');
      for item in select value from jsonb_array_elements(dados->'refeicoes') loop
        if (item->>'data_refeicao')::date not between semana and semana+6 or nullif(item->>'id_janela_alimentacao','')::bigint is null then raise sqlstate '22023' using message='Refeicao ou janela invalidas'; end if;
        if not exists (select 1 from public.janelas_alimentacao_rotina j where j.id_janela_alimentacao=(item->>'id_janela_alimentacao')::bigint and j.id_perfil_rotina=perfil.id_perfil_rotina and j.ativa) then raise sqlstate 'PT404' using message='Janela alimentar indisponivel'; end if;
        if exists(select 1 from public.refeicoes_planejadas r where r.id_planejamento_rotina=plano.id_planejamento_rotina and r.data_refeicao=(item->>'data_refeicao')::date and r.id_janela_alimentacao=(item->>'id_janela_alimentacao')::bigint and (r.id_reserva is not null or r.id_pedido is not null or r.status in ('CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO'))) then continue; end if;
        insert into public.refeicoes_planejadas(id_cliente,id_planejamento_rotina,id_janela_alimentacao,id_restaurante,id_produto,data_refeicao,dia_semana,horario_sugerido,preco_estimado,distancia_km,tempo_estimado_minutos,motivo_recomendacao,pontuacao,status,metadados)
          values(cliente_id,plano.id_planejamento_rotina,(item->>'id_janela_alimentacao')::bigint,(item->>'id_restaurante')::bigint,(item->>'id_produto')::bigint,(item->>'data_refeicao')::date,item->>'dia_semana',(item->>'horario_sugerido')::time,(item->>'preco_estimado')::numeric,(item->>'distancia_km')::numeric,(item->>'tempo_estimado_minutos')::int,item->>'motivo_recomendacao',coalesce((item->>'pontuacao')::numeric,0),'SUGERIDA',coalesce(item->'metadados','{}'::jsonb));
      end loop;
      update public.planejamentos_rotina set status='GERADO',resumo=coalesce(dados->'resumo','{}'::jsonb),versao_perfil_origem=perfil.versao where id_planejamento_rotina=plano.id_planejamento_rotina; acao:='PLANEJAMENTO_GERADO';
    elsif operacao='APROVAR_PLANO' then
      update public.refeicoes_planejadas set status='APROVADA' where id_planejamento_rotina=plano.id_planejamento_rotina and status in ('SUGERIDA','ALTERADA') and id_restaurante is not null and id_reserva is null and id_pedido is null;
      update public.planejamentos_rotina set status='APROVADO' where id_planejamento_rotina=plano.id_planejamento_rotina; acao:='PLANEJAMENTO_APROVADO';
    elsif operacao in ('EDITAR','APROVAR','RECUSAR') then
      select * into refeicao from public.refeicoes_planejadas where id_refeicao_planejada=entidade_id and id_cliente=cliente_id for update;
      if refeicao.id_reserva is not null or refeicao.id_pedido is not null or refeicao.status not in ('SUGERIDA','ALTERADA','APROVADA','RECUSADA') then raise sqlstate 'PT409' using message='Esta refeicao nao pode mais ser alterada'; end if;
      if operacao='EDITAR' then
        update public.refeicoes_planejadas set id_restaurante=(dados->>'id_restaurante')::bigint,id_produto=(dados->>'id_produto')::bigint,horario_sugerido=(dados->>'horario_sugerido')::time,preco_estimado=(dados->>'preco_estimado')::numeric,distancia_km=(dados->>'distancia_km')::numeric,tempo_estimado_minutos=(dados->>'tempo_estimado_minutos')::int,pontuacao=(dados->>'pontuacao')::numeric,motivo_recomendacao=dados->>'motivo_recomendacao',metadados='{}'::jsonb,status='ALTERADA' where id_refeicao_planejada=entidade_id returning * into refeicao; acao:='REFEICAO_ALTERADA';
      else
        if operacao='APROVAR' and refeicao.id_restaurante is null then raise exception 'Escolha uma sugestao'; end if;
        update public.refeicoes_planejadas set status=case when operacao='APROVAR' then 'APROVADA' else 'RECUSADA' end where id_refeicao_planejada=entidade_id returning * into refeicao; acao:=case when operacao='APROVAR' then 'REFEICAO_APROVADA' else 'REFEICAO_RECUSADA' end;
      end if;
      update public.planejamentos_rotina set status='PARCIAL' where id_planejamento_rotina=plano.id_planejamento_rotina;
    else raise exception 'Operacao invalida'; end if;
    select coalesce(sum(preco_estimado),0) into soma from public.refeicoes_planejadas where id_planejamento_rotina=plano.id_planejamento_rotina and status not in ('RECUSADA','CANCELADA');
    if operacao in ('GERAR','EDITAR','APROVAR','APROVAR_PLANO') and perfil.orcamento_semanal is not null and soma>perfil.orcamento_semanal then raise sqlstate 'PT409' using message='O planejamento ultrapassa o orcamento semanal atual'; end if;
    update public.planejamentos_rotina set versao=versao_planejamento+1 where id_planejamento_rotina=plano.id_planejamento_rotina returning * into plano;
    perform appono_private.resumo_rotina(plano.id_planejamento_rotina);
  end if;
  insert into public.historico_rotina_cliente(id_cliente,id_perfil_rotina,id_planejamento_rotina,id_refeicao_planejada,acao,dados) values(cliente_id,perfil.id_perfil_rotina,plano.id_planejamento_rotina,refeicao.id_refeicao_planejada,acao,jsonb_build_object('versao_perfil',perfil.versao,'versao_planejamento',plano.versao));
  select * into plano from public.planejamentos_rotina where id_planejamento_rotina=plano.id_planejamento_rotina;
  return jsonb_build_object('perfil',to_jsonb(perfil),'planejamento',to_jsonb(plano),'refeicao',to_jsonb(refeicao),'preferencias',coalesce((select jsonb_agg(to_jsonb(p)) from public.preferencias_rotina_cliente p where p.id_perfil_rotina=perfil.id_perfil_rotina),'[]'::jsonb),'restricoes',coalesce((select jsonb_agg(to_jsonb(r)) from public.restricoes_rotina_cliente r where r.id_perfil_rotina=perfil.id_perfil_rotina),'[]'::jsonb),'refeicoes',coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('restaurantes',(select jsonb_build_object('id_restaurante',s.id_restaurante,'nome',s.nome,'endereco',s.endereco,'logo_url',s.logo_url,'valor_minimo_reserva_por_pessoa',s.valor_minimo_reserva_por_pessoa) from public.restaurantes s where s.id_restaurante=r.id_restaurante),'produtos',(select jsonb_build_object('id_produto',p.id_produto,'nome',p.nome,'descricao',p.descricao,'preco',p.preco,'imagem_url',p.imagem_url) from public.produtos p where p.id_produto=r.id_produto),'reservas',(select jsonb_build_object('id_reserva',v.id_reserva,'status_reserva',v.status_reserva,'data_reserva',v.data_reserva,'horario_inicio',v.horario_inicio) from public.reservas v where v.id_reserva=r.id_reserva),'pedidos',(select jsonb_build_object('id_pedido',p.id_pedido,'status_pedido',p.status_pedido,'valor_total',p.valor_total) from public.pedidos p where p.id_pedido=r.id_pedido)) order by r.data_refeicao,r.horario_sugerido) from public.refeicoes_planejadas r where r.id_planejamento_rotina=plano.id_planejamento_rotina),'[]'::jsonb));
end $$;
revoke all on function public.mutar_rotina(uuid,text,bigint,bigint,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.mutar_rotina(uuid,text,bigint,bigint,bigint,jsonb) to service_role;

commit;
