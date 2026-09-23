"use strict";

const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {
    auditFrozenGuardrails,
    classifyRegression,
    filterEligibleBehaviorSignals,
    sanitizeTechnicalExplanation,
    validateGuardrailsArtifact,
} = require("../src/domain/routine-intelligence-guardrails");
const { decidirCandidatoInteligencia, resolverPoliticaInteligenciaRotina } = require("../src/domain/routine-intelligence-policy");

const backendRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(backendRoot, relativePath), "utf8"));
}

function artifact() {
    return readJson("experiments/routine-intelligence/guardrails-v1.json");
}

function signal(overrides = {}) {
    return {
        idempotency_key: "signal-1",
        synthetic_offline: true,
        active: true,
        consent_valid: true,
        occurred_at: "2027-01-01T10:00:00.000Z",
        persona_id: "preferencia_forte",
        event_type: "APROVACAO",
        ...overrides,
    };
}

function explanation(overrides = {}) {
    return {
        model_version: "appono-intelligence-v2",
        base_score: 42,
        adjustment: 1.25,
        contributions: { explicit_preference: 1.25, consistency: 0 },
        confidence: 0.25,
        effective_samples: 3,
        effective_volume: 2.7,
        consistency: 0.8,
        guardrails_applied: ["active_consent_required"],
        fallback_reason: null,
        technical_error_code: null,
        ...overrides,
    };
}

test("matriz de guardrails possui schema estrito, ids unicos e limites congelados", () => {
    const value = validateGuardrailsArtifact(artifact());
    assert.equal(value.guardrails.length, 10);
    assert.equal(new Set(value.guardrails.map((item) => item.id)).size, value.guardrails.length);
    assert.equal(value.frozen_thresholds.minimum_internal_confidence, 0.25);
    assert.equal(value.frozen_thresholds.public_rollout_percent, 0);
    assert.ok(value.guardrails.every((item) => item.contains_pii === false));
});

test("matriz rejeita campo desconhecido, id duplicado, severidade e limiar invalidos", () => {
    const unknown = structuredClone(artifact());
    unknown.unexpected = true;
    assert.throws(() => validateGuardrailsArtifact(unknown), /UNKNOWN_FIELD/);
    const duplicate = structuredClone(artifact());
    duplicate.guardrails[1].id = duplicate.guardrails[0].id;
    assert.throws(() => validateGuardrailsArtifact(duplicate), /DUPLICATE_RULE/);
    const severity = structuredClone(artifact());
    severity.guardrails[0].severity = "CRITICALISH";
    assert.throws(() => validateGuardrailsArtifact(severity), /RULE_SEVERITY/);
    const threshold = structuredClone(artifact());
    threshold.frozen_thresholds.minimum_internal_confidence = 0.3;
    assert.throws(() => validateGuardrailsArtifact(threshold), /CONFIDENCE_THRESHOLD/);
});

test("sinais exigem consentimento ativo, atividade, causalidade e idempotencia", () => {
    const options = {
        scenarioInstant: "2027-01-02T10:00:00.000Z",
        personaId: "preferencia_forte",
        consentActive: true,
        consentGrantedAt: "2026-12-01T00:00:00.000Z",
    };
    const signals = [
        signal(),
        signal({ idempotency_key: "signal-2", active: false }),
        signal({ idempotency_key: "signal-3", consent_valid: false }),
        signal({ idempotency_key: "signal-4", occurred_at: options.scenarioInstant }),
        signal({ idempotency_key: "signal-5", occurred_at: "2027-01-03T00:00:00.000Z" }),
        signal({ idempotency_key: "signal-6", persona_id: "economico" }),
        signal({ idempotency_key: "signal-1" }),
    ];
    assert.deepEqual(filterEligibleBehaviorSignals(signals, options).map((item) => item.idempotency_key), ["signal-1"]);
    assert.deepEqual(filterEligibleBehaviorSignals(signals, { ...options, consentActive: false }), []);
    assert.deepEqual(filterEligibleBehaviorSignals(signals, { ...options, consentRevokedAt: "2027-01-01T12:00:00.000Z" }), []);
    assert.deepEqual(filterEligibleBehaviorSignals(signals, { ...options, personaId: "controle_sem_historico" }), []);
});

test("reativacao nao ressuscita sinais anteriores ao novo consentimento", () => {
    const result = filterEligibleBehaviorSignals([
        signal({ idempotency_key: "old", occurred_at: "2027-01-01T10:00:00.000Z" }),
        signal({ idempotency_key: "new", occurred_at: "2027-01-03T10:00:00.000Z" }),
    ], {
        scenarioInstant: "2027-01-04T10:00:00.000Z",
        personaId: "preferencia_forte",
        consentActive: true,
        consentGrantedAt: "2027-01-02T10:00:00.000Z",
    });
    assert.deepEqual(result.map((item) => item.idempotency_key), ["new"]);
});

test("sinal sem instante ou chave idempotente falha com codigo seguro", () => {
    const options = { scenarioInstant: "2027-01-02T10:00:00.000Z", personaId: "economico", consentActive: true };
    assert.throws(() => filterEligibleBehaviorSignals([signal({ occurred_at: null })], options), /SIGNAL_INSTANT/);
    assert.throws(() => filterEligibleBehaviorSignals([signal({ idempotency_key: null })], options), /SIGNAL_IDEMPOTENCY_KEY/);
});

test("explicacao tecnica usa lista permitida e limites numericos", () => {
    assert.deepEqual(sanitizeTechnicalExplanation(explanation()), explanation());
    assert.throws(() => sanitizeTechnicalExplanation(explanation({ email: "not-allowed@example.test" })), /UNKNOWN_FIELD/);
    assert.throws(() => sanitizeTechnicalExplanation(explanation({ adjustment: 9 })), /ADJUSTMENT/);
    assert.throws(() => sanitizeTechnicalExplanation(explanation({ confidence: Number.NaN })), /CONFIDENCE/);
    assert.throws(() => sanitizeTechnicalExplanation(explanation({ confidence: 1 })), /CONFIDENCE/);
    assert.throws(() => sanitizeTechnicalExplanation(explanation({ contributions: { private_signal: 1 } })), /UNKNOWN_FIELD/);
});

test("politica aplica controle abaixo, no limite e acima da confianca minima", () => {
    const control = { id: "control" };
    const policy = { usarV2: true, segmento: "interno", confiancaMinima: 0.25 };
    const candidate = (confidence) => ({ id: "v2", inteligenciaV2: { confianca: confidence, amostras: 2, falhou: false } });
    assert.equal(decidirCandidatoInteligencia({ controle: control, v2: candidate(0.249), politica: policy }).usouV2, false);
    assert.equal(decidirCandidatoInteligencia({ controle: control, v2: candidate(0.25), politica: policy }).usouV2, true);
    assert.equal(decidirCandidatoInteligencia({ controle: control, v2: candidate(0.251), politica: policy }).usouV2, true);
    assert.equal(decidirCandidatoInteligencia({ controle: control, v2: candidate(0.9), politica: policy }).usouV2, true);
});

test("inferencia fraca nao substitui preferencia explicita representada pela escolha de controle", () => {
    const preferred = { candidate_id: "preferred-explicit" };
    const inferred = { candidate_id: "inferred-from-two-samples", inteligenciaV2: { confianca: 0.249, amostras: 2, falhou: false } };
    const result = decidirCandidatoInteligencia({
        controle: preferred,
        v2: inferred,
        politica: { usarV2: true, segmento: "interno", confiancaMinima: 0.25 },
    });
    assert.equal(result.candidato, preferred);
    assert.equal(result.motivo, "V2_CONFIANCA_INSUFICIENTE");
    assert.equal(result.usouV2, false);
});

test("kill switch, consentimento e rollout zero preservam o controle", () => {
    const base = { usuario: { id: "synthetic-user" }, consentimentoAtivo: true };
    assert.equal(resolverPoliticaInteligenciaRotina({ ...base, env: {} }).usarV2, false);
    assert.equal(resolverPoliticaInteligenciaRotina({ ...base, env: { APPONO_ROTINA_INTELLIGENCE_ENABLED: "true", APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT: "0" } }).usarV2, false);
    assert.equal(resolverPoliticaInteligenciaRotina({ ...base, env: { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "synthetic-user", APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH: "true" } }).usarV2, false);
    assert.equal(resolverPoliticaInteligenciaRotina({ ...base, consentimentoAtivo: false, env: { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "synthetic-user" } }).usarV2, false);
});

test("taxonomia classifica regressao sem transformar delta em causa universal", () => {
    assert.equal(classifyRegression({ personaId: "preferencia_forte", confidence: 0.4, v2Regret: 2, comparatorRegret: 1, evidence: { explicit_preference_lost: true } }), "PREFERENCIA_EXPLICITA_PERDIDA");
    assert.equal(classifyRegression({ personaId: "economico", confidence: 0.1, v2Regret: 2, comparatorRegret: 1 }), "CONFIANCA_INSUFICIENTE");
    assert.equal(classifyRegression({ personaId: "mudanca_gradual", confidence: 0.5, v2Regret: 2, comparatorRegret: 1 }), "HIPOTESE_PARA_V2_1");
    assert.equal(classifyRegression({ personaId: "economico", confidence: 0.5, v2Regret: 2, comparatorRegret: 1 }), "HIPOTESE_PARA_V2_1");
    assert.equal(classifyRegression({ personaId: "economico", confidence: 0.5, v2Regret: 1, comparatorRegret: 1 }), "SEM_VIOLACAO_DE_GUARDRAIL");
});

test("auditoria congelada e deterministica, sem executar modelos ou acessar reserva", () => {
    const input = {
        artifact: artifact(),
        rawReports: [
            readJson("reports/routine-intelligence/prospective/desenvolvimento-v1.json"),
            readJson("reports/routine-intelligence/prospective/validacao-v1.json"),
        ],
        snapshots: [
            readJson("experiments/routine-intelligence/scenarios/desenvolvimento-v1.json"),
            readJson("experiments/routine-intelligence/scenarios/validacao-v1.json"),
        ],
        personasArtifact: readJson("experiments/routine-intelligence/personas-v1.json"),
    };
    const first = auditFrozenGuardrails(input);
    const second = auditFrozenGuardrails(input);
    assert.deepEqual(first, second);
    assert.equal(first.reserve_accessed, false);
    assert.equal(first.datasets.length, 2);
    assert.equal(first.datasets.reduce((sum, item) => sum + item.executions, 0), 1800);
    assert.equal(first.matrix.find((item) => item.guardrail_id === "eligible_candidates_only").checked_cases, 1800);
    assert.equal(first.matrix.find((item) => item.guardrail_id === "no_history_neutral").checked_cases, 60);
    assert.ok(first.regressions.length > 0);
    assert.ok(first.blind_review_candidates.length > 0);
    assert.doesNotMatch(JSON.stringify(first.blind_review_candidates), /model_version|appono-intelligence|deterministico/);
});

test("auditoria falha em reserva, escolha inelegivel e vazamento temporal", () => {
    const raw = readJson("reports/routine-intelligence/prospective/validacao-v1.json");
    const reserve = structuredClone(raw);
    reserve.metadata.dataset_id = "reserva_prospectiva_v1";
    assert.throws(() => auditFrozenGuardrails({ artifact: artifact(), rawReports: [reserve] }), /RESERVE/);
    const ineligible = structuredClone(raw);
    ineligible.decisions[0].guardrails.eligible_choice = false;
    assert.throws(() => auditFrozenGuardrails({ artifact: artifact(), rawReports: [ineligible] }), /INELIGIBLE_CHOICE/);
    const future = structuredClone(raw);
    future.decisions[0].guardrails.temporal_signal_barrier = false;
    assert.throws(() => auditFrozenGuardrails({ artifact: artifact(), rawReports: [future] }), /TEMPORAL_LEAKAGE/);
});

test("fontes congeladas de controle, V1 e V2 mantem seus hashes", () => {
    const expected = {
        "src/domain/routine-scoring.js": "0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18",
        "src/domain/routine-intelligence.js": "41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b",
        "src/domain/routine-intelligence-v2.js": "f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4",
    };
    for (const [relativePath, hash] of Object.entries(expected)) {
        const received = crypto.createHash("sha256").update(fs.readFileSync(path.join(backendRoot, relativePath))).digest("hex");
        assert.equal(received, hash, relativePath);
    }
});

test("CLI oferece ajuda sem escrita e recusa reserva", () => {
    const script = path.join(backendRoot, "scripts/audit-routine-intelligence-guardrails.js");
    const output = path.join(backendRoot, "reports/routine-intelligence/prospective/guardrails-v1.json");
    const before = fs.readFileSync(output, "utf8");
    const help = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /somente leitura/);
    assert.equal(fs.readFileSync(output, "utf8"), before);
    const reserve = spawnSync(process.execPath, [script, "--dataset=reserva_prospectiva_v1", "--check"], { encoding: "utf8" });
    assert.notEqual(reserve.status, 0);
    assert.match(reserve.stderr, /PROSPECTIVE_RESERVE_IS_SEALED/);
    assert.equal(fs.readFileSync(output, "utf8"), before);
});
