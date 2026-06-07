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
  id_restaurante?: number;
  id_reserva?: number | null;
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

  if (!body.id_restaurante || !body.itens?.length) {
    return res.status(400).json({ error: "Pedido sem restaurante ou itens." });
  }

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id_cliente")
    .single();

  if (clienteError || !cliente) {
    return res.status(403).json({ error: "Apenas clientes podem criar pedidos." });
  }

  const productIds = body.itens.map((item) => item.id_produto);
  const { data: produtos, error: produtosError } = await supabase
    .from("produtos")
    .select("id_produto, preco")
    .in("id_produto", productIds);

  if (produtosError || !produtos) {
    return res.status(400).json({ error: produtosError?.message ?? "Produtos invalidos." });
  }

  const priceByProduct = new Map(
    produtos.map((produto) => [produto.id_produto, Number(produto.preco)]),
  );

  const valorTotal = body.itens.reduce((total, item) => {
    const preco = priceByProduct.get(item.id_produto);
    return total + (preco ?? 0) * item.quantidade;
  }, 0);

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      id_cliente: cliente.id_cliente,
      id_restaurante: body.id_restaurante,
      id_reserva: body.id_reserva ?? null,
      valor_total: valorTotal,
      observacoes: body.observacoes ?? null,
    })
    .select("*")
    .single();

  if (pedidoError || !pedido) {
    return res.status(400).json({ error: pedidoError?.message ?? "Erro ao criar pedido." });
  }

  const itens = body.itens.map((item) => ({
    id_pedido: pedido.id_pedido,
    id_produto: item.id_produto,
    quantidade: item.quantidade,
    preco_unitario: priceByProduct.get(item.id_produto) ?? 0,
    observacoes: item.observacoes ?? null,
  }));

  const { data: itensCriados, error: itensError } = await supabase
    .from("itens_pedido")
    .insert(itens)
    .select("id_item, id_produto");

  if (itensError || !itensCriados) {
    return res.status(400).json({ error: itensError?.message ?? "Erro ao criar itens." });
  }

  const itemIdByProduct = new Map(
    itensCriados.map((item) => [item.id_produto, item.id_item]),
  );

  const adicionais = body.itens.flatMap((item) =>
    (item.adicionais ?? []).map((adicional) => ({
      id_item: itemIdByProduct.get(item.id_produto),
      id_adicional: adicional.id_adicional,
      quantidade: adicional.quantidade,
    })),
  );

  if (adicionais.length) {
    const { error: adicionaisError } = await supabase
      .from("item_adicional")
      .insert(adicionais);

    if (adicionaisError) {
      return res.status(400).json({ error: adicionaisError.message });
    }
  }

  return res.status(201).json(pedido);
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const orderId = Number(req.params.id);
  const { status_pedido } = req.body as { status_pedido?: string };
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  if (!Number.isFinite(orderId) || !status_pedido) {
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
