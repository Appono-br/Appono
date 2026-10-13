"use strict";

function buildCitations(chunks = []) {
    return chunks.map((chunk) => ({
        documentId: String(chunk.documentId),
        chunkId: String(chunk.chunkId),
        title: String(chunk.title ?? "Documento"),
        section: chunk.section ? String(chunk.section) : null,
        snippet: String(chunk.content ?? "").slice(0, 600),
    }));
}

module.exports = { buildCitations };
