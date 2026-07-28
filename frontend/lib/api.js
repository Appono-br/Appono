import { getAccessToken, obterTokensAutenticacao, salvarTokensAutenticacao } from "./session";
import { supabase } from "./supabase";

const API_URL_PADRAO_LOCAL = "http://localhost:3001/api";
const API_URL_PRODUCAO = "https://appono-backend.vercel.app/api";

function navegadorEstaEmAmbienteLocal() {
    if (typeof window === "undefined") {
        return true;
    }

    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function obterApiUrl() {
    const apiUrlConfigurada = process.env.NEXT_PUBLIC_API_URL ?? API_URL_PADRAO_LOCAL;
    const usaApiLocal = apiUrlConfigurada.includes("localhost") || apiUrlConfigurada.includes("127.0.0.1");

    if (usaApiLocal && !navegadorEstaEmAmbienteLocal()) {
        return API_URL_PRODUCAO;
    }

    return apiUrlConfigurada.replace(/\/$/, "");
}

async function renovarSessaoExpirada() {
    const tokens = obterTokensAutenticacao();
    if (!tokens?.refreshToken) {
        return null;
    }
    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: tokens.refreshToken,
    });
    if (error || !data.session) {
        return null;
    }
    salvarTokensAutenticacao(data.session);
    return data.session.access_token;
}

async function fazerRequisicao(path, options, accessToken) {
    return fetch(`${obterApiUrl()}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...options.headers,
        },
    });
}

export async function apiRequest(path, options = {}) {
    let accessToken = getAccessToken();
    let response;
    try {
        response = await fazerRequisicao(path, options, accessToken);
    }
    catch {
        throw new Error("Nao conseguimos acessar o servico agora. Tente novamente em alguns instantes.");
    }
    let body = await response.json().catch(() => null);
    const tokenInvalido = response.status === 401 && String(body?.error ?? "").toLowerCase().includes("token");
    if (tokenInvalido) {
        accessToken = await renovarSessaoExpirada();
        if (accessToken) {
            response = await fazerRequisicao(path, options, accessToken);
            body = await response.json().catch(() => null);
        }
    }
    if (!response.ok) {
        throw new Error(body?.error ?? "Nao conseguimos concluir agora.");
    }
    return body;
}
