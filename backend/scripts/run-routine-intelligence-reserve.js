"use strict";

const path = require("node:path");
const { executeReserve } = require("../src/domain/routine-intelligence-reserve");

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
    const result = executeReserve({ root: path.resolve(__dirname, "../.."), write: modes[0] === "--write" });
    if (modes[0] === "--check") {
        const fs = require("node:fs");
        for (const [name, content] of Object.entries(result.outputs)) {
            const file = path.join(result.outputDirectory, name);
            if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) throw new Error("RESERVE_CHECK_MISMATCH: output differs");
        }
    }
    console.log(JSON.stringify({ protocol: "routine-reserve-opening-v1", mode: modes[0].slice(2), scenarios: result.summary.scenarios, model_executions: result.summary.model_executions, failures: result.summary.failures_by_model, fallbacks: result.summary.fallbacks, eliminatory_violations: result.summary.eliminatory_violations, reserve_accessed: true, historical_reserve_used: false, recalibration: false, public_rollout_percent: 0 }));
} catch (error) {
    console.error(String(error.message ?? "RESERVE_EXECUTION_FAILED").split("\n")[0]);
    process.exit(1);
}
