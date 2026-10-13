"use strict";

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { supabaseAdmin } = require("../src/lib/supabase");

async function getAdminToken() {
    const email = process.env.APPONO_ADMIN_EMAILS?.split(",")[0]?.trim();
    if (!email) throw new Error("APPONO_ADMIN_EMAILS nao configurado.");
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (error) throw new Error(`Erro ao gerar link: ${error.message}`);

    const url = new URL(data.properties.action_link);
    const params = new URLSearchParams(url.hash.substring(1));
    const tokenHash = params.get("token") || data.properties.hashed_token;
    const verifyUrl = `${process.env.SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=magiclink`;

    const response = await fetch(verifyUrl, {
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY },
        redirect: "manual",
    });

    if (response.status === 303 || response.status === 302) {
        const location = response.headers.get("location");
        const fragment = new URL(location).hash.substring(1);
        const fragmentParams = new URLSearchParams(fragment);
        const accessToken = fragmentParams.get("access_token");
        if (accessToken) return accessToken;
    }

    const body = await response.json().catch(() => null);
    if (body?.access_token) return body.access_token;
    throw new Error("Nao foi possivel obter o token.");
}

async function testQuery(token, baseUrl) {
    console.log("\n=== Teste rapido de consulta RAG ===\n");
    const response = await fetch(`${baseUrl}/api/rag/consultar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pergunta: "Qual a politica de cancelamento de pedidos?", modo: "SOMENTE_FONTES" }),
        signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    console.log(`  Status HTTP: ${response.status}`);
    console.log(`  Modo: ${data.mode}`);
    console.log(`  Status resposta: ${data.status}`);
    console.log(`  Absteve: ${data.abstained}`);
    console.log(`  Fontes: ${data.sources?.length ?? 0}`);
    if (data.sources?.length) {
        console.log(`  Primeira fonte: "${data.sources[0].titulo}" (trecho: ${data.sources[0].trecho?.substring(0, 80)}...)`);
    }
    console.log(`  Contexto: ${data.context?.substring(0, 120)}...`);
    return data;
}

async function testGeneration(token, baseUrl) {
    console.log("\n=== Teste de geracao com Ollama ===\n");
    const response = await fetch(`${baseUrl}/api/rag/consultar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pergunta: "Como funciona o reembolso via PIX?", modo: "RESPOSTA" }),
        signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    console.log(`  Status HTTP: ${response.status}`);
    console.log(`  Modo: ${data.mode}`);
    console.log(`  Status resposta: ${data.status}`);
    console.log(`  Absteve: ${data.abstained}`);
    if (data.answer) {
        console.log(`  Resposta: ${data.answer.substring(0, 300)}`);
    }
    console.log(`  Fontes: ${data.sources?.length ?? 0}`);
    if (data.error) console.log(`  Erro: ${data.error}`);
    if (data.code) console.log(`  Codigo: ${data.code}`);
    return data;
}

async function runEvaluation(token, baseUrl) {
    console.log("\n=== Avaliacao de qualidade ===\n");
    const { readFileSync, writeFileSync } = require("node:fs");
    const datasetPath = path.join(__dirname, "..", "evaluation", "rag-dataset.jsonl");
    const dataset = readFileSync(datasetPath, "utf-8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
    console.log(`Dataset: ${dataset.length} entradas`);

    let crossTenantLeaks = 0;
    let correctAbstinence = 0;
    let totalAbstinenceExpected = 0;
    let groundednessSum = 0;
    let groundednessCount = 0;
    let forbiddenViolations = 0;
    let citationValid = 0;
    let citationTotal = 0;
    const latencies = [];
    let errors = 0;
    let processed = 0;

    for (const entry of dataset) {
        processed++;
        if (processed % 10 === 0) process.stdout.write(`  ${processed}/${dataset.length}...`);
        const mode = entry.expectedMode === "answer" ? "RESPOSTA" : "SOMENTE_FONTES";
        const start = performance.now();
        try {
            const r = await fetch(`${baseUrl}/api/rag/consultar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ pergunta: entry.question, modo: mode }),
                signal: AbortSignal.timeout(60000),
            });
            const elapsed = performance.now() - start;
            latencies.push(elapsed);

            if (!r.ok) {
                if (entry.expectedMode === "abstain" || entry.expectedMode === "structured-data") {
                    correctAbstinence++;
                    totalAbstinenceExpected++;
                } else {
                    errors++;
                }
                continue;
            }

            const data = await r.json();

            if (entry.expectedMode === "abstain" || entry.expectedMode === "structured-data") {
                totalAbstinenceExpected++;
                if (data.abstained || data.status === "abstida") correctAbstinence++;
            }

            if (data.sources?.length) {
                citationTotal += data.sources.length;
                citationValid += data.sources.filter((s) => s.documentId && s.chunkId).length;
            }

            const text = (data.answer ?? data.context ?? "").toLowerCase();
            if (entry.expectedClaims?.length && entry.expectedMode === "answer") {
                const found = entry.expectedClaims.filter((c) => text.includes(c.toLowerCase())).length;
                groundednessSum += found / entry.expectedClaims.length;
                groundednessCount++;
            }
            if (entry.forbiddenClaims?.length) {
                const found = entry.forbiddenClaims.filter((c) => text.includes(c.toLowerCase()));
                if (found.length) forbiddenViolations++;
            }
        } catch (e) {
            errors++;
            latencies.push(performance.now() - start);
        }
    }

    latencies.sort((a, b) => a - b);
    const p = (arr, pct) => arr.length ? arr[Math.min(Math.ceil(pct / 100 * arr.length) - 1, arr.length - 1)] : 0;

    const metrics = {
        total: dataset.length,
        errors,
        crossTenantLeaks,
        correctAbstinenceRate: totalAbstinenceExpected > 0 ? (correctAbstinence / totalAbstinenceExpected).toFixed(4) : "N/A",
        groundedness: groundednessCount > 0 ? (groundednessSum / groundednessCount).toFixed(4) : "N/A",
        forbiddenViolations,
        validCitations: citationTotal > 0 ? (citationValid / citationTotal).toFixed(4) : "N/A",
        retrievalP50ms: Math.round(p(latencies, 50)),
        retrievalP95ms: Math.round(p(latencies, 95)),
        retrievalP99ms: Math.round(p(latencies, 99)),
    };

    console.log("\n");
    console.log("  Resultados:");
    console.log(`    Cross-tenant leaks:  ${metrics.crossTenantLeaks}`);
    console.log(`    Abstinencia correta: ${metrics.correctAbstinenceRate}`);
    console.log(`    Groundedness:        ${metrics.groundedness}`);
    console.log(`    Forbidden violacoes: ${metrics.forbiddenViolations}`);
    console.log(`    Citacoes validas:    ${metrics.validCitations}`);
    console.log(`    Erros:               ${metrics.errors}`);
    console.log(`    Latencia p50:        ${metrics.retrievalP50ms}ms`);
    console.log(`    Latencia p95:        ${metrics.retrievalP95ms}ms`);
    console.log(`    Latencia p99:        ${metrics.retrievalP99ms}ms`);

    const report = { timestamp: new Date().toISOString(), ...metrics };
    const outputPath = path.join(__dirname, "..", "reports", "rag-quality-evaluation.json");
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n  Relatorio salvo em: ${outputPath}`);
    return metrics;
}

async function main() {
    const baseUrl = "http://localhost:3001";

    console.log("Gerando token admin...");
    const token = await getAdminToken();
    console.log("Token obtido.");

    const healthResponse = await fetch(`${baseUrl}/api/rag/health`);
    const health = await healthResponse.json();
    console.log(`RAG status: ${health.status}`);
    if (health.status !== "ready") { console.error("RAG nao esta pronto. Inicie o servidor com RAG habilitado."); process.exit(1); }

    await testQuery(token, baseUrl);
    await testGeneration(token, baseUrl);
    await runEvaluation(token, baseUrl);

    console.log("\n=== Avaliacao concluida ===");
}

main().catch((e) => { console.error("Erro fatal:", e.message); process.exit(1); });
