"use strict";

const { canonicalHash } = require("./routine-intelligence-partitions");

const ARTIFACT_KEYS = new Set([
    "schema_version", "guardrails_version", "registered_at", "purpose", "synthetic_offline_only",
    "contains_pii", "reserve_access_allowed", "frozen_thresholds", "classification_taxonomy", "guardrails",
]);
const RULE_KEYS = new Set([
    "id", "version", "objective", "risk", "inputs", "preconditions", "pass_rule", "fail_rule", "severity",
    "fallback", "evidence", "applicable_personas", "stage", "acceptance_criterion", "contains_pii",
]);
const SEVERITIES = new Set(["MEDIUM", "HIGH", "BLOCKER"]);
const STAGES = new Set(["PRE_RANKING", "PERSONALIZATION", "POST_DECISION"]);
const EXPLANATION_KEYS = new Set([
    "model_version", "base_score", "adjustment", "contributions", "confidence", "effective_samples",
    "effective_volume", "consistency", "guardrails_applied", "fallback_reason", "technical_error_code",
]);
const CONTRIBUTION_KEYS = new Set([
    "category_affinity", "restaurant_affinity", "product_affinity", "explicit_preference", "recency",
    "consistency", "repetition", "price", "distance", "novelty",
]);
const PRIVATE_KEY = /(email|phone|telefone|address|endereco|latitude|longitude|allerg|alerg|medical|medic|agenda|token|password|senha|jwt|service_role|signal|sinal)/i;

function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function requireCondition(condition, code) {
    if (!condition) throw new Error(`GUARDRAIL_INVALID: ${code}`);
}

function exactKeys(value, allowed, code) {
    requireCondition(object(value), `${code}_NOT_OBJECT`);
    for (const key of Object.keys(value)) requireCondition(allowed.has(key), `${code}_UNKNOWN_FIELD_${key}`);
}

function finite(value, code, { minimum = -Infinity, maximum = Infinity, nullable = false } = {}) {
    if (nullable && value === null) return;
    requireCondition(Number.isFinite(value) && value >= minimum && value <= maximum, code);
}

function validateGuardrailsArtifact(artifact) {
    exactKeys(artifact, ARTIFACT_KEYS, "ARTIFACT");
    requireCondition(artifact.schema_version === 1, "SCHEMA_VERSION");
    requireCondition(artifact.guardrails_version === "routine-intelligence-guardrails-v1", "VERSION");
    requireCondition(Number.isFinite(Date.parse(artifact.registered_at)), "REGISTERED_AT");
    requireCondition(artifact.synthetic_offline_only === true, "SYNTHETIC_ONLY");
    requireCondition(artifact.contains_pii === false, "PII_DECLARATION");
    requireCondition(artifact.reserve_access_allowed === false, "RESERVE_ACCESS");
    requireCondition(object(artifact.frozen_thresholds), "THRESHOLDS");
    requireCondition(artifact.frozen_thresholds.minimum_internal_confidence === 0.25, "CONFIDENCE_THRESHOLD");
    requireCondition(artifact.frozen_thresholds.v2_adjustment_minimum === -8, "ADJUSTMENT_MINIMUM");
    requireCondition(artifact.frozen_thresholds.v2_adjustment_maximum === 8, "ADJUSTMENT_MAXIMUM");
    requireCondition(artifact.frozen_thresholds.public_rollout_percent === 0, "PUBLIC_ROLLOUT");
    requireCondition(Array.isArray(artifact.classification_taxonomy) && artifact.classification_taxonomy.length >= 15, "TAXONOMY");
    requireCondition(new Set(artifact.classification_taxonomy).size === artifact.classification_taxonomy.length, "TAXONOMY_DUPLICATE");
    requireCondition(Array.isArray(artifact.guardrails) && artifact.guardrails.length >= 10, "RULE_COUNT");

    const ids = new Set();
    for (const rule of artifact.guardrails) {
        exactKeys(rule, RULE_KEYS, "RULE");
        requireCondition(/^[a-z][a-z0-9_]*$/.test(rule.id ?? ""), "RULE_ID");
        requireCondition(!ids.has(rule.id), `DUPLICATE_RULE_${rule.id}`);
        ids.add(rule.id);
        requireCondition(rule.version === 1, `RULE_VERSION_${rule.id}`);
        requireCondition(SEVERITIES.has(rule.severity), `RULE_SEVERITY_${rule.id}`);
        requireCondition(STAGES.has(rule.stage), `RULE_STAGE_${rule.id}`);
        for (const field of ["objective", "risk", "pass_rule", "fail_rule", "fallback", "acceptance_criterion"]) {
            requireCondition(typeof rule[field] === "string" && rule[field].length >= 3, `RULE_${field}_${rule.id}`);
        }
        for (const field of ["inputs", "preconditions", "evidence", "applicable_personas"]) {
            requireCondition(Array.isArray(rule[field]) && rule[field].length > 0, `RULE_${field}_${rule.id}`);
        }
        requireCondition(rule.contains_pii === false, `RULE_PII_${rule.id}`);
        requireCondition(!JSON.stringify(rule).includes("reserva_prospectiva"), `RULE_RESERVE_REFERENCE_${rule.id}`);
    }
    return artifact;
}

function signalInstant(signal) {
    return signal.occurred_at ?? signal.ocorreu_em ?? signal.criado_em ?? null;
}

function signalKey(signal) {
    return signal.idempotency_key ?? signal.chave_idempotencia ?? signal.id ?? null;
}

function filterEligibleBehaviorSignals(signals, {
    scenarioInstant,
    personaId,
    consentActive,
    consentGrantedAt = null,
    consentRevokedAt = null,
    processedKeys = new Set(),
} = {}) {
    requireCondition(Array.isArray(signals), "SIGNALS_NOT_ARRAY");
    const scenarioTime = Date.parse(scenarioInstant);
    requireCondition(Number.isFinite(scenarioTime), "SCENARIO_INSTANT");
    if (personaId === "controle_sem_historico" || consentActive !== true) return [];
    const grantedTime = consentGrantedAt === null ? -Infinity : Date.parse(consentGrantedAt);
    const revokedTime = consentRevokedAt === null ? Infinity : Date.parse(consentRevokedAt);
    requireCondition(Number.isFinite(grantedTime) || grantedTime === -Infinity, "CONSENT_GRANTED_AT");
    requireCondition(Number.isFinite(revokedTime) || revokedTime === Infinity, "CONSENT_REVOKED_AT");
    if (revokedTime <= scenarioTime) return [];

    const seen = new Set(processedKeys);
    const eligible = [];
    for (const signal of signals) {
        requireCondition(object(signal), "SIGNAL_NOT_OBJECT");
        const instant = signalInstant(signal);
        const instantTime = Date.parse(instant);
        const key = signalKey(signal);
        requireCondition(Number.isFinite(instantTime), "SIGNAL_INSTANT");
        requireCondition(typeof key === "string" && key.length > 0, "SIGNAL_IDEMPOTENCY_KEY");
        const synthetic = signal.synthetic_offline === true || signal.sintetico_offline === true;
        const active = signal.active !== false && signal.ativo !== false && signal.excluded_at == null && signal.excluido_em == null;
        const consentValid = signal.consent_valid === true || signal.consentimento_valido === true;
        const samePersona = signal.persona_id == null || signal.persona_id === personaId;
        if (!synthetic || !active || !consentValid || !samePersona) continue;
        if (instantTime < grantedTime || instantTime >= scenarioTime || instantTime >= revokedTime || seen.has(key)) continue;
        seen.add(key);
        eligible.push(structuredClone(signal));
    }
    return eligible.sort((left, right) => Date.parse(signalInstant(left)) - Date.parse(signalInstant(right)) || signalKey(left).localeCompare(signalKey(right)));
}

function sanitizeTechnicalExplanation(explanation) {
    exactKeys(explanation, EXPLANATION_KEYS, "EXPLANATION");
    for (const key of Object.keys(explanation)) requireCondition(!PRIVATE_KEY.test(key), `EXPLANATION_PRIVATE_FIELD_${key}`);
    requireCondition(typeof explanation.model_version === "string" && explanation.model_version.length > 0, "EXPLANATION_MODEL_VERSION");
    finite(explanation.base_score, "EXPLANATION_BASE_SCORE");
    finite(explanation.adjustment, "EXPLANATION_ADJUSTMENT", { minimum: -8, maximum: 8 });
    finite(explanation.confidence, "EXPLANATION_CONFIDENCE", { minimum: 0, maximum: 0.9 });
    finite(explanation.effective_samples, "EXPLANATION_SAMPLES", { minimum: 0 });
    finite(explanation.effective_volume, "EXPLANATION_VOLUME", { minimum: 0, nullable: true });
    finite(explanation.consistency, "EXPLANATION_CONSISTENCY", { minimum: 0, maximum: 1, nullable: true });
    exactKeys(explanation.contributions, CONTRIBUTION_KEYS, "CONTRIBUTIONS");
    for (const [key, value] of Object.entries(explanation.contributions)) {
        requireCondition(!PRIVATE_KEY.test(key), `CONTRIBUTION_PRIVATE_FIELD_${key}`);
        finite(value, `CONTRIBUTION_VALUE_${key}`);
    }
    requireCondition(Array.isArray(explanation.guardrails_applied), "EXPLANATION_GUARDRAILS");
    for (const value of explanation.guardrails_applied) requireCondition(/^[a-z][a-z0-9_]*$/.test(value), "EXPLANATION_GUARDRAIL_ID");
    for (const key of ["fallback_reason", "technical_error_code"]) {
        requireCondition(explanation[key] === null || /^[A-Z0-9_]+$/.test(explanation[key]), `EXPLANATION_${key}`);
    }
    return structuredClone(explanation);
}

function classifyRegression({ personaId, confidence, v2Regret, comparatorRegret, evidence = {} }) {
    const delta = Number(v2Regret) - Number(comparatorRegret);
    if (!(delta > 0.000001)) return "SEM_VIOLACAO_DE_GUARDRAIL";
    if (Number.isFinite(confidence) && confidence < 0.25) return "CONFIANCA_INSUFICIENTE";
    if (evidence.explicit_preference_lost === true) return "PREFERENCIA_EXPLICITA_PERDIDA";
    if (personaId === "sensivel_distancia" && evidence.v2_farther === true) return "DISTANCIA_MAL_PRIORIZADA";
    if (personaId === "economico" && evidence.v2_more_expensive === true) return "PRECO_MAL_PRIORIZADO";
    if (personaId === "contraditorio" && evidence.opposing_signals === true) return "CONTRADICAO_MAL_COMPENSADA";
    if (["fiel_prato", "fiel_restaurante"].includes(personaId) && evidence.favorite_lost === true) return "FAVORITO_IGNORADO";
    return "HIPOTESE_PARA_V2_1";
}

function auditFrozenGuardrails({ artifact, rawReports, snapshots = [], personasArtifact = null }) {
    validateGuardrailsArtifact(artifact);
    requireCondition(Array.isArray(rawReports) && rawReports.length > 0, "REPORTS_REQUIRED");
    const regressions = [];
    const datasetSummaries = [];
    let eligibleChecks = 0;
    let temporalChecks = 0;
    let noHistoryChecks = 0;
    const scenarioById = new Map(snapshots.flatMap((snapshot) => snapshot.scenarios ?? []).map((scenario) => [scenario.scenario_id, scenario]));
    const personaById = new Map((personasArtifact?.personas ?? []).map((persona) => [persona.id, persona]));

    for (const report of rawReports) {
        requireCondition(report?.metadata?.reserve_accessed === false, "REPORT_RESERVE_ACCESSED");
        requireCondition(!/reserva/i.test(report.metadata.dataset_id ?? ""), "REPORT_RESERVE_DATASET");
        requireCondition(Array.isArray(report.decisions), "REPORT_DECISIONS");
        const groups = new Map();
        for (const decision of report.decisions) {
            requireCondition(decision.guardrails?.eligible_choice === true, "INELIGIBLE_CHOICE");
            requireCondition(decision.guardrails?.same_candidate_set === true, "CANDIDATE_SET_DIVERGENCE");
            requireCondition(decision.guardrails?.temporal_signal_barrier === true, "TEMPORAL_LEAKAGE");
            eligibleChecks += 1;
            temporalChecks += 1;
            if (decision.persona_id === "controle_sem_historico" && decision.model_version === "appono-intelligence-v2") {
                requireCondition(decision.adjustment === 0 && decision.confidence === 0 && decision.effective_volume === 0, "NO_HISTORY_NOT_NEUTRAL");
                noHistoryChecks += 1;
            }
            const key = `${decision.dataset_id}:${decision.scenario_id}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(decision);
        }

        for (const decisions of groups.values()) {
            const v2 = decisions.find((item) => item.model_version === "appono-intelligence-v2");
            if (!v2) continue;
            for (const comparator of decisions.filter((item) => item.model_version !== "appono-intelligence-v2")) {
                if (v2.native_choice_candidate_id === comparator.native_choice_candidate_id) continue;
                const delta = Number((v2.regret - comparator.regret).toFixed(6));
                if (!(delta > 0)) continue;
                const scenario = scenarioById.get(v2.scenario_id);
                const persona = personaById.get(v2.persona_id);
                const candidates = new Map((scenario?.catalog ?? []).map((candidate) => [candidate.candidate_id, candidate]));
                const v2Candidate = candidates.get(v2.native_choice_candidate_id);
                const comparatorCandidate = candidates.get(comparator.native_choice_candidate_id);
                const preferredCategories = new Set(persona?.perfil?.preferencias_explicitas ?? scenario?.profile?.explicit_preferences ?? []);
                const positive = (scenario?.history?.signals ?? []).filter((signal) => Number(signal.value) > 0).map((signal) => signal.category);
                const negative = (scenario?.history?.signals ?? []).filter((signal) => Number(signal.value) < 0).map((signal) => signal.category);
                const evidence = {
                    explicit_preference_lost: Boolean(v2Candidate && comparatorCandidate && preferredCategories.has(comparatorCandidate.category) && !preferredCategories.has(v2Candidate.category)),
                    v2_farther: Boolean(v2Candidate && comparatorCandidate && v2Candidate.distance_km > comparatorCandidate.distance_km),
                    v2_more_expensive: Boolean(v2Candidate && comparatorCandidate && v2Candidate.price > comparatorCandidate.price),
                    opposing_signals: positive.some((category) => negative.includes(category)),
                    favorite_lost: Boolean(v2Candidate && comparatorCandidate && (
                        (persona?.afinidades?.restaurantes?.[comparatorCandidate.restaurant_id] > 0 && persona?.afinidades?.restaurantes?.[v2Candidate.restaurant_id] == null)
                        || (persona?.afinidades?.produtos?.[comparatorCandidate.product_id] > 0 && persona?.afinidades?.produtos?.[v2Candidate.product_id] == null)
                    )),
                };
                regressions.push({
                    dataset_id: v2.dataset_id,
                    scenario_id: v2.scenario_id,
                    persona_id: v2.persona_id,
                    virtual_week: v2.virtual_week,
                    scenario_index: v2.scenario_index,
                    comparator_version: comparator.model_version,
                    v2_choice_candidate_id: v2.native_choice_candidate_id,
                    comparator_choice_candidate_id: comparator.native_choice_candidate_id,
                    v2_regret: v2.regret,
                    comparator_regret: comparator.regret,
                    regret_delta: delta,
                    v2_confidence: v2.confidence,
                    relevant_alternatives: [v2Candidate, comparatorCandidate].filter(Boolean).map((candidate) => ({
                        candidate_id: candidate.candidate_id,
                        category: candidate.category,
                        price: candidate.price,
                        distance_km: candidate.distance_km,
                    })),
                    explicit_preferences: [...preferredCategories],
                    evidence,
                    classification: classifyRegression({
                        personaId: v2.persona_id,
                        confidence: v2.confidence,
                        v2Regret: v2.regret,
                        comparatorRegret: comparator.regret,
                        evidence,
                    }),
                });
            }
        }
        datasetSummaries.push({
            dataset_id: report.metadata.dataset_id,
            executions: report.decisions.length,
            eliminatory_violations: report.summary.eliminatory_violations,
            no_history_v2_neutral: report.summary.no_history_v2_neutral,
            reserve_accessed: report.metadata.reserve_accessed,
        });
    }

    regressions.sort((left, right) => right.regret_delta - left.regret_delta || left.scenario_id.localeCompare(right.scenario_id));
    const uniqueBlindCases = [];
    const usedScenarios = new Set();
    for (const item of regressions) {
        const key = `${item.dataset_id}:${item.scenario_id}`;
        if (usedScenarios.has(key)) continue;
        usedScenarios.add(key);
        uniqueBlindCases.push(item);
        if (uniqueBlindCases.length === 24) break;
    }
    const blindReviewCandidates = uniqueBlindCases.map((item, index) => ({
        blind_case_id: canonicalHash({ version: "blind-review-candidate-v1", dataset: item.dataset_id, scenario: item.scenario_id, comparator: item.comparator_version }).slice(0, 24),
        source_dataset: item.dataset_id,
        scenario_id: item.scenario_id,
        persona_id: item.persona_id,
        virtual_week: item.virtual_week,
        scenario_index: item.scenario_index,
        inclusion_reason: item.classification,
        external_utility_gap: item.regret_delta,
        priority: index + 1,
    }));
    const counts = Object.fromEntries(artifact.classification_taxonomy.map((id) => [id, 0]));
    for (const item of regressions) counts[item.classification] += 1;

    const report = {
        schema_version: "routine-intelligence-guardrail-audit-v1",
        guardrails_version: artifact.guardrails_version,
        guardrails_sha256: canonicalHash(artifact),
        synthetic_offline_only: true,
        reserve_accessed: false,
        datasets: datasetSummaries,
        matrix: artifact.guardrails.map((rule) => ({
            guardrail_id: rule.id,
            severity: rule.severity,
            status: ["eligible_candidates_only", "no_history_neutral", "temporal_causality"].includes(rule.id) ? "PASS" : "COVERED_BY_CONTRACT_TEST",
            checked_cases: rule.id === "eligible_candidates_only" ? eligibleChecks : rule.id === "temporal_causality" ? temporalChecks : rule.id === "no_history_neutral" ? noHistoryChecks : 0,
        })),
        regression_summary: {
            total_classified: regressions.length,
            by_classification: counts,
        },
        regressions,
        blind_review_candidates: blindReviewCandidates,
        limitations: [
            "Dados e reacoes sao sinteticos e offline.",
            "Resultado desfavoravel sem violacao de guardrail permanece hipotese para decisao posterior.",
            "A auditoria nao executa modelos nem acessa a reserva.",
        ],
    };
    return { ...report, canonical_sha256: canonicalHash(report) };
}

module.exports = {
    auditFrozenGuardrails,
    classifyRegression,
    filterEligibleBehaviorSignals,
    sanitizeTechnicalExplanation,
    validateGuardrailsArtifact,
};
