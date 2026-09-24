"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const { simulateCandidate, serializeCandidateReport, metrics, compareToBaseline, VERSION } = require("../src/domain/routine-intelligence-v2-1-evaluation");

const root = path.resolve(__dirname, "..");
const datasets = {
    desenvolvimento_v1: { snapshot: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json", output: "reports/routine-intelligence/prospective/v2-1/development-raw.json", metrics: "reports/routine-intelligence/prospective/v2-1/development-metrics.json", baseline: "reports/routine-intelligence/prospective/desenvolvimento-v1.json" },
    validacao_v1: { snapshot: "experiments/routine-intelligence/scenarios/validacao-v1.json", output: "reports/routine-intelligence/prospective/v2-1/validation-raw.json", metrics: "reports/routine-intelligence/prospective/v2-1/validation-metrics.json", baseline: "reports/routine-intelligence/prospective/validacao-v1.json" },
};
function absolute(relative) { return path.join(root, relative); }
function read(relative) { return JSON.parse(fs.readFileSync(absolute(relative), "utf8")); }
function hash(relative) { return crypto.createHash("sha256").update(fs.readFileSync(absolute(relative))).digest("hex"); }
function write(relative, content) { const target = absolute(relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content, "utf8"); }
function arg(name) { return process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null; }
function usage() { return "node scripts/run-routine-intelligence-v2-1-candidate.js --dataset=<desenvolvimento_v1|validacao_v1> --check|--write"; }
function run() {
    if (process.argv.includes("--help")) return console.log(usage());
    const dataset = arg("dataset");
    if (!datasets[dataset] || /reserva|reserve/i.test(dataset)) throw new Error("V2_1_DATASET_NOT_ALLOWED");
    const check = process.argv.includes("--check");
    const writeMode = process.argv.includes("--write");
    if (check === writeMode) throw new Error("V2_1_MODE_REQUIRES_CHECK_OR_WRITE");
    const destination = datasets[dataset];
    const snapshot = read(destination.snapshot);
    const report = simulateCandidate({ snapshot, partitionsArtifact: read("experiments/routine-intelligence/partitions-v1.json"), personasArtifact: read("experiments/routine-intelligence/personas-v1.json") });
    const raw = serializeCandidateReport(report);
    const baseline = read(destination.baseline);
    const comparisons = ["deterministico-v3", "appono-intelligence-v1", "appono-intelligence-v2"].map((model) => compareToBaseline(report, baseline, model));
    const output = { schema_version: 1, candidate_version: VERSION, dataset, raw_content_sha256: report.content_sha256, metrics: metrics(report), comparisons, reserve_accessed: false, formulas_changed: false };
    const metricsText = `${JSON.stringify(output, null, 2)}\n`;
    if (check) {
        if (!fs.existsSync(absolute(destination.output)) || fs.readFileSync(absolute(destination.output), "utf8") !== raw) throw new Error("V2_1_RAW_DIFFERS_FROM_RECOMPUTATION");
        if (!fs.existsSync(absolute(destination.metrics)) || fs.readFileSync(absolute(destination.metrics), "utf8") !== metricsText) throw new Error("V2_1_METRICS_DIFFERS_FROM_RECOMPUTATION");
    } else {
        write(destination.output, raw);
        write(destination.metrics, metricsText);
    }
    console.log(JSON.stringify({ dataset, candidate_version: VERSION, raw_content_sha256: report.content_sha256, metrics_sha256: canonicalHash(output), comparisons, checked: check, written: writeMode, reserve_accessed: false }, null, 2));
}
if (require.main === module) run();
module.exports = { datasets, run };
