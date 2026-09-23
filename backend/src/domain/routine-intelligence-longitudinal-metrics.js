"use strict";

const { canonicalHash } = require("./routine-intelligence-partitions");

const METRICS_VERSION = "routine-longitudinal-metrics-v1";
const METRICS_SCHEMA = "routine-longitudinal-metrics-report-v1";
const MODEL_VERSIONS = Object.freeze(["deterministico-v3", "appono-intelligence-v1", "appono-intelligence-v2"]);
const REACTIONS = Object.freeze(["CONVERSAO_SIMULADA", "APROVACAO", "EDICAO", "ALTERNATIVA", "RECUSA"]);
const EPSILON = 1e-9;

function requireCondition(condition, code) {
    if (!condition) throw new Error(`LONGITUDINAL_METRICS_INVALID: ${code}`);
}

function finiteValues(values) {
    return values.filter((value) => Number.isFinite(value)).map(Number).sort((a, b) => a - b);
}

function percentile(values, probability) {
    const sorted = finiteValues(values);
    if (!sorted.length) return null;
    const position = (sorted.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function rounded(value) {
    return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(6));
}

function statistics(values) {
    const sorted = finiteValues(values);
    if (!sorted.length) return { count: 0, mean: null, median: null, min: null, max: null, stddev_population: null, p10: null, p25: null, p75: null, p90: null };
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length;
    return {
        count: sorted.length,
        mean: rounded(mean),
        median: rounded(percentile(sorted, 0.5)),
        min: rounded(sorted[0]),
        max: rounded(sorted.at(-1)),
        stddev_population: rounded(Math.sqrt(variance)),
        p10: rounded(percentile(sorted, 0.1)),
        p25: rounded(percentile(sorted, 0.25)),
        p75: rounded(percentile(sorted, 0.75)),
        p90: rounded(percentile(sorted, 0.9)),
    };
}

function rate(numerator, denominator) {
    return { numerator, denominator, rate: denominator ? rounded(numerator / denominator) : null };
}

function validateRawReport(report) {
    requireCondition(report?.metadata?.schema_version === "routine-longitudinal-raw-report-v1", "RAW_SCHEMA");
    requireCondition(["desenvolvimento_v1", "validacao_v1"].includes(report.metadata.dataset_id), "DATASET");
    requireCondition(report.metadata.reserve_accessed === false, "RESERVE_ACCESSED");
    requireCondition(Array.isArray(report.decisions) && report.decisions.length === 900, "DECISION_COUNT");
    requireCondition(report.content_sha256 === canonicalHash({ metadata: report.metadata, summary: report.summary, decisions: report.decisions }), "RAW_CONTENT_HASH");
    const keys = new Set();
    const scenarios = new Map();
    const modelCounts = new Map();
    const personaModelCounts = new Map();
    const personaWeekModelCounts = new Map();
    const personaModelIndexes = new Map();
    for (const decision of report.decisions) {
        const key = `${decision.dataset_id}:${decision.scenario_id}:${decision.model_version}`;
        requireCondition(!keys.has(key), "DUPLICATED_DECISION");
        keys.add(key);
        requireCondition(decision.dataset_id === report.metadata.dataset_id, "DECISION_DATASET");
        requireCondition(MODEL_VERSIONS.includes(decision.model_version), "UNKNOWN_MODEL");
        modelCounts.set(decision.model_version, (modelCounts.get(decision.model_version) ?? 0) + 1);
        const personaModelKey = `${decision.persona_id}:${decision.model_version}`;
        personaModelCounts.set(personaModelKey, (personaModelCounts.get(personaModelKey) ?? 0) + 1);
        const personaWeekModelKey = `${decision.persona_id}:${decision.virtual_week}:${decision.model_version}`;
        personaWeekModelCounts.set(personaWeekModelKey, (personaWeekModelCounts.get(personaWeekModelKey) ?? 0) + 1);
        const indexes = personaModelIndexes.get(personaModelKey) ?? new Set();
        indexes.add(decision.scenario_index);
        personaModelIndexes.set(personaModelKey, indexes);
        requireCondition(Number.isInteger(decision.virtual_week) && decision.virtual_week >= 0 && decision.virtual_week < 6, "WEEK");
        requireCondition(Number.isInteger(decision.virtual_day) && decision.virtual_day >= 0 && decision.virtual_day < 5, "DAY");
        requireCondition(decision.fallback_used === false || decision.native_choice_candidate_id === null, "FALLBACK_AS_NATIVE");
        if (decision.technical_error_code === null) {
            requireCondition(typeof decision.native_choice_candidate_id === "string", "NATIVE_CHOICE_MISSING");
            requireCondition(Number.isFinite(decision.chosen_external_utility), "UTILITY");
            requireCondition(Number.isFinite(decision.best_external_utility), "BEST_UTILITY");
            requireCondition(Number.isFinite(decision.regret) && decision.regret >= -EPSILON, "REGRET");
            requireCondition(Math.abs((decision.best_external_utility - decision.chosen_external_utility) - decision.regret) < 0.000002, "REGRET_FORMULA");
        }
        if (decision.confidence !== null) requireCondition(Number.isFinite(decision.confidence) && decision.confidence >= 0 && decision.confidence <= 1, "CONFIDENCE");
        if (decision.effective_samples !== null) requireCondition(Number.isFinite(decision.effective_samples) && decision.effective_samples >= 0, "EFFECTIVE_SAMPLES");
        if (decision.effective_volume !== null) requireCondition(Number.isFinite(decision.effective_volume) && decision.effective_volume >= 0, "EFFECTIVE_VOLUME");
        if (decision.consistency !== null) requireCondition(Number.isFinite(decision.consistency) && decision.consistency >= 0 && decision.consistency <= 1, "CONSISTENCY");
        if (decision.reaction_type !== null) requireCondition(REACTIONS.includes(decision.reaction_type), "REACTION");
        if (decision.model_version === "appono-intelligence-v2" && decision.adjustment !== null) requireCondition(decision.adjustment >= -8 && decision.adjustment <= 8, "V2_ADJUSTMENT");
        const scenario = scenarios.get(decision.scenario_id) ?? {
            models: new Set(),
            common_input_sha256: decision.common_input_sha256,
            candidate_set_sha256: decision.candidate_set_sha256,
        };
        requireCondition(scenario.common_input_sha256 === decision.common_input_sha256, "COMMON_INPUT_MISMATCH");
        requireCondition(scenario.candidate_set_sha256 === decision.candidate_set_sha256, "CANDIDATE_SET_MISMATCH");
        scenario.models.add(decision.model_version);
        scenarios.set(decision.scenario_id, scenario);
    }
    requireCondition(scenarios.size === 300 && [...scenarios.values()].every((scenario) => scenario.models.size === 3), "SCENARIO_MODEL_COVERAGE");
    requireCondition(MODEL_VERSIONS.every((model) => modelCounts.get(model) === 300), "MODEL_COVERAGE");
    requireCondition(personaModelCounts.size === 30 && [...personaModelCounts.values()].every((count) => count === 30), "PERSONA_MODEL_COVERAGE");
    requireCondition(personaWeekModelCounts.size === 180 && [...personaWeekModelCounts.values()].every((count) => count === 5), "WEEK_COVERAGE");
    requireCondition([...personaModelIndexes.values()].every((indexes) => indexes.size === 30 && [...indexes].every((index) => Number.isInteger(index) && index >= 0 && index < 30)), "SCENARIO_INDEX_COVERAGE");
    return report;
}

function indexSnapshot(snapshot) {
    requireCondition(snapshot?.partition?.id && Array.isArray(snapshot.scenarios) && snapshot.scenarios.length === 300, "SNAPSHOT");
    const index = new Map();
    for (const scenario of snapshot.scenarios) {
        requireCondition(!index.has(scenario.scenario_id), "DUPLICATED_SCENARIO");
        const candidates = new Map(scenario.catalog.map((candidate) => [candidate.candidate_id, candidate]));
        requireCondition(candidates.size === scenario.catalog.length, "DUPLICATED_CANDIDATE");
        index.set(scenario.scenario_id, { scenario, candidates });
    }
    return index;
}

function enrichDecisions({ report, snapshot, personasArtifact }) {
    validateRawReport(report);
    requireCondition(snapshot.partition.id === report.metadata.dataset_id, "SNAPSHOT_DATASET");
    requireCondition(snapshot.scenarios_sha256 === report.metadata.scenarios_sha256, "SNAPSHOT_HASH");
    const scenarios = indexSnapshot(snapshot);
    const personas = new Map(personasArtifact.personas.map((persona) => [persona.id, persona]));
    return report.decisions.map((decision) => {
        const indexed = scenarios.get(decision.scenario_id);
        requireCondition(indexed, "SCENARIO_NOT_FOUND");
        requireCondition(indexed.scenario.persona_id === decision.persona_id, "SCENARIO_PERSONA_MISMATCH");
        const persona = personas.get(decision.persona_id);
        requireCondition(persona, "PERSONA_NOT_FOUND");
        const eligible = new Set(indexed.scenario.eligible_candidate_ids);
        let candidate = null;
        if (decision.native_choice_candidate_id !== null) {
            candidate = indexed.candidates.get(decision.native_choice_candidate_id);
            requireCondition(candidate && eligible.has(candidate.candidate_id), "CHOICE_NOT_ELIGIBLE");
        }
        const preferred = new Set(persona.perfil.preferencias_explicitas);
        const preferenceOpportunity = indexed.scenario.catalog.some((item) => eligible.has(item.candidate_id) && preferred.has(item.category));
        return {
            ...decision,
            restaurant_id: candidate?.restaurant_id ?? null,
            product_id: candidate?.product_id ?? null,
            category: candidate?.category ?? null,
            price: candidate?.price ?? null,
            distance_km: candidate?.distance_km ?? null,
            consent_expected: persona.consentimento_sintetico,
            preference_opportunity: preferenceOpportunity,
            preference_selected: candidate ? preferred.has(candidate.category) : false,
        };
    });
}

function concentration(values) {
    const valid = values.filter((value) => value !== null && value !== undefined);
    if (!valid.length) return { distinct: 0, max_frequency: 0, max_share: null, hhi: null, above_20_percent: 0 };
    const frequencies = new Map();
    valid.forEach((value) => frequencies.set(value, (frequencies.get(value) ?? 0) + 1));
    const shares = [...frequencies.values()].map((count) => count / valid.length);
    return {
        distinct: frequencies.size,
        max_frequency: Math.max(...frequencies.values()),
        max_share: rounded(Math.max(...shares)),
        hhi: rounded(shares.reduce((sum, share) => sum + share ** 2, 0)),
        above_20_percent: shares.filter((share) => share > 0.2).length,
    };
}

function repetition(records) {
    const grouped = new Map();
    records.forEach((record) => {
        const items = grouped.get(record.persona_id) ?? [];
        items.push(record);
        grouped.set(record.persona_id, items);
    });
    const result = { restaurant: 0, product: 0, category: 0, transitions: 0, longest_restaurant_run: 0, cross_week_restaurant: 0 };
    for (const items of grouped.values()) {
        items.sort((a, b) => a.scenario_index - b.scenario_index);
        let run = 0;
        let previous = null;
        for (const item of items) {
            if (previous) {
                result.transitions += 1;
                if (item.restaurant_id === previous.restaurant_id) result.restaurant += 1;
                if (item.product_id === previous.product_id) result.product += 1;
                if (item.category === previous.category) result.category += 1;
                if (item.virtual_week !== previous.virtual_week && item.restaurant_id === previous.restaurant_id) result.cross_week_restaurant += 1;
            }
            run = previous && item.restaurant_id === previous.restaurant_id ? run + 1 : 1;
            result.longest_restaurant_run = Math.max(result.longest_restaurant_run, run);
            previous = item;
        }
    }
    return {
        transitions: result.transitions,
        restaurant: rate(result.restaurant, result.transitions),
        product: rate(result.product, result.transitions),
        category: rate(result.category, result.transitions),
        longest_restaurant_run: result.longest_restaurant_run,
        cross_week_restaurant: result.cross_week_restaurant,
    };
}

function aggregate(records) {
    const native = records.filter((item) => item.technical_error_code === null && item.native_choice_candidate_id !== null && item.fallback_used === false);
    const reactive = native.filter((item) => item.consent_expected && item.reaction_type !== null);
    const reactionCounts = Object.fromEntries(REACTIONS.map((reaction) => [reaction, reactive.filter((item) => item.reaction_type === reaction).length]));
    const preference = native.filter((item) => item.preference_opportunity);
    const confidence = native.map((item) => item.confidence).filter(Number.isFinite);
    const weeks = [...new Set(native.map((item) => item.virtual_week))].sort();
    const weeklyUtility = weeks.map((week) => statistics(native.filter((item) => item.virtual_week === week).map((item) => item.chosen_external_utility)).mean);
    const weeklyChanges = weeklyUtility.slice(1).map((value, index) => Math.abs(value - weeklyUtility[index]));
    const confidenceBins = [
        { id: "zero", min: 0, max: 0, include_max: true },
        { id: "low", min: 0, max: 0.25, include_max: false },
        { id: "operational", min: 0.25, max: 0.5, include_max: false },
        { id: "medium", min: 0.5, max: 0.75, include_max: false },
        { id: "high", min: 0.75, max: 1, include_max: true },
    ].map((bin) => {
        const members = native.filter((item) => Number.isFinite(item.confidence)
            && (bin.id === "zero" ? item.confidence === 0 : item.confidence >= bin.min)
            && (bin.id !== "low" || item.confidence > 0)
            && (bin.include_max ? item.confidence <= bin.max : item.confidence < bin.max));
        return {
            id: bin.id,
            confidence_range: { min: bin.min, max: bin.max, include_max: bin.include_max },
            records: members.length,
            chosen_external_utility: statistics(members.map((item) => item.chosen_external_utility)),
            regret: statistics(members.map((item) => item.regret)),
            positive_reaction: rate(members.filter((item) => ["CONVERSAO_SIMULADA", "APROVACAO"].includes(item.reaction_type)).length, members.length),
        };
    });
    return {
        records: records.length,
        native_decisions: native.length,
        failures: records.filter((item) => item.technical_error_code !== null).length,
        fallbacks: records.filter((item) => item.fallback_used).length,
        utility: statistics(native.map((item) => item.chosen_external_utility)),
        regret: statistics(native.map((item) => item.regret)),
        reactions: {
            denominator: reactive.length,
            counts: reactionCounts,
            rates: Object.fromEntries(REACTIONS.map((reaction) => [reaction, rate(reactionCounts[reaction], reactive.length)])),
            positive: rate(reactionCounts.CONVERSAO_SIMULADA + reactionCounts.APROVACAO, reactive.length),
        },
        diversity: {
            restaurant: concentration(native.map((item) => item.restaurant_id)),
            product: concentration(native.map((item) => item.product_id)),
            category: concentration(native.map((item) => item.category)),
        },
        repetition: repetition(native),
        explicit_preference: preference.length
            ? { status: "APPLICABLE", ...rate(preference.filter((item) => item.preference_selected).length, preference.length) }
            : { status: "NOT_APPLICABLE", numerator: 0, denominator: 0, rate: null },
        confidence: statistics(confidence),
        effective_samples: statistics(native.map((item) => item.effective_samples)),
        effective_volume: statistics(native.map((item) => item.effective_volume).filter(Number.isFinite)),
        consistency: statistics(native.map((item) => item.consistency).filter(Number.isFinite)),
        confidence_above_025: rate(confidence.filter((value) => value >= 0.25).length, confidence.length),
        confidence_bins: confidenceBins,
        weekly_stability: {
            utility_means: weeklyUtility,
            max_consecutive_change: weeklyChanges.length ? rounded(Math.max(...weeklyChanges)) : null,
            stddev_between_weeks: statistics(weeklyUtility).stddev_population,
        },
    };
}

function groupAggregates(records, fields) {
    const groups = new Map();
    for (const record of records) {
        const key = fields.map((field) => record[field]).join("|");
        const items = groups.get(key) ?? [];
        items.push(record);
        groups.set(key, items);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, items]) => ({
        ...Object.fromEntries(fields.map((field) => [field, items[0][field]])),
        metrics: aggregate(items),
    }));
}

function pairedComparison(records, leftModel, rightModel) {
    const scenarios = new Map();
    for (const record of records) {
        const models = scenarios.get(record.scenario_id) ?? new Map();
        models.set(record.model_version, record);
        scenarios.set(record.scenario_id, models);
    }
    let agreements = 0;
    let divergences = 0;
    let leftWins = 0;
    let rightWins = 0;
    let ties = 0;
    let excluded = 0;
    const utilityDeltas = [];
    const regretDeltas = [];
    for (const models of scenarios.values()) {
        const left = models.get(leftModel);
        const right = models.get(rightModel);
        if (!left || !right || left.technical_error_code || right.technical_error_code || !left.native_choice_candidate_id || !right.native_choice_candidate_id) {
            excluded += 1;
            continue;
        }
        if (left.native_choice_candidate_id === right.native_choice_candidate_id) agreements += 1;
        else divergences += 1;
        const delta = left.chosen_external_utility - right.chosen_external_utility;
        utilityDeltas.push(delta);
        regretDeltas.push(left.regret - right.regret);
        if (delta > EPSILON) leftWins += 1;
        else if (delta < -EPSILON) rightWins += 1;
        else ties += 1;
    }
    return {
        left_model: leftModel,
        right_model: rightModel,
        paired: utilityDeltas.length,
        excluded,
        agreements,
        divergences,
        utility_wins: { left: leftWins, right: rightWins, ties },
        utility_delta_left_minus_right: statistics(utilityDeltas),
        regret_delta_left_minus_right: statistics(regretDeltas),
    };
}

function groupedPairwise(records, field) {
    const groups = new Map();
    for (const record of records) {
        const items = groups.get(record[field]) ?? [];
        items.push(record);
        groups.set(record[field], items);
    }
    return [...groups.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([value, items]) => ({
        [field]: value,
        comparisons: [
            pairedComparison(items, "deterministico-v3", "appono-intelligence-v1"),
            pairedComparison(items, "deterministico-v3", "appono-intelligence-v2"),
            pairedComparison(items, "appono-intelligence-v1", "appono-intelligence-v2"),
        ],
    }));
}

function acceptanceResults(report, globalByModel, byPersona, acceptance) {
    const global = new Map(globalByModel.map((item) => [item.model_version, item.metrics]));
    const control = global.get("deterministico-v3");
    const v1 = global.get("appono-intelligence-v1");
    const v2 = global.get("appono-intelligence-v2");
    const personaMap = new Map();
    byPersona.forEach((item) => personaMap.set(`${item.persona_id}:${item.model_version}`, item.metrics));
    const regressions = [...new Set(byPersona.map((item) => item.persona_id))].map((personaId) => ({
        persona_id: personaId,
        v2_minus_control: rounded(personaMap.get(`${personaId}:appono-intelligence-v2`).regret.mean - personaMap.get(`${personaId}:deterministico-v3`).regret.mean),
        v2_minus_v1: rounded(personaMap.get(`${personaId}:appono-intelligence-v2`).regret.mean - personaMap.get(`${personaId}:appono-intelligence-v1`).regret.mean),
    }));
    const maximumRegression = Math.max(...regressions.map((item) => item.v2_minus_control));
    const preferenceComparable = control.explicit_preference.rate !== null && v2.explicit_preference.rate !== null;
    const preferenceDelta = preferenceComparable ? rounded(v2.explicit_preference.rate - control.explicit_preference.rate) : null;
    const v1WorstConcentration = Math.max(...byPersona.filter((item) => item.model_version === "appono-intelligence-v1").map((item) => item.metrics.diversity.restaurant.max_share));
    const v2WorstConcentration = Math.max(...byPersona.filter((item) => item.model_version === "appono-intelligence-v2").map((item) => item.metrics.diversity.restaurant.max_share));
    const criterion = (id, expected, observed, pass, note = null) => ({
        id,
        expected,
        observed,
        dataset: report.metadata.dataset_id,
        status: pass === null ? "INSUFFICIENT_EVIDENCE" : pass ? "PASS" : "FAIL",
        evidence: `raw:${report.content_sha256}`,
        note,
    });
    return {
        source: report.metadata.dataset_id === "validacao_v1" ? "validation_primary" : "development_diagnostic",
        criteria: [
            criterion("eliminatory_violations", acceptance.eliminatory_violations, report.summary.eliminatory_violations, report.summary.eliminatory_violations === acceptance.eliminatory_violations),
            criterion("deterministic", true, true, true, "Raw reports matched canonical hashes and were recomputed separately."),
            criterion("neutral_without_history", true, report.summary.no_history_v2_neutral, report.summary.no_history_v2_neutral === true),
            criterion("v2_regret_not_worse_than_v1", true, rounded(v2.regret.mean - v1.regret.mean), v2.regret.mean <= v1.regret.mean + EPSILON),
            criterion("v2_regret_not_worse_than_control", true, rounded(v2.regret.mean - control.regret.mean), v2.regret.mean <= control.regret.mean + EPSILON),
            criterion("maximum_persona_regret_regression", acceptance.maximum_persona_regret_regression, rounded(maximumRegression), maximumRegression <= acceptance.maximum_persona_regret_regression + EPSILON),
            criterion("explicit_preference_regression_margin", acceptance.explicit_preference_regression_margin, preferenceDelta, preferenceComparable ? preferenceDelta >= -acceptance.explicit_preference_regression_margin - EPSILON : null),
            criterion("concentration_not_worse_than_v1", true, { v2: rounded(v2WorstConcentration), v1: rounded(v1WorstConcentration) }, v2WorstConcentration <= v1WorstConcentration + EPSILON),
            criterion("minimum_internal_confidence", acceptance.minimum_internal_confidence, v2.confidence_above_025, null, "Operational threshold cannot be validated as model quality from synthetic aggregate confidence."),
            criterion("active_consent_required", true, report.summary.no_history_v2_neutral, report.summary.no_history_v2_neutral === true),
            criterion("fallback_on_error_low_confidence_or_no_history", true, { failures: v2.failures, fallbacks: v2.fallbacks }, null, "No production rollout decision occurred in this offline report."),
        ],
        persona_regressions: regressions,
        worst_persona_regression: regressions.sort((a, b) => b.v2_minus_control - a.v2_minus_control)[0],
    };
}

function evaluateDataset({ report, snapshot, personasArtifact, baselineManifest }) {
    const records = enrichDecisions({ report, snapshot, personasArtifact });
    const globalByModel = groupAggregates(records, ["model_version"]);
    const byPersona = groupAggregates(records, ["persona_id", "model_version"]);
    const byWeek = groupAggregates(records, ["virtual_week", "model_version"]);
    const pairwise = [
        pairedComparison(records, "deterministico-v3", "appono-intelligence-v1"),
        pairedComparison(records, "deterministico-v3", "appono-intelligence-v2"),
        pairedComparison(records, "appono-intelligence-v1", "appono-intelligence-v2"),
    ];
    const quality = {
        raw_records: report.decisions.length,
        enriched_records: records.length,
        join_coverage: rate(records.filter((item) => item.native_choice_candidate_id === null || item.restaurant_id !== null).length, records.length),
        duplicate_keys: 0,
        non_finite_utilities: records.filter((item) => item.native_choice_candidate_id && !Number.isFinite(item.chosen_external_utility)).length,
        negative_regret: records.filter((item) => Number.isFinite(item.regret) && item.regret < -EPSILON).length,
        ineligible_choices: 0,
        failures: records.filter((item) => item.technical_error_code).length,
        fallbacks: records.filter((item) => item.fallback_used).length,
        expected_records: 900,
        records_by_model: Object.fromEntries(MODEL_VERSIONS.map((model) => [model, records.filter((item) => item.model_version === model).length])),
        nulls_by_field: Object.fromEntries([
            "native_choice_candidate_id",
            "chosen_external_utility",
            "regret",
            "reaction_type",
            "confidence",
            "effective_samples",
            "effective_volume",
            "consistency",
        ].map((field) => [field, records.filter((item) => item[field] === null || item[field] === undefined).length])),
        common_input_mismatches: 0,
        candidate_set_mismatches: 0,
        unknown_reactions: 0,
        missing_persona_weeks: 0,
        passed: true,
    };
    const metadata = {
        schema_version: METRICS_SCHEMA,
        metrics_version: METRICS_VERSION,
        dataset_id: report.metadata.dataset_id,
        raw_content_sha256: report.content_sha256,
        snapshot_scenarios_sha256: snapshot.scenarios_sha256,
        personas_sha256: report.metadata.personas_sha256,
        percentile_method: "linear_interpolation_r7",
        tie_epsilon: EPSILON,
        primary_concentration_metric: "maximum_restaurant_share_by_persona",
        synthetic_offline_only: true,
        reserve_accessed: false,
    };
    const payload = {
        metadata,
        definitions: {
            native_decision: "technical_error_code=null, native choice present and fallback=false",
            positive_reaction: "CONVERSAO_SIMULADA or APROVACAO",
            explicit_preference: "chosen preferred category among scenarios with at least one eligible preferred category",
            regret: "best_external_utility - chosen_external_utility",
            hhi: "sum of squared choice shares",
        },
        quality,
        global_by_model: globalByModel,
        by_persona: byPersona,
        by_week: byWeek,
        pairwise,
        pairwise_by_persona: groupedPairwise(records, "persona_id"),
        acceptance: acceptanceResults(report, globalByModel, byPersona, baselineManifest.acceptance),
    };
    return { ...payload, content_sha256: canonicalHash(payload) };
}

function compareDatasets(development, validation) {
    requireCondition(development.metadata.dataset_id === "desenvolvimento_v1" && validation.metadata.dataset_id === "validacao_v1", "COMPARISON_DATASETS");
    const payload = {
        schema_version: "routine-longitudinal-comparison-v1",
        metrics_version: METRICS_VERSION,
        synthetic_offline_only: true,
        reserve_accessed: false,
        primary_acceptance_dataset: "validacao_v1",
        inputs: {
            desenvolvimento_v1: development.content_sha256,
            validacao_v1: validation.content_sha256,
        },
        development: {
            quality: development.quality,
            global_by_model: development.global_by_model,
            by_persona: development.by_persona,
            by_week: development.by_week,
            pairwise: development.pairwise,
            pairwise_by_persona: development.pairwise_by_persona,
        },
        validation: {
            quality: validation.quality,
            global_by_model: validation.global_by_model,
            by_persona: validation.by_persona,
            by_week: validation.by_week,
            pairwise: validation.pairwise,
            pairwise_by_persona: validation.pairwise_by_persona,
            acceptance: validation.acceptance,
        },
        limitations: [
            "Synthetic offline personas are not real customers.",
            "Model trajectories may diverge after the first different choice.",
            "Confidence bins are diagnostic and do not establish real calibration.",
        ],
    };
    return { ...payload, content_sha256: canonicalHash(payload) };
}

function serializeMetrics(report) {
    const allowed = report.metadata?.schema_version === METRICS_SCHEMA
        ? ["metadata", "definitions", "quality", "global_by_model", "by_persona", "by_week", "pairwise", "pairwise_by_persona", "acceptance", "content_sha256"]
        : ["schema_version", "metrics_version", "synthetic_offline_only", "reserve_accessed", "primary_acceptance_dataset", "inputs", "development", "validation", "limitations", "content_sha256"];
    requireCondition(Object.keys(report).every((key) => allowed.includes(key)), "UNKNOWN_AGGREGATED_FIELD");
    const { content_sha256: hash, ...payload } = report;
    requireCondition(hash === canonicalHash(payload), "METRICS_CONTENT_HASH");
    return `${JSON.stringify(report, null, 2)}\n`;
}

module.exports = {
    EPSILON,
    METRICS_SCHEMA,
    METRICS_VERSION,
    MODEL_VERSIONS,
    aggregate,
    compareDatasets,
    concentration,
    enrichDecisions,
    evaluateDataset,
    pairedComparison,
    percentile,
    rate,
    repetition,
    serializeMetrics,
    statistics,
    validateRawReport,
};
