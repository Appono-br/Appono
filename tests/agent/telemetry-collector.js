"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DIAGNOSTICS_DIR = path.resolve(__dirname, "../../test-results/diagnostics");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function cleanStack(error) {
    if (!error?.stack) return "";
    return error.stack
        .split("\n")
        .filter((line) => !line.includes("node_modules") && !line.includes("node:internal"))
        .join("\n")
        .trim();
}

function extractRequirementId(testName) {
    const rfMatch = testName.match(/RF\d+/i);
    const tcMatch = testName.match(/TC-BIZ-\d+/i);
    return tcMatch?.[0] ?? rfMatch?.[0] ?? null;
}

async function collectFailure({
    testId,
    file,
    error,
    durationMs,
    requestPayload = null,
    endpoint = null,
    httpStatus = null,
    dbStateBefore = null,
    dbStateAfter = null,
    domSnapshot = null,
    screenshotPath = null,
}) {
    ensureDir(DIAGNOSTICS_DIR);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const report = {
        testId,
        requirementId: extractRequirementId(testId),
        file,
        timestamp: new Date().toISOString(),
        durationMs,
        requestPayload,
        endpoint,
        httpStatus,
        dbStateBefore,
        dbStateAfter,
        errorMessage: error?.message ?? String(error),
        stackTrace: cleanStack(error),
        domSnapshot,
        screenshotPath,
    };

    const filename = `failure-${timestamp}-${testId.replace(/\W+/g, "_").slice(0, 60)}.json`;
    const filepath = path.join(DIAGNOSTICS_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), "utf-8");

    return { filepath, report };
}

function listFailures() {
    ensureDir(DIAGNOSTICS_DIR);
    return fs
        .readdirSync(DIAGNOSTICS_DIR)
        .filter((f) => f.startsWith("failure-") && f.endsWith(".json"))
        .map((f) => {
            const content = fs.readFileSync(path.join(DIAGNOSTICS_DIR, f), "utf-8");
            return { file: f, ...JSON.parse(content) };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

module.exports = { collectFailure, listFailures, DIAGNOSTICS_DIR };
