"use strict";

const {
    adaptEligibleCandidates,
    validateScenarioSnapshot,
} = require("./routine-intelligence-scenario-generator");
const { canonicalHash } = require("./routine-intelligence-partitions");

const LONGITUDINAL_CONTRACT_VERSION = "routine-longitudinal-contract-v1";
const ALLOWED_DATASETS = new Set(["desenvolvimento_v1", "validacao_v1"]);
const COMMON_INPUT_KEYS = new Set([
    "contract_version", "partition_id", "scenario_id", "persona_id", "virtual_week", "virtual_day",
    "scenario_index", "instant_utc", "meal_window", "profile", "recent_choices", "eligible_signals",
    "eligible_candidates", "common_input_sha256",
]);

function requireCondition(condition, code) {
    if (!condition) throw new Error(`LONGITUDINAL_CONTRACT_INVALID: ${code}`);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
}

function assertAllowedDataset(snapshot) {
    requireCondition(snapshot?.partition && typeof snapshot.partition.id === "string", "DATASET_MISSING");
    requireCondition(snapshot.partition.type !== "RESERVA" && !/reserva|reserve/i.test(snapshot.partition.id), "RESERVE_IS_SEALED");
    requireCondition(ALLOWED_DATASETS.has(snapshot.partition.id), "DATASET_NOT_ALLOWED");
    return snapshot.partition.id;
}

function orderLongitudinalScenarios(snapshot) {
    assertAllowedDataset(snapshot);
    requireCondition(Array.isArray(snapshot.scenarios), "SCENARIOS_REQUIRED");
    const ordered = [...snapshot.scenarios].sort((first, second) => (
        first.persona_id.localeCompare(second.persona_id)
        || first.virtual_week - second.virtual_week
        || first.virtual_day - second.virtual_day
        || first.scenario_index - second.scenario_index
    ));
    const personaIds = Object.keys(snapshot.coverage?.by_persona ?? {}).sort();
    requireCondition(personaIds.length === 10, "TEN_PERSONAS_REQUIRED");
    const grouped = new Map(personaIds.map((id) => [id, []]));
    for (const scenario of ordered) {
        requireCondition(grouped.has(scenario.persona_id), "UNKNOWN_PERSONA");
        grouped.get(scenario.persona_id).push(scenario);
    }
    const sequenceHashes = {};
    for (const [personaId, scenarios] of grouped) {
        requireCondition(scenarios.length === snapshot.partition.weeks * 5, `SCENARIO_COUNT_${personaId}`);
        requireCondition(new Set(scenarios.map((item) => item.scenario_index)).size === scenarios.length, `DUPLICATED_INDEX_${personaId}`);
        let previousInstant = null;
        scenarios.forEach((scenario, index) => {
            requireCondition(scenario.scenario_index === index, `INDEX_GAP_${personaId}`);
            requireCondition(scenario.virtual_week === Math.floor(index / 5), `WEEK_SEQUENCE_${personaId}`);
            requireCondition(scenario.virtual_day === index % 5, `DAY_SEQUENCE_${personaId}`);
            const instant = Date.parse(scenario.instant_utc);
            requireCondition(Number.isFinite(instant), `INVALID_INSTANT_${personaId}`);
            requireCondition(previousInstant === null || instant > previousInstant, `NON_INCREASING_TIME_${personaId}`);
            previousInstant = instant;
        });
        sequenceHashes[personaId] = canonicalHash(scenarios.map((item) => item.input_snapshot_sha256));
    }
    return {
        ordered,
        persona_ids: personaIds,
        sequence_hashes: Object.fromEntries(Object.entries(sequenceHashes).sort()),
    };
}

function selectEligibleSignals(scenario, processedSignalKeys = new Set()) {
    requireCondition(processedSignalKeys instanceof Set, "PROCESSED_SIGNAL_KEYS_MUST_BE_SET");
    if (scenario.persona_id === "controle_sem_historico") {
        return { eligible: [], ignored: { control: scenario.history.signals.length, inactive: 0, no_consent: 0, duplicate: 0 } };
    }
    const scenarioInstant = Date.parse(scenario.instant_utc);
    requireCondition(Number.isFinite(scenarioInstant), "SCENARIO_INSTANT_INVALID");
    const eligible = [];
    const ignored = { control: 0, inactive: 0, no_consent: 0, duplicate: 0 };
    for (const signal of scenario.history.signals) {
        const occurredAt = Date.parse(signal.occurred_at);
        requireCondition(Number.isFinite(occurredAt), "SIGNAL_INSTANT_INVALID");
        requireCondition(occurredAt < scenarioInstant, "FUTURE_SIGNAL");
        if (processedSignalKeys.has(signal.idempotency_key)) {
            ignored.duplicate += 1;
            continue;
        }
        if (signal.synthetic_offline !== true || signal.active !== true) {
            ignored.inactive += 1;
            continue;
        }
        if (signal.consent_valid !== true) {
            ignored.no_consent += 1;
            continue;
        }
        eligible.push(clone(signal));
    }
    eligible.sort((first, second) => first.occurred_at.localeCompare(second.occurred_at) || first.idempotency_key.localeCompare(second.idempotency_key));
    return { eligible, ignored };
}

function createCommonInput(scenario, { processedSignalKeys = new Set() } = {}) {
    const signals = selectEligibleSignals(scenario, processedSignalKeys);
    const candidates = adaptEligibleCandidates(scenario).sort((first, second) => first.candidate_id.localeCompare(second.candidate_id));
    requireCondition(candidates.length === scenario.eligible_candidate_ids.length, "ELIGIBLE_CANDIDATE_COUNT_MISMATCH");
    const base = {
        contract_version: LONGITUDINAL_CONTRACT_VERSION,
        partition_id: scenario.partition_id,
        scenario_id: scenario.scenario_id,
        persona_id: scenario.persona_id,
        virtual_week: scenario.virtual_week,
        virtual_day: scenario.virtual_day,
        scenario_index: scenario.scenario_index,
        instant_utc: scenario.instant_utc,
        meal_window: scenario.meal_window,
        profile: clone(scenario.profile),
        recent_choices: clone(scenario.history.recent_choices),
        eligible_signals: signals.eligible,
        eligible_candidates: candidates,
    };
    return {
        input: deepFreeze({ ...base, common_input_sha256: canonicalHash(base) }),
        ignored_signals: signals.ignored,
    };
}

function cloneCommonInput(input) {
    requireCondition(input && typeof input === "object", "COMMON_INPUT_REQUIRED");
    for (const key of Object.keys(input)) requireCondition(COMMON_INPUT_KEYS.has(key), `COMMON_INPUT_UNKNOWN_FIELD_${key}`);
    for (const key of COMMON_INPUT_KEYS) requireCondition(Object.hasOwn(input, key), `COMMON_INPUT_MISSING_FIELD_${key}`);
    const base = Object.fromEntries(Object.entries(input).filter(([key]) => key !== "common_input_sha256"));
    requireCondition(input.common_input_sha256 === canonicalHash(base), "COMMON_INPUT_HASH_MISMATCH");
    return clone(input);
}

function stateKey(datasetId, personaId, modelVersion) {
    return `${datasetId}:${personaId}:${modelVersion}`;
}

function createStateRegistry({ datasetId, personaIds, modelVersions }) {
    requireCondition(ALLOWED_DATASETS.has(datasetId), "STATE_DATASET_NOT_ALLOWED");
    requireCondition(Array.isArray(personaIds) && new Set(personaIds).size === personaIds.length, "STATE_PERSONAS_INVALID");
    requireCondition(Array.isArray(modelVersions) && modelVersions.length > 0 && new Set(modelVersions).size === modelVersions.length, "STATE_MODELS_INVALID");
    const registry = new Map();
    for (const personaId of personaIds) {
        for (const modelVersion of modelVersions) {
            requireCondition(typeof modelVersion === "string" && modelVersion.length >= 2, "STATE_MODEL_VERSION_INVALID");
            registry.set(stateKey(datasetId, personaId, modelVersion), {
                dataset_id: datasetId,
                persona_id: personaId,
                model_version: modelVersion,
                processed_scenario_ids: new Set(),
                processed_signal_keys: new Set(),
                last_instant_utc: null,
                choices: [],
                failures: [],
            });
        }
    }
    return registry;
}

function advanceStructuralState(state, input) {
    requireCondition(state && input, "STATE_AND_INPUT_REQUIRED");
    requireCondition(state.dataset_id === input.partition_id && state.persona_id === input.persona_id, "STATE_SCOPE_MISMATCH");
    requireCondition(!state.processed_scenario_ids.has(input.scenario_id), "SCENARIO_ALREADY_PROCESSED");
    const instant = Date.parse(input.instant_utc);
    const previous = state.last_instant_utc ? Date.parse(state.last_instant_utc) : null;
    requireCondition(Number.isFinite(instant) && (previous === null || instant > previous), "STATE_TIME_REGRESSION");
    state.processed_scenario_ids.add(input.scenario_id);
    input.eligible_signals.forEach((signal) => state.processed_signal_keys.add(signal.idempotency_key));
    state.last_instant_utc = input.instant_utc;
    return state;
}

function dryRunLongitudinal({ snapshot, partitionsArtifact, personasArtifact, modelVersions }) {
    assertAllowedDataset(snapshot);
    validateScenarioSnapshot(snapshot, { partitionsArtifact, personasArtifact });
    const plan = orderLongitudinalScenarios(snapshot);
    const states = createStateRegistry({ datasetId: snapshot.partition.id, personaIds: plan.persona_ids, modelVersions });
    let eligibleCandidates = 0;
    let eligibleSignals = 0;
    const ignoredSignals = { control: 0, inactive: 0, no_consent: 0, duplicate: 0 };
    for (const scenario of plan.ordered) {
        const hashes = new Set();
        for (const modelVersion of modelVersions) {
            const state = states.get(stateKey(snapshot.partition.id, scenario.persona_id, modelVersion));
            const prepared = createCommonInput(scenario, { processedSignalKeys: state.processed_signal_keys });
            const copy = cloneCommonInput(prepared.input);
            hashes.add(copy.common_input_sha256);
            advanceStructuralState(state, copy);
            if (modelVersion === modelVersions[0]) {
                eligibleCandidates += copy.eligible_candidates.length;
                eligibleSignals += copy.eligible_signals.length;
                for (const key of Object.keys(ignoredSignals)) ignoredSignals[key] += prepared.ignored_signals[key];
            }
        }
        requireCondition(hashes.size === 1, "MODEL_INPUTS_DIFFER");
    }
    return {
        contract_version: LONGITUDINAL_CONTRACT_VERSION,
        dataset: snapshot.partition.id,
        personas: plan.persona_ids.length,
        weeks_per_persona: snapshot.partition.weeks,
        scenarios: plan.ordered.length,
        common_inputs: plan.ordered.length,
        model_input_copies: plan.ordered.length * modelVersions.length,
        isolated_states: states.size,
        eligible_candidates: eligibleCandidates,
        eligible_signals: eligibleSignals,
        ignored_signals: ignoredSignals,
        sequence_hashes: plan.sequence_hashes,
        models_executed: 0,
        decisions_produced: 0,
        scores_produced: 0,
        reserve_accessed: false,
    };
}

module.exports = {
    ALLOWED_DATASETS,
    LONGITUDINAL_CONTRACT_VERSION,
    advanceStructuralState,
    cloneCommonInput,
    createCommonInput,
    createStateRegistry,
    dryRunLongitudinal,
    orderLongitudinalScenarios,
    selectEligibleSignals,
    stateKey,
};
