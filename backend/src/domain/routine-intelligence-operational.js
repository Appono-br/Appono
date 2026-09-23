"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { canonicalHash } = require("./routine-intelligence-partitions");

const POLICY_VERSION = "routine-intelligence-policy-v1";
const FROZEN_CANDIDATE = "appono-intelligence-v2";

function faixaConfianca(valor) {
    const confianca = Number(valor);
    if (!Number.isFinite(confianca) || confianca <= 0) return "ZERO";
    if (confianca < 0.25) return "BAIXA";
    if (confianca < 0.6) return "MEDIA";
    return "ALTA";
}

function faixaAmostras(valor) {
    const amostras = Number(valor);
    if (!Number.isFinite(amostras) || amostras <= 0) return "ZERO";
    if (amostras <= 2) return "BAIXA";
    if (amostras <= 7) return "MEDIA";
    return "ALTA";
}

function criarDiagnosticoOperacional({ decisao, requestId = null } = {}) {
    if (!decisao || typeof decisao !== "object") throw new TypeError("INTELLIGENCE_DIAGNOSTIC_DECISION_REQUIRED");
    const usouV2 = decisao.usouV2 === true;
    const modelo = String(decisao.modelo ?? "deterministico-v3");
    if (usouV2 && modelo !== FROZEN_CANDIDATE) throw new Error("INTELLIGENCE_DIAGNOSTIC_CANDIDATE_NOT_FROZEN");
    return Object.freeze({
        decision_source: usouV2 ? "V2" : "CONTROLE",
        model_version: modelo,
        policy_version: POLICY_VERSION,
        frozen_candidate: FROZEN_CANDIDATE,
        fallback_used: !usouV2,
        technical_code: String(decisao.motivo ?? "CONTROLE_PADRAO"),
        confidence_bucket: faixaConfianca(decisao.confianca),
        effective_samples_bucket: faixaAmostras(decisao.amostras),
        guardrails_applied: Object.freeze([
            "ELIGIBILITY_BEFORE_PERSONALIZATION",
            "CONSENT_REQUIRED",
            "LOW_CONFIDENCE_FALLBACK",
            "MODEL_FAILURE_ISOLATION",
            "PUBLIC_ROLLOUT_ZERO",
        ]),
        request_id: requestId === null || requestId === undefined ? null : String(requestId).slice(0, 120),
    });
}

function validarDiagnosticoOperacional(diagnostico) {
    if (!diagnostico || typeof diagnostico !== "object" || Array.isArray(diagnostico)) throw new TypeError("INTELLIGENCE_DIAGNOSTIC_INVALID");
    const proibidos = ["score", "adjustment", "ajuste", "signal", "sinal", "email", "telefone", "endereco", "address"];
    const texto = JSON.stringify(diagnostico).toLowerCase();
    if (proibidos.some((campo) => texto.includes(`\"${campo}\"`))) throw new Error("INTELLIGENCE_DIAGNOSTIC_PRIVATE_FIELD");
    if (diagnostico.fallback_used !== (diagnostico.decision_source !== "V2")) throw new Error("INTELLIGENCE_DIAGNOSTIC_FALLBACK_MISMATCH");
    if (diagnostico.decision_source === "V2" && diagnostico.model_version !== FROZEN_CANDIDATE) throw new Error("INTELLIGENCE_DIAGNOSTIC_CANDIDATE_NOT_FROZEN");
    return true;
}

function candidataCongeladaDisponivel() {
    try {
        const manifestPath = path.resolve(__dirname, "../../experiments/routine-intelligence/final-candidate-freeze-v1.json");
        const reportPath = path.resolve(__dirname, "../../reports/routine-intelligence/prospective/final-candidate-freeze-v1.json");
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        return manifest.state === "FROZEN" &&
            manifest.candidate?.model_version === FROZEN_CANDIDATE &&
            manifest.rollout?.public_percent === 0 &&
            manifest.reserve?.accessed === false &&
            manifest.formulas_changed === false &&
            report.freeze_state === "FROZEN" &&
            report.candidate_version === FROZEN_CANDIDATE &&
            report.source_hashes?.freeze_manifest_canonical_sha256 === manifest.canonical_sha256 &&
            report.canonical_sha256 === canonicalHash(Object.fromEntries(Object.entries(report).filter(([key]) => key !== "canonical_sha256")));
    } catch {
        return false;
    }
}

module.exports = { FROZEN_CANDIDATE, POLICY_VERSION, candidataCongeladaDisponivel, criarDiagnosticoOperacional, faixaAmostras, faixaConfianca, validarDiagnosticoOperacional };
