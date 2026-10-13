"use strict";

const crypto = require("node:crypto");
const { RagError } = require("./errors");

function stripUnsafeMarkup(value) {
    return String(value ?? "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ");
}

function normalizeText(value, { maxCharacters = 200000 } = {}) {
    const text = stripUnsafeMarkup(value)
        .normalize("NFKC")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\r\n?/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    if (!text) throw new RagError("DOCUMENT_EMPTY", "O conteúdo do documento está vazio.");
    if (text.length > maxCharacters) throw new RagError("DOCUMENT_TOO_LARGE", "O documento excede o limite permitido.");
    return text;
}

function canonicalHash(value) {
    return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

function estimateTokens(text) {
    return Math.max(1, Math.ceil(String(text ?? "").trim().length / 4));
}

module.exports = { canonicalHash, estimateTokens, normalizeText, stripUnsafeMarkup };
