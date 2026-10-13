"use strict";

const crypto = require("node:crypto");

function hashValue(value) {
    return crypto.createHash("sha256").update(String(value ?? "")).digest("hex");
}

function safeAuditRecord({ requestId, scope, question, model, indexVersion, chunks, abstained, fallback, timings = {} }) {
    return {
        requestId: String(requestId ?? ""),
        scope: {
            role: String(scope?.role ?? "UNKNOWN"),
            tenantType: String(scope?.tenantType ?? "UNKNOWN"),
            tenantIdHash: scope?.tenantId === undefined || scope?.tenantId === null ? null : hashValue(scope.tenantId),
        },
        questionHash: hashValue(question),
        model: model ? { id: String(model.id), revision: String(model.revision) } : null,
        indexVersion: indexVersion ? String(indexVersion) : null,
        chunkIds: (chunks ?? []).map((chunk) => String(chunk.chunkId)),
        scores: (chunks ?? []).map((chunk) => Number.isFinite(Number(chunk.score)) ? Number(Number(chunk.score).toFixed(6)) : null),
        abstained: Boolean(abstained),
        fallback: fallback ? String(fallback) : null,
        timings: Object.fromEntries(Object.entries(timings).filter(([, value]) => Number.isFinite(Number(value))).map(([key, value]) => [key, Number(value)])),
    };
}

module.exports = { hashValue, safeAuditRecord };
