"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { documentRow, mapDocument, mapChunk } = require("../src/rag/supabase-repository");
const { createOllamaAdapter, normalizeBaseUrl } = require("../src/rag/ollama-adapter");
const { createGeneratorService } = require("../src/rag/generator-service");

test("adaptador Supabase mantém o contrato de nomes e não persiste conteúdo bruto no documento", () => {
    const row = documentRow({ tenantType: "GLOBAL", title: "FAQ", documentType: "faq", origin: "manual", contentHash: "a".repeat(64), visibility: "PUBLICA", content: "segredo" });
    assert.equal(row.tenant_type, "GLOBAL");
    assert.equal(row.titulo, "FAQ");
    assert.equal(row.conteudo_hash.length, 64);
    assert.equal(Object.hasOwn(row, "content"), false);
});

test("adaptador Ollama usa timeout, rejeita credenciais e aplica prompt seguro", async () => {
    assert.equal(normalizeBaseUrl("http://127.0.0.1:11434/"), "http://127.0.0.1:11434");
    assert.throws(() => normalizeBaseUrl("http://user:pass@127.0.0.1:11434"), (error) => error.code === "LLM_URL_INVALID");
    let request;
    const adapter = createOllamaAdapter({ baseUrl: "http://127.0.0.1:11434", model: "local-test", timeoutMs: 1000, fetchImpl: async (_url, options) => { request = JSON.parse(options.body); return { ok: true, async json() { return { response: "Resposta baseada nas fontes." }; } }; } });
    const generator = createGeneratorService({ adapter });
    const result = await generator.generate({ question: "Como funciona?", context: "[FONTE 1] Manual\nRegra documentada." });
    assert.equal(result.text, "Resposta baseada nas fontes.");
    assert.equal(request.options.temperature, 0);
    assert.match(request.system, /somente com base/i);
});

test("adaptador Supabase normaliza documentos e chunks para o domínio", () => {
    const document = mapDocument({ id_documento: 4, tenant_type: "RESTAURANTE", tenant_id: 9, titulo: "Manual", tipo_documento: "faq", origem: "ops", status: "ATIVO", visibilidade: "INTERNA", metadados: { area: "pedidos" } });
    assert.deepEqual(document, {
        id_documento: 4, tenantType: "RESTAURANTE", tenantId: 9, ownerAuthId: undefined, title: "Manual", documentType: "faq", origin: "ops", uriOrigin: undefined, contentHash: undefined, version: undefined, priority: undefined, status: "ATIVO", visibility: "INTERNA", language: undefined, metadata: { area: "pedidos" }, createdBy: undefined, createdAt: undefined, updatedAt: undefined, activeAt: undefined,
    });
    const chunk = mapChunk({ id_chunk: 7, id_documento: 4, conteudo: "cancelamento", metadados: { section: "Pedidos" }, rag_documents: { titulo: "Manual", tenant_type: "RESTAURANTE", tenant_id: 9 }, score: 0.8 });
    assert.deepEqual(chunk, { chunkId: 7, documentId: 4, title: "Manual", section: "Pedidos", content: "cancelamento", tenantType: "RESTAURANTE", tenantId: 9, score: 0.8, embedding: undefined, status: undefined });
});
