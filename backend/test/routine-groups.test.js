"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { tokenHash, validarGrupo } = require("../src/routes/routine-groups");

test("convite de grupo guarda apenas hash e valida janela aproximada", () => {
    const token = "A".repeat(43);
    assert.match(tokenHash(token), /^[a-f0-9]{64}$/);
    const dados = validarGrupo({ nome: "Almoço", inicio_em: "2026-09-20T15:00:00.000Z", fim_em: "2026-09-20T16:00:00.000Z", latitude_aproximada: -23.5, longitude_aproximada: -46.6, orcamento_por_pessoa: 40, quantidade_maxima: 4, expira_em: "2026-09-18T15:00:00.000Z" });
    assert.equal(dados.capacidade, 4);
    assert.throws(() => validarGrupo({ ...dados, latitude_aproximada: -23.5, longitude_aproximada: null }), /coordenadas/);
});
