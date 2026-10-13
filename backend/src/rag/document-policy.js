"use strict";

const { RagError } = require("./errors");

const TENANT_TYPES = new Set(["GLOBAL", "RESTAURANTE", "USUARIO"]);
const VISIBILITIES = new Set(["PUBLICA", "INTERNA", "PRIVADA"]);

function validateDocumentInput(input = {}) {
    const tenantType = String(input.tenantType ?? "").trim().toUpperCase();
    const visibility = String(input.visibility ?? "INTERNA").trim().toUpperCase();
    if (!TENANT_TYPES.has(tenantType)) throw new RagError("TENANT_TYPE_INVALID", "Escopo do documento inválido.");
    if (!VISIBILITIES.has(visibility)) throw new RagError("VISIBILITY_INVALID", "Visibilidade do documento inválida.");
    if (tenantType === "GLOBAL" && (input.tenantId !== null && input.tenantId !== undefined || input.ownerAuthId)) throw new RagError("TENANT_SHAPE_INVALID", "Documento global não pode possuir tenant ou proprietário.");
    if (tenantType === "RESTAURANTE" && (!Number.isInteger(Number(input.tenantId)) || Number(input.tenantId) <= 0 || input.ownerAuthId)) throw new RagError("TENANT_SHAPE_INVALID", "Documento de restaurante exige restaurante válido.");
    if (tenantType === "USUARIO" && (input.tenantId !== null && input.tenantId !== undefined || !String(input.ownerAuthId ?? "").trim())) throw new RagError("TENANT_SHAPE_INVALID", "Documento de usuário exige proprietário e não aceita tenant.");
    if (visibility === "PUBLICA" && tenantType === "USUARIO") throw new RagError("VISIBILITY_SCOPE_INVALID", "Documento privado de usuário não pode ser público.");
    const title = String(input.title ?? "").trim();
    const type = String(input.documentType ?? "").trim();
    const origin = String(input.origin ?? "").trim();
    if (!title || title.length > 240 || !type || type.length > 80 || !origin || origin.length > 500) throw new RagError("DOCUMENT_METADATA_INVALID", "Metadados do documento inválidos.");
    return Object.freeze({
        tenantType,
        tenantId: tenantType === "RESTAURANTE" ? Number(input.tenantId) : null,
        ownerAuthId: tenantType === "USUARIO" ? String(input.ownerAuthId).trim() : null,
        title,
        documentType: type,
        origin,
        uriOrigin: input.uriOrigin ? String(input.uriOrigin).trim() : null,
        visibility,
        language: String(input.language ?? "pt-BR").trim() || "pt-BR",
        priority: Number.isInteger(input.priority) ? Math.max(-1000, Math.min(1000, input.priority)) : 0,
    });
}

function canReadDocument(document, scope = {}) {
    if (document?.status !== "ATIVO") return false;
    if (document.tenantType === "GLOBAL") return document.visibility === "PUBLICA";
    if (document.tenantType === "RESTAURANTE") return Number(document.tenantId) === Number(scope.restaurantId);
    return document.tenantType === "USUARIO" && String(document.ownerAuthId) === String(scope.userId);
}

module.exports = { TENANT_TYPES, VISIBILITIES, canReadDocument, validateDocumentInput };
