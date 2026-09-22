"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { hashCanonico: hashPersonas } = require("../src/domain/routine-intelligence-personas");
const {
    assertPartitionOperation,
    auditPartitionIndependence,
    auditSensitiveData,
    authorizeReserveOpening,
    canonicalHash,
    planScenarioIdentities,
    reserveCommitment,
    scenarioIdentity,
    validatePartitionsArtifact,
    validateReserveCommitment,
} = require("../src/domain/routine-intelligence-partitions");

const root = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(root, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
const sha256File = (relativePath) => crypto.createHash("sha256").update(fs.readFileSync(path.join(repositoryRoot, relativePath))).digest("hex");
const artifact = readJson("backend/experiments/routine-intelligence/partitions-v1.json");
const personas = readJson("backend/experiments/routine-intelligence/personas-v1.json");
const manifest = readJson("backend/experiments/routine-intelligence/manifest.json");
const commitment = readJson("backend/experiments/routine-intelligence/reserve-commitment-v1.json");
const byType = new Map(artifact.partitions.map((partition) => [partition.type, partition]));

test("prospective partitions are versioned, distinct and cover frozen personas", () => {
    assert.equal(validatePartitionsArtifact(artifact), artifact);
    assert.equal(artifact.partitions.length, 3);
    assert.equal(new Set(artifact.partitions.map((partition) => partition.id)).size, 3);
    assert.equal(new Set(artifact.partitions.map((partition) => partition.namespace)).size, 3);
    assert.deepEqual(new Set(artifact.partitions.map((partition) => partition.type)), new Set(["DESENVOLVIMENTO", "VALIDACAO", "RESERVA"]));
    assert.equal(artifact.personas.canonical_sha256, hashPersonas(personas));
    assert.ok(artifact.partitions.every((partition) => partition.persona_ids.length === 10));
});

test("historical reserve remains contaminated and cannot calibrate", () => {
    assert.equal(manifest.datasets.reserva.status, "OPENED_ONCE");
    assert.equal(artifact.historical_baseline.reserve_status, "OPENED_ONCE_CONTAMINATED");
    assert.equal(artifact.historical_baseline.calibration_allowed, false);
    assert.equal(
        sha256File("backend/reports/routine-intelligence/reserva.json"),
        "47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185",
    );
});

test("prospective reserve has a public commitment without seed, salt or results", () => {
    assert.equal(validateReserveCommitment(commitment), commitment);
    assert.equal(byType.get("RESERVA").state, "SEALED_UNMATERIALIZED");
    assert.equal(byType.get("RESERVA").permissions.materialization, false);
    assert.equal(commitment.results_present, false);
    assert.equal(Object.hasOwn(commitment, "seed"), false);
    assert.equal(Object.hasOwn(commitment, "salt"), false);
    assert.equal(fs.existsSync(path.join(root, "reports/routine-intelligence/reserva-prospectiva-v1.json")), false);
});

test("scenario identity is deterministic and changes with partition or scenario dimensions", () => {
    const development = byType.get("DESENVOLVIMENTO");
    const validation = byType.get("VALIDACAO");
    const input = {
        persona_id: "economico",
        virtual_week: 0,
        virtual_day: 0,
        meal_window: "ALMOCO",
        catalog_variant: 11,
        availability_variant: 17,
        scenario_index: 0,
    };
    const first = scenarioIdentity(artifact, development, input);
    assert.equal(first, scenarioIdentity(artifact, development, { ...input }));
    assert.notEqual(first, scenarioIdentity(artifact, validation, input));
    for (const change of [
        { virtual_week: 1 },
        { virtual_day: 1 },
        { meal_window: "JANTAR" },
        { catalog_variant: 12 },
        { availability_variant: 18 },
        { scenario_index: 1 },
    ]) assert.notEqual(first, scenarioIdentity(artifact, development, { ...input, ...change }));
});

test("scenario identity rejects incomplete or invalid input", () => {
    const development = byType.get("DESENVOLVIMENTO");
    assert.throws(() => scenarioIdentity(artifact, development, {}), /scenario field persona_id is missing/);
    assert.throws(() => scenarioIdentity(artifact, development, {
        persona_id: "unknown",
        virtual_week: 0,
        virtual_day: 0,
        meal_window: "ALMOCO",
        catalog_variant: 1,
        availability_variant: 1,
        scenario_index: 0,
    }), /persona is not part/);
});

test("planned identifiers have zero cross-partition intersection", () => {
    const audit = auditPartitionIndependence(artifact);
    assert.equal(audit.isolated, true);
    assert.deepEqual(audit.planned_identifiers_per_partition, {
        desenvolvimento_v1: 300,
        validacao_v1: 300,
        reserva_prospectiva_v1: 300,
    });
    for (const pair of audit.pairs) {
        assert.equal(pair.same_namespace, false, pair.pair);
        assert.equal(pair.period_overlap, false, pair.pair);
        assert.equal(pair.scenario_id_overlap, 0, pair.pair);
        assert.equal(pair.semantic_key_overlap, 0, pair.pair);
        assert.equal(pair.shared_personas, 10, pair.pair);
        assert.equal(pair.shared_categories, 8, pair.pair);
    }
});

test("coverage in common is not confused with duplicated instances", () => {
    const development = planScenarioIdentities(artifact, byType.get("DESENVOLVIMENTO"));
    const validation = planScenarioIdentities(artifact, byType.get("VALIDACAO"));
    assert.deepEqual(new Set(development.map((item) => item.persona_id)), new Set(validation.map((item) => item.persona_id)));
    const developmentIds = new Set(development.map((item) => item.scenario_id));
    const validationIds = new Set(validation.map((item) => item.scenario_id));
    assert.equal(developmentIds.intersection(validationIds).size, 0);
});

test("reserve opening requires a frozen candidate, explicit confirmation and matching reveal", () => {
    const seed = "s".repeat(64);
    const salt = "a".repeat(64);
    const fixture = {
        ...commitment,
        commitment_sha256: reserveCommitment({
            commitmentVersion: commitment.commitment_version,
            partitionId: commitment.partition_id,
            seed,
            salt,
        }),
    };
    const partitionHash = canonicalHash(artifact);
    const base = {
        commitment: fixture,
        seed,
        salt,
        candidateVersion: "candidate-v2",
        candidateFrozen: true,
        partitionHash,
        expectedPartitionHash: partitionHash,
        confirmation: "OPEN_PROSPECTIVE_RESERVE",
    };
    assert.equal(authorizeReserveOpening(base).authorized, true);
    assert.throws(() => authorizeReserveOpening({ ...base, candidateFrozen: false }), /candidate must be frozen/);
    assert.throws(() => authorizeReserveOpening({ ...base, confirmation: "NO" }), /explicit reserve confirmation/);
    assert.throws(() => authorizeReserveOpening({ ...base, salt: "x".repeat(64) }), /reveal does not match/);
    assert.throws(() => authorizeReserveOpening({ ...base, expectedPartitionHash: "0".repeat(64) }), /partition hash differs/);
});

test("default and calibration operations cannot open reserve", () => {
    const reserve = byType.get("RESERVA");
    assert.equal(assertPartitionOperation(reserve, "AUDIT_RESERVE_DESCRIPTOR"), true);
    assert.throws(() => assertPartitionOperation(reserve, "GENERATE_DEVELOPMENT"), /not authorized/);
    assert.throws(() => assertPartitionOperation(reserve, "OPEN_RESERVE"), /not authorized/);
});

test("canonical hash is stable and changes with descriptor mutation", () => {
    assert.equal(canonicalHash(artifact), canonicalHash(JSON.parse(JSON.stringify(artifact))));
    assert.notEqual(canonicalHash(artifact), canonicalHash({ ...artifact, purpose: `${artifact.purpose} changed` }));
});

test("validators reject duplicated namespaces, period overlap and sensitive data", () => {
    const duplicate = JSON.parse(JSON.stringify(artifact));
    duplicate.partitions[1].namespace = duplicate.partitions[0].namespace;
    assert.throws(() => validatePartitionsArtifact(duplicate), /duplicated namespace/);
    const overlap = JSON.parse(JSON.stringify(artifact));
    overlap.partitions[1].period = { ...overlap.partitions[0].period };
    assert.throws(() => validatePartitionsArtifact(overlap), /period overlap/);
    const sensitive = JSON.parse(JSON.stringify(artifact));
    sensitive.partitions[0].email = "synthetic@example.test";
    assert.throws(() => validatePartitionsArtifact(sensitive), /unknown field email/);
    const nestedTypo = JSON.parse(JSON.stringify(artifact));
    nestedTypo.partitions[0].catalog_strategy.variant_offest = 99;
    assert.throws(() => validatePartitionsArtifact(nestedTypo), /catalog_strategy: unknown field variant_offest/);
    assert.deepEqual(auditSensitiveData({ profile: { email: "x" } }), ["$.profile.email"]);
});

test("frozen artifacts and public rollout remain unchanged", () => {
    assert.equal(hashPersonas(personas), "dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474");
    for (const dataset of Object.values(manifest.datasets)) {
        assert.equal(sha256File(dataset.report), dataset.report_sha256, dataset.report);
    }
    assert.equal(manifest.feature_flags.public_rollout_percent, 0);
    assert.equal(manifest.feature_flags.enabled_by_default, false);
});

test("calibration modules do not import private reserve material", () => {
    const files = [
        "backend/src/domain/routine-intelligence-simulation.js",
        "backend/scripts/simulate-routine-intelligence.js",
        "backend/scripts/evaluate-routine-intelligence.js",
    ];
    for (const file of files) {
        const source = fs.readFileSync(path.join(repositoryRoot, file), "utf8");
        assert.doesNotMatch(source, /\.private|reserve-reveal-v1/i, file);
    }
    const gitignore = fs.readFileSync(path.join(repositoryRoot, ".gitignore"), "utf8");
    assert.match(gitignore, /backend\/experiments\/routine-intelligence\/\.private\//);
});

test("new public artifacts contain no PII, model result or private reserve material", () => {
    const sanitizedArtifact = { ...artifact };
    delete sanitizedArtifact.forbidden_fields;
    const text = JSON.stringify({ artifact: sanitizedArtifact, commitment });
    assert.doesNotMatch(text, /email|telefone|endereco|latitude|longitude|jwt|access_token|refresh_token|service_role|alergia|condicao_medica/i);
    assert.doesNotMatch(text, /pontuacao|placar|vitoria|derrota|arrependimento|utilidade_media/i);
    assert.doesNotMatch(text, /"seed"\s*:\s*"|"salt"\s*:/i);
});
