"use strict";

const { canonicalHash } = require("./routine-intelligence-partitions");

const DECISION_PROTOCOL_VERSION = "routine-technical-decision-v1";
const HYPOTHESES_VERSION = "routine-technical-hypotheses-v1";
const DECISION_REPORT_VERSION = "routine-technical-decision-report-v1";
const V2 = "appono-intelligence-v2";
const CONTROL = "deterministico-v3";
const V1 = "appono-intelligence-v1";
const PROTOCOL_FIELDS = new Set([
    "schema_version", "decision_protocol_version", "registered_at", "timezone", "purpose", "state",
    "synthetic_offline_only", "contains_pii", "reserve_access_allowed", "formula_changes_allowed",
    "public_rollout_percent", "source_artifacts", "evidence_order", "human_review_policy",
    "hypothesis_acceptance_requirements", "candidate_hypotheses", "allowed_hypothesis_statuses",
    "allowed_substantive_decisions", "allowed_milestone_decisions", "decision_policy", "prohibited_actions",
]);
const SUBMISSION_FIELDS = new Set([
    "schema_version", "package_content_sha256", "reviewer_code", "human_supplied", "synthetic_fixture",
    "responses", "content_sha256",
]);
const RESPONSE_FIELDS = new Set(["blind_case_id", "choice", "reason_codes", "review_confidence", "optional_note"]);
const HYPOTHESIS_FIELDS = new Set([
    "id", "problem", "source_classifications", "required_acceptance_criterion", "fixture_reference",
    "mechanism_confirmed_by_frozen_evidence", "uses_reserve", "removes_cases", "score_tuning",
    "changes_eliminatory_filters", "weakens_signal_safety", "preserves_no_history_neutrality",
    "has_objective_abandonment_criterion",
]);
const PRIVATE_TEXT = /(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:access|refresh)[_-]?token\b|\bservice_role\b|\bjwt\b|\bsenha\b|\bpassword\b|\balerg|condicao medica|endere[cç]o|latitude|longitude)/i;

function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function requireCondition(condition, code) {
    if (!condition) throw new Error(`TECHNICAL_DECISION_INVALID: ${code}`);
}

function hashWithout(value, field) {
    const copy = structuredClone(value);
    delete copy[field];
    return canonicalHash(copy);
}

function validateTechnicalDecisionProtocol(protocol) {
    requireCondition(object(protocol), "PROTOCOL_NOT_OBJECT");
    requireCondition(Object.keys(protocol).every((key) => PROTOCOL_FIELDS.has(key)), "PROTOCOL_UNKNOWN_FIELD");
    requireCondition(protocol.schema_version === 1, "PROTOCOL_SCHEMA");
    requireCondition(protocol.decision_protocol_version === DECISION_PROTOCOL_VERSION, "PROTOCOL_VERSION");
    requireCondition(protocol.state === "REGISTERED_BEFORE_HUMAN_AGGREGATION", "PROTOCOL_STATE");
    requireCondition(protocol.synthetic_offline_only === true && protocol.contains_pii === false, "PROTOCOL_PRIVACY");
    requireCondition(protocol.reserve_access_allowed === false && protocol.formula_changes_allowed === false, "PROTOCOL_PROHIBITIONS");
    requireCondition(protocol.public_rollout_percent === 0, "PROTOCOL_ROLLOUT");
    requireCondition(protocol.human_review_policy?.required_case_count === 24, "PROTOCOL_CASE_COUNT");
    requireCondition(protocol.human_review_policy?.single_reviewer_is_consensus === false, "PROTOCOL_SINGLE_REVIEWER");
    requireCondition(protocol.human_review_policy?.absence_can_support_new_hypothesis === false, "PROTOCOL_MISSING_HUMAN_POLICY");
    requireCondition(Array.isArray(protocol.hypothesis_acceptance_requirements) && protocol.hypothesis_acceptance_requirements.length === 11, "PROTOCOL_HYPOTHESIS_REQUIREMENTS");
    requireCondition(new Set(protocol.candidate_hypotheses.map((item) => item.id)).size === protocol.candidate_hypotheses.length, "PROTOCOL_DUPLICATE_HYPOTHESIS");
    for (const candidate of protocol.candidate_hypotheses) {
        requireCondition(object(candidate) && Object.keys(candidate).every((key) => HYPOTHESIS_FIELDS.has(key)), "PROTOCOL_HYPOTHESIS_FIELD");
        requireCondition(/^[a-z0-9_]+$/.test(candidate.id) && Array.isArray(candidate.source_classifications) && candidate.source_classifications.length > 0, "PROTOCOL_HYPOTHESIS_ID");
    }
    requireCondition(protocol.allowed_substantive_decisions.includes("MANTER_V2_SEM_AJUSTE") && protocol.allowed_substantive_decisions.length === 2, "PROTOCOL_DECISIONS");
    return protocol;
}

function validateFrozenEvidence({ protocol, comparison, guardrailsReport, publicPackage, internalKey }) {
    validateTechnicalDecisionProtocol(protocol);
    const source = protocol.source_artifacts;
    requireCondition(comparison.content_sha256 === source.comparison_content_sha256, "COMPARISON_HASH");
    requireCondition(hashWithout(comparison, "content_sha256") === comparison.content_sha256, "COMPARISON_CANONICAL_HASH");
    requireCondition(guardrailsReport.canonical_sha256 === source.guardrails_report_canonical_sha256, "GUARDRAILS_HASH");
    requireCondition(hashWithout(guardrailsReport, "canonical_sha256") === guardrailsReport.canonical_sha256, "GUARDRAILS_CANONICAL_HASH");
    requireCondition(publicPackage.content_sha256 === source.blind_package_content_sha256, "PACKAGE_HASH");
    requireCondition(hashWithout(publicPackage, "content_sha256") === publicPackage.content_sha256, "PACKAGE_CANONICAL_HASH");
    requireCondition(publicPackage.case_count === 24 && publicPackage.judgments_present === false, "PACKAGE_STATE");
    requireCondition(internalKey.canonical_sha256 === source.blind_key_commitment_sha256, "KEY_COMMITMENT");
    requireCondition(hashWithout(internalKey, "canonical_sha256") === internalKey.canonical_sha256, "KEY_CANONICAL_HASH");
    requireCondition(publicPackage.answer_key_commitment_sha256 === internalKey.canonical_sha256, "PACKAGE_KEY_COMMITMENT");
    requireCondition(internalKey.cases.length === publicPackage.cases.length, "KEY_CASE_COUNT");
    return true;
}

function validateHumanSubmission(submission, publicPackage) {
    requireCondition(object(submission), "SUBMISSION_NOT_OBJECT");
    requireCondition(Object.keys(submission).every((key) => SUBMISSION_FIELDS.has(key)), "SUBMISSION_UNKNOWN_FIELD");
    requireCondition(submission.schema_version === "blind-review-submission-v1", "SUBMISSION_SCHEMA");
    requireCondition(submission.package_content_sha256 === publicPackage.content_sha256, "SUBMISSION_PACKAGE_HASH");
    requireCondition(submission.human_supplied === true && submission.synthetic_fixture === false, "SUBMISSION_NOT_HUMAN");
    requireCondition(typeof submission.reviewer_code === "string" && /^[a-z0-9_-]{2,32}$/i.test(submission.reviewer_code), "SUBMISSION_REVIEWER");
    requireCondition(Array.isArray(submission.responses) && submission.responses.length === publicPackage.case_count, "SUBMISSION_CASE_COUNT");
    const allowedCases = new Set(publicPackage.cases.map((item) => item.blind_case_id));
    const allowedChoices = new Set(publicPackage.allowed_choices);
    const allowedReasons = new Set(publicPackage.allowed_reason_codes);
    const seen = new Set();
    for (const response of submission.responses) {
        requireCondition(object(response) && Object.keys(response).every((key) => RESPONSE_FIELDS.has(key)), "SUBMISSION_RESPONSE_FIELD");
        requireCondition(allowedCases.has(response.blind_case_id), "SUBMISSION_UNKNOWN_CASE");
        requireCondition(!seen.has(response.blind_case_id), "SUBMISSION_DUPLICATE_CASE");
        seen.add(response.blind_case_id);
        requireCondition(allowedChoices.has(response.choice), "SUBMISSION_CHOICE");
        requireCondition(Array.isArray(response.reason_codes) && response.reason_codes.every((reason) => allowedReasons.has(reason)), "SUBMISSION_REASON");
        requireCondition(["BAIXA", "MEDIA", "ALTA"].includes(response.review_confidence), "SUBMISSION_CONFIDENCE");
        requireCondition(response.optional_note === null || (typeof response.optional_note === "string" && response.optional_note.length <= 280 && !PRIVATE_TEXT.test(response.optional_note)), "SUBMISSION_NOTE");
    }
    requireCondition(submission.content_sha256 === hashWithout(submission, "content_sha256"), "SUBMISSION_CONTENT_HASH");
    return submission;
}

function countBy(items, selector) {
    const counts = {};
    for (const item of items) {
        const key = selector(item);
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function aggregateHumanReview({ submission, publicPackage, internalKey, responsesFrozen }) {
    requireCondition(responsesFrozen === true, "RESPONSES_NOT_FROZEN");
    validateHumanSubmission(submission, publicPackage);
    requireCondition(hashWithout(internalKey, "canonical_sha256") === publicPackage.answer_key_commitment_sha256, "KEY_NOT_VERIFIED");
    const keyByCase = new Map(internalKey.cases.map((item) => [item.blind_case_id, item]));
    const resolved = submission.responses.map((response) => {
        const key = keyByCase.get(response.blind_case_id);
        requireCondition(key, "KEY_CASE_MISSING");
        const selected = response.choice === "A" ? key.option_a.model_version : response.choice === "B" ? key.option_b.model_version : response.choice;
        return {
            choice: response.choice,
            selected_origin: selected,
            comparator: key.option_a.model_version === V2 ? key.option_b.model_version : key.option_a.model_version,
            persona_id: key.persona_id,
            classification: key.classification,
            comparison_mode: key.comparison_mode,
            reason_codes: response.reason_codes,
            review_confidence: response.review_confidence,
        };
    });
    const determinate = resolved.filter((item) => item.choice === "A" || item.choice === "B");
    return {
        reviewer_count: 1,
        consensus_claimed: false,
        total_responses: resolved.length,
        choices: countBy(resolved, (item) => item.choice),
        determinate_preferences_by_origin: countBy(determinate, (item) => item.selected_origin),
        determinate_by_comparator: countBy(determinate, (item) => item.comparator),
        by_comparison_mode: countBy(resolved, (item) => item.comparison_mode),
        reason_codes: countBy(resolved.flatMap((item) => item.reason_codes), (reason) => reason),
        review_confidence: countBy(resolved, (item) => item.review_confidence),
        limitations: ["Amostra intencional de desacordos.", "Um revisor nao constitui consenso.", "Evidencia humana auxiliar e sintetica."],
    };
}

function acceptanceMap(comparison) {
    return new Map(comparison.validation.acceptance.criteria.map((item) => [item.id, item]));
}

function modelMetrics(comparison, version) {
    return comparison.validation.global_by_model.find((item) => item.model_version === version)?.metrics;
}

function buildAutomatedEvidence(comparison, guardrailsReport) {
    const criteria = acceptanceMap(comparison);
    const control = modelMetrics(comparison, CONTROL);
    const v1 = modelMetrics(comparison, V1);
    const v2 = modelMetrics(comparison, V2);
    requireCondition(control && v1 && v2, "MODEL_METRICS_MISSING");
    return {
        validation_primary: true,
        executions_total: guardrailsReport.datasets.reduce((sum, item) => sum + item.executions, 0),
        eliminatory_violations: guardrailsReport.datasets.reduce((sum, item) => sum + item.eliminatory_violations, 0),
        failures: comparison.development.quality.failures + comparison.validation.quality.failures,
        fallbacks: comparison.development.quality.fallbacks + comparison.validation.quality.fallbacks,
        validation_mean_regret: {
            [CONTROL]: control.regret.mean,
            [V1]: v1.regret.mean,
            [V2]: v2.regret.mean,
        },
        validation_v2_minus_control: criteria.get("v2_regret_not_worse_than_control").observed,
        validation_v2_minus_v1: criteria.get("v2_regret_not_worse_than_v1").observed,
        v2_vs_control_status: criteria.get("v2_regret_not_worse_than_control").status,
        v2_vs_v1_status: criteria.get("v2_regret_not_worse_than_v1").status,
        v2_confidence_at_least_025: v2.confidence_above_025,
        acceptance_criteria: Object.fromEntries([...criteria].map(([id, item]) => [id, item.status])),
        regressions_total: guardrailsReport.regression_summary.total_classified,
        regressions_by_classification: guardrailsReport.regression_summary.by_classification,
        guardrails: countBy(guardrailsReport.matrix, (item) => item.status),
        safety_is_not_quality_superiority: true,
        fallback_does_not_credit_native_v2: true,
        synthetic_customers_only: true,
    };
}

function evaluateHypotheses(protocol, comparison, guardrailsReport, humanState) {
    const criteria = acceptanceMap(comparison);
    return protocol.candidate_hypotheses.map((candidate) => {
        const matching = guardrailsReport.regressions.filter((item) => candidate.source_classifications.includes(item.classification));
        const validation = matching.filter((item) => item.dataset_id === "validacao_v1");
        const criterion = criteria.get(candidate.required_acceptance_criterion);
        const fixturePresent = typeof candidate.fixture_reference === "string" && candidate.fixture_reference.endsWith(".test.js");
        const checks = {
            general_mechanism: candidate.mechanism_confirmed_by_frozen_evidence === true && matching.length >= 2,
            reproducible_validation_evidence: validation.length >= 2,
            independent_general_fixture: fixturePresent,
            preexisting_guardrail_or_criterion: Boolean(criterion),
            eliminatory_filters_preserved: candidate.changes_eliminatory_filters === false,
            consent_privacy_idempotency_and_causality_preserved: candidate.weakens_signal_safety === false,
            no_history_neutrality_preserved: candidate.preserves_no_history_neutrality === true,
            no_reserve_dependency: candidate.uses_reserve === false,
            no_case_removal: candidate.removes_cases === false,
            objective_abandonment_criterion: candidate.has_objective_abandonment_criterion === true,
            not_score_tuning: candidate.score_tuning === false,
        };
        const accepted = Object.values(checks).every(Boolean);
        let status = accepted ? "ACCEPTED_FOR_INVESTIGATION" : "INSUFFICIENT_EVIDENCE";
        if (!accepted && humanState !== "REVISAO_HUMANA_CONGELADA" && candidate.id === "explicit_preference_requires_broader_precedence") {
            status = "DEFERRED_HUMAN_REVIEW";
        }
        return {
            id: candidate.id,
            status,
            problem: candidate.problem,
            evidence: {
                matching_regressions: matching.length,
                validation_regressions: validation.length,
                acceptance_criterion: candidate.required_acceptance_criterion,
                acceptance_status: criterion?.status ?? "MISSING",
                human_review_state: humanState,
            },
            checks,
            counterevidence: criterion?.status === "PASS" ? "O criterio agregado relacionado passou em validacao." : null,
            overfitting_risk: "Ajustar a formula aos cenarios conhecidos de desenvolvimento e validacao.",
            immutable_invariants: ["filtros_eliminatorios", "consentimento", "causalidade", "neutralidade_sem_historico", "limite_de_ajuste"],
            allowed_conceptual_change: accepted ? "Investigar o mecanismo em nova versao e fixtures independentes." : null,
            prohibited_changes: ["ajustar_peso_para_placar", "remover_casos", "usar_reserva"],
            future_fixture: candidate.fixture_reference,
            development_success: "Fixture geral passa sem regressao dos guardrails.",
            validation_acceptance: "Candidata congelada atende aos criterios pre-registrados sem piorar V1 ou controle.",
            abandonment_criterion: "Abandonar se o mecanismo nao for reproduzido por fixture independente ou regredir guardrails.",
            requires_new_model_version: accepted,
            reserve_used: false,
        };
    });
}

function buildTechnicalDecision({ protocol, comparison, guardrailsReport, publicPackage, internalKey, submission = null, submissionFileSha256 = null, humanStateOverride = null }) {
    validateFrozenEvidence({ protocol, comparison, guardrailsReport, publicPackage, internalKey });
    const humanState = humanStateOverride ?? (submission ? "REVISAO_HUMANA_CONGELADA" : protocol.human_review_policy.missing_state);
    let humanEvidence = null;
    if (submission) {
        validateHumanSubmission(submission, publicPackage);
        requireCondition(/^[a-f0-9]{64}$/.test(submissionFileSha256 ?? ""), "SUBMISSION_FILE_HASH");
        humanEvidence = aggregateHumanReview({ submission, publicPackage, internalKey, responsesFrozen: true });
    }
    const automatedEvidence = buildAutomatedEvidence(comparison, guardrailsReport);
    const hypotheses = evaluateHypotheses(protocol, comparison, guardrailsReport, humanState);
    const accepted = hypotheses.filter((item) => item.status === "ACCEPTED_FOR_INVESTIGATION");
    const substantiveDecision = accepted.length ? "HIPOTESES_V2_1_ACEITAS" : "MANTER_V2_SEM_AJUSTE";
    const milestoneDecision = accepted.length
        ? "DECISAO_TECNICA_CONCLUIDA_HIPOTESES_V2_1"
        : humanState !== "REVISAO_HUMANA_CONGELADA"
            ? "DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE"
            : "DECISAO_TECNICA_CONCLUIDA_MANTER_V2";
    const hypothesesCore = {
        schema_version: 1,
        hypotheses_version: HYPOTHESES_VERSION,
        decision_protocol_version: protocol.decision_protocol_version,
        decision_protocol_sha256: canonicalHash(protocol),
        human_review_state: humanState,
        accepted_count: accepted.length,
        hypotheses,
        reserve_accessed: false,
        formulas_changed: false,
    };
    const hypothesesReport = { ...hypothesesCore, canonical_sha256: canonicalHash(hypothesesCore) };
    const reportCore = {
        schema_version: 1,
        report_version: DECISION_REPORT_VERSION,
        decision_protocol_version: protocol.decision_protocol_version,
        milestone_decision: milestoneDecision,
        substantive_decision: substantiveDecision,
        input_hashes: {
            decision_protocol: canonicalHash(protocol),
            comparison: comparison.content_sha256,
            guardrails: guardrailsReport.canonical_sha256,
            blind_package: publicPackage.content_sha256,
            blind_key_commitment: internalKey.canonical_sha256,
            human_submission_file: submissionFileSha256,
        },
        human_review: {
            state: humanState,
            reviewer_count: humanEvidence?.reviewer_count ?? 0,
            valid_responses: humanEvidence?.total_responses ?? 0,
            aggregation_present: humanEvidence !== null,
            evidence: humanEvidence,
        },
        key_commitment_status: submission ? "KEY_COMMITMENT_VERIFIED_AFTER_RESPONSE_FREEZE" : "COMMITMENT_PRESENT_NOT_AGGREGATED",
        automated_evidence: automatedEvidence,
        hypothesis_summary: countBy(hypotheses, (item) => item.status),
        accepted_hypothesis_ids: accepted.map((item) => item.id),
        justification: accepted.length
            ? "Hipoteses gerais satisfizeram todos os requisitos para investigacao; nenhuma formula foi alterada."
            : "Nenhuma hipotese confirmou mecanismo geral e fixture independente suficientes; a V2 permanece sem ajuste.",
        consequences: accepted.length
            ? ["Investigar somente hipoteses aceitas em nova versao.", "Manter V2 como referencia ate nova validacao."]
            : ["Preparar congelamento da V2 atual.", "Manter fallback por baixa confianca.", "Manter revisao humana como evidencia auxiliar pendente."],
        limitations: [
            "Dados sinteticos e offline nao representam clientes reais.",
            humanState === "REVISAO_HUMANA_PENDENTE" ? "Nenhuma resposta humana foi recebida ou agregada." : humanState === "REVISAO_HUMANA_INCOMPLETA" ? "A submissao humana estava incompleta e nao foi agregada." : "Revisao humana e auxiliar e nao constitui validacao comercial.",
            "A V2 supera o controle, mas nao atende ao criterio congelado contra a V1.",
        ],
        reserve_accessed: false,
        formulas_changed: false,
        models_executed: 0,
        public_rollout_percent: 0,
    };
    const decisionReport = { ...reportCore, canonical_sha256: canonicalHash(reportCore) };
    return { hypothesesReport, decisionReport };
}

module.exports = {
    DECISION_PROTOCOL_VERSION,
    DECISION_REPORT_VERSION,
    HYPOTHESES_VERSION,
    aggregateHumanReview,
    buildAutomatedEvidence,
    buildTechnicalDecision,
    evaluateHypotheses,
    validateFrozenEvidence,
    validateHumanSubmission,
    validateTechnicalDecisionProtocol,
};
