"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;

const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");

exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.use(auth_1.requireAuth);

const filtrosEventos = {
    reservas: ["NOVA_RESERVA", "RESERVA_CONFIRMADA", "RESERVA_CANCELADA", "RESERVA_CHECK_IN", "RESERVA_CONCLUIDA", "PRESENCA_CONFIRMADA", "PRESENCA_RECUSADA"],
    pedidos: ["PEDIDO_CRIADO", "PEDIDO_CANCELADO", "STATUS_PEDIDO"],
    pagamentos: ["PAGAMENTO_APROVADO", "REPASSE_LIBERADO", "REPASSE_ESTORNADO", "REEMBOLSO_SOLICITADO", "REEMBOLSO_CONCLUIDO", "REEMBOLSO_RECUSADO"],
    cancelamentos: ["RESERVA_CANCELADA", "PEDIDO_CANCELADO", "PRESENCA_RECUSADA", "REPASSE_ESTORNADO", "REEMBOLSO_SOLICITADO", "REEMBOLSO_CONCLUIDO", "REEMBOLSO_RECUSADO"],
};

exports.notificationsRouter.get("/", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const filtro = String(req.query.filtro ?? "todas");
    const consulta = supabase
        .from("notificacoes")
        .select("*")
        .eq("apagada", false)
        .order("criado_em", { ascending: false })
        .limit(60);
    if (filtro === "nao_lidas") {
        consulta.eq("lida", false);
    }
    if (filtro === "favoritas") {
        consulta.eq("favoritada", true);
    }
    if (filtrosEventos[filtro]) {
        consulta.in("tipo_evento", filtrosEventos[filtro]);
    }
    const { data, error } = await consulta;
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data ?? []);
});

exports.notificationsRouter.get("/contador", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { count, error } = await supabase
        .from("notificacoes")
        .select("*", { count: "exact", head: true })
        .eq("apagada", false)
        .eq("lida", false);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json({ nao_lidas: count ?? 0 });
});

exports.notificationsRouter.patch("/marcar-todas/lidas", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("apagada", false)
        .eq("lida", false)
        .select("id_notificacao");
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json({ atualizadas: data?.length ?? 0 });
});

exports.notificationsRouter.patch("/limpar", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("notificacoes")
        .update({ apagada: true, apagada_em: new Date().toISOString() })
        .eq("apagada", false)
        .eq("favoritada", false)
        .select("id_notificacao");
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json({ apagadas: data?.length ?? 0 });
});

exports.notificationsRouter.patch("/:id/lida", async (req, res) => {
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
        return res.status(400).json({ error: "Notificacao invalida." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id_notificacao", notificationId)
        .eq("apagada", false)
        .select("*")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});

exports.notificationsRouter.patch("/:id/favorita", async (req, res) => {
    const notificationId = Number(req.params.id);
    const favoritada = Boolean(req.body?.favoritada);
    if (!Number.isFinite(notificationId)) {
        return res.status(400).json({ error: "Notificacao invalida." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("notificacoes")
        .update({ favoritada })
        .eq("id_notificacao", notificationId)
        .eq("apagada", false)
        .select("*")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});

exports.notificationsRouter.patch("/:id/apagar", async (req, res) => {
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
        return res.status(400).json({ error: "Notificacao invalida." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("notificacoes")
        .update({ apagada: true, apagada_em: new Date().toISOString() })
        .eq("id_notificacao", notificationId)
        .eq("apagada", false)
        .select("id_notificacao")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
