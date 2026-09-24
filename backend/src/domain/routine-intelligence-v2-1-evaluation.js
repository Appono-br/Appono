"use strict";

const { canonicalHash } = require("./routine-intelligence-partitions");
const { cloneCommonInput, createCommonInput, orderLongitudinalScenarios } = require("./routine-intelligence-longitudinal-contract");
const { validateScenarioSnapshot } = require("./routine-intelligence-scenario-generator");
const { avaliarUtilidadePersona, reagirPersona } = require("./routine-intelligence-personas");
const { decideV2_1, toUtilityCandidate, VERSION } = require("./routine-intelligence-v2-1");

function requireCondition(condition, code) { if (!condition) throw new Error(`V2_1_EVALUATION_INVALID: ${code}`); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function personasMap(artifact) { return new Map(artifact.personas.map((persona) => [persona.id, persona])); }
function candidateIds(input) { return input.eligible_candidates.map((candidate) => candidate.candidate_id); }
function historyForState(input, state) {
    return [...input.recent_choices, ...state.choices].map((choice) => ({
        id_restaurante: choice.restaurant_id ?? choice.id_restaurante,
        id_produto: choice.product_id ?? choice.id_produto,
        categoria: choice.category ?? choice.categoria,
        occurred_at: choice.occurred_at,
    }));
}
function normalizeSignal(signal) {
    return { categoria: signal.category ?? signal.categoria ?? null, id_restaurante: signal.restaurant_id ?? signal.id_restaurante ?? null, id_produto: signal.product_id ?? signal.id_produto ?? null, valor: signal.value ?? 0 };
}
function availableSignals(input, state) {
    const instant = Date.parse(input.instant_utc);
    const generated = state.generated_signals.filter((signal) => Date.parse(signal.occurred_at) < instant && signal.active && signal.consent_valid && signal.synthetic_offline);
    const keys = new Set();
    return [...input.eligible_signals, ...generated].filter((signal) => {
        if (keys.has(signal.idempotency_key)) return false;
        keys.add(signal.idempotency_key);
        return true;
    });
}
function utilityForCandidates(input, persona, state, signals) {
    const utilities = new Map();
    const history = historyForState(input, state);
    const personaSignals = signals.map(normalizeSignal);
    for (const candidate of input.eligible_candidates) {
        const result = avaliarUtilidadePersona(persona, toUtilityCandidate(candidate), {
            semana: input.virtual_week, indice: input.scenario_index, semente: input.partition_id,
            historico: history, sinais: personaSignals,
        });
        requireCondition(result.elegivel && Number.isFinite(result.utilidade), "UTILITY_INVALID");
        utilities.set(candidate.candidate_id, result.utilidade);
    }
    return { utilities, best: Math.max(...utilities.values()) };
}
function generatedSignal(input, modelVersion, reaction, candidate) {
    if (!reaction) return null;
    const value = { APROVACAO: 1, RECUSA: -1, ALTERNATIVA: -0.6, EDICAO: 0, CONVERSAO_SIMULADA: 1.5 }[reaction.tipo];
    const teaches = reaction.tipo !== "EDICAO";
    return {
        signal_id: `generated:${input.partition_id}:${input.persona_id}:${modelVersion}:${input.scenario_id}`,
        idempotency_key: `offline:${input.partition_id}:${input.persona_id}:${modelVersion}:${input.scenario_id}:${reaction.tipo}`,
        event_type: reaction.tipo, occurred_at: input.instant_utc,
        category: teaches ? candidate.product.categorias.nome : null,
        restaurant_id: teaches ? candidate.restaurant.id_restaurante : null,
        product_id: teaches ? candidate.product.id_produto : null,
        price: teaches ? candidate.preco_estimado : null,
        distance_km: teaches ? candidate.distancia_km : null,
        meal_window: teaches ? input.meal_window : null, value,
        consent_valid: true, active: true, synthetic_offline: true,
    };
}
function createState(datasetId, personaId) { return { dataset_id: datasetId, persona_id: personaId, model_version: VERSION, processed_scenario_ids: [], choices: [], generated_signals: [], failures: [], last_instant_utc: null }; }

function simulateCandidate({ snapshot, partitionsArtifact, personasArtifact }) {
    validateScenarioSnapshot(snapshot, { partitionsArtifact, personasArtifact });
    requireCondition(snapshot.partition.type !== "RESERVA" && !/reserva|reserve/i.test(snapshot.partition.id), "RESERVE_FORBIDDEN");
    const plan = orderLongitudinalScenarios(snapshot);
    const personas = personasMap(personasArtifact);
    const states = new Map(plan.persona_ids.map((id) => [`${snapshot.partition.id}:${id}`, createState(snapshot.partition.id, id)]));
    const decisions = [];
    for (const scenario of plan.ordered) {
        const persona = personas.get(scenario.persona_id);
        requireCondition(persona, "PERSONA_NOT_FOUND");
        const prepared = createCommonInput(scenario);
        const input = cloneCommonInput(prepared.input);
        const state = states.get(`${input.partition_id}:${input.persona_id}`);
        requireCondition(state && !state.processed_scenario_ids.includes(input.scenario_id), "STATE_REUSE");
        const signals = input.persona_id === "controle_sem_historico" ? [] : availableSignals(input, state);
        const history = historyForState(input, state);
        const utility = utilityForCandidates(input, persona, state, signals);
        const previous = state.choices.at(-1) ?? input.recent_choices.at(-1) ?? null;
        const result = decideV2_1({ input, persona, history, signals: signals.map((signal) => ({
            id_sinal: signal.signal_id ?? signal.idempotency_key, tipo_evento: signal.event_type, consentiu_personalizacao: signal.consent_valid,
            criado_em: signal.occurred_at, id_restaurante: signal.restaurant_id, id_produto: signal.product_id, categoria: signal.category,
        })), previous });
        const chosen = input.eligible_candidates.find((candidate) => candidate.candidate_id === result.candidate_id);
        const chosenUtility = utility.utilities.get(result.candidate_id);
        requireCondition(chosen && Number.isFinite(chosenUtility), "CHOICE_INVALID");
        const regret = Number((utility.best - chosenUtility).toFixed(6));
        const reaction = reagirPersona(persona, { utilidade: chosenUtility, melhor_utilidade: utility.best, chave: `${input.partition_id}:${VERSION}:${input.scenario_id}` });
        const signal = generatedSignal(input, VERSION, reaction, chosen);
        const before = canonicalHash(state);
        state.processed_scenario_ids.push(input.scenario_id);
        state.choices.push({ candidate_id: chosen.candidate_id, restaurant_id: chosen.restaurant.id_restaurante, product_id: chosen.product.id_produto, category: chosen.product.categorias.nome, occurred_at: input.instant_utc });
        if (signal) state.generated_signals.push(signal);
        state.last_instant_utc = input.instant_utc;
        decisions.push({
            dataset_id: input.partition_id, persona_id: input.persona_id, virtual_week: input.virtual_week, virtual_day: input.virtual_day,
            scenario_index: input.scenario_index, scenario_id: input.scenario_id, instant_utc: input.instant_utc,
            common_input_sha256: input.common_input_sha256, candidate_set_sha256: canonicalHash(candidateIds(input)), state_before_sha256: before,
            state_after_sha256: canonicalHash(state), model_version: VERSION, native_choice_candidate_id: result.candidate_id,
            effective_choice_candidate_id: result.candidate_id, fallback_used: false, base_score: result.base_score, adjustment: result.adjustment,
            total_score: result.total_score, confidence: result.confidence, effective_samples: result.effective_samples,
            effective_volume: result.effective_volume, consistency: result.consistency, best_external_utility: utility.best,
            chosen_external_utility: chosenUtility, regret, reaction_type: reaction?.tipo ?? null, signal_created: signal !== null,
            eligible_signal_count: signals.length, technical_error_code: null, preference_precedence_applied: result.preference_precedence_applied,
            guardrails: { eligible_choice: candidateIds(input).includes(result.candidate_id), same_candidate_set: true, temporal_signal_barrier: true, synthetic_offline_only: true },
        });
    }
    const noHistory = decisions.filter((item) => item.persona_id === "controle_sem_historico").every((item) => item.adjustment === 0 && item.confidence === 0 && item.effective_samples === 0);
    requireCondition(noHistory, "NO_HISTORY_NOT_NEUTRAL");
    requireCondition(decisions.every((item) => item.guardrails.eligible_choice), "ELIGIBILITY_REGRESSION");
    const payload = {
        metadata: { schema_version: 1, report_schema: "routine-intelligence-v2-1-raw-v1", candidate_version: VERSION, dataset_id: snapshot.partition.id, scenarios_sha256: snapshot.scenarios_sha256, personas_sha256: snapshot.personas_sha256, synthetic_offline_only: true, reserve_accessed: false, formulas_changed: false },
        summary: { scenarios: decisions.length, model_executions: decisions.length, failures: 0, fallbacks: 0, eliminatory_violations: 0, no_history_neutral: noHistory, model_version: VERSION },
        decisions,
    };
    return { ...payload, content_sha256: canonicalHash(payload) };
}

function serializeCandidateReport(report) { return `${JSON.stringify(report, null, 2)}\n`; }
function metrics(report) {
    const records = report.decisions;
    const mean = (field) => Number((records.reduce((sum, item) => sum + Number(item[field] ?? 0), 0) / records.length).toFixed(6));
    return { scenarios: records.length, utility_mean: mean("chosen_external_utility"), regret_mean: mean("regret"), failures: report.summary.failures, fallbacks: report.summary.fallbacks, eliminatory_violations: report.summary.eliminatory_violations, no_history_neutral: report.summary.no_history_neutral };
}
function compareToBaseline(candidateReport, baselineReport, modelVersion) {
    const byId = new Map(baselineReport.decisions.filter((item) => item.model_version === modelVersion).map((item) => [item.scenario_id, item]));
    const pairs = candidateReport.decisions.map((left) => ({ left, right: byId.get(left.scenario_id) })).filter((item) => item.right);
    const regretDelta = pairs.map(({ left, right }) => left.regret - right.regret);
    const utilityDelta = pairs.map(({ left, right }) => left.chosen_external_utility - right.chosen_external_utility);
    const average = (values) => Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(6));
    return { model: modelVersion, paired: pairs.length, candidate_regret_mean: average(pairs.map(({ left }) => left.regret)), baseline_regret_mean: average(pairs.map(({ right }) => right.regret)), regret_delta_candidate_minus_baseline: average(regretDelta), utility_delta_candidate_minus_baseline: average(utilityDelta), candidate_wins_regret: regretDelta.filter((value) => value < -1e-9).length, baseline_wins_regret: regretDelta.filter((value) => value > 1e-9).length, ties: regretDelta.filter((value) => Math.abs(value) <= 1e-9).length };
}
module.exports = { VERSION, compareToBaseline, metrics, serializeCandidateReport, simulateCandidate };
