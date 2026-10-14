const assert = require("node:assert/strict");
const test = require("node:test");
const { loadFrontend } = require("./support/load-frontend.cjs");

class Texto {
  constructor(valor) {
    this.nodeType = 3;
    this.nodeValue = valor;
    this.parentElement = null;
  }
}

class Elemento {
  constructor(tag, atributos = {}, filhos = []) {
    this.tagName = tag.toUpperCase();
    this.nodeType = 1;
    this.atributos = new Map(Object.entries(atributos));
    this.childNodes = [];
    this.parentElement = null;
    filhos.forEach((filho) => this.adicionar(filho));
  }
  adicionar(filho) {
    filho.parentElement = this;
    this.childNodes.push(filho);
    return filho;
  }
  getAttribute(nome) { return this.atributos.get(nome) ?? null; }
  setAttribute(nome, valor) { this.atributos.set(nome, String(valor)); }
  closest(seletor) {
    for (let atual = this; atual; atual = atual.parentElement) {
      if (seletor.includes("[data-appono-sem-traducao]") && atual.atributos.has("data-appono-sem-traducao")) return atual;
      if (seletor.includes('[translate="no"]') && atual.getAttribute("translate") === "no") return atual;
      if (seletor.includes("[contenteditable]") && atual.atributos.has("contenteditable") && atual.getAttribute("contenteditable") !== "false") return atual;
    }
    return null;
  }
}

async function criarTradutor(filhos) {
  const body = new Elemento("body", {}, filhos);
  const document = { body, documentElement: { lang: "pt-BR" } };
  let idiomaAtual = "pt-BR";
  let efeito;
  let limparEfeito;
  const ref = { current: null };
  const observadores = [];
  class Observador {
    constructor(callback) { this.callback = callback; observadores.push(this); }
    observe(alvo, opcoes) { this.alvo = alvo; this.opcoes = opcoes; this.conectado = true; }
    disconnect() { this.conectado = false; }
  }
  const { TradutorInterface } = await loadFrontend("components/internacionalizacao/tradutor-interface.jsx", {
    globals: { document, Element: Elemento, Node: { TEXT_NODE: 3 }, MutationObserver: Observador },
    mocks: {
      react: { useRef: () => ref, useEffect: (callback) => { efeito = callback; } },
      "@/lib/use-idioma-local": { useIdiomaLocal: () => ({ idioma: idiomaAtual }) },
    },
  });
  return {
    body,
    document,
    idioma(idioma) {
      limparEfeito?.();
      idiomaAtual = idioma;
      TradutorInterface();
      limparEfeito = efeito();
    },
    mutacao(mutacao) { observadores.at(-1).callback([mutacao]); },
    observadores,
  };
}

test("restores original text and attributes when toggling languages without replacing React nodes", async () => {
  const texto = new Texto(" Reservas ");
  const botao = new Elemento("button", { title: "Cancelar", "aria-label": "Voltar" }, [texto]);
  const tradutor = await criarTradutor([botao]);
  tradutor.idioma("en");
  assert.equal(texto.nodeValue, " Reservations ");
  assert.equal(botao.getAttribute("title"), "Cancel");
  assert.equal(botao.getAttribute("aria-label"), "Back");
  assert.equal(tradutor.document.documentElement.lang, "en");
  assert.equal(botao.childNodes.length, 1);
  assert.equal(botao.childNodes[0], texto);
  tradutor.idioma("pt-BR");
  assert.equal(texto.nodeValue, " Reservas ");
  assert.equal(botao.getAttribute("title"), "Cancelar");
  assert.equal(botao.getAttribute("aria-label"), "Voltar");
  assert.equal(tradutor.document.documentElement.lang, "pt-BR");
  assert.equal(tradutor.observadores[0].conectado, false);
});

test("translates asynchronous additions and later React text updates", async () => {
  const texto = new Texto("Reservas");
  const paragrafo = new Elemento("p", {}, [texto]);
  const tradutor = await criarTradutor([paragrafo]);
  tradutor.idioma("en");
  texto.nodeValue = "Pedidos";
  tradutor.mutacao({ type: "characterData", target: texto });
  assert.equal(texto.nodeValue, "Orders");
  // Observing the translator's own mutation must be idempotent.
  tradutor.mutacao({ type: "characterData", target: texto });
  assert.equal(texto.nodeValue, "Orders");
  const novoTexto = new Texto("Notificações");
  const novo = tradutor.body.adicionar(new Elemento("p", {}, [novoTexto]));
  tradutor.mutacao({ type: "childList", addedNodes: [novo] });
  assert.equal(novoTexto.nodeValue, "Notifications");
  tradutor.idioma("pt-BR");
  assert.equal(texto.nodeValue, "Pedidos");
  assert.equal(novoTexto.nodeValue, "Notificações");
});

test("translates accessible labels on SVG and images while preserving input and option payloads", async () => {
  const entrada = new Elemento("input", { value: "Pedido", placeholder: "Nome completo", name: "nome" });
  const opcao = new Elemento("option", { value: "CANCELADO" }, [new Texto("Cancelado")]);
  const imagem = new Elemento("img", { alt: "Restaurante" });
  const svg = new Elemento("svg", { "aria-label": "Notificações" });
  const tradutor = await criarTradutor([entrada, opcao, imagem, svg]);
  tradutor.idioma("en");
  assert.equal(entrada.getAttribute("placeholder"), "Full name");
  assert.equal(entrada.getAttribute("value"), "Pedido");
  assert.equal(entrada.getAttribute("name"), "nome");
  assert.equal(opcao.getAttribute("value"), "CANCELADO");
  assert.equal(opcao.childNodes[0].nodeValue, "Cancelled");
  assert.equal(imagem.getAttribute("alt"), "Restaurant");
  assert.equal(svg.getAttribute("aria-label"), "Notifications");
  entrada.setAttribute("placeholder", "Telefone");
  tradutor.mutacao({ type: "attributes", target: entrada });
  assert.equal(entrada.getAttribute("placeholder"), "Phone");
  tradutor.idioma("pt-BR");
  assert.equal(entrada.getAttribute("placeholder"), "Telefone");
});

test("leaves user content, editable text, textarea values and code unchanged", async () => {
  const protegidos = [
    new Elemento("p", { "data-appono-sem-traducao": "", title: "Pedido" }, [new Texto("Pedido")]),
    new Elemento("div", { translate: "no" }, [new Elemento("span", {}, [new Texto("Reservas")])]),
    new Elemento("textarea", {}, [new Texto("Reservas")]),
    new Elemento("div", { contenteditable: "true" }, [new Elemento("span", {}, [new Texto("Reservas")])]),
    new Elemento("code", {}, [new Texto("Reservas")]),
  ];
  const tradutor = await criarTradutor(protegidos);
  tradutor.idioma("en");
  assert.equal(protegidos[0].childNodes[0].nodeValue, "Pedido");
  assert.equal(protegidos[0].getAttribute("title"), "Pedido");
  assert.equal(protegidos[1].childNodes[0].childNodes[0].nodeValue, "Reservas");
  assert.equal(protegidos[2].childNodes[0].nodeValue, "Reservas");
  assert.equal(protegidos[3].childNodes[0].childNodes[0].nodeValue, "Reservas");
  assert.equal(protegidos[4].childNodes[0].nodeValue, "Reservas");
});
