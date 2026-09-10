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

function numeroValido(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function calcularDistanciaKm(origemLatitude, origemLongitude, destinoLatitude, destinoLongitude) {
  const raioTerraKm = 6371;
  const paraRadianos = (valor) => (valor * Math.PI) / 180;
  const deltaLatitude = paraRadianos(destinoLatitude - origemLatitude);
  const deltaLongitude = paraRadianos(destinoLongitude - origemLongitude);
  const a = Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(paraRadianos(origemLatitude)) *
      Math.cos(paraRadianos(destinoLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return raioTerraKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function removerComplementoEndereco(endereco) {
  return String(endereco ?? "")
    .replace(/,\s*(apto|apartamento|sala|bloco|cj|conjunto|loja)\b[^,]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function geocodificar(texto) {
  const consulta = String(texto ?? "").trim();
  if (!consulta) return null;

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
  const latitude = numeroValido(resultado?.lat);
  const longitude = numeroValido(resultado?.lon);

  if (latitude === null || longitude === null) return null;

  return {
    latitude,
    longitude,
    nome: resultado?.display_name ?? consulta,
  };
}

const termoRestaurante = process.argv[2] ?? "outback";
const localizacaoCliente = process.argv.slice(3).join(" ");

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from("restaurantes")
  .select("id_restaurante,nome,endereco,cep,ativo,latitude,longitude,geocodificado_em")
  .ilike("nome", `%${termoRestaurante}%`);

if (error) throw error;

const restaurantes = data ?? [];

console.table(restaurantes.map((restaurante) => ({
  id: restaurante.id_restaurante,
  nome: restaurante.nome,
  ativo: restaurante.ativo,
  cep: restaurante.cep,
  latitude: restaurante.latitude,
  longitude: restaurante.longitude,
  geocodificado_em: restaurante.geocodificado_em,
  endereco: restaurante.endereco,
})));

for (const restaurante of restaurantes) {
  if (numeroValido(restaurante.latitude) !== null && numeroValido(restaurante.longitude) !== null) {
    continue;
  }

  const enderecoSemComplemento = removerComplementoEndereco(restaurante.endereco);
  if (enderecoSemComplemento && enderecoSemComplemento !== restaurante.endereco) {
    const coordenadas = await geocodificar([enderecoSemComplemento, restaurante.cep].filter(Boolean).join(", "));
    console.log("Fallback sem complemento:", coordenadas);
  }
}

if (localizacaoCliente) {
  const origem = await geocodificar(localizacaoCliente);
  console.log("Origem pesquisada:", origem);

  for (const restaurante of restaurantes) {
    const latitude = numeroValido(restaurante.latitude);
    const longitude = numeroValido(restaurante.longitude);
    const distancia = origem && latitude !== null && longitude !== null
      ? calcularDistanciaKm(origem.latitude, origem.longitude, latitude, longitude)
      : null;

    console.log(`${restaurante.nome}: ${distancia === null ? "sem distancia" : `${distancia.toFixed(3)} km`}`);
  }
}
