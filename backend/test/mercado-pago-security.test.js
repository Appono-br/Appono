"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { cifrarTokenMercadoPago, decifrarTokenMercadoPago } = require("../src/services/pagamentos/credenciais-restaurante");
const { validarAssinaturaWebhookMercadoPago } = require("../src/services/pagamentos/webhook-security");

function comAmbiente(valores, executar) {
    const anterior = Object.fromEntries(Object.keys(valores).map((chave) => [chave, process.env[chave]]));
    Object.assign(process.env, valores);
    try { executar(); }
    finally {
        for (const [chave, valor] of Object.entries(anterior)) {
            if (valor === undefined) delete process.env[chave];
            else process.env[chave] = valor;
        }
    }
}

test("credencial OAuth do Mercado Pago usa AES-GCM e não retorna o valor em claro", () => {
    comAmbiente({ APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") }, () => {
        const token = "APP_USR-segredo-de-teste";
        const cifrado = cifrarTokenMercadoPago(token);
        assert.notEqual(cifrado, token);
        assert.match(cifrado, /^v1\./);
        assert.equal(decifrarTokenMercadoPago(cifrado), token);
    });
});

test("webhook sem segredo é rejeitado quando assinatura é obrigatória", () => {
    comAmbiente({ MERCADO_PAGO_WEBHOOK_SECRET: "", MERCADO_PAGO_PERMITIR_PRODUCAO: "true", MERCADO_PAGO_WEBHOOK_SIGNATURE_REQUIRED: "true" }, () => {
        assert.equal(validarAssinaturaWebhookMercadoPago({ headers: {} }, "123"), false);
    });
});

test("webhook assinado é aceito com o manifesto do Mercado Pago", () => {
    comAmbiente({ MERCADO_PAGO_WEBHOOK_SECRET: "segredo-webhook", MERCADO_PAGO_PERMITIR_PRODUCAO: "true" }, () => {
        const manifest = "id:123;request-id:req-1;ts:1700000000;";
        const assinatura = crypto.createHmac("sha256", "segredo-webhook").update(manifest).digest("hex");
        assert.equal(validarAssinaturaWebhookMercadoPago({ headers: { "x-request-id": "req-1", "x-signature": `ts=1700000000,v1=${assinatura}` } }, "123"), true);
    });
});
