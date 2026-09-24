"use strict";

const crypto = require("node:crypto");
const { canonicalHash } = require("./routine-intelligence-partitions");

const ALLOWED_KEYS = new Set(["event_id", "occurred_at", "event_type", "category", "restaurant_class", "product_class", "outcome", "consent_valid", "consent_active", "consent_granted_at", "consent_revoked_at", "idempotency_key"]);
const FORBIDDEN_KEYS = new Set(["name", "email", "phone", "address", "latitude", "longitude", "medical_condition", "allergy", "calendar", "free_text", "token", "password", "user_id"]);

function reject(condition, code) { if (!condition) throw new Error(`CONSENTED_OBSERVATION_INVALID: ${code}`); }
function pseudonymousId(value) { return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16); }

function anonymizeConsentedObservation(observation, { analysisPurpose = "routine-intelligence-evaluation-v1", now = "2026-09-23T00:00:00.000Z" } = {}) {
    reject(observation && typeof observation === "object" && !Array.isArray(observation), "OBJECT_REQUIRED");
    for (const key of Object.keys(observation)) reject(!FORBIDDEN_KEYS.has(key), `FORBIDDEN_FIELD_${key}`);
    for (const key of Object.keys(observation)) reject(ALLOWED_KEYS.has(key), `UNKNOWN_FIELD_${key}`);
    reject(observation.consent_valid === true || observation.consent_active === true, "ACTIVE_CONSENT_REQUIRED");
    reject(typeof observation.event_id === "string" && observation.event_id.length >= 8, "EVENT_ID_REQUIRED");
    reject(typeof observation.idempotency_key === "string" && observation.idempotency_key.length >= 8, "IDEMPOTENCY_KEY_REQUIRED");
    reject(Number.isFinite(Date.parse(observation.occurred_at)), "EVENT_TIME_REQUIRED");
    reject(Date.parse(observation.occurred_at) <= Date.parse(now), "FUTURE_EVENT");
    reject(!observation.consent_revoked_at || Date.parse(observation.occurred_at) < Date.parse(observation.consent_revoked_at), "REVOKED_CONSENT");
    const sanitized = {
        event_id: pseudonymousId(observation.event_id),
        occurred_at: new Date(observation.occurred_at).toISOString(),
        event_type: String(observation.event_type ?? "").toUpperCase(),
        category: observation.category ?? null,
        restaurant_class: observation.restaurant_class ?? null,
        product_class: observation.product_class ?? null,
        outcome: observation.outcome ?? null,
        idempotency_key: pseudonymousId(observation.idempotency_key),
        purpose: analysisPurpose,
        synthetic_offline: false,
        consent_valid: true,
    };
    reject(["APROVACAO", "RECUSA", "ALTERNATIVA", "EDICAO", "CONVERSAO", "CONVERSAO_RESERVA", "CONVERSAO_PEDIDO", "CONVERSAO_SIMULADA", "FEEDBACK_POSITIVO", "FEEDBACK_NEGATIVO"].includes(sanitized.event_type), "EVENT_TYPE_NOT_ALLOWED");
    return { ...sanitized, record_sha256: canonicalHash(sanitized) };
}

function buildAnonymizedDataset(records, options = {}) {
    reject(Array.isArray(records), "RECORDS_REQUIRED");
    const seen = new Set();
    const sanitized = records.map((record) => {
        const item = anonymizeConsentedObservation(record, options);
        reject(!seen.has(item.idempotency_key), "DUPLICATE_IDEMPOTENCY_KEY");
        seen.add(item.idempotency_key);
        return item;
    });
    return { schema_version: 1, dataset_version: "consented-anonymized-observations-v1", purpose: options.analysisPurpose ?? "routine-intelligence-evaluation-v1", records: sanitized, records_count: sanitized.length, dataset_sha256: canonicalHash(sanitized), pii_removed: true, consent_audited: true, training_authorized: false };
}

module.exports = { anonymizeConsentedObservation, buildAnonymizedDataset, pseudonymousId };
