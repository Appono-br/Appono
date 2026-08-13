"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { paymentEligibility } = require("../src/domain/payment-eligibility");

const confirmada = { status_reserva: "CONFIRMADA", data_reserva: "2026-08-14", horario_inicio: "19:00:00" };

test("permite pagamento antes do horario de reserva confirmada", () => {
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-14T18:59:59-03:00")).allowed, true);
});

test("bloqueia pagamento no horario ou depois da reserva", () => {
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-14T19:00:00-03:00")).code, "RESERVA_VENCIDA");
    assert.equal(paymentEligibility(confirmada, new Date("2026-08-15T10:00:00-03:00")).allowed, false);
});

test("bloqueia pagamento de reserva cancelada ou sem horario", () => {
    assert.equal(paymentEligibility({ ...confirmada, status_reserva: "CANCELADA" }).code, "RESERVA_INATIVA");
    assert.equal(paymentEligibility({ status_reserva: "CONFIRMADA" }).code, "HORARIO_INVALIDO");
});
