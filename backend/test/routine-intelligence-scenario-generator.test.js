"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
    EXPECTED_PARTITIONS_HASH,
    EXPECTED_PERSONAS_HASH,
    GENERATOR_VERSION,
    HISTORY_LEVELS,
    INELIGIBILITY_REASONS,
    adaptEligibleCandidates,
    auditScenarioSnapshots,
    deterministicNumber,
    forbiddenResultFields,
    generateScenarioSnapshot,
    hierarchicalUnit,
    sequenceHashes,
    serializeScenarioSnapshot,
    validateGeneratorInputs,
    validateScenarioSnapshot,
} = require("../src/domain/routine-intelligence-scenario-generator");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const {
    buildManifest,
    sha256Buffer,
    verifySnapshotContent,
    writeAtomic,
} = require("../scripts/generate-routine-intelligence-scenarios");

const root = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(root, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
const partitions = readJson("backend/experiments/routine-intelligence/partitions-v1.json");
const personas = readJson("backend/experiments/routine-intelligence/personas-v1.json");
const commitment = readJson("backend/experiments/routine-intelligence/reserve-commitment-v1.json");
const manifest = readJson("backend/experiments/routine-intelligence/scenarios/manifest-v1.json");
const developmentPartition = partitions.partitions.find((item) => item.id === "desenvolvimento_v1");
const validationPartition = partitions.partitions.find((item) => item.id === "validacao_v1");
const reservePartition = partitions.partitions.find((item) => item.id === "reserva_prospectiva_v1");
const development = generateScenarioSnapshot({ partitionsArtifact: partitions, partition: developmentPartition, personasArtifact: personas });
const validation = generateScenarioSnapshot({ partitionsArtifact: partitions, partition: validationPartition, personasArtifact: personas });

function fileSha256(relativePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(path.join(repositoryRoot, relativePath))).digest("hex");
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

test("generator validates frozen inputs and rejects prospective reserve", () => {
    assert.equal(validateGeneratorInputs({ partitionsArtifact: partitions, partition: developmentPartition, personasArtifact: personas }), true);
    assert.equal(validateGeneratorInputs({ partitionsArtifact: partitions, partition: validationPartition, personasArtifact: personas }), true);
    assert.throws(
        () => validateGeneratorInputs({ partitionsArtifact: partitions, partition: reservePartition, personasArtifact: personas }),
        /prospective reserve must remain sealed/,
    );
    assert.throws(
        () => validateGeneratorInputs({ partitionsArtifact: { ...partitions, purpose: "changed" }, partition: developmentPartition, personasArtifact: personas }),
        /partitions hash differs/,
    );
    assert.throws(
        () => validateGeneratorInputs({ partitionsArtifact: partitions, partition: developmentPartition, personasArtifact: { ...personas, purpose: "changed" } }),
        /personas hash differs/,
    );
});

test("same input produces identical object, bytes and hashes", () => {
    const second = generateScenarioSnapshot({ partitionsArtifact: partitions, partition: developmentPartition, personasArtifact: personas });
    assert.deepEqual(second, development);
    assert.equal(serializeScenarioSnapshot(second), serializeScenarioSnapshot(development));
    assert.equal(sha256Buffer(serializeScenarioSnapshot(second)), sha256Buffer(serializeScenarioSnapshot(development)));
    assert.equal(second.scenarios_sha256, development.scenarios_sha256);
});

test("generation is reproducible in a separate Node process", () => {
    const source = [
        "const fs=require('fs');",
        "const g=require('./src/domain/routine-intelligence-scenario-generator');",
        "const p=JSON.parse(fs.readFileSync('./experiments/routine-intelligence/partitions-v1.json'));",
        "const u=JSON.parse(fs.readFileSync('./experiments/routine-intelligence/personas-v1.json'));",
        "const part=p.partitions.find(x=>x.id==='desenvolvimento_v1');",
        "process.stdout.write(g.generateScenarioSnapshot({partitionsArtifact:p,partition:part,personasArtifact:u}).scenarios_sha256);",
    ].join("");
    const received = childProcess.execFileSync(process.execPath, ["-e", source], { cwd: root, encoding: "utf8" });
    assert.equal(received, development.scenarios_sha256);
});

test("persona order does not change individual scenarios", () => {
    const reversed = generateScenarioSnapshot({
        partitionsArtifact: partitions,
        partition: developmentPartition,
        personasArtifact: personas,
        personaIds: [...developmentPartition.persona_ids].reverse(),
    });
    assert.deepEqual(reversed.scenarios, development.scenarios);
    assert.equal(reversed.scenarios_sha256, development.scenarios_sha256);
});

test("isolated persona generation matches full generation slice", () => {
    const personaId = "economico";
    const isolated = generateScenarioSnapshot({
        partitionsArtifact: partitions,
        partition: developmentPartition,
        personasArtifact: personas,
        personaIds: [personaId],
    });
    assert.deepEqual(isolated.scenarios, development.scenarios.filter((scenario) => scenario.persona_id === personaId));
});

test("hierarchical randomness is stable and component-scoped", () => {
    const first = hierarchicalUnit(123, "persona", "week", "price");
    assert.equal(first, hierarchicalUnit(123, "persona", "week", "price"));
    assert.notEqual(first, hierarchicalUnit(124, "persona", "week", "price"));
    assert.notEqual(first, hierarchicalUnit(123, "persona", "week", "distance"));
    assert.notEqual(
        deterministicNumber({ seed: 1, parts: ["price"], minimum: 1, maximum: 2 }),
        deterministicNumber({ seed: 2, parts: ["price"], minimum: 1, maximum: 2 }),
    );
});

test("snapshots contain ten personas, six weeks and thirty scenarios each", () => {
    for (const snapshot of [development, validation]) {
        assert.equal(snapshot.total_personas, 10);
        assert.equal(snapshot.total_scenarios, 300);
        assert.deepEqual(new Set(Object.values(snapshot.coverage.by_persona)), new Set([30]));
        for (const personaId of Object.keys(snapshot.coverage.by_persona)) {
            const scenarios = snapshot.scenarios.filter((scenario) => scenario.persona_id === personaId);
            assert.equal(new Set(scenarios.map((scenario) => scenario.virtual_week)).size, 6, personaId);
            for (let week = 0; week < 6; week += 1) assert.equal(scenarios.filter((scenario) => scenario.virtual_week === week).length, 5, `${personaId}/${week}`);
        }
    }
});

test("all scenario instants stay inside their partition", () => {
    for (const snapshot of [development, validation]) {
        const start = Date.parse(snapshot.partition.period.start);
        const end = Date.parse(snapshot.partition.period.end);
        assert.ok(snapshot.scenarios.every((scenario) => Date.parse(scenario.instant_utc) >= start && Date.parse(scenario.instant_utc) <= end));
    }
});

test("catalogs use synthetic IDs, finite ranges and at least two eligible candidates", () => {
    for (const [snapshot, partition] of [[development, developmentPartition], [validation, validationPartition]]) {
        const [minimumPrice, maximumPrice] = partition.catalog_strategy.price_range;
        const [minimumDistance, maximumDistance] = partition.catalog_strategy.distance_range_km;
        for (const scenario of snapshot.scenarios) {
            assert.equal(scenario.catalog.length, 8);
            assert.ok(scenario.eligible_candidate_ids.length >= 2);
            for (const candidate of scenario.catalog) {
                assert.match(candidate.restaurant_id, /^syn-rest-/);
                assert.match(candidate.product_id, /^syn-prod-/);
                assert.ok(Number.isFinite(candidate.price) && candidate.price >= minimumPrice && candidate.price <= maximumPrice);
                assert.ok(Number.isFinite(candidate.distance_km) && candidate.distance_km >= minimumDistance && candidate.distance_km <= maximumDistance);
            }
        }
    }
});

test("eligibility lists are disjoint and all mandatory reasons are covered", () => {
    for (const snapshot of [development, validation]) {
        for (const scenario of snapshot.scenarios) {
            const eligible = new Set(scenario.eligible_candidate_ids);
            const ineligible = new Set(scenario.ineligible_candidates.map((item) => item.candidate_id));
            assert.equal(eligible.intersection(ineligible).size, 0);
            assert.ok(scenario.ineligible_candidates.every((item) => item.reasons.length > 0));
        }
        for (const reason of INELIGIBILITY_REASONS) assert.ok(snapshot.coverage.ineligibility_reasons[reason] > 0, reason);
    }
});

test("all history levels are covered and signals precede scenarios", () => {
    for (const snapshot of [development, validation]) {
        assert.deepEqual(new Set(Object.keys(snapshot.coverage.history_levels)), new Set(HISTORY_LEVELS));
        const keys = new Set();
        for (const scenario of snapshot.scenarios) {
            for (const signal of scenario.history.signals) {
                assert.ok(Date.parse(signal.occurred_at) < Date.parse(scenario.instant_utc));
                assert.equal(keys.has(signal.idempotency_key), false);
                keys.add(signal.idempotency_key);
                assert.equal(signal.synthetic_offline, true);
            }
        }
    }
});

test("control persona never receives learning signals", () => {
    for (const snapshot of [development, validation]) {
        const control = snapshot.scenarios.filter((scenario) => scenario.persona_id === "controle_sem_historico");
        assert.ok(control.every((scenario) => scenario.history_level === "NONE" && scenario.history.signals.length === 0));
    }
});

test("development and validation have zero full-snapshot overlap", () => {
    const audit = auditScenarioSnapshots(development, validation);
    assert.equal(audit.isolated, true);
    assert.equal(audit.scenario_id_overlap, 0);
    assert.equal(audit.semantic_key_overlap, 0);
    assert.equal(audit.input_snapshot_overlap, 0);
    assert.equal(audit.sequence_overlap, 0);
    assert.equal(audit.signal_key_overlap, 0);
    assert.equal(audit.candidate_snapshot_overlap, 0);
    assert.equal(audit.history_snapshot_overlap, 0);
    assert.equal(audit.shared_personas, 10);
    assert.equal(audit.shared_categories, 8);
});

test("sequence hashes are stable and unique between datasets", () => {
    const dev = sequenceHashes(development);
    const validationHashes = sequenceHashes(validation);
    assert.deepEqual(dev, sequenceHashes(development));
    assert.equal(new Set(Object.values(dev)).intersection(new Set(Object.values(validationHashes))).size, 0);
});

test("adapter exposes only eligible candidates", () => {
    for (const scenario of development.scenarios.slice(0, 20)) {
        const adapted = adaptEligibleCandidates(scenario);
        assert.equal(adapted.length, scenario.eligible_candidate_ids.length);
        assert.ok(adapted.every((candidate) => scenario.eligible_candidate_ids.includes(candidate.candidate_id)));
        assert.ok(adapted.every((candidate) => !scenario.ineligible_candidates.some((item) => item.candidate_id === candidate.candidate_id)));
    }
});

test("snapshot validation rejects sensitive and model-result fields", () => {
    const sensitive = clone(development);
    sensitive.scenarios[0].email = "synthetic@example.test";
    sensitive.scenarios_sha256 = canonicalHash(sensitive.scenarios);
    assert.throws(() => validateScenarioSnapshot(sensitive, { partitionsArtifact: partitions, personasArtifact: personas }), /sensitive fields/);
    const modelResult = clone(development);
    modelResult.scenarios[0].winner = "candidate";
    modelResult.scenarios_sha256 = canonicalHash(modelResult.scenarios);
    assert.ok(forbiddenResultFields(modelResult).length > 0);
    assert.throws(() => validateScenarioSnapshot(modelResult, { partitionsArtifact: partitions, personasArtifact: personas }), /model result fields/);
});

test("mutations alter hashes and copied scenarios are detected as overlap", () => {
    const changed = clone(development.scenarios[0]);
    const originalHash = canonicalHash(changed);
    changed.eligible_candidate_ids.pop();
    assert.notEqual(canonicalHash(changed), originalHash);
    const contaminated = clone(validation);
    contaminated.scenarios[0] = clone(development.scenarios[0]);
    contaminated.scenarios_sha256 = canonicalHash(contaminated.scenarios);
    assert.ok(auditScenarioSnapshots(development, contaminated).scenario_id_overlap > 0);
});

test("serialized files equal fresh generation and check detects one-byte mutation", () => {
    const developmentContent = fs.readFileSync(path.join(root, "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json"), "utf8");
    const validationContent = fs.readFileSync(path.join(root, "experiments/routine-intelligence/scenarios/validacao-v1.json"), "utf8");
    assert.equal(verifySnapshotContent(developmentContent, serializeScenarioSnapshot(development), "development"), true);
    assert.equal(verifySnapshotContent(validationContent, serializeScenarioSnapshot(validation), "validation"), true);
    assert.throws(() => verifySnapshotContent(`${developmentContent}x`, serializeScenarioSnapshot(development), "development"), /SCENARIO_SNAPSHOT_MISMATCH/);
});

test("atomic writer replaces complete file without leaving temporary artifact", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "appono-scenarios-"));
    const file = path.join(directory, "snapshot.json");
    try {
        writeAtomic(file, "first\n");
        writeAtomic(file, "second\n");
        assert.equal(fs.readFileSync(file, "utf8"), "second\n");
        assert.deepEqual(fs.readdirSync(directory), ["snapshot.json"]);
    } finally {
        if (fs.existsSync(file)) fs.unlinkSync(file);
        fs.rmdirSync(directory);
    }
});

test("snapshot manifest identifies exact files and keeps reserve sealed", () => {
    const rebuilt = buildManifest({ partitions, personas, commitment });
    assert.deepEqual(rebuilt, manifest);
    assert.equal(manifest.generator_version, GENERATOR_VERSION);
    assert.equal(manifest.partitions_sha256, EXPECTED_PARTITIONS_HASH);
    assert.equal(manifest.personas_sha256, EXPECTED_PERSONAS_HASH);
    assert.equal(manifest.model_results_present, false);
    assert.equal(manifest.prospective_reserve.state, "SEALED_UNMATERIALIZED");
    assert.equal(manifest.prospective_reserve.snapshot_path, null);
    for (const entry of Object.values(manifest.snapshots)) assert.equal(fileSha256(entry.path), entry.file_sha256);
});

test("CLI rejects reserve before materialization", () => {
    const result = childProcess.spawnSync(process.execPath, [
        "scripts/generate-routine-intelligence-scenarios.js",
        "--dataset=reserva_prospectiva_v1",
    ], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /PROSPECTIVE_RESERVE_IS_SEALED/);
    assert.equal(fs.existsSync(path.join(root, "experiments/routine-intelligence/scenarios/reserva-prospectiva-v1.json")), false);
});

test("generator has no model dependency, real clock or ambient randomness", () => {
    const source = fs.readFileSync(path.join(root, "src/domain/routine-intelligence-scenario-generator.js"), "utf8");
    assert.doesNotMatch(source, /require\([^)]*(routine-scoring|routine-intelligence-v2|routine-shadow-evaluation)/i);
    assert.doesNotMatch(source, /Math\.random\(|Date\.now\(|\.private|reserve-reveal-v1/i);
});

test("versioned snapshots contain neither PII nor model outcomes", () => {
    const text = [
        fs.readFileSync(path.join(root, "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json"), "utf8"),
        fs.readFileSync(path.join(root, "experiments/routine-intelligence/scenarios/validacao-v1.json"), "utf8"),
    ].join("");
    assert.doesNotMatch(text, /email|telefone|endereco|latitude|longitude|jwt|access_token|refresh_token|service_role|senha|alergia|condicao_medica/i);
    assert.doesNotMatch(text, /"winner"|"confidence"|"adjustment"|"utility"|"model_version"/i);
});

test("historical artifacts and rollout remain unchanged", () => {
    const historicalManifest = readJson("backend/experiments/routine-intelligence/manifest.json");
    assert.equal(fileSha256("backend/reports/routine-intelligence/reserva.json"), "47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185");
    assert.equal(historicalManifest.feature_flags.public_rollout_percent, 0);
    assert.equal(historicalManifest.datasets.reserva.status, "OPENED_ONCE");
    assert.equal(commitment.state, "SEALED_UNMATERIALIZED");
});
