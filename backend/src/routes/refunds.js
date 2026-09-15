"use strict";

const { Router } = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { normalizeRefundReason, refundRequestEligibility, refundReviewEligibility } = require("../domain/refund-state");
const { notificarAdministradores, notificarCliente, notificarRestaurante } = require("../services/notificacoes");
const paymentConfig = require("../services/pagamentos/config");
const { refundApprovedPayments } = require("../services/pagamentos/refund");

const refundsRouter = Router();
const SELECT_REFUND = "*, pedidos(status_pedido, valor_total), pagamentos(status_pagamento, status_repasse, tipo_fluxo_pagamento), clientes(nome), restaurantes(nome)";
const SELECT_REFUND_INTERNAL = "*, pagamentos(status_pagamento, status_repasse, tipo_fluxo_pagamento, mercado_pago_payment_id)";

function requireAdminDatabase(res) {
    if (supabaseAdmin) return true;
    res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    return false;
}

function refundErrorMessage(code) {
    const messages = {
        PAGAMENTO_NAO_ENCONTRADO: "Pagamento não encontrado para este pedido.",
        PAGAMENTO_NAO_APROVADO: "Somente pagamentos aprovados podem receber solicitação de reembolso.",
        PAGAMENTO_JA_ESTORNADO: "Este pagamento já foi estornado.",
        REEMBOLSO_EM_ANDAMENTO: "Ja existe uma solicitação de reembolso em andamento.",
        REEMBOLSO_JA_CONCLUIDO: "Este pagamento já possui reembolso concluído.",
    };
    return messages[code] ?? "Este pagamento não pode receber reembolso.";
}

async function loadRefund(id) {
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").select(SELECT_REFUND_INTERNAL).eq("id_reembolso", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}

refundsRouter.use(requireAuth);

refundsRouter.get("/pedido/:id", requireRole("cliente"), async (req, res) => {
    if (!requireAdminDatabase(res)) return;
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Pedido inválido." });
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").select(SELECT_REFUND)
        .eq("id_pedido", orderId).eq("id_cliente", res.locals.profileId).order("solicitado_em", { ascending: false }).limit(1).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ reembolso: data ?? null, modo: "MERCADO_PAGO_TESTE" });
});

refundsRouter.get("/me", requireRole("cliente"), async (_req, res) => {
    if (!requireAdminDatabase(res)) return;
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").select(SELECT_REFUND)
        .eq("id_cliente", res.locals.profileId).order("solicitado_em", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data ?? [] });
});

refundsRouter.post("/", requireRole("cliente"), async (req, res) => {
    if (!requireAdminDatabase(res)) return;
    if (paymentConfig.isRealMarketplace() || paymentConfig.productionAllowed()) {
        return res.status(409).json({ error: "O fluxo real de reembolso ainda não foi habilitado. O piloto atual aceita apenas marketplace simulado." });
    }
    const orderId = Number(req.body?.id_pedido);
    const reason = normalizeRefundReason(req.body?.motivo);
    if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Pedido inválido." });
    if (reason.length < 10) return res.status(400).json({ error: "Explique o motivo do reembolso em pelo menos 10 caracteres." });
    try {
        const { data: order, error: orderError } = await supabaseAdmin.from("pedidos")
            .select("id_pedido, id_cliente, id_restaurante, id_reserva, valor_total")
            .eq("id_pedido", orderId).eq("id_cliente", res.locals.profileId).maybeSingle();
        if (orderError) throw new Error(orderError.message);
        if (!order) return res.status(404).json({ error: "Pedido não encontrado para este cliente." });
        const { data: payment, error: paymentError } = await supabaseAdmin.from("pagamentos").select("*")
            .eq("id_pedido", orderId).order("atualizado_em", { ascending: false }).limit(1).maybeSingle();
        if (paymentError) throw new Error(paymentError.message);
        const { data: existingRefund, error: existingError } = await supabaseAdmin.from("solicitacoes_reembolso").select("*")
            .eq("id_pagamento", payment?.id_pagamento ?? 0).order("solicitado_em", { ascending: false }).limit(1).maybeSingle();
        if (existingError) throw new Error(existingError.message);
        const eligibility = refundRequestEligibility({ payment, existingRefund });
        if (!eligibility.allowed) return res.status(409).json({ error: refundErrorMessage(eligibility.code), code: eligibility.code });
        if (payment.tipo_fluxo_pagamento !== "SIMULADO_APPONO") {
            return res.status(409).json({ error: "Este pagamento não pertence ao marketplace simulado e exige estorno real pelo Mercado Pago." });
        }
        const amount = Number(payment.valor_pago ?? payment.valor ?? order.valor_total ?? 0);
        const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").insert({
            id_pagamento: payment.id_pagamento,
            id_pedido: order.id_pedido,
            id_reserva: order.id_reserva,
            id_cliente: order.id_cliente,
            id_restaurante: order.id_restaurante,
            valor_solicitado: amount,
            motivo: reason,
            modo_execucao: "MERCADO_PAGO_TESTE",
        }).select(SELECT_REFUND).single();
        if (error) throw new Error(error.code === "23505" ? "Ja existe um reembolso ativo para este pagamento." : error.message);
        await supabaseAdmin.from("eventos_financeiros").insert({ id_pagamento: payment.id_pagamento, id_pedido: order.id_pedido, id_reserva: order.id_reserva, tipo_evento: "REEMBOLSO_SOLICITADO", descricao: reason, valor: amount });
        await Promise.all([
            notificarRestaurante(order.id_restaurante, { titulo: "Nova solicitação de reembolso", mensagem: `O cliente solicitou reembolso do pedido #${order.id_pedido}.`, tipo_evento: "REEMBOLSO_SOLICITADO", link_destino: "/restaurante/reembolsos", dados: { id_reembolso: data.id_reembolso, id_pedido: order.id_pedido } }),
            notificarAdministradores({ titulo: "Reembolso solicitado", mensagem: `O pedido #${order.id_pedido} possui uma solicitacao para analise.`, tipo_evento: "REEMBOLSO_SOLICITADO", link_destino: "/admin/reembolsos", dados: { id_reembolso: data.id_reembolso, id_pedido: order.id_pedido } }),
        ]);
        return res.status(201).json(data);
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível solicitar o reembolso." });
    }
});

refundsRouter.patch("/:id/cancelar", requireRole("cliente"), async (req, res) => {
    if (!requireAdminDatabase(res)) return;
    const id = Number(req.params.id);
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").update({ status_reembolso: "CANCELADO", atualizado_em: new Date().toISOString() })
        .eq("id_reembolso", id).eq("id_cliente", res.locals.profileId).eq("status_reembolso", "SOLICITADO").select(SELECT_REFUND).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(409).json({ error: "A solicitação não éxiste ou já foi analisada." });
    return res.json(data);
});

refundsRouter.get("/restaurante", requireRole("restaurante"), async (_req, res) => {
    if (!requireAdminDatabase(res)) return;
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").select(SELECT_REFUND)
        .eq("id_restaurante", res.locals.profileId).order("solicitado_em", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data ?? [], modo: "MERCADO_PAGO_TESTE" });
});

refundsRouter.get("/admin", requireRole("admin"), async (_req, res) => {
    if (!requireAdminDatabase(res)) return;
    const { data, error } = await supabaseAdmin.from("solicitacoes_reembolso").select(SELECT_REFUND).order("solicitado_em", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data ?? [], modo: "MERCADO_PAGO_TESTE" });
});

refundsRouter.patch("/:id/analisar", requireRole("restaurante", "admin"), async (req, res) => {
    if (!requireAdminDatabase(res)) return;
    const id = Number(req.params.id);
    const decision = String(req.body?.decisao ?? "").toUpperCase();
    const response = normalizeRefundReason(req.body?.resposta);
    if (!Number.isInteger(id) || id <= 0 || !["APROVAR", "RECUSAR"].includes(decision)) return res.status(400).json({ error: "Analise invalida." });
    try {
        const refund = await loadRefund(id);
        if (!refund) return res.status(404).json({ error: "Reembolso não encontrado." });
        if (res.locals.role === "restaurante" && refund.id_restaurante !== res.locals.profileId) return res.status(403).json({ error: "Este reembolso pertence a outro restaurante." });
        if (!refundReviewEligibility(refund).allowed) return res.status(409).json({ error: "Esta solicitação já foi analisada." });
        let updated;
        if (decision === "APROVAR") {
            await refundApprovedPayments([{
                id_pagamento: refund.id_pagamento,
                id_pedido: refund.id_pedido,
                status_pagamento: refund.pagamentos?.status_pagamento,
                status_repasse: refund.pagamentos?.status_repasse,
                tipo_fluxo_pagamento: refund.pagamentos?.tipo_fluxo_pagamento,
                mercado_pago_payment_id: refund.pagamentos?.mercado_pago_payment_id,
                valor_pago: refund.valor_solicitado,
            }], refund.id_restaurante);
            const result = await supabaseAdmin.rpc("concluir_reembolso_simulado", { reembolso_id: id, analista_id: res.locals.user.id, resposta_analise: response || null });
            if (result.error) {
                const current = await loadRefund(id);
                if (current?.status_reembolso !== "CONCLUIDO") throw new Error(result.error.message);
                updated = current;
            } else {
                updated = result.data;
            }
        } else {
            if (response.length < 10) return res.status(400).json({ error: "Informe uma justificativa de pelo menos 10 caracteres para recusar." });
            const result = await supabaseAdmin.from("solicitacoes_reembolso").update({ status_reembolso: "RECUSADO", resposta: response, id_auth_analista: res.locals.user.id, analisado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
                .eq("id_reembolso", id).eq("status_reembolso", "SOLICITADO").select("*").single();
            if (result.error) throw new Error(result.error.message);
            updated = result.data;
            await supabaseAdmin.from("eventos_financeiros").insert({ id_pagamento: refund.id_pagamento, id_pedido: refund.id_pedido, id_reserva: refund.id_reserva, tipo_evento: "REEMBOLSO_RECUSADO", descricao: response, valor: refund.valor_solicitado });
        }
        await notificarCliente(refund.id_cliente, { titulo: decision === "APROVAR" ? "Reembolso de teste aprovado" : "Reembolso recusado", mensagem: decision === "APROVAR" ? `A solicitacao do pedido #${refund.id_pedido} foi concluida no ambiente de testes do Mercado Pago.` : response, tipo_evento: decision === "APROVAR" ? "REEMBOLSO_CONCLUIDO" : "REEMBOLSO_RECUSADO", link_destino: `/cliente/pedidos/${refund.id_pedido}`, dados: { id_reembolso: id, id_pedido: refund.id_pedido } });
        return res.json(updated);
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível analisar o reembolso." });
    }
});

module.exports = { refundsRouter };
