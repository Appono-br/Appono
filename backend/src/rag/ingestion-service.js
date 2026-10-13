"use strict";

const { randomUUID } = require("node:crypto");
const { chunkDocument } = require("./chunker");
const { RagError } = require("./errors");
const { canonicalHash } = require("./text-normalizer");
const { validateDocumentInput } = require("./document-policy");

function createIngestionService({ repository, embeddingService, now = () => new Date().toISOString(), chunkOptions = {}, maxBatch = 16 } = {}) {
    if (!repository || typeof repository.findByHash !== "function" || typeof repository.createRun !== "function" || typeof repository.replaceChunks !== "function") throw new RagError("REPOSITORY_INVALID", "Repositório de ingestão inválido.");
    if (!embeddingService || typeof embeddingService.embed !== "function") throw new RagError("EMBEDDING_SERVICE_INVALID", "Serviço de embedding inválido.");
    return Object.freeze({
        async ingest(input) {
            const metadata = validateDocumentInput(input);
            const contentHash = canonicalHash(input.content);
            const version = Number(input.version ?? 1);
            if (!Number.isInteger(version) || version < 1) throw new RagError("DOCUMENT_VERSION_INVALID", "Versão do documento inválida.");
            const existing = await repository.findByHash({ contentHash, ...metadata, version });
            if (existing?.status === "ATIVO" || existing?.status === "PROCESSANDO") return { document: existing, idempotent: true, runId: null };
            const document = existing ?? await repository.createDocument({ ...metadata, contentHash, version, status: "PROCESSANDO", createdBy: input.createdBy ?? null });
            const runId = randomUUID();
            await repository.createRun({ id: runId, documentId: document.id_documento, status: "PROCESSANDO", model: embeddingService.model, startedAt: now() });
            try {
                const chunks = chunkDocument(input.content, chunkOptions);
                const indexedChunks = [];
                for (let offset = 0; offset < chunks.length; offset += maxBatch) {
                    const batch = chunks.slice(offset, offset + maxBatch);
                    const vectors = await embeddingService.embed(batch.map((chunk) => chunk.content));
                    indexedChunks.push(...batch.map((chunk, index) => ({
                        documentId: document.id_documento,
                        index: chunk.index,
                        content: chunk.content,
                        contentHash: canonicalHash(chunk.content),
                        tokensEstimated: chunk.tokensEstimated,
                        metadata: { ...chunk.metadata, section: chunk.section },
                        embedding: vectors[index],
                        embeddingModel: embeddingService.model.id,
                        embeddingRevision: embeddingService.model.revision,
                        embeddingDimensions: embeddingService.model.dimensions,
                        status: "INDEXADO",
                    })));
                    await repository.updateRun(runId, { chunksProcessed: indexedChunks.length, totalChunks: chunks.length });
                }
                await repository.replaceChunks(document.id_documento, indexedChunks);
                const activated = await repository.updateDocument(document.id_documento, { status: "ATIVO", activeAt: now(), updatedAt: now() });
                await repository.updateRun(runId, { status: "CONCLUIDA", chunksProcessed: indexedChunks.length, totalChunks: chunks.length, finishedAt: now() });
                return { document: activated ?? document, runId, idempotent: false, chunks: indexedChunks.length };
            } catch (error) {
                await repository.updateDocument(document.id_documento, { status: "ERRO", updatedAt: now() });
                await repository.updateRun(runId, { status: "FALHOU", errorCode: error.code ?? "INGESTION_FAILED", publicError: "Não foi possível indexar o documento.", finishedAt: now() });
                throw error;
            }
        },
    });
}

module.exports = { createIngestionService };
