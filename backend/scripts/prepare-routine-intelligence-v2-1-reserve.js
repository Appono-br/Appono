"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const protocolPath = "experiments/routine-intelligence/v2-1-reserve-protocol-v1.json";
const manifestPath = "experiments/routine-intelligence/v2-1-candidate-manifest-v1.json";
function absolute(relative) { return path.join(root, relative); }
function read(relative) { return JSON.parse(fs.readFileSync(absolute(relative), "utf8")); }
function fileHash(relative) { return crypto.createHash("sha256").update(fs.readFileSync(absolute(relative))).digest("hex"); }
function run() {
    if (process.argv.includes("--help")) { console.log("Uso: npm run prepare:rotina:v2-1:reserve --workspace backend -- --check"); return; }
    if (!process.argv.includes("--check") || process.argv.includes("--write")) throw new Error("V2_1_RESERVE_PREPARATION_IS_CHECK_ONLY");
    const protocol = read(protocolPath);
    const manifest = read(manifestPath);
    if (protocol.state !== "SEALED_NOT_AUTHORIZED" || protocol.authorization?.state !== "PENDING") throw new Error("V2_1_RESERVE_NOT_SEALED");
    if (manifest.candidate_version !== "appono-intelligence-v2-1" || manifest.state !== "FROZEN_FOR_VALIDATION") throw new Error("V2_1_CANDIDATE_NOT_FROZEN");
    console.log(JSON.stringify({ protocol: protocol.protocol_version, protocol_sha256: fileHash(protocolPath), candidate_manifest_sha256: fileHash(manifestPath), authorization: protocol.authorization.state, reserve_accessed: false, private_material_read: false, execution_performed: false, public_rollout_percent: 0 }, null, 2));
}
if (require.main === module) run();
module.exports = { run };
