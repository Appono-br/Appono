"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    criarDiagnosticoV2_1,
    decidirCandidatoV2_1Titular,
    diagnosticoConfiguracaoV2_1,
    resolverPoliticaV2_1Titular,
    selecionarCandidatoV2_1,
} = require("../src/domain/routine-intelligence-v2-1-titular");

function candidato(id, categoria, { preferido = false, preco = 40 } = {}) {
    return {
        restaurante: { id_restaurante: id, nome: `R${id}`, avaliacao_media: 4.5, score_operacional: 100 },
        produto: { id_produto: id * 10, nome: `P${id}`, categorias: { nome: categoria } },
        preco_estimado: preco,
        distancia_km: 2,
        pesos: { favorito_restaurante: 0 },
        combinaPreferenciaExplicita: preferido,
    };
}

test("V2.1 e titular para todos por padrao e o kill switch restaura o controle", () => {
    const titular = resolverPoliticaV2_1Titular({ env: {} });
    assert.equal(titular.usarV2_1, true);
    assert.equal(titular.modelo, "appono-intelligence-v2-1");
    assert.equal(titular.personalizacaoConsentida, false);
    const desligada = resolverPoliticaV2_1Titular({ env: { APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH: "true" } });
    assert.equal(desligada.usarV2_1, false);
    assert.equal(desligada.modelo, "deterministico-v3");
});

test("selecao operacional aplica precedencia da preferencia somente entre elegiveis", () => {
    const controle = candidato(1, "Massas", { preco: 20 });
    const preferido = candidato(2, "Vegetariana", { preferido: true, preco: 60 });
    const resultado = selecionarCandidatoV2_1({
        candidatos: [controle, preferido],
        perfil: { orcamento_diario: 100 },
        preferencias: ["Vegetariana"],
        tipoJanela: "ALMOCO",
        referencia: new Date("2026-09-24T12:00:00Z"),
    });
    assert.equal(resultado.falhou, false);
    assert.equal(resultado.candidato, preferido);
    assert.equal(resultado.preferenciaAplicada, true);
    const decisao = decidirCandidatoV2_1Titular({
        controle,
        resultadoV2_1: resultado,
        politica: resolverPoliticaV2_1Titular({ env: {} }),
    });
    assert.equal(decisao.usouV2_1, true);
    assert.equal(decisao.modelo, "appono-intelligence-v2-1");
});

test("falha da V2.1 usa fallback deterministico sem impedir a recomendacao", () => {
    const controle = candidato(1, "Massas");
    const decisao = decidirCandidatoV2_1Titular({
        controle,
        resultadoV2_1: { candidato: null, falhou: true, motivo: "V2_1_FALHOU" },
        politica: resolverPoliticaV2_1Titular({ env: {} }),
    });
    assert.equal(decisao.candidato, controle);
    assert.equal(decisao.modelo, "deterministico-v3");
    assert.equal(decisao.usouV2_1, false);
    assert.equal(criarDiagnosticoV2_1({ decisao }).fallback_used, true);
});

test("V2.1 distribui a semana entre restaurantes antes de repetir o vencedor base", () => {
    const primeiro = candidato(1, "Massas");
    const segundo = candidato(2, "Brasileira");
    const resultado = selecionarCandidatoV2_1({
        candidatos: [primeiro, segundo],
        perfil: { orcamento_diario: 100 },
        historicoSemana: [{ id_restaurante: 1, id_produto: 10 }],
        referencia: new Date("2026-09-24T12:00:00Z"),
    });
    assert.equal(resultado.candidato, segundo);
});

test("V2.1 não repete o mesmo prato quando ele é a única opção da semana", () => {
    const unico = candidato(1, "Massas");
    const resultado = selecionarCandidatoV2_1({
        candidatos: [unico],
        perfil: { orcamento_diario: 100 },
        historicoSemana: [{ id_restaurante: 1, id_produto: 10 }],
        referencia: new Date("2026-09-24T12:00:00Z"),
    });
    assert.equal(resultado.candidato, null);
    assert.equal(resultado.falhou, false);
    assert.equal(resultado.semDiversidade, true);
    assert.equal(resultado.motivo, "V2_1_SEM_DIVERSIDADE");

    const decisao = decidirCandidatoV2_1Titular({
        controle: unico,
        resultadoV2_1: resultado,
        politica: resolverPoliticaV2_1Titular({ env: {} }),
    });
    assert.equal(decisao.candidato, null);
    assert.equal(decisao.usouV2_1, true);
    assert.equal(decisao.modelo, "appono-intelligence-v2-1");
});

test("diagnostico administrativo identifica a V2.1 como titular da demonstracao", () => {
    const diagnostico = diagnosticoConfiguracaoV2_1({});
    assert.equal(diagnostico.modelo_titular, "appono-intelligence-v2-1");
    assert.equal(diagnostico.habilitada_para_todos, true);
    assert.equal(diagnostico.fallback, "deterministico-v3");
});
