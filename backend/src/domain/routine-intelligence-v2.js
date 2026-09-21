"use strict";

const MODELO_INTELIGENCIA_ROTINA_V2 = Object.freeze({
    versao: "appono-intelligence-v2",
    limite_ajuste: 8,
    suavizacao: 3,
    meia_vida_dias: 90,
    limite_confianca: 0.9,
    pesos: Object.freeze({
        restaurante: 2.5,
        produto: 4,
        categoria: 3,
        faixa_preco: 1,
        faixa_distancia: 1,
        janela: 1.5,
        repeticao_consecutiva_restaurante: 2.5,
        repeticao_consecutiva_produto: 1.5,
    }),
    eventos: Object.freeze({
        APROVACAO: 0.25,
        RECUSA: -0.5,
        ALTERNATIVA: -0.4,
        EDICAO: 0.3,
        CONVERSAO_RESERVA: 0.8,
        CONVERSAO_PEDIDO: 1,
        FEEDBACK_POSITIVO: 1.25,
        FEEDBACK_NEGATIVO: -1.25,
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

function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
}

function pesoTemporal(data, referencia) {
    const instante = new Date(data).getTime();
    const agora = new Date(referencia).getTime();
    if (!Number.isFinite(instante) || !Number.isFinite(agora)) return 0;
    const dias = Math.max(0, (agora - instante) / 86400000);
    return 0.5 ** (dias / MODELO_INTELIGENCIA_ROTINA_V2.meia_vida_dias);
}

function tipoEvento(sinal) {
    if (sinal?.tipo_evento) return String(sinal.tipo_evento).toUpperCase();
    if (typeof sinal?.gostou === "boolean") return sinal.gostou ? "FEEDBACK_POSITIVO" : "FEEDBACK_NEGATIVO";
    return null;
}

function valorEvento(sinal) {
    if (sinal?.consentiu_personalizacao !== true) return null;
    const tipo = tipoEvento(sinal);
    let valor = MODELO_INTELIGENCIA_ROTINA_V2.eventos[tipo];
    if (!Number.isFinite(valor)) return null;
    if (tipo === "FEEDBACK_POSITIVO" && sinal.repetiria === true) valor += 0.25;
    if (tipo === "FEEDBACK_NEGATIVO" && sinal.repetiria === false) valor -= 0.25;
    return limitar(valor, -1.5, 1.5);
}

function agregarAfinidade(sinais, extrair, valorCandidato, peso, referencia) {
    if (valorCandidato === null || valorCandidato === undefined || valorCandidato === "") {
        return { ajuste: 0, amostras: 0, volume_efetivo: 0, soma: 0, absoluto: 0 };
    }
    let soma = 0;
    let absoluto = 0;
    let volumeEfetivo = 0;
    let amostras = 0;
    for (const sinal of sinais) {
        const valor = valorEvento(sinal);
        if (valor === null || extrair(sinal) !== valorCandidato) continue;
        const temporal = pesoTemporal(sinal.criado_em ?? referencia, referencia);
        const ponderado = valor * temporal;
        soma += ponderado;
        absoluto += Math.abs(ponderado);
        volumeEfetivo += temporal;
        amostras += 1;
    }
    if (!amostras) return { ajuste: 0, amostras: 0, volume_efetivo: 0, soma: 0, absoluto: 0 };
    return {
        ajuste: Number((peso * soma / (volumeEfetivo + MODELO_INTELIGENCIA_ROTINA_V2.suavizacao)).toFixed(4)),
        amostras,
        volume_efetivo: Number(volumeEfetivo.toFixed(4)),
        soma,
        absoluto,
    };
}

function pontuarInteligenciaRotinaV2({ candidato, sinais = [], tipoJanela = null, referencia = new Date(), sequencia = {} } = {}) {
    const p = MODELO_INTELIGENCIA_ROTINA_V2.pesos;
    const produto = candidato?.produto ?? null;
    const restaurante = candidato?.restaurante ?? null;
    const dimensoes = [
        ["restaurante", (item) => Number(item.id_restaurante) || null, Number(restaurante?.id_restaurante) || null, p.restaurante],
        ["produto", (item) => Number(item.id_produto) || null, Number(produto?.id_produto) || null, p.produto],
        ["categoria", (item) => item.categoria ?? null, produto?.categorias?.nome ?? null, p.categoria],
        ["faixa_preco", (item) => faixaPreco(item.preco_estimado), faixaPreco(candidato?.preco_estimado), p.faixa_preco],
        ["faixa_distancia", (item) => faixaDistancia(item.distancia_km), faixaDistancia(candidato?.distancia_km), p.faixa_distancia],
        ["janela", (item) => item.tipo_janela ?? null, tipoJanela, p.janela],
    ];
    const contribuicoes = {};
    const ids = new Set();
    let somaGlobal = 0;
    let absolutoGlobal = 0;
    let volumeEfetivo = 0;
    for (const [nome, extrair, valor, peso] of dimensoes) {
        const resultado = agregarAfinidade(sinais, extrair, valor, peso, referencia);
        contribuicoes[nome] = Number(resultado.ajuste.toFixed(2));
        somaGlobal += resultado.soma;
        absolutoGlobal += resultado.absoluto;
        volumeEfetivo = Math.max(volumeEfetivo, resultado.volume_efetivo);
        sinais.forEach((sinal, indice) => {
            if (valorEvento(sinal) !== null && pesoTemporal(sinal.criado_em, referencia) > 0 && extrair(sinal) === valor) {
                ids.add(sinal.id_sinal ?? sinal.id_feedback_rotina ?? indice);
            }
        });
    }
    const amostras = ids.size;
    const consistencia = absolutoGlobal > 0 ? Math.abs(somaGlobal) / absolutoGlobal : 0;
    const confiancaBase = volumeEfetivo > 0 ? volumeEfetivo / (volumeEfetivo + 4) : 0;
    const confianca = Number(Math.min(MODELO_INTELIGENCIA_ROTINA_V2.limite_confianca, confiancaBase * consistencia).toFixed(3));
    const penalidadeSequencia = amostras > 0
        ? (Number(sequencia.id_restaurante_anterior) === Number(restaurante?.id_restaurante) ? p.repeticao_consecutiva_restaurante : 0) +
          (produto && Number(sequencia.id_produto_anterior) === Number(produto.id_produto) ? p.repeticao_consecutiva_produto : 0)
        : 0;
    contribuicoes.repeticao_consecutiva = Number((-penalidadeSequencia).toFixed(2));
    const bruto = Object.values(contribuicoes).reduce((total, valor) => total + valor, 0);
    const limite = MODELO_INTELIGENCIA_ROTINA_V2.limite_ajuste;
    return {
        modelo: MODELO_INTELIGENCIA_ROTINA_V2.versao,
        ajuste: amostras ? Number(limitar(bruto, -limite, limite).toFixed(2)) : 0,
        confianca,
        amostras,
        volume_efetivo: Number(volumeEfetivo.toFixed(3)),
        consistencia: Number(consistencia.toFixed(3)),
        contribuicoes,
    };
}

module.exports = {
    MODELO_INTELIGENCIA_ROTINA_V2,
    faixaDistancia,
    faixaPreco,
    pontuarInteligenciaRotinaV2,
    pesoTemporal,
    valorEvento,
};
