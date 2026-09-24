"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const path = require("node:path");
const { resolveV2_1Rollout } = require("../src/domain/routine-intelligence-v2-1-rollout");
const { anonymizeConsentedObservation, buildAnonymizedDataset } = require("../src/domain/routine-intelligence-consented-observations");
const { createMonitor, evaluateMonitorGates, recordMonitorEvent } = require("../src/domain/routine-intelligence-v2-1-monitoring");

const baseRollout = { candidateState: "APPROVED_FOR_INTERNAL_ALLOWLIST", candidateHash: "hash", expectedCandidateHash: "hash", identity: "internal.synthetic.1", internalFlag: true, allowlist: ["internal.synthetic.1"], consentActive: true, publicRolloutPercent: 0 };

test("allowlist da V2.1 exige flag, consentimento, hash e kill switch", () => {
    assert.equal(resolveV2_1Rollout(baseRollout).enabled, true);
    assert.equal(resolveV2_1Rollout({ ...baseRollout, candidateState: "FROZEN_FOR_VALIDATION" }).enabled, false);
    assert.equal(resolveV2_1Rollout({ ...baseRollout, killSwitch: true }).model_version, "deterministico-v3");
    assert.equal(resolveV2_1Rollout({ ...baseRollout, identity: "outside" }).enabled, false);
    assert.equal(resolveV2_1Rollout({ ...baseRollout, publicRolloutPercent: 1 }).enabled, false);
    assert.equal(resolveV2_1Rollout({ ...baseRollout, candidateState: "FROZEN_FOR_VALIDATION", runtimeMode: "local", localOnly: true }).enabled, true);
    assert.equal(resolveV2_1Rollout({ ...baseRollout, candidateState: "FROZEN_FOR_VALIDATION", runtimeMode: "production", localOnly: true }).enabled, false);
});

test("dados consentidos sao anonimizados e nao aceitam PII ou duplicidade", () => {
    const record = { event_id: "event-0001", occurred_at: "2026-09-22T12:00:00Z", event_type: "FEEDBACK_POSITIVO", category: "Brasileira", outcome: "APPROVED", consent_valid: true, idempotency_key: "idem-0001" };
    const anonymized = anonymizeConsentedObservation(record);
    assert.equal(anonymized.synthetic_offline, false);
    assert.notEqual(anonymized.event_id, "event-0001");
    assert.throws(() => anonymizeConsentedObservation({ ...record, email: "person@example.test" }), /FORBIDDEN_FIELD_email/);
    assert.throws(() => buildAnonymizedDataset([record, record]), /DUPLICATE_IDEMPOTENCY_KEY/);
});

test("monitoramento registra somente contadores sem PII e pausa por violacao", () => {
    const monitor = createMonitor();
    recordMonitorEvent(monitor, { type: "decisions" });
    recordMonitorEvent(monitor, { type: "eliminatory_violations" });
    assert.equal(monitor.pii_stored, false);
    assert.equal(evaluateMonitorGates(monitor).pause, true);
});

test("CLI da reserva permanece somente em check e nao acessa material privado", () => {
    const script = path.join(__dirname, "../scripts/prepare-routine-intelligence-v2-1-reserve.js");
    const result = childProcess.spawnSync(process.execPath, [script, "--check"], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /execution_performed": false/);
    const write = childProcess.spawnSync(process.execPath, [script, "--write"], { encoding: "utf8" });
    assert.notEqual(write.status, 0);
    assert.match(write.stderr, /CHECK_ONLY/);
});
