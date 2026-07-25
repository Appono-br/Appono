"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceRouter = void 0;

const crypto = require("crypto");
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");

exports.marketplaceRouter = (0, express_1.Router)();

function obterFrontendOrigin() {
    return (process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");
}

function obterBackendPublicUrl() {
    return (process.env.BACKEND_PUBLIC_URL ?? "")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");
}

function obterMercadoPagoAppId() {
    return (process.env.MERCADO_PAGO_APP_ID ?? process.env.MERCADO_PAGO_CLIENT_ID ?? "").trim();
}

function obterMercadoPagoClientSecret() {
    return (process.env.MERCADO_PAGO_CLIENT_SECRET ?? "").trim();
}

function obterRedirectUriMercadoPago() {
    const redirectConfigurado = (process.env.MERCADO_PAGO_REDIRECT_URI ?? "").trim();
    if (redirectConfigurado) {
        return redirectConfigurado;
    }
    const backendUrl = obterBackendPublicUrl();
    return backendUrl ? `${backendUrl}/api/marketplace/mercado-pago/callback` : "";
}

function obterUrlRetornoFrontend(status, detalhe = "") {
    const url = new URL(`${obterFrontendOrigin()}/restaurante/financeiro`);
    url.searchParams.set("mercado_pago", status);
    if (detalhe) {
        url.searchParams.set("detalhe", detalhe);
    }
    return url.toString();
}

function gerarStateOAuth(restauranteId) {
    return `${restauranteId}.${crypto.randomBytes(24).toString("hex")}`;
}

function validarConfiguracaoOAuth() {
    const appId = obterMercadoPagoAppId();
    const clientSecret = obterMercadoPagoClientSecret();
    const redirectUri = obterRedirectUriMercadoPago();
    if (!appId || !clientSecret || !redirectUri) {
        return {
            ok: false,
            error: "Configure MERCADO_PAGO_APP_ID, MERCADO_PAGO_CLIENT_SECRET e MERCADO_PAGO_REDIRECT_URI no backend.",
        };
    }
    return { ok: true, appId, clientSecret, redirectUri };
}

async function obterRestauranteLogado(accessToken, userId) {
    const supabase = (0, supabase_1.createUserSupabaseClient)(accessToken);
    const { data, error } = await supabase
        .from("restaurantes")
        .select("id_restaurante, nome")
        .eq("id_auth", userId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

function sanitizarConexao(conexao) {
    if (!conexao) {
        return {
            status: "NAO_CONECTADO",
            conectado: false,
        };
    }
    return {
        status: conexao.status,
        conectado: conexao.status === "CONECTADO",
        mercado_pago_user_id: conexao.mercado_pago_user_id,
        public_key: conexao.public_key,
        live_mode: conexao.live_mode,
        scope: conexao.scope,
        conectado_em: conexao.conectado_em,
        desconectado_em: conexao.desconectado_em,
        atualizado_em: conexao.atualizado_em,
        expires_at: conexao.expires_at,
    };
}

exports.marketplaceRouter.get("/mercado-pago/status", auth_1.requireAuth, async (_req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    try {
        const restaurante = await obterRestauranteLogado(res.locals.accessToken, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem conectar Mercado Pago." });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .select("status, mercado_pago_user_id, public_key, live_mode, scope, conectado_em, desconectado_em, atualizado_em, expires_at")
            .eq("id_restaurante", restaurante.id_restaurante)
            .maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        return res.json({
            restaurante,
            conexao: sanitizarConexao(data),
        });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Nao foi possivel consultar a conexao." });
    }
});

exports.marketplaceRouter.post("/mercado-pago/conectar", auth_1.requireAuth, async (_req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    const configuracao = validarConfiguracaoOAuth();
    if (!configuracao.ok) {
        return res.status(409).json({ error: configuracao.error });
    }
    try {
        const restaurante = await obterRestauranteLogado(res.locals.accessToken, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem conectar Mercado Pago." });
        }
        const state = gerarStateOAuth(restaurante.id_restaurante);
        const { error } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .upsert({
            id_restaurante: restaurante.id_restaurante,
            status: "AGUARDANDO_AUTORIZACAO",
            oauth_state: state,
            desconectado_em: null,
        }, { onConflict: "id_restaurante" });
        if (error) {
            throw new Error(error.message);
        }
        const authorizationUrl = new URL("https://auth.mercadopago.com.br/authorization");
        authorizationUrl.searchParams.set("client_id", configuracao.appId);
        authorizationUrl.searchParams.set("response_type", "code");
        authorizationUrl.searchParams.set("platform_id", "mp");
        authorizationUrl.searchParams.set("redirect_uri", configuracao.redirectUri);
        authorizationUrl.searchParams.set("state", state);
        return res.status(201).json({
            authorization_url: authorizationUrl.toString(),
            redirect_uri: configuracao.redirectUri,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Nao foi possivel iniciar a conexao." });
    }
});

exports.marketplaceRouter.post("/mercado-pago/desconectar", auth_1.requireAuth, async (_req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    try {
        const restaurante = await obterRestauranteLogado(res.locals.accessToken, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem desconectar Mercado Pago." });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .upsert({
            id_restaurante: restaurante.id_restaurante,
            status: "DESCONECTADO",
            mercado_pago_user_id: null,
            public_key: null,
            access_token: null,
            refresh_token: null,
            token_type: null,
            scope: null,
            live_mode: null,
            expires_at: null,
            oauth_state: null,
            conectado_em: null,
            desconectado_em: new Date().toISOString(),
        }, { onConflict: "id_restaurante" })
            .select("status, desconectado_em, atualizado_em")
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return res.json({ conexao: sanitizarConexao(data) });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Nao foi possivel desconectar a conta." });
    }
});

exports.marketplaceRouter.get("/mercado-pago/callback", async (req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.redirect(obterUrlRetornoFrontend("erro", "supabase"));
    }
    const configuracao = validarConfiguracaoOAuth();
    if (!configuracao.ok) {
        return res.redirect(obterUrlRetornoFrontend("erro", "configuracao"));
    }
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state) {
        return res.redirect(obterUrlRetornoFrontend("erro", "codigo-ausente"));
    }
    try {
        const { data: conexaoPendente, error: buscaError } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .select("id_conexao, id_restaurante, status")
            .eq("oauth_state", state)
            .maybeSingle();
        if (buscaError || !conexaoPendente) {
            throw new Error(buscaError?.message ?? "Conexao OAuth nao encontrada.");
        }
        const resposta = await fetch("https://api.mercadopago.com/oauth/token", {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: configuracao.appId,
                client_secret: configuracao.clientSecret,
                code,
                redirect_uri: configuracao.redirectUri,
            }),
        });
        const token = await resposta.json().catch(() => null);
        if (!resposta.ok) {
            throw new Error(token?.message ?? "Nao foi possivel obter o token OAuth do Mercado Pago.");
        }
        const expiresIn = Number(token.expires_in ?? 0);
        const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
        const { error: atualizacaoError } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .update({
            status: "CONECTADO",
            mercado_pago_user_id: token.user_id ? String(token.user_id) : null,
            public_key: token.public_key ?? null,
            access_token: token.access_token ?? null,
            refresh_token: token.refresh_token ?? null,
            token_type: token.token_type ?? null,
            scope: token.scope ?? null,
            live_mode: typeof token.live_mode === "boolean" ? token.live_mode : null,
            expires_at: expiresAt,
            oauth_state: null,
            conectado_em: new Date().toISOString(),
            desconectado_em: null,
        })
            .eq("id_conexao", conexaoPendente.id_conexao);
        if (atualizacaoError) {
            throw new Error(atualizacaoError.message);
        }
        return res.redirect(obterUrlRetornoFrontend("conectado"));
    }
    catch (error) {
        console.warn("Falha no callback OAuth Mercado Pago:", error instanceof Error ? error.message : error);
        return res.redirect(obterUrlRetornoFrontend("erro", "callback"));
    }
});
