"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { tokenHash, validarGrupo } = require("../src/routes/routine-groups");

test("convite de grupo guarda apenas hash e valida janela aproximada", () => {
    const token = "A".repeat(43);
    assert.match(tokenHash(token), /^[a-f0-9]{64}$/);
    const inicio = new Date(Date.now() + 7 * 86_400_000);
    const fim = new Date(inicio.getTime() + 60 * 60_000);
    const expira = new Date(Date.now() + 24 * 60 * 60_000);
    const dados = validarGrupo({ nome: "Almoço", inicio_em: inicio.toISOString(), fim_em: fim.toISOString(), latitude_aproximada: -23.5, longitude_aproximada: -46.6, orcamento_por_pessoa: 40, quantidade_maxima: 4, expira_em: expira.toISOString() });
    assert.equal(dados.capacidade, 4);
    assert.throws(() => validarGrupo({ ...dados, latitude_aproximada: -23.5, longitude_aproximada: null }), /coordenadas/);
});
