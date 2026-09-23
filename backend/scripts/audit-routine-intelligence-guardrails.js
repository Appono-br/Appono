"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { auditFrozenGuardrails } = require("../src/domain/routine-intelligence-guardrails");

const backendRoot = path.resolve(__dirname, "..");
const artifactPath = path.join(backendRoot, "experiments/routine-intelligence/guardrails-v1.json");
const rawManifestPath = path.join(backendRoot, "reports/routine-intelligence/prospective/manifest-v1.json");
const outputPath = path.join(backendRoot, "reports/routine-intelligence/prospective/guardrails-v1.json");
const datasets = Object.freeze({
    desenvolvimento_v1: {
        raw: "reports/routine-intelligence/prospective/desenvolvimento-v1.json",
        snapshot: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json",
    },
    validacao_v1: {
        raw: "reports/routine-intelligence/prospective/validacao-v1.json",
        snapshot: "experiments/routine-intelligence/scenarios/validacao-v1.json",
    },
});
const USAGE = [
    "Uso:",
    "  node scripts/audit-routine-intelligence-guardrails.js --dataset=<desenvolvimento_v1|validacao_v1|all> --check",
    "  node scripts/audit-routine-intelligence-guardrails.js --dataset=all --write",
    "",
    "A auditoria e somente leitura e nunca executa modelos ou aceita reservas.",
].join("\n");

function argument(name) {
    const prefix = `--${name}=`;
    return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function readJson(target) {
    return JSON.parse(fs.readFileSync(target, "utf8"));
}

function fileHash(target) {
    return crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
}

function rawReport(dataset, manifest) {
    const relativePath = datasets[dataset].raw;
    const target = path.join(backendRoot, relativePath);
    const expected = manifest.reports?.[dataset];
    if (!expected) throw new Error("GUARDRAIL_RAW_MANIFEST_ENTRY_MISSING");
    if (fileHash(target) !== expected.file_sha256) throw new Error("GUARDRAIL_RAW_FILE_HASH_MISMATCH");
    const report = readJson(target);
    if (report.content_sha256 !== expected.content_sha256) throw new Error("GUARDRAIL_RAW_CONTENT_HASH_MISMATCH");
    return report;
}

function serialize(report) {
    return `${JSON.stringify(report, null, 2)}\n`;
}

function writeAtomic(target, content) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, target);
}

function run() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    const dataset = argument("dataset");
    if (!dataset) throw new Error("GUARDRAIL_DATASET_REQUIRED");
    if (/reserva|reserve/i.test(dataset)) throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    if (dataset !== "all" && !datasets[dataset]) throw new Error("GUARDRAIL_DATASET_NOT_ALLOWED");
    const check = process.argv.includes("--check");
    const write = process.argv.includes("--write");
    if (check === write) throw new Error("GUARDRAIL_MODE_REQUIRES_EXACTLY_ONE_OF_CHECK_OR_WRITE");
    if (write && dataset !== "all") throw new Error("GUARDRAIL_WRITE_REQUIRES_ALL_DATASETS");

    const selected = dataset === "all" ? Object.keys(datasets) : [dataset];
    const manifest = readJson(rawManifestPath);
    const report = auditFrozenGuardrails({
        artifact: readJson(artifactPath),
        rawReports: selected.map((id) => rawReport(id, manifest)),
        snapshots: selected.map((id) => readJson(path.join(backendRoot, datasets[id].snapshot))),
        personasArtifact: readJson(path.join(backendRoot, "experiments/routine-intelligence/personas-v1.json")),
    });
    const content = serialize(report);
    if (write) {
        if (fs.existsSync(outputPath)) {
            const previous = readJson(outputPath);
            if (previous.guardrails_sha256 !== report.guardrails_sha256) throw new Error("GUARDRAIL_INCOMPATIBLE_OVERWRITE");
        }
        writeAtomic(outputPath, content);
    } else if (dataset === "all" && fs.existsSync(outputPath) && fs.readFileSync(outputPath, "utf8") !== content) {
        throw new Error("GUARDRAIL_OUTPUT_DIFFERS");
    }

    process.stdout.write(`${JSON.stringify({
        dataset,
        guardrails_version: report.guardrails_version,
        guardrails_sha256: report.guardrails_sha256,
        report_sha256: report.canonical_sha256,
        regressions_classified: report.regression_summary.total_classified,
        blind_review_candidates: report.blind_review_candidates.length,
        reserve_accessed: false,
        models_executed: 0,
        written: write,
        checked: check,
    }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { USAGE, datasets, run, serialize };
