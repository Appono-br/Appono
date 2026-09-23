"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
    METRICS_VERSION,
    compareDatasets,
    evaluateDataset,
    serializeMetrics,
} = require("../src/domain/routine-intelligence-longitudinal-metrics");

const backendRoot = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(backendRoot, "..");
const datasets = Object.freeze({
    desenvolvimento_v1: {
        raw: "reports/routine-intelligence/prospective/desenvolvimento-v1.json",
        snapshot: "experiments/routine-intelligence/scenarios/desenvolvimento-v1.json",
        metrics: "reports/routine-intelligence/prospective/metrics-desenvolvimento-v1.json",
    },
    validacao_v1: {
        raw: "reports/routine-intelligence/prospective/validacao-v1.json",
        snapshot: "experiments/routine-intelligence/scenarios/validacao-v1.json",
        metrics: "reports/routine-intelligence/prospective/metrics-validacao-v1.json",
    },
});
const fixedPaths = Object.freeze({
    baseline: "experiments/routine-intelligence/manifest.json",
    personas: "experiments/routine-intelligence/personas-v1.json",
    rawManifest: "reports/routine-intelligence/prospective/manifest-v1.json",
    comparison: "reports/routine-intelligence/prospective/comparison-v1.json",
    markdown: "docs/appono-intelligence-v2-comparativo-2026-09-29.md",
});
const USAGE = [
    "Uso:",
    "  node scripts/evaluate-routine-intelligence-longitudinal.js --dataset=<desenvolvimento_v1|validacao_v1|all> --check",
    "  node scripts/evaluate-routine-intelligence-longitudinal.js --dataset=<desenvolvimento_v1|validacao_v1|all> --write",
    "",
    "--check recalcula sem escrever e compara artefatos existentes.",
    "--write grava somente destinos prospectivos fixos. Reservas nao sao aceitas.",
].join("\n");

function argument(name) {
    const prefix = `--${name}=`;
    return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function backendPath(relativePath) {
    return path.join(backendRoot, relativePath);
}

function repositoryPath(relativePath) {
    return path.join(repositoryRoot, relativePath);
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(backendPath(relativePath), "utf8"));
}

function fileHash(relativePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(backendPath(relativePath))).digest("hex");
}

function writeAtomic(target, content) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, target);
}

function persistCompatible(target, content, mode) {
    if (mode === "check") {
        if (!fs.existsSync(target)) throw new Error("LONGITUDINAL_METRICS_OUTPUT_MISSING");
        if (fs.readFileSync(target, "utf8") !== content) throw new Error("LONGITUDINAL_METRICS_OUTPUT_DIFFERS");
        return;
    }
    if (fs.existsSync(target) && fs.readFileSync(target, "utf8") !== content) {
        const existing = fs.readFileSync(target, "utf8");
        let compatible = false;
        if (target.endsWith(".json")) {
            const previous = JSON.parse(existing);
            const next = JSON.parse(content);
            compatible = (previous.metadata?.raw_content_sha256 && previous.metadata.raw_content_sha256 === next.metadata?.raw_content_sha256)
                || (previous.inputs && JSON.stringify(previous.inputs) === JSON.stringify(next.inputs));
        } else {
            compatible = existing.startsWith("# Comparativo longitudinal da Appono.AI - 29/09/2026")
                && content.startsWith("# Comparativo longitudinal da Appono.AI - 29/09/2026");
        }
        if (!compatible) throw new Error("LONGITUDINAL_METRICS_INCOMPATIBLE_OVERWRITE");
        writeAtomic(target, content);
        return;
    }
    if (!fs.existsSync(target)) writeAtomic(target, content);
}

function validateRawIntegrity(dataset, destination, manifest) {
    const expected = manifest.reports[dataset];
    if (!expected) throw new Error("LONGITUDINAL_RAW_MANIFEST_ENTRY_MISSING");
    if (fileHash(destination.raw) !== expected.file_sha256) throw new Error("LONGITUDINAL_RAW_FILE_HASH_MISMATCH");
    const raw = readJson(destination.raw);
    if (raw.content_sha256 !== expected.content_sha256) throw new Error("LONGITUDINAL_RAW_CONTENT_HASH_MISMATCH");
    return raw;
}

function globalMetrics(report, model) {
    return report.global_by_model.find((item) => item.model_version === model).metrics;
}

function markdownReport(development, validation, comparison) {
    const models = ["deterministico-v3", "appono-intelligence-v1", "appono-intelligence-v2"];
    const table = (report) => models.map((model) => {
        const metrics = globalMetrics(report, model);
        return `| ${model} | ${metrics.utility.mean} | ${metrics.regret.mean} | ${metrics.reactions.positive.rate} | ${metrics.diversity.restaurant.distinct} | ${metrics.diversity.restaurant.max_share} | ${metrics.confidence.mean ?? "N/A"} |`;
    }).join("\n");
    const acceptance = validation.acceptance.criteria.map((criterion) => `| ${criterion.id} | ${criterion.status} | ${JSON.stringify(criterion.observed)} |`).join("\n");
    const regressions = [...validation.acceptance.persona_regressions]
        .sort((a, b) => b.v2_minus_control - a.v2_minus_control)
        .map((item) => `| ${item.persona_id} | ${item.v2_minus_control} | ${item.v2_minus_v1} |`).join("\n");
    const personaRows = validation.by_persona.map((item) => `| ${item.persona_id} | ${item.model_version} | ${item.metrics.utility.mean} | ${item.metrics.regret.mean} | ${item.metrics.reactions.positive.rate} | ${item.metrics.diversity.category.distinct} | ${item.metrics.explicit_preference.rate ?? "N/A"} | ${item.metrics.confidence.mean ?? "N/A"} |`).join("\n");
    const weekRows = validation.by_week.map((item) => `| ${item.virtual_week} | ${item.model_version} | ${item.metrics.utility.mean} | ${item.metrics.regret.mean} | ${item.metrics.reactions.positive.rate} | ${item.metrics.diversity.category.distinct} | ${item.metrics.confidence.mean ?? "N/A"} |`).join("\n");
    const pairRows = validation.pairwise.map((item) => `| ${item.left_model} | ${item.right_model} | ${item.agreements} | ${item.divergences} | ${item.utility_wins.left} | ${item.utility_wins.right} | ${item.utility_wins.ties} | ${item.excluded} | ${item.utility_delta_left_minus_right.mean} |`).join("\n");
    const validationV2 = globalMetrics(validation, "appono-intelligence-v2");
    const developmentV2 = globalMetrics(development, "appono-intelligence-v2");
    return `# Comparativo longitudinal da Appono.AI - 29/09/2026

## 1. Escopo e pergunta

Este relatorio compara controle, V1 e V2 pela utilidade externa das personas ao longo de seis semanas. Os resultados sao offline e sinteticos: nao representam validacao por clientes, piloto ou evidencia comercial.

## 2. Fontes e hashes

- Bruto de desenvolvimento: \`${development.metadata.raw_content_sha256}\`.
- Bruto de validacao: \`${validation.metadata.raw_content_sha256}\`.
- Snapshot de desenvolvimento: \`${development.metadata.snapshot_scenarios_sha256}\`.
- Snapshot de validacao: \`${validation.metadata.snapshot_scenarios_sha256}\`.
- Personas: \`${development.metadata.personas_sha256}\`.

## 3. Definicoes

- Utilidade: regua externa \`persona-utility-v1\`, independente do modelo.
- Arrependimento: melhor utilidade elegivel menos utilidade da escolha nativa.
- Reacao positiva: \`CONVERSAO_SIMULADA\` ou \`APROVACAO\`, somente no denominador consentido.
- Concentracao: maior participacao e HHI das escolhas por restaurante, produto e categoria.
- Fallback: excluido de escolha nativa e de credito de qualidade.

## 4. Qualidade dos dados

Ambos os conjuntos possuem 900 registros, 300 por modelo, 100% de juncao com os snapshots, zero duplicata, zero escolha inelegivel, zero falha, zero fallback e zero arrependimento negativo. Os hashes comuns e os conjuntos de candidatos coincidem entre modelos em cada cenario.

## 5. Desenvolvimento

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Restaurantes distintos | Concentracao maxima | Confianca media |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${table(development)}

## 6. Validacao

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Restaurantes distintos | Concentracao maxima | Confianca media |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${table(validation)}

## 7. Tabela global por modelo

As tabelas de desenvolvimento e validacao acima usam denominadores separados. Validacao e a fonte primaria de aceitacao.

## 8. Validacao por persona

| Persona | Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Categorias distintas | Cobertura explicita | Confianca media |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
${personaRows}

## 9. Validacao por semana

| Semana | Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Categorias distintas | Confianca media |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
${weekRows}

## 10. Comparacoes pareadas de validacao

| Esquerda | Direita | Concordancias | Divergencias | Vitorias esquerda | Vitorias direita | Empates | Excluidos | Delta utilidade |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${pairRows}

As comparacoes usam o mesmo cenario e a mesma regua externa, mas nao constituem experimento online randomizado porque as trajetorias podem divergir.

## 11. Diversidade, repeticao e concentracao

Na validacao, a V2 escolheu ${validationV2.diversity.restaurant.distinct} restaurantes, ${validationV2.diversity.product.distinct} produtos e ${validationV2.diversity.category.distinct} categorias. A participacao maxima global de restaurante foi ${validationV2.diversity.restaurant.max_share}; a repeticao consecutiva de restaurante foi ${validationV2.repetition.restaurant.rate}.

## 12. Preferencias explicitas

A cobertura condicionada da V2 foi ${validationV2.explicit_preference.rate} na validacao e ${developmentV2.explicit_preference.rate} no desenvolvimento. O denominador inclui somente cenarios com ao menos uma opcao elegivel da categoria explicitamente preferida.

## 13. Confianca e evidencia

A confianca media da V2 foi ${validationV2.confidence.mean}, com ${validationV2.confidence_above_025.numerator}/${validationV2.confidence_above_025.denominator} decisoes em confianca igual ou superior a 0,25. Essas faixas sao diagnosticas e nao demonstram calibracao real.

## 14. Criterios congelados

| Criterio | Estado | Observado |
| --- | --- | --- |
${acceptance}

## 15. Regressao maxima

Valores positivos significam maior arrependimento da V2.

| Persona | V2 menos controle | V2 menos V1 |
| --- | ---: | ---: |
${regressions}

A pior regressao da V2 contra o controle ocorreu em \`${validation.acceptance.worst_persona_regression.persona_id}\`, com delta de arrependimento ${validation.acceptance.worst_persona_regression.v2_minus_control}. O criterio global contra V1 falhou: a V2 teve arrependimento medio ${globalMetrics(validation, "appono-intelligence-v2").regret.mean}, contra ${globalMetrics(validation, "appono-intelligence-v1").regret.mean} da V1.

## 16. Desacordos a investigar

- V1 versus V2: ${validation.pairwise[2].divergences} escolhas divergentes na validacao.
- Controle versus V2: ${validation.pairwise[1].divergences} escolhas divergentes na validacao.
- Persona prioritaria: \`${validation.acceptance.worst_persona_regression.persona_id}\`.
- Os casos devem virar testes de guardrail em 30/09; nao justificam recalibracao oportunistica.

## 17. Limitacoes

- Personas, reacoes e conversoes sao sinteticas.
- Confianca interna nao equivale a probabilidade calibrada de satisfacao.
- Restaurantes e produtos das fixtures sao instancias sinteticas com alta cardinalidade.
- A reserva prospectiva permanece selada e nao participou desta analise.

## 18. Conclusao tecnica

As metricas comparativas sao integras e reproduziveis. Na validacao, a V2 supera o controle em utilidade e arrependimento, mas nao supera a V1; portanto, o criterio \`v2_regret_not_worse_than_v1\` esta reprovado. Este marco nao aprova V2.1, promocao ou homologacao.

## 19. Entrada para 30/09

Transformar as regressoes por persona, perdas de preferencia, baixa evidencia, contradicao e repeticao em testes de guardrail, mantendo formulas e criterios congelados.

## Rastreabilidade

- Metricas: \`${METRICS_VERSION}\`.
- Desenvolvimento: \`${development.content_sha256}\`.
- Validacao: \`${validation.content_sha256}\`.
- Comparacao: \`${comparison.content_sha256}\`.
- Reserva prospectiva: nao acessada, estado preservado como \`SEALED_UNMATERIALIZED\`.
- Rollout publico: 0%.

## Leitura correta

O conjunto de validacao e a referencia primaria para os criterios congelados. Desenvolvimento serve para diagnostico. Confianca e apresentada como diagnostico interno, nao como probabilidade calibrada de satisfacao. Trajetorias podem divergir depois da primeira escolha, portanto os resultados medem politicas longitudinais completas.
`;
}

function evaluateAll() {
    const rawManifest = readJson(fixedPaths.rawManifest);
    const personasArtifact = readJson(fixedPaths.personas);
    const baselineManifest = readJson(fixedPaths.baseline);
    const output = {};
    for (const [dataset, destination] of Object.entries(datasets)) {
        output[dataset] = evaluateDataset({
            report: validateRawIntegrity(dataset, destination, rawManifest),
            snapshot: readJson(destination.snapshot),
            personasArtifact,
            baselineManifest,
        });
    }
    return output;
}

function run() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    const dataset = argument("dataset");
    if (!dataset) throw new Error("LONGITUDINAL_METRICS_DATASET_REQUIRED");
    if (/reserva|reserve/i.test(dataset)) throw new Error("PROSPECTIVE_RESERVE_IS_SEALED");
    if (dataset !== "all" && !datasets[dataset]) throw new Error("LONGITUDINAL_METRICS_DATASET_NOT_ALLOWED");
    const check = process.argv.includes("--check");
    const write = process.argv.includes("--write");
    if (check === write) throw new Error("LONGITUDINAL_METRICS_MODE_REQUIRES_EXACTLY_ONE_OF_CHECK_OR_WRITE");
    const mode = check ? "check" : "write";
    const reports = evaluateAll();
    const selected = dataset === "all" ? Object.keys(datasets) : [dataset];

    for (const id of selected) {
        persistCompatible(backendPath(datasets[id].metrics), serializeMetrics(reports[id]), mode);
    }

    const comparison = compareDatasets(reports.desenvolvimento_v1, reports.validacao_v1);
    if (dataset === "all") {
        persistCompatible(backendPath(fixedPaths.comparison), serializeMetrics(comparison), mode);
        persistCompatible(repositoryPath(fixedPaths.markdown), markdownReport(reports.desenvolvimento_v1, reports.validacao_v1, comparison), mode);
    }

    process.stdout.write(`${JSON.stringify({
        dataset,
        metrics_version: METRICS_VERSION,
        hashes: Object.fromEntries(selected.map((id) => [id, reports[id].content_sha256])),
        comparison_sha256: dataset === "all" ? comparison.content_sha256 : null,
        quality_passed: selected.every((id) => reports[id].quality.passed),
        checked: check,
        written: write,
        reserve_accessed: false,
        final_winner_declared: false,
    }, null, 2)}\n`);
}

if (require.main === module) run();

module.exports = { USAGE, datasets, evaluateAll, markdownReport, run, validateRawIntegrity };
