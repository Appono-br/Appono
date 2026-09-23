"use strict";

const crypto = require("node:crypto");
const {
    auditSensitiveData,
    canonicalHash,
    canonicalSerialize,
    scenarioIdentity,
    semanticScenarioKey,
    validatePartitionsArtifact,
} = require("./routine-intelligence-partitions");
const { hashCanonico: personaHash, validarArtefatoPersonas } = require("./routine-intelligence-personas");

const GENERATOR_VERSION = "routine-scenario-generator-v1";
const SNAPSHOT_SCHEMA_VERSION = 1;
const EXPECTED_PARTITIONS_HASH = "40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7";
const EXPECTED_PERSONAS_HASH = "dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474";
const HISTORY_LEVELS = Object.freeze(["NONE", "LOW", "SUFFICIENT", "OLD", "CONTRADICTORY", "GRADUAL_CHANGE"]);
const INELIGIBILITY_REASONS = Object.freeze([
    "FORA_ORCAMENTO",
    "FORA_RAIO",
    "RESTAURANTE_FECHADO",
    "PRODUTO_INDISPONIVEL",
    "ANTECEDENCIA_INSUFICIENTE",
    "JANELA_INSUFICIENTE",
    "SEGURANCA_NAO_VERIFICADA",
]);
const SNAPSHOT_KEYS = new Set([
    "schema_version", "generator_version", "protocol", "partitions_version", "partitions_sha256",
    "personas_version", "personas_sha256", "partition", "total_personas", "total_scenarios",
    "scenarios_sha256", "coverage", "scenarios",
]);
const SNAPSHOT_PARTITION_KEYS = new Set(["id", "type", "namespace", "seed", "period", "timezone", "weeks"]);
const SCENARIO_KEYS = new Set([
    "scenario_id", "semantic_key_sha256", "partition_id", "persona_version", "persona_id",
    "virtual_week", "virtual_day", "scenario_index", "instant_utc", "timezone", "meal_window",
    "history_level", "profile", "history", "catalog_variant", "availability_variant", "catalog",
    "eligible_candidate_ids", "ineligible_candidates", "input_snapshot_sha256",
]);
const PROFILE_KEYS = new Set(["budget", "radius_km", "explicit_preferences", "synthetic_consent"]);
const HISTORY_KEYS = new Set(["history_instance_id", "level", "recent_choices", "signals"]);
const RECENT_CHOICE_KEYS = new Set(["restaurant_id", "product_id", "category", "occurred_at"]);
const SIGNAL_KEYS = new Set([
    "signal_id", "idempotency_key", "event_type", "occurred_at", "category", "restaurant_id",
    "product_id", "value", "consent_valid", "active", "synthetic_offline",
]);
const CANDIDATE_KEYS = new Set([
    "candidate_id", "restaurant_id", "product_id", "category", "price", "distance_km", "rating",
    "operational_score", "restaurant_open", "product_available", "advance_satisfied",
    "window_sufficient", "food_safety_verified", "catalog_variant", "ineligibility_reasons",
]);
const INELIGIBLE_CANDIDATE_KEYS = new Set(["candidate_id", "reasons"]);

function requireCondition(condition, message) {
    if (!condition) throw new Error(`SCENARIO_GENERATOR_INVALID: ${message}`);
}

function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function requireExactKeys(value, expected, path) {
    requireCondition(value && typeof value === "object" && !Array.isArray(value), `${path}: object is required`);
    for (const key of Object.keys(value)) requireCondition(expected.has(key), `${path}: unknown field ${key}`);
    for (const key of expected) requireCondition(Object.hasOwn(value, key), `${path}: missing field ${key}`);
}

function hasIntersection(first, second) {
    for (const value of first) if (second.has(value)) return true;
    return false;
}

function forbiddenResultFields(value, path = "$") {
    const forbidden = new Set(["model", "model_version", "winner", "confidence", "adjustment", "utility", "ranking_score"]);
    const findings = [];
    const visit = (current, currentPath) => {
        if (Array.isArray(current)) return current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
        if (!current || typeof current !== "object") return;
        for (const [key, item] of Object.entries(current)) {
            const itemPath = `${currentPath}.${key}`;
            if (forbidden.has(key)) findings.push(itemPath);
            visit(item, itemPath);
        }
    };
    visit(value, path);
    return findings;
}

function sha256(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hierarchicalUnit(seed, ...parts) {
    requireCondition(Number.isInteger(seed), "public seed must be an integer");
    const hash = sha256(canonicalSerialize({ seed, parts }));
    return Number.parseInt(hash.slice(0, 13), 16) / 0x1fffffffffffff;
}

function deterministicNumber({ seed, parts, minimum, maximum, decimals = 2 }) {
    requireCondition(finite(minimum) && finite(maximum) && maximum >= minimum, "numeric range is invalid");
    const value = Number(minimum) + hierarchicalUnit(seed, ...parts) * (Number(maximum) - Number(minimum));
    return Number(value.toFixed(decimals));
}

function deterministicInteger({ seed, parts, minimum, maximum }) {
    requireCondition(Number.isInteger(minimum) && Number.isInteger(maximum) && maximum >= minimum, "integer range is invalid");
    return minimum + Math.floor(hierarchicalUnit(seed, ...parts) * (maximum - minimum + 1));
}

function syntheticId(prefix, partition, personaId, scenarioIndex, itemIndex) {
    const suffix = sha256(`${partition.namespace}:${personaId}:${scenarioIndex}:${itemIndex}`).slice(0, 12);
    return `${prefix}-${partition.id}-${suffix}`;
}

function selectCategory(partition, persona, scenarioIndex, candidateIndex) {
    const preferred = persona.perfil.preferencias_explicitas;
    const affinity = Object.keys(persona.afinidades.categorias);
    if (candidateIndex === 0 && preferred.length) return preferred[scenarioIndex % preferred.length];
    if (candidateIndex === 1 && affinity.length) return affinity[scenarioIndex % affinity.length];
    const categories = partition.catalog_strategy.categories;
    return categories[(partition.catalog_strategy.variant_offset + scenarioIndex + candidateIndex * 3) % categories.length];
}

function scenarioClock(partition, week, day) {
    const instant = new Date(Date.parse(partition.period.start) + ((week * 7) + day) * 86400000);
    requireCondition(instant.getTime() <= Date.parse(partition.period.end), `${partition.id}: scenario falls outside partition period`);
    return instant;
}

function candidateBase({ partition, persona, scenarioIndex, candidateIndex, seed }) {
    const priceRange = partition.catalog_strategy.price_range;
    const distanceRange = partition.catalog_strategy.distance_range_km;
    const category = selectCategory(partition, persona, scenarioIndex, candidateIndex);
    const restaurantId = syntheticId("syn-rest", partition, persona.id, scenarioIndex, candidateIndex);
    const productId = syntheticId("syn-prod", partition, persona.id, scenarioIndex, candidateIndex);
    const common = [partition.namespace, persona.id, scenarioIndex, candidateIndex];
    let price;
    let distance;
    if (candidateIndex < 4) {
        price = deterministicNumber({
            seed,
            parts: [...common, "price-eligible"],
            minimum: Math.max(priceRange[0], persona.perfil.orcamento * 0.45),
            maximum: Math.min(priceRange[1], persona.perfil.orcamento * 0.92),
        });
        distance = deterministicNumber({
            seed,
            parts: [...common, "distance-eligible"],
            minimum: distanceRange[0],
            maximum: Math.min(distanceRange[1], persona.perfil.raio_km * 0.9),
        });
    } else if (candidateIndex === 4) {
        price = deterministicNumber({
            seed,
            parts: [...common, "price-over-budget"],
            minimum: Math.max(priceRange[0], persona.perfil.orcamento + 0.5),
            maximum: priceRange[1],
        });
        distance = deterministicNumber({ seed, parts: [...common, "distance-normal"], minimum: distanceRange[0], maximum: Math.min(distanceRange[1], persona.perfil.raio_km * 0.8) });
    } else if (candidateIndex === 5) {
        price = deterministicNumber({ seed, parts: [...common, "price-normal"], minimum: priceRange[0], maximum: Math.min(priceRange[1], persona.perfil.orcamento * 0.9) });
        distance = deterministicNumber({
            seed,
            parts: [...common, "distance-over-radius"],
            minimum: Math.max(distanceRange[0], persona.perfil.raio_km + 0.1),
            maximum: distanceRange[1],
        });
    } else {
        price = deterministicNumber({ seed, parts: [...common, "price-structural"], minimum: priceRange[0], maximum: Math.min(priceRange[1], persona.perfil.orcamento * 0.9) });
        distance = deterministicNumber({ seed, parts: [...common, "distance-structural"], minimum: distanceRange[0], maximum: Math.min(distanceRange[1], persona.perfil.raio_km * 0.9) });
    }
    return {
        candidate_id: `syn-candidate-${partition.id}-${persona.id}-${String(scenarioIndex).padStart(2, "0")}-${candidateIndex}`,
        restaurant_id: restaurantId,
        product_id: productId,
        category,
        price,
        distance_km: distance,
        rating: deterministicNumber({ seed, parts: [...common, "rating"], minimum: 3.8, maximum: 4.9, decimals: 1 }),
        operational_score: deterministicInteger({ seed, parts: [...common, "operational-score"], minimum: 55, maximum: 100 }),
        restaurant_open: true,
        product_available: true,
        advance_satisfied: true,
        window_sufficient: true,
        food_safety_verified: true,
        catalog_variant: partition.catalog_strategy.variant_offset + scenarioIndex,
    };
}

function applyStructuralIneligibility(candidate, scenarioIndex, candidateIndex) {
    const result = { ...candidate };
    if (candidateIndex === 6) {
        const variant = scenarioIndex % 3;
        if (variant === 0) result.restaurant_open = false;
        if (variant === 1) result.product_available = false;
        if (variant === 2) result.advance_satisfied = false;
    }
    if (candidateIndex === 7) {
        if (scenarioIndex % 2 === 0) result.window_sufficient = false;
        else result.food_safety_verified = false;
    }
    return result;
}

function ineligibilityReasons(persona, candidate) {
    const reasons = [];
    if (candidate.price > persona.perfil.orcamento) reasons.push("FORA_ORCAMENTO");
    if (candidate.distance_km > persona.perfil.raio_km) reasons.push("FORA_RAIO");
    if (!candidate.restaurant_open) reasons.push("RESTAURANTE_FECHADO");
    if (!candidate.product_available) reasons.push("PRODUTO_INDISPONIVEL");
    if (!candidate.advance_satisfied) reasons.push("ANTECEDENCIA_INSUFICIENTE");
    if (!candidate.window_sufficient) reasons.push("JANELA_INSUFICIENTE");
    if (!candidate.food_safety_verified) reasons.push("SEGURANCA_NAO_VERIFICADA");
    return reasons;
}

function generateCatalog({ partition, persona, scenarioIndex, seed }) {
    const catalog = [];
    for (let candidateIndex = 0; candidateIndex < 8; candidateIndex += 1) {
        const candidate = applyStructuralIneligibility(
            candidateBase({ partition, persona, scenarioIndex, candidateIndex, seed }),
            scenarioIndex,
            candidateIndex,
        );
        catalog.push({ ...candidate, ineligibility_reasons: ineligibilityReasons(persona, candidate) });
    }
    catalog.sort((first, second) => first.candidate_id.localeCompare(second.candidate_id));
    const eligibleIds = catalog.filter((candidate) => candidate.ineligibility_reasons.length === 0).map((candidate) => candidate.candidate_id);
    const ineligible = catalog.filter((candidate) => candidate.ineligibility_reasons.length > 0).map((candidate) => ({
        candidate_id: candidate.candidate_id,
        reasons: candidate.ineligibility_reasons,
    }));
    requireCondition(eligibleIds.length >= 2, `${partition.id}/${persona.id}/${scenarioIndex}: fewer than two eligible candidates`);
    return { catalog, eligible_candidate_ids: eligibleIds, ineligible_candidates: ineligible };
}

function historyLevel(persona, scenarioIndex) {
    if (persona.id === "controle_sem_historico") return "NONE";
    return HISTORY_LEVELS[scenarioIndex % HISTORY_LEVELS.length];
}

function historySignalCount(level, scenarioIndex) {
    if (level === "NONE") return 0;
    if (level === "LOW") return 1 + (scenarioIndex % 2);
    if (level === "SUFFICIENT") return 6;
    if (level === "OLD") return 4;
    if (level === "CONTRADICTORY") return 4;
    return 5;
}

function signalType(level, index) {
    if (level === "CONTRADICTORY") return index % 2 === 0 ? "APROVACAO" : "RECUSA";
    return ["APROVACAO", "CONVERSAO_SIMULADA", "ALTERNATIVA", "EDICAO"][index % 4];
}

function signalValue(level, index) {
    if (level === "CONTRADICTORY") return index % 2 === 0 ? 1 : -1;
    return [1, 1.5, -0.6, 0.4][index % 4];
}

function generateHistory({ partition, persona, scenarioIndex, scenarioInstant, catalog, seed }) {
    const level = historyLevel(persona, scenarioIndex);
    const count = historySignalCount(level, scenarioIndex);
    const signals = [];
    const preferences = persona.perfil.preferencias_explicitas;
    const affinityCategories = Object.keys(persona.afinidades.categorias);
    for (let index = 0; index < count; index += 1) {
        const oldDays = level === "OLD" ? 70 + index * 5 : 1 + index * 2;
        const occurredAt = new Date(scenarioInstant.getTime() - oldDays * 86400000);
        let category = preferences[index % Math.max(1, preferences.length)]
            ?? affinityCategories[index % Math.max(1, affinityCategories.length)]
            ?? catalog[index % catalog.length].category;
        if (level === "GRADUAL_CHANGE" && persona.mudanca_temporal) {
            category = scenarioIndex < 15 ? persona.mudanca_temporal.categoria_inicial : persona.mudanca_temporal.categoria_futura;
        }
        const sourceCandidate = catalog[index % catalog.length];
        signals.push({
            signal_id: `syn-signal-${partition.id}-${persona.id}-${String(scenarioIndex).padStart(2, "0")}-${index}`,
            idempotency_key: `offline:${partition.id}:${persona.id}:${scenarioIndex}:${index}`,
            event_type: signalType(level, index),
            occurred_at: occurredAt.toISOString(),
            category,
            restaurant_id: sourceCandidate.restaurant_id,
            product_id: sourceCandidate.product_id,
            value: signalValue(level, index),
            consent_valid: persona.consentimento_sintetico && !(level === "SUFFICIENT" && index === count - 1),
            active: !(level === "SUFFICIENT" && index === count - 2),
            synthetic_offline: true,
        });
    }
    const recentChoices = catalog.slice(0, Math.min(3, Math.max(0, scenarioIndex % 4))).map((candidate, index) => ({
        restaurant_id: candidate.restaurant_id,
        product_id: candidate.product_id,
        category: candidate.category,
        occurred_at: new Date(scenarioInstant.getTime() - (index + 1) * 86400000).toISOString(),
    }));
    return {
        history_instance_id: `syn-history-${partition.id}-${persona.id}-${String(scenarioIndex).padStart(2, "0")}`,
        level,
        recent_choices: recentChoices,
        signals,
    };
}

function generateScenario({ artifact, partition, persona, week, day, seed }) {
    const scenarioIndex = week * 5 + day;
    const scenarioInstant = scenarioClock(partition, week, day);
    const mealWindow = persona.perfil.janelas[scenarioIndex % persona.perfil.janelas.length].tipo;
    const identityInput = {
        persona_id: persona.id,
        virtual_week: week,
        virtual_day: day,
        meal_window: mealWindow,
        catalog_variant: partition.catalog_strategy.variant_offset + scenarioIndex,
        availability_variant: partition.availability_strategy.variant_offset + scenarioIndex,
        scenario_index: scenarioIndex,
    };
    const scenarioId = scenarioIdentity(artifact, partition, identityInput);
    const catalogData = generateCatalog({ partition, persona, scenarioIndex, seed });
    const history = generateHistory({
        partition,
        persona,
        scenarioIndex,
        scenarioInstant,
        catalog: catalogData.catalog,
        seed,
    });
    const base = {
        scenario_id: scenarioId,
        semantic_key_sha256: sha256(semanticScenarioKey(artifact, partition, identityInput)),
        partition_id: partition.id,
        persona_version: artifact.personas.version,
        persona_id: persona.id,
        virtual_week: week,
        virtual_day: day,
        scenario_index: scenarioIndex,
        instant_utc: scenarioInstant.toISOString(),
        timezone: partition.timezone,
        meal_window: mealWindow,
        history_level: history.level,
        profile: {
            budget: persona.perfil.orcamento,
            radius_km: persona.perfil.raio_km,
            explicit_preferences: [...persona.perfil.preferencias_explicitas].sort(),
            synthetic_consent: persona.consentimento_sintetico,
        },
        history,
        catalog_variant: identityInput.catalog_variant,
        availability_variant: identityInput.availability_variant,
        catalog: catalogData.catalog,
        eligible_candidate_ids: catalogData.eligible_candidate_ids,
        ineligible_candidates: catalogData.ineligible_candidates,
    };
    return { ...base, input_snapshot_sha256: canonicalHash(base) };
}

function validateGeneratorInputs({ partitionsArtifact, partition, personasArtifact, generatorVersion = GENERATOR_VERSION }) {
    validatePartitionsArtifact(partitionsArtifact);
    validarArtefatoPersonas(personasArtifact);
    requireCondition(generatorVersion === GENERATOR_VERSION, `unsupported generator version ${generatorVersion}`);
    requireCondition(canonicalHash(partitionsArtifact) === EXPECTED_PARTITIONS_HASH, "partitions hash differs from frozen value");
    requireCondition(personaHash(personasArtifact) === EXPECTED_PERSONAS_HASH, "personas hash differs from frozen value");
    requireCondition(partition && partitionsArtifact.partitions.some((item) => item.id === partition.id), "partition is unknown");
    requireCondition(partition.type !== "RESERVA", "prospective reserve must remain sealed");
    requireCondition(partition.permissions.materialization === true, `${partition.id}: materialization is not allowed`);
    requireCondition(partition.seed_policy.mode === "PUBLIC" && Number.isInteger(partition.seed_policy.seed), `${partition.id}: public seed is required`);
    return true;
}

function summarizeCoverage(scenarios) {
    const byPersona = {};
    const historyLevels = {};
    const mealWindows = {};
    const reasons = Object.fromEntries(INELIGIBILITY_REASONS.map((reason) => [reason, 0]));
    const categories = new Set();
    let eligibleCandidates = 0;
    let ineligibleCandidates = 0;
    for (const scenario of scenarios) {
        byPersona[scenario.persona_id] = (byPersona[scenario.persona_id] ?? 0) + 1;
        historyLevels[scenario.history_level] = (historyLevels[scenario.history_level] ?? 0) + 1;
        mealWindows[scenario.meal_window] = (mealWindows[scenario.meal_window] ?? 0) + 1;
        eligibleCandidates += scenario.eligible_candidate_ids.length;
        ineligibleCandidates += scenario.ineligible_candidates.length;
        scenario.catalog.forEach((candidate) => categories.add(candidate.category));
        scenario.ineligible_candidates.flatMap((item) => item.reasons).forEach((reason) => { reasons[reason] = (reasons[reason] ?? 0) + 1; });
    }
    return {
        by_persona: Object.fromEntries(Object.entries(byPersona).sort()),
        history_levels: Object.fromEntries(Object.entries(historyLevels).sort()),
        meal_windows: Object.fromEntries(Object.entries(mealWindows).sort()),
        categories: [...categories].sort(),
        eligible_candidates: eligibleCandidates,
        ineligible_candidates: ineligibleCandidates,
        ineligibility_reasons: reasons,
    };
}

function generateScenarioSnapshot({ partitionsArtifact, partition, personasArtifact, generatorVersion = GENERATOR_VERSION, personaIds = null } = {}) {
    validateGeneratorInputs({ partitionsArtifact, partition, personasArtifact, generatorVersion });
    const requestedIds = personaIds ? [...personaIds] : [...partition.persona_ids];
    requireCondition(requestedIds.length > 0 && new Set(requestedIds).size === requestedIds.length, "persona selection is empty or duplicated");
    requireCondition(requestedIds.every((id) => partition.persona_ids.includes(id)), "persona selection contains unknown id");
    const personasById = new Map(personasArtifact.personas.map((persona) => [persona.id, persona]));
    const scenarios = [];
    for (const personaId of requestedIds) {
        const persona = personasById.get(personaId);
        requireCondition(persona, `persona definition is missing: ${personaId}`);
        for (let week = 0; week < partition.weeks; week += 1) {
            for (let day = 0; day < 5; day += 1) {
                scenarios.push(generateScenario({
                    artifact: partitionsArtifact,
                    partition,
                    persona,
                    week,
                    day,
                    seed: partition.seed_policy.seed,
                }));
            }
        }
    }
    scenarios.sort((first, second) => first.scenario_id.localeCompare(second.scenario_id));
    const scenarioHash = canonicalHash(scenarios);
    return {
        schema_version: SNAPSHOT_SCHEMA_VERSION,
        generator_version: GENERATOR_VERSION,
        protocol: partitionsArtifact.protocol,
        partitions_version: partitionsArtifact.partitions_version,
        partitions_sha256: canonicalHash(partitionsArtifact),
        personas_version: personasArtifact.personas_version,
        personas_sha256: personaHash(personasArtifact),
        partition: {
            id: partition.id,
            type: partition.type,
            namespace: partition.namespace,
            seed: partition.seed_policy.seed,
            period: partition.period,
            timezone: partition.timezone,
            weeks: partition.weeks,
        },
        total_personas: requestedIds.length,
        total_scenarios: scenarios.length,
        scenarios_sha256: scenarioHash,
        coverage: summarizeCoverage(scenarios),
        scenarios,
    };
}

function validateScenarioSnapshot(snapshot, { partitionsArtifact, personasArtifact } = {}) {
    requireExactKeys(snapshot, SNAPSHOT_KEYS, "snapshot");
    requireCondition(snapshot?.schema_version === SNAPSHOT_SCHEMA_VERSION, "snapshot schema is invalid");
    requireCondition(snapshot.generator_version === GENERATOR_VERSION, "snapshot generator version is invalid");
    requireExactKeys(snapshot.partition, SNAPSHOT_PARTITION_KEYS, "snapshot.partition");
    requireCondition(snapshot.partitions_sha256 === canonicalHash(partitionsArtifact), "snapshot partitions hash differs");
    requireCondition(snapshot.personas_sha256 === personaHash(personasArtifact), "snapshot personas hash differs");
    requireCondition(Array.isArray(snapshot.scenarios) && snapshot.scenarios.length === snapshot.total_scenarios, "snapshot scenario count differs");
    requireCondition(snapshot.scenarios_sha256 === canonicalHash(snapshot.scenarios), "snapshot scenario hash differs");
    requireCondition(auditSensitiveData(snapshot).length === 0, "snapshot contains sensitive fields");
    requireCondition(forbiddenResultFields(snapshot).length === 0, "snapshot contains model result fields");
    const ids = new Set();
    const idempotencyKeys = new Set();
    for (const scenario of snapshot.scenarios) {
        requireExactKeys(scenario, SCENARIO_KEYS, `scenario ${scenario?.scenario_id ?? "unknown"}`);
        requireCondition(!ids.has(scenario.scenario_id), `duplicated scenario ${scenario.scenario_id}`);
        ids.add(scenario.scenario_id);
        requireCondition(Date.parse(scenario.instant_utc) >= Date.parse(snapshot.partition.period.start), `${scenario.scenario_id}: instant before period`);
        requireCondition(Date.parse(scenario.instant_utc) <= Date.parse(snapshot.partition.period.end), `${scenario.scenario_id}: instant after period`);
        requireCondition(scenario.input_snapshot_sha256 === canonicalHash(Object.fromEntries(Object.entries(scenario).filter(([key]) => key !== "input_snapshot_sha256"))), `${scenario.scenario_id}: input hash differs`);
        requireExactKeys(scenario.profile, PROFILE_KEYS, `${scenario.scenario_id}.profile`);
        requireCondition(finite(scenario.profile.budget) && finite(scenario.profile.radius_km), `${scenario.scenario_id}: invalid numeric profile field`);
        requireCondition(Array.isArray(scenario.profile.explicit_preferences), `${scenario.scenario_id}: explicit preferences must be an array`);
        requireCondition(typeof scenario.profile.synthetic_consent === "boolean", `${scenario.scenario_id}: synthetic consent must be boolean`);
        requireExactKeys(scenario.history, HISTORY_KEYS, `${scenario.scenario_id}.history`);
        requireCondition(Array.isArray(scenario.history.recent_choices) && Array.isArray(scenario.history.signals), `${scenario.scenario_id}: history lists are invalid`);
        for (const choice of scenario.history.recent_choices) {
            requireExactKeys(choice, RECENT_CHOICE_KEYS, `${scenario.scenario_id}.history.recent_choice`);
            requireCondition(Number.isFinite(Date.parse(choice.occurred_at)), `${scenario.scenario_id}: invalid recent choice instant`);
        }
        requireCondition(scenario.eligible_candidate_ids.length >= 2, `${scenario.scenario_id}: insufficient eligible candidates`);
        requireCondition(new Set(scenario.eligible_candidate_ids).size === scenario.eligible_candidate_ids.length, `${scenario.scenario_id}: duplicated eligible candidate`);
        const eligible = new Set(scenario.eligible_candidate_ids);
        const ineligible = new Set(scenario.ineligible_candidates.map((item) => item.candidate_id));
        requireCondition(ineligible.size === scenario.ineligible_candidates.length, `${scenario.scenario_id}: duplicated ineligible candidate`);
        requireCondition(!hasIntersection(eligible, ineligible), `${scenario.scenario_id}: candidate appears in both eligibility lists`);
        const catalogIds = new Set();
        for (const candidate of scenario.catalog) {
            requireExactKeys(candidate, CANDIDATE_KEYS, `${scenario.scenario_id}.catalog`);
            requireCondition(!catalogIds.has(candidate.candidate_id), `${scenario.scenario_id}: duplicated catalog candidate`);
            catalogIds.add(candidate.candidate_id);
            requireCondition(
                [candidate.price, candidate.distance_km, candidate.rating, candidate.operational_score, candidate.catalog_variant].every(finite),
                `${scenario.scenario_id}: invalid numeric candidate field`,
            );
            requireCondition(Array.isArray(candidate.ineligibility_reasons), `${scenario.scenario_id}: invalid ineligibility reasons`);
            requireCondition(candidate.ineligibility_reasons.every((reason) => INELIGIBILITY_REASONS.includes(reason)), `${scenario.scenario_id}: unknown ineligibility reason`);
            requireCondition(eligible.has(candidate.candidate_id) === (candidate.ineligibility_reasons.length === 0), `${scenario.scenario_id}: eligibility differs from catalog`);
        }
        requireCondition(catalogIds.size === eligible.size + ineligible.size, `${scenario.scenario_id}: eligibility lists do not cover catalog`);
        requireCondition([...eligible, ...ineligible].every((candidateId) => catalogIds.has(candidateId)), `${scenario.scenario_id}: eligibility references unknown candidate`);
        for (const item of scenario.ineligible_candidates) {
            requireExactKeys(item, INELIGIBLE_CANDIDATE_KEYS, `${scenario.scenario_id}.ineligible_candidate`);
            requireCondition(Array.isArray(item.reasons) && item.reasons.length > 0, `${scenario.scenario_id}: ineligible candidate has no reason`);
            const candidate = scenario.catalog.find((entry) => entry.candidate_id === item.candidate_id);
            requireCondition(candidate && canonicalSerialize(candidate.ineligibility_reasons) === canonicalSerialize(item.reasons), `${scenario.scenario_id}: ineligibility reasons differ from catalog`);
        }
        for (const signal of scenario.history.signals) {
            requireExactKeys(signal, SIGNAL_KEYS, `${scenario.scenario_id}.history.signal`);
            requireCondition(finite(signal.value), `${scenario.scenario_id}: invalid signal value`);
            requireCondition(typeof signal.consent_valid === "boolean" && typeof signal.active === "boolean" && signal.synthetic_offline === true, `${scenario.scenario_id}: invalid signal flags`);
            requireCondition(Number.isFinite(Date.parse(signal.occurred_at)), `${scenario.scenario_id}: invalid signal instant`);
            requireCondition(Date.parse(signal.occurred_at) < Date.parse(scenario.instant_utc), `${scenario.scenario_id}: future signal`);
            requireCondition(!idempotencyKeys.has(signal.idempotency_key), `${scenario.scenario_id}: duplicated idempotency key`);
            idempotencyKeys.add(signal.idempotency_key);
        }
        if (scenario.persona_id === "controle_sem_historico") {
            requireCondition(scenario.history.level === "NONE" && scenario.history.signals.length === 0, "control persona generated learning signals");
        }
    }
    return snapshot;
}

function adaptEligibleCandidates(scenario) {
    const eligible = new Set(scenario.eligible_candidate_ids);
    return scenario.catalog.filter((candidate) => eligible.has(candidate.candidate_id)).map((candidate) => ({
        candidate_id: candidate.candidate_id,
        restaurant: { id_restaurante: candidate.restaurant_id, nome: candidate.restaurant_id },
        product: { id_produto: candidate.product_id, nome: candidate.product_id, categorias: { nome: candidate.category } },
        preco_estimado: candidate.price,
        distancia_km: candidate.distance_km,
        avaliacao: candidate.rating,
        score_operacional: candidate.operational_score,
    }));
}

function serializeScenarioSnapshot(snapshot) {
    return `${JSON.stringify(snapshot, null, 2)}\n`;
}

function sequenceHashes(snapshot) {
    const grouped = new Map();
    for (const scenario of snapshot.scenarios) {
        const items = grouped.get(scenario.persona_id) ?? [];
        items.push(scenario);
        grouped.set(scenario.persona_id, items);
    }
    return Object.fromEntries([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([personaId, scenarios]) => [
        personaId,
        canonicalHash(scenarios.sort((first, second) => first.scenario_index - second.scenario_index).map((scenario) => scenario.input_snapshot_sha256)),
    ]));
}

function overlapSize(first, second) {
    const left = new Set(first);
    return new Set(second.filter((value) => left.has(value))).size;
}

function auditScenarioSnapshots(development, validation) {
    const allSignals = (snapshot) => snapshot.scenarios.flatMap((scenario) => scenario.history.signals.map((signal) => signal.idempotency_key));
    const candidateHashes = (snapshot) => snapshot.scenarios.map((scenario) => canonicalHash(scenario.catalog));
    const historyHashes = (snapshot) => snapshot.scenarios.map((scenario) => canonicalHash(scenario.history));
    const devSequences = Object.values(sequenceHashes(development));
    const validationSequences = Object.values(sequenceHashes(validation));
    const result = {
        scenario_id_overlap: overlapSize(development.scenarios.map((scenario) => scenario.scenario_id), validation.scenarios.map((scenario) => scenario.scenario_id)),
        semantic_key_overlap: overlapSize(development.scenarios.map((scenario) => scenario.semantic_key_sha256), validation.scenarios.map((scenario) => scenario.semantic_key_sha256)),
        input_snapshot_overlap: overlapSize(development.scenarios.map((scenario) => scenario.input_snapshot_sha256), validation.scenarios.map((scenario) => scenario.input_snapshot_sha256)),
        sequence_overlap: overlapSize(devSequences, validationSequences),
        signal_key_overlap: overlapSize(allSignals(development), allSignals(validation)),
        candidate_snapshot_overlap: overlapSize(candidateHashes(development), candidateHashes(validation)),
        history_snapshot_overlap: overlapSize(historyHashes(development), historyHashes(validation)),
        shared_personas: development.partition && validation.partition ? Object.keys(development.coverage.by_persona).filter((id) => Object.hasOwn(validation.coverage.by_persona, id)).length : 0,
        shared_categories: development.coverage.categories.filter((category) => validation.coverage.categories.includes(category)).length,
    };
    return { ...result, isolated: Object.entries(result).filter(([key]) => key.endsWith("_overlap")).every(([, value]) => value === 0) };
}

module.exports = {
    EXPECTED_PARTITIONS_HASH,
    EXPECTED_PERSONAS_HASH,
    GENERATOR_VERSION,
    HISTORY_LEVELS,
    INELIGIBILITY_REASONS,
    adaptEligibleCandidates,
    auditScenarioSnapshots,
    deterministicInteger,
    deterministicNumber,
    generateScenario,
    forbiddenResultFields,
    generateScenarioSnapshot,
    hierarchicalUnit,
    sequenceHashes,
    serializeScenarioSnapshot,
    summarizeCoverage,
    validateGeneratorInputs,
    validateScenarioSnapshot,
};
