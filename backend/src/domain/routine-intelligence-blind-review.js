"use strict";

const crypto = require("node:crypto");
const { canonicalHash, canonicalSerialize } = require("./routine-intelligence-partitions");

const PROTOCOL_VERSION = "routine-blind-review-v1";
const V2_VERSION = "appono-intelligence-v2";
const PUBLIC_FORBIDDEN_VALUE = /(deterministico-v3|appono-intelligence-v1|appono-intelligence-v2|\bchallenger\b)/i;
const PUBLIC_ALLOWED_KEYS = new Set([
    "schema_version", "package_version", "synthetic_offline_only", "judgments_present", "case_count",
    "comparison_notice", "allowed_choices", "allowed_reason_codes", "answer_key_commitment_sha256", "cases",
    "content_sha256", "blind_case_id", "display_order", "comparison_mode", "context", "option_a", "option_b",
    "response", "profile_label", "behavioral_goal", "explicit_preferences", "gastronomic_aversions", "meal_window",
    "virtual_moment", "meal_budget", "maximum_distance", "recent_sequence", "restaurant_alias", "category",
    "product_alias", "price_band", "distance_band", "eligible_confirmed", "preference_relation",
    "recent_category_occurrences", "choice", "reason_codes", "review_confidence", "optional_note",
]);
const PROTOCOL_KEYS = new Set([
    "schema_version", "protocol_version", "registered_at", "timezone", "purpose", "state",
    "synthetic_offline_only", "contains_pii", "reserve_access_allowed", "target_case_count", "source_artifacts",
    "seed_derivation", "sampling", "randomization", "trajectory_policy", "schemas", "allowed_choices",
    "allowed_reason_codes", "key_commitment", "forbidden_public_fields", "prohibited_sources",
]);
const PRIVATE_TEXT = /(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:access|refresh)[_-]?token\b|\bservice_role\b|\bjwt\b|\bsenha\b|\bpassword\b|\balerg|condicao medica|endere[cç]o|latitude|longitude)/i;

function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function requireCondition(condition, code) {
    if (!condition) throw new Error(`BLIND_REVIEW_INVALID: ${code}`);
}

function stableDigest(seed, scope, value) {
    return crypto.createHash("sha256").update(`${seed}\n${scope}\n${value}`).digest("hex");
}

function validateBlindReviewProtocol(protocol) {
    requireCondition(object(protocol), "PROTOCOL_NOT_OBJECT");
    requireCondition(Object.keys(protocol).every((key) => PROTOCOL_KEYS.has(key)), "PROTOCOL_UNKNOWN_FIELD");
    requireCondition(protocol.schema_version === 1, "PROTOCOL_SCHEMA");
    requireCondition(protocol.protocol_version === PROTOCOL_VERSION, "PROTOCOL_VERSION");
    requireCondition(protocol.state === "REGISTERED_UNJUDGED", "PROTOCOL_STATE");
    requireCondition(protocol.synthetic_offline_only === true && protocol.contains_pii === false, "PROTOCOL_PRIVACY");
    requireCondition(protocol.reserve_access_allowed === false, "PROTOCOL_RESERVE");
    requireCondition(protocol.target_case_count === 24, "PROTOCOL_CASE_COUNT");
    requireCondition(protocol.sampling?.validation_minimum === 12, "PROTOCOL_VALIDATION_MINIMUM");
    requireCondition(protocol.sampling?.persona_soft_cap === 4, "PROTOCOL_PERSONA_CAP");
    requireCondition(protocol.randomization?.ambient_randomness_allowed === false, "PROTOCOL_RANDOMNESS");
    requireCondition(protocol.randomization?.maximum_orientation_imbalance_per_stratum === 1, "PROTOCOL_BALANCE");
    requireCondition(/^[a-f0-9]{64}$/.test(protocol.key_commitment?.expected_sha256 ?? ""), "PROTOCOL_KEY_COMMITMENT");
    const derived = crypto.createHash("sha256").update(protocol.seed_derivation.components.join("\n")).digest("hex");
    requireCondition(derived === protocol.seed_derivation.derived_sha256, "PROTOCOL_SEED_DERIVATION");
    requireCondition(Array.isArray(protocol.allowed_choices) && protocol.allowed_choices.length === 4, "PROTOCOL_CHOICES");
    requireCondition(Array.isArray(protocol.allowed_reason_codes) && protocol.allowed_reason_codes.length >= 10, "PROTOCOL_REASONS");
    requireCondition(Array.isArray(protocol.forbidden_public_fields) && protocol.forbidden_public_fields.length >= 10, "PROTOCOL_FORBIDDEN_FIELDS");
    return protocol;
}

function sourceKey(item) {
    return `${item.dataset_id}:${item.scenario_id}`;
}

function compareQuality(left, right) {
    return right.regret_delta - left.regret_delta
        || sourceKey(left).localeCompare(sourceKey(right))
        || left.comparator_version.localeCompare(right.comparator_version);
}

function eligibleRegression(item, context) {
    const decisions = context.decisionsByScenario.get(sourceKey(item)) ?? [];
    const v2 = decisions.find((decision) => decision.model_version === V2_VERSION);
    const comparator = decisions.find((decision) => decision.model_version === item.comparator_version);
    const scenario = context.scenarioById.get(sourceKey(item));
    if (!v2 || !comparator || !scenario) return false;
    if (v2.fallback_used || comparator.fallback_used || v2.technical_error_code || comparator.technical_error_code) return false;
    if (!v2.native_choice_candidate_id || !comparator.native_choice_candidate_id) return false;
    if (v2.native_choice_candidate_id === comparator.native_choice_candidate_id) return false;
    const eligible = new Set(scenario.eligible_candidate_ids);
    return eligible.has(v2.native_choice_candidate_id) && eligible.has(comparator.native_choice_candidate_id);
}

function buildContext(rawReports, snapshots) {
    const decisionsByScenario = new Map();
    const reportsByDataset = new Map();
    for (const report of rawReports) {
        reportsByDataset.set(report.metadata.dataset_id, report);
        for (const decision of report.decisions) {
            const key = `${decision.dataset_id}:${decision.scenario_id}`;
            if (!decisionsByScenario.has(key)) decisionsByScenario.set(key, []);
            decisionsByScenario.get(key).push(decision);
        }
    }
    const scenarioById = new Map();
    const scenariosByDataset = new Map();
    for (const snapshot of snapshots) {
        scenariosByDataset.set(snapshot.partition.id, snapshot.scenarios);
        for (const scenario of snapshot.scenarios) scenarioById.set(`${scenario.partition_id}:${scenario.scenario_id}`, scenario);
    }
    return { decisionsByScenario, reportsByDataset, scenarioById, scenariosByDataset };
}

function uniqueRegressionPool(regressions, context) {
    const grouped = new Map();
    for (const item of regressions.filter((entry) => eligibleRegression(entry, context)).sort(compareQuality)) {
        const key = sourceKey(item);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
    }
    return [...grouped.values()].map((items) => {
        const control = items.find((item) => item.comparator_version === "deterministico-v3");
        return control ?? items.sort(compareQuality)[0];
    }).sort(compareQuality);
}

function selectBlindReviewCases(protocol, regressions, context) {
    validateBlindReviewProtocol(protocol);
    const pool = uniqueRegressionPool(regressions, context);
    const selected = new Map();
    const personaCounts = new Map();
    const add = (item, { force = false } = {}) => {
        if (!item || selected.has(sourceKey(item)) || selected.size >= protocol.target_case_count) return false;
        const count = personaCounts.get(item.persona_id) ?? 0;
        if (!force && count >= protocol.sampling.persona_soft_cap) return false;
        selected.set(sourceKey(item), item);
        personaCounts.set(item.persona_id, count + 1);
        return true;
    };
    const bestBy = (field) => [...new Set(pool.map((item) => item[field]))]
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((value) => pool.find((item) => item[field] === value));

    bestBy("classification").forEach((item) => add(item));
    bestBy("persona_id").forEach((item) => add(item, { force: true }));
    bestBy("comparator_version").forEach((item) => add(item));
    bestBy("virtual_week").forEach((item) => add(item));

    for (const item of pool.filter((entry) => entry.dataset_id === "validacao_v1")) {
        const validationCount = [...selected.values()].filter((entry) => entry.dataset_id === "validacao_v1").length;
        if (validationCount >= protocol.sampling.validation_minimum) break;
        add(item);
    }
    for (const item of pool) add(item);
    for (const item of pool) add(item, { force: true });

    const result = [...selected.values()].sort(compareQuality);
    requireCondition(result.length === protocol.target_case_count, "SELECTION_INSUFFICIENT_CASES");
    requireCondition(new Set(result.map(sourceKey)).size === result.length, "SELECTION_DUPLICATE_SCENARIO");
    requireCondition(result.filter((item) => item.dataset_id === "validacao_v1").length >= protocol.sampling.validation_minimum, "SELECTION_VALIDATION_UNDERREPRESENTED");
    return result;
}

function previousSequence({ datasetId, personaId, modelVersion, scenarioIndex, context, limit }) {
    const report = context.reportsByDataset.get(datasetId);
    const scenarios = context.scenariosByDataset.get(datasetId) ?? [];
    const scenarioMap = new Map(scenarios.map((scenario) => [scenario.scenario_id, scenario]));
    return report.decisions
        .filter((decision) => decision.persona_id === personaId && decision.model_version === modelVersion && decision.scenario_index < scenarioIndex && decision.native_choice_candidate_id)
        .sort((left, right) => left.scenario_index - right.scenario_index)
        .slice(-limit)
        .map((decision) => {
            const scenario = scenarioMap.get(decision.scenario_id);
            const candidate = scenario?.catalog.find((item) => item.candidate_id === decision.native_choice_candidate_id);
            requireCondition(candidate, "TRAJECTORY_CANDIDATE_MISSING");
            return candidate;
        });
}

function priceBand(value) {
    if (value < 25) return "abaixo de R$ 25";
    if (value < 35) return "de R$ 25 a R$ 34";
    if (value < 45) return "de R$ 35 a R$ 44";
    if (value < 60) return "de R$ 45 a R$ 59";
    return "R$ 60 ou mais";
}

function distanceBand(value) {
    if (value < 1) return "menos de 1 km";
    if (value < 2) return "de 1 a 2 km";
    if (value < 4) return "de 2 a 4 km";
    if (value < 7) return "de 4 a 7 km";
    return "7 km ou mais";
}

function sequencePublic(sequence, prefix) {
    return sequence.map((candidate, index) => ({
        restaurant_alias: `${prefix} ${index + 1}`,
        category: candidate.category,
    }));
}

function optionPublic(candidate, label, persona, recentSequence) {
    const preferred = new Set(persona.perfil.preferencias_explicitas);
    const avoided = new Set(persona.aversoes.categorias);
    const recentCategories = recentSequence.map((item) => item.category);
    return {
        restaurant_alias: `Restaurante ${label}`,
        product_alias: `Opcao ${label}`,
        category: candidate.category,
        price_band: priceBand(candidate.price),
        distance_band: distanceBand(candidate.distance_km),
        eligible_confirmed: true,
        preference_relation: preferred.has(candidate.category) ? "PREFERIDA" : avoided.has(candidate.category) ? "EVITADA" : "NEUTRA",
        recent_category_occurrences: recentCategories.filter((category) => category === candidate.category).length,
    };
}

function caseMaterial(item, context, personaById, protocol) {
    const scenario = context.scenarioById.get(sourceKey(item));
    const decisions = context.decisionsByScenario.get(sourceKey(item));
    const v2Decision = decisions.find((decision) => decision.model_version === V2_VERSION);
    const comparatorDecision = decisions.find((decision) => decision.model_version === item.comparator_version);
    const candidates = new Map(scenario.catalog.map((candidate) => [candidate.candidate_id, candidate]));
    const v2Candidate = candidates.get(v2Decision.native_choice_candidate_id);
    const comparatorCandidate = candidates.get(comparatorDecision.native_choice_candidate_id);
    requireCondition(v2Candidate && comparatorCandidate, "CASE_CANDIDATE_MISSING");
    const persona = personaById.get(item.persona_id);
    requireCondition(persona, "CASE_PERSONA_MISSING");
    const limit = protocol.trajectory_policy.recent_sequence_limit;
    const v2Sequence = previousSequence({ datasetId: item.dataset_id, personaId: item.persona_id, modelVersion: V2_VERSION, scenarioIndex: item.scenario_index, context, limit });
    const comparatorSequence = previousSequence({ datasetId: item.dataset_id, personaId: item.persona_id, modelVersion: item.comparator_version, scenarioIndex: item.scenario_index, context, limit });
    const shared = canonicalSerialize(v2Sequence.map((entry) => entry.candidate_id)) === canonicalSerialize(comparatorSequence.map((entry) => entry.candidate_id));
    return { item, scenario, persona, v2Decision, comparatorDecision, v2Candidate, comparatorCandidate, v2Sequence, comparatorSequence, shared };
}

function buildBlindReviewArtifacts({ protocol, guardrailsReport, rawReports, snapshots, personasArtifact }) {
    validateBlindReviewProtocol(protocol);
    requireCondition(guardrailsReport.canonical_sha256 === protocol.source_artifacts.guardrails_report_canonical_sha256, "GUARDRAILS_REPORT_HASH");
    requireCondition(guardrailsReport.reserve_accessed === false, "GUARDRAILS_REPORT_RESERVE");
    const context = buildContext(rawReports, snapshots);
    const selected = selectBlindReviewCases(protocol, guardrailsReport.regressions, context);
    const personaById = new Map(personasArtifact.personas.map((persona) => [persona.id, persona]));
    const seed = protocol.seed_derivation.derived_sha256;
    const materials = selected.map((item) => caseMaterial(item, context, personaById, protocol));
    const strata = new Map();
    for (const material of materials) {
        const stratum = `${material.item.dataset_id}:${material.item.comparator_version}`;
        if (!strata.has(stratum)) strata.set(stratum, []);
        strata.get(stratum).push(material);
    }
    const v2InA = new Map();
    for (const [stratum, entries] of strata) {
        const sorted = [...entries].sort((left, right) => stableDigest(seed, `orientation:${stratum}`, sourceKey(left.item)).localeCompare(stableDigest(seed, `orientation:${stratum}`, sourceKey(right.item))));
        const countInA = Math.floor(sorted.length / 2);
        sorted.forEach((material, index) => v2InA.set(sourceKey(material.item), index < countInA));
    }
    const ordered = [...materials].sort((left, right) => stableDigest(seed, "case-order", sourceKey(left.item)).localeCompare(stableDigest(seed, "case-order", sourceKey(right.item))));
    const publicCases = [];
    const keyCases = [];
    ordered.forEach((material, index) => {
        const caseId = `caso-${String(index + 1).padStart(3, "0")}`;
        const orientation = v2InA.get(sourceKey(material.item));
        const first = orientation
            ? { decision: material.v2Decision, candidate: material.v2Candidate, sequence: material.v2Sequence }
            : { decision: material.comparatorDecision, candidate: material.comparatorCandidate, sequence: material.comparatorSequence };
        const second = orientation
            ? { decision: material.comparatorDecision, candidate: material.comparatorCandidate, sequence: material.comparatorSequence }
            : { decision: material.v2Decision, candidate: material.v2Candidate, sequence: material.v2Sequence };
        const contextPublic = {
            profile_label: `Perfil ${stableDigest(seed, "profile", material.item.persona_id).slice(0, 4).toUpperCase()}`,
            behavioral_goal: material.persona.objetivo,
            explicit_preferences: material.persona.perfil.preferencias_explicitas,
            gastronomic_aversions: material.persona.aversoes.categorias,
            meal_window: material.scenario.meal_window,
            virtual_moment: `semana ${material.scenario.virtual_week + 1}, dia ${material.scenario.virtual_day + 1}`,
            meal_budget: `ate R$ ${material.persona.perfil.orcamento}`,
            maximum_distance: `ate ${material.persona.perfil.raio_km} km`,
        };
        if (material.shared) contextPublic.recent_sequence = sequencePublic(material.v2Sequence, "Restaurante anterior");
        const publicCase = {
            blind_case_id: caseId,
            display_order: index + 1,
            comparison_mode: material.shared ? "SHARED_HISTORY" : "TRAJECTORY_OUTCOME",
            context: contextPublic,
            option_a: {
                ...optionPublic(first.candidate, "A", material.persona, first.sequence),
                ...(material.shared ? {} : { recent_sequence: sequencePublic(first.sequence, "Historico A") }),
            },
            option_b: {
                ...optionPublic(second.candidate, "B", material.persona, second.sequence),
                ...(material.shared ? {} : { recent_sequence: sequencePublic(second.sequence, "Historico B") }),
            },
            response: { choice: null, reason_codes: [], review_confidence: null, optional_note: null },
        };
        publicCases.push(publicCase);
        keyCases.push({
            blind_case_id: caseId,
            dataset_id: material.item.dataset_id,
            scenario_id: material.item.scenario_id,
            persona_id: material.item.persona_id,
            virtual_week: material.item.virtual_week,
            scenario_index: material.item.scenario_index,
            classification: material.item.classification,
            regret_delta: material.item.regret_delta,
            comparison_mode: publicCase.comparison_mode,
            option_a: { model_version: first.decision.model_version, candidate_id: first.candidate.candidate_id },
            option_b: { model_version: second.decision.model_version, candidate_id: second.candidate.candidate_id },
            public_case_sha256: canonicalHash(publicCase),
        });
    });
    const keyCore = {
        schema_version: protocol.schemas.internal_key,
        protocol_version: protocol.protocol_version,
        seed_sha256: seed,
        public_cases_sha256: canonicalHash(publicCases),
        cases: keyCases,
    };
    const keyCommitment = canonicalHash(keyCore);
    requireCondition(keyCommitment === protocol.key_commitment.expected_sha256, "KEY_COMMITMENT");
    const internalKey = { ...keyCore, canonical_sha256: keyCommitment };
    const packageCore = {
        schema_version: protocol.schemas.public_package,
        package_version: "blind-review-package-v1",
        synthetic_offline_only: true,
        judgments_present: false,
        case_count: publicCases.length,
        comparison_notice: "Amostra intencional de desacordos; alguns pares representam trajetorias anteriores diferentes.",
        allowed_choices: protocol.allowed_choices,
        allowed_reason_codes: protocol.allowed_reason_codes,
        answer_key_commitment_sha256: keyCommitment,
        cases: publicCases,
    };
    const publicPackage = { ...packageCore, content_sha256: canonicalHash(packageCore) };
    const responseCore = {
        schema_version: protocol.schemas.response_template,
        package_content_sha256: publicPackage.content_sha256,
        status: "DRAFT_EMPTY",
        reviewer_code: null,
        responses: publicCases.map((item) => ({
            blind_case_id: item.blind_case_id,
            choice: null,
            reason_codes: [],
            review_confidence: null,
            optional_note: null,
        })),
    };
    const responsesTemplate = { ...responseCore, content_sha256: canonicalHash(responseCore) };
    validatePublicPackage(publicPackage, protocol);
    validateResponses(responsesTemplate, publicPackage, protocol, { requireComplete: false });
    return { publicPackage, internalKey, responsesTemplate, csv: reviewCsv(publicPackage), instructions: reviewerInstructions(publicPackage) };
}

function visit(value, callback, path = "$") {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, callback, `${path}[${index}]`));
    if (!object(value)) return;
    for (const [key, item] of Object.entries(value)) {
        callback(key, item, `${path}.${key}`);
        visit(item, callback, `${path}.${key}`);
    }
}

function validatePublicPackage(publicPackage, protocol) {
    validateBlindReviewProtocol(protocol);
    requireCondition(publicPackage.schema_version === protocol.schemas.public_package, "PUBLIC_SCHEMA");
    requireCondition(publicPackage.case_count === protocol.target_case_count && publicPackage.cases.length === protocol.target_case_count, "PUBLIC_CASE_COUNT");
    requireCondition(publicPackage.judgments_present === false, "PUBLIC_JUDGMENTS_PRESENT");
    requireCondition(new Set(publicPackage.cases.map((item) => item.blind_case_id)).size === publicPackage.cases.length, "PUBLIC_DUPLICATE_CASE");
    const forbidden = new Set(protocol.forbidden_public_fields);
    visit(publicPackage, (key, value, path) => {
        requireCondition(PUBLIC_ALLOWED_KEYS.has(key), `PUBLIC_UNKNOWN_FIELD_${path}`);
        requireCondition(!forbidden.has(key), `PUBLIC_FORBIDDEN_FIELD_${path}`);
        if (typeof value === "string") {
            requireCondition(!PUBLIC_FORBIDDEN_VALUE.test(value), `PUBLIC_MODEL_DISCLOSURE_${path}`);
            requireCondition(!PRIVATE_TEXT.test(value), `PUBLIC_PRIVATE_TEXT_${path}`);
            requireCondition(!/^syn-(candidate|rest|prod|history|signal)-/i.test(value), `PUBLIC_RAW_ID_${path}`);
        }
    });
    for (const item of publicPackage.cases) {
        requireCondition(item.response.choice === null && item.response.reason_codes.length === 0 && item.response.review_confidence === null && item.response.optional_note === null, "PUBLIC_RESPONSE_PREFILLED");
        requireCondition(item.option_a.eligible_confirmed === true && item.option_b.eligible_confirmed === true, "PUBLIC_OPTION_NOT_ELIGIBLE");
        requireCondition(canonicalSerialize(item.option_a) !== canonicalSerialize(item.option_b), "PUBLIC_OPTIONS_EQUAL");
        if (item.comparison_mode === "TRAJECTORY_OUTCOME") {
            requireCondition(Array.isArray(item.option_a.recent_sequence) && Array.isArray(item.option_b.recent_sequence), "PUBLIC_TRAJECTORY_MISSING");
        }
    }
    const core = { ...publicPackage };
    delete core.content_sha256;
    requireCondition(publicPackage.content_sha256 === canonicalHash(core), "PUBLIC_CONTENT_HASH");
    return publicPackage;
}

function validateResponses(responses, publicPackage, protocol, { requireComplete = false } = {}) {
    requireCondition(object(responses), "RESPONSES_NOT_OBJECT");
    requireCondition(Object.keys(responses).every((key) => ["schema_version", "package_content_sha256", "status", "reviewer_code", "responses", "content_sha256"].includes(key)), "RESPONSES_UNKNOWN_FIELD");
    requireCondition(responses.schema_version === protocol.schemas.response_template, "RESPONSES_SCHEMA");
    requireCondition(responses.package_content_sha256 === publicPackage.content_sha256, "RESPONSES_PACKAGE_HASH");
    requireCondition(responses.reviewer_code === null || (typeof responses.reviewer_code === "string" && /^[a-z0-9_-]{2,32}$/i.test(responses.reviewer_code)), "RESPONSES_REVIEWER_CODE");
    requireCondition(Array.isArray(responses.responses), "RESPONSES_NOT_ARRAY");
    const packageIds = new Set(publicPackage.cases.map((item) => item.blind_case_id));
    const seen = new Set();
    for (const response of responses.responses) {
        requireCondition(object(response) && Object.keys(response).every((key) => ["blind_case_id", "choice", "reason_codes", "review_confidence", "optional_note"].includes(key)), "RESPONSES_ITEM_UNKNOWN_FIELD");
        requireCondition(packageIds.has(response.blind_case_id), "RESPONSES_UNKNOWN_CASE");
        requireCondition(!seen.has(response.blind_case_id), "RESPONSES_DUPLICATE_CASE");
        seen.add(response.blind_case_id);
        if (requireComplete) requireCondition(protocol.allowed_choices.includes(response.choice), "RESPONSES_CHOICE_REQUIRED");
        else requireCondition(response.choice === null || protocol.allowed_choices.includes(response.choice), "RESPONSES_CHOICE");
        requireCondition(Array.isArray(response.reason_codes) && response.reason_codes.every((reason) => protocol.allowed_reason_codes.includes(reason)), "RESPONSES_REASON");
        requireCondition(response.review_confidence === null || ["BAIXA", "MEDIA", "ALTA"].includes(response.review_confidence), "RESPONSES_CONFIDENCE");
        requireCondition(response.optional_note === null || (typeof response.optional_note === "string" && response.optional_note.length <= 280 && !PRIVATE_TEXT.test(response.optional_note)), "RESPONSES_NOTE");
    }
    if (requireComplete) requireCondition(seen.size === publicPackage.case_count, "RESPONSES_INCOMPLETE");
    return { complete: seen.size === publicPackage.case_count && responses.responses.every((item) => item.choice !== null), answered: responses.responses.filter((item) => item.choice !== null).length };
}

function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

function reviewCsv(publicPackage) {
    const headers = ["blind_case_id", "display_order", "comparison_mode", "context", "option_a", "option_b", "choice", "reason_codes", "review_confidence", "optional_note"];
    const lines = [headers.map(csvCell).join(",")];
    for (const item of publicPackage.cases) {
        lines.push([
            item.blind_case_id,
            item.display_order,
            item.comparison_mode,
            canonicalSerialize(item.context),
            canonicalSerialize(item.option_a),
            canonicalSerialize(item.option_b),
            "",
            "",
            "",
            "",
        ].map(csvCell).join(","));
    }
    return `${lines.join("\n")}\n`;
}

function reviewerInstructions(publicPackage) {
    return `# Revisao cega da Appono.AI\n\nEste material contem ${publicPackage.case_count} casos sinteticos e offline. A ordem dos casos e das alternativas foi embaralhada. Nao existe resposta considerada correta no formulario.\n\nAvalie preferencias explicitas, preco, distancia, variedade, repeticao e coerencia da sequencia apresentada. Todas as alternativas ja passaram pelos filtros eliminatorios.\n\nUse A ou B quando uma alternativa for preferivel, EMPATE quando ambas forem equivalentes e INDETERMINADO quando o contexto nao permitir uma escolha. Alguns casos apresentam trajetorias anteriores diferentes; nesses casos, avalie o resultado completo de cada lado.\n\nNao procure os relatorios tecnicos ou a chave interna antes de concluir. Nao inclua dados pessoais nas notas. Uma revisao individual e evidencia auxiliar, nao consenso nem validacao por clientes reais.\n`;
}

function serializeJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

module.exports = {
    PROTOCOL_VERSION,
    buildBlindReviewArtifacts,
    reviewCsv,
    selectBlindReviewCases,
    serializeJson,
    stableDigest,
    validateBlindReviewProtocol,
    validatePublicPackage,
    validateResponses,
};
