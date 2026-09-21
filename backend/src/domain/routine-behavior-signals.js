"use strict";

const { createHash } = require("node:crypto");

const TIPOS_SINAL_ROTINA = new Set([
    "APROVACAO",
    "RECUSA",
    "ALTERNATIVA",
    "EDICAO",
    "CONVERSAO_RESERVA",
    "CONVERSAO_PEDIDO",
]);

function objetoOrdenado(valor) {
    if (Array.isArray(valor)) return valor.map(objetoOrdenado);
    if (!valor || typeof valor !== "object") return valor;
    return Object.fromEntries(Object.keys(valor).sort().map((chave) => [chave, objetoOrdenado(valor[chave])]));
}

function chaveSinal({ tipoEvento, idRefeicao, atributos = {} }) {
    const resumo = JSON.stringify(objetoOrdenado(atributos));
    const hash = createHash("sha256").update(resumo).digest("hex").slice(0, 24);
    return `rotina:${tipoEvento}:${idRefeicao}:${hash}`;
}

function normalizarSinalComportamental({ tipoEvento, refeicao, atributos = {}, ocorreuEm = new Date() }) {
    const tipo = String(tipoEvento ?? "").toUpperCase();
    const idRefeicao = Number(refeicao?.id_refeicao_planejada);
    const instante = new Date(ocorreuEm);
    if (!TIPOS_SINAL_ROTINA.has(tipo) || !Number.isInteger(idRefeicao) || idRefeicao <= 0 || Number.isNaN(instante.getTime())) {
        throw new TypeError("Sinal comportamental invalido");
    }
    const escolhas = objetoOrdenado(atributos && typeof atributos === "object" && !Array.isArray(atributos) ? atributos : {});
    return {
        tipo_evento: tipo,
        id_refeicao_planejada: idRefeicao,
        id_restaurante: Number(refeicao.id_restaurante) || null,
        id_produto: Number(refeicao.id_produto) || null,
        id_janela_alimentacao: Number(refeicao.id_janela_alimentacao) || null,
        ocorreu_em: instante.toISOString(),
        atributos_escolhidos: escolhas,
        chave_idempotencia: chaveSinal({ tipoEvento: tipo, idRefeicao, atributos: escolhas }),
    };
}

async function registrarSinalComportamental(banco, { idCliente, tipoEvento, refeicao, atributos, origem = "ROTINA_API" }) {
    const sinal = normalizarSinalComportamental({ tipoEvento, refeicao, atributos });
    const { data: consentimento, error: erroConsentimento } = await banco
        .from("consentimentos_personalizacao_rotina")
        .select("habilitado,versao_texto,concedido_em")
        .eq("id_cliente", idCliente)
        .maybeSingle();
    if (erroConsentimento) throw erroConsentimento;
    const consentimentoValido = consentimento?.habilitado === true
        && Boolean(consentimento.concedido_em)
        && new Date(sinal.ocorreu_em) >= new Date(consentimento.concedido_em);
    const { error } = await banco.from("sinais_comportamentais_rotina").upsert({
        ...sinal,
        id_cliente: idCliente,
        origem,
        consentimento_valido: consentimentoValido,
        versao_consentimento: consentimentoValido ? consentimento.versao_texto : null,
    }, { onConflict: "chave_idempotencia", ignoreDuplicates: true });
    if (error) throw error;
    return { registrado: true, consentimento_valido: consentimentoValido };
}

module.exports = {
    TIPOS_SINAL_ROTINA,
    chaveSinal,
    normalizarSinalComportamental,
    registrarSinalComportamental,
};
