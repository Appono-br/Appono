"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
exports.reservationsRouter = (0, express_1.Router)();
exports.reservationsRouter.use(auth_1.requireAuth);
function ordenarPorExibicaoENome(a, b) {
    const ordemA = Number(a.ordem_exibicao ?? 0);
    const ordemB = Number(b.ordem_exibicao ?? 0);
    if (ordemA !== ordemB) {
        return ordemA - ordemB;
    }
    return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}
function organizarCardapios(cardapios) {
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
exports.reservationsRouter.get("/", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: cliente } = await supabase
        .from("clientes")
        .select("id_cliente")
        .maybeSingle();
    const colunaOcultacao = cliente ? "ocultada_cliente" : "ocultada_restaurante";
    const { data, error } = await supabase
        .from("reservas")
        .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
        .eq(colunaOcultacao, false)
        .order("data_reserva", { ascending: true })
        .order("horario_inicio", { ascending: true });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const reservas = data ?? [];
    const idsReservas = reservas.map((reserva) => reserva.id_reserva);
    if (!idsReservas.length) {
        return res.json(reservas);
    }
    const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_reserva, status_pedido, valor_total, horario_entrega_previsto, iniciar_preparo_em, observacoes, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .in("id_reserva", idsReservas);
    if (pedidosError) {
        return res.json(reservas.map((reserva) => ({ ...reserva, pedidos: [] })));
    }
    return res.json(reservas.map((reserva) => ({
        ...reserva,
        pedidos: (pedidos ?? []).filter((pedido) => pedido.id_reserva === reserva.id_reserva),
    })));
});
exports.reservationsRouter.patch("/:id/ocultar", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const { data, error } = await supabase.rpc("ocultar_reserva_do_historico", {
        reserva_id: reservationId,
    });
    if (error) {
        return res.status(409).json({
            error: "Apenas reservas canceladas podem ser excluidas da lista.",
        });
    }
    return res.json(data);
});
exports.reservationsRouter.post("/", async (req, res) => {
    const body = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!body.id_restaurante ||
        !body.data_reserva ||
        !body.horario_inicio ||
        !body.horario_fim ||
        !body.quantidade_pessoas) {
        return res.status(400).json({ error: "Dados da reserva incompletos." });
    }
    const { data, error } = await supabase.rpc("criar_reserva_com_mesa_disponivel", {
        restaurante_id: body.id_restaurante,
        data_escolhida: body.data_reserva,
        inicio: body.horario_inicio,
        fim: body.horario_fim,
        pessoas: body.quantidade_pessoas,
        observacoes_cliente: body.observacoes ?? null,
    });
    if (error) {
        const mensagem = error.message.includes("Nao ha mesa disponivel")
            ? "Nao ha mesa disponivel para este horario e quantidade de pessoas."
            : error.message;
        return res.status(409).json({ error: mensagem });
    }
    return res.status(201).json(data);
});
exports.reservationsRouter.get("/:id/cardapio", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const { data: reserva, error: reservaError } = await supabase
        .from("reservas")
        .select("id_reserva, id_restaurante, data_reserva, horario_inicio, status_reserva, restaurantes(nome)")
        .eq("id_reserva", reservationId)
        .maybeSingle();
    if (reservaError) {
        return res.status(400).json({ error: reservaError.message });
    }
    if (!reserva) {
        return res.status(404).json({ error: "Reserva nao encontrada." });
    }
    const { data: pedidos } = await supabase
        .from("pedidos")
        .select("id_pedido, id_reserva, status_pedido, valor_total, horario_entrega_previsto, iniciar_preparo_em, observacoes, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .eq("id_reserva", reservationId);
    const { data: cardapios, error: cardapiosError } = await supabase
        .from("cardapios")
        .select("id_cardapio, nome, descricao, categorias(id_categoria, nome, ativo, arquivado, ordem_exibicao, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel, arquivado, ordem_exibicao))")
        .eq("id_restaurante", reserva.id_restaurante)
        .eq("ativo", true)
        .eq("categorias.ativo", true)
        .eq("categorias.arquivado", false)
        .eq("categorias.produtos.disponivel", true)
        .eq("categorias.produtos.arquivado", false)
        .order("nome");
    if (cardapiosError) {
        return res.status(400).json({ error: cardapiosError.message });
    }
    return res.json({ reserva: { ...reserva, pedidos: pedidos ?? [] }, cardapios: organizarCardapios(cardapios) });
});
exports.reservationsRouter.patch("/:id/cancelar", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const { data, error } = await supabase.rpc("cancelar_reserva_propria", {
        reserva_id: reservationId,
    });
    if (error) {
        return res.status(409).json({
            error: error.message.includes("nao pode mais ser cancelada")
                ? "A reserva nao foi encontrada ou nao pode mais ser cancelada."
                : error.message,
        });
    }
    return res.json(data);
});
