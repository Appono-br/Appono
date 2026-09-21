"use strict";

const MODELO_INTELIGENCIA_ROTINA = Object.freeze({
    versao: "appono-intelligence-v1",
    limite_ajuste: 12,
    suavizacao: 3,
    pesos: Object.freeze({
        adequacao_orcamento: 2,
        adequacao_distancia: 3,
        categoria_aprendida: 4,
        faixa_preco_aprendida: 2,
        faixa_distancia_aprendida: 2,
        janela_aprendida: 2,
    }),
});

function numero(valor) {
    const resultado = Number(valor);
    return Number.isFinite(resultado) ? resultado : null;
}

function faixaPreco(valor) {
    const preco = numero(valor);
    if (preco === null) return null;
    if (preco < 30) return "ATE_30";
    if (preco < 60) return "30_A_60";
    return "ACIMA_60";
}

function faixaDistancia(valor) {
    const distancia = numero(valor);
    if (distancia === null) return null;
    if (distancia < 2) return "ATE_2_KM";
    if (distancia <= 5) return "2_A_5_KM";
    return "ACIMA_5_KM";
}

function sinalFeedback(feedback) {
    if (feedback?.consentiu_personalizacao !== true || typeof feedback.gostou !== "boolean") return null;
    let sinal = feedback.gostou ? 1 : -1;
    if (typeof feedback.repetiria === "boolean") sinal += feedback.repetiria ? 0.5 : -0.5;
    return sinal / 1.5;
}

function afinidade(feedbacks, extrair, valorCandidato, peso) {
    if (valorCandidato === null || valorCandidato === undefined || valorCandidato === "") {
        return { ajuste: 0, amostras: 0 };
    }
    let soma = 0;
    let amostras = 0;
    for (const feedback of feedbacks) {
        const sinal = sinalFeedback(feedback);
        if (sinal === null || extrair(feedback) !== valorCandidato) continue;
        soma += sinal;
        amostras += 1;
    }
    if (!amostras) return { ajuste: 0, amostras: 0 };
    const ajuste = (soma / (amostras + MODELO_INTELIGENCIA_ROTINA.suavizacao)) * peso;
    return { ajuste, amostras };
}

function pontuarInteligenciaRotina({ candidato, perfil = {}, feedbacks = [], tipoJanela = null } = {}) {
    const p = MODELO_INTELIGENCIA_ROTINA.pesos;
    const contribuicoes = {};
    const preco = numero(candidato?.preco_estimado);
    const orcamento = numero(perfil.orcamento_diario);
    if (preco !== null && orcamento !== null && orcamento > 0 && preco <= orcamento) {
        contribuicoes.adequacao_orcamento = Number((Math.max(0, 1 - preco / orcamento) * p.adequacao_orcamento).toFixed(2));
    }
    const distancia = numero(candidato?.distancia_km);
    const raio = numero(perfil.raio_km);
    if (distancia !== null && raio !== null && raio > 0 && distancia <= raio) {
        contribuicoes.adequacao_distancia = Number((Math.max(0, 1 - distancia / raio) * p.adequacao_distancia).toFixed(2));
    }

    const categoria = candidato?.produto?.categorias?.nome ?? null;
    const sinais = [
        ["categoria_aprendida", afinidade(feedbacks, (item) => item.categoria ?? null, categoria, p.categoria_aprendida)],
        ["faixa_preco_aprendida", afinidade(feedbacks, (item) => faixaPreco(item.preco_estimado), faixaPreco(preco), p.faixa_preco_aprendida)],
        ["faixa_distancia_aprendida", afinidade(feedbacks, (item) => faixaDistancia(item.distancia_km), faixaDistancia(distancia), p.faixa_distancia_aprendida)],
        ["janela_aprendida", afinidade(feedbacks, (item) => item.tipo_janela ?? null, tipoJanela, p.janela_aprendida)],
    ];
    let amostras = 0;
    for (const [nome, resultado] of sinais) {
        contribuicoes[nome] = Number(resultado.ajuste.toFixed(2));
        amostras = Math.max(amostras, resultado.amostras);
    }

    const bruto = Object.values(contribuicoes).reduce((total, valor) => total + valor, 0);
    const limite = MODELO_INTELIGENCIA_ROTINA.limite_ajuste;
    const ajuste = Number(Math.max(-limite, Math.min(limite, bruto)).toFixed(2));
    const confianca = Number(Math.min(0.9, 0.35 + Math.min(amostras, 7) * 0.08).toFixed(2));
    return {
        modelo: MODELO_INTELIGENCIA_ROTINA.versao,
        ajuste,
        confianca,
        amostras,
        contribuicoes,
    };
}

module.exports = {
    MODELO_INTELIGENCIA_ROTINA,
    faixaDistancia,
    faixaPreco,
    pontuarInteligenciaRotina,
};
