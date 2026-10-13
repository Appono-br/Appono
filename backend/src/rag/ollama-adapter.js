"use strict";

const { RagError } = require("./errors");

function normalizeBaseUrl(value) {
    let url;
    try { url = new URL(String(value)); } catch { throw new RagError("LLM_URL_INVALID", "URL do gerador inválida.", { status: 503, publicMessage: "O gerador local não está configurado." }); }
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new RagError("LLM_URL_INVALID", "Protocolo do gerador inválido.", { status: 503 });
    if (url.username || url.password) throw new RagError("LLM_URL_INVALID", "Credenciais na URL do gerador não são permitidas.", { status: 503 });
    return url.toString().replace(/\/$/, "");
}

function createOllamaAdapter({ baseUrl, model, timeoutMs = 12000, fetchImpl = fetch, maxOutputTokens = 500, temperature = 0 } = {}) {
    if (!model) throw new RagError("LLM_MODEL_NOT_CONFIGURED", "Modelo do gerador não configurado.", { status: 503, publicMessage: "O gerador local ainda não está configurado." });
    const endpoint = `${normalizeBaseUrl(baseUrl)}/api/generate`;
    return Object.freeze({
        provider: "ollama",
        model,
        revision: null,
        async generate({ system, question, context, signal } = {}) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
            try {
                const response = await fetchImpl(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, system, prompt: `Pergunta:\n${question}\n\nContexto:\n${context}`, stream: false, options: { temperature, num_predict: maxOutputTokens } }),
                    signal: controller.signal,
                });
                if (!response.ok) throw new RagError("LLM_REQUEST_FAILED", "Gerador local indisponível.", { status: 503, publicMessage: "Não foi possível gerar a resposta agora." });
                const payload = await response.json();
                const text = String(payload?.response ?? "").trim();
                if (!text) throw new RagError("LLM_EMPTY_RESPONSE", "Gerador local retornou resposta vazia.", { status: 503, publicMessage: "O gerador não retornou uma resposta válida." });
                return { text, provider: "ollama", model };
            } catch (error) {
                if (error instanceof RagError) throw error;
                throw new RagError("LLM_REQUEST_FAILED", "Falha no gerador local.", { status: 503, publicMessage: "Não foi possível gerar a resposta agora.", cause: error });
            } finally { clearTimeout(timer); }
        },
        async health() {
            try { const response = await fetchImpl(`${normalizeBaseUrl(baseUrl)}/api/tags`, { signal: AbortSignal.timeout(Math.min(timeoutMs, 3000)) }); return { configured: true, available: response.ok, provider: "ollama", model }; }
            catch { return { configured: true, available: false, provider: "ollama", model }; }
        },
    });
}

module.exports = { createOllamaAdapter, normalizeBaseUrl };
