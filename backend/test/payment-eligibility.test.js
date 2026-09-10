"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { lateApprovalDecision, paymentEligibility } = require("../src/domain/payment-eligibility");

const confirmada = { status_reserva: "CONFIRMADA", data_reserva: "2026-08-14", horario_inicio: "19:00:00" };

test("permite pagamento antes do horario de reserva confirmada", () => {
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-14T18:59:59-03:00")).allowed, true);
});

test("permite pagamento de reserva pendente vinculada a pedido antecipado", () => {
    assert.equal(paymentEligibility({ ...confirmada, status_reserva: "PENDENTE" }, new Date("2026-08-14T18:30:00-03:00")).allowed, true);
});

test("bloqueia pagamento no horario ou depois da reserva", () => {
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-14T19:00:00-03:00")).code, "RESERVA_VENCIDA");
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-15T10:00:00-03:00")).allowed, false);
});

test("bloqueia pagamento de reserva cancelada ou sem horario", () => {
    assert.equal(paymentEligibility({ ...confirmada, status_reserva: "CANCELADA" }).code, "RESERVA_INATIVA");
    assert.equal(paymentEligibility({ status_reserva: "CONFIRMADA" }).code, "HORARIO_INVALIDO");
});

test("mantem pagamento feito no prazo mesmo quando webhook chega depois", () => {
    const decision = lateApprovalDecision({
        gatewayStatus: "APROVADO",
        existingStatus: "PENDENTE",
        reservation: { ...confirmada, status_reserva: "CONCLUIDA" },
        payment: { date_approved: "2026-08-14T18:50:00-03:00" },
    });
    assert.equal(decision.finalStatus, "APROVADO");
    assert.equal(decision.shouldRefund, false);
});

test("estorna pagamento efetivamente aprovado depois do prazo", () => {
    const decision = lateApprovalDecision({
        gatewayStatus: "APROVADO",
        existingStatus: "PENDENTE",
        reservation: confirmada,
        payment: { date_approved: "2026-08-14T19:00:01-03:00" },
    });
    assert.equal(decision.finalStatus, "ESTORNADO");
    assert.equal(decision.shouldRefund, true);
    assert.equal(decision.reason, "APROVACAO_FORA_DO_PRAZO");
});

test("usa date_created como fallback e rejeita pagamento sem data valida", () => {
    const fallback = lateApprovalDecision({
        gatewayStatus: "APROVADO",
        existingStatus: "PENDENTE",
        reservation: confirmada,
        payment: { date_created: "2026-08-14T18:30:00-03:00" },
    });
    assert.equal(fallback.paymentDateSource, "date_created");
    assert.throws(() => lateApprovalDecision({ gatewayStatus: "APROVADO", existingStatus: "PENDENTE", reservation: confirmada, payment: {} }), { code: "DATA_APROVACAO_AUSENTE" });
});

test("webhook repetido nao solicita um segundo estorno", () => {
    const decision = lateApprovalDecision({
        gatewayStatus: "APROVADO",
        existingStatus: "ESTORNADO",
        reservation: confirmada,
        payment: { date_approved: "2026-08-14T20:00:00-03:00" },
    });
    assert.deepEqual(decision, { finalStatus: "ESTORNADO", shouldRefund: false, reason: "JA_ESTORNADO" });
});
