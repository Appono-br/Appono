"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { intervalsOverlap, isReservationInputValid, isReservationNoShow, restaurantCancellationEligibility } = require("../src/domain/reservation-time");
test("detecta conflito e permite horarios adjacentes", () => {
    assert.equal(intervalsOverlap("19:00", "20:00", "19:30", "20:30"), true);
    assert.equal(intervalsOverlap("19:00", "20:00", "20:00", "21:00"), false);
});
test("marca nao comparecimento somente depois do fim sem check-in", () => {
    const reserva = { status_reserva: "CONFIRMADA", data_reserva: "2026-08-14", horario_fim: "20:00:00" };
    assert.equal(isReservationNoShow(reserva, new Date("2026-08-14T19:59:59-03:00")), false);
    assert.equal(isReservationNoShow(reserva, new Date("2026-08-14T20:00:00-03:00")), true);
    assert.equal(isReservationNoShow({ ...reserva, status_reserva: "CHECK_IN" }, new Date("2026-08-14T21:00:00-03:00")), false);
});
test("restaurante cancela antes do inicio, mas nao durante preparo ou depois do horario", () => {
    const reserva = { status_reserva: "CONFIRMADA", data_reserva: "2026-08-22", horario_inicio: "20:00:00" };
    assert.equal(restaurantCancellationEligibility(reserva, ["CONFIRMADO"], new Date("2026-08-22T19:00:00-03:00")).allowed, true);
    assert.equal(restaurantCancellationEligibility(reserva, ["EM_PREPARO"], new Date("2026-08-22T19:00:00-03:00")).reason, "PEDIDO_EM_ANDAMENTO");
    assert.equal(restaurantCancellationEligibility(reserva, [], new Date("2026-08-22T20:00:00-03:00")).reason, "RESERVA_INICIADA");
});
test("valida data, intervalo e quantidade de pessoas", () => {
    assert.equal(isReservationInputValid({ date: "2026-08-14", start: "19:00", end: "20:00", people: 2 }, "2026-08-13"), true);
    assert.equal(isReservationInputValid({ date: "2026-08-12", start: "19:00", end: "20:00", people: 2 }, "2026-08-13"), false);
});
