"use strict";

const crypto = require("node:crypto");
const { MODELO_RECOMENDACAO_ROTINA, penalidadeRepeticao, pontuarCandidato } = require("./routine-scoring");
const { MODELO_INTELIGENCIA_ROTINA, pontuarInteligenciaRotina } = require("./routine-intelligence");
const { MODELO_INTELIGENCIA_ROTINA_V2, pontuarInteligenciaRotinaV2 } = require("./routine-intelligence-v2");
const {
    LONGITUDINAL_CONTRACT_VERSION,
    cloneCommonInput,
    createCommonInput,
    orderLongitudinalScenarios,
} = require("./routine-intelligence-longitudinal-contract");
const { avaliarUtilidadePersona, reagirPersona } = require("./routine-intelligence-personas");
const { canonicalHash } = require("./routine-intelligence-partitions");
const { validateScenarioSnapshot } = require("./routine-intelligence-scenario-generator");
const { ordenarPorPontuacao } = require("./routine-shadow-evaluation");

const LONGITUDINAL_SIMULATION_VERSION = "routine-longitudinal-simulation-v1";
const RAW_REPORT_SCHEMA_VERSION = "routine-longitudinal-raw-report-v1";
const MODEL_VERSIONS = Object.freeze([
    MODELO_RECOMENDACAO_ROTINA.versao,
    MODELO_INTELIGENCIA_ROTINA.versao,
    MODELO_INTELIGENCIA_ROTINA_V2.versao,
]);
const ALLOWED_DATASETS = new Set(["desenvolvimento_v1", "validacao_v1"]);

function requireCondition(condition, code) {
    if (!condition) throw new Error(`LONGITUDINAL_SIMULATION_INVALID: ${code}`);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function stableNumericId(value) {
    requireCondition(typeof value === "string" && value.length > 0, "SYNTHETIC_ID_REQUIRED");
    return Number.parseInt(crypto.createHash("sha256").update(value).digest("hex").slice(0, 12), 16);
}

function finite(value, code) {
    const number = Number(value);
    requireCondition(Number.isFinite(number), code);
    return number;
}

function validateProtocol(protocol, { snapshot, partitionsArtifact, personasArtifact }) {
    requireCondition(protocol?.schema_version === 1, "PROTOCOL_SCHEMA");
    requireCondition(protocol.protocol_version === "appono-intelligence-longitudinal-prospective-v1", "PROTOCOL_VERSION");
    requireCondition(protocol.executor_version === LONGITUDINAL_SIMULATION_VERSION, "EXECUTOR_VERSION");
    requireCondition(protocol.contract?.version === LONGITUDINAL_CONTRACT_VERSION, "CONTRACT_VERSION");
    requireCondition(protocol.report?.schema_version === RAW_REPORT_SCHEMA_VERSION, "REPORT_SCHEMA");
    requireCondition(protocol.calibration_allowed === false, "CALIBRATION_MUST_BE_DISABLED");
    requireCondition(protocol.synthetic_offline_only === true, "SYNTHETIC_ONLY_REQUIRED");
    requireCondition(protocol.reserve?.prospective_state === "SEALED_UNMATERIALIZED", "RESERVE_NOT_SEALED");
    requireCondition(protocol.reserve?.access_allowed === false, "RESERVE_ACCESS_FORBIDDEN");
    requireCondition(ALLOWED_DATASETS.has(snapshot?.partition?.id), "DATASET_NOT_ALLOWED");
    requireCondition(!/reserva|reserve/i.test(snapshot.partition.id), "RESERVE_IS_SEALED");
    requireCondition(protocol.personas?.canonical_sha256 === snapshot.personas_sha256, "PERSONAS_HASH_MISMATCH");
    requireCondition(protocol.partitions?.canonical_sha256 === snapshot.partitions_sha256, "PARTITIONS_HASH_MISMATCH");
    requireCondition(protocol.personas.canonical_sha256 === canonicalHash(personasArtifact), "PERSONAS_ARTIFACT_MISMATCH");
    requireCondition(protocol.partitions.canonical_sha256 === canonicalHash(partitionsArtifact), "PARTITIONS_ARTIFACT_MISMATCH");
    requireCondition(protocol.snapshots?.[snapshot.partition.id]?.scenarios === snapshot.total_scenarios, "SNAPSHOT_COUNT_MISMATCH");
    requireCondition(protocol.models.map((item) => item.version).join("|") === MODEL_VERSIONS.join("|"), "MODEL_LIST_MISMATCH");
    return protocol;
}

function personaMap(personasArtifact) {
    return new Map(personasArtifact.personas.map((persona) => [persona.id, persona]));
}

function candidateIds(input) {
    return input.eligible_candidates.map((candidate) => candidate.candidate_id);
}

function toDomainCandidate(candidate) {
    return {
        candidate_id: candidate.candidate_id,
        restaurante: {
            id_restaurante: stableNumericId(candidate.restaurant.id_restaurante),
            nome: candidate.restaurant.nome,
        },
        produto: {
            id_produto: stableNumericId(candidate.product.id_produto),
            nome: candidate.product.nome,
            categorias: { nome: candidate.product.categorias.nome },
        },
        preco_estimado: finite(candidate.preco_estimado, "CANDIDATE_PRICE_INVALID"),
        distancia_km: finite(candidate.distancia_km, "CANDIDATE_DISTANCE_INVALID"),
        avaliacao: finite(candidate.avaliacao, "CANDIDATE_RATING_INVALID"),
        score_operacional: finite(candidate.score_operacional, "CANDIDATE_OPERATIONAL_SCORE_INVALID"),
    };
}

function toUtilityCandidate(candidate) {
    return {
        id_restaurante: candidate.restaurant.id_restaurante,
        id_produto: candidate.product.id_produto,
        categoria: candidate.product.categorias.nome,
        preco: candidate.preco_estimado,
        distancia: candidate.distancia_km,
    };
}

function normalizeSignal(signal) {
    const reactionType = String(signal.event_type ?? signal.tipo_evento ?? "").toUpperCase();
    const modelEventType = reactionType === "CONVERSAO_SIMULADA" ? "APROVACAO" : reactionType;
    const positive = ["APROVACAO", "EDICAO", "CONVERSAO_SIMULADA", "CONVERSAO_PEDIDO", "CONVERSAO_RESERVA", "FEEDBACK_POSITIVO"].includes(reactionType);
    const restaurantId = signal.restaurant_id ?? signal.id_restaurante ?? null;
    const productId = signal.product_id ?? signal.id_produto ?? null;
    return {
        id_sinal: signal.signal_id ?? signal.id_sinal ?? signal.idempotency_key,
        tipo_evento: modelEventType,
        gostou: positive,
        repetiria: reactionType === "CONVERSAO_SIMULADA" || reactionType === "CONVERSAO_PEDIDO" || reactionType === "CONVERSAO_RESERVA",
        consentiu_personalizacao: signal.consent_valid === true,
        criado_em: signal.occurred_at,
        id_restaurante: restaurantId ? stableNumericId(String(restaurantId)) : null,
        id_produto: productId ? stableNumericId(String(productId)) : null,
        categoria: signal.category ?? signal.categoria ?? null,
        preco_estimado: signal.price ?? signal.preco_estimado ?? null,
        distancia_km: signal.distance_km ?? signal.distancia_km ?? null,
        tipo_janela: signal.meal_window ?? signal.tipo_janela ?? null,
    };
}

function historyForState(input, state) {
    return [...input.recent_choices, ...state.choices].map((choice) => ({
        id_restaurante: choice.restaurant_id ?? choice.id_restaurante,
        id_produto: choice.product_id ?? choice.id_produto,
        categoria: choice.category ?? choice.categoria,
        occurred_at: choice.occurred_at,
    }));
}

function countHistory(history, key, value) {
    return history.filter((item) => String(item[key] ?? "") === String(value ?? "")).length;
}

function scoreControlCandidate(persona, candidate, history) {
    const utilityCandidate = toUtilityCandidate(candidate);
    const base = pontuarCandidato({
        favoritoRestaurante: Number(persona.afinidades.restaurantes[utilityCandidate.id_restaurante] ?? 0) >= 3,
        dentroOrcamento: Number(utilityCandidate.preco) <= Number(persona.perfil.orcamento),
        perto: Number(utilityCandidate.distancia) < 2,
        bemAvaliado: Number(candidate.avaliacao) > 4,
        combinaPreferencia: persona.perfil.preferencias_explicitas.includes(utilityCandidate.categoria),
        scoreOperacional: candidate.score_operacional,
    });
    const repetition = penalidadeRepeticao({
        restaurantes: countHistory(history, "id_restaurante", utilityCandidate.id_restaurante),
        produtos: countHistory(history, "id_produto", utilityCandidate.id_produto),
        categorias: countHistory(history, "categoria", utilityCandidate.categoria),
    });
    return {
        score: Number((base.pontuacao - repetition).toFixed(2)),
        components: { ...base.componentes, penalidade_repeticao: -repetition },
    };
}

function rankModel({ modelVersion, input, persona, state, signals }) {
    requireCondition(MODEL_VERSIONS.includes(modelVersion), "MODEL_NOT_ALLOWED");
    const history = historyForState(input, state);
    const normalizedSignals = signals.map(normalizeSignal);
    const previous = state.choices.at(-1) ?? input.recent_choices.at(-1) ?? null;
    const scored = input.eligible_candidates.map((candidate) => {
        const domainCandidate = toDomainCandidate(candidate);
        const control = scoreControlCandidate(persona, candidate, history);
        let intelligence = { ajuste: 0, confianca: null, amostras: 0, volume_efetivo: null, consistencia: null, contribuicoes: {} };
        if (modelVersion === MODELO_INTELIGENCIA_ROTINA.versao) {
            intelligence = pontuarInteligenciaRotina({
                candidato: domainCandidate,
                perfil: { orcamento_diario: input.profile.budget, raio_km: input.profile.radius_km },
                feedbacks: normalizedSignals,
                tipoJanela: input.meal_window,
            });
        } else if (modelVersion === MODELO_INTELIGENCIA_ROTINA_V2.versao) {
            intelligence = pontuarInteligenciaRotinaV2({
                candidato: domainCandidate,
                sinais: normalizedSignals,
                tipoJanela: input.meal_window,
                referencia: input.instant_utc,
                sequencia: {
                    id_restaurante_anterior: previous ? stableNumericId(String(previous.restaurant_id ?? previous.id_restaurante)) : null,
                    id_produto_anterior: previous ? stableNumericId(String(previous.product_id ?? previous.id_produto)) : null,
                },
            });
        }
        const totalScore = Number((control.score + Number(intelligence.ajuste ?? 0)).toFixed(2));
        requireCondition(Number.isFinite(totalScore), "MODEL_SCORE_NOT_FINITE");
        return {
            ...clone(candidate),
            pontuacao_modelo: totalScore,
            base_score: control.score,
            adjustment: Number(intelligence.ajuste ?? 0),
            confidence: intelligence.confianca ?? null,
            effective_samples: Number(intelligence.amostras ?? 0),
            effective_volume: intelligence.volume_efetivo ?? null,
            consistency: intelligence.consistencia ?? null,
            contributions: modelVersion === MODELO_RECOMENDACAO_ROTINA.versao ? control.components : intelligence.contribuicoes,
        };
    });
    const ranked = ordenarPorPontuacao(scored.map((item) => ({
        ...item,
        restaurante: item.restaurant,
        produto: item.product,
        preco_estimado: item.preco_estimado,
        distancia_km: item.distancia_km,
    })), "pontuacao_modelo");
    const choice = ranked[0];
    requireCondition(choice && candidateIds(input).includes(choice.candidate_id), "MODEL_CHOICE_NOT_ELIGIBLE");
    return {
        model_version: modelVersion,
        candidate_id: choice.candidate_id,
        base_score: choice.base_score,
        adjustment: choice.adjustment,
        total_score: choice.pontuacao_modelo,
        confidence: choice.confidence,
        effective_samples: choice.effective_samples,
        effective_volume: choice.effective_volume,
        consistency: choice.consistency,
        contributions: choice.contributions,
    };
}

function createState(datasetId, personaId, modelVersion) {
    return {
        dataset_id: datasetId,
        persona_id: personaId,
        model_version: modelVersion,
        processed_scenario_ids: [],
        choices: [],
        generated_signals: [],
        failures: [],
        last_instant_utc: null,
    };
}

function stateHash(state) {
    return canonicalHash(state);
}

function createGeneratedSignal({ input, modelVersion, reaction, candidate }) {
    if (!reaction) return null;
    const teachesChoice = reaction.tipo !== "EDICAO";
    const values = {
        APROVACAO: 1,
        RECUSA: -1,
        ALTERNATIVA: -0.6,
        EDICAO: 0,
        CONVERSAO_SIMULADA: 1.5,
    };
    return {
        signal_id: `generated:${input.partition_id}:${input.persona_id}:${modelVersion}:${input.scenario_id}`,
        idempotency_key: `offline:${input.partition_id}:${input.persona_id}:${modelVersion}:${input.scenario_id}:${reaction.tipo}`,
        event_type: reaction.tipo,
        occurred_at: input.instant_utc,
        category: teachesChoice ? candidate.product.categorias.nome : null,
        restaurant_id: teachesChoice ? candidate.restaurant.id_restaurante : null,
        product_id: teachesChoice ? candidate.product.id_produto : null,
        price: teachesChoice ? candidate.preco_estimado : null,
        distance_km: teachesChoice ? candidate.distancia_km : null,
        meal_window: teachesChoice ? input.meal_window : null,
        value: values[reaction.tipo],
        consent_valid: true,
        active: true,
        synthetic_offline: true,
    };
}

function availableSignals(input, state) {
    const instant = Date.parse(input.instant_utc);
    const generated = state.generated_signals.filter((signal) => {
        requireCondition(Date.parse(signal.occurred_at) < instant, "GENERATED_SIGNAL_NOT_PRIOR");
        return signal.active === true && signal.consent_valid === true && signal.synthetic_offline === true;
    });
    const combined = [...input.eligible_signals, ...generated];
    const keys = new Set();
    return combined.filter((signal) => {
        if (keys.has(signal.idempotency_key)) return false;
        keys.add(signal.idempotency_key);
        return true;
    });
}

function utilityForCandidates({ input, persona, state, signals }) {
    const history = historyForState(input, state);
    const personaSignals = signals.map((signal) => ({
        categoria: signal.category ?? signal.categoria ?? null,
        id_restaurante: signal.restaurant_id ?? signal.id_restaurante ?? null,
        id_produto: signal.product_id ?? signal.id_produto ?? null,
        valor: signal.value ?? 0,
    }));
    const utilities = new Map();
    for (const candidate of input.eligible_candidates) {
        const result = avaliarUtilidadePersona(persona, toUtilityCandidate(candidate), {
            semana: input.virtual_week,
            indice: input.scenario_index,
            semente: input.partition_id,
            historico: history,
            sinais: personaSignals,
        });
        requireCondition(result.elegivel && Number.isFinite(result.utilidade), "EXTERNAL_UTILITY_INVALID");
        utilities.set(candidate.candidate_id, result.utilidade);
    }
    return { utilities, best: Math.max(...utilities.values()) };
}

function executeSafely(args, overrides = {}) {
    try {
        const executor = overrides[args.modelVersion] ?? rankModel;
        return { ok: true, result: executor(args) };
    } catch (error) {
        return { ok: false, error_code: String(error?.message ?? "MODEL_EXECUTION_FAILED").split(":")[0] };
    }
}

function simulateLongitudinal({ snapshot, partitionsArtifact, personasArtifact, protocol, modelOverrides = {} }) {
    validateScenarioSnapshot(snapshot, { partitionsArtifact, personasArtifact });
    validateProtocol(protocol, { snapshot, partitionsArtifact, personasArtifact });
    const plan = orderLongitudinalScenarios(snapshot);
    const personas = personaMap(personasArtifact);
    const states = new Map();
    for (const personaId of plan.persona_ids) {
        for (const modelVersion of MODEL_VERSIONS) {
            states.set(`${snapshot.partition.id}:${personaId}:${modelVersion}`, createState(snapshot.partition.id, personaId, modelVersion));
        }
    }

    const decisions = [];
    const ignoredSignals = { control: 0, inactive: 0, no_consent: 0, duplicate: 0 };
    const reactionCounts = {};
    const failureCounts = Object.fromEntries(MODEL_VERSIONS.map((model) => [model, 0]));
    let fallbackCount = 0;
    let divergenceCount = 0;

    for (const scenario of plan.ordered) {
        const persona = personas.get(scenario.persona_id);
        requireCondition(persona, "PERSONA_NOT_FOUND");
        const prepared = createCommonInput(scenario);
        for (const key of Object.keys(ignoredSignals)) ignoredSignals[key] += prepared.ignored_signals[key];
        const input = prepared.input;
        const expectedCandidateHash = canonicalHash(candidateIds(input));
        const executions = new Map();
        for (const modelVersion of MODEL_VERSIONS) {
            const state = states.get(`${input.partition_id}:${input.persona_id}:${modelVersion}`);
            requireCondition(state && !state.processed_scenario_ids.includes(input.scenario_id), "SCENARIO_ALREADY_PROCESSED");
            const signals = input.persona_id === "controle_sem_historico" ? [] : availableSignals(input, state);
            const modelInput = cloneCommonInput(input);
            requireCondition(canonicalHash(candidateIds(modelInput)) === expectedCandidateHash, "MODEL_CANDIDATES_DIFFER");
            const beforeHash = stateHash(state);
            const utility = utilityForCandidates({ input: modelInput, persona, state, signals });
            const execution = executeSafely({ modelVersion, input: modelInput, persona, state, signals }, modelOverrides);
            executions.set(modelVersion, { execution, state, signals, utility, beforeHash });
        }

        const controlExecution = executions.get(MODELO_RECOMENDACAO_ROTINA.versao).execution;
        const controlChoice = controlExecution.ok ? controlExecution.result.candidate_id : null;
        for (const modelVersion of MODEL_VERSIONS) {
            const item = executions.get(modelVersion);
            const { execution, state, signals, utility, beforeHash } = item;
            const nativeChoiceId = execution.ok ? execution.result.candidate_id : null;
            const fallbackUsed = !execution.ok && modelVersion !== MODELO_RECOMENDACAO_ROTINA.versao && controlChoice !== null;
            const effectiveChoiceId = nativeChoiceId ?? (fallbackUsed ? controlChoice : null);
            if (!execution.ok) {
                failureCounts[modelVersion] += 1;
                state.failures.push({ scenario_id: input.scenario_id, error_code: execution.error_code });
            }
            if (fallbackUsed) fallbackCount += 1;
            if (modelVersion !== MODELO_RECOMENDACAO_ROTINA.versao && nativeChoiceId && controlChoice && nativeChoiceId !== controlChoice) divergenceCount += 1;

            let reaction = null;
            let generatedSignal = null;
            let chosenUtility = null;
            let regret = null;
            if (nativeChoiceId) {
                chosenUtility = utility.utilities.get(nativeChoiceId);
                requireCondition(Number.isFinite(chosenUtility), "CHOSEN_UTILITY_MISSING");
                regret = Number((utility.best - chosenUtility).toFixed(6));
                requireCondition(regret >= -0.000001, "NEGATIVE_REGRET");
                reaction = reagirPersona(persona, {
                    utilidade: chosenUtility,
                    melhor_utilidade: utility.best,
                    chave: `${input.partition_id}:${modelVersion}:${input.scenario_id}`,
                });
                const chosen = input.eligible_candidates.find((candidate) => candidate.candidate_id === nativeChoiceId);
                generatedSignal = createGeneratedSignal({ input, modelVersion, reaction, candidate: chosen });
                state.choices.push({
                    candidate_id: chosen.candidate_id,
                    restaurant_id: chosen.restaurant.id_restaurante,
                    product_id: chosen.product.id_produto,
                    category: chosen.product.categorias.nome,
                    occurred_at: input.instant_utc,
                });
                if (generatedSignal) state.generated_signals.push(generatedSignal);
                if (reaction) reactionCounts[reaction.tipo] = (reactionCounts[reaction.tipo] ?? 0) + 1;
            }
            state.processed_scenario_ids.push(input.scenario_id);
            state.last_instant_utc = input.instant_utc;
            const result = execution.ok ? execution.result : null;
            decisions.push({
                dataset_id: input.partition_id,
                persona_id: input.persona_id,
                virtual_week: input.virtual_week,
                virtual_day: input.virtual_day,
                scenario_index: input.scenario_index,
                scenario_id: input.scenario_id,
                instant_utc: input.instant_utc,
                common_input_sha256: input.common_input_sha256,
                candidate_set_sha256: expectedCandidateHash,
                state_before_sha256: beforeHash,
                state_after_sha256: stateHash(state),
                model_version: modelVersion,
                native_choice_candidate_id: nativeChoiceId,
                effective_choice_candidate_id: effectiveChoiceId,
                fallback_used: fallbackUsed,
                base_score: result?.base_score ?? null,
                adjustment: result?.adjustment ?? null,
                total_score: result?.total_score ?? null,
                confidence: result?.confidence ?? null,
                effective_samples: result?.effective_samples ?? 0,
                effective_volume: result?.effective_volume ?? null,
                consistency: result?.consistency ?? null,
                best_external_utility: utility.best,
                chosen_external_utility: chosenUtility,
                regret,
                reaction_type: reaction?.tipo ?? null,
                signal_created: generatedSignal !== null,
                eligible_signal_count: signals.length,
                technical_error_code: execution.ok ? null : execution.error_code,
                guardrails: {
                    eligible_choice: nativeChoiceId === null || candidateIds(input).includes(nativeChoiceId),
                    same_candidate_set: true,
                    temporal_signal_barrier: true,
                    synthetic_offline_only: true,
                },
            });
        }
    }

    const controlNoHistory = decisions.filter((item) => item.persona_id === "controle_sem_historico" && item.model_version === MODELO_INTELIGENCIA_ROTINA_V2.versao);
    const neutralNoHistory = controlNoHistory.every((item) => item.technical_error_code !== null
        || (item.adjustment === 0 && item.confidence === 0 && item.effective_samples === 0));
    const metadata = {
        schema_version: RAW_REPORT_SCHEMA_VERSION,
        executor_version: LONGITUDINAL_SIMULATION_VERSION,
        protocol_version: protocol.protocol_version,
        contract_version: LONGITUDINAL_CONTRACT_VERSION,
        dataset_id: snapshot.partition.id,
        snapshot_file_sha256: protocol.snapshots[snapshot.partition.id].file_sha256,
        scenarios_sha256: snapshot.scenarios_sha256,
        personas_version: snapshot.personas_version,
        personas_sha256: snapshot.personas_sha256,
        partitions_version: snapshot.partitions_version,
        partitions_sha256: snapshot.partitions_sha256,
        model_versions: MODEL_VERSIONS,
        external_utility_version: protocol.external_utility.version,
        synthetic_offline_only: true,
        reserve_accessed: false,
    };
    const summary = {
        personas: plan.persona_ids.length,
        weeks_per_persona: snapshot.partition.weeks,
        scenarios: plan.ordered.length,
        model_executions: decisions.length,
        executions_by_model: Object.fromEntries(MODEL_VERSIONS.map((model) => [model, decisions.filter((item) => item.model_version === model).length])),
        failures_by_model: failureCounts,
        fallbacks: fallbackCount,
        divergent_challenger_choices: divergenceCount,
        ignored_exogenous_signals: ignoredSignals,
        reactions: Object.fromEntries(Object.entries(reactionCounts).sort()),
        no_history_v2_neutral: neutralNoHistory,
        eliminatory_violations: decisions.filter((item) => !item.guardrails.eligible_choice || !item.guardrails.same_candidate_set).length,
        dataset_valid: failureCounts[MODELO_RECOMENDACAO_ROTINA.versao] === 0,
        sequence_hashes: plan.sequence_hashes,
    };
    requireCondition(decisions.length === snapshot.total_scenarios * MODEL_VERSIONS.length, "EXECUTION_COUNT_MISMATCH");
    requireCondition(neutralNoHistory, "NO_HISTORY_V2_NOT_NEUTRAL");
    requireCondition(summary.eliminatory_violations === 0, "ELIMINATORY_VIOLATION");
    const payload = { metadata, summary, decisions };
    return { ...payload, content_sha256: canonicalHash(payload) };
}

function serializeReport(report) {
    requireCondition(report?.content_sha256 === canonicalHash({ metadata: report.metadata, summary: report.summary, decisions: report.decisions }), "REPORT_HASH_MISMATCH");
    return `${JSON.stringify(report, null, 2)}\n`;
}

module.exports = {
    LONGITUDINAL_SIMULATION_VERSION,
    MODEL_VERSIONS,
    RAW_REPORT_SCHEMA_VERSION,
    createGeneratedSignal,
    normalizeSignal,
    rankModel,
    serializeReport,
    simulateLongitudinal,
    stableNumericId,
    validateProtocol,
};
