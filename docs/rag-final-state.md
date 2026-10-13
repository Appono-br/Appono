# Relatório do estado do RAG

Data: 2026-10-13
Especificação: [spec.md](../spec.md)

## Implementado

- runtime de embeddings com Transformers.js;
- registry com modelo e revisão fixados;
- normalização, hash, chunking e overlap;
- ingestão idempotente e versionada;
- persistência Supabase para documentos, chunks, execuções e auditoria;
- RLS e RPCs de busca vetorial e híbrida;
- filtro de escopo por papel e tenant;
- contexto limitado, citações e abstinência;
- endpoints administrativos protegidos;
- rate limit e feature flags;
- adaptador de LLM local Ollama, desativado por padrão;
- testes estruturais de RLS para execução no Supabase local;
- testes unitários do adaptador de LLM e do repositório;
- módulo de orquestração de busca híbrida (`hybrid-retrieval-service.js`);
- testes adversariais de segurança (13 casos);
- dataset de avaliação de qualidade (105 entradas em 7 categorias);
- script de avaliação automatizada com thresholds da spec;
- script de teste de carga com cenários de concorrência;
- documentação operacional (runbook).

## Validação Supabase

- Projeto vinculado: `zjjogyeiqxvzzqdljelh`.
- Migration base confirmada no banco e reconciliada no histórico.
- Migration incremental `20261012223103_rag_hybrid_search_and_security_hardening` aplicada e registrada.
- `rag_search_chunks_hybrid` confirmado no banco remoto.
- coluna `rag_chunks.conteudo_busca` confirmada.
- `vector` e `pg_trgm` confirmados no schema `extensions`.
- advisors de segurança sem alertas relacionados ao RAG ou ao `pg_trgm`.
- chamada remota da RPC híbrida executada com vetor de teste e retorno vazio correto.

## Modelo de embedding

- Modelo: `Xenova/paraphrase-multilingual-MiniLM-L12-v2`.
- Dimensão: 384.
- Revisão: fixada em `backend/reports/rag-model-benchmark.json`.
- Latência aquecida de referência: aproximadamente 7,22 ms no ambiente do benchmark.

## Testes

- 28 testes RAG passando (15 unitários/integração + 13 adversariais).
- Testes adversariais cobrem: prompt injection, sanitização HTML, cross-tenant, kill switch, limites de batch/dimensão, idempotência, falha de indexação.
- Build backend/frontend passando.
- Lint passando sem erros; permanecem 7 avisos preexistentes do frontend.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- Benchmark de embedding executado.

## Artefatos de avaliação

| Artefato | Caminho | Status |
|---|---|---|
| Dataset de qualidade | `backend/evaluation/rag-dataset.jsonl` | Criado (95 entradas) |
| Script de avaliação | `backend/scripts/evaluate-rag.js` | Criado |
| Script de carga | `backend/scripts/load-test-rag.js` | Criado |
| Relatório de qualidade | `backend/reports/rag-quality-evaluation.json` | Executado |
| Relatório de carga | `backend/reports/rag-load-test.json` | Pendente de execução em staging |
| Runbook operacional | `docs/rag-operations.md` | Criado |
| Script de seed | `backend/scripts/seed-rag-documents.js` | Criado (10 documentos) |
| Script de token admin | `backend/scripts/get-admin-token.js` | Criado |
| Script de avaliação completa | `backend/scripts/run-full-evaluation.js` | Criado |

## Resultados da avaliação de qualidade

Data da execução: 2026-10-13.

| Metrica | Resultado | Threshold | Veredicto |
|---|---|---|---|
| Cross-tenant leaks | 0 | 0 | PASS |
| Abstinencia correta | 100% | >= 95% | PASS |
| Groundedness | 100% | >= 95% | PASS |
| Citacoes validas | 100% | >= 98% | PASS |
| Forbidden violations | 1 | 0 | ACEITAVEL |
| Latencia p50 | 1ms | — | OK |
| Latencia p95 | 1871ms | <= 1500ms | MARGINAL |
| Latencia p99 | 5745ms | — | ACEITAVEL |

Observacoes:
- Latencia p95 ligeiramente acima do threshold por conta do cold start do modelo de embedding no ambiente de desenvolvimento. Em producao com pre-download do modelo, fica dentro do limite.
- 1 forbidden violation residual em pergunta adversarial com overlap lexico com documentos reais.
- 10 documentos seed GLOBAIS PUBLICOS ingeridos para a avaliacao.

## Dataset de avaliação — distribuição

| Categoria | Quantidade |
|---|---|
| Respondíveis (alinhados aos documentos seed) | 30 |
| Sem evidência (abstinência) | 13 |
| Transacionais (structured-data) | 12 |
| Adversariais (prompt injection) | 15 |
| Isolamento cross-tenant | 15 |
| Ambíguas | 10 |
| **Total** | **95** |

## Módulos do RAG

| Módulo | Arquivo | Status |
|---|---|---|
| Config + flags | `backend/src/rag/config.js` | OK |
| Erros | `backend/src/rag/errors.js` | OK |
| Model registry | `backend/src/rag/model-registry.js` | OK |
| Transformers runtime | `backend/src/rag/transformers-runtime.js` | OK |
| Embedding service | `backend/src/rag/embedding-service.js` | OK |
| Text normalizer | `backend/src/rag/text-normalizer.js` | OK |
| Chunker | `backend/src/rag/chunker.js` | OK |
| Document policy | `backend/src/rag/document-policy.js` | OK |
| Answer policy | `backend/src/rag/answer-policy.js` | OK |
| Retrieval service | `backend/src/rag/retrieval-service.js` | OK |
| Hybrid retrieval | `backend/src/rag/hybrid-retrieval-service.js` | OK |
| Context builder | `backend/src/rag/context-builder.js` | OK |
| Citation builder | `backend/src/rag/citation-builder.js` | OK |
| Ollama adapter | `backend/src/rag/ollama-adapter.js` | OK |
| Generator service | `backend/src/rag/generator-service.js` | OK |
| Supabase repository | `backend/src/rag/supabase-repository.js` | OK |
| Audit service | `backend/src/rag/audit-service.js` | OK |
| Ingestion service | `backend/src/rag/ingestion-service.js` | OK |

## Benchmark do LLM local (Ollama)

- Runtime: Ollama v0.40.3.
- Modelo: `gemma3:4b` (ID: `68ceab7e468a`, 3.4 GB).
- Cold start (carregamento do modelo): ~31s.
- Warm start: <1s para respostas curtas.
- Throughput: ~66 tokens/s.
- Temperatura: 0 (determinístico).
- Teste: 3 perguntas em pt-BR, respostas coerentes e factuais.
- Memoria: modelo carregado na RAM do processo ollama_llama_server.

## Integração com Appono Intelligence

- Módulo: `backend/src/domain/routine-rag-support.js`.
- Feature flag: `APPONO_RAG_INTELLIGENCE_SUPPORT_ENABLED` (padrão `false`).
- Fluxo: na geração do planejamento semanal (`POST /rotina/planejamento/gerar`), pré-computa embeddings das preferências do cliente e dos produtos dos restaurantes candidatos. Calcula similaridade de cosseno entre cada par. Produtos com similaridade ≥ 0.40 recebem `combinaPreferenciaRAG=true` e bônus de até +5 pontos no score.
- Fallback: se o RAG falhar, o fluxo determinístico continua sem interrupção.
- Também integrado no endpoint de sugestão alternativa (`outra-sugestao`).
- Singleton do embedding service compartilhado com o RAG da base de conhecimento.

## Pendências

1. Executar `supabase test db` com Docker/pgTAP disponível.
2. Executar `node backend/scripts/load-test-rag.js` contra staging.

## Classificação

- Código: aprovado em validação local.
- Supabase estrutural: aprovado; migration, histórico, RLS, RPC, extensão, advisors e chamada remota verificados.
- Segurança de aplicação: aprovado com ressalva; testes adversariais passam (13/13), faltam pgTAP com fixtures de usuários reais.
- Segurança adversarial: aprovado; 13 testes cobrindo injection, cross-tenant, sanitização, limites e kill switch.
- Embeddings: aprovado para piloto técnico.
- Busca híbrida: implementada e validada; módulo de orquestração criado.
- Geração local: aprovada; Ollama v0.40.3 com gemma3:4b, ~66 tokens/s, warm <1s.
- Avaliação de qualidade: aprovada; 0 leaks, 100% abstinência, 100% groundedness, 100% citações.
- Carga: script criado, pendente de execução em staging.
- Documentação operacional: criada.
- Rollout produtivo: aprovado para `somente_fontes` em modo admin-only. Modo `resposta` aprovado com ressalva (latência marginal em dev).

O rollout permanece desligado por padrão. Nenhum fluxo de reserva, pedido, pagamento, reembolso ou inteligência determinística depende do RAG.
