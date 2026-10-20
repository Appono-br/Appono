"use strict";

const { runDiagnostics, generateReport } = require("./diagnostic-agent");
const { listFailures } = require("./telemetry-collector");
const { reportHealed } = require("./self-healing-locator");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
    console.log("=== Robô de Diagnóstico Appono ===\n");

    // 1. Coleta falhas registradas
    const failures = listFailures();
    console.log(`Falhas registradas: ${failures.length}`);

    // 2. Classifica e gera patches
    const diagnosticResults = runDiagnostics();
    console.log(`Diagnósticos gerados: ${diagnosticResults.length}`);

    // 3. Lê resultados do Vitest (se existirem)
    const vitestResultsPath = path.resolve(__dirname, "../../test-results/vitest-results.json");
    let testResults = [];
    if (fs.existsSync(vitestResultsPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(vitestResultsPath, "utf-8"));
            testResults = (raw.testResults ?? []).flatMap((suite) =>
                (suite.assertionResults ?? []).map((t) => {
                    const name = t.fullName ?? t.ancestorTitles?.join(" > ") + " > " + t.title ?? t.title;
                    const rfMatch = name.match(/RF\d+/i);
                    const tcMatch = name.match(/TC-BIZ-\d+/i);
                    return {
                        testId: name,
                        requirementId: tcMatch?.[0] ?? rfMatch?.[0] ?? null,
                        state: t.status === "passed" ? "pass" : "fail",
                    };
                })
            );
        } catch (e) {
            console.warn("Não foi possível ler resultados do Vitest:", e.message);
        }
    }

    // Se não há resultados do Vitest, gera a partir dos diagnósticos
    if (!testResults.length && diagnosticResults.length) {
        testResults = diagnosticResults.map((d) => ({
            testId: d.testId,
            requirementId: d.requirementId,
            state: "fail",
        }));
    }

    // 4. Gera relatório em Markdown
    const { path: reportPath } = generateReport(testResults, diagnosticResults);
    console.log(`\nRelatório gerado: ${reportPath}`);

    // 5. Inclui seletores auto-corrigidos (se houver)
    const healedReport = reportHealed();
    if (healedReport) {
        fs.appendFileSync(reportPath, "\n\n" + healedReport, "utf-8");
        console.log("Seletores auto-corrigidos incluídos no relatório.");
    }

    // 6. Resumo
    console.log("\n=== Resumo ===");
    for (const d of diagnosticResults) {
        console.log(`  [${d.classification}] ${d.testId}: ${d.diagnosis}`);
    }

    if (!diagnosticResults.length) {
        console.log("  Nenhuma falha diagnosticada. ✅");
    }

    process.exitCode = diagnosticResults.length > 0 ? 1 : 0;
}

main().catch((error) => {
    console.error("Erro no diagnóstico:", error);
    process.exitCode = 2;
});
