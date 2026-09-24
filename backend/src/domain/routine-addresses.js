"use strict";

const TIPOS_ENDERECO = Object.freeze(["CASA", "ESCOLA", "TRABALHO", "OUTRO"]);

function texto(valor, limite) {
    return String(valor ?? "").trim().slice(0, limite);
}

function coordenada(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function idSeguro(valor, indice) {
    const id = texto(valor, 48).replace(/[^a-zA-Z0-9_-]/g, "-");
    return id || `endereco-${indice + 1}`;
}

function normalizarEnderecos(valor, enderecoLegado = null) {
    const origem = Array.isArray(valor) ? valor : [];
    const lista = origem.length ? origem : enderecoLegado ? [{ id: "principal", tipo: "CASA", nome: "Casa", endereco: enderecoLegado, ativo: true }] : [];
    const vistos = new Set();
    const enderecos = lista.slice(0, 10).map((item, indice) => {
        const tipo = TIPOS_ENDERECO.includes(String(item?.tipo ?? "").toUpperCase()) ? String(item.tipo).toUpperCase() : "OUTRO";
        let id = idSeguro(item?.id, indice);
        while (vistos.has(id)) id = `${id}-${indice + 1}`;
        vistos.add(id);
        return {
            id,
            tipo,
            nome: texto(item?.nome, 40) || ({ CASA: "Casa", ESCOLA: "Escola", TRABALHO: "Trabalho", OUTRO: "Outro" }[tipo]),
            endereco: texto(item?.endereco, 180),
            endereco_normalizado: texto(item?.endereco_normalizado, 220) || null,
            latitude: coordenada(item?.latitude),
            longitude: coordenada(item?.longitude),
            status_geocodificacao: ["PENDENTE", "CONFIRMADO", "AMBIGUO", "FALHOU"].includes(item?.status_geocodificacao) ? item.status_geocodificacao : "PENDENTE",
            ativo: item?.ativo !== false,
        };
    }).filter((item) => item.endereco.length >= 6);
    const escolhido = enderecos.find((item) => item.ativo) ?? enderecos[0] ?? null;
    return enderecos.map((item) => ({ ...item, ativo: escolhido ? item.id === escolhido.id : false }));
}

function enderecoAtivo(enderecos, enderecoAtivoId = null) {
    const lista = Array.isArray(enderecos) ? enderecos : [];
    return lista.find((item) => item.id === enderecoAtivoId) ?? lista.find((item) => item.ativo) ?? lista[0] ?? null;
}

module.exports = { TIPOS_ENDERECO, enderecoAtivo, normalizarEnderecos };
