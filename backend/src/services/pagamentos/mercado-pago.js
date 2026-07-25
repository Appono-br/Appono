"use strict";

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function obterAccessTokenMercadoPago() {
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
    if (["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(statusNormalizado)) {
        return { pagamento: "RECUSADO", reserva: "CANCELADA" };
    }
    return { pagamento: "PENDENTE", reserva: null };
}

async function consultarPagamentoMercadoPago(paymentId) {
    const token = obterAccessTokenMercadoPago();
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

async function consultarPagamentoPorReferenciaMercadoPago(referencia) {
    const token = obterAccessTokenMercadoPago();
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

module.exports = {
    consultarPagamentoMercadoPago,
    consultarPagamentoPorReferenciaMercadoPago,
    criarClienteMercadoPago,
    criarPagamentoMercadoPago,
    criarPreferenciaMercadoPago,
    mapearStatusMercadoPago,
    obterAccessTokenMercadoPago,
};
