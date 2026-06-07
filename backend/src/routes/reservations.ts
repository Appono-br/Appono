import { Router } from "express";
import { createUserSupabaseClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

type ReservationBody = {
  id_restaurante?: number;
  id_mesa?: number;
  data_reserva?: string;
  horario_inicio?: string;
  horario_fim?: string;
  quantidade_pessoas?: number;
  observacoes?: string;
};

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

reservationsRouter.get("/", async (_req, res) => {
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  const { data, error } = await supabase
    .from("reservas")
    .select(
      "*, restaurantes(nome, endereco), mesas(numero_mesa, capacidade), pedidos(id_pedido, status_pedido, valor_total)",
    )
    .order("data_reserva", { ascending: true })
    .order("horario_inicio", { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});

reservationsRouter.post("/", async (req, res) => {
  const body = req.body as ReservationBody;
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  if (
    !body.id_restaurante ||
    !body.id_mesa ||
    !body.data_reserva ||
    !body.horario_inicio ||
    !body.horario_fim ||
    !body.quantidade_pessoas
  ) {
    return res.status(400).json({ error: "Dados da reserva incompletos." });
  }

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id_cliente")
    .single();

  if (clienteError || !cliente) {
    return res.status(403).json({ error: "Apenas clientes podem criar reservas." });
  }

  const { data, error } = await supabase
    .from("reservas")
    .insert({
      id_cliente: cliente.id_cliente,
      id_restaurante: body.id_restaurante,
      id_mesa: body.id_mesa,
      data_reserva: body.data_reserva,
      horario_inicio: body.horario_inicio,
      horario_fim: body.horario_fim,
      quantidade_pessoas: body.quantidade_pessoas,
      observacoes: body.observacoes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return res.status(409).json({ error: error.message });
  }

  return res.status(201).json(data);
});

reservationsRouter.patch("/:id/status", async (req, res) => {
  const reservationId = Number(req.params.id);
  const { status_reserva } = req.body as { status_reserva?: string };
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  if (!Number.isFinite(reservationId) || !status_reserva) {
    return res.status(400).json({ error: "Status da reserva invalido." });
  }

  const { data, error } = await supabase
    .from("reservas")
    .update({ status_reserva })
    .eq("id_reserva", reservationId)
    .select("*")
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});
