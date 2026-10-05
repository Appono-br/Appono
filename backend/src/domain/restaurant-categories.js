"use strict";
const CATEGORIAS_CULINARIAS = Object.freeze(["Brasileira", "Italiana", "Japonesa", "Chinesa", "Árabe", "Mexicana", "Hamburgueria", "Pizzaria", "Vegetariana", "Vegana", "Cafeteria", "Padaria", "Doceria", "Saudável", "Frutos do mar", "Churrascaria", "Contemporânea", "Outra"]);
const categoriasPermitidas = new Set(CATEGORIAS_CULINARIAS);
function normalizarCategorias(valor) {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor) || valor.length > 8) return null;
  const categorias = [...new Set(valor.map((item) => String(item).trim()).filter(Boolean))];
  return categorias.every((item) => categoriasPermitidas.has(item)) ? categorias : null;
}
module.exports = { CATEGORIAS_CULINARIAS, normalizarCategorias };
