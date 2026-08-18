"use strict";
const { supabaseAdmin } = require("../../lib/supabase");
const { isRealMarketplace } = require("./config");
const { productionAllowed } = require("./config");
const { consultarPagamentoMercadoPago, estornarPagamentoMercadoPago, obterAccessTokenMercadoPago } = require("./mercado-pago");
const { testGatewayRefundEligibility } = require("../../domain/refund-state");

async function paymentTokenForRestaurant(restaurantId) {
    if (!isRealMarketplace()) return obterAccessTokenMercadoPago();
    if (!supabaseAdmin) throw new Error("Supabase administrativo indisponivel para localizar a conta Mercado Pago.");
    const { data, error } = await supabaseAdmin.from("mercado_pago_conexoes_restaurante")
        .select("access_token").eq("id_restaurante", restaurantId).eq("status", "CONECTADO").maybeSingle();
    if (error || !data?.access_token) throw new Error(error?.message ?? "Conta Mercado Pago do restaurante nao encontrada.");
    return data.access_token;
}

function shouldRefundViaGateway(payment) {
    if (String(payment?.tipo_fluxo_pagamento ?? "").toUpperCase() === "SIMULADO_APPONO") return false;
    return isRealMarketplace();
}

async function refundApprovedPayments(payments, restaurantId) {
    const approved = (payments ?? []).filter((payment) => payment.status_pagamento === "APROVADO");
    if (!approved.length) return [];
    const needsGateway = approved.some((payment) => shouldRefundViaGateway(payment));
    const token = needsGateway ? await paymentTokenForRestaurant(restaurantId) : null;
    const refunds = [];
    for (const payment of approved) {
        if (!shouldRefundViaGateway(payment)) {
            refunds.push({ payment, gatewayRefund: null, alreadyRefunded: false, simulated: true });
            continue;
        }
        if (!payment.mercado_pago_payment_id) throw new Error(`Pagamento ${payment.id_pagamento} sem identificador para estorno.`);
        const gatewayPayment = await consultarPagamentoMercadoPago(payment.mercado_pago_payment_id, token);
        const gatewayEligibility = testGatewayRefundEligibility(gatewayPayment, productionAllowed());
        if (!gatewayEligibility.allowed && gatewayEligibility.code === "PAGAMENTO_REAL_BLOQUEADO") {
            throw new Error(`Pagamento ${payment.id_pagamento} e real e nao pode ser estornado pelo fluxo de testes.`);
        }
        if (!gatewayEligibility.allowed) throw new Error(`Pagamento ${payment.id_pagamento} nao foi confirmado pelo Mercado Pago.`);
        if (["refunded", "charged_back"].includes(String(gatewayPayment?.status ?? "").toLowerCase())) {
            refunds.push({ payment, gatewayRefund: null, alreadyRefunded: true });
            continue;
        }
        refunds.push({ payment, gatewayRefund: await estornarPagamentoMercadoPago(payment.mercado_pago_payment_id, token), alreadyRefunded: false });
    }
    return refunds;
}

module.exports = { paymentTokenForRestaurant, refundApprovedPayments, shouldRefundViaGateway };
