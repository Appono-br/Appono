begin;

create table public.alergenos_catalogo (
  id_alergeno bigserial primary key,
  codigo text not null unique,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint alergenos_catalogo_codigo_check check (codigo ~ '^[A-Z0-9_]{2,40}$'),
  constraint alergenos_catalogo_nome_check check (char_length(trim(nome)) between 2 and 80)
);

insert into public.alergenos_catalogo (codigo, nome) values
  ('TRIGO_GLUTEN', 'Trigo e glúten'), ('CRUSTACEOS', 'Crustáceos'), ('OVOS', 'Ovos'),
  ('PEIXES', 'Peixes'), ('AMENDOIM', 'Amendoim'), ('SOJA', 'Soja'), ('LEITE', 'Leite'),
  ('OLEAGINOSAS', 'Castanhas e outras oleaginosas'), ('GERGELIM', 'Gergelim'),
  ('SULFITOS', 'Sulfitos'), ('MOSTARDA', 'Mostarda'), ('AIPO', 'Aipo'),
  ('TREMOCO', 'Tremoço'), ('MOLUSCOS', 'Moluscos')
on conflict (codigo) do update set nome = excluded.nome, ativo = true;

create table public.ingredientes_produto (
  id_ingrediente_produto bigserial primary key,
  id_produto bigint not null references public.produtos(id_produto) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  constraint ingredientes_produto_nome_check check (char_length(trim(nome)) between 2 and 100),
  unique (id_produto, nome),
  unique (id_ingrediente_produto, id_restaurante)
);
create index ingredientes_produto_restaurante_idx on public.ingredientes_produto (id_restaurante, id_produto);

create table public.alergenos_produto (
  id_alergeno_produto bigserial primary key,
  id_produto bigint not null references public.produtos(id_produto) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  id_alergeno bigint not null references public.alergenos_catalogo(id_alergeno),
  tipo text not null,
  criado_em timestamptz not null default now(),
  constraint alergenos_produto_tipo_check check (tipo in ('PRESENTE', 'PODE_CONTER', 'CONTAMINACAO_CRUZADA')),
  unique (id_produto, id_alergeno, tipo)
);
create index alergenos_produto_restaurante_idx on public.alergenos_produto (id_restaurante, id_produto);
create index alergenos_produto_alergeno_idx on public.alergenos_produto (id_alergeno, tipo, id_produto);

create table public.seguranca_alimentar_produto (
  id_produto bigint primary key references public.produtos(id_produto) on delete cascade,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  status text not null default 'INCOMPLETA',
  origem_informacao text,
  responsavel_revisao text,
  revisado_em timestamptz,
  versao bigint not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint seguranca_alimentar_status_check check (status in ('INCOMPLETA', 'REVISADA')),
  constraint seguranca_alimentar_origem_check check (origem_informacao is null or char_length(trim(origem_informacao)) between 2 and 120),
  constraint seguranca_alimentar_responsavel_check check (responsavel_revisao is null or char_length(trim(responsavel_revisao)) between 2 and 100),
  constraint seguranca_alimentar_revisao_check check (
    status = 'INCOMPLETA' or (revisado_em is not null and responsavel_revisao is not null and origem_informacao is not null)
  )
);
create index seguranca_alimentar_restaurante_idx on public.seguranca_alimentar_produto (id_restaurante, status);

create table public.auditoria_seguranca_alimentar (
  id_auditoria bigserial primary key,
  id_produto bigint references public.produtos(id_produto) on delete set null,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  id_auth_responsavel uuid not null,
  acao text not null,
  versao bigint not null,
  resumo jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  constraint auditoria_seguranca_acao_check check (acao in ('CRIADA', 'ATUALIZADA', 'MARCADA_INCOMPLETA'))
);
create index auditoria_seguranca_restaurante_idx on public.auditoria_seguranca_alimentar (id_restaurante, criado_em desc);

create trigger set_updated_at_seguranca_alimentar_produto
before update on public.seguranca_alimentar_produto
for each row execute function public.set_atualizado_em();

alter table public.alergenos_catalogo enable row level security;
alter table public.ingredientes_produto enable row level security;
alter table public.alergenos_produto enable row level security;
alter table public.seguranca_alimentar_produto enable row level security;
alter table public.auditoria_seguranca_alimentar enable row level security;

grant select on public.alergenos_catalogo, public.ingredientes_produto,
  public.alergenos_produto, public.seguranca_alimentar_produto to authenticated;
revoke insert, update, delete on public.alergenos_catalogo, public.ingredientes_produto,
  public.alergenos_produto, public.seguranca_alimentar_produto,
  public.auditoria_seguranca_alimentar from anon, authenticated;
grant all on public.alergenos_catalogo, public.ingredientes_produto,
  public.alergenos_produto, public.seguranca_alimentar_produto,
  public.auditoria_seguranca_alimentar to service_role;
grant usage, select on sequence public.alergenos_catalogo_id_alergeno_seq,
  public.ingredientes_produto_id_ingrediente_produto_seq,
  public.alergenos_produto_id_alergeno_produto_seq,
  public.auditoria_seguranca_alimentar_id_auditoria_seq to service_role;

create policy "Autenticados leem catalogo de alergenos" on public.alergenos_catalogo
for select to authenticated using (ativo = true);
create policy "Autenticados leem ingredientes publicados" on public.ingredientes_produto
for select to authenticated using (exists (
  select 1 from public.produtos p where p.id_produto = ingredientes_produto.id_produto
    and (p.disponivel is true or exists (
      select 1 from public.restaurantes r where r.id_restaurante = p.id_restaurante and r.id_auth = (select auth.uid())
    ))
));
create policy "Autenticados leem alergenos publicados" on public.alergenos_produto
for select to authenticated using (exists (
  select 1 from public.produtos p where p.id_produto = alergenos_produto.id_produto
    and (p.disponivel is true or exists (
      select 1 from public.restaurantes r where r.id_restaurante = p.id_restaurante and r.id_auth = (select auth.uid())
    ))
));
create policy "Autenticados leem revisao alimentar publicada" on public.seguranca_alimentar_produto
for select to authenticated using (exists (
  select 1 from public.produtos p where p.id_produto = seguranca_alimentar_produto.id_produto
    and (p.disponivel is true or exists (
      select 1 from public.restaurantes r where r.id_restaurante = p.id_restaurante and r.id_auth = (select auth.uid())
    ))
));

create or replace function appono_private.salvar_seguranca_alimentar_produto(
  p_id_produto bigint,
  p_ingredientes jsonb,
  p_alergenos jsonb,
  p_status text,
  p_origem_informacao text,
  p_responsavel_revisao text,
  p_versao bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  restaurante_id bigint;
  atual public.seguranca_alimentar_produto;
  ingrediente jsonb;
  alergeno jsonb;
  alergeno_id bigint;
  nova_versao bigint;
  acao_auditoria text;
begin
  select p.id_restaurante into restaurante_id
    from public.produtos p
    join public.restaurantes r on r.id_restaurante = p.id_restaurante
   where p.id_produto = p_id_produto and r.id_auth = (select auth.uid()) and p.arquivado is not true
   for update of p;
  if restaurante_id is null then raise sqlstate 'PT404' using message = 'Produto nao encontrado'; end if;
  if jsonb_typeof(p_ingredientes) <> 'array' or jsonb_array_length(p_ingredientes) > 80 then
    raise sqlstate '22023' using message = 'Lista de ingredientes invalida';
  end if;
  if jsonb_typeof(p_alergenos) <> 'array' or jsonb_array_length(p_alergenos) > 50 then
    raise sqlstate '22023' using message = 'Lista de alergenos invalida';
  end if;
  if upper(p_status) not in ('INCOMPLETA', 'REVISADA') then raise sqlstate '22023' using message = 'Status invalido'; end if;
  if upper(p_status) = 'REVISADA' and (nullif(trim(p_origem_informacao),'') is null or nullif(trim(p_responsavel_revisao),'') is null) then
    raise sqlstate '22023' using message = 'Informe origem e responsavel pela revisao';
  end if;

  select * into atual from public.seguranca_alimentar_produto where id_produto = p_id_produto for update;
  if atual.id_produto is not null and (p_versao is null or p_versao is distinct from atual.versao) then
    raise sqlstate 'PT409' using message = 'As informacoes foram alteradas em outra aba';
  end if;
  if atual.id_produto is null and coalesce(p_versao, 0) <> 0 then
    raise sqlstate 'PT409' using message = 'As informacoes foram criadas em outra aba';
  end if;
  nova_versao := coalesce(atual.versao, 0) + 1;

  delete from public.ingredientes_produto where id_produto = p_id_produto;
  for ingrediente in select value from jsonb_array_elements(p_ingredientes) loop
    if char_length(trim(ingrediente->>'nome')) not between 2 and 100 then raise sqlstate '22023' using message = 'Ingrediente invalido'; end if;
    insert into public.ingredientes_produto(id_produto,id_restaurante,nome)
      values(p_id_produto,restaurante_id,trim(ingrediente->>'nome')) on conflict do nothing;
  end loop;

  delete from public.alergenos_produto where id_produto = p_id_produto;
  for alergeno in select value from jsonb_array_elements(p_alergenos) loop
    if upper(alergeno->>'tipo') not in ('PRESENTE','PODE_CONTER','CONTAMINACAO_CRUZADA') then raise sqlstate '22023' using message = 'Tipo de alergeno invalido'; end if;
    select id_alergeno into alergeno_id from public.alergenos_catalogo
      where codigo = upper(alergeno->>'codigo') and ativo = true;
    if alergeno_id is null then raise sqlstate '22023' using message = 'Alergeno desconhecido'; end if;
    insert into public.alergenos_produto(id_produto,id_restaurante,id_alergeno,tipo)
      values(p_id_produto,restaurante_id,alergeno_id,upper(alergeno->>'tipo')) on conflict do nothing;
  end loop;

  insert into public.seguranca_alimentar_produto(id_produto,id_restaurante,status,origem_informacao,responsavel_revisao,revisado_em,versao)
  values(p_id_produto,restaurante_id,upper(p_status),nullif(trim(p_origem_informacao),''),nullif(trim(p_responsavel_revisao),''),
    case when upper(p_status) = 'REVISADA' then now() else null end,nova_versao)
  on conflict(id_produto) do update set status=excluded.status,origem_informacao=excluded.origem_informacao,
    responsavel_revisao=excluded.responsavel_revisao,revisado_em=excluded.revisado_em,versao=excluded.versao;

  acao_auditoria := case when upper(p_status) = 'INCOMPLETA' then 'MARCADA_INCOMPLETA'
    when atual.id_produto is null then 'CRIADA' else 'ATUALIZADA' end;
  insert into public.auditoria_seguranca_alimentar(id_produto,id_restaurante,id_auth_responsavel,acao,versao,resumo)
  values(p_id_produto,restaurante_id,(select auth.uid()),acao_auditoria,nova_versao,
    jsonb_build_object('ingredientes',jsonb_array_length(p_ingredientes),'alergenos',jsonb_array_length(p_alergenos),'status',upper(p_status)));

  return jsonb_build_object('id_produto',p_id_produto,'status',upper(p_status),'versao',nova_versao,
    'ingredientes',p_ingredientes,'alergenos',p_alergenos,'origem_informacao',nullif(trim(p_origem_informacao),''),
    'responsavel_revisao',nullif(trim(p_responsavel_revisao),''));
end;
$$;

revoke all on function appono_private.salvar_seguranca_alimentar_produto(bigint,jsonb,jsonb,text,text,text,bigint) from public,anon;
grant execute on function appono_private.salvar_seguranca_alimentar_produto(bigint,jsonb,jsonb,text,text,text,bigint) to authenticated;

create or replace function public.salvar_seguranca_alimentar_produto(
  p_id_produto bigint,p_ingredientes jsonb,p_alergenos jsonb,p_status text,
  p_origem_informacao text,p_responsavel_revisao text,p_versao bigint default 0
)
returns jsonb language sql security invoker set search_path = '' as $$
  select appono_private.salvar_seguranca_alimentar_produto(p_id_produto,p_ingredientes,p_alergenos,p_status,p_origem_informacao,p_responsavel_revisao,p_versao);
$$;
revoke all on function public.salvar_seguranca_alimentar_produto(bigint,jsonb,jsonb,text,text,text,bigint) from public,anon;
grant execute on function public.salvar_seguranca_alimentar_produto(bigint,jsonb,jsonb,text,text,text,bigint) to authenticated;

commit;
