"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { checkoutUrl } = require("../src/services/pagamentos/config");

test("checkout pro usa sandbox_init_point quando producao nao esta liberada", () => {
    const previous = process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "false";
    try {
        assert.equal(checkoutUrl({ init_point: "https://checkout", sandbox_init_point: "https://sandbox" }, "APP_USR-token"), "https://sandbox");
        assert.equal(checkoutUrl({ sandbox_init_point: "https://sandbox" }, "APP_USR-token"), "https://sandbox");
    } finally {
        if (previous === undefined) delete process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
        else process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = previous;
    }
});

test("checkout pro usa sandbox_init_point com token de teste mesmo se producao estiver liberada", () => {
    const previous = process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "true";
    try {
        assert.equal(checkoutUrl({ init_point: "https://checkout", sandbox_init_point: "https://sandbox" }, "TEST-token"), "https://sandbox");
    } finally {
        if (previous === undefined) delete process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
        else process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = previous;
    }
});
