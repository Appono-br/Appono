"use strict";

const { RagError, assertRag } = require("./errors");
const { flattenEmbedding, getFeaturePipeline } = require("./transformers-runtime");

function validateVector(vector, dimensions) {
    assertRag(Array.isArray(vector) && vector.length === dimensions, "EMBEDDING_DIMENSION_MISMATCH", "Dimensão do embedding incompatível.");
    assertRag(vector.every((value) => Number.isFinite(value)), "EMBEDDING_NON_FINITE", "Embedding contém valor inválido.");
    return vector;
}

function createEmbeddingService({ model, runtime = { getFeaturePipeline, flattenEmbedding }, cacheDir = null, maxBatch = 16 } = {}) {
    if (!model) throw new RagError("MODEL_REQUIRED", "Modelo de embeddings não informado.");
    return Object.freeze({
        model: Object.freeze({ ...model }),
        async embed(texts) {
            const values = Array.isArray(texts) ? texts : [texts];
            if (!values.length || values.length > maxBatch) throw new RagError("EMBEDDING_BATCH_INVALID", "Lote de embeddings inválido.");
            if (values.some((text) => typeof text !== "string" || !text.trim())) throw new RagError("EMBEDDING_TEXT_INVALID", "Texto de embedding inválido.");
            const pipeline = await runtime.getFeaturePipeline({ modelId: model.id, revision: model.revision, cacheDir });
            const vectors = [];
            for (const text of values) {
                try {
                    vectors.push(validateVector(runtime.flattenEmbedding(await pipeline(text, { pooling: "mean", normalize: true })), model.dimensions));
                } catch (error) {
                    if (error instanceof RagError) throw error;
                    throw new RagError("EMBEDDING_FAILED", "Falha ao gerar embedding.", { status: 503, publicMessage: "Não foi possível gerar o embedding.", cause: error });
                }
            }
            return vectors;
        },
        health() { return { modelId: model.id, revision: model.revision, dimensions: model.dimensions }; },
    });
}

module.exports = { createEmbeddingService, validateVector };
