"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { criarRateLimiter } = require("../src/middleware/rate-limit");

function resposta() {
    return {
        headers: {}, statusCode: null, body: null, locals: {},
        set(chave, valor) { this.headers[chave] = valor; },
        status(codigo) { this.statusCode = codigo; return this; },
        json(body) { this.body = body; return this; },
    };
}

test("rate limiter bloqueia a tentativa acima do limite e libera após a janela", () => {
    let tempo = 1_000;
    const limitar = criarRateLimiter({ janelaMs: 1_000, limite: 2, agora: () => tempo });
    const req = { ip: "127.0.0.1" };
    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
        const res = resposta(); let continuou = false;
        limitar(req, res, () => { continuou = true; });
        assert.equal(continuou, true);
    }
    const bloqueada = resposta();
    limitar(req, bloqueada, () => assert.fail("não deveria continuar"));
    assert.equal(bloqueada.statusCode, 429);
    assert.equal(bloqueada.body.code, "RATE_LIMITED");
    tempo += 1_000;
    const liberada = resposta(); let continuou = false;
    limitar(req, liberada, () => { continuou = true; });
    assert.equal(continuou, true);
});
