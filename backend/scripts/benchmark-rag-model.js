"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const { getFeaturePipeline, flattenEmbedding } = require("../src/rag/transformers-runtime");

function argumento(nome) {
    const indice = process.argv.indexOf(nome);
    return indice >= 0 ? process.argv[indice + 1] : null;
}

function help() {
    console.log("Uso: npm run benchmark:rag --workspace backend -- --model <id> --revision <revision> [--output <arquivo.json>]");
    console.log("O benchmark baixa/carrega o modelo explicitamente e não altera o banco ou o rollout.");
}

async function main() {
    if (process.argv.includes("--help")) return help();
    const modelId = argumento("--model") ?? process.env.APPONO_RAG_MODEL_ID;
    const revision = argumento("--revision") ?? process.env.APPONO_RAG_MODEL_REVISION;
    if (!modelId || !revision) throw new Error("Informe --model e --revision fixados.");
    const samples = [
        "Como cancelar um pedido antes do preparo?",
        "Qual é o procedimento operacional para confirmar uma reserva?",
        "O pagamento aprovado pode ser estornado em quais situações?",
    ];
    const inicio = performance.now();
    const pipeline = await getFeaturePipeline({ modelId, revision, cacheDir: process.env.APPONO_RAG_MODEL_CACHE_DIR || null });
    const carregamentoMs = performance.now() - inicio;
    const medidas = [];
    let dimensions = null;
    for (const sample of samples) {
        const sampleStart = performance.now();
        const embedding = flattenEmbedding(await pipeline(sample, { pooling: "mean", normalize: true }));
        dimensions ??= embedding.length;
        if (embedding.length !== dimensions || embedding.some((value) => !Number.isFinite(value))) throw new Error("Saída de embedding inválida.");
        medidas.push({ caracteres: sample.length, dimensao: embedding.length, latenciaMs: Number((performance.now() - sampleStart).toFixed(2)) });
    }
    const resultado = {
        criadoEm: new Date().toISOString(),
        modelId,
        revision,
        dimensions,
        carregamentoMs: Number(carregamentoMs.toFixed(2)),
        amostras: medidas,
        mediaInferenciaMs: Number((medidas.reduce((sum, item) => sum + item.latenciaMs, 0) / medidas.length).toFixed(2)),
        node: process.version,
    };
    const output = argumento("--output");
    if (output) await fs.writeFile(path.resolve(output), `${JSON.stringify(resultado, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(resultado, null, 2));
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
