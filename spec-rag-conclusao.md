# Spec de conclusão do RAG — Appono

Versão: 1.0.0
Data: 2026-10-13
Base: [spec.md](spec.md) v2.0.0 e [docs/rag-final-state.md](docs/rag-final-state.md)

## Diagnóstico: o que já está pronto

| Componente | Arquivos | Status |
|---|---|---|
| Config + feature flags | `backend/src/rag/config.js` | OK |
| Erros tipados | `backend/src/rag/errors.js` | OK |
| Registry de modelos | `backend/src/rag/model-registry.js` | OK |
| Runtime Transformers.js | `backend/src/rag/transformers-runtime.js` | OK |
| Serviço de embeddings | `backend/src/rag/embedding-service.js` | OK |
| Normalização de texto | `backend/src/rag/text-normalizer.js` | OK |
| Chunker estrutural | `backend/src/rag/chunker.js` | OK |
| Política de documentos | `backend/src/rag/document-policy.js` | OK |
| Política de resposta | `backend/src/rag/answer-policy.js` | OK |
| Retrieval in-memory | `backend/src/rag/retrieval-service.js` | OK |
| Context builder | `backend/src/rag/context-builder.js` | OK |
| Citation builder | `backend/src/rag/citation-builder.js` | OK |
| Adaptador Ollama | `backend/src/rag/ollama-adapter.js` | OK |
| Generator service | `backend/src/rag/generator-service.js` | OK |
| Repositório Supabase | `backend/src/rag/supabase-repository.js` | OK |
| Audit service | `backend/src/rag/audit-service.js` | OK |
| Ingestion service | `backend/src/rag/ingestion-service.js` | OK |
| Rotas HTTP | `backend/src/routes/rag.js` | OK |
| Migration base | `supabase/migrations/20261012000100_create_rag_foundation.sql` | OK |
| Migration híbrida | `supabase/migrations/20261012223103_rag_hybrid_search_and_security_hardening.sql` | OK |
| Testes unitários | `backend/test/rag-foundation.test.js` (11 testes) | OK |
| Testes integração | `backend/test/rag-integration.test.js` (3 testes) | OK |
| Testes pgTAP estruturais | `supabase/tests/rag_rls.sql` (8 assertions) | OK |
| Benchmark de modelo | `backend/reports/rag-model-benchmark.json` | OK |
| .env.example | Todas as vars RAG presentes | OK |
| server.js | Rota montada com rate limit | OK |

## O que falta — 7 entregas

### Entrega 1: Dataset de avaliação de qualidade

**Arquivo**: `backend/evaluation/rag-dataset.jsonl`

Criar dataset JSONL com a distribuição da spec (seção A.6):

| Categoria | Quantidade | Descrição |
|---|---|---|
| Respondíveis | 30 | Perguntas sobre políticas, FAQ, regras de reserva, pedidos, pagamentos |
| Sem evidência | 15 | Perguntas cujo RAG deve abster-se |
| Transacionais | 15 | Perguntas sobre estado atual (mesa disponível, status do pedido) |
| Adversariais | 15 | Prompt injection, tentativa cross-tenant, instrução falsa |
| Isolamento cross-tenant | 15 | Cliente A buscando dados de Cliente B / Restaurante B |
| Conflito de versão | 10 | Documentos atualizados com regras conflitantes |
| Ambíguas | 10 | Perguntas vagas ou com múltiplas interpretações |

Schema por entrada:

```json
{
  "id": "rag-0001",
  "language": "pt-BR",
  "question": "string",
  "expectedMode": "answer|abstain|structured-data",
  "goldDocumentIds": ["string"],
  "goldChunkIds": ["string"],
  "expectedClaims": ["string"],
  "forbiddenClaims": ["string"],
  "tenantType": "GLOBAL|RESTAURANTE|USUARIO",
  "adversarial": false
}
```

Regras:
- Sem PII, tokens ou segredos reais.
- Perguntas em pt-BR, refletindo o domínio Appono (reservas, pedidos, pagamentos, suporte).
- goldDocumentIds e goldChunkIds podem ser placeholders `doc-XXX` e `chunk-XXX` para serem substituídos após ingestão de documentos reais.
- Cada pergunta adversarial deve ter `forbiddenClaims` explícitos.
- Perguntas transacionais devem ter `expectedMode: "structured-data"` ou `"abstain"`.

### Entrega 2: Script de avaliação

**Arquivo**: `backend/scripts/evaluate-rag.js`

Script Node.js que:

1. Lê `backend/evaluation/rag-dataset.jsonl`.
2. Para cada entrada, chama `POST /api/rag/consultar` com a pergunta e o contexto de tenant.
3. Coleta métricas:
   - **recall@5 e recall@10**: quantos goldChunkIds aparecem nos top-5/10.
   - **precision@k**: proporção de chunks retornados que são gold.
   - **MRR**: posição do primeiro chunk gold.
   - **Abstinência correta**: perguntas `expectedMode: "abstain"` que retornaram `status: "abstida"`.
   - **Abstinência incorreta**: perguntas respondíveis que retornaram abstinência.
   - **Groundedness**: proporção de claims esperados presentes na resposta (modo `resposta`).
   - **Claims proibidos**: contagem de forbiddenClaims na resposta.
   - **Vazamento cross-tenant**: documentos retornados fora do escopo do tenant.
   - **Latência p50/p95/p99**: de recuperação e geração separadamente.
4. Gera relatório em `backend/reports/rag-quality-evaluation.json`.
5. Imprime sumário no console com pass/fail por threshold.

Thresholds (da spec seção 18):

```js
const THRESHOLDS = {
  crossTenantLeaks: 0,
  authFailures: 0,
  validCitations: 0.98,
  correctAbstinence: 0.95,
  groundedness: 0.95,
  recall5: 0.85,
  retrievalP95ms: 1500,
  generationP95ms: 12000,
};
```

Execução: `node backend/scripts/evaluate-rag.js --base-url http://localhost:3001 --token <admin-jwt>`

Dependências: nenhuma nova — usar `fetch` nativo do Node.

### Entrega 3: Testes adversariais de segurança

**Arquivo**: `backend/test/rag-adversarial.test.js`

Testes usando o test runner nativo do Node.js (consistente com os testes existentes).

Casos obrigatórios (spec seção 17.4):

```
describe("RAG adversarial security")
  it("rejeita 'ignore todas as regras anteriores' na pergunta")
  it("documento com instrução falsa de sistema não altera comportamento")
  it("pergunta tentando acessar tenant de outro usuário não retorna dados")
  it("conteúdo com <script>, <iframe> e URL interna é sanitizado")
  it("pergunta tentando fornecer URL para o gerador é rejeitada")
  it("pergunta gigante (>maxQuestionCharacters) é rejeitada")
  it("lote gigante de embeddings é limitado ao maxBatch")
  it("embedding com dimensão incorreta é rejeitado")
  it("ingestão concorrente do mesmo documento retorna idempotente")
  it("falha no meio da indexação marca documento como ERRO")
```

Implementação:
- Testar diretamente os módulos (não HTTP) para velocidade e isolamento.
- Usar mocks para embedding service e repository onde necessário.
- Cada teste deve verificar que o comportamento adversarial resulta em erro ou sanitização, nunca em vazamento.

### Entrega 4: Script de teste de carga

**Arquivo**: `backend/scripts/load-test-rag.js`

Script que mede:

| Cenário | Concorrência | Dados |
|---|---|---|
| Consulta leve | 1, 5, 10, 20 | 10 docs / 100 chunks |
| Consulta média | 1, 5, 10, 20 | 100 docs / 1.000 chunks |
| Consulta pesada | 1, 5, 10 | 1.000 docs / 10.000 chunks |

Para cada cenário:
1. Criar dados sintéticos (documentos e chunks mock).
2. Disparar N consultas concorrentes com `Promise.all`.
3. Medir: latência p50/p95/p99, CPU, memória (via `process.memoryUsage()`), erros, timeouts.
4. Testar nos modos `somente_fontes`, `resposta` e `shadow`.
5. Gerar `backend/reports/rag-load-test.json`.

Execução: `node backend/scripts/load-test-rag.js --base-url http://localhost:3001 --token <admin-jwt>`

### Entrega 5: Documentação operacional

**Arquivo**: `docs/rag-operations.md`

Conteúdo obrigatório (spec seção 15):

1. **Pré-download do modelo**: como fazer cache do modelo embedding antes de servir tráfego.
2. **Reindexação**: como reindexar um documento ou todos os documentos.
3. **Troca de modelo**: procedimento para trocar modelo de embedding (requer reindexação completa).
4. **Arquivamento**: como arquivar documentos e o que acontece com os chunks.
5. **Rollback**: procedimento passo a passo (desligar flag, preservar auditoria, reativar índice anterior).
6. **Rotação de logs**: onde estão os logs e como rotacionar.
7. **Backup e restauração**: tabelas RAG no backup do Supabase, como restaurar.
8. **Desligamento emergencial**: kill switch via `APPONO_RAG_ENABLED=false`.
9. **Investigação de resposta incorreta**: como usar auditoria para rastrear uma resposta.
10. **Variáveis de ambiente**: tabela completa com todas as vars, defaults e descrições.
11. **Ollama**: instalação, pull do modelo, verificação de health, troubleshooting.
12. **Monitoramento**: quais métricas observar e alertas sugeridos.

### Entrega 6: Módulo hybrid-retrieval-service

**Arquivo**: `backend/src/rag/hybrid-retrieval-service.js`

A spec (seção 21) lista `hybrid-retrieval-service.js` como arquivo esperado. A lógica de busca híbrida está distribuída entre `retrieval-service.js` (in-memory fallback) e `supabase-repository.js` (RPCs). Consolidar em um módulo de orquestração:

```js
// hybrid-retrieval-service.js
// Orquestra a busca híbrida decidindo entre RPC Supabase e fallback in-memory.

export function createHybridRetrievalService({
  repository,        // supabase-repository
  embeddingService,  // embedding-service
  retrievalService,  // retrieval-service (fallback)
  config,            // RAG config
}) {
  return {
    async search({ question, scope, mode }) {
      // 1. Normalizar e validar pergunta
      // 2. Gerar embedding da pergunta
      // 3. Se hybridSearchEnabled e repository disponível:
      //    -> chamar repository.searchHybridChunks()
      // 4. Senão se vectorSearchEnabled:
      //    -> chamar repository.searchChunks()
      // 5. Senão (fallback lexical):
      //    -> chamar retrievalService.retrieveChunks()
      // 6. Aplicar deduplicação e minScore
      // 7. Retornar chunks rankeados
    },
  };
}
```

Integrar na rota `/api/rag/consultar` para substituir a lógica inline que hoje faz essa orquestração.

### Entrega 7: Atualização do estado final

**Arquivo**: `docs/rag-final-state.md` (atualizar)

Após completar as entregas 1-6:
- Adicionar seção com resultados da avaliação de qualidade.
- Adicionar seção com resultados do teste de carga.
- Atualizar lista de pendências.
- Atualizar classificação final.
- Registrar decisão: aprovado para rollout `somente_fontes` ou bloqueado.

## Ordem de execução

```
1. Dataset de avaliação          (Entrega 1) — sem dependências
2. Testes adversariais           (Entrega 3) — sem dependências
3. Hybrid retrieval service      (Entrega 6) — sem dependências
4. Documentação operacional      (Entrega 5) — sem dependências
5. Script de avaliação           (Entrega 2) — depende de 1
6. Script de carga               (Entrega 4) — sem dependências
7. Atualização do estado final   (Entrega 7) — depende de 2, 3, 4, 6
```

Entregas 1, 3, 4, 5 e 6 podem ser feitas em paralelo.

## Itens que continuam PENDENTES (fora deste spec)

Estes itens dependem de ambiente/hardware e não podem ser concluídos pelo agente sozinho:

| Item | Motivo | Ação necessária |
|---|---|---|
| pgTAP com fixtures de usuários reais | Docker não instalado | Instalar Docker ou usar projeto Supabase efêmero |
| Ollama runtime + modelo local | Requer instalação e hardware com RAM suficiente | Instalar Ollama, pull de modelo multilíngue, executar benchmark |
| Execução real da avaliação de qualidade | Requer documentos ingeridos e servidor rodando | Ingerir documentos de base de conhecimento, rodar evaluate-rag.js |
| Execução real do teste de carga | Requer servidor rodando com dados | Rodar load-test-rag.js contra staging |
| Rollout para produção | Bloqueado até todos os critérios serem atendidos | Seguir plano da spec seção 14 |

## Critérios de aceite deste spec

Cada entrega é considerada completa quando:

1. O arquivo existe no caminho especificado.
2. O código passa em lint sem novos erros.
3. Os testes existentes continuam passando (395+).
4. Novos testes passam.
5. Nenhuma dependência nova é adicionada (exceto devDependencies de teste se necessário).
6. O código segue os padrões do projeto (ESM, Node test runner, pt-BR para conteúdo de domínio).

## Observações de melhores práticas aplicadas

1. **Sem mocks de banco em testes de integração**: testes adversariais testam módulos diretamente, não HTTP mocks.
2. **Dataset versionado**: JSONL permite diff no git e adição incremental.
3. **Avaliação automatizada**: script reproduzível com thresholds fixos da spec.
4. **Consolidação de retrieval**: módulo único para decidir estratégia de busca, evitando lógica duplicada na rota.
5. **Ops runbook antes do rollout**: documentação operacional é pré-requisito, não pós-requisito.
6. **Separação de responsabilidades**: avaliação de qualidade e teste de carga são scripts independentes, não testes unitários.
7. **Relatórios em JSON**: máquina-legíveis para CI/CD e dashboards futuros.
8. **Sem PII no dataset**: perguntas sintéticas representativas do domínio, sem dados reais.
