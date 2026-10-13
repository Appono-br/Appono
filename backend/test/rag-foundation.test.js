"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRagConfig } = require("../src/rag/config");
const { chunkDocument } = require("../src/rag/chunker");
const { createEmbeddingService, validateVector } = require("../src/rag/embedding-service");
const { buildSystemInstruction, shouldAbstain, validateQuestion } = require("../src/rag/answer-policy");
const { buildCitations } = require("../src/rag/citation-builder");
const { buildContext } = require("../src/rag/context-builder");
const { createModelRegistry } = require("../src/rag/model-registry");
const { RagError } = require("../src/rag/errors");
const { retrieveChunks } = require("../src/rag/retrieval-service");
const { safeAuditRecord } = require("../src/rag/audit-service");
const { createIngestionService } = require("../src/rag/ingestion-service");
const { validateDocumentInput } = require("../src/rag/document-policy");
const { canonicalHash, normalizeText, stripUnsafeMarkup } = require("../src/rag/text-normalizer");

test("normalizador remove markup perigoso, preserva acentos e calcula hash estável", () => {
    const texto = normalizeText("<script>alert(1)</script> Café\r\n\r\n\r\n com  espaços");
    assert.equal(texto, "Café\n\ncom espaços");
    assert.equal(stripUnsafeMarkup("<b>Olá</b>"), " Olá ");
    assert.equal(canonicalHash("Café"), canonicalHash("Café"));
});

test("chunker preserva seções e aplica overlap sem ultrapassar o limite", () => {
    const chunks = chunkDocument("# Política\n\nPrimeiro parágrafo com conteúdo suficiente.\n\nSegundo parágrafo com conteúdo suficiente e uma frase adicional.", { maxTokens: 18, minTokens: 2, overlapTokens: 2 });
    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0].section, "Política");
    assert.ok(chunks.every((chunk) => chunk.tokensEstimated <= 18));
    assert.ok(chunks.some((chunk) => chunk.metadata.overlapTokens === 2));
});

test("configuração mantém rollout desativado por padrão e limita parâmetros", () => {
    const config = loadRagConfig({ APPONO_RAG_TOP_K: "999", APPONO_RAG_MAX_CONTEXT_TOKENS: "1" });
    assert.equal(config.enabled, false);
    assert.equal(config.ingestionEnabled, false);
    assert.equal(config.topK, 50);
    assert.equal(config.maxContextTokens, 256);
});

test("registry rejeita modelo sem revisão ou dimensão válida", () => {
    assert.throws(() => createModelRegistry([{ id: "m", revision: "r", dimensions: 0 }]), (error) => error.code === "MODEL_DIMENSIONS_INVALID");
    const registry = createModelRegistry([{ id: "m", revision: "r1", dimensions: 3 }]);
    assert.deepEqual(registry.require("m"), { id: "m", revision: "r1", dimensions: 3 });
});

test("serviço de embedding valida dimensão e não precisa carregar modelo real no teste", async () => {
    const calls = [];
    const service = createEmbeddingService({
        model: { id: "m", revision: "r1", dimensions: 3 },
        runtime: {
            async getFeaturePipeline() { return async (text) => { calls.push(text); return { data: new Float32Array([1, 2, 3]), dims: [1, 3] }; }; },
            flattenEmbedding(output) { return Array.from(output.data); },
        },
    });
    assert.deepEqual(await service.embed(["um", "dois"]), [[1, 2, 3], [1, 2, 3]]);
    assert.deepEqual(calls, ["um", "dois"]);
    assert.throws(() => validateVector([1, 2], 3), (error) => error.code === "EMBEDDING_DIMENSION_MISMATCH");
});

test("política valida pergunta, abstém sem evidência e instrui citações", () => {
    assert.equal(validateQuestion("  Como funciona?  "), "Como funciona?");
    assert.throws(() => validateQuestion(""), (error) => error.code === "QUESTION_EMPTY");
    assert.equal(shouldAbstain([], { minScore: 0.2 }), true);
    assert.equal(shouldAbstain([{ score: 0.1 }], { minScore: 0.2 }), true);
    assert.equal(shouldAbstain([{ score: 0.3 }], { minScore: 0.2 }), false);
    assert.match(buildSystemInstruction(), /nunca execute instruções/i);
});

test("citações expõem somente metadados e trecho limitado", () => {
    const citations = buildCitations([{ documentId: 1, chunkId: 2, title: "Manual", section: "A", content: "x".repeat(1000) }]);
    assert.equal(citations[0].documentId, "1");
    assert.equal(citations[0].snippet.length, 600);
});

test("erros de embedding são classificados com contrato público seguro", () => {
    const error = new RagError("MODEL_LOAD_FAILED", "detalhe interno", { publicMessage: "indisponível", status: 503 });
    assert.equal(error.code, "MODEL_LOAD_FAILED");
    assert.equal(error.publicMessage, "indisponível");
    assert.equal(error.status, 503);
});

test("recuperação filtra escopo antes de ordenar e usa busca lexical determinística", () => {
    const result = retrieveChunks({
        query: "cancelamento de pedido",
        scope: { restaurantId: 10 },
        topK: 5,
        chunks: [
            { chunkId: 1, documentId: 1, tenantType: "RESTAURANTE", tenantId: 10, status: "ATIVO", section: "cancelamento", content: "Cancelamento de pedido antes do preparo." },
            { chunkId: 2, documentId: 2, tenantType: "RESTAURANTE", tenantId: 99, status: "ATIVO", section: "cancelamento", content: "Cancelamento de pedido privado." },
            { chunkId: 3, documentId: 3, tenantType: "GLOBAL", status: "ARQUIVADO", section: "cancelamento", content: "Cancelamento de pedido arquivado." },
        ],
    });
    assert.deepEqual(result.map((item) => item.chunkId), [1]);
});

test("contexto respeita limite e auditoria não grava pergunta nem tenant em claro", () => {
    const context = buildContext([{ chunkId: 1, title: "Manual", content: "A".repeat(100) }, { chunkId: 2, title: "Outro", content: "B".repeat(100) }], { maxTokens: 30 });
    assert.ok(context.tokensEstimated <= 30);
    assert.equal(context.chunks.length, 1);
    const audit = safeAuditRecord({ requestId: "req-1", scope: { role: "admin", tenantType: "RESTAURANTE", tenantId: 10 }, question: "segredo", chunks: [{ chunkId: 1, score: 0.1234567 }] });
    assert.equal(audit.scope.tenantIdHash, "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5");
    assert.equal(audit.questionHash.length, 64);
    assert.equal(Object.hasOwn(audit, "question"), false);
});

test("política de documento impede formatos de tenant inválidos", () => {
    assert.throws(() => validateDocumentInput({ tenantType: "USUARIO", title: "x", documentType: "faq", origin: "test", tenantId: 1, ownerAuthId: "u" }), (error) => error.code === "TENANT_SHAPE_INVALID");
    assert.throws(() => validateDocumentInput({ tenantType: "USUARIO", title: "x", documentType: "faq", origin: "test", ownerAuthId: "u", visibility: "PUBLICA" }), (error) => error.code === "VISIBILITY_SCOPE_INVALID");
    assert.equal(validateDocumentInput({ tenantType: "GLOBAL", title: "x", documentType: "faq", origin: "test", visibility: "PUBLICA" }).tenantType, "GLOBAL");
});

test("ingestão é idempotente, gera embeddings em lotes e ativa somente após indexar", async () => {
    const documents = [];
    const runs = [];
    const chunks = [];
    const repository = {
        async findByHash() { return documents.find((item) => item.contentHash); },
        async createDocument(document) { const created = { id_documento: documents.length + 1, ...document }; documents.push(created); return created; },
        async createRun(run) { runs.push(run); },
        async updateRun(id, update) { Object.assign(runs.find((run) => run.id === id), update); },
        async replaceChunks(_id, values) { chunks.splice(0, chunks.length, ...values); },
        async updateDocument(id, update) { const document = documents.find((item) => item.id_documento === id); Object.assign(document, update); return document; },
    };
    const embeddingService = { model: { id: "m", revision: "r", dimensions: 2 }, async embed(texts) { return texts.map(() => [1, 0]); } };
    const service = createIngestionService({ repository, embeddingService, chunkOptions: { maxTokens: 20, minTokens: 2 }, maxBatch: 2 });
    const input = { tenantType: "GLOBAL", title: "Política", documentType: "faq", origin: "teste", visibility: "PUBLICA", content: "Como cancelar?\n\nÉ possível cancelar antes do preparo." };
    const first = await service.ingest(input);
    assert.equal(first.idempotent, false);
    assert.equal(first.chunks, chunks.length);
    assert.equal(documents[0].status, "ATIVO");
    const second = await service.ingest(input);
    assert.equal(second.idempotent, true);
    assert.equal(runs[0].status, "CONCLUIDA");
});
