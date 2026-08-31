"use strict";

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function obterAccessTokenMercadoPago() {
    const producaoPermitida = String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true";
    const tokenTeste = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN?.trim();
    if (!producaoPermitida && tokenTeste) {
        return tokenTeste;
    }
    return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ?? "";
}

function criarClienteMercadoPago(accessToken = obterAccessTokenMercadoPago()) {
    if (!accessToken) {
        return null;
    }
    return new MercadoPagoConfig({ accessToken });
}

function criarPreferenciaMercadoPago(accessToken) {
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

async function consultarPagamentoPorPreferenciaMercadoPago(preferenceId, accessToken = obterAccessTokenMercadoPago()) {
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
            throw new Error("A credencial Mercado Pago atual consulta o pagamento, mas nao possui permissao para estornar pagamentos reais. Gere uma credencial de producao com escopo de pagamentos ou estorne esta venda pelo painel do Mercado Pago.");
        }
        throw new Error(message || "Mercado Pago recusou o estorno.");
    }
    return responseBody;
}

module.exports = {
    consultarPagamentoMercadoPago,
    consultarPagamentoPorOrdemMercadoPago,
    consultarPagamentoPorPreferenciaMercadoPago,
    consultarPagamentoPorReferenciaMercadoPago,
    criarClienteMercadoPago,
    criarPagamentoMercadoPago,
    criarPreferenciaMercadoPago,
    estornarPagamentoMercadoPago,
    mapearStatusMercadoPago,
    obterAccessTokenMercadoPago,
};
