"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
    LONGITUDINAL_SIMULATION_VERSION,
    MODEL_VERSIONS,
    RAW_REPORT_SCHEMA_VERSION,
    serializeReport,
    simulateLongitudinal,
} = require("../src/domain/routine-intelligence-longitudinal-simulation");

const root = path.resolve(__dirname, "..");
const destinations = Object.freeze({
    desenvolvimento_v1: {
        snapshot: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json",
        report: "reports/routine-intelligence/prospective/desenvolvimento-v1.json",
    },
    validacao_v1: {
        snapshot: "experiments/routine-intelligence/scenarios/validacao-v1.json",
        report: "reports/routine-intelligence/prospective/validacao-v1.json",
    },
});
const protocolPath = "experiments/routine-intelligence/longitudinal-protocol-v1.json";
const reportManifestPath = "reports/routine-intelligence/prospective/manifest-v1.json";
const sourcePaths = Object.freeze({
    "routine-longitudinal-contract-v1": "src/domain/routine-intelligence-longitudinal-contract.js",
    "deterministico-v3": "src/domain/routine-scoring.js",
    "appono-intelligence-v1": "src/domain/routine-intelligence.js",
    "appono-intelligence-v2": "src/domain/routine-intelligence-v2.js",
    "persona-utility-v1": "src/domain/routine-intelligence-personas.js",
});
const USAGE = [
    "Uso:",
    "  node scripts/simulate-routine-intelligence-longitudinal.js --dataset=<desenvolvimento_v1|validacao_v1> --check",
    "  node scripts/simulate-routine-intelligence-longitudinal.js --dataset=<desenvolvimento_v1|validacao_v1> --write",
    "",
    "--check recalcula sem escrever e compara o relatorio existente quando presente.",
    "--write grava somente o destino prospectivo predefinido. Reservas nao sao aceitas.",
].join("\n");

function argument(name) {
    const prefix = `--${name}=`;
    return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function absolute(relativePath) {
    return path.join(root, relativePath);
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function fileHash(relativePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(absolute(relativePath))).digest("hex");
}

function writeAtomic(relativePath, content) {
    const target = absolute(relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, target);
}

function validateSourceHashes(protocol) {
    const expected = new Map(protocol.models.map((item) => [item.version, item.source_sha256]));
    expected.set(protocol.contract.version, protocol.contract.source_sha256);
    expected.set(protocol.external_utility.version, protocol.external_utility.source_sha256);
    for (const [version, expectedHash] of expected) {
        const sourcePath = sourcePaths[version];
        if (!sourcePath || fileHash(sourcePath) !== expectedHash) throw new Error(`LONGITUDINAL_SOURCE_HASH_MISMATCH: ${version}`);
    }
}

function manifestContent() {
    const reports = {};
    for (const [dataset, destination] of Object.entries(destinations)) {
        if (!fs.existsSync(absolute(destination.report))) continue;
        const report = readJson(destination.report);
        reports[dataset] = {
            path: `backend/${destination.report.replaceAll("\\", "/")}`,
            file_sha256: fileHash(destination.report),
            content_sha256: report.content_sha256,
            scenarios: report.summary.scenarios,
            model_executions: report.summary.model_executions,
        };
    }
    return `${JSON.stringify({
        schema_version: 1,
        manifest_version: "routine-longitudinal-reports-manifest-v1",
        executor_version: LONGITUDINAL_SIMULATION_VERSION,
        report_schema_version: RAW_REPORT_SCHEMA_VERSION,
        model_versions: MODEL_VERSIONS,
        synthetic_offline_only: true,
        reserve_accessed: false,
        reports,
    }, null, 2)}\n`;
}

function run() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    const dataset = argument("dataset");
    if (!dataset) throw new Error("LONGITUDINAL_DATASET_REQUIRED");
    if (/reserva|reserve/i.test(dataset)) throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    const destination = destinations[dataset];
    if (!destination) throw new Error(`LONGITUDINAL_DATASET_NOT_ALLOWED: ${dataset}`);
    const check = process.argv.includes("--check");
    const write = process.argv.includes("--write");
    if (check === write) throw new Error("LONGITUDINAL_MODE_REQUIRES_EXACTLY_ONE_OF_CHECK_OR_WRITE");

    const protocol = readJson(protocolPath);
    validateSourceHashes(protocol);
    if (fileHash(destination.snapshot) !== protocol.snapshots[dataset].file_sha256) throw new Error("LONGITUDINAL_SNAPSHOT_HASH_MISMATCH");
    const snapshot = readJson(destination.snapshot);
    const partitions = readJson("experiments/routine-intelligence/partitions-v1.json");
    const personas = readJson("experiments/routine-intelligence/personas-v1.json");
    const report = simulateLongitudinal({ snapshot, partitionsArtifact: partitions, personasArtifact: personas, protocol });
    const serialized = serializeReport(report);
    let matchesExisting = null;

    if (check && fs.existsSync(absolute(destination.report))) {
        matchesExisting = fs.readFileSync(absolute(destination.report), "utf8") === serialized;
        if (!matchesExisting) throw new Error("LONGITUDINAL_REPORT_DIFFERS_FROM_RECOMPUTATION");
    }
    if (write) {
        if (fs.existsSync(absolute(destination.report))) {
            const existing = fs.readFileSync(absolute(destination.report), "utf8");
            if (existing !== serialized) throw new Error("LONGITUDINAL_REPORT_INCOMPATIBLE_OVERWRITE");
        } else {
            writeAtomic(destination.report, serialized);
        }
        writeAtomic(reportManifestPath, manifestContent());
        matchesExisting = true;
    }

    process.stdout.write(`${JSON.stringify({
        dataset,
        executor_version: LONGITUDINAL_SIMULATION_VERSION,
        report_schema_version: RAW_REPORT_SCHEMA_VERSION,
        personas: report.summary.personas,
        weeks_per_persona: report.summary.weeks_per_persona,
        scenarios: report.summary.scenarios,
        model_executions: report.summary.model_executions,
        failures_by_model: report.summary.failures_by_model,
        fallbacks: report.summary.fallbacks,
        divergent_challenger_choices: report.summary.divergent_challenger_choices,
        no_history_v2_neutral: report.summary.no_history_v2_neutral,
        eliminatory_violations: report.summary.eliminatory_violations,
        content_sha256: report.content_sha256,
        checked: check,
        written: write,
        matches_existing: matchesExisting,
        reserve_accessed: false,
        final_winner_declared: false,
    }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = {
    USAGE,
    destinations,
    manifestContent,
    run,
    validateSourceHashes,
};
