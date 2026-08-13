"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitize } = require("../src/middleware/observability");
test("remove segredos e dados de cartao de logs", () => {
    const result = sanitize({ authorization: "Bearer x", cardNumber: "4111", nested: { cvv: "123", ok: "value" } });
    assert.deepEqual(result, { authorization: "[REDACTED]", cardNumber: "[REDACTED]", nested: { cvv: "[REDACTED]", ok: "value" } });
});
