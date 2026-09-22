"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    CONJUNTOS_SIMULACAO,
    PERSONAS_ROTINA,
    anonimizarRevisaoCega,
    simularInteligenciaRotina,
} = require("../src/domain/routine-intelligence-simulation");

test("simulacao e reproduzivel e separa sementes e referencias", () => {
    const primeira = simularInteligenciaRotina({ conjunto: "desenvolvimento", semanas: 6 });
    const segunda = simularInteligenciaRotina({ conjunto: "desenvolvimento", semanas: 6 });
    assert.deepEqual(primeira, segunda);
    assert.notEqual(CONJUNTOS_SIMULACAO.desenvolvimento.semente, CONJUNTOS_SIMULACAO.validacao.semente);
    assert.notEqual(primeira.hash_catalogo, simularInteligenciaRotina({ conjunto: "validacao", semanas: 6 }).hash_catalogo);
});

test("todas as personas percorrem seis semanas e controle nao produz sinais", () => {
    const relatorio = simularInteligenciaRotina({ conjunto: "desenvolvimento", semanas: 6 });
    assert.equal(relatorio.personas.length, PERSONAS_ROTINA.length);
    assert.ok(relatorio.personas.every((item) => item.controle.decisoes === 30 && item.v1.decisoes === 30 && item.v2.decisoes === 30));
    assert.equal(relatorio.personas.find((item) => item.persona === "controle_sem_historico").sinais, 0);
    assert.equal(relatorio.violacoes_eliminatorias, 0);
});

test("pacote cego nao revela modelo, utilidade ou confianca", () => {
    const casos = anonimizarRevisaoCega(simularInteligenciaRotina({ conjunto: "validacao", semanas: 6 }));
    assert.ok(casos.length > 0);
    const texto = JSON.stringify(casos);
    assert.doesNotMatch(texto, /deterministico|intelligence|confianca|utilidade/i);
    assert.ok(casos.every((item) => item.escolha === null && item.motivo === null));
});

test("simulacao rejeita conjunto e periodo invalidos", () => {
    assert.throws(() => simularInteligenciaRotina({ conjunto: "desconhecido", semanas: 6 }), /invalido/);
    assert.throws(() => simularInteligenciaRotina({ conjunto: "desenvolvimento", semanas: 5 }), /entre 6 e 52/);
});
