import { traduzirTextoInterface } from "./i18n";

const glossarioPtBrEn = {
  "cardápio principal": "Main menu",
  "cardapio principal": "Main menu",
  "entradas": "Starters",
  "pratos principais": "Main courses",
  "sobremesas": "Desserts",
  "bebidas": "Drinks",
  "prato do dia": "Dish of the day",
  "menu executivo": "Executive menu",
  "sem cebola": "No onion",
  "sem lactose": "Lactose-free",
  "sem glúten": "Gluten-free",
  "molho separado": "Sauce on the side",
  "ponto da carne": "Meat doneness",
  "vegetariano": "Vegetarian",
  "vegano": "Vegan",
};

function normalizar(texto) {
  return String(texto ?? "").trim().toLocaleLowerCase("pt-BR");
}

function buscarTraducao(dicionario, texto) {
  const chave = normalizar(texto);
  return Object.hasOwn(dicionario, chave) ? dicionario[chave] : undefined;
}

export function traduzirConteudoGlossario(texto, idioma) {
  if (idioma !== "en") return String(texto ?? "");
  return buscarTraducao(glossarioPtBrEn, texto) ?? String(texto ?? "");
}

const motivosRecomendacaoEn = {
  "restaurante favorito": "favorite restaurant",
  "perto da sua base": "near your base location",
  "dentro do orçamento": "within your budget",
  "bem avaliado": "highly rated",
  "afinidade semântica com suas preferências": "matches the meaning of your preferences",
  "combina com suas preferências": "matches your preferences",
  "considera seus retornos anteriores": "takes your previous feedback into account",
  "melhor opção disponível para sua rotina": "best available option for your routine",
};

const diagnosticosRecomendacaoEn = {
  "há restaurantes fora da distância máxima.": "Some restaurants are beyond the maximum distance.",
  "há restaurantes sem localização cadastrada.": "Some restaurants have no registered location.",
  "há opções acima do orçamento diário.": "Some options exceed your daily budget.",
  "há cardápios incompatíveis com as restrições ou os horários disponíveis.": "Some menus do not match your restrictions or available times.",
};

export function traduzirMotivoRecomendacao(texto, idioma) {
  const original = String(texto ?? "");
  if (idioma !== "en") return original;
  const partes = original.split(",").map((parte) => buscarTraducao(motivosRecomendacaoEn, parte));
  if (partes.length && partes.every(Boolean)) return partes.join(", ");
  const frases = original.trim().split(/(?<=\.)\s+/).map((frase) => buscarTraducao(diagnosticosRecomendacaoEn, frase));
  if (frases.length && frases.every(Boolean)) return frases.join(" ");
  return traduzirTextoInterface(original, idioma);
}
