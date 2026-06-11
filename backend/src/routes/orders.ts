import { Router } from "express";
import { createUserSupabaseClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

type OrderAdditional = {
  id_adicional: number;
  quantidade: number;
};

type OrderItem = {
  id_produto: number;
  quantidade: number;
  observacoes?: string;
  adicionais?: OrderAdditional[];
};

type OrderBody = {
  id_reserva?: number;
  observacoes?: string;
  itens?: OrderItem[];
};

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get("/", async (_req, res) => {
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "*, restaurantes(nome), reservas(data_reserva, horario_inicio), itens_pedido(*, produtos(nome, imagem_url), item_adicional(*, adicionais(nome)))",
    )
    .order("data_pedido", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});

ordersRouter.post("/", async (req, res) => {
  const body = req.body as OrderBody;
  const supabase = createUserSupabaseClient(res.locals.accessToken);

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

ordersRouter.patch("/:id/status", async (req, res) => {
  const orderId = Number(req.params.id);
  const { status_pedido } = req.body as { status_pedido?: string };
  const supabase = createUserSupabaseClient(res.locals.accessToken);
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
