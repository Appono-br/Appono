"use strict";

const ACTIVE_REFUND_STATUSES = new Set(["SOLICITADO", "EM_ANALISE", "APROVADO"]);
const FINAL_REFUND_STATUSES = new Set(["RECUSADO", "CONCLUIDO", "CANCELADO"]);

function normalizeRefundReason(reason) {
    return String(reason ?? "").trim().replace(/\s+/g, " ").slice(0, 500);
}

function refundRequestEligibility({ payment, existingRefund }) {
    if (!payment) return { allowed: false, code: "PAGAMENTO_NAO_ENCONTRADO" };
    if (payment.status_pagamento !== "APROVADO") return { allowed: false, code: "PAGAMENTO_NAO_APROVADO" };
    if (payment.status_repasse === "ESTORNADO" || payment.status_pagamento === "ESTORNADO") {
        return { allowed: false, code: "PAGAMENTO_JA_ESTORNADO" };
    }
    if (existingRefund && ACTIVE_REFUND_STATUSES.has(existingRefund.status_reembolso)) {
        return { allowed: false, code: "REEMBOLSO_EM_ANDAMENTO" };
    }
    if (existingRefund?.status_reembolso === "CONCLUIDO") {
        return { allowed: false, code: "REEMBOLSO_JA_CONCLUIDO" };
    }
    return { allowed: true, code: "ELEGIVEL" };
}

function refundReviewEligibility(refundRequest) {
    return {
        allowed: refundRequest?.status_reembolso === "SOLICITADO",
        code: refundRequest?.status_reembolso === "SOLICITADO" ? "ELEGIVEL" : "STATUS_INVALIDO",
    };
}

function testGatewayRefundEligibility(gatewayPayment, productionIsAllowed = false) {
    if (!gatewayPayment?.status) return { allowed: false, code: "PAGAMENTO_GATEWAY_INVALIDO" };
    if (gatewayPayment.live_mode === true && !productionIsAllowed) return { allowed: false, code: "PAGAMENTO_REAL_BLOQUEADO" };
    return { allowed: true, code: "ELEGIVEL" };
}

module.exports = {
    ACTIVE_REFUND_STATUSES,
    FINAL_REFUND_STATUSES,
    normalizeRefundReason,
    refundRequestEligibility,
    refundReviewEligibility,
    testGatewayRefundEligibility,
};
