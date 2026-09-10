import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../backend/.env");

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match || process.env[match[1]]) continue;
  process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar configuradas em backend/.env.");
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const etapas = [
  { tabela: "notificacoes", coluna: "id_notificacao" },
  { tabela: "solicitacoes_reembolso", coluna: "id_reembolso" },
  { tabela: "eventos_financeiros", coluna: "id_evento" },
  { tabela: "avaliacoes_restaurante", coluna: "id_avaliacao" },
  { tabela: "restaurantes_favoritos", coluna: "id_favorito" },
  { tabela: "item_adicional", coluna: "id_item" },
  { tabela: "itens_pedido", coluna: "id_item" },
  { tabela: "pagamentos", coluna: "id_pagamento" },
  { tabela: "pedidos", coluna: "id_pedido" },
  { tabela: "reservas", coluna: "id_reserva" },
];

const resultado = [];

for (const etapa of etapas) {
  const { count: antes, error: countError } = await supabase
    .from(etapa.tabela)
    .select("*", { count: "exact", head: true });

  if (countError) {
    resultado.push({ tabela: etapa.tabela, status: "ignorada", motivo: countError.message });
    continue;
  }

  const { error } = await supabase
    .from(etapa.tabela)
    .delete({ count: "exact" })
    .not(etapa.coluna, "is", null);

  if (error) {
    resultado.push({ tabela: etapa.tabela, status: "bloqueada", motivo: error.message });
    continue;
  }

  resultado.push({ tabela: etapa.tabela, removidos: antes ?? 0 });
}

console.table(resultado);
