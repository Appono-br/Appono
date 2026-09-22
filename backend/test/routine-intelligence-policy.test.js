"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    bucketEstavel,
    decidirCandidatoInteligencia,
    diagnosticoConfiguracaoInteligencia,
    resolverPoliticaInteligenciaRotina,
} = require("../src/domain/routine-intelligence-policy");

function candidato(id, { confianca = 0.6, amostras = 5, falhou = false } = {}) {
    return {
        restaurante: { id_restaurante: id },
        produto: { id_produto: id * 10 },
        inteligenciaV2: { confianca, amostras, falhou },
    };
}

test("politica mantem controle por padrao e diante do kill switch", () => {
    const base = resolverPoliticaInteligenciaRotina({ consentimentoAtivo: true, usuario: { id: "u1" }, env: {} });
    assert.equal(base.usarV2, false);
    assert.equal(base.motivo, "FEATURE_DESATIVADA");
    const kill = resolverPoliticaInteligenciaRotina({
        consentimentoAtivo: true,
        usuario: { id: "u1" },
        env: { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "u1", APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH: "true" },
    });
    assert.equal(kill.usarV2, false);
    assert.equal(kill.motivo, "KILL_SWITCH");
});

test("allowlist exige consentimento e aceita id ou email sem diferenciar maiusculas", () => {
    const env = { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "INTERNO@EXAMPLE.TEST,42" };
    assert.equal(resolverPoliticaInteligenciaRotina({ usuario: { email: "interno@example.test" }, consentimentoAtivo: false, env }).usarV2, false);
    const porEmail = resolverPoliticaInteligenciaRotina({ usuario: { email: "interno@example.test" }, consentimentoAtivo: true, env });
    const porCliente = resolverPoliticaInteligenciaRotina({ idCliente: 42, consentimentoAtivo: true, env });
    assert.equal(porEmail.segmento, "interno");
    assert.equal(porCliente.usarV2, true);
});

test("bucket de rollout e estavel e rollout zero nunca ativa a V2", () => {
    assert.equal(bucketEstavel("cliente-1", "sal"), bucketEstavel("cliente-1", "sal"));
    const politica = resolverPoliticaInteligenciaRotina({
        usuario: { id: "cliente-1" },
        consentimentoAtivo: true,
        env: { APPONO_ROTINA_INTELLIGENCE_ENABLED: "true", APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT: "0" },
    });
    assert.equal(politica.usarV2, false);
    assert.equal(politica.motivo, "ROLLOUT_ZERO");
});

test("decisao usa V2 somente com historico, confianca e modelo saudavel", () => {
    const controle = candidato(1);
    const politica = { usarV2: true, segmento: "interno", confiancaMinima: 0.25 };
    assert.equal(decidirCandidatoInteligencia({ controle, v2: candidato(2, { amostras: 0 }), politica }).motivo, "V2_SEM_HISTORICO");
    assert.equal(decidirCandidatoInteligencia({ controle, v2: candidato(2, { confianca: 0.1 }), politica }).motivo, "V2_CONFIANCA_INSUFICIENTE");
    assert.equal(decidirCandidatoInteligencia({ controle, v2: candidato(2, { falhou: true }), politica }).motivo, "V2_FALHOU");
    const escolhida = decidirCandidatoInteligencia({ controle, v2: candidato(2), politica });
    assert.equal(escolhida.usouV2, true);
    assert.equal(escolhida.candidato.restaurante.id_restaurante, 2);
});

test("diagnostico administrativo nao revela allowlist nem sal", () => {
    const diagnostico = diagnosticoConfiguracaoInteligencia({
        APPONO_ROTINA_INTELLIGENCE_ENABLED: "true",
        APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "a@example.test,b@example.test",
        APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT: "5",
        APPONO_ROTINA_INTELLIGENCE_ROLLOUT_SALT: "segredo",
    });
    assert.equal(diagnostico.contas_internas_configuradas, 2);
    assert.equal(diagnostico.rollout_percentual, 5);
    assert.doesNotMatch(JSON.stringify(diagnostico), /a@example|segredo/);
});
