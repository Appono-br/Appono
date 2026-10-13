"use strict";

const { RagError } = require("./errors");
const { buildSystemInstruction } = require("./answer-policy");

function createGeneratorService({ adapter, maxQuestionCharacters = 4000 } = {}) {
    if (!adapter || typeof adapter.generate !== "function") throw new RagError("GENERATOR_INVALID", "Gerador inválido.");
    return Object.freeze({
        model: { id: adapter.model, revision: adapter.revision, provider: adapter.provider },
        async generate({ question, context, signal } = {}) {
            if (!String(question ?? "").trim() || String(question).length > maxQuestionCharacters) throw new RagError("QUESTION_INVALID", "Pergunta inválida.");
            if (!String(context ?? "").trim()) throw new RagError("CONTEXT_EMPTY", "Contexto vazio.", { status: 422, publicMessage: "Não há fontes suficientes para gerar uma resposta." });
            return adapter.generate({ system: buildSystemInstruction(), question: String(question).trim(), context: String(context), signal });
        },
    });
}

module.exports = { createGeneratorService };
