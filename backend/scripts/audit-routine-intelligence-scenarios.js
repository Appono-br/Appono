"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
    auditScenarioSnapshots,
    validateScenarioSnapshot,
} = require("../src/domain/routine-intelligence-scenario-generator");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const sha256 = (relativePath) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
const partitions = readJson("experiments/routine-intelligence/partitions-v1.json");
const personas = readJson("experiments/routine-intelligence/personas-v1.json");
const development = readJson("experiments/routine-intelligence/scenarios/desenvolvimento-v1.json");
const validation = readJson("experiments/routine-intelligence/scenarios/validacao-v1.json");
const manifest = readJson("experiments/routine-intelligence/scenarios/manifest-v1.json");

validateScenarioSnapshot(development, { partitionsArtifact: partitions, personasArtifact: personas });
validateScenarioSnapshot(validation, { partitionsArtifact: partitions, personasArtifact: personas });
const overlap = auditScenarioSnapshots(development, validation);
if (!overlap.isolated) throw new Error("SCENARIO_SNAPSHOT_INTERSECTION_DETECTED");

for (const entry of Object.values(manifest.snapshots)) {
    const relativeToBackend = path.relative("backend", entry.path).replaceAll("\\", "/");
    if (sha256(relativeToBackend) !== entry.file_sha256) throw new Error(`SCENARIO_MANIFEST_HASH_MISMATCH: ${entry.path}`);
}
if (manifest.prospective_reserve.state !== "SEALED_UNMATERIALIZED" || manifest.prospective_reserve.snapshot_path !== null) {
    throw new Error("PROSPECTIVE_RESERVE_WAS_MATERIALIZED");
}

process.stdout.write(`${JSON.stringify({
    generator_version: manifest.generator_version,
    development: {
        scenarios: development.total_scenarios,
        personas: development.total_personas,
        scenarios_sha256: development.scenarios_sha256,
        file_sha256: manifest.snapshots.desenvolvimento_v1.file_sha256,
    },
    validation: {
        scenarios: validation.total_scenarios,
        personas: validation.total_personas,
        scenarios_sha256: validation.scenarios_sha256,
        file_sha256: manifest.snapshots.validacao_v1.file_sha256,
    },
    overlap,
    prospective_reserve_state: manifest.prospective_reserve.state,
    model_results_present: manifest.model_results_present,
}, null, 2)}\n`);
