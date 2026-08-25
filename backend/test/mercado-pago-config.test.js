"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { checkoutUrl } = require("../src/services/pagamentos/config");

test("producao desabilitada nunca entrega init_point real", () => {
    const previous = process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "false";
    try {
        assert.equal(checkoutUrl({ init_point: "https://real", sandbox_init_point: "https://sandbox" }, "APP_USR-token"), "https://sandbox");
        assert.equal(checkoutUrl({ init_point: "https://real" }, "APP_USR-token"), null);
    } finally {
        if (previous === undefined) delete process.env.MERCADO_PAGO_PERMITIR_PRODUCAO;
        else process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = previous;
    }
});
