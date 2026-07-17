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
        .select("*, restaurantes(nome), reservas(data_reserva, horario_inicio), itens_pedido(*, produtos(nome, imagem_url), item_adicional(*, adicionais(nome)))")
        .order("data_pedido", { ascending: false });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
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
        return res.status(409).json({ error: error.message });
    }
    return res.status(201).json(data);
});
exports.ordersRouter.patch("/:id/status", async (req, res) => {
    const orderId = Number(req.params.id);
    const { status_pedido } = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const statusesPermitidos = ["CONFIRMADO", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"];
    if (!Number.isFinite(orderId) || !status_pedido || !statusesPermitidos.includes(status_pedido)) {
        return res.status(400).json({ error: "Status do pedido invalido." });
    }
    const { data, error } = await supabase
        .from("pedidos")
        .update({ status_pedido })
        .eq("id_pedido", orderId)
        .select("*")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
