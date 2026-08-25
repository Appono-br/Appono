"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldRefundViaGateway } = require("../src/services/pagamentos/refund");

test("reembolso simulado nao chama gateway do Mercado Pago", () => {
    process.env.MERCADO_PAGO_MODO_REPASSE = "MARKETPLACE_REAL";
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "true";

    assert.equal(shouldRefundViaGateway({ tipo_fluxo_pagamento: "SIMULADO_APPONO" }), false);
});

test("gateway de reembolso so e usado com marketplace real ativo", () => {
    process.env.MERCADO_PAGO_MODO_REPASSE = "SIMULADO";
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "false";
    assert.equal(shouldRefundViaGateway({ tipo_fluxo_pagamento: "MARKETPLACE_RESTAURANTE" }), false);

    process.env.MERCADO_PAGO_MODO_REPASSE = "MARKETPLACE_REAL";
    process.env.MERCADO_PAGO_PERMITIR_PRODUCAO = "true";
    assert.equal(shouldRefundViaGateway({ tipo_fluxo_pagamento: "MARKETPLACE_RESTAURANTE" }), true);
});
