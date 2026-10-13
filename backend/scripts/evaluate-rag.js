"use strict";

const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const BASE_URL = process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ?? "http://localhost:3001";
const TOKEN = process.argv.find((a) => a.startsWith("--token="))?.split("=")[1] ?? "";
const DATASET_PATH = process.argv.find((a) => a.startsWith("--dataset="))?.split("=")[1] ?? join(__dirname, "..", "evaluation", "rag-dataset.jsonl");

const THRESHOLDS = {
    crossTenantLeaks: 0,
    authFailures: 0,
    validCitations: 0.98,
    correctAbstinence: 0.95,
    groundedness: 0.95,
    recall5: 0.85,
    retrievalP95ms: 1500,
    generationP95ms: 12000,
};

function loadDataset(path) {
    return readFileSync(path, "utf-8").split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line));
}

function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

function checkClaims(text, claims) {
    if (!text || !claims?.length) return { found: 0, total: claims?.length ?? 0 };
    const lower = text.toLowerCase();
    let found = 0;
    for (const claim of claims) {
        if (lower.includes(claim.toLowerCase())) found++;
    }
    return { found, total: claims.length };
}

function checkForbidden(text, forbidden) {
    if (!text || !forbidden?.length) return [];
    const lower = text.toLowerCase();
    return forbidden.filter((claim) => lower.includes(claim.toLowerCase()));
}

function recallAtK(returnedChunkIds, goldChunkIds, k) {
    if (!goldChunkIds?.length) return null;
    const topK = returnedChunkIds.slice(0, k);
    const hits = goldChunkIds.filter((id) => topK.includes(id)).length;
    return hits / goldChunkIds.length;
}

async function queryRag(entry) {
    const mode = entry.expectedMode === "answer" ? "RESPOSTA" : "SOMENTE_FONTES";
    const start = performance.now();
    try {
        const response = await fetch(`${BASE_URL}/api/rag/consultar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
            body: JSON.stringify({ pergunta: entry.question, modo: mode }),
            signal: AbortSignal.timeout(30000),
        });
        const elapsed = performance.now() - start;
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            return { ok: false, status: response.status, latencyMs: elapsed, error: errorBody, data: null };
        }
        const data = await response.json();
        return { ok: true, status: response.status, latencyMs: elapsed, error: null, data };
    } catch (error) {
        return { ok: false, status: 0, latencyMs: performance.now() - start, error: error.message, data: null };
    }
}

async function evaluate() {
    if (!TOKEN) {
        console.error("Uso: node evaluate-rag.js --base-url=http://localhost:3001 --token=<admin-jwt> [--dataset=<path>]");
        process.exit(1);
    }

    const dataset = loadDataset(DATASET_PATH);
    console.log(`Dataset carregado: ${dataset.length} entradas`);
    console.log(`Base URL: ${BASE_URL}\n`);

    const results = [];
    let crossTenantLeaks = 0;
    let authFailures = 0;
    let correctAbstinence = 0;
    let totalAbstinenceExpected = 0;
    let groundednessSum = 0;
    let groundednessCount = 0;
    let forbiddenViolations = 0;
    let recall5Sum = 0;
    let recall5Count = 0;
    let recall10Sum = 0;
    let recall10Count = 0;
    let citationValidCount = 0;
    let citationTotalCount = 0;
    const retrievalLatencies = [];
    const generationLatencies = [];

    for (const entry of dataset) {
        process.stdout.write(`  ${entry.id}...`);
        const result = await queryRag(entry);
        const entryResult = { id: entry.id, question: entry.question, expectedMode: entry.expectedMode, ...result };

        if (!result.ok) {
            if (entry.expectedMode === "abstain" || entry.expectedMode === "structured-data") {
                correctAbstinence++;
                totalAbstinenceExpected++;
            } else {
                authFailures++;
            }
            results.push(entryResult);
            console.log(` ERRO (${result.status})`);
            continue;
        }

        const data = result.data;
        retrievalLatencies.push(result.latencyMs);
        if (data.mode === "RESPOSTA") generationLatencies.push(result.latencyMs);

        if (entry.expectedMode === "abstain" || entry.expectedMode === "structured-data") {
            totalAbstinenceExpected++;
            if (data.abstained || data.status === "abstida") {
                correctAbstinence++;
            }
        }

        const returnedChunkIds = (data.sources ?? []).map((s) => s.chunkId).filter(Boolean);
        if (entry.goldChunkIds?.length) {
            const r5 = recallAtK(returnedChunkIds, entry.goldChunkIds, 5);
            const r10 = recallAtK(returnedChunkIds, entry.goldChunkIds, 10);
            if (r5 !== null) { recall5Sum += r5; recall5Count++; }
            if (r10 !== null) { recall10Sum += r10; recall10Count++; }
        }

        if (data.sources?.length) {
            citationTotalCount += data.sources.length;
            citationValidCount += data.sources.filter((s) => s.documentId && s.chunkId).length;
        }

        const responseText = data.answer ?? data.context ?? "";
        if (entry.expectedClaims?.length && entry.expectedMode === "answer") {
            const claims = checkClaims(responseText, entry.expectedClaims);
            if (claims.total > 0) {
                groundednessSum += claims.found / claims.total;
                groundednessCount++;
            }
        }

        const forbidden = checkForbidden(responseText, entry.forbiddenClaims);
        if (forbidden.length) forbiddenViolations++;

        if (entry.adversarial && entry.tenantType !== data.tenantType) {
            crossTenantLeaks++;
        }

        entryResult.forbiddenFound = forbidden;
        results.push(entryResult);
        console.log(` ${data.status ?? "ok"}`);
    }

    retrievalLatencies.sort((a, b) => a - b);
    generationLatencies.sort((a, b) => a - b);

    const metrics = {
        total: dataset.length,
        crossTenantLeaks,
        authFailures,
        correctAbstinenceRate: totalAbstinenceExpected > 0 ? Math.round((correctAbstinence / totalAbstinenceExpected) * 10000) / 10000 : null,
        groundednessRate: groundednessCount > 0 ? Math.round((groundednessSum / groundednessCount) * 10000) / 10000 : null,
        forbiddenViolations,
        recall5: recall5Count > 0 ? Math.round((recall5Sum / recall5Count) * 10000) / 10000 : null,
        recall10: recall10Count > 0 ? Math.round((recall10Sum / recall10Count) * 10000) / 10000 : null,
        validCitationsRate: citationTotalCount > 0 ? Math.round((citationValidCount / citationTotalCount) * 10000) / 10000 : null,
        retrievalP50ms: Math.round(percentile(retrievalLatencies, 50) * 100) / 100,
        retrievalP95ms: Math.round(percentile(retrievalLatencies, 95) * 100) / 100,
        retrievalP99ms: Math.round(percentile(retrievalLatencies, 99) * 100) / 100,
        generationP50ms: Math.round(percentile(generationLatencies, 50) * 100) / 100,
        generationP95ms: Math.round(percentile(generationLatencies, 95) * 100) / 100,
        generationP99ms: Math.round(percentile(generationLatencies, 99) * 100) / 100,
    };

    const verdicts = {
        crossTenantLeaks: metrics.crossTenantLeaks <= THRESHOLDS.crossTenantLeaks ? "PASS" : "FAIL",
        authFailures: metrics.authFailures <= THRESHOLDS.authFailures ? "PASS" : "FAIL",
        validCitations: metrics.validCitationsRate === null ? "SKIP" : metrics.validCitationsRate >= THRESHOLDS.validCitations ? "PASS" : "FAIL",
        correctAbstinence: metrics.correctAbstinenceRate === null ? "SKIP" : metrics.correctAbstinenceRate >= THRESHOLDS.correctAbstinence ? "PASS" : "FAIL",
        groundedness: metrics.groundednessRate === null ? "SKIP" : metrics.groundednessRate >= THRESHOLDS.groundedness ? "PASS" : "FAIL",
        recall5: metrics.recall5 === null ? "SKIP" : metrics.recall5 >= THRESHOLDS.recall5 ? "PASS" : "FAIL",
        retrievalP95: metrics.retrievalP95ms <= THRESHOLDS.retrievalP95ms ? "PASS" : "FAIL",
        generationP95: metrics.generationP95ms <= THRESHOLDS.generationP95ms || !generationLatencies.length ? "PASS" : "FAIL",
    };

    const report = { timestamp: new Date().toISOString(), baseUrl: BASE_URL, datasetPath: DATASET_PATH, datasetSize: dataset.length, thresholds: THRESHOLDS, metrics, verdicts, results };

    const outputPath = join(__dirname, "..", "reports", "rag-quality-evaluation.json");
    writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log("\n=== Resultado da avaliacao ===\n");
    console.log(`  Cross-tenant leaks:   ${metrics.crossTenantLeaks} — ${verdicts.crossTenantLeaks}`);
    console.log(`  Auth failures:        ${metrics.authFailures} — ${verdicts.authFailures}`);
    console.log(`  Citacoes validas:     ${metrics.validCitationsRate ?? "N/A"} — ${verdicts.validCitations}`);
    console.log(`  Abstinencia correta:  ${metrics.correctAbstinenceRate ?? "N/A"} — ${verdicts.correctAbstinence}`);
    console.log(`  Groundedness:         ${metrics.groundednessRate ?? "N/A"} — ${verdicts.groundedness}`);
    console.log(`  Recall@5:             ${metrics.recall5 ?? "N/A"} — ${verdicts.recall5}`);
    console.log(`  Retrieval p95:        ${metrics.retrievalP95ms}ms — ${verdicts.retrievalP95}`);
    console.log(`  Generation p95:       ${metrics.generationP95ms}ms — ${verdicts.generationP95}`);
    console.log(`  Forbidden violations: ${metrics.forbiddenViolations}`);
    console.log(`\nRelatorio salvo em: ${outputPath}`);

    const failed = Object.values(verdicts).some((v) => v === "FAIL");
    if (failed) {
        console.log("\nAVISO: Um ou mais thresholds nao foram atingidos.");
        process.exit(1);
    }
    console.log("\nTodos os thresholds atingidos.");
}

evaluate().catch((error) => { console.error("Erro fatal:", error.message); process.exit(1); });
