"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const {
    aggregateHumanReview,
    buildTechnicalDecision,
    evaluateHypotheses,
    validateFrozenEvidence,
    validateHumanSubmission,
    validateTechnicalDecisionProtocol,
} = require("../src/domain/routine-intelligence-technical-decision");
const { createOutputs, paths } = require("../scripts/decide-routine-intelligence");

const root = path.resolve(__dirname, "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const clone = (value) => structuredClone(value);
const fileHash = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
const protocol = readJson(paths.protocol);
const comparison = readJson(paths.comparison);
const guardrails = readJson(paths.guardrails);
const publicPackage = readJson(paths.package);
const internalKey = readJson(paths.key);

function build(overrides = {}) {
    return buildTechnicalDecision({ protocol, comparison, guardrailsReport: guardrails, publicPackage, internalKey, ...overrides });
}

function artificialSubmission() {
    const choices = ["A", "B", "EMPATE", "INDETERMINADO"];
    const core = {
        schema_version: "blind-review-submission-v1",
        package_content_sha256: publicPackage.content_sha256,
        reviewer_code: "revisor_fixture",
        human_supplied: true,
        synthetic_fixture: false,
        responses: publicPackage.cases.map((item, index) => ({
            blind_case_id: item.blind_case_id,
            choice: choices[index % choices.length],
            reason_codes: [index % 2 === 0 ? "PREFERENCIA_EXPLICITA" : "CONTEXTO_INSUFICIENTE"],
            review_confidence: ["BAIXA", "MEDIA", "ALTA"][index % 3],
            optional_note: null,
        })),
    };
    return { ...core, content_sha256: canonicalHash(core) };
}

test("protocolo de decisao e estrito, pre-registrado e possui enums fechados", () => {
    assert.equal(validateTechnicalDecisionProtocol(protocol), protocol);
    assert.equal(canonicalHash(protocol), "bda3b9feb4b4bc04b977b1253d7b60d217bc9439eb706be8998b151da42d8b33");
    assert.deepEqual(protocol.allowed_substantive_decisions, ["MANTER_V2_SEM_AJUSTE", "HIPOTESES_V2_1_ACEITAS"]);
    assert.equal(new Set(protocol.candidate_hypotheses.map((item) => item.id)).size, protocol.candidate_hypotheses.length);
    const unknown = clone(protocol);
    unknown.resultado_desejado = "V2.1";
    assert.throws(() => validateTechnicalDecisionProtocol(unknown), /PROTOCOL_UNKNOWN_FIELD/);
    const duplicate = clone(protocol);
    duplicate.candidate_hypotheses[1].id = duplicate.candidate_hypotheses[0].id;
    assert.throws(() => validateTechnicalDecisionProtocol(duplicate), /PROTOCOL_DUPLICATE_HYPOTHESIS/);
});

test("evidencias congeladas e compromisso da chave sao validados", () => {
    assert.equal(validateFrozenEvidence({ protocol, comparison, guardrailsReport: guardrails, publicPackage, internalKey }), true);
    for (const [name, value, pattern] of [
        ["comparison", comparison, /COMPARISON_HASH|COMPARISON_CANONICAL_HASH/],
        ["guardrailsReport", guardrails, /GUARDRAILS_HASH|GUARDRAILS_CANONICAL_HASH/],
        ["publicPackage", publicPackage, /PACKAGE_HASH|PACKAGE_CANONICAL_HASH/],
        ["internalKey", internalKey, /KEY_COMMITMENT|KEY_CANONICAL_HASH/],
    ]) {
        const inputs = { protocol, comparison, guardrailsReport: guardrails, publicPackage, internalKey };
        inputs[name] = clone(value);
        if (name === "comparison") inputs[name].content_sha256 = "0".repeat(64);
        if (name === "guardrailsReport") inputs[name].canonical_sha256 = "0".repeat(64);
        if (name === "publicPackage") inputs[name].content_sha256 = "0".repeat(64);
        if (name === "internalKey") inputs[name].canonical_sha256 = "0".repeat(64);
        assert.throws(() => validateFrozenEvidence(inputs), pattern);
    }
});

test("fluxo B registra revisao pendente e mantem V2 sem ajuste", () => {
    const result = build();
    assert.equal(result.decisionReport.human_review.state, "REVISAO_HUMANA_PENDENTE");
    assert.equal(result.decisionReport.human_review.valid_responses, 0);
    assert.equal(result.decisionReport.human_review.aggregation_present, false);
    assert.equal(result.decisionReport.substantive_decision, "MANTER_V2_SEM_AJUSTE");
    assert.equal(result.decisionReport.milestone_decision, "DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE");
    assert.equal(result.hypothesesReport.accepted_count, 0);
    assert.deepEqual(result.decisionReport.accepted_hypothesis_ids, []);
    assert.equal(result.decisionReport.reserve_accessed, false);
    assert.equal(result.decisionReport.formulas_changed, false);
    assert.equal(result.decisionReport.models_executed, 0);
});

test("submissao incompleta permanece auditavel sem virar evidencia humana", () => {
    const result = build({ humanStateOverride: "REVISAO_HUMANA_INCOMPLETA", submissionFileSha256: "a".repeat(64) });
    assert.equal(result.decisionReport.human_review.state, "REVISAO_HUMANA_INCOMPLETA");
    assert.equal(result.decisionReport.human_review.aggregation_present, false);
    assert.equal(result.decisionReport.human_review.valid_responses, 0);
    assert.equal(result.decisionReport.milestone_decision, "DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE");
    assert.equal(result.decisionReport.input_hashes.human_submission_file, "a".repeat(64));
});

test("matriz automatizada preserva criterio desfavoravel e nao confunde seguranca com qualidade", () => {
    const evidence = build().decisionReport.automated_evidence;
    assert.equal(evidence.executions_total, 1800);
    assert.equal(evidence.eliminatory_violations, 0);
    assert.equal(evidence.validation_mean_regret["deterministico-v3"], 5.372953);
    assert.equal(evidence.validation_mean_regret["appono-intelligence-v1"], 4.263973);
    assert.equal(evidence.validation_mean_regret["appono-intelligence-v2"], 4.926099);
    assert.equal(evidence.validation_v2_minus_control, -0.446854);
    assert.equal(evidence.validation_v2_minus_v1, 0.662126);
    assert.equal(evidence.v2_vs_control_status, "PASS");
    assert.equal(evidence.v2_vs_v1_status, "FAIL");
    assert.deepEqual(evidence.v2_confidence_at_least_025, { numerator: 102, denominator: 300, rate: 0.34 });
    assert.equal(evidence.safety_is_not_quality_superiority, true);
});

test("submissao artificial completa so agrega depois do congelamento", () => {
    const submission = artificialSubmission();
    assert.equal(validateHumanSubmission(submission, publicPackage), submission);
    assert.throws(
        () => aggregateHumanReview({ submission, publicPackage, internalKey, responsesFrozen: false }),
        /RESPONSES_NOT_FROZEN/,
    );
    const aggregate = aggregateHumanReview({ submission, publicPackage, internalKey, responsesFrozen: true });
    assert.equal(aggregate.total_responses, 24);
    assert.equal(aggregate.reviewer_count, 1);
    assert.equal(aggregate.consensus_claimed, false);
    assert.deepEqual(aggregate.choices, { A: 6, B: 6, EMPATE: 6, INDETERMINADO: 6 });
    assert.equal(Object.values(aggregate.determinate_preferences_by_origin).reduce((sum, value) => sum + value, 0), 12);
});

test("submissao invalida, incompleta, duplicada, automatica ou privada e rejeitada", () => {
    const cases = [
        ["incomplete", (value) => value.responses.pop(), /SUBMISSION_CASE_COUNT/],
        ["duplicate", (value) => { value.responses[1].blind_case_id = value.responses[0].blind_case_id; }, /SUBMISSION_DUPLICATE_CASE/],
        ["choice", (value) => { value.responses[0].choice = "V2"; }, /SUBMISSION_CHOICE/],
        ["reason", (value) => { value.responses[0].reason_codes = ["MODELO_MELHOR"]; }, /SUBMISSION_REASON/],
        ["confidence", (value) => { value.responses[0].review_confidence = "TOTAL"; }, /SUBMISSION_CONFIDENCE/],
        ["private", (value) => { value.responses[0].optional_note = "contato pessoa@example.com"; }, /SUBMISSION_NOTE/],
        ["automatic", (value) => { value.human_supplied = false; value.synthetic_fixture = true; }, /SUBMISSION_NOT_HUMAN/],
        ["package", (value) => { value.package_content_sha256 = "0".repeat(64); }, /SUBMISSION_PACKAGE_HASH/],
    ];
    for (const [, mutate, pattern] of cases) {
        const submission = artificialSubmission();
        mutate(submission);
        submission.content_sha256 = canonicalHash(Object.fromEntries(Object.entries(submission).filter(([key]) => key !== "content_sha256")));
        assert.throws(() => validateHumanSubmission(submission, publicPackage), pattern);
    }
});

test("hipoteses atuais nao sao aceitas e regras inseguras impedem aceitacao", () => {
    const evaluated = evaluateHypotheses(protocol, comparison, guardrails, "REVISAO_HUMANA_PENDENTE");
    assert.equal(evaluated.filter((item) => item.status === "ACCEPTED_FOR_INVESTIGATION").length, 0);
    assert.equal(evaluated.find((item) => item.id === "explicit_preference_requires_broader_precedence").status, "DEFERRED_HUMAN_REVIEW");
    for (const field of ["uses_reserve", "removes_cases", "score_tuning", "changes_eliminatory_filters", "weakens_signal_safety"]) {
        const changed = clone(protocol);
        changed.candidate_hypotheses[0].mechanism_confirmed_by_frozen_evidence = true;
        changed.candidate_hypotheses[0][field] = true;
        const result = evaluateHypotheses(changed, comparison, guardrails, "REVISAO_HUMANA_CONGELADA")[0];
        assert.equal(result.status, "INSUFFICIENT_EVIDENCE", field);
    }
    const noFixture = clone(protocol);
    noFixture.candidate_hypotheses[0].mechanism_confirmed_by_frozen_evidence = true;
    noFixture.candidate_hypotheses[0].fixture_reference = null;
    assert.equal(evaluateHypotheses(noFixture, comparison, guardrails, "REVISAO_HUMANA_CONGELADA")[0].status, "INSUFFICIENT_EVIDENCE");
});

test("relatorios sao canonicos, deterministicos e nao expõem resposta ou chave", () => {
    const first = build();
    const second = build();
    assert.deepEqual(first, second);
    assert.equal(first.decisionReport.canonical_sha256, canonicalHash(Object.fromEntries(Object.entries(first.decisionReport).filter(([key]) => key !== "canonical_sha256"))));
    assert.equal(first.hypothesesReport.canonical_sha256, canonicalHash(Object.fromEntries(Object.entries(first.hypothesesReport).filter(([key]) => key !== "canonical_sha256"))));
    const text = JSON.stringify(first);
    assert.doesNotMatch(text, /optional_note|private_key|access_token|refresh_token|service_role|senha|password/i);
});

test("CLI help e check nao escrevem, e reserva ou caminho arbitrario falham", () => {
    const output = createOutputs();
    const before = new Map([...output.files.keys()].map((target) => [target, fs.statSync(target).mtimeMs]));
    for (const argument of ["--help", "--check"]) {
        const result = spawnSync(process.execPath, ["scripts/decide-routine-intelligence.js", argument], { cwd: root, encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
    }
    for (const [target, modified] of before) assert.equal(fs.statSync(target).mtimeMs, modified);
    const reserve = spawnSync(process.execPath, ["scripts/decide-routine-intelligence.js", "--check", "--dataset=reserva"], { cwd: root, encoding: "utf8" });
    assert.notEqual(reserve.status, 0);
    assert.match(reserve.stderr, /PROSPECTIVE_RESERVE_IS_SEALED/);
    const arbitrary = spawnSync(process.execPath, ["scripts/decide-routine-intelligence.js", "--check", "--responses=outro.json"], { cwd: root, encoding: "utf8" });
    assert.notEqual(arbitrary.status, 0);
    assert.match(arbitrary.stderr, /DECISION_RESPONSE_PATH_NOT_ALLOWED/);
});

test("decisor nao importa modelos, banco, HTTP, ambiente ou aleatoriedade", () => {
    const source = [
        fs.readFileSync(path.join(root, "src/domain/routine-intelligence-technical-decision.js"), "utf8"),
        fs.readFileSync(path.join(root, "scripts/decide-routine-intelligence.js"), "utf8"),
    ].join("\n");
    assert.doesNotMatch(source, /require\([^)]*(routine-intelligence-v2|routine-intelligence\.js|routine-recommendation|supabase|express|https?|dotenv)/);
    assert.doesNotMatch(source, /process\.env|Math\.random|Date\.now/);
});

test("formulas, pacote, chave e rollout zero permanecem intactos", () => {
    const expected = {
        "src/domain/routine-scoring.js": "0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18",
        "src/domain/routine-intelligence.js": "41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b",
        "src/domain/routine-intelligence-v2.js": "f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4",
        "reports/routine-intelligence/prospective/blind-review-v1/package.json": "c869b431b92c3bfb952b7a741a32fd11f3bc0ff844e19cdea33eff464ea751c7",
        "reports/routine-intelligence/prospective/internal/blind-review-key-v1.json": "235f63dfa5f94d7ccc20d33a070fcb522fffdf2b3acb941ec46d9bfbc0727891",
    };
    for (const [relative, hash] of Object.entries(expected)) assert.equal(fileHash(relative), hash);
    assert.equal(protocol.public_rollout_percent, 0);
    assert.equal(readJson("experiments/routine-intelligence/reserve-commitment-v1.json").state, "SEALED_UNMATERIALIZED");
});
