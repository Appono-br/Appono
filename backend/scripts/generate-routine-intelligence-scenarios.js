"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
    EXPECTED_PARTITIONS_HASH,
    EXPECTED_PERSONAS_HASH,
    GENERATOR_VERSION,
    generateScenarioSnapshot,
    serializeScenarioSnapshot,
    validateScenarioSnapshot,
} = require("../src/domain/routine-intelligence-scenario-generator");
const { canonicalHash, validatePartitionsArtifact } = require("../src/domain/routine-intelligence-partitions");
const { validarArtefatoPersonas } = require("../src/domain/routine-intelligence-personas");

const root = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(root, "..");
const scenariosDirectory = path.join(root, "experiments/routine-intelligence/scenarios");
const partitionsPath = path.join(root, "experiments/routine-intelligence/partitions-v1.json");
const personasPath = path.join(root, "experiments/routine-intelligence/personas-v1.json");
const commitmentPath = path.join(root, "experiments/routine-intelligence/reserve-commitment-v1.json");
const manifestPath = path.join(scenariosDirectory, "manifest-v1.json");
const destinations = Object.freeze({
    desenvolvimento_v1: "desenvolvimento-v1.json",
    validacao_v1: "validacao-v1.json",
});

function argument(name) {
    const prefix = `--${name}=`;
    const value = process.argv.find((item) => item.startsWith(prefix));
    return value ? value.slice(prefix.length) : null;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256Buffer(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function writeAtomic(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp-${process.pid}`;
    try {
        fs.writeFileSync(temporary, content, { flag: "wx" });
        fs.renameSync(temporary, file);
    } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
}

function verifySnapshotContent(current, expected, filename) {
    if (current !== expected) throw new Error(`SCENARIO_SNAPSHOT_MISMATCH: ${filename}`);
    return true;
}

function snapshotEntry(file) {
    const content = fs.readFileSync(file);
    const snapshot = JSON.parse(content.toString("utf8"));
    return {
        path: path.relative(repositoryRoot, file).replaceAll("\\", "/"),
        file_sha256: sha256Buffer(content),
        scenarios_sha256: snapshot.scenarios_sha256,
        scenarios: snapshot.total_scenarios,
        personas: snapshot.total_personas,
        coverage: snapshot.coverage,
        state: "GENERATED",
    };
}

function buildManifest({ partitions, personas, commitment }) {
    const snapshots = {};
    for (const [partitionId, filename] of Object.entries(destinations).sort(([first], [second]) => first.localeCompare(second))) {
        const file = path.join(scenariosDirectory, filename);
        if (fs.existsSync(file)) snapshots[partitionId] = snapshotEntry(file);
    }
    return {
        schema_version: 1,
        manifest_version: "routine-scenario-snapshots-v1",
        generator_version: GENERATOR_VERSION,
        protocol: partitions.protocol,
        partitions_version: partitions.partitions_version,
        partitions_sha256: canonicalHash(partitions),
        personas_version: personas.personas_version,
        personas_sha256: EXPECTED_PERSONAS_HASH,
        snapshots,
        historical_reserve: {
            state: partitions.historical_baseline.reserve_status,
            report_sha256: partitions.historical_baseline.reserve_report_sha256,
        },
        prospective_reserve: {
            partition_id: commitment.partition_id,
            state: commitment.state,
            commitment_sha256: commitment.commitment_sha256,
            snapshot_path: null,
        },
        model_results_present: false,
    };
}

function safeSummary(snapshot, file, checked) {
    return {
        dataset: snapshot.partition.id,
        generator_version: snapshot.generator_version,
        scenarios: snapshot.total_scenarios,
        personas: snapshot.total_personas,
        scenarios_sha256: snapshot.scenarios_sha256,
        file: path.relative(process.cwd(), file),
        checked,
        prospective_reserve_materialized: false,
        model_results_present: false,
    };
}

function run() {
    const dataset = argument("dataset");
    if (!dataset) throw new Error("SCENARIO_DATASET_REQUIRED");
    if (dataset === "reserva_prospectiva_v1" || /reserva|reserve/i.test(dataset)) {
        throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    }
    const filename = destinations[dataset];
    if (!filename) throw new Error(`SCENARIO_DATASET_NOT_ALLOWED: ${dataset}`);

    const partitions = readJson(partitionsPath);
    const personas = readJson(personasPath);
    const commitment = readJson(commitmentPath);
    validatePartitionsArtifact(partitions);
    validarArtefatoPersonas(personas);
    if (canonicalHash(partitions) !== EXPECTED_PARTITIONS_HASH) throw new Error("FROZEN_PARTITIONS_HASH_MISMATCH");
    const partition = partitions.partitions.find((item) => item.id === dataset);
    const snapshot = generateScenarioSnapshot({ partitionsArtifact: partitions, partition, personasArtifact: personas });
    validateScenarioSnapshot(snapshot, { partitionsArtifact: partitions, personasArtifact: personas });
    const serialized = serializeScenarioSnapshot(snapshot);
    const destination = path.join(scenariosDirectory, filename);
    const check = process.argv.includes("--check");

    if (check) {
        if (!fs.existsSync(destination)) throw new Error(`SCENARIO_SNAPSHOT_MISSING: ${filename}`);
        const current = fs.readFileSync(destination, "utf8");
        verifySnapshotContent(current, serialized, filename);
        process.stdout.write(`${JSON.stringify(safeSummary(snapshot, destination, true), null, 2)}\n`);
        return;
    }

    writeAtomic(destination, serialized);
    const manifest = buildManifest({ partitions, personas, commitment });
    writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(safeSummary(snapshot, destination, false), null, 2)}\n`);
}

if (require.main === module) run();

module.exports = {
    buildManifest,
    destinations,
    run,
    sha256Buffer,
    snapshotEntry,
    verifySnapshotContent,
    writeAtomic,
};
