"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { decideV2_1 } = require("../src/domain/routine-intelligence-v2-1");
const { resolveV2_1Rollout } = require("../src/domain/routine-intelligence-v2-1-rollout");

const root = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "experiments/routine-intelligence/v2-1-local-titular-config-v1.json"), "utf8"));
const candidates = [
    { candidate_id: "local-preferred", restaurant: { id_restaurante: "local-r1", nome: "Fixture local" }, product: { id_produto: "local-p1", nome: "Fixture local", categorias: { nome: "Vegetariana" } }, preco_estimado: 42, distancia_km: 2, avaliacao: 4.5, score_operacional: 0 },
    { candidate_id: "local-alternative", restaurant: { id_restaurante: "local-r2", nome: "Fixture alternativa" }, product: { id_produto: "local-p2", nome: "Fixture alternativa", categorias: { nome: "Massas" } }, preco_estimado: 25, distancia_km: 1, avaliacao: 4.8, score_operacional: 0 },
];
const activation = resolveV2_1Rollout({
    candidateState: config.candidate_state,
    candidateHash: config.candidate_hash,
    expectedCandidateHash: config.candidate_hash,
    identity: config.identity,
    internalFlag: config.internal_flag,
    allowlist: config.allowlist,
    consentActive: config.consent_active,
    killSwitch: config.kill_switch,
    publicRolloutPercent: config.public_rollout_percent,
    runtimeMode: config.runtime_mode,
    localOnly: config.local_only,
});
if (!activation.enabled || activation.local_only !== true) throw new Error("V2_1_LOCAL_ACTIVATION_FAILED");
const decision = decideV2_1({
    input: { meal_window: "ALMOCO", instant_utc: "2026-09-23T12:00:00Z", eligible_candidates: candidates },
    persona: { perfil: { preferencias_explicitas: ["Vegetariana"] }, afinidades: { restaurantes: {} } },
    signals: [],
});
console.log(JSON.stringify({ runtime_mode: config.runtime_mode, local_only: true, public_rollout_percent: 0, activation, decision, production_eligible: false }, null, 2));
