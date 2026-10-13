"use strict";

const { Router } = require("express");
const { randomUUID } = require("node:crypto");
const { supabaseAdmin, isSupabaseConfigured } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { loadRagConfig } = require("../rag/config");
const { RagError } = require("../rag/errors");
const { createModelRegistry } = require("../rag/model-registry");
const { createEmbeddingService } = require("../rag/embedding-service");
const { createIngestionService } = require("../rag/ingestion-service");
const { validateDocumentInput } = require("../rag/document-policy");
const { buildContext } = require("../rag/context-builder");
const { buildCitations } = require("../rag/citation-builder");
const { safeAuditRecord } = require("../rag/audit-service");
const { shouldAbstain } = require("../rag/answer-policy");
const { createOllamaAdapter } = require("../rag/ollama-adapter");
const { createGeneratorService } = require("../rag/generator-service");
const { createSupabaseRagRepository } = require("../rag/supabase-repository");

const ragRouter = Router();
const cache = { embedding: null, repository: null, generator: null };
const resultError = (res, error) => res.status(error.status ?? error.statusCode ?? 500).json({ code: error.code ?? "RAG_FAILED", error: error.publicMessage ?? error.message ?? "Falha no RAG." });
const run = (fn) => async (req, res) => { try { res.set("Cache-Control", "no-store"); await fn(req, res); } catch (error) { resultError(res, error); } };

function configOrThrow() {
    const config = loadRagConfig();
    if (!config.enabled) throw new RagError("RAG_DISABLED", "RAG desativado.", { status: 503, publicMessage: "O sistema de conhecimento ainda não está habilitado." });
    return config;
}
function repository() { return cache.repository ?? (cache.repository = createSupabaseRagRepository({ adminClient: supabaseAdmin })); }
function embedding(config) {
    if (!config.modelId || !config.modelRevision) throw new RagError("MODEL_NOT_CONFIGURED", "Modelo do RAG não configurado.", { status: 503, publicMessage: "O modelo de conhecimento ainda não está configurado." });
    if (!cache.embedding) {
        const registry = createModelRegistry([{ id: config.modelId, revision: config.modelRevision, dimensions: 384 }]);
        cache.embedding = createEmbeddingService({ model: registry.require(config.modelId), cacheDir: config.modelCacheDir, maxBatch: config.maxEmbeddingBatch });
    }
    return cache.embedding;
}
function generator(config) {
    if (!config.llmEnabled || config.llmProvider !== "ollama") throw new RagError("GENERATION_DISABLED", "Geração desativada.", { status: 503, publicMessage: "A geração de respostas está desativada no ambiente atual." });
    if (!cache.generator) cache.generator = createGeneratorService({ adapter: createOllamaAdapter({ baseUrl: config.llmBaseUrl, model: config.llmModel, timeoutMs: config.llmTimeoutMs, maxOutputTokens: config.llmMaxOutputTokens, temperature: config.llmTemperature }), maxQuestionCharacters: config.maxQuestionCharacters });
    return cache.generator;
}
function scopeFor(req) {
    const role = req.res.locals.role ?? "UNKNOWN";
    if (role === "restaurante") return { role, tenantType: "RESTAURANTE", tenantId: req.res.locals.profileId, restaurantId: req.res.locals.profileId, userId: req.res.locals.user?.id };
    if (role === "cliente") return { role, tenantType: "USUARIO", tenantId: req.res.locals.user?.id, userId: req.res.locals.user?.id };
    return { role, tenantType: "GLOBAL", tenantId: null, userId: req.res.locals.user?.id };
}
function ensureIngestion(config) { if (!config.ingestionEnabled) throw new RagError("RAG_INGESTION_DISABLED", "Ingestão desativada.", { status: 503, publicMessage: "A indexação está desativada no ambiente atual." }); }

ragRouter.get("/health", run(async (_req, res) => {
    const config = loadRagConfig();
    res.json({ status: config.enabled && isSupabaseConfigured() ? "ready" : "disabled", ragEnabled: config.enabled, ingestionEnabled: config.ingestionEnabled, vectorSearchEnabled: config.vectorSearchEnabled, hybridSearchEnabled: config.hybridSearchEnabled, llmEnabled: config.llmEnabled, supabaseConfigured: isSupabaseConfigured(), modelConfigured: Boolean(config.modelId && config.modelRevision), modelLoaded: Boolean(cache.embedding), llmConfigured: Boolean(config.llmModel), cacheAvailable: Boolean(config.modelCacheDir) });
}));
ragRouter.use(requireAuth);
ragRouter.post("/consultar", requireRole(...loadRagConfig().allowedRoles), run(async (req, res) => {
    const config = configOrThrow();
    if (!config.vectorSearchEnabled && !config.hybridSearchEnabled) throw new RagError("RAG_SEARCH_DISABLED", "Busca desativada.", { status: 503, publicMessage: "A busca de conhecimento está desativada no ambiente atual." });
    const question = String(req.body?.question ?? req.body?.pergunta ?? "").trim();
    if (!question || question.length > config.maxQuestionCharacters) throw new RagError("QUESTION_INVALID", "Pergunta inválida.");
    const model = embedding(config);
    const [queryEmbedding] = await model.embed([question]);
    const scope = scopeFor(req);
    const chunks = config.hybridSearchEnabled
        ? await repository().searchHybridChunks({ embedding: queryEmbedding, question, tenantType: scope.tenantType, tenantId: scope.tenantId, userId: scope.userId, limit: config.topK })
        : await repository().searchChunks({ embedding: queryEmbedding, tenantType: scope.tenantType, tenantId: scope.tenantId, userId: scope.userId, limit: config.topK });
    const context = buildContext(chunks, { maxTokens: config.maxContextTokens });
    const abstained = shouldAbstain(context.chunks, { minScore: config.minScore, required: true });
    const audit = safeAuditRecord({ requestId: req.id ?? randomUUID(), scope, question, model: model.model, chunks: context.chunks, abstained, fallback: abstained ? "NO_RELEVANT_SOURCE" : null });
    await repository().audit({ ...audit, actorId: req.res.locals.user?.id });
    const requestedMode = String(req.body?.mode ?? req.body?.modo ?? "SOMENTE_FONTES").toUpperCase();
    if (requestedMode === "RESPOSTA" && !abstained) {
        const generated = await generator(config).generate({ question, context: context.text });
        return res.json({ mode: "RESPOSTA", status: "respondida", abstained: false, answer: generated.text, context: context.text, sources: buildCitations(context.chunks), model: generated.model ?? generated.provider, requestId: audit.requestId });
    }
    res.json({ mode: requestedMode === "SHADOW" ? "SHADOW" : "SOMENTE_FONTES", status: abstained ? "abstida" : "respondida", abstained, context: context.text, sources: buildCitations(context.chunks), chunks: context.chunks, requestId: audit.requestId });
}));
ragRouter.use(requireRole("admin"));
ragRouter.post("/documentos", run(async (req, res) => {
    const config = loadRagConfig(); ensureIngestion(config);
    const input = { ...req.body, createdBy: req.res.locals.user?.id };
    const metadata = validateDocumentInput(input);
    if (typeof req.body?.content !== "string" || !req.body.content.trim() || req.body.content.length > 500000) throw new RagError("CONTENT_INVALID", "Conteúdo do documento inválido ou excede o limite de 500.000 caracteres.");
    const result = await createIngestionService({ repository: repository(), embeddingService: embedding(config), maxBatch: config.maxEmbeddingBatch }).ingest({ ...input, ...metadata });
    res.status(result.idempotent ? 200 : 201).json(result);
}));
ragRouter.get("/documentos", run(async (req, res) => res.json({ documentos: await repository().listDocuments({ limit: Math.min(100, Math.max(1, Number(req.query.limit) || 50)), status: req.query.status }) })));
ragRouter.get("/documentos/:id", run(async (req, res) => { const document = await repository().getDocument(req.params.id); if (!document) return res.status(404).json({ code: "DOCUMENT_NOT_FOUND", error: "Documento não encontrado." }); return res.json({ document }); }));
ragRouter.patch("/documentos/:id", run(async (req, res) => {
    const document = await repository().getDocument(req.params.id);
    if (!document) return res.status(404).json({ code: "DOCUMENT_NOT_FOUND", error: "Documento não encontrado." });
    const allowed = ["title", "documentType", "origin", "uriOrigin", "priority", "visibility", "metadata"];
    const unknown = Object.keys(req.body ?? {}).filter((key) => !allowed.includes(key));
    if (unknown.length) throw new RagError("DOCUMENT_PATCH_INVALID", "Não é permitido alterar escopo, hash, versão ou status do documento.");
    const update = Object.fromEntries(Object.entries(req.body ?? {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(update).length) throw new RagError("DOCUMENT_PATCH_INVALID", "Nenhum campo editável foi informado.");
    const updated = await repository().updateDocument(req.params.id, { ...update, updatedAt: new Date().toISOString() });
    res.json({ document: updated });
}));
ragRouter.post("/documentos/:id/indexar", run(async (req, res) => {
    const config = loadRagConfig(); ensureIngestion(config);
    const current = await repository().getDocument(req.params.id);
    if (!current) return res.status(404).json({ code: "DOCUMENT_NOT_FOUND", error: "Documento não encontrado." });
    if (typeof req.body?.content !== "string" || !req.body.content.trim() || req.body.content.length > 500000) throw new RagError("CONTENT_INVALID", "O conteúdo da reindexação é obrigatório e limitado a 500.000 caracteres.");
    const result = await createIngestionService({ repository: repository(), embeddingService: embedding(config), maxBatch: config.maxEmbeddingBatch }).ingest({
        tenantType: current.tenantType, tenantId: current.tenantId, ownerAuthId: current.ownerAuthId, title: current.title, documentType: current.documentType, origin: current.origin, uriOrigin: current.uriOrigin, visibility: current.visibility, language: current.language, priority: current.priority, content: req.body.content, version: Number(current.version ?? 1) + 1, createdBy: req.res.locals.user?.id,
    });
    if (!result.idempotent) await repository().updateDocument(current.id_documento, { status: "ARQUIVADO", updatedAt: new Date().toISOString() });
    res.status(result.idempotent ? 200 : 201).json({ ...result, archivedDocumentId: result.idempotent ? null : current.id_documento });
}));
ragRouter.post("/documentos/:id/publicar", run(async (req, res) => {
    const document = await repository().getDocument(req.params.id);
    if (!document) return res.status(404).json({ code: "DOCUMENT_NOT_FOUND", error: "Documento não encontrado." });
    if (document.status !== "ATIVO") throw new RagError("DOCUMENT_NOT_INDEXED", "Somente documento indexado pode ser publicado.", { status: 409 });
    if (document.tenantType === "USUARIO") throw new RagError("VISIBILITY_SCOPE_INVALID", "Documento de usuário não pode ser publicado.");
    res.json({ document: await repository().updateDocument(req.params.id, { visibility: "PUBLICA", updatedAt: new Date().toISOString() }) });
}));
ragRouter.post("/documentos/:id/arquivar", run(async (req, res) => {
    const document = await repository().getDocument(req.params.id);
    if (!document) return res.status(404).json({ code: "DOCUMENT_NOT_FOUND", error: "Documento não encontrado." });
    res.json({ document: await repository().updateDocument(req.params.id, { status: "ARQUIVADO", updatedAt: new Date().toISOString() }) });
}));
ragRouter.get("/ingestoes/:id", run(async (req, res) => {
    const runRecord = await repository().getRun(req.params.id);
    if (!runRecord) return res.status(404).json({ code: "INGESTION_NOT_FOUND", error: "Execução não encontrada." });
    res.json({ ingestion: runRecord });
}));

module.exports = { ragRouter, scopeFor };
