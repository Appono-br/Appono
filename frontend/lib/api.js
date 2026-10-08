
import { getAccessToken, obterTokensAutenticacao, salvarTokensAutenticacao } from "./session";
import { supabase } from "./supabase";

const API_URL_CONFIGURADA = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_URL_LOCAL = "http://localhost:3001/api";
const API_URL_PRODUCAO = "https://appono-backend.vercel.app/api";

function resolverApiUrl() {
    const ambienteProducao = process.env.NODE_ENV === "production";
    if (!API_URL_CONFIGURADA) return ambienteProducao ? API_URL_PRODUCAO : API_URL_LOCAL;
    if (!ambienteProducao) return API_URL_CONFIGURADA.replace(/\/$/, "");

    try {
        const url = new URL(API_URL_CONFIGURADA);
        if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) return API_URL_PRODUCAO;
    }
    catch {
        if (API_URL_CONFIGURADA.startsWith("/")) return API_URL_CONFIGURADA.replace(/\/$/, "");
    }

    return API_URL_CONFIGURADA.replace(/\/$/, "");
}

const API_URL = resolverApiUrl();
const TEMPO_CACHE_GET_MS = 15000;
const cacheGet = new Map();
const requisicoesEmAndamento = new Map();
let renovacaoEmAndamento = null;

function normalizarMensagemErro(mensagem, fallback = "Não conseguimos concluir agora.") {
    const original = String(mensagem ?? "").trim();
    const normalizada = original.toLowerCase();
    if (normalizada.includes("card_token_id") || normalizada.includes("card token")) return "Não foi possível iniciar a assinatura porque o Mercado Pago não recebeu os dados do cartão. Abra o checkout novamente e informe um cartão válido.";
    if (normalizada.includes("invalid access token") || normalizada.includes("unauthorized")) return "Sua sessão expirou. Entre novamente para continuar.";
    if (normalizada.includes("timeout") || normalizada.includes("timed out")) return "O serviço demorou para responder. Tente novamente em instantes.";
    return original || fallback;
}

function obterMetodo(options) {
    return String(options.method ?? "GET").toUpperCase();
}

function obterChaveCache(path, options, accessToken) {
    return `${obterMetodo(options)}:${path}:${accessToken ?? "sem-token"}:${JSON.stringify(options.body ?? null)}`;
}

function limparCacheGet() {
    cacheGet.clear();
    requisicoesEmAndamento.clear();
}

async function renovarSessaoExpirada() {
    if (renovacaoEmAndamento) return renovacaoEmAndamento;
    renovacaoEmAndamento = (async () => {
        const tokens = obterTokensAutenticacao();
        if (!tokens?.accessToken || !tokens.refreshToken) return null;
        const { data, error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
        if (error || !data.session) return null;
        salvarTokensAutenticacao(data.session);
        return data.session.access_token;
    })().finally(() => {
        renovacaoEmAndamento = null;
    });
    return renovacaoEmAndamento;
}

async function obterAccessTokenSincronizado() {
    const tokenSalvo = getAccessToken();
    if (tokenSalvo) {
        return tokenSalvo;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
        salvarTokensAutenticacao(data.session);
        return data.session.access_token;
    }
    return null;
}

async function fazerRequisicao(path, options, accessToken) {
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...options.headers,
        },
    });
}

export async function apiRequest(path, options = {}) {
    const { cacheTtlMs = TEMPO_CACHE_GET_MS, forceRefresh = false, auth = true, ...fetchOptions } = options;
    const metodo = obterMetodo(fetchOptions);
    const podeUsarCache = metodo === "GET" && cacheTtlMs > 0;
    let accessToken = auth ? await obterAccessTokenSincronizado() : null;
    const chaveCache = obterChaveCache(path, fetchOptions, accessToken);
    if (podeUsarCache && !forceRefresh) {
        const cache = cacheGet.get(chaveCache);
        if (cache && Date.now() - cache.criadoEm < cacheTtlMs) {
            return cache.valor;
        }
        const requisicaoExistente = requisicoesEmAndamento.get(chaveCache);
        if (requisicaoExistente) {
            return requisicaoExistente;
        }
    }
    const requisicao = (async () => {
        let response;
        try {
            response = await fazerRequisicao(path, fetchOptions, accessToken);
        }
        catch (error) {
            if (error?.name === "AbortError") throw error;
            throw new Error("Não conseguimos acessar o serviço agora. Tente novamente em alguns instantes.");
        }
        let body = await response.json().catch(() => null);
        if (auth && response.status === 401 && obterTokensAutenticacao()?.refreshToken) {
            accessToken = await renovarSessaoExpirada();
            if (accessToken) {
                response = await fazerRequisicao(path, fetchOptions, accessToken);
                body = await response.json().catch(() => null);
            }
        }
        if (!response.ok) {
            const error = new Error(normalizarMensagemErro(body?.error));
            error.status = response.status;
            error.code = body?.code;
            error.details = body;
            throw error;
        }
        if (metodo !== "GET") {
            limparCacheGet();
        }
        if (podeUsarCache) {
            cacheGet.set(chaveCache, { criadoEm: Date.now(), valor: body });
        }
        return body;
    })();
    if (podeUsarCache) {
        requisicoesEmAndamento.set(chaveCache, requisicao);
    }
    try {
        return await requisicao;
    }
    finally {
        requisicoesEmAndamento.delete(chaveCache);
    }
}
