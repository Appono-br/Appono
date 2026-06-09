import { Router } from "express";
import { createUserSupabaseClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (_req, res) => {
  const supabase = createUserSupabaseClient(res.locals.accessToken);

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("*")
    .maybeSingle();

  if (clienteError) {
    return res.status(400).json({ error: clienteError.message });
  }

  if (cliente) {
    return res.json({ tipo: "cliente", perfil: cliente });
  }

  const { data: restaurante, error: restauranteError } = await supabase
    .from("restaurantes")
    .select("*, dados_bancarios_restaurante(*)")
    .maybeSingle();

  if (restauranteError) {
    return res.status(400).json({ error: restauranteError.message });
  }

  if (restaurante) {
    return res.json({ tipo: "restaurante", perfil: restaurante });
  }

  return res.status(404).json({ error: "Perfil nao encontrado." });
});
