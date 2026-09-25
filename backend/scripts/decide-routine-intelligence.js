"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const {
    buildTechnicalDecision,
    validateHumanSubmission,
    validateTechnicalDecisionProtocol,
} = require("../src/domain/routine-intelligence-technical-decision");

const backendRoot = path.resolve(__dirname, "..");
const paths = Object.freeze({
    protocol: "experiments/routine-intelligence/technical-decision-protocol-v1.json",
    blindProtocol: "experiments/routine-intelligence/blind-review-protocol-v1.json",
    package: "reports/routine-intelligence/prospective/blind-review-v1/package.json",
    responses: "reports/routine-intelligence/prospective/blind-review-v1/responses-submitted.json",
    key: "reports/routine-intelligence/prospective/internal/blind-review-key-v1.json",
    guardrails: "reports/routine-intelligence/prospective/guardrails-v1.json",
    comparison: "reports/routine-intelligence/prospective/comparison-v1.json",
    developmentMetrics: "reports/routine-intelligence/prospective/metrics-desenvolvimento-v1.json",
    validationMetrics: "reports/routine-intelligence/prospective/metrics-validacao-v1.json",
    control: "src/domain/routine-scoring.js",
    v1: "src/domain/routine-intelligence.js",
    v2: "src/domain/routine-intelligence-v2.js",
    hypotheses: "experiments/routine-intelligence/technical-hypotheses-v1.json",
    decision: "reports/routine-intelligence/prospective/technical-decision-v1.json",
    responsesManifest: "reports/routine-intelligence/prospective/internal/blind-review-responses-manifest-v1.json",
});
const USAGE = [
    "Uso:",
    "  node scripts/decide-routine-intelligence.js --write",
    "  node scripts/decide-routine-intelligence.js --check",
    "  node scripts/decide-routine-intelligence.js --write --responses=reports/routine-intelligence/prospective/blind-review-v1/responses-submitted.json",
    "",
    "Sem submissao humana valida, registra revisao pendente e mantem a V2 sem ajuste.",
].join("\n");

function absolute(relative) {
    return path.join(backendRoot, relative);
}

function readJson(relative) {
    return JSON.parse(fs.readFileSync(absolute(relative), "utf8"));
}

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function fileHash(relative) {
    return sha256(fs.readFileSync(absolute(relative)));
}

function serialize(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function responseArgument() {
    const prefix = "--responses=";
    return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function verifyFileHashes(protocol) {
    const source = protocol.source_artifacts;
    const checks = [
        [paths.blindProtocol, source.blind_review_protocol_file_sha256, "DECISION_BLIND_PROTOCOL_FILE_HASH"],
        [paths.package, source.blind_package_file_sha256, "DECISION_BLIND_PACKAGE_FILE_HASH"],
        [paths.key, source.blind_key_file_sha256, "DECISION_BLIND_KEY_FILE_HASH"],
        [paths.guardrails, source.guardrails_report_file_sha256, "DECISION_GUARDRAILS_FILE_HASH"],
        [paths.comparison, source.comparison_file_sha256, "DECISION_COMPARISON_FILE_HASH"],
        [paths.developmentMetrics, source.development_metrics_file_sha256, "DECISION_DEVELOPMENT_METRICS_FILE_HASH"],
        [paths.validationMetrics, source.validation_metrics_file_sha256, "DECISION_VALIDATION_METRICS_FILE_HASH"],
        [paths.control, source.control_source_sha256, "DECISION_CONTROL_SOURCE_HASH"],
        [paths.v1, source.v1_source_sha256, "DECISION_V1_SOURCE_HASH"],
        [paths.v2, source.v2_source_sha256, "DECISION_V2_SOURCE_HASH"],
    ];
    for (const [relative, expected, code] of checks) {
        if (fileHash(relative) !== expected) throw new Error(code);
    }
    const blindProtocol = readJson(paths.blindProtocol);
    if (canonicalHash(blindProtocol) !== source.blind_review_protocol_canonical_sha256) throw new Error("DECISION_BLIND_PROTOCOL_CANONICAL_HASH");
    const development = readJson(paths.developmentMetrics);
    const validation = readJson(paths.validationMetrics);
    if (development.content_sha256 !== source.development_metrics_content_sha256) throw new Error("DECISION_DEVELOPMENT_METRICS_CONTENT_HASH");
    if (validation.content_sha256 !== source.validation_metrics_content_sha256) throw new Error("DECISION_VALIDATION_METRICS_CONTENT_HASH");
}

function validateIncompleteSubmissionEnvelope(submission, publicPackage) {
    if (!submission || typeof submission !== "object" || Array.isArray(submission)) throw new Error("DECISION_SUBMISSION_INVALID");
    if (submission.schema_version !== "blind-review-submission-v1") throw new Error("DECISION_SUBMISSION_SCHEMA");
    if (submission.package_content_sha256 !== publicPackage.content_sha256) throw new Error("DECISION_SUBMISSION_PACKAGE_HASH");
    if (submission.human_supplied !== true || submission.synthetic_fixture !== false) throw new Error("DECISION_SUBMISSION_NOT_HUMAN");
    if (typeof submission.reviewer_code !== "string" || !/^[a-z0-9_-]{2,32}$/i.test(submission.reviewer_code)) throw new Error("DECISION_SUBMISSION_REVIEWER");
    if (!Array.isArray(submission.responses) || submission.responses.length >= publicPackage.case_count) throw new Error("DECISION_SUBMISSION_NOT_INCOMPLETE");
    if (submission.content_sha256 !== canonicalHash(Object.fromEntries(Object.entries(submission).filter(([key]) => key !== "content_sha256")))) throw new Error("DECISION_SUBMISSION_CONTENT_HASH");
    const allowedCases = new Set(publicPackage.cases.map((item) => item.blind_case_id));
    const allowedChoices = new Set([null, ...publicPackage.allowed_choices]);
    const allowedReasons = new Set(publicPackage.allowed_reason_codes);
    const seen = new Set();
    for (const response of submission.responses) {
        if (!response || typeof response !== "object" || Array.isArray(response) || Object.keys(response).some((key) => !["blind_case_id", "choice", "reason_codes", "review_confidence", "optional_note"].includes(key))) throw new Error("DECISION_SUBMISSION_RESPONSE_FIELD");
        if (!allowedCases.has(response.blind_case_id) || seen.has(response.blind_case_id)) throw new Error("DECISION_SUBMISSION_RESPONSE_CASE");
        if (!allowedChoices.has(response.choice) || !Array.isArray(response.reason_codes) || response.reason_codes.some((reason) => !allowedReasons.has(reason))) throw new Error("DECISION_SUBMISSION_RESPONSE_VALUE");
        if (response.review_confidence !== null && !["BAIXA", "MEDIA", "ALTA"].includes(response.review_confidence)) throw new Error("DECISION_SUBMISSION_RESPONSE_CONFIDENCE");
        if (response.optional_note !== null && (typeof response.optional_note !== "string" || response.optional_note.length > 280 || /@|(?:access|refresh)[_-]?token|service_role|jwt|senha|password|alerg|condicao medica|endere[cç]o|latitude|longitude/i.test(response.optional_note))) throw new Error("DECISION_SUBMISSION_RESPONSE_NOTE");
        seen.add(response.blind_case_id);
    }
}

function createOutputs({ responsePath = null } = {}) {
    const protocol = readJson(paths.protocol);
    validateTechnicalDecisionProtocol(protocol);
    verifyFileHashes(protocol);
    const publicPackage = readJson(paths.package);
    let submission = null;
    let submissionFileSha256 = null;
    let humanStateOverride = null;
    if (responsePath) {
        if (responsePath.replaceAll("\\", "/") !== paths.responses) throw new Error("DECISION_RESPONSE_PATH_NOT_ALLOWED");
        if (!fs.existsSync(absolute(paths.responses))) throw new Error("DECISION_RESPONSES_NOT_FOUND");
        submission = readJson(paths.responses);
        if (Array.isArray(submission.responses) && submission.responses.length < publicPackage.case_count) {
            validateIncompleteSubmissionEnvelope(submission, publicPackage);
            humanStateOverride = "REVISAO_HUMANA_INCOMPLETA";
            submission = null;
        } else validateHumanSubmission(submission, publicPackage);
        submissionFileSha256 = fileHash(paths.responses);
    } else if (fs.existsSync(absolute(paths.responses))) {
        submission = readJson(paths.responses);
        if (Array.isArray(submission.responses) && submission.responses.length < publicPackage.case_count) {
            validateIncompleteSubmissionEnvelope(submission, publicPackage);
            humanStateOverride = "REVISAO_HUMANA_INCOMPLETA";
            submission = null;
        } else validateHumanSubmission(submission, publicPackage);
        submissionFileSha256 = fileHash(paths.responses);
    }
    const generated = buildTechnicalDecision({
        protocol,
        comparison: readJson(paths.comparison),
        guardrailsReport: readJson(paths.guardrails),
        publicPackage,
        internalKey: readJson(paths.key),
        submission,
        submissionFileSha256,
        humanStateOverride,
    });
    const files = new Map([
        [absolute(paths.hypotheses), serialize(generated.hypothesesReport)],
        [absolute(paths.decision), serialize(generated.decisionReport)],
    ]);
    if (submission) {
        const manifestCore = {
            schema_version: 1,
            manifest_version: "blind-review-responses-manifest-v1",
            package_content_sha256: publicPackage.content_sha256,
            submission_file_sha256: submissionFileSha256,
            reviewer_code: submission.reviewer_code,
            response_count: submission.responses.length,
            state: "FROZEN_COMPLETE",
            privacy_audit_passed: true,
            automated_response: false,
        };
        files.set(absolute(paths.responsesManifest), serialize({ ...manifestCore, canonical_sha256: canonicalHash(manifestCore) }));
    }
    return { protocol, generated, files };
}

function outputsCompatible(files) {
    for (const [target, content] of files) {
        if (!fs.existsSync(target)) continue;
        const existing = JSON.parse(fs.readFileSync(target, "utf8"));
        const next = JSON.parse(content);
        if (existing.canonical_sha256 === next.canonical_sha256) continue;
        const humanStateCompatible = existing.human_review_state === next.human_review_state
            || (existing.human_review_state === "REVISAO_HUMANA_PENDENTE" && ["REVISAO_HUMANA_INCOMPLETA", "REVISAO_HUMANA_CONGELADA"].includes(next.human_review_state));
        const hypothesesCompatible = existing.hypotheses_version === next.hypotheses_version
            && humanStateCompatible
            && existing.accepted_count === next.accepted_count;
        const decisionCompatible = existing.report_version === next.report_version
            && existing.substantive_decision === next.substantive_decision
            && existing.human_review?.state === next.human_review?.state
            && existing.input_hashes?.comparison === next.input_hashes?.comparison
            && existing.input_hashes?.guardrails === next.input_hashes?.guardrails
            && existing.input_hashes?.blind_package === next.input_hashes?.blind_package
            && existing.input_hashes?.blind_key_commitment === next.input_hashes?.blind_key_commitment
            && existing.formulas_changed === false
            && existing.reserve_accessed === false;
        const humanCompletionTransition = existing.human_review_state === "REVISAO_HUMANA_PENDENTE"
            && ["REVISAO_HUMANA_INCOMPLETA", "REVISAO_HUMANA_CONGELADA"].includes(next.human_review_state)
            && next.input_hashes?.human_submission_file;
        if (!hypothesesCompatible && !decisionCompatible && !humanCompletionTransition) return false;
    }
    return true;
}

function writeAtomically(files) {
    if (!outputsCompatible(files)) throw new Error("DECISION_INCOMPATIBLE_OVERWRITE");
    const temporary = [];
    for (const [target, content] of files) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const temp = `${target}.tmp`;
        fs.writeFileSync(temp, content, "utf8");
        temporary.push([temp, target]);
    }
    for (const [temp, target] of temporary) fs.renameSync(temp, target);
}

function checkOutputs(files) {
    for (const [target, content] of files) {
        if (!fs.existsSync(target)) throw new Error("DECISION_OUTPUT_MISSING");
        if (fs.readFileSync(target, "utf8") !== content) throw new Error("DECISION_OUTPUT_DIFFERS");
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
    if (write === check) throw new Error("DECISION_MODE_REQUIRES_EXACTLY_ONE_OF_CHECK_OR_WRITE");
    const responses = responseArgument();
    const allowed = new Set(["--write", "--check"]);
    if (responses) allowed.add(`--responses=${responses}`);
    if (process.argv.slice(2).some((item) => !allowed.has(item))) throw new Error("DECISION_ARGUMENT_NOT_ALLOWED");
    const output = createOutputs({ responsePath: responses });
    if (write) writeAtomically(output.files);
    else checkOutputs(output.files);
    const report = output.generated.decisionReport;
    process.stdout.write(`${JSON.stringify({
        decision_protocol_version: output.protocol.decision_protocol_version,
        human_review_state: report.human_review.state,
        reviewer_count: report.human_review.reviewer_count,
        valid_responses: report.human_review.valid_responses,
        hypothesis_summary: report.hypothesis_summary,
        milestone_decision: report.milestone_decision,
        substantive_decision: report.substantive_decision,
        report_sha256: report.canonical_sha256,
        formulas_changed: false,
        reserve_accessed: false,
        models_executed: 0,
        public_rollout_percent: 0,
        written: write,
        checked: check,
    }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { USAGE, createOutputs, paths, run };
