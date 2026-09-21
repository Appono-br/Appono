"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    MODELO_INTELIGENCIA_ROTINA_V2,
    pontuarInteligenciaRotinaV2,
} = require("../src/domain/routine-intelligence-v2");

const REFERENCIA = new Date("2026-09-20T12:00:00Z");

function candidato(overrides = {}) {
    return {
        restaurante: { id_restaurante: 1, nome: "Cafe Estacao" },
        produto: { id_produto: 10, nome: "Tapioca caprese", categorias: { nome: "Lanches" } },
        preco_estimado: 38,
        distancia_km: 1.5,
        ...overrides,
    };
}

function sinal(overrides = {}) {
    return {
        id_sinal: 1,
        tipo_evento: "FEEDBACK_POSITIVO",
        consentiu_personalizacao: true,
        criado_em: "2026-09-19T12:00:00Z",
        id_restaurante: 1,
        id_produto: 10,
        categoria: "Lanches",
        preco_estimado: 38,
        distancia_km: 1.5,
        tipo_janela: "ALMOCO",
        ...overrides,
    };
}

function pontuar(sinais = [], overrides = {}) {
    return pontuarInteligenciaRotinaV2({
        candidato: candidato(),
        sinais,
        tipoJanela: "ALMOCO",
        referencia: REFERENCIA,
        ...overrides,
    });
}

test("V2 sem historico mantem ajuste e confianca em zero", () => {
    const resultado = pontuar();
    assert.equal(resultado.modelo, MODELO_INTELIGENCIA_ROTINA_V2.versao);
    assert.equal(resultado.ajuste, 0);
    assert.equal(resultado.confianca, 0);
    assert.equal(resultado.amostras, 0);
});

test("V2 e deterministica e ignora sinais sem consentimento", () => {
    const entrada = [sinal({ consentiu_personalizacao: false })];
    assert.deepEqual(pontuar(entrada), pontuar(entrada));
    assert.deepEqual(pontuar(entrada), pontuar());
});

test("V2 ignora sinal sem instante valido", () => {
    assert.deepEqual(pontuar([sinal({ criado_em: "data-invalida" })]), pontuar());
});

test("feedback positivo aumenta e negativo reduz afinidade", () => {
    const positivo = pontuar([sinal()]);
    const negativo = pontuar([sinal({ tipo_evento: "FEEDBACK_NEGATIVO" })]);
    assert.ok(positivo.ajuste > 0);
    assert.ok(negativo.ajuste < 0);
});

test("conversao pesa mais que aprovacao", () => {
    const aprovacao = pontuar([sinal({ tipo_evento: "APROVACAO" })]);
    const conversao = pontuar([sinal({ tipo_evento: "CONVERSAO_PEDIDO" })]);
    assert.ok(conversao.ajuste > aprovacao.ajuste);
});

test("decaimento temporal reduz a influencia de sinais antigos", () => {
    const recente = pontuar([sinal()]);
    const antigo = pontuar([sinal({ criado_em: "2025-09-20T12:00:00Z" })]);
    assert.ok(recente.ajuste > antigo.ajuste);
    assert.ok(recente.confianca > antigo.confianca);
});

test("sinais contraditorios reduzem a confianca", () => {
    const coerente = pontuar([sinal({ id_sinal: 1 }), sinal({ id_sinal: 2 })]);
    const contraditorio = pontuar([
        sinal({ id_sinal: 1 }),
        sinal({ id_sinal: 2, tipo_evento: "FEEDBACK_NEGATIVO" }),
    ]);
    assert.ok(coerente.confianca > contraditorio.confianca);
});

test("confianca cresce gradualmente com uma, tres e sete amostras coerentes", () => {
    const confiancas = [1, 3, 7].map((quantidade) => pontuar(
        Array.from({ length: quantidade }, (_, indice) => sinal({ id_sinal: indice + 1 })),
    ).confianca);
    assert.ok(confiancas[0] > 0 && confiancas[0] < 0.25);
    assert.ok(confiancas[1] > confiancas[0]);
    assert.ok(confiancas[2] > confiancas[1]);
});

test("preco e distancia nao geram bonus estatico sem historico", () => {
    const baratoPerto = pontuar([], { candidato: candidato({ preco_estimado: 10, distancia_km: 0.2 }) });
    const caroLonge = pontuar([], { candidato: candidato({ preco_estimado: 100, distancia_km: 20 }) });
    assert.equal(baratoPerto.ajuste, 0);
    assert.equal(caroLonge.ajuste, 0);
    assert.equal(baratoPerto.confianca, 0);
    assert.equal(caroLonge.confianca, 0);
});

test("repeticao consecutiva impede colapso no mesmo prato", () => {
    const semRepeticao = pontuar([sinal()]);
    const repetido = pontuar([sinal()], {
        sequencia: { id_restaurante_anterior: 1, id_produto_anterior: 10 },
    });
    assert.ok(repetido.ajuste < semRepeticao.ajuste);
    assert.equal(repetido.contribuicoes.repeticao_consecutiva, -4);
});

test("ajuste e confianca respeitam os limites globais", () => {
    const muitos = Array.from({ length: 100 }, (_, indice) => sinal({ id_sinal: indice + 1 }));
    const resultado = pontuar(muitos);
    assert.ok(resultado.ajuste <= MODELO_INTELIGENCIA_ROTINA_V2.limite_ajuste);
    assert.ok(resultado.ajuste >= -MODELO_INTELIGENCIA_ROTINA_V2.limite_ajuste);
    assert.ok(resultado.confianca <= MODELO_INTELIGENCIA_ROTINA_V2.limite_confianca);
    assert.equal(resultado.amostras, 100);
});
