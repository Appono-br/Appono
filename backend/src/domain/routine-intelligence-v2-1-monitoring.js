"use strict";

const ALLOWED_COUNTERS = Object.freeze(["decisions", "fallbacks", "low_confidence", "errors", "timeouts", "ineligible_choices", "eliminatory_violations", "complaints_categorized", "idempotency_conflicts"]);

function createMonitor() { return { schema_version: 1, monitor_version: "v2-1-internal-monitor-v1", candidate_version: "appono-intelligence-v2-1", public_rollout_percent: 0, counters: Object.fromEntries(ALLOWED_COUNTERS.map((key) => [key, 0])), categories: {}, pii_stored: false }; }
function recordMonitorEvent(monitor, event = {}) {
    if (!monitor || monitor.public_rollout_percent !== 0 || monitor.pii_stored === true) throw new Error("V2_1_MONITOR_INVALID_STATE");
    if (!ALLOWED_COUNTERS.includes(event.type)) throw new Error("V2_1_MONITOR_EVENT_NOT_ALLOWED");
    monitor.counters[event.type] += 1;
    if (event.type === "complaints_categorized") {
        const category = String(event.category ?? "UNKNOWN");
        if (!/^[A-Z0-9_]{2,64}$/.test(category)) throw new Error("V2_1_MONITOR_CATEGORY_INVALID");
        monitor.categories[category] = (monitor.categories[category] ?? 0) + 1;
    }
    return monitor;
}
function evaluateMonitorGates(monitor, limits = {}) {
    const decisions = monitor.counters.decisions;
    const ratio = (field) => decisions > 0 ? monitor.counters[field] / decisions : 0;
    return { pause: ratio("eliminatory_violations") > (limits.max_eliminatory_rate ?? 0) || ratio("ineligible_choices") > (limits.max_ineligible_rate ?? 0) || ratio("fallbacks") > (limits.max_fallback_rate ?? 0.25), ratios: { fallback: ratio("fallbacks"), low_confidence: ratio("low_confidence"), errors: ratio("errors"), timeouts: ratio("timeouts") } };
}
module.exports = { ALLOWED_COUNTERS, createMonitor, evaluateMonitorGates, recordMonitorEvent };
