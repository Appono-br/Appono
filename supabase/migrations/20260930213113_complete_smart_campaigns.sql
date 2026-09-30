begin;

alter table public.campanhas_inteligentes_restaurante
 add column versao bigint not null default 1,
 add column beneficio_itens jsonb not null default '[]',
 add column preco_combo numeric(10,2),
 add column precisa_configuracao boolean not null default false;
alter table public.campanhas_inteligentes_restaurante add constraint campanha_itens_array check(jsonb_typeof(beneficio_itens)='array');
update public.campanhas_inteligentes_restaurante set precisa_configuracao=true
 where tipo_beneficio not in ('DESCONTO_FIXO','DESCONTO_PERCENTUAL');
alter table public.resgates_campanha_inteligente
 add column condicoes jsonb not null default '{}',
 add column entregue_em timestamptz,
 add column entregue_por uuid,
 add column cancelado_em timestamptz;
alter table public.eventos_campanha_inteligente add column chave_deduplicacao text;
create unique index campanha_evento_deduplicacao on public.eventos_campanha_inteligente(id_campanha,tipo,chave_deduplicacao) where chave_deduplicacao is not null;
alter table public.consentimentos_ofertas_cliente add column versao_texto text not null default 'ofertas-v1';

create or replace function appono_private.campanha_profissional(p_restaurante bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.assinaturas_restaurante a join public.restaurantes r using(id_restaurante)
 where a.id_restaurante=p_restaurante and r.ativo and a.codigo_plano='PROFISSIONAL' and a.status='ATIVA'
 and (a.periodo_fim_em is null or a.periodo_fim_em>now()));
$$;
revoke all on function appono_private.campanha_profissional(bigint) from public,anon,authenticated;

create or replace function public.salvar_campanha_atomica(p_actor uuid,p_id bigint,p_versao bigint,p_dados jsonb)
returns public.campanhas_inteligentes_restaurante language plpgsql security definer set search_path='' as $$
declare r bigint; c public.campanhas_inteligentes_restaurante; n public.campanhas_inteligentes_restaurante;
 ids bigint[]; it jsonb; pid bigint; qtd integer;
begin
 select id_restaurante into r from public.restaurantes where id_auth=p_actor;
 if r is null or not appono_private.campanha_profissional(r) then raise exception 'Plano Profissional ativo necessario'; end if;
 if p_id is not null then
  select * into c from public.campanhas_inteligentes_restaurante where id_campanha=p_id and id_restaurante=r for update;
  if not found then raise exception 'Campanha nao encontrada'; end if;
  if p_versao is distinct from c.versao then raise sqlstate 'PT409' using message='A campanha mudou. Recarregue antes de salvar.'; end if;
  if c.status in ('ENCERRADA','EXPIRADA') then raise exception 'Campanha finalizada nao pode ser editada'; end if;
 else
  c.id_restaurante:=r; c.usos_confirmados:=0; c.versao:=0;
 end if;
 n:=jsonb_populate_record(c,p_dados - array['id_campanha','id_restaurante','usos_confirmados','versao','criado_em','atualizado_em','precisa_configuracao']);
 if n.titulo is null or char_length(trim(n.titulo)) not between 3 and 120
 or n.inicio_em is null or n.fim_em is null or n.fim_em<=n.inicio_em
 or n.limite_usos is null or n.limite_usos not between 1 and 100000 or n.limite_usos<c.usos_confirmados
 or n.status is null or n.status not in ('RASCUNHO','AGENDADA','ATIVA','PAUSADA','ENCERRADA')
 then raise exception 'Dados ou transicao da campanha invalidos'; end if;
 if n.tipo_beneficio is null or n.tipo_beneficio not in ('DESCONTO_FIXO','DESCONTO_PERCENTUAL','ITEM_CORTESIA','BEBIDA','ENTRADA','SOBREMESA','COMBO') then raise exception 'Beneficio invalido'; end if;
 if n.tipo_beneficio in ('DESCONTO_FIXO','DESCONTO_PERCENTUAL') and (n.valor_beneficio is null or n.valor_beneficio<=0 or (n.tipo_beneficio='DESCONTO_PERCENTUAL' and n.valor_beneficio>100)) then raise exception 'Desconto invalido'; end if;
 if n.status in ('AGENDADA','ATIVA') then
  if n.fim_em<=now() then raise exception 'Validade deve terminar no futuro'; end if;
  n.status:=case when n.inicio_em>now() then 'AGENDADA' when c.usos_confirmados>=n.limite_usos then 'ESGOTADA' else 'ATIVA' end;
 end if;
 if jsonb_typeof(coalesce(p_dados->'produtos','[]'))<>'array' then raise exception 'Produtos invalidos'; end if;
 ids:=array(select distinct value::bigint from jsonb_array_elements_text(coalesce(p_dados->'produtos','[]')));
 if exists(select 1 from unnest(ids) x where not exists(select 1 from public.produtos p where p.id_produto=x and p.id_restaurante=r and p.disponivel and not coalesce(p.arquivado,false))) then raise exception 'Produto indisponivel ou de outro restaurante'; end if;
 n.beneficio_itens:=coalesce(n.beneficio_itens,'[]');
 if jsonb_typeof(n.beneficio_itens)<>'array' or jsonb_array_length(n.beneficio_itens)>20 then raise exception 'Itens do beneficio invalidos'; end if;
 if n.tipo_beneficio not in ('DESCONTO_FIXO','DESCONTO_PERCENTUAL') and jsonb_array_length(n.beneficio_itens)=0 then raise exception 'Configure os produtos oferecidos'; end if;
 if n.tipo_beneficio='COMBO' and (n.preco_combo is null or n.preco_combo<0) then raise exception 'Informe o preco do combo'; end if;
 for it in select value from jsonb_array_elements(n.beneficio_itens) loop
  pid:=(it->>'id_produto')::bigint; qtd:=(it->>'quantidade')::integer;
  if qtd is null or qtd not between 1 and 100 or not exists(select 1 from public.produtos where id_produto=pid and id_restaurante=r and disponivel and not coalesce(arquivado,false)) then raise exception 'Item do beneficio indisponivel'; end if;
 end loop;
 if (select count(*) from jsonb_array_elements(n.beneficio_itens))<>(select count(distinct value->>'id_produto') from jsonb_array_elements(n.beneficio_itens)) then raise exception 'Produto repetido no beneficio'; end if;
 if p_id is null then
  insert into public.campanhas_inteligentes_restaurante(id_restaurante,titulo,tipo_beneficio,valor_beneficio,inicio_em,fim_em,limite_usos)
  values(r,n.titulo,n.tipo_beneficio,n.valor_beneficio,n.inicio_em,n.fim_em,n.limite_usos) returning id_campanha into p_id;
 end if;
 update public.campanhas_inteligentes_restaurante set titulo=trim(n.titulo),descricao=n.descricao,imagem_url=n.imagem_url,
 tipo_beneficio=n.tipo_beneficio,valor_beneficio=n.valor_beneficio,regras=n.regras,inicio_em=n.inicio_em,fim_em=n.fim_em,
 limite_usos=n.limite_usos,minimo_pessoas=n.minimo_pessoas,minimo_itens=n.minimo_itens,status=n.status,
 beneficio_itens=n.beneficio_itens,preco_combo=n.preco_combo,precisa_configuracao=false,versao=c.versao+1
 where id_campanha=p_id returning * into n;
 delete from public.campanhas_inteligentes_produtos where id_campanha=p_id;
 insert into public.campanhas_inteligentes_produtos select p_id,unnest(ids);
 return n;
end $$;
revoke all on function public.salvar_campanha_atomica(uuid,bigint,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.salvar_campanha_atomica(uuid,bigint,bigint,jsonb) to service_role;

create or replace function appono_private.aplicar_campanha_inteligente(
 p_campanha_id bigint,p_restaurante_id bigint,p_reserva_id bigint,p_pedido_id bigint,
 p_data_reserva date,p_horario_inicio time,p_quantidade_pessoas integer)
returns numeric language plpgsql security definer set search_path='' as $$
declare c public.campanhas_inteligentes_restaurante; total numeric:=0; desconto numeric:=0; base_combo numeric:=0;
 instante timestamptz; it jsonb; prod public.produtos; itens jsonb:='[]'; qtd integer;
begin
 if p_campanha_id is null then return 0; end if;
 select * into c from public.campanhas_inteligentes_restaurante where id_campanha=p_campanha_id and id_restaurante=p_restaurante_id for update;
 if not found then raise exception 'Campanha nao encontrada'; end if;
 -- As funcoes de reserva chamadoras verificam o cliente autenticado.
 if exists(select 1 from public.resgates_campanha_inteligente where id_reserva=p_reserva_id or id_pedido=p_pedido_id) then raise exception 'Reserva ja possui beneficio'; end if;
 instante:=(p_data_reserva+p_horario_inicio) at time zone 'America/Sao_Paulo';
 if not appono_private.campanha_profissional(p_restaurante_id) or c.precisa_configuracao or c.status not in ('ATIVA','AGENDADA')
 or now()<c.inicio_em or now()>=c.fim_em or instante<c.inicio_em or instante>=c.fim_em
 or c.usos_confirmados>=c.limite_usos or p_quantidade_pessoas<coalesce(c.minimo_pessoas,1) then raise exception 'Oferta indisponivel para esta reserva'; end if;
 if p_pedido_id is null and (c.tipo_beneficio in ('DESCONTO_FIXO','DESCONTO_PERCENTUAL','COMBO') or c.minimo_itens is not null
 or exists(select 1 from public.campanhas_inteligentes_produtos where id_campanha=c.id_campanha)) then raise exception 'Esta oferta exige pedido antecipado'; end if;
 if p_pedido_id is not null then
  if (select coalesce(sum(quantidade),0) from public.itens_pedido where id_pedido=p_pedido_id)<coalesce(c.minimo_itens,0) then raise exception 'Quantidade minima nao atingida'; end if;
  select coalesce(sum(i.quantidade*i.preco_unitario),0) into total from public.itens_pedido i where i.id_pedido=p_pedido_id
   and (not exists(select 1 from public.campanhas_inteligentes_produtos where id_campanha=c.id_campanha)
    or exists(select 1 from public.campanhas_inteligentes_produtos where id_campanha=c.id_campanha and id_produto=i.id_produto));
  if exists(select 1 from public.campanhas_inteligentes_produtos where id_campanha=c.id_campanha) and total<=0 then raise exception 'Selecione um produto elegivel'; end if;
 end if;
 for it in select value from jsonb_array_elements(c.beneficio_itens) loop
  select * into prod from public.produtos where id_produto=(it->>'id_produto')::bigint and id_restaurante=p_restaurante_id for share;
  if not found or not prod.disponivel or coalesce(prod.arquivado,false) then raise exception 'Item oferecido indisponivel; escolha outra oferta'; end if;
  qtd:=(it->>'quantidade')::integer;
  itens:=itens||jsonb_build_array(jsonb_build_object('id_produto',prod.id_produto,'nome',prod.nome,'quantidade',qtd,'preco_original',prod.preco));
  if c.tipo_beneficio='COMBO' then
   if (select coalesce(sum(quantidade),0) from public.itens_pedido where id_pedido=p_pedido_id and id_produto=prod.id_produto)<qtd then raise exception 'Inclua todos os itens do combo no pedido'; end if;
   base_combo:=base_combo+prod.preco*qtd;
  end if;
 end loop;
 if c.tipo_beneficio='DESCONTO_PERCENTUAL' then desconto:=round(total*c.valor_beneficio/100,2);
 elsif c.tipo_beneficio='DESCONTO_FIXO' then desconto:=least(total,c.valor_beneficio);
 elsif c.tipo_beneficio='COMBO' then
  if c.preco_combo>base_combo then raise exception 'Preco do combo superior aos itens; restaurante deve revisar a oferta'; end if;
  desconto:=base_combo-c.preco_combo;
 end if;
 if p_pedido_id is not null then update public.pedidos set valor_total=greatest(0,valor_total-desconto) where id_pedido=p_pedido_id; end if;
 update public.campanhas_inteligentes_restaurante set usos_confirmados=usos_confirmados+1,
 status=case when usos_confirmados+1>=limite_usos then 'ESGOTADA' else 'ATIVA' end where id_campanha=c.id_campanha;
 insert into public.resgates_campanha_inteligente(id_campanha,id_reserva,id_pedido,valor_beneficio,condicoes)
 values(c.id_campanha,p_reserva_id,p_pedido_id,desconto,to_jsonb(c)||jsonb_build_object('itens_oferecidos',itens,'produtos_elegiveis',(select coalesce(jsonb_agg(id_produto),'[]') from public.campanhas_inteligentes_produtos where id_campanha=c.id_campanha)));
 insert into public.eventos_campanha_inteligente(id_campanha,tipo,id_cliente,id_reserva,id_pedido)
 select c.id_campanha,'RESGATE',id_cliente,p_reserva_id,p_pedido_id from public.reservas where id_reserva=p_reserva_id;
 return desconto;
end $$;

create or replace function appono_private.cancelar_resgate_campanha() returns trigger
language plpgsql security definer set search_path='' as $$
declare x record; cancelou boolean;
begin
 if tg_table_name='reservas' then cancelou:=new.status_reserva in ('CANCELADA','EXPIRADA','NAO_COMPARECEU');
 else cancelou:=new.status_pedido='CANCELADO'; end if;
 if not cancelou then return new; end if;
 -- Ordem global: campanha, depois resgate.
 for x in select r.id_resgate,r.id_campanha from public.resgates_campanha_inteligente r
 where (tg_table_name='reservas' and r.id_reserva=(to_jsonb(new)->>'id_reserva')::bigint)
 or (tg_table_name='pedidos' and r.id_pedido=(to_jsonb(new)->>'id_pedido')::bigint) order by r.id_campanha loop
  perform 1 from public.campanhas_inteligentes_restaurante where id_campanha=x.id_campanha for update;
  update public.resgates_campanha_inteligente set status='CANCELADO',cancelado_em=now()
   where id_resgate=x.id_resgate and status<>'CANCELADO' and entregue_em is null;
  if found then
   update public.campanhas_inteligentes_restaurante set usos_confirmados=greatest(0,usos_confirmados-1),
    status=case when status='ESGOTADA' and fim_em<=now() then 'EXPIRADA'
      when status='ESGOTADA' and inicio_em<=now() and appono_private.campanha_profissional(id_restaurante) then 'ATIVA' else status end
    where id_campanha=x.id_campanha;
  end if;
 end loop;
 return new;
end $$;
create trigger liberar_campanha_reserva after update of status_reserva on public.reservas for each row execute function appono_private.cancelar_resgate_campanha();
create trigger liberar_campanha_pedido after update of status_pedido on public.pedidos for each row execute function appono_private.cancelar_resgate_campanha();

create or replace function public.entregar_beneficio_campanha(p_actor uuid,p_resgate bigint)
returns public.resgates_campanha_inteligente language plpgsql security definer set search_path='' as $$
declare x public.resgates_campanha_inteligente; c public.campanhas_inteligentes_restaurante; rv public.reservas;
begin
 select * into x from public.resgates_campanha_inteligente where id_resgate=p_resgate;
 select * into rv from public.reservas where id_reserva=x.id_reserva for update;
 select * into c from public.campanhas_inteligentes_restaurante where id_campanha=x.id_campanha for update;
 if not exists(select 1 from public.restaurantes where id_restaurante=c.id_restaurante and id_auth=p_actor) then raise exception 'Sem permissao'; end if;
 select * into x from public.resgates_campanha_inteligente where id_resgate=p_resgate for update;
 if x.status='CANCELADO' or rv.status_reserva not in ('CHECK_IN','CONCLUIDA') then raise exception 'Confirme a presenca antes da entrega'; end if;
 if x.entregue_em is not null then return x; end if;
 update public.resgates_campanha_inteligente set entregue_em=now(),entregue_por=p_actor,status='APLICADO' where id_resgate=p_resgate returning * into x;
 return x;
end $$;
revoke all on function public.entregar_beneficio_campanha(uuid,bigint) from public,anon,authenticated;
grant execute on function public.entregar_beneficio_campanha(uuid,bigint) to service_role;

create or replace function public.atualizar_ciclo_campanhas() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update public.campanhas_inteligentes_restaurante set status=case when fim_em<=now() then 'EXPIRADA'
 when usos_confirmados>=limite_usos then 'ESGOTADA' else 'ATIVA' end
 where (status in ('ATIVA','AGENDADA','ESGOTADA','PAUSADA') and fim_em<=now())
 or (status='AGENDADA' and inicio_em<=now() and fim_em>now() and not precisa_configuracao and appono_private.campanha_profissional(id_restaurante))
 or (status='ESGOTADA' and usos_confirmados<limite_usos and inicio_em<=now() and fim_em>now() and appono_private.campanha_profissional(id_restaurante));
 get diagnostics n=row_count;
 return n;
end $$;
revoke all on function public.atualizar_ciclo_campanhas() from public,anon,authenticated;
grant execute on function public.atualizar_ciclo_campanhas() to service_role;
-- Instalacoes sem pg_cron usam o endpoint autenticado de manutencao.
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  perform cron.schedule('appono-ciclo-campanhas','* * * * *','select public.atualizar_ciclo_campanhas()');
 end if;
end $$;
revoke all on function appono_private.cancelar_resgate_campanha() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
