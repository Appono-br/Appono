"use strict";

const crypto = require("node:crypto");

function obterChave(valor = process.env.APPONO_CALENDAR_TOKEN_ENCRYPTION_KEY) {
    const texto = String(valor ?? "").trim();
    let chave;
    if (/^[a-f\d]{64}$/i.test(texto)) chave = Buffer.from(texto, "hex");
    else {
        try { chave = Buffer.from(texto, "base64"); }
        catch { chave = null; }
    }
    if (!chave || chave.length !== 32) {
        const erro = new Error("A chave de proteção da agenda não está configurada.");
        erro.code = "CALENDAR_ENCRYPTION_KEY_MISSING";
        throw erro;
    }
    return chave;
}

function cifrar(valor, chaveConfigurada) {
    if (valor === null || valor === undefined || valor === "") return null;
    const chave = obterChave(chaveConfigurada);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", chave, iv);
    const conteudo = Buffer.concat([cipher.update(String(valor), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${conteudo.toString("base64url")}`;
}

function decifrar(valor, chaveConfigurada) {
    if (!valor) return null;
    const [versao, ivTexto, tagTexto, conteudoTexto] = String(valor).split(".");
    if (versao !== "v1" || !ivTexto || !tagTexto || !conteudoTexto) throw new Error("Segredo de agenda inválido.");
    const decipher = crypto.createDecipheriv("aes-256-gcm", obterChave(chaveConfigurada), Buffer.from(ivTexto, "base64url"));
    decipher.setAuthTag(Buffer.from(tagTexto, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(conteudoTexto, "base64url")), decipher.final()]).toString("utf8");
}

module.exports = { cifrar, decifrar, obterChave };
