import { supabase } from "./supabase";
const authTokensKey = "appono:auth";
export function getDashboardPath(tipo) {
    if (tipo === "admin") {
        return "/admin/financeiro";
    }
    return tipo === "restaurante" ? "/restaurante/home" : "/cliente/dashboard";
}
export function getAccessToken() {
    if (typeof window === "undefined") {
        return null;
    }
    const storedTokens = window.localStorage.getItem(authTokensKey);
    if (!storedTokens) {
        return null;
    }
    try {
        const tokens = JSON.parse(storedTokens);
        return tokens.accessToken ?? null;
    }
    catch {
        window.localStorage.removeItem(authTokensKey);
        return null;
    }
}

export function salvarTokensAutenticacao(session) {
    if (typeof window === "undefined" || !session) {
        return;
    }
    window.localStorage.setItem(authTokensKey, JSON.stringify({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
    }));
}
export function clearAuthResponse() {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.removeItem(authTokensKey);
    window.localStorage.removeItem("appono:session");
}
export function obterTokensAutenticacao() {
    if (typeof window === "undefined") {
        return null;
    }
    const tokensArmazenados = window.localStorage.getItem(authTokensKey);
    if (!tokensArmazenados) {
        return null;
    }
    try {
        return JSON.parse(tokensArmazenados);
    }
    catch {
        return null;
    }
}
export function atualizarNomeSessao(nome) {
    if (typeof window === "undefined" || !nome) {
        return;
    }
    const sessaoArmazenada = window.localStorage.getItem("appono:session");
    if (!sessaoArmazenada) {
        return;
    }
    try {
        const sessao = JSON.parse(sessaoArmazenada);
        window.localStorage.setItem("appono:session", JSON.stringify({ ...sessao, name: nome }));
        window.dispatchEvent(new StorageEvent("storage", { key: "appono:session" }));
    }
    catch {
        window.localStorage.removeItem("appono:session");
    }
}
export async function encerrarSessao() {
    try {
        const storedTokens = window.localStorage.getItem(authTokensKey);
        const tokens = storedTokens ? JSON.parse(storedTokens) : null;
        if (tokens?.accessToken && tokens.refreshToken) {
            await supabase.auth.setSession({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
            });
        }
        await supabase.auth.signOut({ scope: "local" });
    }
    catch {
        return clearAuthResponse();
    }
    clearAuthResponse();
}
export async function persistAuthResponse(response) {
    if (response.session) {
        salvarTokensAutenticacao(response.session);
    }
    if (response.tipo && response.perfil) {
        const sessionType = response.tipo === "admin"
            ? "admin"
            : response.tipo === "restaurante"
                ? "restaurant"
                : "client";
        localStorage.setItem("appono:session", JSON.stringify({
            type: sessionType,
            name: response.perfil.nome,
        }));
    }
}
