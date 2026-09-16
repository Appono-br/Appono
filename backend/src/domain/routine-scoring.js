"use strict";

const MODELO_RECOMENDACAO_ROTINA = Object.freeze({
    versao: "deterministico-v3",
    pesos: Object.freeze({
        restaurante_favorito: 20,
        dentro_orcamento: 20,
        distancia_menor_2km: 15,
        avaliacao_maior_4: 10,
        preferencia_ou_prato_favorito: 10,
        divisor_penalidade_operacional: 5,
        repeticao_restaurante: 3,
        repeticao_produto: 2,
        repeticao_categoria: 1,
        limite_penalidade_repeticao: 15,
        feedback_restaurante: 2,
        feedback_produto: 4,
        limite_impacto_feedback: 8,
    }),
});

function pontuarCandidato({ favoritoRestaurante, dentroOrcamento, perto, bemAvaliado, combinaPreferencia, scoreOperacional }) {
    const p = MODELO_RECOMENDACAO_ROTINA.pesos;
    const penalidadeOperacional = Number(((100 - scoreOperacional) / p.divisor_penalidade_operacional).toFixed(2));
    const componentes = {
        favorito_restaurante: favoritoRestaurante ? p.restaurante_favorito : 0,
        dentro_orcamento: dentroOrcamento ? p.dentro_orcamento : 0,
        distancia_menor_2km: perto ? p.distancia_menor_2km : 0,
        avaliacao_maior_4: bemAvaliado ? p.avaliacao_maior_4 : 0,
        preferencia_produto: combinaPreferencia ? p.preferencia_ou_prato_favorito : 0,
        penalidade_operacional: -penalidadeOperacional,
    };
    return {
        pontuacao: Number(Object.values(componentes).reduce((total, valor) => total + valor, 0).toFixed(2)),
        componentes,
    };
}

function penalidadeRepeticao({ restaurantes = 0, produtos = 0, categorias = 0 }) {
    const p = MODELO_RECOMENDACAO_ROTINA.pesos;
    return Math.min(p.limite_penalidade_repeticao,
        restaurantes * p.repeticao_restaurante + produtos * p.repeticao_produto + categorias * p.repeticao_categoria);
}

function impactoFeedback(feedbacks = [], { idRestaurante, idProduto } = {}) {
    const p = MODELO_RECOMENDACAO_ROTINA.pesos;
    let impacto = 0;
    for (const feedback of feedbacks) {
        if (feedback?.consentiu_personalizacao !== true || feedback?.gostou === undefined) continue;
        const sinal = feedback.gostou ? 1 : -1;
        if (Number(feedback.id_restaurante) === Number(idRestaurante)) impacto += sinal * p.feedback_restaurante;
        if (idProduto && Number(feedback.id_produto) === Number(idProduto)) impacto += sinal * p.feedback_produto;
    }
    return Math.max(-p.limite_impacto_feedback, Math.min(p.limite_impacto_feedback, impacto));
}

module.exports = { MODELO_RECOMENDACAO_ROTINA, impactoFeedback, penalidadeRepeticao, pontuarCandidato };
