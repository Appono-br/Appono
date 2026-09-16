"use strict";

const crypto = require("node:crypto");

const PROVEDORES_AGENDA = new Set(["GOOGLE", "OUTLOOK"]);

function normalizarProvedor(valor) {
    const provedor = String(valor ?? "").trim().toUpperCase();
    return PROVEDORES_AGENDA.has(provedor) ? provedor : null;
}

function base64Url(buffer) {
    return Buffer.from(buffer).toString("base64url");
}

function criarPkce() {
    const verifier = base64Url(crypto.randomBytes(48));
    const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
    return { verifier, challenge };
}

function criarEstadoOAuth() {
    return base64Url(crypto.randomBytes(32));
}

function hashSeguro(valor) {
    return crypto.createHash("sha256").update(String(valor)).digest("hex");
}

function normalizarIntervalos(intervalos, { inicioPeriodo, fimPeriodo }) {
    const limiteInicio = new Date(inicioPeriodo).getTime();
    const limiteFim = new Date(fimPeriodo).getTime();
    if (!Number.isFinite(limiteInicio) || !Number.isFinite(limiteFim) || limiteInicio >= limiteFim) {
        throw new Error("Período de sincronização inválido.");
    }

    const validos = (Array.isArray(intervalos) ? intervalos : []).map((intervalo) => {
        const inicio = new Date(intervalo.inicio_em ?? intervalo.start).getTime();
        const fim = new Date(intervalo.fim_em ?? intervalo.end).getTime();
        if (!Number.isFinite(inicio) || !Number.isFinite(fim) || inicio >= fim) return null;
        const recortadoInicio = Math.max(inicio, limiteInicio);
        const recortadoFim = Math.min(fim, limiteFim);
        return recortadoInicio < recortadoFim ? { inicio: recortadoInicio, fim: recortadoFim } : null;
    }).filter(Boolean).sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);

    const unidos = [];
    for (const intervalo of validos) {
        const anterior = unidos.at(-1);
        if (anterior && intervalo.inicio <= anterior.fim) anterior.fim = Math.max(anterior.fim, intervalo.fim);
        else unidos.push({ ...intervalo });
    }

    return unidos.map(({ inicio, fim }) => {
        const inicioEm = new Date(inicio).toISOString();
        const fimEm = new Date(fim).toISOString();
        return {
            inicio_em: inicioEm,
            fim_em: fimEm,
            origem_hash: hashSeguro(`${inicioEm}|${fimEm}`),
        };
    });
}

function extrairIntervalosGoogle(resposta) {
    return Object.values(resposta?.calendars ?? {}).flatMap((agenda) => agenda?.busy ?? [])
        .map((item) => ({ start: item.start, end: item.end }));
}

function extrairIntervalosOutlook(resposta) {
    return (resposta?.value ?? []).flatMap((agenda) => agenda?.scheduleItems ?? [])
        .filter((item) => String(item.status ?? "busy").toLowerCase() !== "free")
        .map((item) => ({ start: item.start?.dateTime, end: item.end?.dateTime }));
}

module.exports = {
    criarEstadoOAuth,
    criarPkce,
    extrairIntervalosGoogle,
    extrairIntervalosOutlook,
    hashSeguro,
    normalizarIntervalos,
    normalizarProvedor,
};
