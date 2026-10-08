"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { reservationCheckoutTotals } = require("../src/domain/reservation-price");

test("reservation price is fixed for one or many guests", () => {
    for (const quantidade_pessoas of [1, 2, 8, 30]) {
        assert.deepEqual(reservationCheckoutTotals({ reservation: {
            status_reserva: "PENDENTE", valor_minimo_total: 25, quantidade_pessoas,
        } }), { valor_itens: 0, preco_reserva: 25, valor_total_checkout: 25 });
    }
});

test("any advance-order items exempt the reservation price", () => {
    assert.deepEqual(reservationCheckoutTotals({ orderTotal: 5, reservation: {
        status_reserva: "PENDENTE", valor_minimo_total: 25,
    } }), { valor_itens: 5, preco_reserva: 0, valor_total_checkout: 5 });
});

test("a confirmed reservation is not charged again with a later order", () => {
    assert.deepEqual(reservationCheckoutTotals({ orderTotal: 5, reservation: {
        status_reserva: "CONFIRMADA", valor_minimo_total: 25,
    } }), { valor_itens: 5, preco_reserva: 0, valor_total_checkout: 5 });
});

test("invalid amounts cannot reach checkout", () => {
    for (const valor_minimo_total of [-1, Infinity, "invalid"]) {
        assert.throws(() => reservationCheckoutTotals({ reservation: {
            status_reserva: "PENDENTE", valor_minimo_total,
        } }));
    }
});
