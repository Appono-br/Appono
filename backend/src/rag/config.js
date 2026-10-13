"use strict";

function booleanEnv(name, fallback = false, env = process.env) {
    const value = env[name];
    if (value === undefined) return fallback;
    return ["1", "true", "sim", "yes"].includes(String(value).trim().toLowerCase());
}

function integerEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}, env = process.env) {
    const value = Number(env[name] ?? fallback);
    if (!Number.isInteger(value)) return fallback;
    return Math.max(min, Math.min(max, value));
}

function loadRagConfig(env = process.env) {
    return Object.freeze({
        enabled: booleanEnv("APPONO_RAG_ENABLED", false, env),
        ingestionEnabled: booleanEnv("APPONO_RAG_INGESTION_ENABLED", false, env),
        vectorSearchEnabled: booleanEnv("APPONO_RAG_VECTOR_SEARCH_ENABLED", false, env),
        hybridSearchEnabled: booleanEnv("APPONO_RAG_HYBRID_SEARCH_ENABLED", false, env),
        rerankEnabled: booleanEnv("APPONO_RAG_RERANK_ENABLED", false, env),
        externalGenerationEnabled: booleanEnv("APPONO_RAG_EXTERNAL_GENERATION_ENABLED", false, env),
        llmEnabled: booleanEnv("APPONO_RAG_LLM_ENABLED", false, env),
        llmProvider: String(env.APPONO_RAG_LLM_PROVIDER ?? "ollama").trim().toLowerCase(),
        llmBaseUrl: String(env.APPONO_RAG_LLM_BASE_URL ?? "http://127.0.0.1:11434").trim(),
        llmModel: String(env.APPONO_RAG_LLM_MODEL ?? "").trim(),
        llmTimeoutMs: integerEnv("APPONO_RAG_LLM_TIMEOUT_MS", 12000, { min: 1000, max: 60000 }, env),
        llmMaxOutputTokens: integerEnv("APPONO_RAG_LLM_MAX_OUTPUT_TOKENS", 500, { min: 64, max: 4000 }, env),
        llmTemperature: Number.isFinite(Number(env.APPONO_RAG_LLM_TEMPERATURE)) ? Math.max(0, Math.min(1, Number(env.APPONO_RAG_LLM_TEMPERATURE))) : 0,
        intelligenceSupportEnabled: booleanEnv("APPONO_RAG_INTELLIGENCE_SUPPORT_ENABLED", false, env),
        shadowMode: booleanEnv("APPONO_RAG_SHADOW_MODE", false, env),
        allowedRoles: String(env.APPONO_RAG_ALLOWED_ROLES ?? "admin").split(",").map((item) => item.trim()).filter(Boolean),
        modelId: String(env.APPONO_RAG_MODEL_ID ?? "").trim(),
        modelRevision: String(env.APPONO_RAG_MODEL_REVISION ?? "").trim(),
        modelCacheDir: String(env.APPONO_RAG_MODEL_CACHE_DIR ?? "").trim() || null,
        topK: integerEnv("APPONO_RAG_TOP_K", 10, { min: 1, max: 50 }, env),
        minScore: Number.isFinite(Number(env.APPONO_RAG_MIN_SCORE)) ? Number(env.APPONO_RAG_MIN_SCORE) : null,
        maxContextTokens: integerEnv("APPONO_RAG_MAX_CONTEXT_TOKENS", 4000, { min: 256, max: 32000 }, env),
        maxQuestionCharacters: integerEnv("APPONO_RAG_MAX_QUESTION_CHARACTERS", 4000, { min: 100, max: 20000 }, env),
        maxEmbeddingBatch: integerEnv("APPONO_RAG_MAX_EMBEDDING_BATCH", 16, { min: 1, max: 128 }, env),
    });
}

module.exports = { booleanEnv, integerEnv, loadRagConfig };
