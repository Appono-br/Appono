const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { parse } = require("@babel/parser");
const { loadFrontend } = require("./support/load-frontend.cjs");

function walk(node, callback) {
  if (!node || typeof node.type !== "string") return;
  callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, callback));
    else if (value && typeof value === "object") walk(value, callback);
  }
}

function labelsFromSource(relativePath) {
  const source = fs.readFileSync(path.resolve(__dirname, "../..", relativePath), "utf8");
  const ast = parse(source, { sourceType: "unambiguous", plugins: ["jsx"] });
  const labels = [];
  walk(ast, (node) => {
    if (node.type === "ObjectProperty" && node.key.name === "metricas" && node.value.type === "ArrayExpression") {
      for (const metric of node.value.elements) {
        const label = metric.properties?.find((property) => property.key?.name === "label")?.value;
        if (label?.type === "StringLiteral") labels.push(label.value);
      }
    }
    if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression" || node.callee.property.name !== "map" || node.callee.object.type !== "ArrayExpression") return;
    for (const pair of node.callee.object.elements) {
      if (pair?.type === "ArrayExpression" && pair.elements[0]?.type === "StringLiteral" && pair.elements[1]?.type !== "StringLiteral") labels.push(pair.elements[0].value);
    }
  });
  return [...new Set(labels)];
}

test("Restaurant metric labels from populated dashboard, performance and campaign results translate", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  const sources = [
    "backend/src/routes/restaurant-dashboard.js",
    "frontend/app/restaurante/desempenho/page.jsx",
    "frontend/app/restaurante/campanhas/[id]/page.jsx",
  ];
  for (const source of sources) {
    const labels = labelsFromSource(source);
    assert.ok(labels.length >= 4, `No metric labels found in ${source}`);
    for (const label of labels) {
      assert.notEqual(ui(label, "en"), label, `Missing English metric: ${label} (${source})`);
      assert.equal(ui(label, "pt-BR"), label);
    }
  }
});

test("Screenshot labels translate in English, including uppercase and unaccented variants", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  for (const [portuguese, english] of [
    ["Reservas criadas", "Created reservations"],
    ["Pedidos criados", "Created orders"],
    ["Pedidos entregues", "Delivered orders"],
    ["PEDIDOS ATIVOS", "Active orders"],
    ["RESERVAS HOJE", "Today's reservations"],
    ["CARDAPIO PRINCIPAL", "Main menu"],
  ]) {
    assert.equal(ui(portuguese, "en"), english);
    assert.equal(ui(portuguese, "pt-BR"), portuguese);
  }
});

test("Menu default names and sections translate only for display and preserve custom names", async () => {
  const { traduzirConteudoGlossario } = await loadFrontend("lib/glossario-conteudo.js");
  const menu = Object.freeze({ nome: "Cardápio principal", categoria: "Pratos principais", produto: "Parmegiana" });
  assert.equal(traduzirConteudoGlossario(menu.nome, "en"), "Main menu");
  assert.equal(traduzirConteudoGlossario(menu.categoria, "en"), "Main courses");
  assert.equal(traduzirConteudoGlossario(menu.nome, "pt-BR"), menu.nome);
  assert.equal(traduzirConteudoGlossario(menu.categoria, "pt-BR"), menu.categoria);
  assert.equal(traduzirConteudoGlossario(menu.produto, "en"), menu.produto);
  assert.equal(traduzirConteudoGlossario("Cardápio da família João", "en"), "Cardápio da família João");
  assert.equal(menu.nome, "Cardápio principal");
});
