"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const cli = path.join(path.dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");
const resultado = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: process.env.SUPABASE_TELEMETRY_DISABLED ?? "1" },
});

if (resultado.error) throw resultado.error;
process.exitCode = resultado.status ?? 1;
