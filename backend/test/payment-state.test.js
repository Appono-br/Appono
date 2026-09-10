"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateSplit, nextTransferStatus, strongestPaymentStatus } = require("../src/domain/payment-state");

test("calcula comissao e repasse sem perder centavos", () => {
    assert.deepEqual(calculateSplit(99.99, 13), { gross: 99.99, fee: 13, restaurant: 86.99 });
});
test("evento atrasado nao regride pagamento aprovado", () => {
    assert.equal(strongestPaymentStatus("APROVADO", "PENDENTE"), "APROVADO");
    assert.equal(strongestPaymentStatus("APROVADO", "RECUSADO"), "APROVADO");
});
test("estorno prevalece mesmo depois da aprovacao", () => {
    assert.equal(strongestPaymentStatus("APROVADO", "ESTORNADO"), "ESTORNADO");
    assert.equal(nextTransferStatus("REPASSADO", "ESTORNADO", "MARKETPLACE_RESTAURANTE"), "ESTORNADO");
});
test("fluxo direto nao cria repasse interno", () => {
    assert.equal(nextTransferStatus(null, "APROVADO", "DIRETO_APPONO"), "NAO_APLICAVEL");
});
