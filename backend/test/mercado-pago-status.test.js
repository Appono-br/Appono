"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { mapearStatusMercadoPago } = require("../src/services/pagamentos/mercado-pago");
test("mapeia estados do gateway incluindo chargeback", () => {
    assert.equal(mapearStatusMercadoPago("pending").pagamento, "PENDENTE");
    assert.equal(mapearStatusMercadoPago("approved").pagamento, "APROVADO");
    assert.equal(mapearStatusMercadoPago("rejected").pagamento, "RECUSADO");
    assert.equal(mapearStatusMercadoPago("refunded").pagamento, "ESTORNADO");
    assert.equal(mapearStatusMercadoPago("charged_back").pagamento, "ESTORNADO");
});
