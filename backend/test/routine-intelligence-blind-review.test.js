"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const {
    buildBlindReviewArtifacts,
    stableDigest,
    validateBlindReviewProtocol,
    validatePublicPackage,
    validateResponses,
} = require("../src/domain/routine-intelligence-blind-review");
const { createOutputs, outputPaths } = require("../scripts/generate-routine-intelligence-blind-review");

const root = path.resolve(__dirname, "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const clone = (value) => structuredClone(value);
const fileHash = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
const protocol = readJson("experiments/routine-intelligence/blind-review-protocol-v1.json");
const guardrails = readJson("reports/routine-intelligence/prospective/guardrails-v1.json");
const rawReports = [
    readJson("reports/routine-intelligence/prospective/desenvolvimento-v1.json"),
    readJson("reports/routine-intelligence/prospective/validacao-v1.json"),
];
const snapshots = [
    readJson("experiments/routine-intelligence/scenarios/desenvolvimento-v1.json"),
    readJson("experiments/routine-intelligence/scenarios/validacao-v1.json"),
];
const personasArtifact = readJson("experiments/routine-intelligence/personas-v1.json");

function build(overrides = {}) {
    return buildBlindReviewArtifacts({ protocol, guardrailsReport: guardrails, rawReports, snapshots, personasArtifact, ...overrides });
}

test("protocolo cego possui schema estrito, semente e compromisso pre-registrados", () => {
    assert.equal(validateBlindReviewProtocol(protocol), protocol);
    assert.equal(protocol.seed_derivation.derived_sha256, "901bc28bcaab1780efd6644414ee201d5836869914587f7217c46b05f36c8927");
    assert.equal(protocol.key_commitment.expected_sha256, "1313c2dee80fc64028f430bb1c60df17316757e776c9c7d0670c68770e4c325a");
    const invalid = clone(protocol);
    invalid.unexpected = true;
    assert.throws(() => validateBlindReviewProtocol(invalid), /PROTOCOL_UNKNOWN_FIELD/);
});

test("selecao gera 24 casos unicos, estratificados e independentes da ordem de entrada", () => {
    const original = build();
    const reordered = build({
        rawReports: rawReports.map((report) => ({ ...report, decisions: [...report.decisions].reverse() })).reverse(),
        snapshots: snapshots.map((snapshot) => ({ ...snapshot, scenarios: [...snapshot.scenarios].reverse() })).reverse(),
        guardrailsReport: { ...guardrails, regressions: [...guardrails.regressions].reverse() },
    });
    assert.equal(original.publicPackage.case_count, 24);
    assert.equal(new Set(original.internalKey.cases.map((item) => `${item.dataset_id}:${item.scenario_id}`)).size, 24);
    assert.ok(original.internalKey.cases.filter((item) => item.dataset_id === "validacao_v1").length >= 12);
    assert.deepEqual(reordered.publicPackage, original.publicPackage);
    assert.deepEqual(reordered.internalKey, original.internalKey);
    assert.deepEqual(new Set(original.internalKey.cases.map((item) => item.virtual_week)), new Set([0, 1, 2, 3, 4, 5]));
    assert.equal(new Set(original.internalKey.cases.map((item) => item.persona_id)).size, 9);
});

test("cada par usa duas escolhas nativas distintas e elegiveis sem fallback", () => {
    const artifacts = build();
    const scenarioByKey = new Map(snapshots.flatMap((snapshot) => snapshot.scenarios.map((scenario) => [`${scenario.partition_id}:${scenario.scenario_id}`, scenario])));
    const decisionByKey = new Map(rawReports.flatMap((report) => report.decisions.map((decision) => [`${decision.dataset_id}:${decision.scenario_id}:${decision.model_version}`, decision])));
    for (const item of artifacts.internalKey.cases) {
        const scenario = scenarioByKey.get(`${item.dataset_id}:${item.scenario_id}`);
        const eligible = new Set(scenario.eligible_candidate_ids);
        assert.notEqual(item.option_a.candidate_id, item.option_b.candidate_id);
        assert.ok(eligible.has(item.option_a.candidate_id));
        assert.ok(eligible.has(item.option_b.candidate_id));
        for (const option of [item.option_a, item.option_b]) {
            const decision = decisionByKey.get(`${item.dataset_id}:${item.scenario_id}:${option.model_version}`);
            assert.equal(decision.native_choice_candidate_id, option.candidate_id);
            assert.equal(decision.fallback_used, false);
            assert.equal(decision.technical_error_code, null);
        }
    }
});

test("ordem, orientacao e compromisso sao deterministicos e balanceados por estrato", () => {
    const first = build();
    const second = build();
    assert.deepEqual(first, second);
    assert.equal(canonicalHash({ ...first.internalKey, canonical_sha256: undefined }), first.internalKey.canonical_sha256);
    assert.equal(first.publicPackage.answer_key_commitment_sha256, first.internalKey.canonical_sha256);
    const strata = new Map();
    for (const item of first.internalKey.cases) {
        const comparator = item.option_a.model_version === "appono-intelligence-v2" ? item.option_b.model_version : item.option_a.model_version;
        const key = `${item.dataset_id}:${comparator}`;
        if (!strata.has(key)) strata.set(key, { a: 0, b: 0 });
        strata.get(key)[item.option_a.model_version === "appono-intelligence-v2" ? "a" : "b"] += 1;
    }
    for (const value of strata.values()) assert.ok(Math.abs(value.a - value.b) <= 1);
    const sources = first.internalKey.cases.map((item) => `${item.dataset_id}:${item.scenario_id}`);
    const orderWith = (seed) => [...sources].sort((left, right) => stableDigest(seed, "case-order", left).localeCompare(stableDigest(seed, "case-order", right)));
    assert.notDeepEqual(orderWith(protocol.seed_derivation.derived_sha256), orderWith("f".repeat(64)));
});

test("contexto distingue historico compartilhado de trajetoria sem incluir futuro", () => {
    const artifacts = build();
    const publicById = new Map(artifacts.publicPackage.cases.map((item) => [item.blind_case_id, item]));
    assert.ok(artifacts.internalKey.cases.some((item) => item.comparison_mode === "TRAJECTORY_OUTCOME"));
    for (const keyCase of artifacts.internalKey.cases) {
        const visible = publicById.get(keyCase.blind_case_id);
        if (keyCase.comparison_mode === "SHARED_HISTORY") {
            assert.ok(Array.isArray(visible.context.recent_sequence));
            assert.equal("recent_sequence" in visible.option_a, false);
        } else {
            assert.ok(Array.isArray(visible.option_a.recent_sequence));
            assert.ok(Array.isArray(visible.option_b.recent_sequence));
        }
        assert.ok((visible.option_a.recent_sequence ?? visible.context.recent_sequence).length <= protocol.trajectory_policy.recent_sequence_limit);
    }
});

test("pacote publico usa lista permitida e rejeita origem, ids e campos desconhecidos", () => {
    const artifacts = build();
    assert.equal(validatePublicPackage(artifacts.publicPackage, protocol), artifacts.publicPackage);
    const serialized = JSON.stringify(artifacts.publicPackage);
    for (const forbidden of ["deterministico-v3", "appono-intelligence-v1", "appono-intelligence-v2", "scenario_id", "candidate_id", "regret_delta", "classification"]) {
        assert.equal(serialized.includes(forbidden), false);
    }
    const disclosed = clone(artifacts.publicPackage);
    disclosed.cases[0].option_a.model_version = "appono-intelligence-v2";
    assert.throws(() => validatePublicPackage(disclosed, protocol), /PUBLIC_UNKNOWN_FIELD|PUBLIC_FORBIDDEN_FIELD/);
    const typo = clone(artifacts.publicPackage);
    typo.cases[0].context.prefernece = "x";
    assert.throws(() => validatePublicPackage(typo, protocol), /PUBLIC_UNKNOWN_FIELD/);
});

test("template permanece vazio e validador rejeita resposta alterada, duplicada ou privada", () => {
    const artifacts = build();
    assert.equal(validateResponses(artifacts.responsesTemplate, artifacts.publicPackage, protocol).answered, 0);
    assert.ok(artifacts.responsesTemplate.responses.every((item) => item.choice === null));
    const duplicate = clone(artifacts.responsesTemplate);
    duplicate.responses[1].blind_case_id = duplicate.responses[0].blind_case_id;
    assert.throws(() => validateResponses(duplicate, artifacts.publicPackage, protocol), /RESPONSES_DUPLICATE_CASE/);
    const privateNote = clone(artifacts.responsesTemplate);
    privateNote.responses[0].optional_note = "contato pessoa@example.com";
    assert.throws(() => validateResponses(privateNote, artifacts.publicPackage, protocol), /RESPONSES_NOTE/);
    const unknown = clone(artifacts.responsesTemplate);
    unknown.responses[0].score = 10;
    assert.throws(() => validateResponses(unknown, artifacts.publicPackage, protocol), /RESPONSES_ITEM_UNKNOWN_FIELD/);
});

test("diretorio distribuivel contem somente arquivos permitidos e chave separada", () => {
    const allowed = new Set(["README.md", "manifest.json", "package.json", "responses-template.json", "review-form.csv"]);
    const names = fs.readdirSync(path.dirname(outputPaths.package));
    assert.deepEqual(new Set(names), allowed);
    assert.equal(names.some((name) => /key|internal/i.test(name)), false);
    const publicText = names.map((name) => fs.readFileSync(path.join(path.dirname(outputPaths.package), name), "utf8")).join("\n");
    assert.equal(publicText.includes("internal/blind-review-key"), false);
    assert.ok(fs.existsSync(outputPaths.key));
});

test("dominio e CLI nao importam modelos, banco, HTTP ou ambiente", () => {
    const source = [
        fs.readFileSync(path.join(root, "src/domain/routine-intelligence-blind-review.js"), "utf8"),
        fs.readFileSync(path.join(root, "scripts/generate-routine-intelligence-blind-review.js"), "utf8"),
    ].join("\n");
    assert.doesNotMatch(source, /require\([^)]*(routine-intelligence-v2|routine-intelligence\.js|routine-recommendation|supabase|express|https?|dotenv)/);
    assert.doesNotMatch(source, /process\.env|Math\.random|Date\.now/);
});

test("CLI help e check nao escrevem e tentativa de reserva falha", () => {
    const before = new Map([...createOutputs().files.keys()].map((target) => [target, fs.statSync(target).mtimeMs]));
    for (const argument of ["--help", "--check"]) {
        const result = spawnSync(process.execPath, ["scripts/generate-routine-intelligence-blind-review.js", argument], { cwd: root, encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
    }
    for (const [target, modified] of before) assert.equal(fs.statSync(target).mtimeMs, modified);
    const reserve = spawnSync(process.execPath, ["scripts/generate-routine-intelligence-blind-review.js", "--check", "--dataset=reserva"], { cwd: root, encoding: "utf8" });
    assert.notEqual(reserve.status, 0);
    assert.match(reserve.stderr, /PROSPECTIVE_RESERVE_IS_SEALED/);
});

test("artefatos congelados, formulas e rollout zero permanecem intactos", () => {
    const expected = {
        "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json": "2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c",
        "experiments/routine-intelligence/scenarios/validacao-v1.json": "92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6",
        "reports/routine-intelligence/prospective/desenvolvimento-v1.json": "b8033dc6d5b15e40e4ad2acc15897c65c451828953f1112b105a06f382718467",
        "reports/routine-intelligence/prospective/validacao-v1.json": "1abfe85103adc84baf76735380eeb6eb7443b99519608c49e7dedc133669ecee",
        "src/domain/routine-scoring.js": "0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18",
        "src/domain/routine-intelligence.js": "41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b",
        "src/domain/routine-intelligence-v2.js": "f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4",
    };
    for (const [relative, hash] of Object.entries(expected)) assert.equal(fileHash(relative), hash);
    assert.equal(readJson("experiments/routine-intelligence/guardrails-v1.json").frozen_thresholds.public_rollout_percent, 0);
});
