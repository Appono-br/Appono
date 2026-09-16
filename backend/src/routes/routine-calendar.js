"use strict";

const crypto = require("node:crypto");
const { Router } = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
    criarEstadoOAuth,
    criarPkce,
    extrairIntervalosGoogle,
    extrairIntervalosOutlook,
    hashSeguro,
    normalizarIntervalos,
    normalizarProvedor,
} = require("../domain/routine-calendar");
const { cifrar, decifrar } = require("../services/agenda/crypto");
const {
    buscarOcupacao,
    configuracaoProvedor,
    criarUrlAutorizacao,
    identificarConta,
    renovarToken,
    trocarCodigo,
} = require("../services/agenda/providers");

const agendaRotinaRouter = Router();

function banco(res) {
    if (supabaseAdmin) return supabaseAdmin;
    res.status(503).json({ code: "CALENDAR_DATABASE_UNAVAILABLE", error: "A agenda está temporariamente indisponível." });
    return null;
}

function frontendUrl(pathname, parametros = {}) {
    const origem = String(process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
        .split(",")[0].trim().replace(/\/$/, "");
    const url = new URL(pathname, `${origem}/`);
    for (const [chave, valor] of Object.entries(parametros)) if (valor) url.searchParams.set(chave, valor);
    return url.toString();
}

function erroHttp(res, error, fallback = "Não foi possível concluir a operação da agenda.") {
    const code = String(error?.code ?? "CALENDAR_OPERATION_FAILED").slice(0, 80);
    const status = code.includes("DISABLED") || code.includes("MISSING") ? 503 : 422;
    return res.status(status).json({ code, error: error?.message || fallback });
}

function expiraEm(tokens) {
    const segundos = Number(tokens?.expires_in ?? 3600);
    return new Date(Date.now() + Math.max(60, segundos - 30) * 1000).toISOString();
}

agendaRotinaRouter.get("/:provider/callback", async (req, res) => {
    const provedor = normalizarProvedor(req.params.provider);
    const state = String(req.query.state ?? "");
    const code = String(req.query.code ?? "");
    if (!provedor || !state || !code || !supabaseAdmin) {
        return res.redirect(frontendUrl("/cliente/rotina/configurar", { agenda: "erro", code: "OAUTH_CALLBACK_INVALIDO" }));
    }
    try {
        const { data: tentativa, error: erroTentativa } = await supabaseAdmin.rpc("consumir_tentativa_oauth_agenda", {
            p_state_hash: hashSeguro(state), p_provedor: provedor,
        });
        if (erroTentativa || !tentativa) throw Object.assign(new Error("A autorização expirou ou já foi utilizada."), { code: "OAUTH_STATE_INVALIDO" });

        const tokens = await trocarCodigo(provedor, { code, verifier: decifrar(tentativa.code_verifier_cifrado) });
        const identificadorConta = await identificarConta(provedor, tokens.access_token);
        const { data: atual } = await supabaseAdmin.from("conexoes_agenda_cliente")
            .select("token_refresh_cifrado").eq("id_cliente", tentativa.id_cliente).eq("provedor", provedor).maybeSingle();
        const refreshCifrado = tokens.refresh_token ? cifrar(tokens.refresh_token) : atual?.token_refresh_cifrado;
        if (!refreshCifrado) throw Object.assign(new Error("O provedor não liberou acesso contínuo. Conecte novamente e autorize o acesso."), { code: "CALENDAR_REFRESH_TOKEN_MISSING" });
        const { error } = await supabaseAdmin.from("conexoes_agenda_cliente").upsert({
            id_cliente: tentativa.id_cliente,
            provedor,
            status: "CONECTADO",
            escopos: String(tokens.scope ?? configuracaoProvedor(provedor).scopes.join(" ")).split(" ").filter(Boolean),
            identificador_conta: identificadorConta,
            token_acesso_cifrado: cifrar(tokens.access_token),
            token_refresh_cifrado: refreshCifrado,
            expiracao_token: expiraEm(tokens),
            erro_codigo: null,
            erro_em: null,
        }, { onConflict: "id_cliente,provedor" });
        if (error) throw error;
        return res.redirect(frontendUrl(tentativa.retorno_path, { agenda: "conectada", provedor: provedor.toLowerCase() }));
    }
    catch (error) {
        return res.redirect(frontendUrl("/cliente/rotina/configurar", {
            agenda: "erro", code: String(error?.code ?? "OAUTH_CALLBACK_FAILED").slice(0, 80),
        }));
    }
});

agendaRotinaRouter.use(requireAuth, requireRole("cliente"));

agendaRotinaRouter.get("/", async (_req, res) => {
    const db = banco(res);
    if (!db) return;
    const [{ data: conexoes, error }, { data: janelas, error: erroJanelas }] = await Promise.all([
        db.from("conexoes_agenda_cliente")
            .select("id_conexao_agenda,provedor,status,escopos,identificador_conta,timezone,ultima_sincronizacao_em,erro_codigo,erro_em")
            .eq("id_cliente", res.locals.profileId).order("provedor"),
        db.from("janelas_ocupadas_rotina").select("id_conexao_agenda,inicio_em,fim_em")
            .eq("id_cliente", res.locals.profileId).gte("fim_em", new Date().toISOString()).order("inicio_em").limit(250),
    ]);
    if (error || erroJanelas) return erroHttp(res, error || erroJanelas);
    return res.json({
        provedores: ["GOOGLE", "OUTLOOK"].map((provedor) => {
            const config = configuracaoProvedor(provedor);
            return { provedor, habilitado: config.enabled, configurado: config.configured };
        }),
        conexoes: conexoes ?? [],
        janelas_ocupadas: janelas ?? [],
    });
});

agendaRotinaRouter.post("/:provider/conectar", async (req, res) => {
    const db = banco(res);
    if (!db) return;
    const provedor = normalizarProvedor(req.params.provider);
    if (!provedor) return res.status(400).json({ code: "CALENDAR_PROVIDER_INVALID", error: "Provedor de agenda inválido." });
    try {
        const state = criarEstadoOAuth();
        const pkce = criarPkce();
        const retornoPath = ["/cliente/rotina", "/cliente/rotina/configurar"].includes(req.body?.retorno_path)
            ? req.body.retorno_path : "/cliente/rotina/configurar";
        const authorizationUrl = criarUrlAutorizacao(provedor, { state, challenge: pkce.challenge });
        const { error } = await db.from("oauth_agenda_tentativas").insert({
            id_cliente: res.locals.profileId,
            provedor,
            state_hash: hashSeguro(state),
            code_verifier_cifrado: cifrar(pkce.verifier),
            retorno_path: retornoPath,
            expira_em: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
        if (error) throw error;
        return res.status(201).json({ authorization_url: authorizationUrl, expira_em_segundos: 600 });
    }
    catch (error) { return erroHttp(res, error); }
});

async function tokenValido(db, conexao) {
    const expira = new Date(conexao.expiracao_token ?? 0).getTime();
    if (expira > Date.now() + 60_000) return decifrar(conexao.token_acesso_cifrado);
    const tokens = await renovarToken(conexao.provedor, decifrar(conexao.token_refresh_cifrado));
    const atualizacao = {
        token_acesso_cifrado: cifrar(tokens.access_token),
        token_refresh_cifrado: tokens.refresh_token ? cifrar(tokens.refresh_token) : conexao.token_refresh_cifrado,
        expiracao_token: expiraEm(tokens), status: "CONECTADO", erro_codigo: null, erro_em: null,
    };
    const { error } = await db.from("conexoes_agenda_cliente").update(atualizacao)
        .eq("id_conexao_agenda", conexao.id_conexao_agenda).eq("id_cliente", conexao.id_cliente);
    if (error) throw error;
    return tokens.access_token;
}

agendaRotinaRouter.post("/:provider/sincronizar", async (req, res) => {
    const db = banco(res);
    if (!db) return;
    const provedor = normalizarProvedor(req.params.provider);
    const chave = String(req.body?.chave_idempotencia ?? "");
    if (!provedor || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(chave)) {
        return res.status(400).json({ code: "CALENDAR_SYNC_INPUT_INVALID", error: "Informe um provedor e uma chave de sincronização válidos." });
    }
    const { data: conexao, error } = await db.from("conexoes_agenda_cliente").select("*")
        .eq("id_cliente", res.locals.profileId).eq("provedor", provedor).maybeSingle();
    if (error) return erroHttp(res, error);
    if (!conexao || !["CONECTADO", "ERRO"].includes(conexao.status)) {
        return res.status(404).json({ code: "CALENDAR_CONNECTION_NOT_FOUND", error: "Conecte essa agenda antes de sincronizar." });
    }
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 35 * 24 * 60 * 60 * 1000);
    try {
        const accessToken = await tokenValido(db, conexao);
        const resposta = await buscarOcupacao(provedor, {
            accessToken, inicio: inicio.toISOString(), fim: fim.toISOString(), identificadorConta: conexao.identificador_conta,
        });
        const brutos = provedor === "GOOGLE" ? extrairIntervalosGoogle(resposta) : extrairIntervalosOutlook(resposta);
        const janelas = normalizarIntervalos(brutos, { inicioPeriodo: inicio, fimPeriodo: fim });
        const { data, error: erroRpc } = await db.rpc("substituir_janelas_ocupadas_agenda", {
            p_id_cliente: res.locals.profileId,
            p_id_conexao_agenda: conexao.id_conexao_agenda,
            p_chave_idempotencia: chave,
            p_inicio_periodo: inicio.toISOString(),
            p_fim_periodo: fim.toISOString(),
            p_janelas: janelas,
            p_cursor_sincronizacao: null,
        });
        if (erroRpc) throw erroRpc;
        return res.json({ sincronizacao: data, intervalos: janelas.length });
    }
    catch (falha) {
        const codigo = String(falha?.code ?? "CALENDAR_SYNC_FAILED").slice(0, 80);
        await db.from("conexoes_agenda_cliente").update({ status: "ERRO", erro_codigo: codigo, erro_em: new Date().toISOString() })
            .eq("id_conexao_agenda", conexao.id_conexao_agenda).eq("id_cliente", res.locals.profileId);
        return erroHttp(res, falha, "A sincronização falhou. As últimas janelas válidas foram preservadas.");
    }
});

agendaRotinaRouter.delete("/:provider", async (req, res) => {
    const db = banco(res);
    if (!db) return;
    const provedor = normalizarProvedor(req.params.provider);
    if (!provedor) return res.status(400).json({ code: "CALENDAR_PROVIDER_INVALID", error: "Provedor de agenda inválido." });
    const { data, error } = await db.rpc("desconectar_agenda_cliente", {
        p_id_cliente: res.locals.profileId, p_provedor: provedor,
    });
    if (error) return erroHttp(res, error);
    return res.json({ desconectado: Boolean(data) });
});

module.exports = { agendaRotinaRouter };
