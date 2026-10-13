"use strict";

const { RagError, assertRag } = require("./errors");

function createModelRegistry(entries = []) {
    const registry = new Map();
    for (const entry of entries) {
        assertRag(entry && typeof entry.id === "string" && entry.id.trim(), "MODEL_ID_INVALID", "Modelo sem identificador.");
        assertRag(Number.isInteger(entry.dimensions) && entry.dimensions > 0, "MODEL_DIMENSIONS_INVALID", "Dimensão do modelo inválida.");
        assertRag(typeof entry.revision === "string" && entry.revision.trim(), "MODEL_REVISION_INVALID", "Modelo sem revisão fixada.");
        if (registry.has(entry.id)) throw new RagError("MODEL_DUPLICATE", "Modelo duplicado no registry.");
        registry.set(entry.id, Object.freeze({ ...entry }));
    }
    return Object.freeze({
        get(id) { return registry.get(id) ?? null; },
        require(id) {
            const model = registry.get(id);
            if (!model) throw new RagError("MODEL_NOT_REGISTERED", "Modelo não registrado.", { status: 503, publicMessage: "Modelo de embeddings indisponível." });
            return model;
        },
        list() { return [...registry.values()]; },
    });
}

module.exports = { createModelRegistry };
