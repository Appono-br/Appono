import { Router } from "express";
import { supabaseAuth } from "../lib/supabase";

export const restaurantsRouter = Router();

restaurantsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAuth
    .from("restaurantes")
    .select(
      "id_restaurante, nome, telefone, email, cep, endereco, horario_funcionamento, logo_url",
    )
    .eq("ativo", true)
    .order("nome");

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
});

restaurantsRouter.get("/:id/cardapio", async (req, res) => {
  const restaurantId = Number(req.params.id);

  if (!Number.isFinite(restaurantId)) {
    return res.status(400).json({ error: "Restaurante invalido." });
  }

  const { data: cardapios, error: cardapiosError } = await supabaseAuth
    .from("cardapios")
    .select(
      "id_cardapio, nome, descricao, horario_inicio, horario_fim, categorias(id_categoria, nome, descricao, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel))",
    )
    .eq("id_restaurante", restaurantId)
    .eq("ativo", true)
    .eq("categorias.ativo", true)
    .eq("categorias.produtos.disponivel", true)
    .order("nome");

  if (cardapiosError) {
    return res.status(400).json({ error: cardapiosError.message });
  }

  return res.json(cardapios);
});
