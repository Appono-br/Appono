"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { agregarMetricasExperimento } = require("../src/domain/routine-experiment-metrics");

test("agrega modelos e resultados sem devolver identificadores individuais", () => {
    const resumo = agregarMetricasExperimento([
        { modelo_desafiante: "v2", divergiu: false, confianca_desafiante: 0, criado_em: "2026-09-21T10:00:00Z", aprovado_em: "2026-09-21T11:00:00Z", id_cliente: 99 },
        { modelo_desafiante: "v2", divergiu: true, confianca_desafiante: 0.4, criado_em: "2026-09-21T12:00:00Z", recusado_em: "2026-09-21T13:00:00Z", id_cliente: 100 },
    ]);
    assert.equal(resumo.comparacoes, 2);
    assert.equal(resumo.modelos[0].concordancias, 1);
    assert.equal(resumo.modelos[0].divergencias, 1);
    assert.equal(resumo.modelos[0].confianca_media, 0.2);
    assert.equal(JSON.stringify(resumo).includes("id_cliente"), false);
});

test("retorna estado vazio honesto", () => {
    assert.deepEqual(agregarMetricasExperimento([]), { comparacoes: 0, modelos: [], semanas: [] });
});
