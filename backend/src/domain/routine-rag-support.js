"use strict";

const { cosineSimilarity } = require("../rag/retrieval-service");

const SIMILARITY_THRESHOLD = 0.40;

function textoProdutoParaEmbedding(produto, restaurante) {
    return [
        produto?.nome,
        produto?.descricao,
        produto?.categorias?.nome,
        produto?.categorias?.descricao,
        restaurante?.nome,
    ].filter(Boolean).join(". ").trim() || "produto";
}

async function prepararSuporteSemantico({ preferencias, restaurantes, embeddingService, threshold = SIMILARITY_THRESHOLD }) {
    if (!embeddingService || !preferencias.length || !restaurantes?.length) return null;
    const textosPref = preferencias.map((p) => String(p).trim()).filter(Boolean);
    if (!textosPref.length) return null;

    const embPrefs = await embeddingService.embed(textosPref);

    const produtos = [];
    for (const restaurante of restaurantes) {
        for (const produto of restaurante.produtos ?? []) {
            if (produto?.disponivel !== true || produto?.arquivado === true) continue;
            produtos.push({ id: produto.id_produto, texto: textoProdutoParaEmbedding(produto, restaurante) });
        }
    }
    if (!produtos.length) return null;

    const maxBatch = 16;
    const embProdutos = [];
    for (let i = 0; i < produtos.length; i += maxBatch) {
        const batch = produtos.slice(i, i + maxBatch).map((p) => p.texto);
        const result = await embeddingService.embed(batch);
        embProdutos.push(...result);
    }

    const mapaSemantico = new Map();
    for (let pi = 0; pi < produtos.length; pi++) {
        let maxSim = 0;
        for (const embPref of embPrefs) {
            const sim = cosineSimilarity(embPref, embProdutos[pi]);
            if (sim > maxSim) maxSim = sim;
        }
        if (maxSim >= threshold) {
            mapaSemantico.set(Number(produtos[pi].id), maxSim);
        }
    }
    return Object.freeze({ mapaSemantico, threshold, totalProdutos: produtos.length, totalPreferencias: textosPref.length });
}

function produtoCombinaSemantico(idProduto, suporteSemantico) {
    if (!suporteSemantico?.mapaSemantico) return false;
    return suporteSemantico.mapaSemantico.has(Number(idProduto));
}

function scoreSemantico(idProduto, suporteSemantico) {
    if (!suporteSemantico?.mapaSemantico) return 0;
    return suporteSemantico.mapaSemantico.get(Number(idProduto)) ?? 0;
}

module.exports = { prepararSuporteSemantico, produtoCombinaSemantico, scoreSemantico, textoProdutoParaEmbedding, SIMILARITY_THRESHOLD };
