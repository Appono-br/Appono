"use strict";

function frontendOrigin() {
    return (process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "");
}
function backendPublicUrl() { return (process.env.BACKEND_PUBLIC_URL ?? "").trim().replace(/\/$/, ""); }
function webhookSecret() { return process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ?? ""; }
function isHttpsUrl(url) { return /^https:\/\//i.test(url); }
function productionAllowed() { return String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true"; }
function transferMode() { return String(process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO").trim().toUpperCase(); }
function isRealMarketplace() { return productionAllowed() && ["MARKETPLACE_REAL", "REAL", "PRODUCAO"].includes(transferMode()); }
function isTestToken(token) { return /^TEST-/i.test(String(token ?? "").trim()); }
function checkoutUrl(preference, token) {
    const usarSandbox = !productionAllowed() || isTestToken(token);
    if (usarSandbox && preference?.sandbox_init_point) {
        return preference.sandbox_init_point;
    }
    return preference?.init_point ?? preference?.sandbox_init_point ?? null;
}

module.exports = { backendPublicUrl, checkoutUrl, frontendOrigin, isHttpsUrl, isRealMarketplace, productionAllowed, transferMode, webhookSecret };
