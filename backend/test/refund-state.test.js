"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeRefundReason, refundRequestEligibility, refundReviewEligibility, testGatewayRefundEligibility } = require("../src/domain/refund-state");

test("reembolso exige pagamento aprovado e ainda nao estornado", () => {
    assert.equal(refundRequestEligibility({ payment: null }).code, "PAGAMENTO_NAO_ENCONTRADO");
    assert.equal(refundRequestEligibility({ payment: { status_pagamento: "PENDENTE" } }).code, "PAGAMENTO_NAO_APROVADO");
    assert.equal(refundRequestEligibility({ payment: { status_pagamento: "APROVADO", status_repasse: "ESTORNADO" } }).code, "PAGAMENTO_JA_ESTORNADO");
    assert.equal(refundRequestEligibility({ payment: { status_pagamento: "APROVADO", status_repasse: "AGUARDANDO_ENTREGA" } }).allowed, true);
});

test("reembolso ativo ou concluido impede solicitacao duplicada", () => {
    const payment = { status_pagamento: "APROVADO", status_repasse: "AGUARDANDO_ENTREGA" };
    assert.equal(refundRequestEligibility({ payment, existingRefund: { status_reembolso: "SOLICITADO" } }).code, "REEMBOLSO_EM_ANDAMENTO");
    assert.equal(refundRequestEligibility({ payment, existingRefund: { status_reembolso: "CONCLUIDO" } }).code, "REEMBOLSO_JA_CONCLUIDO");
});

test("somente solicitacao aberta pode ser analisada", () => {
    assert.equal(refundReviewEligibility({ status_reembolso: "SOLICITADO" }).allowed, true);
    assert.equal(refundReviewEligibility({ status_reembolso: "RECUSADO" }).allowed, false);
});

test("motivo e normalizado e limitado", () => {
    assert.equal(normalizeRefundReason("  pedido   incorreto  "), "pedido incorreto");
    assert.equal(normalizeRefundReason("x".repeat(700)).length, 500);
});

test("fluxo de teste bloqueia pagamento real antes do estorno", () => {
    assert.equal(testGatewayRefundEligibility({ status: "approved", live_mode: false }).allowed, true);
    assert.equal(testGatewayRefundEligibility({ status: "approved", live_mode: true }).code, "PAGAMENTO_REAL_BLOQUEADO");
    assert.equal(testGatewayRefundEligibility({ status: "approved", live_mode: true }, true).allowed, true);
});
