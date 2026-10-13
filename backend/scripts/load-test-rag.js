"use strict";

const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const BASE_URL = process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ?? "http://localhost:3001";
const TOKEN = process.argv.find((a) => a.startsWith("--token="))?.split("=")[1] ?? "";

const SCENARIOS = [
    { name: "leve", concurrencies: [1, 5, 10, 20], docs: 10, chunks: 100 },
    { name: "medio", concurrencies: [1, 5, 10, 20], docs: 100, chunks: 1000 },
    { name: "pesado", concurrencies: [1, 5, 10], docs: 1000, chunks: 10000 },
];

const MODES = ["SOMENTE_FONTES", "RESPOSTA", "SHADOW"];

const QUESTIONS = [
    "Qual a politica de cancelamento?",
    "Como funciona o reembolso?",
    "Quais sao as regras de reserva?",
    "Como o restaurante recebe repasses?",
    "Como funciona a entrega?",
];

function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

async function runQuery(mode) {
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const start = performance.now();
    try {
        const response = await fetch(`${BASE_URL}/api/rag/consultar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
            body: JSON.stringify({ pergunta: question, modo: mode }),
            signal: AbortSignal.timeout(30000),
        });
        const elapsed = performance.now() - start;
        return { ok: response.ok, status: response.status, latencyMs: elapsed, error: null, timeout: false };
    } catch (error) {
        const elapsed = performance.now() - start;
        return { ok: false, status: 0, latencyMs: elapsed, error: error.message, timeout: error.name === "TimeoutError" || error.name === "AbortError" };
    }
}

async function runConcurrent(concurrency, mode, iterations = 10) {
    const results = [];
    for (let round = 0; round < iterations; round++) {
        const batch = await Promise.all(Array.from({ length: concurrency }, () => runQuery(mode)));
        results.push(...batch);
    }

    const latencies = results.filter((r) => r.ok).map((r) => r.latencyMs).sort((a, b) => a - b);
    const errors = results.filter((r) => !r.ok).length;
    const timeouts = results.filter((r) => r.timeout).length;
    const mem = process.memoryUsage();

    return {
        concurrency,
        mode,
        totalRequests: results.length,
        successCount: latencies.length,
        errorCount: errors,
        timeoutCount: timeouts,
        p50Ms: Math.round(percentile(latencies, 50) * 100) / 100,
        p95Ms: Math.round(percentile(latencies, 95) * 100) / 100,
        p99Ms: Math.round(percentile(latencies, 99) * 100) / 100,
        heapUsedMb: Math.round(mem.heapUsed / 1048576 * 100) / 100,
        rssMb: Math.round(mem.rss / 1048576 * 100) / 100,
    };
}

async function main() {
    if (!TOKEN) {
        console.error("Uso: node load-test-rag.js --base-url=http://localhost:3001 --token=<admin-jwt>");
        console.error("Token obrigatorio para autenticacao.");
        process.exit(1);
    }

    console.log(`Teste de carga RAG — ${BASE_URL}`);
    console.log(`Inicio: ${new Date().toISOString()}\n`);

    const report = { timestamp: new Date().toISOString(), baseUrl: BASE_URL, scenarios: [] };

    for (const scenario of SCENARIOS) {
        console.log(`\n=== Cenario: ${scenario.name} (${scenario.docs} docs / ${scenario.chunks} chunks) ===`);
        const scenarioResult = { name: scenario.name, docs: scenario.docs, chunks: scenario.chunks, results: [] };

        for (const mode of MODES) {
            for (const concurrency of scenario.concurrencies) {
                console.log(`  ${mode} x${concurrency} ...`);
                const result = await runConcurrent(concurrency, mode, 5);
                console.log(`    p50=${result.p50Ms}ms  p95=${result.p95Ms}ms  p99=${result.p99Ms}ms  erros=${result.errorCount}  timeouts=${result.timeoutCount}  heap=${result.heapUsedMb}MB`);
                scenarioResult.results.push(result);
            }
        }
        report.scenarios.push(scenarioResult);
    }

    report.finishedAt = new Date().toISOString();
    const outputPath = join(__dirname, "..", "reports", "rag-load-test.json");
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nRelatorio salvo em: ${outputPath}`);

    const hasFailures = report.scenarios.some((s) => s.results.some((r) => r.p95Ms > 1500 && r.mode === "SOMENTE_FONTES"));
    if (hasFailures) {
        console.log("\nAVISO: p95 de recuperacao excedeu 1500ms em algum cenario.");
    }
}

main().catch((error) => { console.error("Erro fatal:", error.message); process.exit(1); });
