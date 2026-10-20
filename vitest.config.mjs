import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        root: path.resolve(__dirname, "tests"),
        include: ["business-rules/**/*.spec.mjs"],
        setupFiles: ["./config/setup-vitest.mjs"],
        testTimeout: 15_000,
        pool: "forks",
        reporters: ["verbose", "json"],
        outputFile: { json: "../test-results/vitest-results.json" },
    },
});
