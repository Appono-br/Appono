const assert = require("node:assert/strict");
const test = require("node:test");
const { loadFrontend } = require("./support/load-frontend.cjs");

async function languageStore({ saved = "pt-BR", readable = true, writable = true } = {}) {
  const handlers = new Map();
  let subscribe;
  const document = { documentElement: { lang: "pt-BR" } };
  const window = {
    localStorage: {
      getItem: () => { if (!readable) throw new Error("Storage blocked"); return saved; },
      setItem: (_, value) => { if (!writable) throw new Error("Storage blocked"); saved = value; },
    },
    addEventListener: (name, handler) => handlers.set(name, handler),
    removeEventListener: (name) => handlers.delete(name),
    dispatchEvent: (event) => handlers.get(event.type)?.(event),
  };
  const { useIdiomaLocal } = await loadFrontend("lib/use-idioma-local.js", {
    globals: { window, document, Event: class Event { constructor(type) { this.type = type; } } },
    mocks: { react: { useSyncExternalStore: (inscrever, obter) => { subscribe = inscrever; return obter(); } } },
  });
  useIdiomaLocal();
  let updates = 0;
  const unsubscribe = subscribe(() => updates++);
  return { useIdiomaLocal, document, window, unsubscribe, updates: () => updates };
}

test("Saved English is restored and toggling returns to Portuguese", async () => {
  const store = await languageStore({ saved: "en" });
  assert.equal(store.useIdiomaLocal().idioma, "en");
  store.useIdiomaLocal().alternarIdioma();
  assert.equal(store.useIdiomaLocal().idioma, "pt-BR");
  store.useIdiomaLocal().alternarIdioma();
  assert.equal(store.useIdiomaLocal().idioma, "en");
  assert.equal(store.document.documentElement.lang, "en");
});

test("English toggling works when storage reads succeed but writes are blocked", async () => {
  const store = await languageStore({ writable: false });
  store.useIdiomaLocal().alternarIdioma();
  assert.equal(store.useIdiomaLocal().idioma, "en");
  store.useIdiomaLocal().alternarIdioma();
  assert.equal(store.useIdiomaLocal().idioma, "pt-BR");
});

test("Language works without storage access and syncs language changes from other tabs", async () => {
  const store = await languageStore({ readable: false, writable: false });
  store.useIdiomaLocal().alternarIdioma();
  assert.equal(store.useIdiomaLocal().idioma, "en");
  store.window.dispatchEvent({ type: "storage", key: "appono:theme", newValue: "dark" });
  assert.equal(store.useIdiomaLocal().idioma, "en");
  store.window.dispatchEvent({ type: "storage", key: "appono:language", newValue: "pt-BR" });
  assert.equal(store.useIdiomaLocal().idioma, "pt-BR");
  store.window.dispatchEvent({ type: "storage", key: "appono:language", newValue: "en" });
  assert.equal(store.useIdiomaLocal().idioma, "en");
  store.window.dispatchEvent({ type: "storage", key: null, newValue: null });
  assert.equal(store.useIdiomaLocal().idioma, "pt-BR");
  store.unsubscribe();
});
