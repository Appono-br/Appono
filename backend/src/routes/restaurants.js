"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restaurantsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
exports.restaurantsRouter = (0, express_1.Router)();
function obterClienteLeituraPublica() {
    return supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
}
function ordenarPorExibicaoENome(a, b) {
    const ordemA = Number(a.ordem_exibicao ?? 0);
    const ordemB = Number(b.ordem_exibicao ?? 0);
    if (ordemA !== ordemB) {
        return ordemA - ordemB;
    }
    return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}
function organizarCardapiosPublicos(cardapios) {
    return (cardapios ?? []).map((cardapio) => ({
        ...cardapio,
        categorias: (cardapio.categorias ?? [])
            .filter((categoria) => categoria.ativo !== false && categoria.arquivado !== true)
            .sort(ordenarPorExibicaoENome)
            .map((categoria) => ({
                ...categoria,
                produtos: (categoria.produtos ?? [])
                    .filter((produto) => produto.disponivel === true && produto.arquivado !== true)
                    .sort(ordenarPorExibicaoENome),
            }))
            .filter((categoria) => categoria.produtos.length > 0),
    }));
}
exports.restaurantsRouter.get("/", async (_req, res) => {
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, cep, endereco, horario_funcionamento, logo_url")
        .eq("ativo", true)
        .order("nome");
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
exports.restaurantsRouter.get("/:id", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante invalido." });
    }
    const { data, error } = await obterClienteLeituraPublica()
        .from("restaurantes")
        .select("id_restaurante, nome, telefone, email, endereco, horario_funcionamento, logo_url, valor_minimo_reserva_por_pessoa")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .single();
    if (error) {
        return res.status(404).json({ error: "Restaurante nao encontrado." });
    }
    return res.json(data);
});
exports.restaurantsRouter.get("/:id/cardapio", async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId)) {
        return res.status(400).json({ error: "Restaurante invalido." });
    }
    const { data: cardapios, error: cardapiosError } = await obterClienteLeituraPublica()
        .from("cardapios")
        .select("id_cardapio, nome, descricao, horario_inicio, horario_fim, categorias(id_categoria, nome, descricao, ativo, arquivado, ordem_exibicao, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel, destaque, arquivado, ordem_exibicao))")
        .eq("id_restaurante", restaurantId)
        .eq("ativo", true)
        .eq("categorias.ativo", true)
        .eq("categorias.arquivado", false)
        .eq("categorias.produtos.disponivel", true)
        .eq("categorias.produtos.arquivado", false)
        .order("nome");
    if (cardapiosError) {
        return res.status(400).json({ error: cardapiosError.message });
    }
    return res.json(organizarCardapiosPublicos(cardapios));
});
