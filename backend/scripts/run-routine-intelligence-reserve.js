"use strict";

const path = require("node:path");
const { checkReserveOutputs, executeReserve } = require("../src/domain/routine-intelligence-reserve");

const args = process.argv.slice(2);
if (args.includes("--help")) {
    console.log("Uso: npm run execute:rotina:reserve --workspace backend -- --write|--check");
    process.exit(0);
}
if (args.some((arg) => /historica|historical|reserva=|dataset=|seed=|quantidade=|path=/i.test(arg))) {
    console.error("RESERVE_COMMAND_REJECTED: fixed prospective reserve arguments only");
    process.exit(2);
}
const modes = args.filter((arg) => arg === "--write" || arg === "--check");
if (modes.length !== 1 || args.length !== 1) {
    console.error("RESERVE_COMMAND_REJECTED: exactly one fixed mode is required");
    process.exit(2);
}
try {
    const root = path.resolve(__dirname, "../..");
    if (modes[0] === "--check") {
        const checked = checkReserveOutputs(root);
        console.log(JSON.stringify({ protocol: "routine-reserve-opening-v1", mode: "check", files: checked.files, private_material_read: false, reserve_reexecuted: false, historical_reserve_used: false, recalibration: false, public_rollout_percent: 0 }));
    } else {
        const result = executeReserve({ root, write: true });
        console.log(JSON.stringify({ protocol: "routine-reserve-opening-v1", mode: "write", scenarios: result.summary.scenarios, model_executions: result.summary.model_executions, failures: result.summary.failures_by_model, fallbacks: result.summary.fallbacks, eliminatory_violations: result.summary.eliminatory_violations, reserve_accessed: true, historical_reserve_used: false, recalibration: false, public_rollout_percent: 0 }));
    }
} catch (error) {
    console.error(String(error.message ?? "RESERVE_EXECUTION_FAILED").split("\n")[0]);
    process.exit(1);
}
