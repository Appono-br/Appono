"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { listFailures, DIAGNOSTICS_DIR } = require("./telemetry-collector");

const PATCHES_DIR = path.resolve(__dirname, "../../test-results/patches");
const REPORT_PATH = path.resolve(__dirname, "../../test-results/RELATORIO_DIAGNOSTICO.md");

const HEURISTICS = [
    {
        pattern: /404|NOT_FOUND|Cannot (GET|POST|PATCH|DELETE)/i,
        classification: "MISSING_VALIDATION",
        diagnosis: "Endpoint ou rota não registrado no servidor. Verifique se a rota está definida e o router está montado.",
    },
    {
        pattern: /200.*esperava.*4\d\d|returned 200.*expected 4/i,
        classification: "MISSING_VALIDATION",
        diagnosis: "O controller aceitou uma requisição que deveria ser rejeitada. Falta validação de regra de negócio.",
    },
    {
        pattern: /timeout|ETIMEDOUT|TimeoutError/i,
        classification: "TEST_SELECTOR_BROKEN",
        diagnosis: "Timeout na operação — possível mudança de UI ou seletor quebrado.",
    },
    {
        pattern: /409.*Conflict|duplicate|unique.*constraint|already exists/i,
        classification: "RACE_CONDITION",
        diagnosis: "Conflito de concorrência — duas operações simultâneas disputaram o mesmo recurso.",
    },
    {
        pattern: /FOREIGN KEY|violates.*constraint|referential/i,
        classification: "BUSINESS_LOGIC_BUG",
        diagnosis: "Violação de integridade referencial — o código tentou criar ou deletar um registro sem respeitar dependências.",
    },
    {
        pattern: /Cannot read properties of (null|undefined)|TypeError/i,
        classification: "BUSINESS_LOGIC_BUG",
        diagnosis: "Acesso a propriedade em objeto nulo/undefined — lógica do domínio não tratou cenário de dados ausentes.",
    },
    {
        pattern: /AssertionError|assert|expected.*to (equal|be|match|include)/i,
        classification: "BUSINESS_LOGIC_BUG",
        diagnosis: "Asserção falhou — o valor retornado pela lógica de domínio diverge do comportamento esperado pela especificação.",
    },
];

function classifyFailure(failure) {
    const haystack = `${failure.errorMessage} ${failure.stackTrace} ${failure.httpStatus ?? ""}`;
    for (const h of HEURISTICS) {
        if (h.pattern.test(haystack)) {
            return { classification: h.classification, diagnosis: h.diagnosis };
        }
    }
    return {
        classification: "BUSINESS_LOGIC_BUG",
        diagnosis: "Falha não classificada por heurística. Análise manual necessária.",
    };
}

function generatePatchSuggestion(failure, diagnosis) {
    const lines = [
        `--- Patch sugerido para: ${failure.testId}`,
        `--- Arquivo: ${failure.file}`,
        `--- Classificação: ${diagnosis.classification}`,
        `--- Diagnóstico: ${diagnosis.diagnosis}`,
        "",
        `Erro: ${failure.errorMessage}`,
        "",
        "Ação recomendada:",
    ];

    switch (diagnosis.classification) {
        case "MISSING_VALIDATION":
            lines.push("  1. Localizar o handler da rota em backend/src/routes/");
            lines.push("  2. Adicionar validação de entrada antes da lógica principal");
            lines.push("  3. Retornar status 400/422 com mensagem descritiva");
            break;
        case "RACE_CONDITION":
            lines.push("  1. Verificar se a operação usa transaction/lock no Supabase");
            lines.push("  2. Usar SELECT ... FOR UPDATE ou função SQL com isolamento");
            lines.push("  3. Retornar 409 Conflict com sugestão de alternativa");
            break;
        case "TEST_SELECTOR_BROKEN":
            lines.push("  1. Atualizar seletor no teste para usar data-testid ou getByRole");
            lines.push("  2. Verificar se o componente foi renomeado ou reestruturado");
            break;
        default:
            lines.push("  1. Verificar a lógica no módulo de domínio indicado");
            lines.push("  2. Comparar o comportamento atual com a especificação (spec.md)");
            lines.push("  3. Ajustar a função para respeitar a regra de negócio");
    }

    return lines.join("\n");
}

function runDiagnostics() {
    const failures = listFailures();
    const results = [];

    if (!fs.existsSync(PATCHES_DIR)) {
        fs.mkdirSync(PATCHES_DIR, { recursive: true });
    }

    for (const failure of failures) {
        const diagnosis = classifyFailure(failure);
        const patch = generatePatchSuggestion(failure, diagnosis);

        const patchFile = path.join(PATCHES_DIR, `${failure.testId.replace(/\W+/g, "_")}.patch`);
        fs.writeFileSync(patchFile, patch, "utf-8");

        results.push({
            testId: failure.testId,
            requirementId: failure.requirementId,
            file: failure.file,
            ...diagnosis,
            patchFile,
            errorMessage: failure.errorMessage,
        });
    }

    return results;
}

function generateReport(testResults = [], diagnosticResults = []) {
    const passed = testResults.filter((t) => t.state === "pass");
    const failed = testResults.filter((t) => t.state === "fail");
    const now = new Date().toISOString();

    const lines = [
        "# Relatório de Diagnóstico — Robô de Testes Appono",
        "",
        `**Gerado em:** ${now}`,
        "",
        "## Resumo",
        "",
        `| Métrica | Valor |`,
        `|---------|-------|`,
        `| Total de testes | ${testResults.length} |`,
        `| Aprovados | ${passed.length} |`,
        `| Reprovados | ${failed.length} |`,
        `| Taxa de aprovação | ${testResults.length ? ((passed.length / testResults.length) * 100).toFixed(1) : 0}% |`,
        "",
        "## Testes Aprovados",
        "",
    ];

    if (passed.length) {
        for (const t of passed) {
            lines.push(`- ✅ **${t.testId}** ${t.requirementId ? `(${t.requirementId})` : ""}`);
        }
    } else {
        lines.push("_Nenhum teste aprovado._");
    }

    lines.push("", "## Testes Reprovados e Diagnóstico", "");

    if (diagnosticResults.length) {
        for (const d of diagnosticResults) {
            lines.push(`### ❌ ${d.testId} ${d.requirementId ? `(${d.requirementId})` : ""}`);
            lines.push("");
            lines.push(`- **Classificação:** \`${d.classification}\``);
            lines.push(`- **Diagnóstico:** ${d.diagnosis}`);
            lines.push(`- **Erro:** ${d.errorMessage}`);
            lines.push(`- **Patch:** \`${path.relative(path.dirname(REPORT_PATH), d.patchFile)}\``);
            lines.push("");
        }
    } else if (failed.length) {
        for (const t of failed) {
            lines.push(`- ❌ **${t.testId}** — sem diagnóstico disponível`);
        }
    } else {
        lines.push("_Todos os testes passaram — nenhum diagnóstico necessário._ 🎉");
    }

    lines.push("", "---", "", "_Relatório gerado automaticamente pelo Robô de Testes Appono._");

    const report = lines.join("\n");
    fs.writeFileSync(REPORT_PATH, report, "utf-8");
    return { path: REPORT_PATH, report };
}

module.exports = { classifyFailure, runDiagnostics, generateReport, REPORT_PATH };
