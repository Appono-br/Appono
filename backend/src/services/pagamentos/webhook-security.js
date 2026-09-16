"use strict";

const crypto = require("node:crypto");
const paymentConfig = require("./config");

function obterValorAssinatura(xSignature, chave) {
    return String(xSignature ?? "")
        .split(",")
        .map((parte) => parte.trim().split("="))
        .find(([nome]) => nome === chave)?.[1];
}

function assinaturaObrigatoria() {
    return paymentConfig.productionAllowed()
        || String(process.env.MERCADO_PAGO_WEBHOOK_SIGNATURE_REQUIRED ?? "false").trim().toLowerCase() === "true";
}

function validarAssinaturaWebhookMercadoPago(req, paymentId) {
    const secret = paymentConfig.webhookSecret();
    if (!secret) return !assinaturaObrigatoria();

    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];
    const ts = obterValorAssinatura(xSignature, "ts");
    const assinaturaRecebida = obterValorAssinatura(xSignature, "v1");
    if (!xRequestId || !ts || !assinaturaRecebida) return false;

    const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
    const assinaturaCalculada = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    if (!/^[a-f0-9]+$/i.test(assinaturaRecebida) || assinaturaCalculada.length !== assinaturaRecebida.length) return false;
    return crypto.timingSafeEqual(Buffer.from(assinaturaCalculada, "hex"), Buffer.from(assinaturaRecebida, "hex"));
}

module.exports = { assinaturaObrigatoria, validarAssinaturaWebhookMercadoPago };
