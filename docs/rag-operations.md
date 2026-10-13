# Runbook operacional — RAG Appono

## 1. Pre-download do modelo de embedding

O modelo deve ser baixado antes de servir trafego para evitar latencia na primeira requisicao.

```bash
node -e "
const { getFeaturePipeline } = require('./backend/src/rag/transformers-runtime');
getFeaturePipeline({
  modelId: process.env.APPONO_RAG_MODEL_ID,
  revision: process.env.APPONO_RAG_MODEL_REVISION,
  cacheDir: process.env.APPONO_RAG_MODEL_CACHE_DIR || undefined,
}).then(() => console.log('Modelo carregado com sucesso.'))
  .catch((e) => { console.error('Falha:', e.message); process.exit(1); });
"
```

O cache padrao e gerenciado pelo `@huggingface/transformers` no diretorio do sistema. Para especificar um caminho customizado, defina `APPONO_RAG_MODEL_CACHE_DIR`.

## 2. Reindexacao de documentos

### Reindexar um documento especifico

```bash
curl -X POST http://localhost:3001/api/rag/documentos/{id}/indexar \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Novo conteudo do documento..."}'
```

O endpoint incrementa a versao, cria novo documento com status PROCESSANDO, gera chunks e embeddings, ativa o novo documento e arquiva o anterior.

### Reindexar todos os documentos

Nao ha endpoint de reindexacao em massa. Para reindexar todos:

1. Listar documentos ativos: `GET /api/rag/documentos?status=ATIVO`.
2. Para cada documento, chamar `POST /api/rag/documentos/{id}/indexar` com o conteudo atualizado.
3. Monitorar execucoes via `GET /api/rag/ingestoes/{runId}`.

## 3. Troca de modelo de embedding

A troca de modelo exige reindexacao completa porque embeddings de modelos diferentes sao incompativeis.

1. Atualizar `.env`:
   ```
   APPONO_RAG_MODEL_ID=novo-modelo
   APPONO_RAG_MODEL_REVISION=sha-do-novo-modelo
   ```
2. Desligar busca: `APPONO_RAG_VECTOR_SEARCH_ENABLED=false` e `APPONO_RAG_HYBRID_SEARCH_ENABLED=false`.
3. Reiniciar o servidor para carregar o novo modelo.
4. Reindexar todos os documentos ativos.
5. Verificar health: `GET /api/rag/health`.
6. Reativar busca apos confirmar que todos os documentos foram reindexados.

## 4. Arquivamento de documentos

```bash
curl -X POST http://localhost:3001/api/rag/documentos/{id}/arquivar \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Documentos arquivados:
- Nao aparecem em buscas (RLS filtra por status ATIVO).
- Chunks associados permanecem no banco mas nao sao retornados.
- A auditoria e preservada.
- Nao podem ser publicados.

## 5. Rollback

### Procedimento completo

1. **Desligar RAG**: `APPONO_RAG_ENABLED=false` — impede novas consultas e ingestoes.
2. **Impedir ingestoes**: `APPONO_RAG_INGESTION_ENABLED=false`.
3. **Preservar auditoria**: nao apagar tabela `rag_query_audit`.
4. **Selecionar indice anterior**: se houve troca de modelo, restaurar as variaveis anteriores.
5. **Limpar cache**: reiniciar o servidor para limpar o cache de embedding em memoria.
6. **Smoke test**: reativar apenas `APPONO_RAG_ENABLED=true` e `APPONO_RAG_VECTOR_SEARCH_ENABLED=true`, testar com uma consulta de fontes.
7. **Registrar**: documentar causa, impacto e decisao em incidente.
8. **Reabrir**: so apos avaliacao de regressao.

### Rollback parcial (apenas LLM)

Se o problema for apenas na geracao:
1. `APPONO_RAG_LLM_ENABLED=false` — desliga o Ollama.
2. O modo `somente_fontes` continua funcionando normalmente.

## 6. Rotacao de logs

Logs sao emitidos via stdout/stderr em formato estruturado. A rotacao depende da infraestrutura:

- **PM2**: `pm2 install pm2-logrotate` com `max_size: 10M` e `retain: 30`.
- **Docker**: configurar `--log-opt max-size=10m --log-opt max-file=5`.
- **systemd**: `journalctl --vacuum-size=500M`.

Logs RAG nunca contem:
- Pergunta do usuario (apenas hash SHA-256).
- Tenant ID (apenas hash).
- Conteudo de documento.
- Tokens, prompts ou segredos.

## 7. Backup e restauracao

### Tabelas RAG no Supabase

As tabelas `rag_documents`, `rag_chunks`, `rag_ingestion_runs` e `rag_query_audit` sao incluidas no backup automatico do Supabase.

### Restauracao

1. Restaurar o backup do Supabase contendo as tabelas RAG.
2. Verificar que as extensoes `vector` e `pg_trgm` estao no schema `extensions`.
3. Verificar que as RPCs `rag_search_chunks` e `rag_search_chunks_hybrid` existem.
4. Verificar RLS em todas as tabelas.
5. Testar com consulta de fontes.

### Backup manual de documentos

```sql
COPY (SELECT * FROM rag_documents WHERE status = 'ATIVO') TO '/tmp/rag_documents_backup.csv' WITH CSV HEADER;
```

## 8. Desligamento emergencial (kill switch)

```bash
# Desligar tudo
export APPONO_RAG_ENABLED=false

# Reiniciar servidor
pm2 restart appono-backend
# ou
systemctl restart appono
```

O kill switch:
- Impede todas as consultas RAG (retorna 503).
- Impede novas ingestoes.
- Nao afeta nenhum outro fluxo do Appono (reservas, pedidos, pagamentos).
- Preserva dados e auditoria.
- E reversivel: basta reativar a flag e reiniciar.

## 9. Investigacao de resposta incorreta

### Rastrear pela auditoria

1. Obter o `requestId` da resposta retornada ao cliente.
2. Consultar a auditoria:
   ```sql
   SELECT * FROM rag_query_audit WHERE request_id = 'uuid-da-requisicao';
   ```
3. Verificar:
   - `abstained`: se o sistema deveria ter se abstido.
   - `chunk_ids`: quais chunks foram usados.
   - `scores`: relevancia dos chunks.
   - `fallback_code`: se houve fallback.
   - `timings_ms`: latencia de cada etapa.
4. Consultar os chunks usados:
   ```sql
   SELECT id_chunk, id_documento, conteudo, metadados
   FROM rag_chunks
   WHERE id_chunk = ANY('{1,2,3}'::bigint[]);
   ```
5. Verificar o documento de origem e sua versao.

### Causas comuns

| Sintoma | Causa provavel | Acao |
|---|---|---|
| Resposta inventada | Groundedness baixo, threshold de abstinencia inadequado | Aumentar `APPONO_RAG_MIN_SCORE` |
| Fonte errada | Chunks de baixa qualidade no topo | Revisar chunking e prioridade editorial |
| Vazamento cross-tenant | Bug na RLS ou scope | Emergencia: desligar RAG, investigar RLS |
| Timeout | Modelo lento ou muitos chunks | Reduzir `APPONO_RAG_TOP_K` ou `APPONO_RAG_LLM_TIMEOUT_MS` |
| Abstinencia excessiva | Threshold muito alto | Reduzir `APPONO_RAG_MIN_SCORE` |

## 10. Variaveis de ambiente

| Variavel | Default | Descricao |
|---|---|---|
| `APPONO_RAG_ENABLED` | `false` | Kill switch geral do RAG |
| `APPONO_RAG_INGESTION_ENABLED` | `false` | Permite ingestao de documentos |
| `APPONO_RAG_VECTOR_SEARCH_ENABLED` | `false` | Busca vetorial via pgvector |
| `APPONO_RAG_HYBRID_SEARCH_ENABLED` | `false` | Busca hibrida (vetorial + lexical) |
| `APPONO_RAG_LLM_ENABLED` | `false` | Geracao de resposta via LLM |
| `APPONO_RAG_LLM_PROVIDER` | `ollama` | Provedor de LLM |
| `APPONO_RAG_LLM_BASE_URL` | `http://127.0.0.1:11434` | URL do Ollama |
| `APPONO_RAG_LLM_MODEL` | _(vazio)_ | Modelo Ollama |
| `APPONO_RAG_LLM_TIMEOUT_MS` | `12000` | Timeout de geracao (1000-60000) |
| `APPONO_RAG_LLM_MAX_OUTPUT_TOKENS` | `500` | Limite de tokens de saida (64-4000) |
| `APPONO_RAG_LLM_TEMPERATURE` | `0` | Temperatura do LLM (0-1) |
| `APPONO_RAG_SHADOW_MODE` | `false` | Modo shadow para avaliacao |
| `APPONO_RAG_ALLOWED_ROLES` | `admin` | Roles autorizadas (separadas por virgula) |
| `APPONO_RAG_MODEL_ID` | _(vazio)_ | Modelo de embedding |
| `APPONO_RAG_MODEL_REVISION` | _(vazio)_ | SHA da revisao do modelo |
| `APPONO_RAG_MODEL_CACHE_DIR` | _(vazio)_ | Diretorio de cache do modelo |
| `APPONO_RAG_TOP_K` | `10` | Maximo de chunks retornados (1-50) |
| `APPONO_RAG_MIN_SCORE` | _(null)_ | Score minimo para nao abster |
| `APPONO_RAG_MAX_CONTEXT_TOKENS` | `4000` | Limite de tokens no contexto (256-32000) |
| `APPONO_RAG_MAX_QUESTION_CHARACTERS` | `4000` | Limite de caracteres na pergunta (100-20000) |
| `APPONO_RAG_MAX_EMBEDDING_BATCH` | `16` | Tamanho maximo do lote de embedding (1-128) |

## 11. Ollama

### Instalacao

```powershell
# Windows
winget install Ollama.Ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### Pull do modelo

```bash
ollama pull gemma3:4b
ollama show gemma3:4b --modelfile
```

### Verificacao de health

```bash
curl http://127.0.0.1:11434/api/tags
```

### Configuracao

```env
APPONO_RAG_LLM_ENABLED=true
APPONO_RAG_LLM_PROVIDER=ollama
APPONO_RAG_LLM_BASE_URL=http://127.0.0.1:11434
APPONO_RAG_LLM_MODEL=gemma3:4b
```

### Troubleshooting

| Problema | Solucao |
|---|---|
| Ollama nao responde | Verificar se o servico esta rodando: `ollama list` |
| Timeout na geracao | Aumentar `APPONO_RAG_LLM_TIMEOUT_MS` ou usar modelo menor |
| Memoria insuficiente | Usar modelo com quantizacao menor (q4_0) |
| Resposta vazia | Verificar logs do Ollama e modelo carregado |

## 12. Monitoramento

### Metricas a observar

- **Consultas por minuto**: pico e media.
- **Taxa de abstinencia**: se subir muito, revisar threshold ou qualidade dos documentos.
- **Taxa de erro**: falhas de embedding, LLM ou banco.
- **Latencia p95**: recuperacao (target < 1.5s), geracao (target < 12s).
- **Memoria do processo**: crescimento indica leak no cache de embedding.
- **Documentos por status**: ativos, arquivados, com erro.

### Alertas sugeridos

| Alerta | Condicao | Severidade |
|---|---|---|
| RAG indisponivel | Health retorna `disabled` quando deveria estar `ready` | Critica |
| Latencia alta | p95 de recuperacao > 3s | Alta |
| Taxa de erro | > 5% das consultas em 5min | Alta |
| Abstinencia alta | > 80% das consultas em 1h | Media |
| Memoria alta | Heap > 1GB | Media |
| Documentos com erro | Contagem > 0 por mais de 1h | Baixa |
