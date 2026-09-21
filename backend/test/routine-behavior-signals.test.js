"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { chaveSinal, normalizarSinalComportamental } = require("../src/domain/routine-behavior-signals");

const refeicao = {
    id_refeicao_planejada: 10,
    id_restaurante: 20,
    id_produto: 30,
    id_janela_alimentacao: 40,
};

test("sinal comportamental e deterministico e idempotente", () => {
    const a = chaveSinal({ tipoEvento: "APROVACAO", idRefeicao: 10, atributos: { b: 2, a: 1 } });
    const b = chaveSinal({ tipoEvento: "APROVACAO", idRefeicao: 10, atributos: { a: 1, b: 2 } });
    assert.equal(a, b);
    assert.match(a, /^rotina:APROVACAO:10:/);
});

test("normalizacao preserva apenas o contrato interno esperado", () => {
    const sinal = normalizarSinalComportamental({
        tipoEvento: "edicao",
        refeicao,
        atributos: { produto_alterado: true },
        ocorreuEm: "2026-09-21T12:00:00Z",
    });
    assert.equal(sinal.tipo_evento, "EDICAO");
    assert.equal(sinal.id_produto, 30);
    assert.deepEqual(sinal.atributos_escolhidos, { produto_alterado: true });
    assert.equal(sinal.ocorreu_em, "2026-09-21T12:00:00.000Z");
});

test("normalizacao rejeita evento desconhecido", () => {
    assert.throws(() => normalizarSinalComportamental({ tipoEvento: "CLIQUE", refeicao }), /invalido/);
});
