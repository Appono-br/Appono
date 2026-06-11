import { Router } from "express";
import { createUserSupabaseClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

type ReservationBody = {
  id_restaurante?: number;
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
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id_cliente")
    .maybeSingle();
  const colunaOcultacao = cliente ? "ocultada_cliente" : "ocultada_restaurante";

  const { data, error } = await supabase
    .from("reservas")
    .select(
      "*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade), pedidos(id_pedido, status_pedido, valor_total, horario_entrega_previsto, iniciar_preparo_em, itens_pedido(quantidade, observacoes, produtos(nome)))",
    )
    .eq(colunaOcultacao, false)
    .order("data_reserva", { ascending: true })
    .order("horario_inicio", { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});

reservationsRouter.patch("/:id/ocultar", async (req, res) => {
  const reservationId = Number(req.params.id);
  const supabase = createUserSupabaseClient(res.locals.accessToken);

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

reservationsRouter.post("/", async (req, res) => {
  const body = req.body as ReservationBody;
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  if (
    !body.id_restaurante ||
    !body.data_reserva ||
    !body.horario_inicio ||
    !body.horario_fim ||
    !body.quantidade_pessoas
  ) {
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
    const mensagem =
      error.message.includes("Nao ha mesa disponivel")
        ? "Nao ha mesa disponivel para este horario e quantidade de pessoas."
        : error.message;
    return res.status(409).json({ error: mensagem });
  }

  return res.status(201).json(data);
});

reservationsRouter.get("/:id/cardapio", async (req, res) => {
  const reservationId = Number(req.params.id);
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  if (!Number.isFinite(reservationId)) {
    return res.status(400).json({ error: "Reserva invalida." });
  }

  const { data: reserva, error: reservaError } = await supabase
    .from("reservas")
    .select(
      "id_reserva, id_restaurante, data_reserva, horario_inicio, status_reserva, restaurantes(nome), pedidos(id_pedido, status_pedido, valor_total, itens_pedido(quantidade, observacoes, produtos(nome)))",
    )
    .eq("id_reserva", reservationId)
    .single();

  if (reservaError || !reserva) {
    return res.status(404).json({ error: "Reserva nao encontrada." });
  }

  const { data: cardapios, error: cardapiosError } = await supabase
    .from("cardapios")
    .select(
      "id_cardapio, nome, descricao, categorias(id_categoria, nome, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel))",
    )
    .eq("id_restaurante", reserva.id_restaurante)
    .eq("ativo", true)
    .eq("categorias.ativo", true)
    .eq("categorias.produtos.disponivel", true)
    .order("nome");

  if (cardapiosError) {
    return res.status(400).json({ error: cardapiosError.message });
  }

  return res.json({ reserva, cardapios });
});

reservationsRouter.patch("/:id/cancelar", async (req, res) => {
  const reservationId = Number(req.params.id);
  const supabase = createUserSupabaseClient(res.locals.accessToken);

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
