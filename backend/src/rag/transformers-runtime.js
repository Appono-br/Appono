"use strict";

const { RagError } = require("./errors");

let modulePromise = null;
const pipelines = new Map();

async function loadTransformers() {
    if (!modulePromise) modulePromise = import("@huggingface/transformers");
    try {
        return await modulePromise;
    } catch (error) {
        modulePromise = null;
        throw new RagError("TRANSFORMERS_UNAVAILABLE", "Transformers.js não está disponível.", { status: 503, publicMessage: "O serviço de embeddings está indisponível.", cause: error });
    }
}

function flattenEmbedding(output) {
    if (output?.data && output?.dims) {
        const dims = output.dims.map(Number);
        const data = Array.from(output.data, Number);
        const width = dims.at(-1);
        if (dims.length === 2 && width === data.length) return data;
        if (dims.length >= 2 && width > 0 && data.length % width === 0) {
            const rows = data.length / width;
            const pooled = Array.from({ length: width }, () => 0);
            for (let row = 0; row < rows; row += 1) for (let col = 0; col < width; col += 1) pooled[col] += data[row * width + col] / rows;
            return pooled;
        }
    }
    if (Array.isArray(output) && output.every((value) => Number.isFinite(Number(value)))) return output.map(Number);
    throw new RagError("EMBEDDING_OUTPUT_INVALID", "Saída de embedding inválida.", { status: 503, publicMessage: "Não foi possível gerar o embedding." });
}

async function getFeaturePipeline({ modelId, revision, cacheDir, dtype = "q8" }) {
    const key = `${modelId}@${revision}`;
    if (!pipelines.has(key)) {
        const promise = (async () => {
            const { pipeline, env } = await loadTransformers();
            if (cacheDir) env.cacheDir = cacheDir;
            return pipeline("feature-extraction", modelId, { revision, dtype });
        })();
        pipelines.set(key, promise);
    }
    try {
        return await pipelines.get(key);
    } catch (error) {
        pipelines.delete(key);
        if (error instanceof RagError) throw error;
        throw new RagError("MODEL_LOAD_FAILED", "Falha ao carregar modelo de embeddings.", { status: 503, publicMessage: "O modelo de embeddings está indisponível.", cause: error });
    }
}

function clearRuntimeCache() { pipelines.clear(); modulePromise = null; }

module.exports = { clearRuntimeCache, flattenEmbedding, getFeaturePipeline };
