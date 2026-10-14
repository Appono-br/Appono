const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { loadFrontend } = require("./support/load-frontend.cjs");

test("English translates accented, unaccented, decomposed and ellipsis variants", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  assert.equal(ui("Configurações", "en"), "Settings");
  assert.equal(ui("Configuracoes", "en"), "Settings");
  assert.equal(ui("Configurações".normalize("NFD"), "en"), "Settings");
  assert.equal(ui("Carregando…", "en"), "Loading...");
  assert.equal(ui(" \n Salvar alterações\t", "en"), " \n Save changes\t");
});

test("Expanded UI templates translate without changing names, numbers or addresses", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  assert.equal(ui("Até 20 km", "en"), "Within 20 km");
  assert.equal(ui("Remover Café São João dos favoritos", "en"), "Remove Café São João from favorites");
  assert.equal(ui("Busca próxima de Rua  São José, 42", "en"), "Search near Rua  São José, 42");
  assert.equal(ui("7 notificações não lidas", "en"), "7 unread notifications");
});

test("Portuguese and unknown or user-authored content stay unchanged", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  for (const texto of ["  ", "\nConfigurações\t", "Pedido #123 confirmado", "Café São João", "constructor", "Olá Ana, até amanhã", "123 ABC em São Paulo"]) {
    assert.equal(ui(texto, "pt-BR"), texto);
  }
  for (const texto of ["  ", "Café São João", "constructor", "Olá Ana, até amanhã", "123 ABC em São Paulo"]) {
    assert.equal(ui(texto, "en"), texto);
  }
});

test("Explicit interpolation translates in both directions and preserves numeric UI values", async () => {
  let idioma = "en";
  const { useInterface } = await loadFrontend("lib/use-interface.js", { mocks: {
    react: { useCallback: (callback) => callback },
    "@/lib/use-idioma-local": { useIdiomaLocal: () => ({ idioma }) },
  } });
  const ingles = useInterface();
  assert.equal(ingles.ui("{0}, {1}. Ver cardápio de {2}", ["Feijoada", "R$ 25", "Café São João"]), "Feijoada, R$ 25. View the menu at Café São João");
  assert.equal(ingles.ui(0), 0);
  assert.equal(ingles.localeUI, "en-US");
  idioma = "pt-BR";
  const portugues = useInterface();
  assert.equal(portugues.ui("Até {0} km", [20]), "Até 20 km");
  assert.equal(portugues.localeUI, "pt-BR");
});

test("Dictionary entries have unique keys and preserve all interpolation parameters", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../lib/interface-en.json"), "utf8");
  const keys = [...source.matchAll(/^\s*("(?:\\.|[^"\\])*")\s*:/gm)].map((match) => JSON.parse(match[1]));
  assert.equal(keys.length, new Set(keys).size, "Duplicate dictionary keys would silently replace translations");
  const parameters = (text) => [...new Set(text.match(/\{\d+\}/g) ?? [])].sort();
  for (const [key, translation] of Object.entries(JSON.parse(source))) {
    assert.equal(typeof translation, "string", key);
    assert.ok(translation.trim(), `Missing translation for ${key}`);
    assert.deepEqual(parameters(translation), parameters(key), `Interpolation parameters changed for ${key}`);
  }
});

test("Routine validation and backend service failures translate without changing field identifiers", async () => {
  const { traduzirTextoInterface: ui } = await loadFrontend("lib/i18n.js");
  const examples = [
    ["A janela de almoço precisa ter início antes do fim.", "The lunch window must start before it ends."],
    ["O campo raio_km não aceita null.", "The raio_km field cannot be null."],
    ["O limite não pode ultrapassar os 90 minutos da janela.", "The limit cannot exceed the 90-minute window."],
    ["Sua sessão expirou. Entre novamente para continuar.", "Your session has expired. Sign in again to continue."],
    ["O serviço demorou para responder. Tente novamente em instantes.", "The service took too long to respond. Please try again shortly."],
    ["O planejamento foi salvo, mas não foi possível enviá-lo ao Google Agenda.", "The plan was saved, but could not be sent to Google Calendar."],
  ];
  for (const [portuguese, english] of examples) {
    assert.equal(ui(portuguese, "en"), english);
    assert.equal(ui(portuguese, "pt-BR"), portuguese);
  }
});
