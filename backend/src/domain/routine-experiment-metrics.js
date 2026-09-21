"use strict";

function media(valores) {
    const validos = valores.map(Number).filter(Number.isFinite);
    return validos.length ? Number((validos.reduce((soma, valor) => soma + valor, 0) / validos.length).toFixed(3)) : 0;
}

function semanaIso(data) {
    const instante = new Date(data);
    if (Number.isNaN(instante.getTime())) return "sem-data";
    const dia = instante.getUTCDay() || 7;
    instante.setUTCDate(instante.getUTCDate() - dia + 1);
    return instante.toISOString().slice(0, 10);
}

function agregarMetricasExperimento(linhas = []) {
    const modelos = new Map();
    const semanas = new Map();
    for (const linha of linhas) {
        const nome = linha.modelo_desafiante || "desconhecido";
        const atual = modelos.get(nome) ?? { linhas: [], concordancias: 0, divergencias: 0, falhas: 0, restaurantes: new Set(), produtos: new Set() };
        atual.linhas.push(linha);
        atual[linha.divergiu ? "divergencias" : "concordancias"] += 1;
        if (linha.falhou) atual.falhas += 1;
        if (linha.id_restaurante_desafiante) atual.restaurantes.add(linha.id_restaurante_desafiante);
        if (linha.id_produto_desafiante) atual.produtos.add(linha.id_produto_desafiante);
        modelos.set(nome, atual);
        const chaveSemana = semanaIso(linha.criado_em);
        const semana = semanas.get(chaveSemana) ?? { semana_inicio: chaveSemana, comparacoes: 0, divergencias: 0, falhas: 0 };
        semana.comparacoes += 1;
        if (linha.divergiu) semana.divergencias += 1;
        if (linha.falhou) semana.falhas += 1;
        semanas.set(chaveSemana, semana);
    }
    const porModelo = [...modelos.entries()].map(([modelo, grupo]) => ({
        modelo,
        comparacoes: grupo.linhas.length,
        concordancias: grupo.concordancias,
        divergencias: grupo.divergencias,
        falhas: grupo.falhas,
        confianca_media: media(grupo.linhas.map((item) => item.confianca_desafiante)),
        volume_efetivo_medio: media(grupo.linhas.map((item) => item.volume_efetivo_desafiante)),
        consistencia_media: media(grupo.linhas.map((item) => item.consistencia_desafiante)),
        com_historico: grupo.linhas.filter((item) => Number(item.amostras_desafiante) > 0).length,
        sem_historico: grupo.linhas.filter((item) => Number(item.amostras_desafiante) === 0).length,
        diversidade: { restaurantes: grupo.restaurantes.size, produtos: grupo.produtos.size },
        distribuicao_confianca: {
            zero: grupo.linhas.filter((item) => Number(item.confianca_desafiante) === 0).length,
            baixa: grupo.linhas.filter((item) => Number(item.confianca_desafiante) > 0 && Number(item.confianca_desafiante) < 0.5).length,
            moderada: grupo.linhas.filter((item) => Number(item.confianca_desafiante) >= 0.5 && Number(item.confianca_desafiante) < 0.75).length,
            alta: grupo.linhas.filter((item) => Number(item.confianca_desafiante) >= 0.75).length,
        },
        resultados: {
            aprovacoes: grupo.linhas.filter((item) => item.aprovado_em).length,
            recusas: grupo.linhas.filter((item) => item.recusado_em).length,
            alternativas: grupo.linhas.filter((item) => item.alternativa_solicitada_em).length,
            edicoes: grupo.linhas.filter((item) => item.editado_em).length,
            conversoes: grupo.linhas.filter((item) => item.convertido_reserva_em || item.convertido_pedido_em).length,
            feedbacks_positivos: grupo.linhas.filter((item) => item.feedback_positivo_em).length,
            feedbacks_negativos: grupo.linhas.filter((item) => item.feedback_negativo_em).length,
        },
    })).sort((a, b) => a.modelo.localeCompare(b.modelo));
    return {
        comparacoes: linhas.length,
        modelos: porModelo,
        semanas: [...semanas.values()].sort((a, b) => a.semana_inicio.localeCompare(b.semana_inicio)),
    };
}

module.exports = { agregarMetricasExperimento, semanaIso };
