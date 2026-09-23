"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { dryRunLongitudinal } = require("../src/domain/routine-intelligence-longitudinal-contract");

const root = path.resolve(__dirname, "..");
const destinations = Object.freeze({
    desenvolvimento_v1: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json",
    validacao_v1: "experiments/routine-intelligence/scenarios/validacao-v1.json",
});
const MODEL_VERSIONS = Object.freeze(["deterministico-v3", "appono-intelligence-v1", "appono-intelligence-v2"]);
const USAGE = [
    "Uso:",
    "  node scripts/prepare-routine-intelligence-longitudinal.js --dataset=<desenvolvimento_v1|validacao_v1> --check",
    "",
    "Este comando valida contratos e estado estrutural. Ele nao executa modelos nem grava relatorios.",
].join("\n");

function argument(name) {
    const prefix = `--${name}=`;
    return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fileHash(relativePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function run() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    const dataset = argument("dataset");
    if (!dataset) throw new Error("LONGITUDINAL_DATASET_REQUIRED");
    if (/reserva|reserve/i.test(dataset)) throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    if (!process.argv.includes("--check")) throw new Error("LONGITUDINAL_DRY_RUN_REQUIRES_CHECK");
    const snapshotPath = destinations[dataset];
    if (!snapshotPath) throw new Error(`LONGITUDINAL_DATASET_NOT_ALLOWED: ${dataset}`);

    const partitions = readJson("experiments/routine-intelligence/partitions-v1.json");
    const personas = readJson("experiments/routine-intelligence/personas-v1.json");
    const manifest = readJson("experiments/routine-intelligence/scenarios/manifest-v1.json");
    const entry = manifest.snapshots[dataset];
    if (!entry || fileHash(snapshotPath) !== entry.file_sha256) throw new Error("LONGITUDINAL_SNAPSHOT_HASH_MISMATCH");
    const snapshot = readJson(snapshotPath);
    const summary = dryRunLongitudinal({ snapshot, partitionsArtifact: partitions, personasArtifact: personas, modelVersions: MODEL_VERSIONS });
    process.stdout.write(`${JSON.stringify({ ...summary, checked: true }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { MODEL_VERSIONS, USAGE, destinations, run };
