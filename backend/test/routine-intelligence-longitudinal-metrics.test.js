"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");
const {
    METRICS_VERSION,
    aggregate,
    compareDatasets,
    concentration,
    evaluateDataset,
    pairedComparison,
    percentile,
    repetition,
    serializeMetrics,
    statistics,
    validateRawReport,
} = require("../src/domain/routine-intelligence-longitudinal-metrics");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const personasArtifact = readJson("experiments/routine-intelligence/personas-v1.json");
const baselineManifest = readJson("experiments/routine-intelligence/manifest.json");

function input(dataset) {
    const name = dataset === "desenvolvimento_v1" ? "desenvolvimento-v1.json" : "validacao-v1.json";
    return {
        report: readJson(`reports/routine-intelligence/prospective/${name}`),
        snapshot: readJson(`experiments/routine-intelligence/scenarios/${name}`),
        personasArtifact,
        baselineManifest,
    };
}

const development = evaluateDataset(input("desenvolvimento_v1"));
const validation = evaluateDataset(input("validacao_v1"));

function rehashRaw(report) {
    report.content_sha256 = canonicalHash({ metadata: report.metadata, summary: report.summary, decisions: report.decisions });
    return report;
}

test("estatisticas usam interpolacao linear e denominadores explicitos", () => {
    assert.equal(percentile([1, 2, 3, 4], 0.5), 2.5);
    assert.deepEqual(statistics([1, 2, 3, 4]), {
        count: 4,
        mean: 2.5,
        median: 2.5,
        min: 1,
        max: 4,
        stddev_population: 1.118034,
        p10: 1.3,
        p25: 1.75,
        p75: 3.25,
        p90: 3.7,
    });
});

test("concentracao calcula diversidade, participacao maxima e HHI", () => {
    assert.deepEqual(concentration(["a", "a", "b", "c"]), {
        distinct: 3,
        max_frequency: 2,
        max_share: 0.5,
        hhi: 0.375,
        above_20_percent: 3,
    });
});

test("repeticao respeita a ordem longitudinal por persona", () => {
    const result = repetition([
        { persona_id: "p", scenario_index: 2, virtual_week: 1, restaurant_id: "b", product_id: "y", category: "Y" },
        { persona_id: "p", scenario_index: 0, virtual_week: 0, restaurant_id: "a", product_id: "x", category: "X" },
        { persona_id: "p", scenario_index: 1, virtual_week: 0, restaurant_id: "a", product_id: "x", category: "X" },
    ]);
    assert.equal(result.transitions, 2);
    assert.deepEqual(result.restaurant, { numerator: 1, denominator: 2, rate: 0.5 });
    assert.equal(result.longest_restaurant_run, 2);
});

test("relatorios brutos preservam cobertura, hashes comuns e modelos", () => {
    for (const dataset of ["desenvolvimento_v1", "validacao_v1"]) {
        const report = input(dataset).report;
        assert.equal(validateRawReport(report), report);
        const counts = Object.groupBy(report.decisions, (item) => item.model_version);
        assert.deepEqual(Object.values(counts).map((items) => items.length), [300, 300, 300]);
    }
});

test("agregacao cobre conjunto, modelo, persona e semana sem misturar datasets", () => {
    for (const report of [development, validation]) {
        assert.equal(report.metadata.metrics_version, METRICS_VERSION);
        assert.equal(report.quality.join_coverage.rate, 1);
        assert.equal(report.global_by_model.length, 3);
        assert.equal(report.by_persona.length, 30);
        assert.equal(report.by_week.length, 18);
        assert.ok(report.global_by_model.every((item) => item.metrics.native_decisions === 300));
        assert.ok(report.by_persona.every((item) => item.metrics.native_decisions === 30));
        assert.ok(report.by_week.every((item) => item.metrics.native_decisions === 50));
    }
    assert.notEqual(development.metadata.raw_content_sha256, validation.metadata.raw_content_sha256);
});

test("grupo sem historico mantem confianca V2 igual a zero", () => {
    for (const report of [development, validation]) {
        const group = report.by_persona.find((item) => item.persona_id === "controle_sem_historico" && item.model_version === "appono-intelligence-v2");
        assert.equal(group.metrics.confidence.mean, 0);
        assert.equal(group.metrics.effective_samples.mean, 0);
    }
});

test("faixas de confianca nao se sobrepoem e preservam a contagem", () => {
    const v2 = validation.global_by_model.find((item) => item.model_version === "appono-intelligence-v2").metrics;
    assert.equal(v2.confidence_bins.reduce((sum, bin) => sum + bin.records, 0), v2.confidence.count);
    assert.deepEqual(v2.confidence_bins.map((bin) => bin.id), ["zero", "low", "operational", "medium", "high"]);
    const boundary = aggregate([0, 0.25, 0.5, 0.75, 1].map((confidence, scenario_index) => ({
        technical_error_code: null,
        native_choice_candidate_id: `c${scenario_index}`,
        fallback_used: false,
        consent_expected: true,
        reaction_type: "APROVACAO",
        chosen_external_utility: 1,
        regret: 0,
        restaurant_id: `r${scenario_index}`,
        product_id: `p${scenario_index}`,
        category: "C",
        preference_opportunity: false,
        virtual_week: 0,
        persona_id: "p",
        scenario_index,
        confidence,
        effective_samples: 1,
        effective_volume: 1,
        consistency: 1,
    })));
    assert.deepEqual(boundary.confidence_bins.map((bin) => bin.records), [1, 0, 1, 1, 2]);
});

test("denominadores reativos excluem a persona sem consentimento", () => {
    for (const item of development.global_by_model) {
        assert.equal(item.metrics.reactions.denominator, 270);
        assert.equal(Object.values(item.metrics.reactions.counts).reduce((sum, value) => sum + value, 0), 270);
    }
});

test("comparacoes pareadas preservam 300 cenarios e empates", () => {
    const source = input("validacao_v1").report.decisions;
    const comparison = pairedComparison(source, "deterministico-v3", "appono-intelligence-v2");
    assert.equal(comparison.paired, 300);
    assert.equal(comparison.excluded, 0);
    assert.equal(comparison.agreements + comparison.divergences, 300);
    assert.equal(comparison.utility_wins.left + comparison.utility_wins.right + comparison.utility_wins.ties, 300);
});

test("criterios congelados registram falha sem flexibilizacao", () => {
    const criterion = validation.acceptance.criteria.find((item) => item.id === "v2_regret_not_worse_than_v1");
    assert.equal(criterion.status, "FAIL");
    assert.ok(criterion.observed > 0);
    assert.equal(validation.acceptance.source, "validation_primary");
    assert.equal(development.acceptance.source, "development_diagnostic");
});

test("serializacao e comparacao sao canonicas e reproduziveis", () => {
    assert.equal(serializeMetrics(development), serializeMetrics(evaluateDataset(input("desenvolvimento_v1"))));
    const first = compareDatasets(development, validation);
    const second = compareDatasets(development, validation);
    assert.equal(first.content_sha256, second.content_sha256);
    assert.equal(serializeMetrics(first), serializeMetrics(second));
});

test("campo desconhecido no agregado e rejeitado", () => {
    const changed = { ...development, unexpected: true };
    changed.content_sha256 = canonicalHash(Object.fromEntries(Object.entries(changed).filter(([key]) => key !== "content_sha256")));
    assert.throws(() => serializeMetrics(changed), /UNKNOWN_AGGREGATED_FIELD/);
});

test("agregado nao preenche confianca ausente com zero", () => {
    const metrics = aggregate([{
        technical_error_code: null,
        native_choice_candidate_id: "c",
        fallback_used: false,
        consent_expected: true,
        reaction_type: "APROVACAO",
        chosen_external_utility: 1,
        regret: 0,
        restaurant_id: "r",
        product_id: "p",
        category: "C",
        preference_opportunity: false,
        virtual_week: 0,
        persona_id: "p",
        scenario_index: 0,
        confidence: null,
        effective_samples: null,
        effective_volume: null,
        consistency: null,
    }]);
    assert.equal(metrics.confidence.count, 0);
    assert.equal(metrics.confidence.mean, null);
});

test("mutacoes de integridade falham antes da agregacao", () => {
    const original = input("desenvolvimento_v1").report;
    const duplicate = clone(original);
    duplicate.decisions[1] = clone(duplicate.decisions[0]);
    assert.throws(() => validateRawReport(rehashRaw(duplicate)), /DUPLICATED_DECISION/);

    const commonInput = clone(original);
    commonInput.decisions[1].common_input_sha256 = "0".repeat(64);
    assert.throws(() => validateRawReport(rehashRaw(commonInput)), /COMMON_INPUT_MISMATCH/);

    const negativeRegret = clone(original);
    negativeRegret.decisions[0].regret = -1;
    assert.throws(() => validateRawReport(rehashRaw(negativeRegret)), /REGRET/);

    const reserve = clone(original);
    reserve.metadata.dataset_id = "reserva_v1";
    assert.throws(() => validateRawReport(rehashRaw(reserve)), /DATASET/);
});

test("modulo de metricas permanece independente dos modelos e de IO", () => {
    const source = fs.readFileSync(path.join(root, "src/domain/routine-intelligence-longitudinal-metrics.js"), "utf8");
    assert.doesNotMatch(source, /require\(["']\.\/routine-(?:scoring|recommendation|intelligence(?:-v2)?)["']\)/);
    assert.doesNotMatch(source, /node:fs|node:http|supabase|process\.env/);
});

test("CLI oferece ajuda sem escrita e recusa reserva", () => {
    const script = path.join(root, "scripts/evaluate-routine-intelligence-longitudinal.js");
    const help = childProcess.spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /--check/);
    const reserve = childProcess.spawnSync(process.execPath, [script, "--dataset=reserva_v1", "--check"], { encoding: "utf8" });
    assert.notEqual(reserve.status, 0);
    assert.match(reserve.stderr, /PROSPECTIVE_RESERVE_IS_SEALED/);
});
