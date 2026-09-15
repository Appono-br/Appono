"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { rootCertificates } = require("node:tls");
const { X509Certificate } = require("node:crypto");
const { prepararTls } = require("../scripts/start");

test("Node com suporte usa certificados nativos e preserva o ambiente", () => {
    const env = { NODE_EXTRA_CA_CERTS: "custom.pem" };
    const config = prepararTls({ supportsSystemCa: true, env, exportCertificates() { assert.fail("Não deve exportar certificados"); } });
    assert.deepEqual(config.args, ["--use-system-ca"]);
    assert.deepEqual(config.env, env);
});

test("Node antigo no Windows recebe PEM válido e remove o arquivo ao encerrar", () => {
    const env = { PORT: "3001" };
    const config = prepararTls({ platform: "win32", supportsSystemCa: false, env, exportCertificates: () => rootCertificates[0] });
    try {
        assert.deepEqual(config.args, []);
        const certificate = new X509Certificate(readFileSync(config.env.NODE_EXTRA_CA_CERTS));
        assert.equal(certificate.fingerprint256, new X509Certificate(rootCertificates[0]).fingerprint256);
        assert.equal(config.env.PORT, "3001");
        assert.equal(config.env.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
        assert.deepEqual(env, { PORT: "3001" });
    } finally {
        config.cleanup();
    }
    assert.equal(existsSync(config.env.NODE_EXTRA_CA_CERTS), false);
});

test("fallback preserva certificados extras sem alterar o arquivo original", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "appono-test-ca-"));
    const originalPath = path.join(directory, "extra.pem");
    writeFileSync(originalPath, rootCertificates[1]);
    let config;
    try {
        config = prepararTls({ platform: "win32", supportsSystemCa: false, env: { NODE_EXTRA_CA_CERTS: originalPath }, exportCertificates: () => rootCertificates[0] });
        const pem = readFileSync(config.env.NODE_EXTRA_CA_CERTS, "utf8");
        assert.ok(pem.includes(rootCertificates[0]));
        assert.ok(pem.includes(rootCertificates[1]));
        config.cleanup();
        assert.equal(readFileSync(originalPath, "utf8"), rootCertificates[1]);
    } finally {
        config?.cleanup();
        rmSync(directory, { recursive: true, force: true });
    }
});

test("falha na leitura de certificados não desativa a verificação TLS", () => {
    assert.throws(() => prepararTls({ platform: "win32", supportsSystemCa: false, env: {}, exportCertificates: () => "" }), /Nenhum certificado/);
});

test("Node antigo fora do Windows preserva CAs configuradas sem chamar PowerShell", () => {
    const env = { NODE_EXTRA_CA_CERTS: "/custom.pem" };
    const config = prepararTls({ platform: "linux", supportsSystemCa: false, env, exportCertificates() { assert.fail("Não deve chamar PowerShell"); } });
    assert.deepEqual(config.args, []);
    assert.deepEqual(config.env, env);
});
