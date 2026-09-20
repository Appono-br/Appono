"use strict";

const CONFIGURACOES = {
    GOOGLE: {
        enabledEnv: "APPONO_ROTINA_AGENDA_GOOGLE_ENABLED",
        clientIdEnv: "GOOGLE_CALENDAR_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CALENDAR_CLIENT_SECRET",
        redirectEnv: "GOOGLE_CALENDAR_REDIRECT_URI",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
            "openid",
            "email",
            "https://www.googleapis.com/auth/calendar.events.freebusy",
            "https://www.googleapis.com/auth/calendar.events.owned",
        ],
    },
    OUTLOOK: {
        enabledEnv: "APPONO_ROTINA_AGENDA_OUTLOOK_ENABLED",
        clientIdEnv: "MICROSOFT_CALENDAR_CLIENT_ID",
        clientSecretEnv: "MICROSOFT_CALENDAR_CLIENT_SECRET",
        redirectEnv: "MICROSOFT_CALENDAR_REDIRECT_URI",
        authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: ["openid", "email", "offline_access", "User.Read", "Calendars.ReadBasic"],
    },
};

function configuracaoProvedor(provedor) {
    const base = CONFIGURACOES[provedor];
    if (!base) return null;
    const enabled = String(process.env[base.enabledEnv] ?? "false").toLowerCase() === "true";
    const config = {
        ...base,
        enabled,
        clientId: process.env[base.clientIdEnv],
        clientSecret: process.env[base.clientSecretEnv],
        redirectUri: process.env[base.redirectEnv],
    };
    return { ...config, configured: Boolean(enabled && config.clientId && config.clientSecret && config.redirectUri) };
}

function criarUrlAutorizacao(provedor, { state, challenge }) {
    const config = configuracaoProvedor(provedor);
    if (!config?.configured) {
        const erro = new Error(`${provedor === "GOOGLE" ? "Google Agenda" : "Outlook"} ainda não está configurado neste ambiente.`);
        erro.code = "CALENDAR_PROVIDER_DISABLED";
        throw erro;
    }
    const parametros = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: config.scopes.join(" "),
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
    });
    if (provedor === "GOOGLE") {
        parametros.set("access_type", "offline");
        parametros.set("include_granted_scopes", "true");
        parametros.set("prompt", "consent");
    }
    return `${config.authorizeUrl}?${parametros}`;
}

async function requisicaoJson(url, options, codigo) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const erro = new Error("O provedor de agenda não concluiu a operação.");
        erro.code = codigo;
        erro.status = response.status;
        throw erro;
    }
    return body;
}

async function trocarCodigo(provedor, { code, verifier }) {
    const config = configuracaoProvedor(provedor);
    if (!config?.configured) throw Object.assign(new Error("Provedor de agenda indisponível."), { code: "CALENDAR_PROVIDER_DISABLED" });
    return requisicaoJson(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            grant_type: "authorization_code",
            code,
            code_verifier: verifier,
        }),
    }, "CALENDAR_TOKEN_EXCHANGE_FAILED");
}

async function renovarToken(provedor, refreshToken) {
    const config = configuracaoProvedor(provedor);
    return requisicaoJson(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            scope: config.scopes.join(" "),
        }),
    }, "CALENDAR_TOKEN_REFRESH_FAILED");
}

async function identificarConta(provedor, accessToken) {
    const url = provedor === "GOOGLE"
        ? "https://openidconnect.googleapis.com/v1/userinfo"
        : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName";
    const body = await requisicaoJson(url, { headers: { Authorization: `Bearer ${accessToken}` } }, "CALENDAR_ACCOUNT_LOOKUP_FAILED");
    return String(body.email ?? body.mail ?? body.userPrincipalName ?? "").trim().slice(0, 180) || null;
}

async function buscarOcupacao(provedor, { accessToken, inicio, fim, identificadorConta }) {
    if (provedor === "GOOGLE") {
        return requisicaoJson("https://www.googleapis.com/calendar/v3/freeBusy", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ timeMin: inicio, timeMax: fim, timeZone: "America/Sao_Paulo", items: [{ id: "primary" }] }),
        }, "CALENDAR_SYNC_FAILED");
    }
    return requisicaoJson("https://graph.microsoft.com/v1.0/me/calendar/getSchedule", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: 'outlook.timezone="UTC"' },
        body: JSON.stringify({ schedules: [identificadorConta], startTime: { dateTime: inicio, timeZone: "UTC" }, endTime: { dateTime: fim, timeZone: "UTC" }, availabilityViewInterval: 30 }),
    }, "CALENDAR_SYNC_FAILED");
}

function podeEscreverGoogle(escopos = []) {
    const permitidos = new Set(escopos);
    return [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.events.owned",
        "https://www.googleapis.com/auth/calendar.app.created",
    ].some((escopo) => permitidos.has(escopo));
}

async function requisicaoEventoGoogle(url, options, codigo, aceitarNaoEncontrado = false) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
    if (aceitarNaoEncontrado && response.status === 404) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const erro = new Error("O Google Agenda não concluiu a gravação do planejamento.");
        erro.code = codigo;
        erro.status = response.status;
        throw erro;
    }
    return body;
}

async function salvarEventoGoogle({ accessToken, eventoId, evento }) {
    const base = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventoId)}`;
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
    const existente = await requisicaoEventoGoogle(base, { headers }, "CALENDAR_EVENT_LOOKUP_FAILED", true);
    if (existente) {
        return requisicaoEventoGoogle(`${base}?sendUpdates=none`, {
            method: "PATCH", headers, body: JSON.stringify(evento),
        }, "CALENDAR_EVENT_UPDATE_FAILED");
    }
    return requisicaoEventoGoogle("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none", {
        method: "POST", headers, body: JSON.stringify({ ...evento, id: eventoId }),
    }, "CALENDAR_EVENT_CREATE_FAILED");
}

async function excluirEventoGoogle({ accessToken, eventoId }) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventoId)}?sendUpdates=none`, {
        method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(12000),
    });
    if (response.status === 404 || response.status === 410 || response.status === 204) return true;
    if (!response.ok) {
        const erro = new Error("O Google Agenda não concluiu a remoção de um evento antigo.");
        erro.code = "CALENDAR_EVENT_DELETE_FAILED";
        erro.status = response.status;
        throw erro;
    }
    return true;
}

module.exports = {
    buscarOcupacao,
    configuracaoProvedor,
    criarUrlAutorizacao,
    excluirEventoGoogle,
    identificarConta,
    podeEscreverGoogle,
    renovarToken,
    salvarEventoGoogle,
    trocarCodigo,
};
