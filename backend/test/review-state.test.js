"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { orderReviewEligibility } = require("../src/domain/review-state");

test("avaliacao e liberada somente depois da entrega", () => {
    assert.equal(orderReviewEligibility(null).code, "PEDIDO_NAO_ENCONTRADO");
    assert.equal(orderReviewEligibility({ status_pedido: "CONFIRMADO" }).code, "PEDIDO_NAO_ENTREGUE");
    assert.equal(orderReviewEligibility({ status_pedido: "ENTREGUE" }).allowed, true);
});
