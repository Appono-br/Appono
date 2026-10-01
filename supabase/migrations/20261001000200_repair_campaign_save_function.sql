begin;

-- Alguns ambientes receberam a tabela de campanhas antes dos campos de controle.
-- Garanta a estrutura antes de compilar a função que os utiliza.
alter table public.campanhas_inteligentes_restaurante
  add column if not exists versao bigint not null default 1,
  add column if not exists beneficio_itens jsonb not null default '[]'::jsonb,
  add column if not exists preco_combo numeric(10,2),
  add column if not exists precisa_configuracao boolean not null default false;

alter table public.resgates_campanha_inteligente
  add column if not exists condicoes jsonb not null default '{}'::jsonb,
  add column if not exists entregue_em timestamptz,
  add column if not exists entregue_por uuid,
  add column if not exists cancelado_em timestamptz;

alter table public.eventos_campanha_inteligente
  add column if not exists chave_deduplicacao text;
create unique index if not exists campanha_evento_deduplicacao
  on public.eventos_campanha_inteligente(id_campanha, tipo, chave_deduplicacao)
  where chave_deduplicacao is not null;

alter table public.consentimentos_ofertas_cliente
  add column if not exists versao_texto text not null default 'ofertas-v1';

create or replace function public.salvar_campanha_atomica(p_actor uuid, p_id bigint, p_versao bigint, p_dados jsonb)
returns public.campanhas_inteligentes_restaurante
language plpgsql security definer set search_path = '' as $$
declare
  restaurante_id bigint;
  campanha_atual public.campanhas_inteligentes_restaurante;
  campanha public.campanhas_inteligentes_restaurante;
  ids bigint[];
  item jsonb;
  produto_id bigint;
  quantidade integer;
begin
  select id_restaurante into restaurante_id from public.restaurantes where id_auth = p_actor;
  if restaurante_id is null or not exists(
    select 1 from public.assinaturas_restaurante assinatura
    where assinatura.id_restaurante = restaurante_id and assinatura.codigo_plano = 'PROFISSIONAL' and assinatura.status = 'ATIVA'
      and (assinatura.periodo_fim_em is null or assinatura.periodo_fim_em > now())
  ) then
    raise exception 'Plano Profissional ativo necessario';
  end if;

  if p_id is not null then
    select * into campanha_atual from public.campanhas_inteligentes_restaurante where id_campanha = p_id and id_restaurante = restaurante_id for update;
    if not found then raise exception 'Campanha nao encontrada'; end if;
    if p_versao is distinct from campanha_atual.versao then raise sqlstate 'PT409' using message = 'A campanha mudou. Recarregue antes de salvar.'; end if;
    if campanha_atual.status in ('ENCERRADA', 'EXPIRADA') then raise exception 'Campanha finalizada nao pode ser editada'; end if;
  else
    campanha_atual.id_restaurante := restaurante_id;
    campanha_atual.usos_confirmados := 0;
    campanha_atual.versao := 0;
  end if;

  campanha := jsonb_populate_record(campanha_atual, p_dados - array['id_campanha', 'id_restaurante', 'usos_confirmados', 'versao', 'criado_em', 'atualizado_em', 'precisa_configuracao']);
  if campanha.titulo is null or char_length(trim(campanha.titulo)) not between 3 and 120
    or campanha.inicio_em is null or campanha.fim_em is null or campanha.fim_em <= campanha.inicio_em
    or campanha.limite_usos is null or campanha.limite_usos not between 1 and 100000 or campanha.limite_usos < campanha_atual.usos_confirmados
    or campanha.status is null or campanha.status not in ('RASCUNHO', 'AGENDADA', 'ATIVA', 'PAUSADA', 'ENCERRADA') then
    raise exception 'Dados ou transicao da campanha invalidos';
  end if;
  if campanha.tipo_beneficio is null or campanha.tipo_beneficio not in ('DESCONTO_FIXO', 'DESCONTO_PERCENTUAL', 'ITEM_CORTESIA', 'BEBIDA', 'ENTRADA', 'SOBREMESA', 'COMBO') then raise exception 'Beneficio invalido'; end if;
  if campanha.tipo_beneficio in ('DESCONTO_FIXO', 'DESCONTO_PERCENTUAL') and (campanha.valor_beneficio is null or campanha.valor_beneficio <= 0 or (campanha.tipo_beneficio = 'DESCONTO_PERCENTUAL' and campanha.valor_beneficio > 100)) then raise exception 'Desconto invalido'; end if;
  if campanha.status in ('AGENDADA', 'ATIVA') then
    if campanha.fim_em <= now() then raise exception 'Validade deve terminar no futuro'; end if;
    campanha.status := case when campanha.inicio_em > now() then 'AGENDADA' when campanha_atual.usos_confirmados >= campanha.limite_usos then 'ESGOTADA' else 'ATIVA' end;
  end if;

  if jsonb_typeof(coalesce(p_dados->'produtos', '[]')) <> 'array' then raise exception 'Produtos invalidos'; end if;
  ids := array(select distinct value::bigint from jsonb_array_elements_text(coalesce(p_dados->'produtos', '[]')));
  if exists(select 1 from unnest(ids) id where not exists(select 1 from public.produtos p where p.id_produto = id and p.id_restaurante = restaurante_id and p.disponivel and not coalesce(p.arquivado, false))) then raise exception 'Produto indisponivel ou de outro restaurante'; end if;

  campanha.beneficio_itens := coalesce(campanha.beneficio_itens, '[]');
  if jsonb_typeof(campanha.beneficio_itens) <> 'array' or jsonb_array_length(campanha.beneficio_itens) > 20 then raise exception 'Itens do beneficio invalidos'; end if;
  if campanha.tipo_beneficio not in ('DESCONTO_FIXO', 'DESCONTO_PERCENTUAL') and jsonb_array_length(campanha.beneficio_itens) = 0 then raise exception 'Configure os produtos oferecidos'; end if;
  if campanha.tipo_beneficio = 'COMBO' and (campanha.preco_combo is null or campanha.preco_combo < 0) then raise exception 'Informe o preco do combo'; end if;
  for item in select value from jsonb_array_elements(campanha.beneficio_itens) loop
    produto_id := (item->>'id_produto')::bigint;
    quantidade := (item->>'quantidade')::integer;
    if quantidade is null or quantidade not between 1 and 100 or not exists(select 1 from public.produtos where id_produto = produto_id and id_restaurante = restaurante_id and disponivel and not coalesce(arquivado, false)) then raise exception 'Item do beneficio indisponivel'; end if;
  end loop;
  if (select count(*) from jsonb_array_elements(campanha.beneficio_itens)) <> (select count(distinct value->>'id_produto') from jsonb_array_elements(campanha.beneficio_itens)) then raise exception 'Produto repetido no beneficio'; end if;

  if p_id is null then
    insert into public.campanhas_inteligentes_restaurante(id_restaurante, titulo, tipo_beneficio, valor_beneficio, inicio_em, fim_em, limite_usos)
    values(restaurante_id, campanha.titulo, campanha.tipo_beneficio, campanha.valor_beneficio, campanha.inicio_em, campanha.fim_em, campanha.limite_usos)
    returning id_campanha into p_id;
  end if;
  update public.campanhas_inteligentes_restaurante set titulo = trim(campanha.titulo), descricao = campanha.descricao, imagem_url = campanha.imagem_url,
    tipo_beneficio = campanha.tipo_beneficio, valor_beneficio = campanha.valor_beneficio, regras = campanha.regras, inicio_em = campanha.inicio_em, fim_em = campanha.fim_em,
    limite_usos = campanha.limite_usos, minimo_pessoas = campanha.minimo_pessoas, minimo_itens = campanha.minimo_itens, status = campanha.status,
    beneficio_itens = campanha.beneficio_itens, preco_combo = campanha.preco_combo, precisa_configuracao = false, versao = campanha_atual.versao + 1
  where id_campanha = p_id returning * into campanha;
  delete from public.campanhas_inteligentes_produtos where id_campanha = p_id;
  insert into public.campanhas_inteligentes_produtos select p_id, unnest(ids);
  return campanha;
end;
$$;

revoke all on function public.salvar_campanha_atomica(uuid, bigint, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.salvar_campanha_atomica(uuid, bigint, bigint, jsonb) to service_role;
notify pgrst, 'reload schema';

commit;
