-- RAG foundation. Embeddings are fixed to the benchmarked model dimension (384).
-- Apply only after reviewing the linked Supabase project and migration history.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm;

create table if not exists public.rag_documents (
    id_documento bigint generated always as identity primary key,
    tenant_type text not null check (tenant_type in ('GLOBAL', 'RESTAURANTE', 'USUARIO')),
    tenant_id bigint,
    id_auth_owner uuid,
    titulo text not null check (char_length(trim(titulo)) between 1 and 240),
    tipo_documento text not null check (char_length(trim(tipo_documento)) between 1 and 80),
    origem text not null check (char_length(trim(origem)) between 1 and 500),
    uri_origem text,
    conteudo_hash text not null check (conteudo_hash ~ '^[0-9a-f]{64}$'),
    versao integer not null default 1 check (versao > 0),
    prioridade integer not null default 0 check (prioridade between -1000 and 1000),
    status text not null default 'RASCUNHO' check (status in ('RASCUNHO', 'PROCESSANDO', 'ATIVO', 'ARQUIVADO', 'ERRO')),
    visibilidade text not null default 'INTERNA' check (visibilidade in ('PUBLICA', 'INTERNA', 'PRIVADA')),
    idioma text not null default 'pt-BR',
    metadados jsonb not null default '{}'::jsonb check (jsonb_typeof(metadados) = 'object'),
    criado_por uuid,
    aprovado_por uuid,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now(),
    ativo_em timestamptz,
    constraint rag_documents_tenant_shape check (
        (tenant_type = 'GLOBAL' and tenant_id is null and id_auth_owner is null)
        or (tenant_type = 'RESTAURANTE' and tenant_id is not null and id_auth_owner is null)
        or (tenant_type = 'USUARIO' and tenant_id is null and id_auth_owner is not null)
    ),
    unique (tenant_type, tenant_id, id_auth_owner, conteudo_hash, versao)
);

create table if not exists public.rag_chunks (
    id_chunk bigint generated always as identity primary key,
    id_documento bigint not null references public.rag_documents(id_documento) on delete cascade,
    indice integer not null check (indice >= 0),
    conteudo text not null check (char_length(trim(conteudo)) between 1 and 30000),
    conteudo_hash text not null check (conteudo_hash ~ '^[0-9a-f]{64}$'),
    tokens_estimados integer not null check (tokens_estimados > 0),
    inicio_caractere integer check (inicio_caractere is null or inicio_caractere >= 0),
    fim_caractere integer check (fim_caractere is null or fim_caractere >= inicio_caractere),
    embedding_modelo text,
    embedding_revisao text,
    embedding_dimensao integer check (embedding_dimensao is null or embedding_dimensao = 384),
    embedding extensions.vector(384),
    status text not null default 'PENDENTE' check (status in ('PENDENTE', 'INDEXADO', 'ERRO', 'ARQUIVADO')),
    metadados jsonb not null default '{}'::jsonb check (jsonb_typeof(metadados) = 'object'),
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now(),
    unique (id_documento, indice)
);

create table if not exists public.rag_ingestion_runs (
    id_execucao uuid primary key default gen_random_uuid(),
    id_documento bigint references public.rag_documents(id_documento) on delete set null,
    status text not null check (status in ('RECEBIDA', 'PROCESSANDO', 'CONCLUIDA', 'FALHOU', 'CANCELADA')),
    modelo_embedding text,
    embedding_revisao text,
    dimensao_embedding integer check (dimensao_embedding is null or dimensao_embedding = 384),
    total_chunks integer not null default 0 check (total_chunks >= 0),
    chunks_processados integer not null default 0 check (chunks_processados >= 0),
    erro_codigo text,
    erro_publico text,
    iniciado_em timestamptz,
    finalizado_em timestamptz,
    criado_em timestamptz not null default now()
);

create table if not exists public.rag_query_audit (
    id_auditoria bigint generated always as identity primary key,
    request_id text not null,
    id_auth_actor uuid,
    role_actor text,
    tenant_type text,
    tenant_id_hash text,
    question_hash text not null check (question_hash ~ '^[0-9a-f]{64}$'),
    modelo_embedding text,
    embedding_revisao text,
    index_version text,
    chunk_ids jsonb not null default '[]'::jsonb,
    scores jsonb not null default '[]'::jsonb,
    abstained boolean not null default false,
    fallback_code text,
    timings_ms jsonb not null default '{}'::jsonb,
    criado_em timestamptz not null default now()
);

create index if not exists rag_documents_active_scope_idx
    on public.rag_documents (tenant_type, tenant_id, id_auth_owner, status, visibilidade);
create index if not exists rag_documents_title_trgm_idx
    on public.rag_documents using gin (titulo gin_trgm_ops);
create index if not exists rag_chunks_document_idx
    on public.rag_chunks (id_documento, status, indice);
create index if not exists rag_chunks_content_trgm_idx
    on public.rag_chunks using gin (conteudo gin_trgm_ops);
alter table public.rag_chunks
    add column if not exists conteudo_busca tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(conteudo, ''))) stored;
create index if not exists rag_chunks_content_fts_idx
    on public.rag_chunks using gin (conteudo_busca);
create index if not exists rag_chunks_embedding_idx
    on public.rag_chunks using hnsw (embedding vector_cosine_ops)
    where status = 'INDEXADO' and embedding is not null;

alter table public.rag_documents enable row level security;
alter table public.rag_chunks enable row level security;
alter table public.rag_ingestion_runs enable row level security;
alter table public.rag_query_audit enable row level security;

drop policy if exists rag_documents_read_policy on public.rag_documents;
create policy rag_documents_read_policy on public.rag_documents
for select to authenticated
using (
    status = 'ATIVO'
    and (
        (tenant_type = 'GLOBAL' and visibilidade = 'PUBLICA')
        or (tenant_type = 'RESTAURANTE' and exists (
            select 1 from public.restaurantes r
            where r.id_restaurante = rag_documents.tenant_id
              and r.ativo = true
              and r.id_auth = auth.uid()
        ))
        or (tenant_type = 'USUARIO' and id_auth_owner = auth.uid())
    )
);

drop policy if exists rag_chunks_read_policy on public.rag_chunks;
create policy rag_chunks_read_policy on public.rag_chunks
for select to authenticated
using (exists (
    select 1 from public.rag_documents d
    where d.id_documento = rag_chunks.id_documento
      and d.status = 'ATIVO'
      and (
        (d.tenant_type = 'GLOBAL' and d.visibilidade = 'PUBLICA')
        or (d.tenant_type = 'RESTAURANTE' and exists (
            select 1 from public.restaurantes r
            where r.id_restaurante = d.tenant_id
              and r.ativo = true
              and r.id_auth = auth.uid()
        ))
        or (d.tenant_type = 'USUARIO' and d.id_auth_owner = auth.uid())
      )
));

drop policy if exists rag_audit_no_direct_read_policy on public.rag_query_audit;
drop policy if exists rag_ingestion_no_direct_read_policy on public.rag_ingestion_runs;

-- The application writes through the server-side service role. Keep the
-- exposed API read-only and prevent accidental direct writes from clients.
revoke all on table public.rag_documents, public.rag_chunks, public.rag_ingestion_runs, public.rag_query_audit from anon;
revoke insert, update, delete, truncate, references, trigger on table public.rag_documents, public.rag_chunks from authenticated;
revoke all on table public.rag_ingestion_runs, public.rag_query_audit from authenticated;
grant select on table public.rag_documents, public.rag_chunks to authenticated;

create or replace function public.rag_search_chunks(
    p_query_embedding extensions.vector(384),
    p_tenant_type text default 'GLOBAL',
    p_tenant_id bigint default null,
    p_user_id uuid default null,
    p_limit integer default 10
)
returns table (
    chunk_id bigint,
    document_id bigint,
    title text,
    section text,
    content text,
    tenant_type text,
    tenant_id bigint,
    score real
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
    actor uuid := auth.uid();
begin
    if p_limit is null or p_limit < 1 or p_limit > 50 then
        raise exception 'RAG_LIMIT_INVALID' using errcode = '22023';
    end if;
    if actor is not null and p_user_id is not null and actor <> p_user_id then
        raise exception 'RAG_ACTOR_INVALID' using errcode = '42501';
    end if;
    return query
    select
        c.id_chunk,
        d.id_documento,
        d.titulo,
        c.metadados ->> 'section' as section,
        c.conteudo,
        d.tenant_type,
        d.tenant_id,
        (1 - (c.embedding <=> p_query_embedding))::real as score
    from public.rag_chunks c
    join public.rag_documents d on d.id_documento = c.id_documento
    where c.status = 'INDEXADO'
      and c.embedding is not null
      and d.status = 'ATIVO'
      and (
        (d.tenant_type = 'GLOBAL' and d.visibilidade = 'PUBLICA')
        or (d.tenant_type = 'RESTAURANTE' and d.tenant_id = p_tenant_id)
        or (d.tenant_type = 'USUARIO' and d.id_auth_owner = coalesce(p_user_id, actor))
      )
    order by c.embedding <=> p_query_embedding, d.prioridade desc, d.id_documento, c.indice
    limit p_limit;
end;
$$;

create or replace function public.rag_search_chunks_hybrid(
    p_query_embedding extensions.vector(384),
    p_question text,
    p_tenant_type text default 'GLOBAL',
    p_tenant_id bigint default null,
    p_user_id uuid default null,
    p_limit integer default 10
)
returns table (
    chunk_id bigint,
    document_id bigint,
    title text,
    section text,
    content text,
    tenant_type text,
    tenant_id bigint,
    score real,
    vector_score real,
    lexical_score real
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
    actor uuid := auth.uid();
    query_tokens tsquery := websearch_to_tsquery('simple', coalesce(p_question, ''));
begin
    if p_limit is null or p_limit < 1 or p_limit > 50 then
        raise exception 'RAG_LIMIT_INVALID' using errcode = '22023';
    end if;
    if actor is not null and p_user_id is not null and actor <> p_user_id then
        raise exception 'RAG_ACTOR_INVALID' using errcode = '42501';
    end if;
    return query
    with candidates as (
        select
            c.id_chunk,
            d.id_documento,
            d.titulo,
            c.metadados ->> 'section' as secao,
            c.conteudo,
            d.tenant_type,
            d.tenant_id,
            greatest(0::real, (1 - (c.embedding <=> p_query_embedding))::real) as vscore,
            ts_rank_cd(c.conteudo_busca, query_tokens)::real as lscore,
            d.prioridade,
            d.versao,
            c.indice
        from public.rag_chunks c
        join public.rag_documents d on d.id_documento = c.id_documento
        where c.status = 'INDEXADO'
          and c.embedding is not null
          and d.status = 'ATIVO'
          and (
            (d.tenant_type = 'GLOBAL' and d.visibilidade = 'PUBLICA')
            or (d.tenant_type = 'RESTAURANTE' and d.tenant_id = p_tenant_id and p_tenant_type = 'RESTAURANTE')
            or (d.tenant_type = 'USUARIO' and d.id_auth_owner = coalesce(p_user_id, actor) and p_tenant_type = 'USUARIO')
          )
    )
    select id_chunk, id_documento, titulo, secao, conteudo, tenant_type, tenant_id,
      (0.65 * vscore + 0.35 * least(1::real, lscore))::real as score,
      vscore, lscore
    from candidates
    order by score desc, prioridade desc, versao desc, id_documento, indice
    limit p_limit;
end;
$$;

revoke all on function public.rag_search_chunks_hybrid(extensions.vector(384), text, text, bigint, uuid, integer) from public;
grant execute on function public.rag_search_chunks_hybrid(extensions.vector(384), text, text, bigint, uuid, integer) to authenticated;

revoke all on function public.rag_search_chunks(extensions.vector(384), text, bigint, uuid, integer) from public;
grant execute on function public.rag_search_chunks(extensions.vector(384), text, bigint, uuid, integer) to authenticated;
