"use strict";

const { RagError } = require("./errors");
const { estimateTokens } = require("./text-normalizer");

function buildContext(chunks = [], { maxTokens = 4000 } = {}) {
    if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new RagError("CONTEXT_LIMIT_INVALID", "Limite de contexto inválido.");
    const selected = [];
    let total = 0;
    for (const chunk of chunks) {
        const content = String(chunk.content ?? "").trim();
        if (!content) continue;
        const tokens = estimateTokens(content);
        if (total + tokens > maxTokens) continue;
        selected.push({ ...chunk, content, tokensEstimated: tokens });
        total += tokens;
    }
    return {
        text: selected.map((chunk, index) => `[FONTE ${index + 1}] ${chunk.title ?? "Documento"}\n${chunk.content}`).join("\n\n"),
        chunks: selected,
        tokensEstimated: total,
    };
}

module.exports = { buildContext };
