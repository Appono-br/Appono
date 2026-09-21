"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { MODELO_INTELIGENCIA_ROTINA, pontuarInteligenciaRotina } = require("../src/domain/routine-intelligence");

function candidato({ categoria = "Massas", preco = 40, distancia = 2 } = {}) {
    return {
        produto: { categorias: { nome: categoria } },
        preco_estimado: preco,
        distancia_km: distancia,
    };
}

test("inteligência contextual é determinística e respeita orçamento e raio configurados", () => {
    const entrada = {
        candidato: candidato(),
        perfil: { orcamento_diario: 80, raio_km: 8 },
        feedbacks: [],
        tipoJanela: "ALMOCO",
    };
    const primeira = pontuarInteligenciaRotina(entrada);
    const segunda = pontuarInteligenciaRotina(entrada);
    assert.deepEqual(primeira, segunda);
    assert.equal(primeira.modelo, MODELO_INTELIGENCIA_ROTINA.versao);
    assert.ok(primeira.ajuste > 0);
    assert.equal(primeira.amostras, 0);
});

test("aprendizado usa somente feedback com consentimento", () => {
    const base = {
        candidato: candidato(),
        perfil: { orcamento_diario: 80, raio_km: 8 },
        tipoJanela: "ALMOCO",
    };
    const semConsentimento = pontuarInteligenciaRotina({
        ...base,
        feedbacks: [{ gostou: true, repetiria: true, consentiu_personalizacao: false, categoria: "Massas", preco_estimado: 40, distancia_km: 2, tipo_janela: "ALMOCO" }],
    });
    const semFeedback = pontuarInteligenciaRotina({ ...base, feedbacks: [] });
    assert.deepEqual(semConsentimento, semFeedback);
});

test("feedback recorrente aumenta afinidade contextual sem ultrapassar o limite", () => {
    const feedbacks = Array.from({ length: 20 }, () => ({
        gostou: true,
        repetiria: true,
        consentiu_personalizacao: true,
        categoria: "Massas",
        preco_estimado: 40,
        distancia_km: 2,
        tipo_janela: "ALMOCO",
    }));
    const resultado = pontuarInteligenciaRotina({
        candidato: candidato(),
        perfil: { orcamento_diario: 80, raio_km: 8 },
        feedbacks,
        tipoJanela: "ALMOCO",
    });
    assert.ok(resultado.ajuste > 0);
    assert.ok(resultado.ajuste <= MODELO_INTELIGENCIA_ROTINA.limite_ajuste);
    assert.equal(resultado.amostras, 20);
    assert.equal(resultado.confianca, 0.9);
    assert.ok(resultado.contribuicoes.categoria_aprendida > 0);
});

test("sinais negativos reduzem a afinidade sem eliminar o candidato", () => {
    const resultado = pontuarInteligenciaRotina({
        candidato: candidato({ preco: 70, distancia: 7 }),
        perfil: { orcamento_diario: 80, raio_km: 8 },
        feedbacks: Array.from({ length: 8 }, () => ({
            gostou: false,
            repetiria: false,
            consentiu_personalizacao: true,
            categoria: "Massas",
            preco_estimado: 70,
            distancia_km: 7,
            tipo_janela: "JANTAR",
        })),
        tipoJanela: "JANTAR",
    });
    assert.ok(resultado.ajuste < 0);
    assert.ok(resultado.ajuste >= -MODELO_INTELIGENCIA_ROTINA.limite_ajuste);
});
