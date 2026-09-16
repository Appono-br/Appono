begin;

create table public.grupos_rotina (
  id_grupo_rotina bigserial primary key,
  id_criador_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  nome text not null,
  inicio_em timestamptz not null,
  fim_em timestamptz not null,
  latitude_aproximada numeric(10,7),
  longitude_aproximada numeric(10,7),
  orcamento_por_pessoa numeric(10,2),
  quantidade_maxima integer not null default 2,
  prazo_votacao_em timestamptz,
  status text not null default 'RASCUNHO',
  id_restaurante_escolhido bigint references public.restaurantes(id_restaurante) on delete set null,
  id_produto_escolhido bigint references public.produtos(id_produto) on delete set null,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  versao integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint grupos_rotina_nome_check check (char_length(trim(nome)) between 2 and 80),
  constraint grupos_rotina_janela_check check (fim_em > inicio_em and fim_em - inicio_em <= interval '8 hours'),
  constraint grupos_rotina_orcamento_check check (orcamento_por_pessoa is null or orcamento_por_pessoa >= 0),
  constraint grupos_rotina_capacidade_check check (quantidade_maxima between 2 and 20),
  constraint grupos_rotina_status_check check (status in ('RASCUNHO','CONVIDANDO','VOTACAO','CONFIRMADO','CANCELADO','EXPIRADO')),
  constraint grupos_rotina_coordenadas_check check ((latitude_aproximada is null and longitude_aproximada is null) or
    (latitude_aproximada is not null and longitude_aproximada is not null
      and latitude_aproximada between -90 and 90 and longitude_aproximada between -180 and 180))
);

create table public.participantes_grupo_rotina (
  id_participante_grupo bigserial primary key,
  id_grupo_rotina bigint not null references public.grupos_rotina(id_grupo_rotina) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  papel text not null default 'PARTICIPANTE',
  status text not null default 'PENDENTE',
  confirmou_presenca boolean,
  entrou_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(id_grupo_rotina, id_cliente),
  constraint participantes_grupo_papel_check check (papel in ('ORGANIZADOR','PARTICIPANTE')),
  constraint participantes_grupo_status_check check (status in ('PENDENTE','ACEITO','RECUSADO','SAIU','REMOVIDO'))
);

create unique index participantes_grupo_organizador_uidx on public.participantes_grupo_rotina(id_grupo_rotina) where papel = 'ORGANIZADOR';
create index participantes_grupo_cliente_idx on public.participantes_grupo_rotina(id_cliente, atualizado_em desc);

-- Restricoes de cada participante ficam em tabela separada para nunca serem visiveis aos demais membros.
create table public.restricoes_grupo_participante (
  id_restricao_grupo bigserial primary key,
  id_participante_grupo bigint not null references public.participantes_grupo_rotina(id_participante_grupo) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  tipo text not null,
  valor text not null,
  criado_em timestamptz not null default now(),
  constraint restricoes_grupo_tipo_check check (tipo in ('RESTRICAO','ALERGIA')),
  constraint restricoes_grupo_valor_check check (char_length(trim(valor)) between 2 and 80)
);
create index restricoes_grupo_cliente_idx on public.restricoes_grupo_participante(id_cliente, tipo);

create table public.convites_grupo_rotina (
  id_convite_grupo bigserial primary key,
  id_grupo_rotina bigint not null references public.grupos_rotina(id_grupo_rotina) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  revogado_em timestamptz,
  usado_por_cliente bigint references public.clientes(id_cliente) on delete set null,
  usado_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint convites_grupo_expiracao_check check (expira_em > criado_em and expira_em <= criado_em + interval '30 days')
);
create index convites_grupo_ativos_idx on public.convites_grupo_rotina(id_grupo_rotina, expira_em) where revogado_em is null and usado_em is null;

create table public.opcoes_grupo_rotina (
  id_opcao_grupo bigserial primary key,
  id_grupo_rotina bigint not null references public.grupos_rotina(id_grupo_rotina) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  id_produto bigint references public.produtos(id_produto) on delete set null,
  preco_estimado numeric(10,2),
  distancia_km numeric(8,2),
  motivo_recomendacao text,
  pontuacao numeric(8,2) not null default 0,
  metadados jsonb not null default '{}'::jsonb,
  criada_em timestamptz not null default now(),
  unique(id_grupo_rotina, id_restaurante, id_produto),
  constraint opcoes_grupo_preco_check check (preco_estimado is null or preco_estimado >= 0)
);

create table public.votos_grupo_rotina (
  id_voto_grupo bigserial primary key,
  id_grupo_rotina bigint not null references public.grupos_rotina(id_grupo_rotina) on delete cascade,
  id_opcao_grupo bigint not null references public.opcoes_grupo_rotina(id_opcao_grupo) on delete cascade,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(id_grupo_rotina, id_cliente)
);
create index votos_grupo_opcao_idx on public.votos_grupo_rotina(id_opcao_grupo);

create trigger set_updated_at_grupos_rotina before update on public.grupos_rotina for each row execute function public.set_atualizado_em();
create trigger set_updated_at_participantes_grupo before update on public.participantes_grupo_rotina for each row execute function public.set_atualizado_em();
create trigger set_updated_at_votos_grupo before update on public.votos_grupo_rotina for each row execute function public.set_atualizado_em();

alter table public.grupos_rotina enable row level security;
alter table public.participantes_grupo_rotina enable row level security;
alter table public.restricoes_grupo_participante enable row level security;
alter table public.convites_grupo_rotina enable row level security;
alter table public.opcoes_grupo_rotina enable row level security;
alter table public.votos_grupo_rotina enable row level security;
revoke all on public.grupos_rotina, public.participantes_grupo_rotina, public.restricoes_grupo_participante,
  public.convites_grupo_rotina, public.opcoes_grupo_rotina, public.votos_grupo_rotina from public, anon, authenticated;
grant all on public.grupos_rotina, public.participantes_grupo_rotina, public.restricoes_grupo_participante,
  public.convites_grupo_rotina, public.opcoes_grupo_rotina, public.votos_grupo_rotina to service_role;
grant select on public.grupos_rotina, public.participantes_grupo_rotina, public.opcoes_grupo_rotina, public.votos_grupo_rotina to authenticated;
grant select, insert, update, delete on public.restricoes_grupo_participante to authenticated;

create policy "Membro le grupo de rotina" on public.grupos_rotina for select to authenticated using (exists (
  select 1 from public.participantes_grupo_rotina pg join public.clientes c on c.id_cliente = pg.id_cliente
  where pg.id_grupo_rotina = grupos_rotina.id_grupo_rotina and pg.status = 'ACEITO' and c.id_auth = (select auth.uid())
));
create policy "Membro le participantes do grupo" on public.participantes_grupo_rotina for select to authenticated using (exists (
  select 1 from public.participantes_grupo_rotina eu join public.clientes c on c.id_cliente = eu.id_cliente
  where eu.id_grupo_rotina = participantes_grupo_rotina.id_grupo_rotina and eu.status = 'ACEITO' and c.id_auth = (select auth.uid())
));
create policy "Membro le opcoes do grupo" on public.opcoes_grupo_rotina for select to authenticated using (exists (
  select 1 from public.participantes_grupo_rotina pg join public.clientes c on c.id_cliente = pg.id_cliente
  where pg.id_grupo_rotina = opcoes_grupo_rotina.id_grupo_rotina and pg.status = 'ACEITO' and c.id_auth = (select auth.uid())
));
create policy "Membro le votos do grupo" on public.votos_grupo_rotina for select to authenticated using (exists (
  select 1 from public.participantes_grupo_rotina pg join public.clientes c on c.id_cliente = pg.id_cliente
  where pg.id_grupo_rotina = votos_grupo_rotina.id_grupo_rotina and pg.status = 'ACEITO' and c.id_auth = (select auth.uid())
));
create policy "Cliente gerencia somente suas restricoes do grupo" on public.restricoes_grupo_participante for all to authenticated
  using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())))
  with check (
    id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid()))
    and id_participante_grupo in (
      select id_participante_grupo from public.participantes_grupo_rotina participante
      where participante.id_cliente = restricoes_grupo_participante.id_cliente
    )
  );

create or replace function appono_private.criar_grupo_rotina(
  p_nome text, p_inicio_em timestamptz, p_fim_em timestamptz,
  p_latitude numeric, p_longitude numeric, p_orcamento numeric,
  p_quantidade_maxima integer, p_expira_em timestamptz, p_token_hash text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare cliente_id bigint; grupo public.grupos_rotina; convite public.convites_grupo_rotina;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  if cliente_id is null then raise sqlstate 'PT401' using message = 'Cliente nao autenticado'; end if;
  if char_length(trim(coalesce(p_nome,''))) not between 2 and 80 or p_fim_em <= p_inicio_em
    or p_fim_em - p_inicio_em > interval '8 hours' or p_quantidade_maxima not between 2 and 20
    or p_expira_em <= now() or p_expira_em > now() + interval '30 days' or char_length(coalesce(p_token_hash,'')) <> 64 then
    raise sqlstate '22023' using message = 'Dados do grupo invalidos';
  end if;
  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise sqlstate '22023' using message = 'Coordenadas invalidas';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('appono.grupo:' || cliente_id, 0));
  insert into public.grupos_rotina(id_criador_cliente,nome,inicio_em,fim_em,latitude_aproximada,longitude_aproximada,orcamento_por_pessoa,quantidade_maxima,status)
    values(cliente_id,trim(p_nome),p_inicio_em,p_fim_em,p_latitude,p_longitude,p_orcamento,p_quantidade_maxima,'CONVIDANDO') returning * into grupo;
  insert into public.participantes_grupo_rotina(id_grupo_rotina,id_cliente,papel,status,confirmou_presenca)
    values(grupo.id_grupo_rotina,cliente_id,'ORGANIZADOR','ACEITO',true);
  insert into public.convites_grupo_rotina(id_grupo_rotina,token_hash,expira_em)
    values(grupo.id_grupo_rotina,p_token_hash,p_expira_em) returning * into convite;
  return jsonb_build_object('grupo',to_jsonb(grupo),'id_convite_grupo',convite.id_convite_grupo);
end;
$$;
revoke all on function appono_private.criar_grupo_rotina(text,timestamptz,timestamptz,numeric,numeric,numeric,integer,timestamptz,text) from public,anon;
grant execute on function appono_private.criar_grupo_rotina(text,timestamptz,timestamptz,numeric,numeric,numeric,integer,timestamptz,text) to authenticated;
create or replace function public.criar_grupo_rotina(p_nome text,p_inicio_em timestamptz,p_fim_em timestamptz,p_latitude numeric,p_longitude numeric,p_orcamento numeric,p_quantidade_maxima integer,p_expira_em timestamptz,p_token_hash text)
returns jsonb language sql security invoker set search_path = '' as $$ select appono_private.criar_grupo_rotina(p_nome,p_inicio_em,p_fim_em,p_latitude,p_longitude,p_orcamento,p_quantidade_maxima,p_expira_em,p_token_hash); $$;
revoke all on function public.criar_grupo_rotina(text,timestamptz,timestamptz,numeric,numeric,numeric,integer,timestamptz,text) from public,anon;
grant execute on function public.criar_grupo_rotina(text,timestamptz,timestamptz,numeric,numeric,numeric,integer,timestamptz,text) to authenticated;

create or replace function appono_private.entrar_grupo_rotina(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare cliente_id bigint; convite public.convites_grupo_rotina; grupo public.grupos_rotina; participante public.participantes_grupo_rotina;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  if cliente_id is null then raise sqlstate 'PT401' using message = 'Cliente nao autenticado'; end if;
  select * into convite from public.convites_grupo_rotina where token_hash = p_token_hash and revogado_em is null and usado_em is null and expira_em > now() for update;
  if convite.id_convite_grupo is null then raise sqlstate 'PT404' using message = 'Convite invalido ou expirado'; end if;
  select * into grupo from public.grupos_rotina where id_grupo_rotina = convite.id_grupo_rotina for update;
  if grupo.status not in ('CONVIDANDO','VOTACAO') or (select count(*) from public.participantes_grupo_rotina where id_grupo_rotina = grupo.id_grupo_rotina and status = 'ACEITO') >= grupo.quantidade_maxima then
    raise sqlstate 'PT409' using message = 'O grupo nao aceita mais participantes';
  end if;
  insert into public.participantes_grupo_rotina(id_grupo_rotina,id_cliente,status) values(grupo.id_grupo_rotina,cliente_id,'ACEITO')
    on conflict(id_grupo_rotina,id_cliente) do update set status = 'ACEITO', atualizado_em = now() returning * into participante;
  update public.convites_grupo_rotina set usado_por_cliente = cliente_id, usado_em = now() where id_convite_grupo = convite.id_convite_grupo;
  return jsonb_build_object('grupo',to_jsonb(grupo),'participante',to_jsonb(participante));
end;
$$;
revoke all on function appono_private.entrar_grupo_rotina(text) from public,anon;
grant execute on function appono_private.entrar_grupo_rotina(text) to authenticated;
create or replace function public.entrar_grupo_rotina(p_token_hash text) returns jsonb language sql security invoker set search_path = '' as $$ select appono_private.entrar_grupo_rotina(p_token_hash); $$;
revoke all on function public.entrar_grupo_rotina(text) from public,anon;
grant execute on function public.entrar_grupo_rotina(text) to authenticated;

-- A visao agregada so retorna faixas com ao menos cinco clientes distintos; nao entrega registros brutos ao restaurante.
create or replace function appono_private.metricas_demanda_rotina_restaurante(p_inicio date, p_fim date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  restaurante_id bigint;
  resultado jsonb;
begin
  select r.id_restaurante into restaurante_id from public.restaurantes r where r.id_auth = (select auth.uid());
  if restaurante_id is null then raise sqlstate 'PT403' using message = 'Restaurante nao autenticado'; end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio or p_fim > p_inicio + 90 then
    raise sqlstate '22023' using message = 'Periodo invalido';
  end if;
  select coalesce(jsonb_agg(linha order by linha->>'data', linha->>'faixa_horario'), '[]'::jsonb) into resultado
  from (
    select jsonb_build_object(
      'data', rp.data_refeicao,
      'faixa_horario', case when rp.horario_sugerido < time '12:00' then 'antes_12h' when rp.horario_sugerido < time '13:30' then '12h_13h30' else 'apos_13h30' end,
      'clientes_distintos', count(distinct rp.id_cliente),
      'demanda_estimada', count(*),
      'faixa_preco', case when coalesce(rp.preco_estimado,0) < 30 then 'ate_30' when rp.preco_estimado < 60 then '30_60' else 'acima_60' end,
      'categorias', coalesce(jsonb_agg(distinct cat.nome) filter (where cat.nome is not null), '[]'::jsonb)
    ) linha
    from public.refeicoes_planejadas rp
      left join public.produtos p on p.id_produto = rp.id_produto
      left join public.categorias cat on cat.id_categoria = p.id_categoria
    where rp.id_restaurante = restaurante_id and rp.data_refeicao between p_inicio and p_fim
      and rp.status in ('SUGERIDA','APROVADA','ALTERADA','CONVERTIDA_RESERVA','CONVERTIDA_PEDIDO')
    group by rp.data_refeicao,
      case when rp.horario_sugerido < time '12:00' then 'antes_12h' when rp.horario_sugerido < time '13:30' then '12h_13h30' else 'apos_13h30' end,
      case when coalesce(rp.preco_estimado,0) < 30 then 'ate_30' when rp.preco_estimado < 60 then '30_60' else 'acima_60' end
    having count(distinct rp.id_cliente) >= 5
  ) dados;
  return jsonb_build_object('coorte_minima', 5, 'itens', resultado);
end;
$$;
revoke all on function appono_private.metricas_demanda_rotina_restaurante(date,date) from public, anon;
grant execute on function appono_private.metricas_demanda_rotina_restaurante(date,date) to authenticated;
create or replace function public.metricas_demanda_rotina_restaurante(p_inicio date, p_fim date)
returns jsonb language sql security invoker set search_path = '' as $$
  select appono_private.metricas_demanda_rotina_restaurante(p_inicio, p_fim);
$$;
revoke all on function public.metricas_demanda_rotina_restaurante(date,date) from public, anon;
grant execute on function public.metricas_demanda_rotina_restaurante(date,date) to authenticated;

commit;
