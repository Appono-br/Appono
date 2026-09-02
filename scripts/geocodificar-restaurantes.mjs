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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function coordenadaValida(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180;
}

function removerComplementoEndereco(endereco) {
  return String(endereco ?? "")
    .replace(/,\s*(apto|apartamento|sala|bloco|cj|conjunto|loja)\b[^,]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function geocodificarConsulta(consulta) {
  if (!consulta.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("q", `${consulta}, Brasil`);

  const resposta = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Appono MVP contato@appono.com.br",
    },
  });
  if (!resposta.ok) return null;

  const resultados = await resposta.json();
  const resultado = Array.isArray(resultados) ? resultados[0] : null;
  const latitude = Number(resultado?.lat);
  const longitude = Number(resultado?.lon);
  if (!coordenadaValida(latitude, longitude)) return null;
  return { latitude, longitude, display_name: resultado.display_name };
}

async function geocodificar(restaurante) {
  const endereco = String(restaurante.endereco ?? "").trim();
  const enderecoSemComplemento = removerComplementoEndereco(endereco);
  const consultas = [
    [endereco, restaurante.cep].filter(Boolean).join(", "),
    enderecoSemComplemento !== endereco
      ? [enderecoSemComplemento, restaurante.cep].filter(Boolean).join(", ")
      : "",
    enderecoSemComplemento,
    restaurante.cep,
  ].filter(Boolean);

  for (const consulta of [...new Set(consultas)]) {
    const coordenadas = await geocodificarConsulta(consulta);
    if (coordenadas) return coordenadas;
  }

  return null;
}

const { data: restaurantes, error } = await supabase
  .from("restaurantes")
  .select("id_restaurante, nome, cep, endereco, latitude, longitude")
  .eq("ativo", true);

if (error) throw new Error(error.message);

const resultado = [];

for (const restaurante of restaurantes ?? []) {
  if (coordenadaValida(restaurante.latitude === null ? null : Number(restaurante.latitude), restaurante.longitude === null ? null : Number(restaurante.longitude))) {
    resultado.push({ restaurante: restaurante.nome, status: "ja_geocodificado" });
    continue;
  }

  const coordenadas = await geocodificar(restaurante);
  if (!coordenadas) {
    resultado.push({ restaurante: restaurante.nome, status: "nao_encontrado" });
    continue;
  }

  const { error: updateError } = await supabase
    .from("restaurantes")
    .update({
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      geocodificado_em: new Date().toISOString(),
    })
    .eq("id_restaurante", restaurante.id_restaurante);

  if (updateError) {
    resultado.push({ restaurante: restaurante.nome, status: "erro", motivo: updateError.message });
    continue;
  }

  resultado.push({
    restaurante: restaurante.nome,
    status: "geocodificado",
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
  });
}

console.table(resultado);
