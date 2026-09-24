"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { canonicalHash } = require("../src/domain/routine-intelligence-partitions");

const root = path.resolve(__dirname, "..");
const rawPath = "reports/routine-intelligence/prospective/v2-1/validation-raw.json";
const v2Path = "reports/routine-intelligence/prospective/validacao-v1.json";
const snapshotPath = "experiments/routine-intelligence/scenarios/validacao-v1.json";
const output = "reports/routine-intelligence/prospective/v2-1-blind-review-v1";
const internal = "reports/routine-intelligence/prospective/internal/v2-1-blind-review-key-v1.json";
function file(relative) { return path.join(root, relative); }
function read(relative) { return JSON.parse(fs.readFileSync(file(relative), "utf8")); }
function write(relative, value) { const target = file(relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function digest(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function bandPrice(value) { return Number(value) < 35 ? "ATE_34" : Number(value) < 50 ? "35_A_49" : "50_OU_MAIS"; }
function bandDistance(value) { return Number(value) < 2 ? "ATE_2_KM" : Number(value) < 5 ? "2_A_4_KM" : "5_OU_MAIS"; }
function run() {
    if (process.argv.includes("--help")) { console.log("Uso: node scripts/generate-routine-intelligence-v2-1-blind-review.js --check|--write"); return; }
    const check = process.argv.includes("--check");
    const writeMode = process.argv.includes("--write");
    if (check === writeMode) throw new Error("V2_1_BLIND_REVIEW_MODE_REQUIRED");
    const candidate = read(rawPath);
    const v2 = read(v2Path);
    const snapshot = read(snapshotPath);
    const byId = new Map(v2.decisions.filter((item) => item.model_version === "appono-intelligence-v2").map((item) => [item.scenario_id, item]));
    const scenarios = new Map(snapshot.scenarios.map((item) => [item.scenario_id, item]));
    const divergences = candidate.decisions.filter((item) => item.native_choice_candidate_id !== byId.get(item.scenario_id)?.native_choice_candidate_id && byId.has(item.scenario_id));
    if (divergences.length < 24) throw new Error("V2_1_BLIND_REVIEW_NOT_ENOUGH_DIVERGENCES");
    const selected = divergences.sort((a, b) => digest(a.scenario_id).localeCompare(digest(b.scenario_id))).slice(0, 24);
    const cases = selected.map((decision, index) => {
        const scenario = scenarios.get(decision.scenario_id);
        const v2Decision = byId.get(decision.scenario_id);
        const candidates = new Map(scenario.catalog.map((item) => [item.candidate_id, item]));
        const candidateA = candidates.get(decision.native_choice_candidate_id);
        const candidateB = candidates.get(v2Decision.native_choice_candidate_id);
        const orientation = Number.parseInt(digest(`${decision.scenario_id}:orientation`).slice(0, 2), 16) % 2 === 0;
        const option = (item, label) => ({ alias: `Opcao ${label}`, category: item.category, price_band: bandPrice(item.price), distance_band: bandDistance(item.distance_km), eligible_confirmed: true });
        return { blind_case_id: `v2-1-caso-${String(index + 1).padStart(2, "0")}`, scenario_digest: digest(decision.scenario_id), context: { profile_label: `Perfil ${digest(scenario.persona_id).slice(0, 4).toUpperCase()}`, meal_window: scenario.meal_window, virtual_moment: `semana ${scenario.virtual_week + 1}, dia ${scenario.virtual_day + 1}, historico ${scenario.history.level}` }, option_a: option(orientation ? candidateA : candidateB, "A"), option_b: option(orientation ? candidateB : candidateA, "B"), response: { choice: null, reason_codes: [], confidence: null, note: null } };
    });
    const packageCore = { schema_version: 1, package_version: "appono-intelligence-v2-1-blind-review-v1", candidate_version: "appono-intelligence-v2-1", comparison_baseline: "frozen-baseline", synthetic_offline_only: true, judgments_present: false, case_count: cases.length, allowed_choices: ["A", "B", "EMPATE", "INDETERMINADO"], cases };
    const publicPackage = { ...packageCore, content_sha256: canonicalHash(packageCore) };
    const key = { schema_version: 1, package_content_sha256: publicPackage.content_sha256, cases: selected.map((item, index) => ({ blind_case_id: cases[index].blind_case_id, scenario_id: item.scenario_id, candidate_choice: item.native_choice_candidate_id, baseline_choice: byId.get(item.scenario_id).native_choice_candidate_id })) };
    const responseCore = { schema_version: 1, package_content_sha256: publicPackage.content_sha256, status: "DRAFT_EMPTY", reviewer_code: null, responses: cases.map((item) => ({ blind_case_id: item.blind_case_id, choice: null, reason_codes: [], confidence: null, note: null })) };
    const response = { ...responseCore, content_sha256: canonicalHash(responseCore) };
    const manifestCore = { schema_version: 1, manifest_version: "appono-intelligence-v2-1-blind-review-manifest-v1", package_content_sha256: publicPackage.content_sha256, answer_key_commitment_sha256: canonicalHash(key), cases: cases.length, responses_filled: 0, human_review_state: "REVISAO_HUMANA_PENDENTE", reserve_accessed: false, public_rollout_percent: 0 };
    const manifest = { ...manifestCore, content_sha256: canonicalHash(manifestCore) };
    const outputs = { "package.json": publicPackage, "responses-template.json": response, "manifest.json": manifest, "README.md": { instructions: "Revisao humana cega da V2.1. Escolha A, B, EMPATE ou INDETERMINADO. Nao inclua PII. Este material e evidencia auxiliar e nao substitui avaliacao longitudinal." } };
    if (check) {
        for (const [name, value] of Object.entries(outputs)) { const target = file(`${output}/${name}`); if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== `${JSON.stringify(value, null, 2)}\n`) throw new Error("V2_1_BLIND_REVIEW_OUTPUT_DIFFERS"); }
        if (!fs.existsSync(file(internal))) throw new Error("V2_1_BLIND_REVIEW_KEY_MISSING");
    } else {
        for (const [name, value] of Object.entries(outputs)) write(`${output}/${name}`, value);
        write(internal, key);
    }
    console.log(JSON.stringify({ package_content_sha256: publicPackage.content_sha256, cases: cases.length, responses_filled: 0, human_review_state: "REVISAO_HUMANA_PENDENTE", reserve_accessed: false, written: writeMode, checked: check }, null, 2));
}
if (require.main === module) run();
module.exports = { run };
