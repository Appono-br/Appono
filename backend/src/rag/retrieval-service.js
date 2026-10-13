"use strict";

const { RagError } = require("./errors");

function tokenize(value) {
    return new Set(String(value ?? "").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[\p{L}\p{N}\d]+/gu) ?? []);
}

function lexicalScore(query, content) {
    const queryTokens = tokenize(query);
    const contentTokens = tokenize(content);
    if (!queryTokens.size || !contentTokens.size) return 0;
    let matches = 0;
    for (const token of queryTokens) if (contentTokens.has(token)) matches += 1;
    return matches / queryTokens.size;
}

function cosineSimilarity(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return 0;
    let dot = 0;
    let normLeft = 0;
    let normRight = 0;
    for (let index = 0; index < left.length; index += 1) {
        const a = Number(left[index]);
        const b = Number(right[index]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
        dot += a * b;
        normLeft += a * a;
        normRight += b * b;
    }
    return normLeft && normRight ? dot / Math.sqrt(normLeft * normRight) : 0;
}

function reciprocalRankFusion(rankedLists, k = 60) {
    const scores = new Map();
    for (const list of rankedLists) {
        list.forEach((item, index) => {
            const id = String(item.chunkId);
            const current = scores.get(id) ?? { ...item, fusionScore: 0 };
            current.fusionScore += 1 / (k + index + 1);
            scores.set(id, current);
        });
    }
    return [...scores.values()].sort(compareResults);
}

function compareResults(left, right) {
    return Number(right.fusionScore ?? right.score ?? 0) - Number(left.fusionScore ?? left.score ?? 0)
        || Number(right.score ?? 0) - Number(left.score ?? 0)
        || String(left.documentId).localeCompare(String(right.documentId))
        || String(left.chunkId).localeCompare(String(right.chunkId));
}

function isAllowedChunk(chunk, scope = {}) {
    if (chunk?.status && chunk.status !== "ATIVO" && chunk.status !== "INDEXADO") return false;
    if (chunk?.tenantType === "GLOBAL") return true;
    if (chunk?.tenantType === "RESTAURANTE") return Number(chunk.tenantId) === Number(scope.restaurantId);
    if (chunk?.tenantType === "USUARIO") return String(chunk.tenantId) === String(scope.userId);
    return false;
}

function retrieveChunks({ chunks = [], query, queryEmbedding = null, scope = {}, topK = 10, minScore = null } = {}) {
    if (!String(query ?? "").trim()) throw new RagError("QUERY_EMPTY", "Consulta de recuperação vazia.");
    if (!Number.isInteger(topK) || topK < 1 || topK > 50) throw new RagError("TOP_K_INVALID", "Limite de recuperação inválido.");
    const allowed = chunks.filter((chunk) => isAllowedChunk(chunk, scope));
    const lexical = allowed.map((chunk) => ({ ...chunk, score: lexicalScore(query, chunk.content) })).filter((chunk) => chunk.score > 0).sort(compareResults);
    const semantic = queryEmbedding
        ? allowed.map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) })).filter((chunk) => chunk.score > 0).sort(compareResults)
        : [];
    const merged = reciprocalRankFusion([lexical, semantic]).slice(0, topK);
    const filtered = minScore === null || minScore === undefined
        ? merged
        : merged.filter((chunk) => Number(chunk.score ?? chunk.fusionScore ?? 0) >= minScore);
    const uniqueDocuments = new Set();
    return filtered.filter((chunk) => {
        const key = `${chunk.documentId}:${chunk.section ?? ""}`;
        if (uniqueDocuments.has(key)) return false;
        uniqueDocuments.add(key);
        return true;
    }).slice(0, topK);
}

module.exports = { cosineSimilarity, isAllowedChunk, lexicalScore, reciprocalRankFusion, retrieveChunks };
