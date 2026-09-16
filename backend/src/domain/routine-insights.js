"use strict";

function flagAtiva(valor) {
    return String(valor ?? "false").trim().toLowerCase() === "true";
}

function dataIsoValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor ?? ""))) return false;
    const data = new Date(`${valor}T12:00:00Z`);
    return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function validarPeriodoMetricas(inicio, fim) {
    if (!dataIsoValida(inicio) || !dataIsoValida(fim)) throw new Error("Informe um período válido.");
    const inicioData = new Date(`${inicio}T12:00:00Z`);
    const fimData = new Date(`${fim}T12:00:00Z`);
    const dias = Math.round((fimData - inicioData) / 86_400_000);
    if (dias < 0 || dias > 90) throw new Error("O período deve ter no máximo 90 dias.");
    return { inicio, fim };
}

module.exports = { dataIsoValida, flagAtiva, validarPeriodoMetricas };
