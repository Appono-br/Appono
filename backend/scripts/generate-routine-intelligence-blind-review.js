"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
    buildBlindReviewArtifacts,
    serializeJson,
} = require("../src/domain/routine-intelligence-blind-review");
const { hashCanonico } = require("../src/domain/routine-intelligence-personas");

const backendRoot = path.resolve(__dirname, "..");
const protocolPath = path.join(backendRoot, "experiments/routine-intelligence/blind-review-protocol-v1.json");
const inputs = Object.freeze({
    guardrails: "reports/routine-intelligence/prospective/guardrails-v1.json",
    comparison: "reports/routine-intelligence/prospective/comparison-v1.json",
    developmentRaw: "reports/routine-intelligence/prospective/desenvolvimento-v1.json",
    validationRaw: "reports/routine-intelligence/prospective/validacao-v1.json",
    developmentSnapshot: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json",
    validationSnapshot: "experiments/routine-intelligence/scenarios/validacao-v1.json",
    personas: "experiments/routine-intelligence/personas-v1.json",
});
const publicDirectory = path.join(backendRoot, "reports/routine-intelligence/prospective/blind-review-v1");
const outputPaths = Object.freeze({
    package: path.join(publicDirectory, "package.json"),
    csv: path.join(publicDirectory, "review-form.csv"),
    responses: path.join(publicDirectory, "responses-template.json"),
    instructions: path.join(publicDirectory, "README.md"),
    manifest: path.join(publicDirectory, "manifest.json"),
    key: path.join(backendRoot, "reports/routine-intelligence/prospective/internal/blind-review-key-v1.json"),
});
const USAGE = [
    "Uso:",
    "  node scripts/generate-routine-intelligence-blind-review.js --write",
    "  node scripts/generate-routine-intelligence-blind-review.js --check",
    "",
    "Gera somente o pacote cego prospectivo. Nao executa modelos e nao aceita reserva.",
].join("\n");

function readJson(target) {
    return JSON.parse(fs.readFileSync(target, "utf8"));
}

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function fileHash(target) {
    return sha256(fs.readFileSync(target));
}

function countBy(items, selector) {
    const result = {};
    for (const item of items) {
        const key = selector(item);
        result[key] = (result[key] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function verifyInputs(protocol) {
    const expected = protocol.source_artifacts;
    const checks = [
        [inputs.guardrails, expected.guardrails_report_file_sha256, "BLIND_REVIEW_GUARDRAILS_FILE_HASH"],
        [inputs.comparison, expected.comparison_file_sha256, "BLIND_REVIEW_COMPARISON_FILE_HASH"],
        [inputs.developmentRaw, expected.development_raw_file_sha256, "BLIND_REVIEW_DEVELOPMENT_RAW_FILE_HASH"],
        [inputs.validationRaw, expected.validation_raw_file_sha256, "BLIND_REVIEW_VALIDATION_RAW_FILE_HASH"],
        [inputs.developmentSnapshot, expected.development_snapshot_file_sha256, "BLIND_REVIEW_DEVELOPMENT_SNAPSHOT_FILE_HASH"],
        [inputs.validationSnapshot, expected.validation_snapshot_file_sha256, "BLIND_REVIEW_VALIDATION_SNAPSHOT_FILE_HASH"],
    ];
    for (const [relative, hash, code] of checks) {
        if (fileHash(path.join(backendRoot, relative)) !== hash) throw new Error(code);
    }
    const guardrails = readJson(path.join(backendRoot, inputs.guardrails));
    const comparison = readJson(path.join(backendRoot, inputs.comparison));
    const development = readJson(path.join(backendRoot, inputs.developmentRaw));
    const validation = readJson(path.join(backendRoot, inputs.validationRaw));
    if (guardrails.canonical_sha256 !== expected.guardrails_report_canonical_sha256) throw new Error("BLIND_REVIEW_GUARDRAILS_CONTENT_HASH");
    if (comparison.content_sha256 !== expected.comparison_canonical_sha256) throw new Error("BLIND_REVIEW_COMPARISON_CONTENT_HASH");
    if (development.content_sha256 !== expected.development_raw_content_sha256) throw new Error("BLIND_REVIEW_DEVELOPMENT_CONTENT_HASH");
    if (validation.content_sha256 !== expected.validation_raw_content_sha256) throw new Error("BLIND_REVIEW_VALIDATION_CONTENT_HASH");
    const personas = readJson(path.join(backendRoot, inputs.personas));
    if (hashCanonico(personas) !== expected.personas_canonical_sha256) throw new Error("BLIND_REVIEW_PERSONAS_CANONICAL_HASH");
    return { guardrails, development, validation, personas };
}

function createOutputs() {
    const protocol = readJson(protocolPath);
    const verified = verifyInputs(protocol);
    const artifacts = buildBlindReviewArtifacts({
        protocol,
        guardrailsReport: verified.guardrails,
        rawReports: [verified.development, verified.validation],
        snapshots: [
            readJson(path.join(backendRoot, inputs.developmentSnapshot)),
            readJson(path.join(backendRoot, inputs.validationSnapshot)),
        ],
        personasArtifact: verified.personas,
    });
    const cases = artifacts.internalKey.cases;
    const publicFiles = {
        "package.json": serializeJson(artifacts.publicPackage),
        "review-form.csv": artifacts.csv,
        "responses-template.json": serializeJson(artifacts.responsesTemplate),
        "README.md": artifacts.instructions,
    };
    const publicCases = artifacts.publicPackage.cases;
    const manifestCore = {
        schema_version: "blind-review-distribution-manifest-v1",
        protocol_version: protocol.protocol_version,
        package_content_sha256: artifacts.publicPackage.content_sha256,
        answer_key_commitment_sha256: artifacts.internalKey.canonical_sha256,
        judgments_present: false,
        case_count: cases.length,
        distributions: {
            comparison_mode: countBy(publicCases, (item) => item.comparison_mode),
            anonymous_profile: countBy(publicCases, (item) => item.context.profile_label),
        },
        public_file_sha256: Object.fromEntries(Object.entries(publicFiles).map(([name, content]) => [name, sha256(content)])),
        responses_filled: 0,
        reserve_accessed: false,
        models_executed: 0,
    };
    const manifest = { ...manifestCore, content_sha256: sha256(JSON.stringify(manifestCore)) };
    publicFiles["manifest.json"] = serializeJson(manifest);
    return {
        artifacts,
        files: new Map([
            [outputPaths.package, publicFiles["package.json"]],
            [outputPaths.csv, publicFiles["review-form.csv"]],
            [outputPaths.responses, publicFiles["responses-template.json"]],
            [outputPaths.instructions, publicFiles["README.md"]],
            [outputPaths.manifest, publicFiles["manifest.json"]],
            [outputPaths.key, serializeJson(artifacts.internalKey)],
        ]),
        manifest,
    };
}

function writeAtomically(files) {
    if (fs.existsSync(outputPaths.package) && fs.existsSync(outputPaths.key)) {
        const currentPackage = readJson(outputPaths.package);
        const currentKey = readJson(outputPaths.key);
        const nextPackage = JSON.parse(files.get(outputPaths.package));
        const nextKey = JSON.parse(files.get(outputPaths.key));
        if (currentPackage.content_sha256 !== nextPackage.content_sha256 || currentKey.canonical_sha256 !== nextKey.canonical_sha256) {
            throw new Error("BLIND_REVIEW_INCOMPATIBLE_OVERWRITE");
        }
    }
    const temporary = [];
    for (const [target, content] of files) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const temp = `${target}.tmp`;
        fs.writeFileSync(temp, content, "utf8");
        temporary.push([temp, target]);
    }
    for (const [temp, target] of temporary) fs.renameSync(temp, target);
}

function checkFiles(files) {
    for (const [target, content] of files) {
        if (!fs.existsSync(target)) throw new Error("BLIND_REVIEW_OUTPUT_MISSING");
        if (fs.readFileSync(target, "utf8") !== content) throw new Error("BLIND_REVIEW_OUTPUT_DIFFERS");
    }
}

function run() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    if (process.argv.some((item) => /reserva|reserve/i.test(item))) throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    const write = process.argv.includes("--write");
    const check = process.argv.includes("--check");
    if (write === check) throw new Error("BLIND_REVIEW_MODE_REQUIRES_EXACTLY_ONE_OF_CHECK_OR_WRITE");
    if (process.argv.slice(2).some((item) => !["--write", "--check"].includes(item))) throw new Error("BLIND_REVIEW_ARGUMENT_NOT_ALLOWED");
    const generated = createOutputs();
    if (write) writeAtomically(generated.files);
    else checkFiles(generated.files);
    process.stdout.write(`${JSON.stringify({
        protocol_version: generated.manifest.protocol_version,
        cases_selected: generated.manifest.case_count,
        distributions: generated.manifest.distributions,
        package_content_sha256: generated.manifest.package_content_sha256,
        answer_key_commitment_sha256: generated.manifest.answer_key_commitment_sha256,
        responses_filled: 0,
        reserve_accessed: false,
        models_executed: 0,
        written: write,
        checked: check,
    }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { USAGE, createOutputs, outputPaths, run };
