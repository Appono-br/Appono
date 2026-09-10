const glossarioPtBrEn = {
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

/**
 * Traduz somente termos aprovados pela aplicação. Conteúdo que não estiver no
 * glossário permanece no idioma original para não alterar nomes, valores ou regras.
 */
export function traduzirConteudoGlossario(texto, idioma) {
  if (idioma !== "en") return String(texto ?? "");
  return glossarioPtBrEn[normalizar(texto)] ?? String(texto ?? "");
}
