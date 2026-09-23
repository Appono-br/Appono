"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
    LONGITUDINAL_CONTRACT_VERSION,
    advanceStructuralState,
    cloneCommonInput,
    createCommonInput,
    createStateRegistry,
    dryRunLongitudinal,
    orderLongitudinalScenarios,
    selectEligibleSignals,
    stateKey,
} = require("../src/domain/routine-intelligence-longitudinal-contract");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const { MODEL_VERSIONS } = require("../scripts/prepare-routine-intelligence-longitudinal");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const partitions = readJson("experiments/routine-intelligence/partitions-v1.json");
const personas = readJson("experiments/routine-intelligence/personas-v1.json");
const development = readJson("experiments/routine-intelligence/scenarios/desenvolvimento-v1.json");
const validation = readJson("experiments/routine-intelligence/scenarios/validacao-v1.json");

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

test("longitudinal order is canonical and independent from snapshot order", () => {
    const regular = orderLongitudinalScenarios(development);
    const reversed = orderLongitudinalScenarios({ ...development, scenarios: [...development.scenarios].reverse() });
    assert.deepEqual(reversed.ordered.map((item) => item.scenario_id), regular.ordered.map((item) => item.scenario_id));
    assert.deepEqual(reversed.sequence_hashes, regular.sequence_hashes);
    assert.equal(regular.persona_ids.length, 10);
    assert.ok(regular.persona_ids.every((id) => regular.ordered.filter((item) => item.persona_id === id).length === 30));
});

test("common input contains only eligible candidates and no model identity", () => {
    const scenario = development.scenarios[0];
    const prepared = createCommonInput(scenario);
    assert.equal(prepared.input.contract_version, LONGITUDINAL_CONTRACT_VERSION);
    assert.equal(prepared.input.eligible_candidates.length, scenario.eligible_candidate_ids.length);
    assert.ok(prepared.input.eligible_candidates.every((item) => scenario.eligible_candidate_ids.includes(item.candidate_id)));
    assert.ok(prepared.input.eligible_candidates.every((item) => !scenario.ineligible_candidates.some((blocked) => blocked.candidate_id === item.candidate_id)));
    assert.doesNotMatch(JSON.stringify(prepared.input), /model_version|winner|ranking_score|confidence|utility/);
});

test("consumer copies are independent and preserve canonical hash", () => {
    const prepared = createCommonInput(development.scenarios[0]).input;
    const first = cloneCommonInput(prepared);
    const second = cloneCommonInput(prepared);
    first.eligible_candidates[0].preco_estimado = -1;
    assert.notEqual(first.eligible_candidates[0].preco_estimado, second.eligible_candidates[0].preco_estimado);
    assert.equal(second.common_input_sha256, prepared.common_input_sha256);
});

test("state registry isolates dataset, persona and opaque model version", () => {
    const registry = createStateRegistry({ datasetId: "desenvolvimento_v1", personaIds: ["economico", "explorador"], modelVersions: MODEL_VERSIONS });
    assert.equal(registry.size, 6);
    const control = registry.get(stateKey("desenvolvimento_v1", "economico", MODEL_VERSIONS[0]));
    const challenger = registry.get(stateKey("desenvolvimento_v1", "economico", MODEL_VERSIONS[2]));
    control.failures.push("synthetic");
    assert.deepEqual(challenger.failures, []);
    assert.notEqual(control.processed_scenario_ids, challenger.processed_scenario_ids);
});

test("structural state rejects duplicate scenario and time regression", () => {
    const scenarios = orderLongitudinalScenarios(development).ordered.filter((item) => item.persona_id === "economico");
    const state = createStateRegistry({ datasetId: "desenvolvimento_v1", personaIds: ["economico"], modelVersions: ["opaque"] }).values().next().value;
    const first = createCommonInput(scenarios[0]).input;
    advanceStructuralState(state, first);
    assert.throws(() => advanceStructuralState(state, first), /SCENARIO_ALREADY_PROCESSED/);
    const older = cloneCommonInput(createCommonInput(scenarios[1]).input);
    older.instant_utc = new Date(Date.parse(first.instant_utc) - 1).toISOString();
    assert.throws(() => advanceStructuralState(state, older), /STATE_TIME_REGRESSION/);
});

test("signal gate accepts only active consented past signals and deduplicates", () => {
    const scenario = development.scenarios.find((item) => item.history.level === "SUFFICIENT" && item.persona_id !== "controle_sem_historico");
    const first = selectEligibleSignals(scenario);
    assert.ok(first.eligible.length > 0);
    assert.ok(first.ignored.inactive > 0);
    assert.ok(first.ignored.no_consent > 0);
    const processed = new Set(first.eligible.map((item) => item.idempotency_key));
    const second = selectEligibleSignals(scenario, processed);
    assert.equal(second.eligible.length, 0);
    assert.equal(second.ignored.duplicate, first.eligible.length);
});

test("signal gate rejects future signals and keeps no-history control neutral", () => {
    const control = development.scenarios.find((item) => item.persona_id === "controle_sem_historico");
    assert.deepEqual(selectEligibleSignals(control).eligible, []);
    const changed = clone(development.scenarios.find((item) => item.history.signals.length > 0));
    changed.history.signals[0].occurred_at = changed.instant_utc;
    assert.throws(() => selectEligibleSignals(changed), /FUTURE_SIGNAL/);
});

test("development dry run prepares structure without model execution or scores", () => {
    const summary = dryRunLongitudinal({ snapshot: development, partitionsArtifact: partitions, personasArtifact: personas, modelVersions: MODEL_VERSIONS });
    assert.equal(summary.scenarios, 300);
    assert.equal(summary.common_inputs, 300);
    assert.equal(summary.model_input_copies, 900);
    assert.equal(summary.isolated_states, 30);
    assert.equal(summary.eligible_candidates, 1200);
    assert.equal(summary.models_executed, 0);
    assert.equal(summary.decisions_produced, 0);
    assert.equal(summary.scores_produced, 0);
    assert.equal(summary.reserve_accessed, false);
});

test("validation dry run remains structurally independent", () => {
    const dev = dryRunLongitudinal({ snapshot: development, partitionsArtifact: partitions, personasArtifact: personas, modelVersions: MODEL_VERSIONS });
    const candidate = dryRunLongitudinal({ snapshot: validation, partitionsArtifact: partitions, personasArtifact: personas, modelVersions: MODEL_VERSIONS });
    assert.equal(candidate.scenarios, 300);
    assert.notDeepEqual(candidate.sequence_hashes, dev.sequence_hashes);
});

test("contract rejects reserve, missing scenario and duplicate index", () => {
    const reserve = clone(development);
    reserve.partition.id = "reserva_prospectiva_v1";
    reserve.partition.type = "RESERVA";
    assert.throws(() => orderLongitudinalScenarios(reserve), /RESERVE_IS_SEALED/);

    const missing = { ...development, scenarios: development.scenarios.slice(1) };
    assert.throws(() => orderLongitudinalScenarios(missing), /SCENARIO_COUNT_/);

    const duplicated = clone(development);
    const persona = duplicated.scenarios[0].persona_id;
    const samePersona = duplicated.scenarios.filter((item) => item.persona_id === persona);
    samePersona[1].scenario_index = samePersona[0].scenario_index;
    assert.throws(() => orderLongitudinalScenarios(duplicated), /DUPLICATED_INDEX_/);
});

test("common input rejects unknown fields and hash mutation", () => {
    const input = cloneCommonInput(createCommonInput(development.scenarios[0]).input);
    input.unexpected = true;
    assert.throws(() => cloneCommonInput(input), /COMMON_INPUT_UNKNOWN_FIELD/);
    delete input.unexpected;
    input.eligible_candidates.pop();
    assert.throws(() => cloneCommonInput(input), /COMMON_INPUT_HASH_MISMATCH/);
});

test("dry-run CLI offers help, rejects reserve and reports no decisions", () => {
    const help = childProcess.spawnSync(process.execPath, ["scripts/prepare-routine-intelligence-longitudinal.js", "--help"], { cwd: root, encoding: "utf8" });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /nao executa modelos/);

    const reserve = childProcess.spawnSync(process.execPath, ["scripts/prepare-routine-intelligence-longitudinal.js", "--dataset=reserva_prospectiva_v1", "--check"], { cwd: root, encoding: "utf8" });
    assert.notEqual(reserve.status, 0);
    assert.match(`${reserve.stdout}${reserve.stderr}`, /PROSPECTIVE_RESERVE_IS_SEALED/);

    const developmentRun = childProcess.spawnSync(process.execPath, ["scripts/prepare-routine-intelligence-longitudinal.js", "--dataset=desenvolvimento_v1", "--check"], { cwd: root, encoding: "utf8" });
    assert.equal(developmentRun.status, 0);
    const summary = JSON.parse(developmentRun.stdout);
    assert.equal(summary.models_executed, 0);
    assert.equal(summary.decisions_produced, 0);
    assert.equal(summary.scores_produced, 0);
});

test("prospective contract imports no model, clock, database or network dependency", () => {
    const source = fs.readFileSync(path.join(root, "src/domain/routine-intelligence-longitudinal-contract.js"), "utf8");
    assert.doesNotMatch(source, /require\([^)]*(routine-recommendation|routine-intelligence-v2|routine-intelligence\.js|routine-scoring|routine-shadow-evaluation)/i);
    assert.doesNotMatch(source, /Date\.now\(|Math\.random\(|supabase|fetch\(|https?:|\.private/i);
    assert.equal(canonicalHash(JSON.parse(JSON.stringify(development.scenarios[0]))), canonicalHash(development.scenarios[0]));
});
