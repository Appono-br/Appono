import { getAccessToken, obterTokensAutenticacao, salvarTokensAutenticacao } from "./session";
import { supabase } from "./supabase";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
const TEMPO_CACHE_GET_MS = 15000;
const cacheGet = new Map();
const requisicoesEmAndamento = new Map();

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
    const tokens = obterTokensAutenticacao();
    if (!tokens?.refreshToken) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            salvarTokensAutenticacao(data.session);
            return data.session.access_token;
        }
        return null;
    }
    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: tokens.refreshToken,
    });
    if (error || !data.session) {
        const { data: sessaoAtual } = await supabase.auth.getSession();
        if (sessaoAtual.session) {
            salvarTokensAutenticacao(sessaoAtual.session);
            return sessaoAtual.session.access_token;
        }
        return null;
    }
    salvarTokensAutenticacao(data.session);
    return data.session.access_token;
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
        catch {
            throw new Error("Nao conseguimos acessar o servico agora. Tente novamente em alguns instantes.");
        }
        let body = await response.json().catch(() => null);
        const tokenInvalido = response.status === 401 && String(body?.error ?? "").toLowerCase().includes("token");
        if (auth && tokenInvalido) {
            accessToken = await renovarSessaoExpirada();
            if (accessToken) {
                response = await fazerRequisicao(path, fetchOptions, accessToken);
                body = await response.json().catch(() => null);
            }
        }
        if (!response.ok) {
            throw new Error(body?.error ?? "Nao conseguimos concluir agora.");
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
