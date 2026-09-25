"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");

const root = path.resolve(__dirname, "..");
const protocolPath = path.join(root, "experiments/routine-intelligence/v2-1-evolution-protocol-v1.json");
const hypothesesPath = path.join(root, "experiments/routine-intelligence/v2-1-evolution-hypotheses-v1.json");
const decisionPath = path.join(root, "reports/routine-intelligence/prospective/v2-1-evolution-decision-v1.json");

function read(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("protocolo V2.1 e conservador, canonico e sem evidencia fabricada", () => {
    const protocol = read(protocolPath);
    const hypotheses = read(hypothesesPath);
    const decision = read(decisionPath);
    assert.equal(protocol.candidate_version, "appono-intelligence-v2-1");
    assert.equal(protocol.baseline_version, "appono-intelligence-v2");
    assert.equal(protocol.rollout_policy.public_rollout_percent, 0);
    assert.equal(protocol.reserve_accessed, false);
    assert.equal(protocol.real_customer_data_used, false);
    assert.equal(protocol.v2_1_implementation_status, "NOT_IMPLEMENTED_PENDING_GENERAL_HYPOTHESIS");
    assert.equal(hypotheses.accepted_hypothesis_ids.length, 0);
    assert.equal(hypotheses.human_review_state, "REVISAO_HUMANA_PENDENTE");
    assert.equal(hypotheses.real_customer_data_state, "DADOS_REAIS_AUSENTES");
    assert.equal(hypotheses.reserve_accessed, false);
    assert.equal(decision.decision, "V2_1_INSUFFICIENTE_AGUARDAR_DADOS");
    assert.equal(decision.safety.v2_formula_changed, false);
    assert.equal(decision.safety.v2_1_implemented, false);
    assert.equal(decision.safety.public_rollout_percent, 0);
    assert.equal(canonicalHash(protocol), "00bdf44da2a98996d633039eeebecd18cc3109f09d5d838db39ea8ec2359b68a");
    const hypothesesForHash = { ...hypotheses };
    delete hypothesesForHash.canonical_sha256;
    assert.equal(canonicalHash(hypothesesForHash), hypotheses.canonical_sha256);
    const decisionForHash = { ...decision };
    delete decisionForHash.canonical_sha256;
    assert.equal(canonicalHash(decisionForHash), decision.canonical_sha256);
});
