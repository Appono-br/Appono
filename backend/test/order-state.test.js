"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransitionOrder } = require("../src/domain/order-state");
test("permite o fluxo normal do pedido", () => {
    assert.equal(canTransitionOrder("PENDENTE", "CONFIRMADO"), true);
    assert.equal(canTransitionOrder("CONFIRMADO", "EM_PREPARO"), true);
    assert.equal(canTransitionOrder("EM_PREPARO", "PRONTO"), true);
    assert.equal(canTransitionOrder("PRONTO", "ENTREGUE"), true);
});
test("bloqueia saltos, reabertura e cancelamento apos preparo", () => {
    assert.equal(canTransitionOrder("PENDENTE", "ENTREGUE"), false);
    assert.equal(canTransitionOrder("EM_PREPARO", "CANCELADO"), false);
    assert.equal(canTransitionOrder("ENTREGUE", "CONFIRMADO"), false);
});
