-- Execute with `supabase test db` after the RAG migration is applied locally.
-- These structural assertions deliberately do not fabricate users or documents;
-- tenant allow/deny cases belong in the project-specific authenticated fixtures.
begin;
select plan(8);

select is((select count(*)::int from pg_class where oid = 'public.rag_documents'::regclass and relrowsecurity), 1, 'documents have RLS enabled');
select is((select count(*)::int from pg_class where oid = 'public.rag_chunks'::regclass and relrowsecurity), 1, 'chunks have RLS enabled');
select is((select count(*)::int from pg_class where oid = 'public.rag_ingestion_runs'::regclass and relrowsecurity), 1, 'ingestion runs have RLS enabled');
select is((select count(*)::int from pg_class where oid = 'public.rag_query_audit'::regclass and relrowsecurity), 1, 'audit has RLS enabled');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'rag_documents' and policyname = 'rag_documents_read_policy'), 1, 'document read policy exists');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'rag_chunks' and policyname = 'rag_chunks_read_policy'), 1, 'chunk read policy exists');
select is((select count(*)::int from pg_proc where pronamespace = 'public'::regnamespace and proname = 'rag_search_chunks'), 1, 'vector search RPC exists');
select is((select count(*)::int from pg_proc where pronamespace = 'public'::regnamespace and proname = 'rag_search_chunks_hybrid'), 1, 'hybrid search RPC exists');

select * from finish();
rollback;
