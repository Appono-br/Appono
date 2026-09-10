"use strict";
const crypto = require("crypto");

const SENSITIVE_KEYS = /authorization|token|secret|password|senha|cvv|security.?code|card.?number|numero.?cartao/i;
function sanitize(value, depth = 0) {
    if (depth > 4 || value == null) return value;
    if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
    if (typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEYS.test(key) ? "[REDACTED]" : sanitize(item, depth + 1)]));
}
function log(level, event, fields = {}) {
    const entry = { timestamp: new Date().toISOString(), level, event, ...sanitize(fields) };
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(JSON.stringify(entry));
}
function requestContext(req, res, next) {
    const requestId = String(req.headers["x-request-id"] ?? crypto.randomUUID()).slice(0, 128);
    const startedAt = Date.now();
    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => log(res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info", "http_request", { request_id: requestId, method: req.method, path: req.originalUrl.split("?")[0], status: res.statusCode, duration_ms: Date.now() - startedAt, user_id: res.locals.user?.id }));
    next();
}
module.exports = { log, requestContext, sanitize };
