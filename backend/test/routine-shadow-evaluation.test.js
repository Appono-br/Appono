"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { compararRankingSombra, ordenarPorPontuacao } = require("../src/domain/routine-shadow-evaluation");

function candidate(idRestaurant, idProduct, control, challenger, distance = 1) {
    return {
        restaurante: { id_restaurante: idRestaurant, nome: `Restaurante ${idRestaurant}` },
        produto: { id_produto: idProduct, nome: `Produto ${idProduct}` },
        pontuacaoControle: control,
        pontuacaoDesafiante: challenger,
        distancia_km: distance,
        preco_estimado: 40,
        inteligencia: { confianca: 0.67, amostras: 4 },
    };
}

test("modo sombra mantém vencedor do controle mesmo quando a IA discorda", () => {
    const candidatos = [candidate(1, 10, 70, 65), candidate(2, 20, 68, 78)];
    const controle = ordenarPorPontuacao(candidatos, "pontuacaoControle")[0];
    const desafiante = ordenarPorPontuacao(candidatos, "pontuacaoDesafiante")[0];
    const comparacao = compararRankingSombra(controle, desafiante, {
        controle: "deterministico-v3",
        desafiante: "appono-intelligence-v1",
    });
    assert.equal(controle.restaurante.id_restaurante, 1);
    assert.equal(desafiante.restaurante.id_restaurante, 2);
    assert.equal(comparacao.divergiu, true);
    assert.equal(comparacao.id_restaurante_controle, 1);
    assert.equal(comparacao.id_restaurante_desafiante, 2);
    assert.equal(comparacao.confianca_desafiante, 0.67);
    assert.equal(comparacao.amostras_desafiante, 4);
});

test("comparação marca concordância quando restaurante e produto coincidem", () => {
    const candidato = candidate(1, 10, 70, 74);
    const comparacao = compararRankingSombra(candidato, candidato, {
        controle: "deterministico-v3",
        desafiante: "appono-intelligence-v1",
    });
    assert.equal(comparacao.divergiu, false);
    assert.equal(comparacao.pontuacao_controle, 70);
    assert.equal(comparacao.pontuacao_desafiante, 74);
});

test("desempate permanece estável por distância, preço e nome", () => {
    const candidatos = [candidate(2, 20, 50, 50, 2), candidate(1, 10, 50, 50, 1)];
    assert.equal(ordenarPorPontuacao(candidatos, "pontuacaoControle")[0].restaurante.id_restaurante, 1);
});

test("comparacao aceita campos isolados da V2", () => {
    const controle = candidate(1, 10, 70, 70);
    const desafiante = {
        ...candidate(2, 20, 68, 68),
        pontuacaoDesafianteV2: 76,
        inteligenciaV2: { confianca: 0.22, amostras: 3 },
    };
    const comparacao = compararRankingSombra(controle, desafiante, {
        controle: "deterministico-v3",
        desafiante: "appono-intelligence-v2",
    }, {
        pontuacao: "pontuacaoDesafianteV2",
        inteligencia: "inteligenciaV2",
    });
    assert.equal(comparacao.modelo_desafiante, "appono-intelligence-v2");
    assert.equal(comparacao.pontuacao_desafiante, 76);
    assert.equal(comparacao.confianca_desafiante, 0.22);
    assert.equal(comparacao.amostras_desafiante, 3);
    assert.deepEqual(comparacao.metadados_desafiante, {
        modelo: "appono-intelligence-v2",
        ajuste: 0,
        contribuicoes: {},
    });
});
