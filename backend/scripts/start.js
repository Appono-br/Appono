"use strict";

const { execFileSync, spawn } = require("node:child_process");
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");

function prepararTls({
    platform = process.platform,
    supportsSystemCa = process.allowedNodeEnvironmentFlags.has("--use-system-ca"),
    env = process.env,
    exportCertificates = exportarCertificadosWindows,
} = {}) {
    if (supportsSystemCa) {
        return { args: ["--use-system-ca"], env: { ...env }, cleanup() {} };
    }
    if (platform !== "win32") {
        return { args: [], env: { ...env }, cleanup() {} };
    }

    // Node antigo não lê o repositório do Windows. Exporte apenas certificados
    // públicos já confiáveis; NODE_EXTRA_CA_CERTS é lido ao iniciar o processo.
    const certificates = exportCertificates();
    if (!certificates.includes("-----BEGIN CERTIFICATE-----")) {
        throw new Error("Nenhum certificado confiável foi encontrado no Windows.");
    }
    const extraCertificates = env.NODE_EXTRA_CA_CERTS
        ? readFileSync(env.NODE_EXTRA_CA_CERTS, "utf8")
        : "";
    const directory = mkdtempSync(path.join(tmpdir(), "appono-ca-"));
    const certificatePath = path.join(directory, "certificates.pem");
    const cleanup = () => rmSync(directory, { recursive: true, force: true });
    try {
        writeFileSync(certificatePath, `${certificates}\n${extraCertificates}`, "utf8");
    } catch (error) {
        cleanup();
        throw error;
    }
    return {
        args: [],
        env: { ...env, NODE_EXTRA_CA_CERTS: certificatePath },
        cleanup,
    };
}

function exportarCertificadosWindows() {
    return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `
        $ErrorActionPreference = 'Stop'
        Get-ChildItem Cert:\\CurrentUser\\Root, Cert:\\LocalMachine\\Root, Cert:\\CurrentUser\\CA, Cert:\\LocalMachine\\CA |
            Sort-Object Thumbprint -Unique |
            ForEach-Object {
                '-----BEGIN CERTIFICATE-----'
                [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks)
                '-----END CERTIFICATE-----'
            }
    `], { encoding: "utf8", windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
}

function iniciar() {
    require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
    const tls = prepararTls();
    const child = spawn(process.execPath, [...tls.args, path.resolve(__dirname, "../src/server.js")], {
        env: tls.env,
        stdio: "inherit",
        windowsHide: true,
    });
    process.once("exit", tls.cleanup);
    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, () => child.kill(signal));
    }
    child.once("error", (error) => {
        console.error("Não foi possível iniciar o backend:", error.message);
        process.exitCode = 1;
    });
    child.once("exit", (code, signal) => {
        process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
    });
}

if (require.main === module) {
    try {
        iniciar();
    } catch (error) {
        console.error("Não foi possível preparar a conexão segura:", error.message);
        process.exitCode = 1;
    }
}

module.exports = { prepararTls };
