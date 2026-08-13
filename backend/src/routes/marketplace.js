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

async function obterRestauranteLogado(_accessToken, userId) {
    const clienteBanco = supabase_1.supabaseAdmin;
    if (!clienteBanco) {
        throw new Error("SUPABASE_SECRET_KEY precisa estar configurada no backend.");
    }
    const { data, error } = await clienteBanco
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

exports.marketplaceRouter.get("/mercado-pago/status", auth_1.requireAuth, (0, auth_1.requireRole)("restaurante"), async (_req, res) => {
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

function obterInicioPeriodo(periodo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (periodo === "hoje") {
        return hoje;
    }
    if (periodo === "7d") {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 6);
        return inicio;
    }
    if (periodo === "30d") {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 29);
        return inicio;
    }
    return null;
}

function obterPercentualComissaoAppono() {
    const percentual = Number(process.env.MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL ?? process.env.MERCADO_PAGO_MARKETPLACE_FEE ?? 13);
    return Number.isFinite(percentual) && percentual >= 0 ? percentual : 13;
}

exports.marketplaceRouter.get("/financeiro/resumo", auth_1.requireAuth, (0, auth_1.requireRole)("restaurante"), async (req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    try {
        const restaurante = await obterRestauranteLogado(res.locals.accessToken, res.locals.user.id);
        if (!restaurante) {
            return res.status(403).json({ error: "Apenas restaurantes podem consultar o financeiro." });
        }
        const { data: pedidos, error: pedidosError } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .select("id_pedido, status_pedido, data_pedido, valor_total, clientes(nome), reservas(data_reserva, horario_inicio)")
            .eq("id_restaurante", restaurante.id_restaurante)
            .order("data_pedido", { ascending: false });
        if (pedidosError) {
            throw new Error(pedidosError.message);
        }
        const pedidosPorId = new Map((pedidos ?? []).map((pedido) => [pedido.id_pedido, pedido]));
        const idsPedidos = Array.from(pedidosPorId.keys());
        if (!idsPedidos.length) {
            return res.json({
                restaurante,
                resumo: {
                    valor_bruto: 0,
                    valor_comissao_app: 0,
                    valor_restaurante: 0,
                    valor_liquido_recebido: 0,
                    valor_a_receber: 0,
                    valor_liberado: 0,
                    valor_estornado: 0,
                    quantidade_pagamentos: 0,
                    quantidade_liberados: 0,
                },
                politica_financeira: {
                    percentual_comissao_app: obterPercentualComissaoAppono(),
                    gatilho_repasse: "ENTREGA_DO_PEDIDO",
                },
                repasses: [],
            });
        }
        const { data: pagamentos, error: pagamentosError } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .select("id_pagamento, id_pedido, valor_pago, valor, status_pagamento, tipo_fluxo_pagamento, percentual_comissao_app, valor_comissao_app, valor_restaurante, status_repasse, atualizado_em, data_pagamento, data_aprovacao")
            .in("id_pedido", idsPedidos)
            .order("atualizado_em", { ascending: false });
        if (pagamentosError) {
            throw new Error(pagamentosError.message);
        }
        const inicioPeriodo = obterInicioPeriodo(String(req.query.periodo ?? "todos"));
        const pagamentosValidos = (pagamentos ?? []).filter((pagamento) => {
            if (pagamento.status_pagamento !== "APROVADO") {
                return false;
            }
            if (!inicioPeriodo) {
                return true;
            }
            const dataReferencia = new Date(pagamento.data_aprovacao ?? pagamento.data_pagamento ?? pagamento.atualizado_em);
            return dataReferencia >= inicioPeriodo;
        });
        const resumo = pagamentosValidos.reduce((acumulado, pagamento) => {
            const pedido = pedidosPorId.get(pagamento.id_pedido);
            const foiCancelado = pagamento.status_repasse === "ESTORNADO" || pedido?.status_pedido === "CANCELADO";
            acumulado.quantidade_pagamentos += 1;
            if (foiCancelado) {
                acumulado.valor_estornado += Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
                return acumulado;
            }
            acumulado.valor_bruto += Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
            acumulado.valor_comissao_app += Number(pagamento.valor_comissao_app ?? 0);
            acumulado.valor_restaurante += Number(pagamento.valor_restaurante ?? 0);
            if (pagamento.status_repasse === "AGUARDANDO_ENTREGA") {
                acumulado.valor_a_receber += Number(pagamento.valor_restaurante ?? 0);
            }
            if (pagamento.status_repasse === "LIBERADO_PARA_REPASSE" || pagamento.status_repasse === "REPASSADO") {
                acumulado.valor_liberado += Number(pagamento.valor_restaurante ?? 0);
                acumulado.quantidade_liberados += 1;
            }
            return acumulado;
        }, {
            valor_bruto: 0,
            valor_comissao_app: 0,
            valor_restaurante: 0,
            valor_liquido_recebido: 0,
            valor_a_receber: 0,
            valor_liberado: 0,
            valor_estornado: 0,
            quantidade_pagamentos: 0,
            quantidade_liberados: 0,
        });
        resumo.valor_liquido_recebido = resumo.valor_restaurante;
        const repasses = pagamentosValidos.map((pagamento) => ({
            ...pagamento,
            pedido: pedidosPorId.get(pagamento.id_pedido) ?? null,
        }));
        return res.json({
            restaurante,
            resumo,
            politica_financeira: {
                percentual_comissao_app: obterPercentualComissaoAppono(),
                gatilho_repasse: "ENTREGA_DO_PEDIDO",
            },
            repasses,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Nao foi possivel consultar o financeiro." });
    }
});

exports.marketplaceRouter.post("/mercado-pago/conectar", auth_1.requireAuth, (0, auth_1.requireRole)("restaurante"), async (_req, res) => {
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
        authorizationUrl.searchParams.set("scope", "read write offline_access");
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

exports.marketplaceRouter.post("/mercado-pago/desconectar", auth_1.requireAuth, (0, auth_1.requireRole)("restaurante"), async (_req, res) => {
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
