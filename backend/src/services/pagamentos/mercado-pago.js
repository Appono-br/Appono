"use strict";

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const crypto = require("node:crypto");

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function obterAccessTokenMercadoPago() {
    const producaoPermitida = String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true";
    const tokenTeste = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim();
    const tokenPadrao = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ?? "";
    if (!producaoPermitida && tokenTeste) {
        return tokenTeste;
    }
    if (!producaoPermitida) {
        return /^TEST-/i.test(tokenPadrao) ? tokenPadrao : "";
    }
    return tokenPadrao;
}

function credenciaisTesteMercadoPagoValidas() {
    const tokenTeste = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim() ?? "";
    return Boolean(tokenTeste);
}

function criarClienteMercadoPago(accessToken = obterAccessTokenMercadoPago()) {
    if (!accessToken) {
        return null;
    }
    return new MercadoPagoConfig({ accessToken });
}

function criarPreferÃªnciaMercadoPago(accessToken) {
    const cliente = criarClienteMercadoPago(accessToken);
    return cliente ? new Preference(cliente) : null;
}

function criarPagamentoMercadoPago(accessToken) {
    const cliente = criarClienteMercadoPago(accessToken);
    return cliente ? new Payment(cliente) : null;
}

function mapearStatusMercadoPago(status) {
    const statusNormalizado = String(status ?? "").toLowerCase();
    if (["approved", "accredited"].includes(statusNormalizado)) {
        return { pagamento: "APROVADO", reserva: "CONFIRMADA" };
    }
    if (["pending", "in_process", "authorized"].includes(statusNormalizado)) {
        return { pagamento: "PENDENTE", reserva: null };
    }
    if (["refunded", "charged_back"].includes(statusNormalizado)) {
        return { pagamento: "ESTORNADO", reserva: "CANCELADA" };
    }
    if (["rejected", "cancelled", "canceled"].includes(statusNormalizado)) {
        return { pagamento: "RECUSADO", reserva: "CANCELADA" };
    }
    return { pagamento: "PENDENTE", reserva: null };
}

async function consultarPagamentoMercadoPago(paymentId, accessToken = obterAccessTokenMercadoPago()) {
    const token = accessToken?.trim?.() ?? "";
    if (!token || !paymentId) {
        return null;
    }
    const resposta = await fetch(`${MERCADO_PAGO_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!resposta.ok) {
        return null;
    }
    return resposta.json();
}

async function consultarPagamentoPorReferenciaMercadoPago(referencia, accessToken = obterAccessTokenMercadoPago()) {
    const token = accessToken?.trim?.() ?? "";
    if (!token || !referencia) {
        return null;
    }
    const url = new URL(`${MERCADO_PAGO_API}/v1/payments/search`);
    url.searchParams.set("external_reference", referencia);
    url.searchParams.set("sort", "date_created");
    url.searchParams.set("criteria", "desc");
    const resposta = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!resposta.ok) {
        return null;
    }
    const resultado = await resposta.json().catch(() => null);
    return resultado?.results?.[0] ?? null;
}

function pagamentoDaOrdemMercadoPago(ordem) {
    const pagamentos = Array.isArray(ordem?.payments) ? ordem.payments : [];
    const pagamento = pagamentos.find((item) => String(item.status ?? "").toLowerCase() === "approved") ?? pagamentos[0];
    if (!pagamento?.id) {
        return null;
    }
    return {
        id: pagamento.id,
        status: pagamento.status,
        status_detail: pagamento.status_detail,
        external_reference: ordem.external_reference,
        preference_id: ordem.preference_id,
        transaction_amount: pagamento.transaction_amount ?? pagamento.total_paid_amount ?? ordem.total_amount,
        date_approved: pagamento.date_approved,
        date_created: pagamento.date_created ?? ordem.date_created,
        live_mode: ordem.is_test === true ? false : undefined,
    };
}

async function consultarPagamentoPorOrdemMercadoPago(merchantOrderId, accessToken = obterAccessTokenMercadoPago()) {
    const token = accessToken?.trim?.() ?? "";
    if (!token || !merchantOrderId) {
        return null;
    }
    const resposta = await fetch(`${MERCADO_PAGO_API}/merchant_orders/${encodeURIComponent(merchantOrderId)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!resposta.ok) {
        return null;
    }
    const ordem = await resposta.json().catch(() => null);
    return pagamentoDaOrdemMercadoPago(ordem);
}

async function consultarPagamentoPorPreferÃªnciaMercadoPago(preferenceId, accessToken = obterAccessTokenMercadoPago()) {
    const token = accessToken?.trim?.() ?? "";
    if (!token || !preferenceId) {
        return null;
    }
    const url = new URL(`${MERCADO_PAGO_API}/merchant_orders/search`);
    url.searchParams.set("preference_id", preferenceId);
    const resposta = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!resposta.ok) {
        return null;
    }
    const resultado = await resposta.json().catch(() => null);
    const ordem = resultado?.elements?.[0];
    return pagamentoDaOrdemMercadoPago(ordem);
}
async function requisitarAssinaturaMercadoPago(path, { method = "GET", token = obterAccessTokenMercadoPago(), body } = {}) {
    const accessToken = String(token ?? "").trim();
    if (!accessToken) throw new Error("Credenciais do Mercado Pago nÃ£o estÃ£o configuradas.");
    const resposta = await fetch(`${MERCADO_PAGO_API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(body ? { "X-Idempotency-Key": `appono-${crypto.randomUUID()}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) throw new Error(dados?.message ?? "Mercado Pago nÃ£o conseguiu processar a assinatura.");
    return dados;
}

async function consultarContaMercadoPago(token = obterAccessTokenMercadoPago()) {
    return requisitarAssinaturaMercadoPago("/users/me", { token });
}

async function criarAssinaturaMercadoPago({ token, referencia, email, planoId, reason, amount, backUrl, notificationUrl }) {
    const body = {
        reason,
        external_reference: referencia,
        payer_email: email,
        back_url: backUrl,
        status: "pending",
        ...(planoId ? { preapproval_plan_id: planoId } : { auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: Number(amount), currency_id: "BRL" } }),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    };
    return requisitarAssinaturaMercadoPago("/preapproval", { method: "POST", token, body });
}

async function criarPlanoAssinaturaMercadoPago({ token, reason, amount, backUrl }) {
    return requisitarAssinaturaMercadoPago("/preapproval_plan", {
        method: "POST",
        token,
        body: {
            reason,
            auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: Number(amount), currency_id: "BRL" },
            back_url: backUrl,
        },
    });
}

async function buscarAssinaturasPlanoMercadoPago(planId, token = obterAccessTokenMercadoPago()) {
    if (!planId) return [];
    const query = new URLSearchParams({
        preapproval_plan_id: String(planId),
        sort: "date_created",
        criteria: "desc",
        limit: "50",
    });
    const resposta = await requisitarAssinaturaMercadoPago(`/preapproval/search?${query}`, { token });
    return Array.isArray(resposta?.results) ? resposta.results : [];
}

async function consultarAssinaturaMercadoPago(id, token = obterAccessTokenMercadoPago()) {
    if (!id) return null;
    return requisitarAssinaturaMercadoPago(`/preapproval/${encodeURIComponent(id)}`, { token });
}

async function atualizarAssinaturaMercadoPago(id, body, token = obterAccessTokenMercadoPago()) {
    return requisitarAssinaturaMercadoPago(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", token, body });
}

async function estornarPagamentoMercadoPago(paymentId, accessToken = obterAccessTokenMercadoPago(), amount = null) {
    const token = accessToken?.trim?.() ?? "";
    if (!token || !paymentId) throw new Error("Pagamento sem credenciais para estorno.");
    const valorParcial = amount !== null && amount !== undefined ? Number(amount) : null;
    const requestBody = valorParcial && Number.isFinite(valorParcial) && valorParcial > 0
        ? JSON.stringify({ amount: valorParcial })
        : undefined;
    const idempotencyAmount = valorParcial && Number.isFinite(valorParcial) && valorParcial > 0
        ? `-${Math.round(valorParcial * 100)}`
        : "";
    const resposta = await fetch(`${MERCADO_PAGO_API}/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": `appono-refund-${paymentId}${idempotencyAmount}` },
        body: requestBody,
    });
    const responseBody = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        const message = String(responseBody?.message ?? "");
        if (resposta.status === 401 && /live credentials/i.test(message)) {
            throw new Error("A credencial Mercado Pago atual consulta o pagamento, mas nÃ£o possui permissÃ£o para estornar pagamentos reais. Gere uma credencial de produÃ§Ã£o com escopo de pagamentos ou estorne esta venda pelo painel do Mercado Pago.");
        }
        throw new Error(message || "Mercado Pago recusou o estorno.");
    }
    return responseBody;
}

module.exports = {
    consultarPagamentoMercadoPago,
    consultarPagamentoPorOrdemMercadoPago,
    consultarPagamentoPorPreferÃªnciaMercadoPago,
    consultarPagamentoPorReferenciaMercadoPago,
    criarClienteMercadoPago,
    criarPagamentoMercadoPago,
    criarPreferÃªnciaMercadoPago,
    estornarPagamentoMercadoPago,
    mapearStatusMercadoPago,
    obterAccessTokenMercadoPago,
    credenciaisTesteMercadoPagoValidas,
    consultarContaMercadoPago,
    criarAssinaturaMercadoPago,
    criarPlanoAssinaturaMercadoPago,
    buscarAssinaturasPlanoMercadoPago,
    consultarAssinaturaMercadoPago,
    atualizarAssinaturaMercadoPago,
};

