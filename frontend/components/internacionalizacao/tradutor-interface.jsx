"use client";

import { useEffect, useRef } from "react";
import { traduzirTextoInterface } from "@/lib/i18n";
import { useIdiomaLocal } from "@/lib/use-idioma-local";

const atributosTraduziveis = ["aria-label", "placeholder", "title"];
const textosOriginais = new WeakMap();
const atributosOriginais = new WeakMap();

function deveIgnorar(no) {
  const tag = no.parentElement?.tagName;
  return !tag || ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(tag) || no.parentElement.closest("[data-appono-sem-traducao]");
}

function traduzirNoDeTexto(no, idioma) {
  if (deveIgnorar(no) || !no.nodeValue?.trim()) return;
  if (!textosOriginais.has(no)) textosOriginais.set(no, no.nodeValue);
  const original = textosOriginais.get(no);
  const proximoTexto = idioma === "en" ? traduzirTextoInterface(original, idioma) : original;
  if (no.nodeValue !== proximoTexto) no.nodeValue = proximoTexto;
}

function traduzirAtributos(elemento, idioma) {
  if (!(elemento instanceof HTMLElement) || elemento.closest("[data-appono-sem-traducao]")) return;
  if (!atributosOriginais.has(elemento)) atributosOriginais.set(elemento, new Map());
  const originais = atributosOriginais.get(elemento);

  atributosTraduziveis.forEach((atributo) => {
    const valor = elemento.getAttribute(atributo);
    if (!valor) return;
    if (!originais.has(atributo)) originais.set(atributo, valor);
    const original = originais.get(atributo);
    const proximoValor = idioma === "en" ? traduzirTextoInterface(original, idioma) : original;
    if (valor !== proximoValor) elemento.setAttribute(atributo, proximoValor);
  });
}

function traduzirArvore(no, idioma) {
  if (no.nodeType === Node.TEXT_NODE) {
    traduzirNoDeTexto(no, idioma);
    return;
  }
  if (!(no instanceof HTMLElement)) return;
  traduzirAtributos(no, idioma);
  no.childNodes.forEach((filho) => traduzirArvore(filho, idioma));
}

export function TradutorInterface() {
  const { idioma } = useIdiomaLocal();
  const observadorRef = useRef(null);

  useEffect(() => {
    const raiz = document.body;
    document.documentElement.lang = idioma;
    traduzirArvore(raiz, idioma);

    observadorRef.current?.disconnect();
    observadorRef.current = new MutationObserver((mutacoes) => {
      mutacoes.forEach((mutacao) => {
        if (mutacao.type === "childList") {
          mutacao.addedNodes.forEach((no) => traduzirArvore(no, idioma));
        }
        if (mutacao.type === "characterData") traduzirNoDeTexto(mutacao.target, idioma);
        if (mutacao.type === "attributes") traduzirAtributos(mutacao.target, idioma);
      });
    });
    observadorRef.current.observe(raiz, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => observadorRef.current?.disconnect();
  }, [idioma]);

  return null;
}
