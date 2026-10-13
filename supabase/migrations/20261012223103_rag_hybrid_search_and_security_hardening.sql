-- Incremental RAG hardening. The foundation migration was applied directly;
-- this migration is intentionally additive and must be recorded in history.

alter extension pg_trgm set schema extensions;

alter table public.rag_chunks
    add column if not exists conteudo_busca tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(conteudo, ''))) stored;

create index if not exists rag_chunks_content_fts_idx
    on public.rag_chunks using gin (conteudo_busca);

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

revoke all on table public.rag_documents, public.rag_chunks, public.rag_ingestion_runs, public.rag_query_audit from anon;
revoke insert, update, delete, truncate, references, trigger on table public.rag_documents, public.rag_chunks from authenticated;
revoke all on table public.rag_ingestion_runs, public.rag_query_audit from authenticated;
grant select on table public.rag_documents, public.rag_chunks to authenticated;

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
    select candidates.id_chunk, candidates.id_documento, candidates.titulo, candidates.secao, candidates.conteudo, candidates.tenant_type, candidates.tenant_id,
      (0.65 * candidates.vscore + 0.35 * least(1::real, candidates.lscore))::real as score,
      candidates.vscore, candidates.lscore
    from candidates
    order by score desc, candidates.prioridade desc, candidates.versao desc, candidates.id_documento, candidates.indice
    limit p_limit;
end;
$$;

revoke all on function public.rag_search_chunks_hybrid(extensions.vector(384), text, text, bigint, uuid, integer) from public;
grant execute on function public.rag_search_chunks_hybrid(extensions.vector(384), text, text, bigint, uuid, integer) to authenticated;
