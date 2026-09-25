"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { authorizeReserveOpening, canonicalHash, validateReserveCommitment } = require("./routine-intelligence-partitions");
const {
    generateScenario,
    serializeScenarioSnapshot,
    summarizeCoverage,
    validateScenarioSnapshot,
} = require("./routine-intelligence-scenario-generator");
const { simulateLongitudinal, serializeReport } = require("./routine-intelligence-longitudinal-simulation");
const { evaluateDataset, serializeMetrics } = require("./routine-intelligence-longitudinal-metrics");

const RESERVE_ID = "reserva_prospectiva_v1";
const CONFIRMATION = "OPEN_PROSPECTIVE_RESERVE";

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function sha256File(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function atomicWrite(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, file);
}
function seedNumber(seed) {
    const modulus = 9007199254740991n;
    return Number(BigInt(`0x${seed}`) % modulus);
}
function reserveSnapshot({ partitionsArtifact, personasArtifact, seed }) {
    const partition = partitionsArtifact.partitions.find((item) => item.id === RESERVE_ID);
    if (!partition) throw new Error("RESERVE_INVALID: partition missing");
    const numericSeed = seedNumber(seed);
    const scenarios = [];
    for (const personaId of partition.persona_ids) {
        const persona = personasArtifact.personas.find((item) => item.id === personaId);
        if (!persona) throw new Error("RESERVE_INVALID: persona missing");
        for (let week = 0; week < partition.weeks; week += 1) {
            for (let day = 0; day < 5; day += 1) scenarios.push(generateScenario({ artifact: partitionsArtifact, partition, persona, week, day, seed: numericSeed }));
        }
    }
    scenarios.sort((a, b) => a.scenario_id.localeCompare(b.scenario_id));
    return {
        schema_version: 1,
        generator_version: "routine-scenario-generator-v1",
        protocol: partitionsArtifact.protocol,
        partitions_version: partitionsArtifact.partitions_version,
        partitions_sha256: canonicalHash(partitionsArtifact),
        personas_version: personasArtifact.personas_version,
        personas_sha256: canonicalHash(personasArtifact),
        partition: { id: partition.id, type: partition.type, namespace: partition.namespace, seed: numericSeed, period: partition.period, timezone: partition.timezone, weeks: partition.weeks },
        total_personas: partition.persona_ids.length,
        total_scenarios: scenarios.length,
        scenarios_sha256: canonicalHash(scenarios),
        coverage: summarizeCoverage(scenarios),
        scenarios,
    };
}

function buildAuthorizedProtocol(base, snapshot, openingProtocol) {
    return {
        ...base,
        reserve: { ...base.reserve, prospective_state: "OPENED_ONCE_EXECUTABLE", access_allowed: true },
        snapshots: { ...base.snapshots, [RESERVE_ID]: { file_sha256: snapshot.scenarios_sha256, scenarios: snapshot.total_scenarios } },
        opening_protocol: openingProtocol.protocol_version,
    };
}

function executeReserve({ root, protocol, write = false }) {
    const exp = path.join(root, "backend", "experiments", "routine-intelligence");
    const reports = path.join(root, "backend", "reports", "routine-intelligence", "prospective", "internal", "reserve-v1");
    const commitmentPath = path.join(exp, "reserve-commitment-v1.json");
    const revealPath = path.join(exp, ".private", "reserve-reveal-v1.json");
    const partitions = readJson(path.join(exp, "partitions-v1.json"));
    const personas = readJson(path.join(exp, "personas-v1.json"));
    const baseProtocol = readJson(path.join(exp, "longitudinal-protocol-v1.json"));
    const openingProtocol = readJson(path.join(exp, "reserve-opening-protocol-v1.json"));
    const commitment = readJson(commitmentPath);
    const reveal = readJson(revealPath);
    validateReserveCommitment(commitment);
    if (sha256File(commitmentPath) !== openingProtocol.source_hashes.reserve_commitment_file_sha256) throw new Error("RESERVE_INVALID: commitment file hash");
    if (canonicalHash(partitions) !== openingProtocol.source_hashes.partitions_canonical_sha256) throw new Error("RESERVE_INVALID: partitions hash");
    const freeze = readJson(path.join(exp, "final-candidate-freeze-v1.json"));
    if (freeze.state !== "FROZEN" || freeze.candidate?.model_version !== openingProtocol.candidate_version) throw new Error("RESERVE_INVALID: candidate is not frozen");
    const authorized = authorizeReserveOpening({
        commitment, seed: reveal.seed, salt: reveal.salt, candidateVersion: openingProtocol.candidate_version,
        candidateFrozen: true, partitionHash: canonicalHash(partitions), expectedPartitionHash: openingProtocol.source_hashes.partitions_canonical_sha256,
        confirmation: CONFIRMATION,
    });
    const snapshot = reserveSnapshot({ partitionsArtifact: partitions, personasArtifact: personas, seed: reveal.seed });
    validateScenarioSnapshot(snapshot, { partitionsArtifact: partitions, personasArtifact: personas });
    const reserveProtocol = buildAuthorizedProtocol(baseProtocol, snapshot, openingProtocol);
    const raw = simulateLongitudinal({ snapshot, partitionsArtifact: partitions, personasArtifact: personas, protocol: reserveProtocol, allowReserveExecution: true });
    const baseline = readJson(path.join(root, "backend", "experiments", "routine-intelligence", "manifest.json"));
    const metrics = evaluateDataset({ report: raw, snapshot, personasArtifact: personas, baselineManifest: baseline, allowReserve: true });
    const openingManifest = {
        schema_version: 1, protocol_version: openingProtocol.protocol_version, planned_date: openingProtocol.planned_date,
        execution_date: "2026-09-23", partition_id: RESERVE_ID, candidate_version: authorized.candidate_version,
        candidate_state: "FROZEN", partition_hash: canonicalHash(partitions), commitment_sha256: commitment.commitment_sha256,
        snapshot_scenarios_sha256: snapshot.scenarios_sha256, raw_report_sha256: raw.content_sha256, metrics_sha256: metrics.content_sha256,
        scenarios: snapshot.total_scenarios, model_executions: raw.summary.model_executions, reserve_accessed: true,
        historical_reserve_used: false, real_customer_data: false, calibration_used: false, recalibration_used: false, public_rollout_percent: 0,
    };
    const summary = {
        schema_version: "routine-reserve-summary-v1", protocol_version: openingProtocol.protocol_version, partition_id: RESERVE_ID,
        candidate_version: openingProtocol.candidate_version, candidate_state: "FROZEN", reserve_accessed: true,
        historical_reserve_used: false, real_customer_data: false, recalibration_used: false, public_rollout_percent: 0,
        scenarios: raw.summary.scenarios, model_executions: raw.summary.model_executions, executions_by_model: raw.summary.executions_by_model,
        failures_by_model: raw.summary.failures_by_model, fallbacks: raw.summary.fallbacks, eliminatory_violations: raw.summary.eliminatory_violations,
        raw_report_sha256: raw.content_sha256, metrics_sha256: metrics.content_sha256,
    };
    const outputs = { "opening-manifest.json": `${JSON.stringify(openingManifest, null, 2)}\n`, "snapshot.json": serializeScenarioSnapshot(snapshot), "raw-report.json": serializeReport(raw), "metrics.json": serializeMetrics(metrics), "summary.json": `${JSON.stringify({ ...summary, content_sha256: canonicalHash(summary) }, null, 2)}\n` };
    if (write) {
        if (fs.existsSync(reports)) throw new Error("RESERVE_ALREADY_EXECUTED: output directory exists");
        for (const [name, content] of Object.entries(outputs)) atomicWrite(path.join(reports, name), content);
    }
    return { openingManifest, summary, outputs, outputDirectory: reports };
}

function checkReserveOutputs(root) {
    const directory = path.join(root, "backend", "reports", "routine-intelligence", "prospective", "internal", "reserve-v1");
    const required = ["opening-manifest.json", "snapshot.json", "raw-report.json", "metrics.json", "summary.json"];
    if (!fs.existsSync(directory)) throw new Error("RESERVE_CHECK_MISMATCH: output directory missing");
    for (const name of required) if (!fs.existsSync(path.join(directory, name))) throw new Error("RESERVE_CHECK_MISMATCH: output missing");
    const opening = readJson(path.join(directory, "opening-manifest.json"));
    const raw = readJson(path.join(directory, "raw-report.json"));
    const metrics = readJson(path.join(directory, "metrics.json"));
    const summary = readJson(path.join(directory, "summary.json"));
    if (opening.partition_id !== RESERVE_ID || opening.reserve_accessed !== true || opening.historical_reserve_used !== false) throw new Error("RESERVE_CHECK_MISMATCH: opening manifest");
    if (raw.metadata?.dataset_id !== RESERVE_ID || raw.metadata?.reserve_accessed !== true || raw.content_sha256 !== canonicalHash({ metadata: raw.metadata, summary: raw.summary, decisions: raw.decisions })) throw new Error("RESERVE_CHECK_MISMATCH: raw report");
    if (metrics.metadata?.dataset_id !== RESERVE_ID || metrics.metadata?.reserve_accessed !== true) throw new Error("RESERVE_CHECK_MISMATCH: metrics");
    if (summary.partition_id !== RESERVE_ID || summary.reserve_accessed !== true || summary.raw_report_sha256 !== raw.content_sha256 || summary.metrics_sha256 !== metrics.content_sha256) throw new Error("RESERVE_CHECK_MISMATCH: summary");
    return { outputDirectory: directory, files: required };
}

module.exports = { CONFIRMATION, RESERVE_ID, checkReserveOutputs, executeReserve, reserveSnapshot, seedNumber };
