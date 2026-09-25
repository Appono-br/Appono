const test = require("node:test");
const assert = require("node:assert/strict");
const { candidataCongeladaDisponivel, criarDiagnosticoOperacional, validarDiagnosticoOperacional } = require("../src/domain/routine-intelligence-operational");

test("gate operacional reconhece somente a candidata local FROZEN", () => {
    assert.equal(candidataCongeladaDisponivel(), true);
});

test("diagnostico operacional identifica V2 congelada sem expor scores", () => {
    const diagnostico = criarDiagnosticoOperacional({
        requestId: "routine:test:1",
        decisao: { usouV2: true, modelo: "appono-intelligence-v2", motivo: "V2_SELECIONADA", confianca: 0.62, amostras: 4 },
    });
    assert.equal(diagnostico.decision_source, "V2");
    assert.equal(diagnostico.fallback_used, false);
    assert.equal(diagnostico.confidence_bucket, "ALTA");
    assert.equal(diagnostico.effective_samples_bucket, "MEDIA");
    assert.equal("ajuste" in diagnostico, false);
    assert.equal(validarDiagnosticoOperacional(diagnostico), true);
});

test("diagnostico de fallback identifica controle e mantem codigo tecnico", () => {
    const diagnostico = criarDiagnosticoOperacional({
        decisao: { usouV2: false, modelo: "deterministico-v3", motivo: "V2_CONFIANCA_INSUFICIENTE", confianca: 0.12, amostras: 1 },
    });
    assert.deepEqual({ decision_source: diagnostico.decision_source, model_version: diagnostico.model_version, fallback_used: diagnostico.fallback_used, technical_code: diagnostico.technical_code, confidence_bucket: diagnostico.confidence_bucket, effective_samples_bucket: diagnostico.effective_samples_bucket }, {
        decision_source: "CONTROLE", model_version: "deterministico-v3", fallback_used: true, technical_code: "V2_CONFIANCA_INSUFICIENTE", confidence_bucket: "BAIXA", effective_samples_bucket: "BAIXA",
    });
    assert.equal(validarDiagnosticoOperacional(diagnostico), true);
});

test("diagnostico rejeita candidata nao congelada e campos privados", () => {
    assert.throws(() => criarDiagnosticoOperacional({ decisao: { usouV2: true, modelo: "appono-intelligence-v2-1", motivo: "V2_SELECIONADA" } }), /CANDIDATE_NOT_FROZEN/);
    assert.throws(() => validarDiagnosticoOperacional({ decision_source: "CONTROLE", model_version: "deterministico-v3", fallback_used: true, technical_code: "OK", score: 1 }), /PRIVATE_FIELD/);
});
