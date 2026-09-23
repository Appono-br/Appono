"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
    LONGITUDINAL_SIMULATION_VERSION,
    MODEL_VERSIONS,
    RAW_REPORT_SCHEMA_VERSION,
    createGeneratedSignal,
    normalizeSignal,
    serializeReport,
    simulateLongitudinal,
    stableNumericId,
    validateProtocol,
} = require("../src/domain/routine-intelligence-longitudinal-simulation");

const backendRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(backendRoot, relativePath), "utf8"));
}

function fixtures(dataset = "desenvolvimento_v1") {
    const file = dataset === "desenvolvimento_v1" ? "desenvolvimento-v1.json" : "validacao-v1.json";
    return {
        snapshot: readJson(`experiments/routine-intelligence/scenarios/${file}`),
        partitionsArtifact: readJson("experiments/routine-intelligence/partitions-v1.json"),
        personasArtifact: readJson("experiments/routine-intelligence/personas-v1.json"),
        protocol: readJson("experiments/routine-intelligence/longitudinal-protocol-v1.json"),
    };
}

test("protocolo prospectivo congela modelos, reserva e hashes", () => {
    const input = fixtures();
    assert.equal(validateProtocol(input.protocol, input), input.protocol);
    assert.equal(input.protocol.executor_version, LONGITUDINAL_SIMULATION_VERSION);
    assert.equal(input.protocol.report.schema_version, RAW_REPORT_SCHEMA_VERSION);
    assert.deepEqual(input.protocol.models.map((item) => item.version), MODEL_VERSIONS);
    assert.equal(input.protocol.reserve.prospective_state, "SEALED_UNMATERIALIZED");
    assert.equal(input.protocol.reserve.access_allowed, false);
    assert.equal(input.protocol.calibration_allowed, false);
});

test("ids numericos sinteticos sao deterministas e seguros para Number", () => {
    const first = stableNumericId("syn-rest-example");
    assert.equal(first, stableNumericId("syn-rest-example"));
    assert.notEqual(first, stableNumericId("syn-rest-other"));
    assert.equal(Number.isSafeInteger(first), true);
});

test("normalizacao preserva consentimento e nao apresenta conversao simulada como pedido", () => {
    const signal = normalizeSignal({
        signal_id: "s1",
        idempotency_key: "offline:test:signal",
        event_type: "CONVERSAO_SIMULADA",
        occurred_at: "2027-01-01T00:00:00.000Z",
        restaurant_id: "r1",
        product_id: "p1",
        category: "Massas",
        consent_valid: true,
    });
    assert.equal(signal.tipo_evento, "APROVACAO");
    assert.equal(signal.consentiu_personalizacao, true);
    assert.equal(signal.gostou, true);
    assert.equal(signal.repetiria, true);
});

test("edicao sintetica nao ensina atributos nao observados", () => {
    const input = {
        partition_id: "desenvolvimento_v1",
        persona_id: "economico",
        scenario_id: "scenario",
        instant_utc: "2027-01-01T12:00:00.000Z",
        meal_window: "ALMOCO",
    };
    const candidate = {
        restaurant: { id_restaurante: "r1" },
        product: { id_produto: "p1", categorias: { nome: "Massas" } },
        preco_estimado: 30,
        distancia_km: 2,
    };
    const signal = createGeneratedSignal({ input, modelVersion: MODEL_VERSIONS[2], reaction: { tipo: "EDICAO" }, candidate });
    assert.equal(signal.category, null);
    assert.equal(signal.restaurant_id, null);
    assert.equal(signal.product_id, null);
    assert.equal(signal.value, 0);
});

test("desenvolvimento executa 300 cenarios e 900 decisoes sem violacao", () => {
    const report = simulateLongitudinal(fixtures());
    assert.equal(report.summary.personas, 10);
    assert.equal(report.summary.weeks_per_persona, 6);
    assert.equal(report.summary.scenarios, 300);
    assert.equal(report.summary.model_executions, 900);
    assert.deepEqual(report.summary.executions_by_model, Object.fromEntries(MODEL_VERSIONS.map((model) => [model, 300])));
    assert.deepEqual(report.summary.failures_by_model, Object.fromEntries(MODEL_VERSIONS.map((model) => [model, 0])));
    assert.equal(report.summary.fallbacks, 0);
    assert.equal(report.summary.eliminatory_violations, 0);
    assert.equal(report.summary.dataset_valid, true);
    assert.equal(report.metadata.reserve_accessed, false);
});

test("cada cenario oferece o mesmo conjunto de candidatos aos tres modelos", () => {
    const report = simulateLongitudinal(fixtures());
    const grouped = new Map();
    for (const decision of report.decisions) {
        const hashes = grouped.get(decision.scenario_id) ?? new Set();
        hashes.add(decision.candidate_set_sha256);
        grouped.set(decision.scenario_id, hashes);
        assert.equal(decision.guardrails.eligible_choice, true);
        assert.equal(decision.guardrails.same_candidate_set, true);
    }
    assert.equal(grouped.size, 300);
    assert.equal([...grouped.values()].every((hashes) => hashes.size === 1), true);
});

test("grupo sem historico mantem V2 neutra nas seis semanas", () => {
    const report = simulateLongitudinal(fixtures());
    const decisions = report.decisions.filter((item) => item.persona_id === "controle_sem_historico" && item.model_version === "appono-intelligence-v2");
    assert.equal(decisions.length, 30);
    assert.equal(decisions.every((item) => item.adjustment === 0 && item.confidence === 0 && item.effective_samples === 0), true);
    assert.equal(decisions.every((item) => item.signal_created === false && item.eligible_signal_count === 0), true);
    const control = new Map(report.decisions.filter((item) => item.persona_id === "controle_sem_historico" && item.model_version === "deterministico-v3").map((item) => [item.scenario_id, item.native_choice_candidate_id]));
    assert.equal(decisions.every((item) => item.native_choice_candidate_id === control.get(item.scenario_id)), true);
});

test("sinais gerados aparecem somente depois da decisao de origem", () => {
    const report = simulateLongitudinal(fixtures());
    for (const model of MODEL_VERSIONS) {
        const items = report.decisions.filter((item) => item.persona_id === "economico" && item.model_version === model);
        assert.equal(items.length, 30);
        assert.equal(items[0].state_before_sha256 !== items[0].state_after_sha256, true);
        assert.equal(items.slice(1).every((item, index) => item.state_before_sha256 === items[index].state_after_sha256), true);
    }
});

test("relatorio e byte a byte deterministico", () => {
    const input = fixtures();
    const first = simulateLongitudinal(input);
    const second = simulateLongitudinal(fixtures());
    assert.equal(first.content_sha256, second.content_sha256);
    assert.equal(serializeReport(first), serializeReport(second));
});

test("falha da V2 usa fallback sem receber credito ou sinal", () => {
    const report = simulateLongitudinal({
        ...fixtures(),
        modelOverrides: {
            "appono-intelligence-v2": () => { throw new Error("INJECTED_V2_FAILURE"); },
        },
    });
    const failures = report.decisions.filter((item) => item.model_version === "appono-intelligence-v2");
    assert.equal(failures.length, 300);
    assert.equal(failures.every((item) => item.native_choice_candidate_id === null), true);
    assert.equal(failures.every((item) => item.fallback_used && item.effective_choice_candidate_id), true);
    assert.equal(failures.every((item) => item.signal_created === false && item.chosen_external_utility === null), true);
    assert.equal(report.summary.failures_by_model["appono-intelligence-v2"], 300);
    assert.equal(report.summary.fallbacks, 300);
});

test("falha do controle invalida o conjunto sem fabricar escolha", () => {
    const report = simulateLongitudinal({
        ...fixtures(),
        modelOverrides: {
            "deterministico-v3": () => { throw new Error("INJECTED_CONTROL_FAILURE"); },
        },
    });
    const failures = report.decisions.filter((item) => item.model_version === "deterministico-v3");
    assert.equal(failures.every((item) => item.native_choice_candidate_id === null && item.effective_choice_candidate_id === null), true);
    assert.equal(failures.every((item) => item.fallback_used === false && item.signal_created === false), true);
    assert.equal(report.summary.dataset_valid, false);
});

test("tentativa de protocolo de reserva e recusada", () => {
    const input = fixtures();
    input.snapshot.partition.id = "reserva_prospectiva_v1";
    assert.throws(() => simulateLongitudinal(input), /reserve|reserva|DATASET_NOT_ALLOWED/i);
});

test("relatorio nao contem PII, segredo ou vencedor final", () => {
    const serialized = serializeReport(simulateLongitudinal(fixtures()));
    assert.doesNotMatch(serialized, /@|access_token|refresh_token|service_role|password|senha|latitude|longitude/i);
    assert.doesNotMatch(serialized, /final_winner|vencedor_final/i);
});
