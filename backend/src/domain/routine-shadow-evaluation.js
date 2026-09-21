"use strict";

function idIgual(a, b) {
    const esquerda = a === null || a === undefined ? null : Number(a);
    const direita = b === null || b === undefined ? null : Number(b);
    return esquerda === direita;
}

function compararRankingSombra(controle, desafiante, modelos = {}, campos = {}) {
    if (!controle || !desafiante) return null;
    const campoPontuacao = campos.pontuacao ?? "pontuacaoDesafiante";
    const campoInteligencia = campos.inteligencia ?? "inteligencia";
    const inteligencia = desafiante[campoInteligencia] ?? {};
    return {
        modelo_controle: modelos.controle,
        modelo_desafiante: modelos.desafiante,
        id_restaurante_controle: controle.restaurante?.id_restaurante ?? null,
        id_produto_controle: controle.produto?.id_produto ?? null,
        pontuacao_controle: controle.pontuacaoControle ?? controle.pontuacaoFinal ?? controle.pontuacao ?? null,
        id_restaurante_desafiante: desafiante.restaurante?.id_restaurante ?? null,
        id_produto_desafiante: desafiante.produto?.id_produto ?? null,
        pontuacao_desafiante: desafiante[campoPontuacao] ?? desafiante.pontuacaoFinal ?? desafiante.pontuacao ?? null,
        confianca_desafiante: inteligencia.confianca ?? null,
        amostras_desafiante: inteligencia.amostras ?? 0,
        volume_efetivo_desafiante: inteligencia.volume_efetivo ?? null,
        consistencia_desafiante: inteligencia.consistencia ?? null,
        metadados_desafiante: {
            modelo: inteligencia.modelo ?? modelos.desafiante,
            ajuste: inteligencia.ajuste ?? 0,
            contribuicoes: inteligencia.contribuicoes ?? {},
        },
        falhou: inteligencia.falhou === true,
        erro_codigo_desafiante: inteligencia.erro_codigo ?? null,
        divergiu: !idIgual(controle.restaurante?.id_restaurante, desafiante.restaurante?.id_restaurante)
            || !idIgual(controle.produto?.id_produto, desafiante.produto?.id_produto),
    };
}

function ordenarPorPontuacao(candidatos, campo) {
    return [...candidatos].sort((a, b) => {
        const distanciaA = a.distancia_km ?? Number.POSITIVE_INFINITY;
        const distanciaB = b.distancia_km ?? Number.POSITIVE_INFINITY;
        return Number(b[campo] ?? b.pontuacao ?? 0) - Number(a[campo] ?? a.pontuacao ?? 0)
            || distanciaA - distanciaB
            || Number(a.preco_estimado ?? 0) - Number(b.preco_estimado ?? 0)
            || String(a.restaurante?.nome ?? "").localeCompare(String(b.restaurante?.nome ?? ""), "pt-BR")
            || String(a.produto?.nome ?? "").localeCompare(String(b.produto?.nome ?? ""), "pt-BR");
    });
}

module.exports = { compararRankingSombra, ordenarPorPontuacao };
