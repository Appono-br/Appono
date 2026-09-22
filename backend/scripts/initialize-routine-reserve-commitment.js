"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { reserveCommitment } = require("../src/domain/routine-intelligence-partitions");

const root = path.resolve(__dirname, "..");
const publicPath = path.join(root, "experiments/routine-intelligence/reserve-commitment-v1.json");
const privateDirectory = path.join(root, "experiments/routine-intelligence/.private");
const privatePath = path.join(privateDirectory, "reserve-reveal-v1.json");

if (fs.existsSync(publicPath) || fs.existsSync(privatePath)) {
    throw new Error("RESERVE_COMMITMENT_ALREADY_INITIALIZED");
}

const seed = crypto.randomBytes(32).toString("hex");
const salt = crypto.randomBytes(32).toString("hex");
const commitmentVersion = "routine-reserve-commitment-v1";
const partitionId = "reserva_prospectiva_v1";
const commitmentSha256 = reserveCommitment({ commitmentVersion, partitionId, seed, salt });
const createdAt = new Date().toISOString();

const privateMaterial = {
    schema_version: 1,
    commitment_version: commitmentVersion,
    partition_id: partitionId,
    seed,
    salt,
    created_at: createdAt,
};
const publicCommitment = {
    schema_version: 1,
    commitment_version: commitmentVersion,
    partition_id: partitionId,
    algorithm: "SHA-256",
    commitment_sha256: commitmentSha256,
    created_at: createdAt,
    state: "SEALED_UNMATERIALIZED",
    results_present: false,
    private_material: "LOCAL_GITIGNORED",
    opening_requirements: [
        "CANDIDATE_FROZEN",
        "PARTITIONS_HASH_MATCH",
        "EXPLICIT_CONFIRMATION",
        "COMMITMENT_REVEAL_MATCH",
        "NEW_REPORT_DESTINATION"
    ]
};

fs.mkdirSync(privateDirectory, { recursive: true });
fs.writeFileSync(privatePath, `${JSON.stringify(privateMaterial, null, 2)}\n`, { flag: "wx", mode: 0o600 });
fs.writeFileSync(publicPath, `${JSON.stringify(publicCommitment, null, 2)}\n`, { flag: "wx" });

process.stdout.write(`${JSON.stringify({
    initialized: true,
    public_commitment: path.relative(process.cwd(), publicPath),
    private_material_gitignored: true,
    state: publicCommitment.state,
}, null, 2)}\n`);
