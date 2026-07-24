"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
exports.ordersRouter = (0, express_1.Router)();
exports.ordersRouter.use(auth_1.requireAuth);
exports.ordersRouter.get("/", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("pedidos")
        .select("*, restaurantes(nome), reservas(data_reserva, horario_inicio)")
        .order("data_pedido", { ascending: false });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const pedidos = data ?? [];
    const idsPedidos = pedidos.map((pedido) => pedido.id_pedido);
    if (!idsPedidos.length) {
        return res.json(pedidos);
    }
    const clienteItens = supabase_1.supabaseAdmin ?? supabase;
    const { data: itens, error: itensError } = await clienteItens
        .from("itens_pedido")
        .select("id_pedido, quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos), item_adicional(*, adicionais(nome))")
        .in("id_pedido", idsPedidos);
    if (itensError) {
        return res.json(pedidos.map((pedido) => ({ ...pedido, itens_pedido: [] })));
    }
    return res.json(pedidos.map((pedido) => ({
        ...pedido,
        itens_pedido: (itens ?? []).filter((item) => item.id_pedido === pedido.id_pedido),
    })));
});
exports.ordersRouter.post("/", async (req, res) => {
    const body = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!body.id_reserva || !body.itens?.length) {
        return res.status(400).json({ error: "Pedido sem reserva ou itens." });
    }
    const { data, error } = await supabase.rpc("criar_pedido_antecipado", {
        reserva_id: body.id_reserva,
        itens: body.itens.map((item) => ({
            id_produto: item.id_produto,
            quantidade: item.quantidade,
            observacoes: item.observacoes ?? null,
        })),
        observacoes_cliente: body.observacoes ?? null,
    });
    if (error) {
        const mensagem = error.message.includes("ja possui um pedido ativo")
            ? "Esta reserva ja possui um pedido antecipado ativo."
            : error.message.includes("produtos sao invalidos") || error.message.includes("indisponiveis")
                ? "Um ou mais itens do cardapio ficaram indisponiveis. Atualize a pagina e escolha novamente."
                : error.message.includes("reserva iniciada")
                    ? "Nao e possivel criar pedido para uma reserva que ja iniciou."
                    : error.message.includes("reserva confirmada")
                        ? "O pedido antecipado exige uma reserva confirmada."
                        : error.message;
        return res.status(409).json({ error: mensagem });
    }
    return res.status(201).json(data);
});
exports.ordersRouter.patch("/:id/cancelar", async (req, res) => {
    const orderId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(orderId)) {
        return res.status(400).json({ error: "Pedido invalido." });
    }
    const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id_cliente")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (clienteError) {
        return res.status(400).json({ error: clienteError.message });
    }
    if (!cliente) {
        return res.status(403).json({ error: "Apenas o cliente pode cancelar o proprio pedido." });
    }
    const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_cliente, status_pedido, reservas(data_reserva, horario_inicio)")
        .eq("id_pedido", orderId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (pedidoError) {
        return res.status(400).json({ error: pedidoError.message });
    }
    if (!pedido) {
        return res.status(404).json({ error: "Pedido nao encontrado." });
    }
    if (!["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido)) {
        return res.status(409).json({
            error: "O pedido nao pode ser cancelado porque o preparo ja foi iniciado.",
        });
    }
    const dataReserva = pedido.reservas?.data_reserva;
    const horarioReserva = pedido.reservas?.horario_inicio;
    if (dataReserva && horarioReserva) {
        const dataHoraReserva = new Date(`${dataReserva}T${horarioReserva}`);
        const limiteCancelamento = new Date(dataHoraReserva.getTime() - 30 * 60 * 1000);
        if (new Date() > limiteCancelamento) {
            return res.status(409).json({
                error: "O pedido so pode ser cancelado ate 30 minutos antes da reserva.",
            });
        }
    }
    if (supabase_1.supabaseAdmin) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .update({ status_pedido: "CANCELADO" })
            .eq("id_pedido", orderId)
            .eq("id_cliente", cliente.id_cliente)
            .select("*")
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        return res.json(data);
    }
    const { data, error } = await supabase.rpc("cancelar_pedido_proprio", {
        pedido_id: orderId,
    });
    if (error) {
        const mensagem = error.message.includes("30 minutos")
            ? "O pedido so pode ser cancelado ate 30 minutos antes da reserva."
            : error.message.includes("nao pode mais ser cancelado")
                ? "Este pedido nao pode mais ser cancelado."
                : error.message;
        return res.status(409).json({ error: mensagem });
    }
    return res.json(data);
});
exports.ordersRouter.patch("/:id/status", async (req, res) => {
    const orderId = Number(req.params.id);
    const { status_pedido } = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const statusesPermitidos = ["CONFIRMADO", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"];
    if (!Number.isFinite(orderId) || !status_pedido || !statusesPermitidos.includes(status_pedido)) {
        return res.status(400).json({ error: "Status do pedido invalido." });
    }
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("id_restaurante")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (restauranteError) {
        return res.status(400).json({ error: restauranteError.message });
    }
    if (!restaurante) {
        return res.status(403).json({ error: "Apenas o restaurante pode atualizar o status do pedido." });
    }
    const { data, error } = await supabase
        .from("pedidos")
        .update({ status_pedido })
        .eq("id_pedido", orderId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .select("*, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
