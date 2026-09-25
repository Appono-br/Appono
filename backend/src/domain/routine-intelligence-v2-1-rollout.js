"use strict";

const CANDIDATE_VERSION = "appono-intelligence-v2-1";

function safeId(value) {
    return typeof value === "string" && /^[A-Za-z0-9._:-]{2,128}$/.test(value) ? value : null;
}

function resolveV2_1Rollout({ candidateState, candidateHash, expectedCandidateHash, identity, internalFlag = false, allowlist = [], consentActive = false, killSwitch = false, publicRolloutPercent = 0, runtimeMode = "operational", localOnly = false } = {}) {
    const technicalCode = (code, source = "CONTROL") => ({ enabled: false, decision_source: source, model_version: "deterministico-v3", fallback_used: true, technical_code: code, public_rollout_percent: 0 });
    const localActivation = runtimeMode === "local" && localOnly === true && candidateState === "FROZEN_FOR_VALIDATION";
    if (!localActivation && candidateState !== "APPROVED_FOR_INTERNAL_ALLOWLIST") return technicalCode("CANDIDATE_NOT_OPERATIONALLY_APPROVED");
    if (!candidateHash || candidateHash !== expectedCandidateHash) return technicalCode("CANDIDATE_HASH_MISMATCH");
    if (publicRolloutPercent !== 0) return technicalCode("PUBLIC_ROLLOUT_MUST_REMAIN_ZERO");
    if (!internalFlag) return technicalCode("INTERNAL_FLAG_DISABLED");
    if (killSwitch) return technicalCode("KILL_SWITCH_ACTIVE");
    if (!consentActive) return technicalCode("CONSENT_REQUIRED");
    const normalized = safeId(identity);
    if (!normalized || !allowlist.map(safeId).includes(normalized)) return technicalCode("IDENTITY_NOT_ALLOWLISTED");
    return { enabled: true, decision_source: "V2_1", model_version: CANDIDATE_VERSION, fallback_used: false, technical_code: localActivation ? "V2_1_LOCAL_TITULAR" : "V2_1_ALLOWLIST_ENABLED", public_rollout_percent: 0, local_only: localActivation };
}

module.exports = { CANDIDATE_VERSION, resolveV2_1Rollout };
