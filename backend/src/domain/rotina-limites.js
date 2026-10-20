"use strict";

const LIMITE_DIARIO_PADRAO = 45.0;
const LIMITE_SEMANAL_PADRAO = 200.0;
const MAX_SUGESTOES_POR_JANELA = 1;

function validarLimitesOrcamento(perfil) {
    const diario = Number(perfil?.orcamento_diario ?? LIMITE_DIARIO_PADRAO);
    const semanal = Number(perfil?.orcamento_semanal ?? LIMITE_SEMANAL_PADRAO);
    if (!Number.isFinite(diario) || diario <= 0) return { valido: false, motivo: "ORCAMENTO_DIARIO_INVALIDO" };
    if (!Number.isFinite(semanal) || semanal <= 0) return { valido: false, motivo: "ORCAMENTO_SEMANAL_INVALIDO" };
    if (diario * 7 > semanal * 2) return { valido: false, motivo: "DIARIO_INCOMPATIVEL_COM_SEMANAL" };
    return { valido: true, diario, semanal };
}

function verificarLimiteDiario(sugestoes, limiteDiario = LIMITE_DIARIO_PADRAO) {
    const totalDia = sugestoes.reduce((soma, s) => soma + Number(s.preco ?? s.preco_estimado ?? 0), 0);
    const excedeu = totalDia > limiteDiario;
    return {
        totalDia: Math.round(totalDia * 100) / 100,
        limiteDiario,
        excedeu,
        margem: Math.round((limiteDiario - totalDia) * 100) / 100,
    };
}

function verificarLimiteSemanal(sugestoesNaSemana, limiteSemanal = LIMITE_SEMANAL_PADRAO) {
    const totalSemana = sugestoesNaSemana.reduce((soma, s) => soma + Number(s.preco ?? s.preco_estimado ?? 0), 0);
    const excedeu = totalSemana > limiteSemanal;
    return {
        totalSemana: Math.round(totalSemana * 100) / 100,
        limiteSemanal,
        excedeu,
        margem: Math.round((limiteSemanal - totalSemana) * 100) / 100,
    };
}

function filtrarSugestoesDentroDoOrcamento(sugestoes, { gastosDia = 0, gastosSemana = 0, limiteDiario = LIMITE_DIARIO_PADRAO, limiteSemanal = LIMITE_SEMANAL_PADRAO } = {}) {
    let saldoDia = limiteDiario - gastosDia;
    let saldoSemana = limiteSemanal - gastosSemana;
    const aceitas = [];
    const rejeitadas = [];
    for (const s of sugestoes) {
        const preco = Number(s.preco ?? s.preco_estimado ?? 0);
        if (preco <= saldoDia && preco <= saldoSemana) {
            aceitas.push(s);
            saldoDia -= preco;
            saldoSemana -= preco;
        } else {
            rejeitadas.push({
                ...s,
                motivo_rejeicao: preco > saldoDia ? "EXCEDE_LIMITE_DIARIO" : "EXCEDE_LIMITE_SEMANAL",
            });
        }
    }
    return { aceitas, rejeitadas, saldoDia: Math.round(saldoDia * 100) / 100, saldoSemana: Math.round(saldoSemana * 100) / 100 };
}

module.exports = {
    LIMITE_DIARIO_PADRAO,
    LIMITE_SEMANAL_PADRAO,
    MAX_SUGESTOES_POR_JANELA,
    validarLimitesOrcamento,
    verificarLimiteDiario,
    verificarLimiteSemanal,
    filtrarSugestoesDentroDoOrcamento,
};
