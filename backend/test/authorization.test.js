"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { isRoleAllowed, ownsResource, resolveRole } = require("../src/domain/authorization");

test("resolve perfis sem ambiguidade", () => {
    assert.equal(resolveRole({ isAdmin: true, clientId: 1, restaurantId: null }), "admin");
    assert.equal(resolveRole({ clientId: 1 }), "cliente");
    assert.equal(resolveRole({ restaurantId: 2 }), "restaurante");
    assert.equal(resolveRole({}), null);
});
test("matriz de rotas bloqueia perfis diferentes", () => {
    assert.equal(isRoleAllowed("cliente", ["cliente"]), true);
    assert.equal(isRoleAllowed("restaurante", ["cliente"]), false);
    assert.equal(isRoleAllowed("admin", ["restaurante"]), false);
});
test("matriz de propriedade bloqueia recursos de terceiros", () => {
    assert.equal(ownsResource("cliente", 10, { id_cliente: 10 }), true);
    assert.equal(ownsResource("cliente", 10, { id_cliente: 11 }), false);
    assert.equal(ownsResource("restaurante", 20, { id_restaurante: 20 }), true);
    assert.equal(ownsResource("restaurante", 20, { id_restaurante: 21 }), false);
    assert.equal(ownsResource("admin", 0, { id_cliente: 99 }), true);
});
