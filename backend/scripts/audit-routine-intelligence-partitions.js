"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
    auditPartitionIndependence,
    canonicalHash,
    validatePartitionsArtifact,
    validateReserveCommitment,
} = require("../src/domain/routine-intelligence-partitions");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const partitions = readJson("experiments/routine-intelligence/partitions-v1.json");
const commitment = readJson("experiments/routine-intelligence/reserve-commitment-v1.json");

validatePartitionsArtifact(partitions);
validateReserveCommitment(commitment);
const independence = auditPartitionIndependence(partitions);
if (!independence.isolated) throw new Error("PARTITION_INTERSECTION_DETECTED");

process.stdout.write(`${JSON.stringify({
    partitions_version: partitions.partitions_version,
    partitions_sha256: canonicalHash(partitions),
    personas_sha256: partitions.personas.canonical_sha256,
    historical_reserve_status: partitions.historical_baseline.reserve_status,
    prospective_reserve_state: commitment.state,
    prospective_reserve_commitment_sha256: commitment.commitment_sha256,
    ...independence,
}, null, 2)}\n`);
