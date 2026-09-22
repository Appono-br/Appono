"use strict";

const crypto = require("node:crypto");

const TYPES = new Set(["DESENVOLVIMENTO", "VALIDACAO", "RESERVA"]);
const PARTITION_KEYS = new Set([
    "id", "type", "purpose", "namespace", "period", "timezone", "weeks", "decisions_per_persona",
    "seed_policy", "catalog_strategy", "availability_strategy", "history_levels", "persona_ids", "state",
    "permissions", "authorized_commands", "scenario_identity_version",
]);
const TOP_LEVEL_KEYS = new Set([
    "schema_version", "partitions_version", "protocol", "registered_at", "timezone", "purpose", "personas",
    "historical_baseline", "scenario_identity_version", "forbidden_fields", "partitions",
]);
const PERIOD_KEYS = new Set(["start", "end"]);
const PERSONAS_KEYS = new Set(["version", "canonical_sha256", "ids"]);
const HISTORICAL_KEYS = new Set(["manifest_path", "reserve_status", "reserve_report_sha256", "calibration_allowed"]);
const PUBLIC_SEED_KEYS = new Set(["mode", "seed"]);
const COMMITMENT_SEED_KEYS = new Set(["mode", "commitment_file"]);
const CATALOG_KEYS = new Set(["family", "variant_offset", "price_range", "distance_range_km", "categories"]);
const AVAILABILITY_KEYS = new Set(["family", "variant_offset", "meal_windows", "weekdays"]);
const PERMISSION_KEYS = new Set(["calibration", "repeatable", "materialization"]);
const SENSITIVE_KEY = /^(email|telefone|endereco|latitude|longitude|jwt|access_token|refresh_token|service_role|alergia|condicao_medica)$/i;

function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function requireCondition(condition, message) {
    if (!condition) throw new Error(`PARTITION_INVALID: ${message}`);
}

function requireExactKeys(value, allowed, field) {
    requireCondition(object(value), `${field} must be an object`);
    for (const key of Object.keys(value)) requireCondition(allowed.has(key), `${field}: unknown field ${key}`);
}

function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (!object(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSerialize(value) {
    return JSON.stringify(canonicalize(value));
}

function canonicalHash(value) {
    return crypto.createHash("sha256").update(canonicalSerialize(value)).digest("hex");
}

function validDate(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validRange(value, field) {
    requireCondition(Array.isArray(value) && value.length === 2, `${field} must contain two values`);
    const [minimum, maximum] = value.map(Number);
    requireCondition(Number.isFinite(minimum) && Number.isFinite(maximum) && minimum >= 0 && maximum > minimum, `${field} is invalid`);
}

function auditSensitiveData(value, { path = "$", allowDeclaration = false } = {}) {
    const findings = [];
    const visit = (current, currentPath) => {
        if (Array.isArray(current)) {
            current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
            return;
        }
        if (!object(current)) return;
        for (const [key, item] of Object.entries(current)) {
            const itemPath = `${currentPath}.${key}`;
            if (SENSITIVE_KEY.test(key)) findings.push(itemPath);
            if (!(allowDeclaration && key === "forbidden_fields")) visit(item, itemPath);
        }
    };
    visit(value, path);
    return findings;
}

function validatePartition(partition, artifact) {
    requireCondition(object(partition), "partition must be an object");
    for (const key of Object.keys(partition)) requireCondition(PARTITION_KEYS.has(key), `${partition.id ?? "unknown"}: unknown field ${key}`);
    requireCondition(/^[a-z][a-z0-9_]*$/.test(partition.id ?? ""), "partition id must use snake_case");
    requireCondition(TYPES.has(partition.type), `${partition.id}: invalid type`);
    requireCondition(typeof partition.purpose === "string" && partition.purpose.length >= 20, `${partition.id}: purpose is missing`);
    requireCondition(typeof partition.namespace === "string" && partition.namespace.length >= 8, `${partition.id}: namespace is invalid`);
    requireCondition(object(partition.period) && validDate(partition.period.start) && validDate(partition.period.end), `${partition.id}: period is invalid`);
    requireExactKeys(partition.period, PERIOD_KEYS, `${partition.id}.period`);
    requireCondition(Date.parse(partition.period.start) < Date.parse(partition.period.end), `${partition.id}: period order is invalid`);
    requireCondition(partition.timezone === artifact.timezone, `${partition.id}: timezone differs from artifact`);
    requireCondition(Number.isInteger(partition.weeks) && partition.weeks >= 6, `${partition.id}: at least six weeks are required`);
    requireCondition(Number.isInteger(partition.decisions_per_persona) && partition.decisions_per_persona >= partition.weeks * 5, `${partition.id}: insufficient decisions`);
    requireCondition(object(partition.seed_policy), `${partition.id}: seed policy is missing`);
    if (partition.type === "RESERVA") {
        requireExactKeys(partition.seed_policy, COMMITMENT_SEED_KEYS, `${partition.id}.seed_policy`);
        requireCondition(partition.seed_policy.mode === "COMMITMENT", `${partition.id}: reserve must use a commitment`);
        requireCondition(typeof partition.seed_policy.commitment_file === "string", `${partition.id}: commitment file is missing`);
        requireCondition(partition.state === "SEALED_UNMATERIALIZED", `${partition.id}: reserve must remain sealed`);
        requireCondition(partition.permissions?.calibration === false, `${partition.id}: reserve cannot calibrate`);
        requireCondition(partition.permissions?.materialization === false, `${partition.id}: reserve cannot be materialized yet`);
        requireCondition(!partition.authorized_commands.some((command) => /GENERATE|OPEN/.test(command)), `${partition.id}: reserve exposes an opening command`);
    } else {
        requireExactKeys(partition.seed_policy, PUBLIC_SEED_KEYS, `${partition.id}.seed_policy`);
        requireCondition(partition.seed_policy.mode === "PUBLIC" && Number.isInteger(partition.seed_policy.seed), `${partition.id}: public seed is invalid`);
    }
    requireCondition(object(partition.catalog_strategy), `${partition.id}: catalog strategy is missing`);
    requireExactKeys(partition.catalog_strategy, CATALOG_KEYS, `${partition.id}.catalog_strategy`);
    requireCondition(typeof partition.catalog_strategy.family === "string", `${partition.id}: catalog family is missing`);
    requireCondition(Number.isInteger(partition.catalog_strategy.variant_offset), `${partition.id}: catalog offset is invalid`);
    validRange(partition.catalog_strategy.price_range, `${partition.id}.price_range`);
    validRange(partition.catalog_strategy.distance_range_km, `${partition.id}.distance_range_km`);
    requireCondition(Array.isArray(partition.catalog_strategy.categories) && partition.catalog_strategy.categories.length >= 3, `${partition.id}: categories are missing`);
    requireCondition(object(partition.availability_strategy), `${partition.id}: availability strategy is missing`);
    requireExactKeys(partition.availability_strategy, AVAILABILITY_KEYS, `${partition.id}.availability_strategy`);
    requireCondition(Number.isInteger(partition.availability_strategy.variant_offset), `${partition.id}: availability offset is invalid`);
    requireCondition(Array.isArray(partition.availability_strategy.meal_windows) && partition.availability_strategy.meal_windows.length > 0, `${partition.id}: meal windows are missing`);
    requireCondition(Array.isArray(partition.availability_strategy.weekdays) && partition.availability_strategy.weekdays.length >= 5, `${partition.id}: weekdays are missing`);
    requireCondition(Array.isArray(partition.history_levels) && partition.history_levels.includes("NONE") && partition.history_levels.includes("CONTRADICTORY"), `${partition.id}: history coverage is incomplete`);
    requireCondition(Array.isArray(partition.persona_ids) && partition.persona_ids.length === artifact.personas.ids.length, `${partition.id}: persona coverage is incomplete`);
    requireCondition(new Set(partition.persona_ids).size === partition.persona_ids.length, `${partition.id}: duplicated persona`);
    requireCondition(partition.persona_ids.every((id) => artifact.personas.ids.includes(id)), `${partition.id}: unknown persona`);
    requireCondition(object(partition.permissions) && Array.isArray(partition.authorized_commands), `${partition.id}: access policy is invalid`);
    requireExactKeys(partition.permissions, PERMISSION_KEYS, `${partition.id}.permissions`);
    requireCondition(partition.scenario_identity_version === artifact.scenario_identity_version, `${partition.id}: identity version differs`);
    return partition;
}

function periodsOverlap(first, second) {
    return Date.parse(first.period.start) <= Date.parse(second.period.end)
        && Date.parse(second.period.start) <= Date.parse(first.period.end);
}

function validatePartitionsArtifact(artifact) {
    requireCondition(object(artifact), "artifact is missing");
    for (const key of Object.keys(artifact)) requireCondition(TOP_LEVEL_KEYS.has(key), `unknown top-level field ${key}`);
    requireCondition(artifact.schema_version === 1, "schema_version must be 1");
    requireCondition(artifact.partitions_version === "routine-partitions-v1", "unexpected partitions version");
    requireCondition(artifact.protocol === "appono-intelligence-prospective-v1", "unexpected protocol");
    requireCondition(validDate(artifact.registered_at), "registration timestamp is invalid");
    requireCondition(artifact.timezone === "America/Sao_Paulo", "unexpected timezone");
    requireExactKeys(artifact.personas, PERSONAS_KEYS, "personas");
    requireCondition(artifact.personas?.version === "personas-sinteticas-v1", "unexpected persona version");
    requireCondition(/^[a-f0-9]{64}$/.test(artifact.personas?.canonical_sha256 ?? ""), "persona hash is invalid");
    requireCondition(Array.isArray(artifact.personas?.ids) && artifact.personas.ids.length === 10, "ten personas are required");
    requireExactKeys(artifact.historical_baseline, HISTORICAL_KEYS, "historical_baseline");
    requireCondition(artifact.historical_baseline?.reserve_status === "OPENED_ONCE_CONTAMINATED", "historical reserve contamination must be explicit");
    requireCondition(artifact.historical_baseline?.calibration_allowed === false, "historical reserve cannot calibrate");
    requireCondition(/^[a-f0-9]{64}$/.test(artifact.historical_baseline?.reserve_report_sha256 ?? ""), "historical reserve hash is invalid");
    requireCondition(artifact.scenario_identity_version === "routine-scenario-id-v1", "unexpected scenario identity version");
    requireCondition(Array.isArray(artifact.forbidden_fields) && artifact.forbidden_fields.length >= 8, "forbidden fields are missing");
    requireCondition(Array.isArray(artifact.partitions) && artifact.partitions.length === 3, "exactly three prospective partitions are required");

    const ids = new Set();
    const namespaces = new Set();
    const publicSeeds = new Set();
    for (const partition of artifact.partitions) {
        validatePartition(partition, artifact);
        requireCondition(!ids.has(partition.id), `duplicated id ${partition.id}`);
        requireCondition(!namespaces.has(partition.namespace), `duplicated namespace ${partition.namespace}`);
        ids.add(partition.id);
        namespaces.add(partition.namespace);
        if (partition.seed_policy.mode === "PUBLIC") {
            requireCondition(!publicSeeds.has(partition.seed_policy.seed), `duplicated public seed ${partition.seed_policy.seed}`);
            publicSeeds.add(partition.seed_policy.seed);
        }
    }
    requireCondition(new Set(artifact.partitions.map((partition) => partition.type)).size === 3, "one partition of each type is required");
    for (let left = 0; left < artifact.partitions.length; left += 1) {
        for (let right = left + 1; right < artifact.partitions.length; right += 1) {
            requireCondition(!periodsOverlap(artifact.partitions[left], artifact.partitions[right]), `period overlap: ${artifact.partitions[left].id}/${artifact.partitions[right].id}`);
        }
    }
    requireCondition(auditSensitiveData(artifact, { allowDeclaration: true }).length === 0, "sensitive field found outside forbidden_fields declaration");
    return artifact;
}

function scenarioIdentity(artifact, partition, input) {
    validatePartitionsArtifact(artifact);
    validatePartition(partition, artifact);
    const required = ["persona_id", "virtual_week", "virtual_day", "meal_window", "catalog_variant", "availability_variant", "scenario_index"];
    for (const key of required) requireCondition(input?.[key] !== undefined && input?.[key] !== null && input?.[key] !== "", `scenario field ${key} is missing`);
    requireCondition(partition.persona_ids.includes(input.persona_id), "scenario persona is not part of partition");
    requireCondition(Number.isInteger(input.virtual_week) && input.virtual_week >= 0 && input.virtual_week < partition.weeks, "virtual week is invalid");
    requireCondition(Number.isInteger(input.virtual_day) && input.virtual_day >= 0 && input.virtual_day < 7, "virtual day is invalid");
    requireCondition(Number.isInteger(input.scenario_index) && input.scenario_index >= 0, "scenario index is invalid");
    const identityInput = {
        identity_version: artifact.scenario_identity_version,
        partitions_version: artifact.partitions_version,
        dataset_namespace: partition.namespace,
        persona_version: artifact.personas.version,
        ...Object.fromEntries(required.map((key) => [key, input[key]])),
    };
    return crypto.createHash("sha256").update(canonicalSerialize(identityInput)).digest("hex");
}

function semanticScenarioKey(artifact, partition, input) {
    const start = Date.parse(partition.period.start);
    const instant = new Date(start + ((input.virtual_week * 7) + input.virtual_day) * 86400000).toISOString();
    return canonicalSerialize({
        identity_version: artifact.scenario_identity_version,
        persona_version: artifact.personas.version,
        persona_id: input.persona_id,
        instant,
        meal_window: input.meal_window,
        catalog_family: partition.catalog_strategy.family,
        catalog_variant: input.catalog_variant,
        availability_family: partition.availability_strategy.family,
        availability_variant: input.availability_variant,
        scenario_index: input.scenario_index,
    });
}

function planScenarioIdentities(artifact, partition) {
    validatePartitionsArtifact(artifact);
    const result = [];
    for (const personaId of partition.persona_ids) {
        for (let week = 0; week < partition.weeks; week += 1) {
            for (let day = 0; day < 5; day += 1) {
                const scenarioIndex = week * 5 + day;
                const input = {
                    persona_id: personaId,
                    virtual_week: week,
                    virtual_day: day,
                    meal_window: partition.availability_strategy.meal_windows[scenarioIndex % partition.availability_strategy.meal_windows.length],
                    catalog_variant: partition.catalog_strategy.variant_offset + scenarioIndex,
                    availability_variant: partition.availability_strategy.variant_offset + scenarioIndex,
                    scenario_index: scenarioIndex,
                };
                result.push({
                    scenario_id: scenarioIdentity(artifact, partition, input),
                    semantic_key: semanticScenarioKey(artifact, partition, input),
                    persona_id: personaId,
                });
            }
        }
    }
    return result;
}

function intersectionSize(first, second, field) {
    const values = new Set(first.map((item) => item[field]));
    return new Set(second.filter((item) => values.has(item[field])).map((item) => item[field])).size;
}

function auditPartitionIndependence(artifact) {
    validatePartitionsArtifact(artifact);
    const plans = new Map(artifact.partitions.map((partition) => [partition.id, planScenarioIdentities(artifact, partition)]));
    const pairs = [];
    for (let left = 0; left < artifact.partitions.length; left += 1) {
        for (let right = left + 1; right < artifact.partitions.length; right += 1) {
            const first = artifact.partitions[left];
            const second = artifact.partitions[right];
            pairs.push({
                pair: `${first.id}__${second.id}`,
                same_namespace: first.namespace === second.namespace,
                period_overlap: periodsOverlap(first, second),
                scenario_id_overlap: intersectionSize(plans.get(first.id), plans.get(second.id), "scenario_id"),
                semantic_key_overlap: intersectionSize(plans.get(first.id), plans.get(second.id), "semantic_key"),
                shared_personas: first.persona_ids.filter((id) => second.persona_ids.includes(id)).length,
                shared_categories: first.catalog_strategy.categories.filter((category) => second.catalog_strategy.categories.includes(category)).length,
            });
        }
    }
    return {
        partitions_version: artifact.partitions_version,
        planned_identifiers_per_partition: Object.fromEntries([...plans].map(([id, items]) => [id, items.length])),
        pairs,
        isolated: pairs.every((pair) => !pair.same_namespace && !pair.period_overlap && pair.scenario_id_overlap === 0 && pair.semantic_key_overlap === 0),
    };
}

function reserveCommitment({ commitmentVersion, partitionId, seed, salt }) {
    requireCondition(typeof seed === "string" && seed.length >= 32, "reserve seed must contain at least 32 characters");
    requireCondition(typeof salt === "string" && salt.length >= 32, "reserve salt must contain at least 32 characters");
    return crypto.createHash("sha256").update(`${commitmentVersion}\n${partitionId}\n${seed}\n${salt}`).digest("hex");
}

function validateReserveCommitment(commitment) {
    requireCondition(object(commitment), "reserve commitment is missing");
    requireCondition(commitment.schema_version === 1, "reserve commitment schema must be 1");
    requireCondition(commitment.commitment_version === "routine-reserve-commitment-v1", "unexpected reserve commitment version");
    requireCondition(commitment.partition_id === "reserva_prospectiva_v1", "unexpected reserve partition");
    requireCondition(commitment.algorithm === "SHA-256", "unexpected commitment algorithm");
    requireCondition(/^[a-f0-9]{64}$/.test(commitment.commitment_sha256 ?? ""), "invalid commitment hash");
    requireCondition(commitment.state === "SEALED_UNMATERIALIZED", "reserve commitment is not sealed");
    requireCondition(commitment.results_present === false, "reserve commitment cannot contain results");
    requireCondition(commitment.private_material === "LOCAL_GITIGNORED", "private material policy is invalid");
    requireCondition(!Object.hasOwn(commitment, "seed") && !Object.hasOwn(commitment, "salt"), "public commitment exposes private material");
    return commitment;
}

function authorizeReserveOpening({ commitment, seed, salt, candidateVersion, candidateFrozen, partitionHash, expectedPartitionHash, confirmation } = {}) {
    validateReserveCommitment(commitment);
    requireCondition(candidateFrozen === true, "candidate must be frozen before reserve opening");
    requireCondition(typeof candidateVersion === "string" && candidateVersion.length >= 3, "candidate version is missing");
    requireCondition(confirmation === "OPEN_PROSPECTIVE_RESERVE", "explicit reserve confirmation is required");
    requireCondition(partitionHash === expectedPartitionHash && /^[a-f0-9]{64}$/.test(partitionHash ?? ""), "partition hash differs from frozen value");
    const received = reserveCommitment({ commitmentVersion: commitment.commitment_version, partitionId: commitment.partition_id, seed, salt });
    requireCondition(crypto.timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(commitment.commitment_sha256, "hex")), "reserve commitment reveal does not match");
    return { authorized: true, partition_id: commitment.partition_id, candidate_version: candidateVersion };
}

function assertPartitionOperation(partition, operation) {
    requireCondition(partition.authorized_commands.includes(operation), `${operation} is not authorized for ${partition.id}`);
    return true;
}

module.exports = {
    assertPartitionOperation,
    auditPartitionIndependence,
    auditSensitiveData,
    authorizeReserveOpening,
    canonicalHash,
    canonicalSerialize,
    planScenarioIdentities,
    reserveCommitment,
    scenarioIdentity,
    semanticScenarioKey,
    validatePartition,
    validatePartitionsArtifact,
    validateReserveCommitment,
};
