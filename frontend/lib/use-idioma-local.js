"use client";

import { useSyncExternalStore } from "react";

const chaveIdioma = "appono:language";
const eventoIdioma = "appono:language-change";
let idiomaEmMemoria = null;

function inscreverIdioma(callback) {
  function sincronizarArmazenamento(evento) {
    if (evento.key !== null && evento.key !== chaveIdioma) return;
    idiomaEmMemoria = evento.newValue === "en" ? "en" : "pt-BR";
    callback();
  }
  window.addEventListener("storage", sincronizarArmazenamento);
  window.addEventListener(eventoIdioma, callback);

  return () => {
    window.removeEventListener("storage", sincronizarArmazenamento);
    window.removeEventListener(eventoIdioma, callback);
  };
}

function obterIdiomaDoNavegador() {
  if (idiomaEmMemoria) return idiomaEmMemoria;
  try {
    return window.localStorage.getItem(chaveIdioma) === "en" ? "en" : "pt-BR";
  } catch {
    return document.documentElement.lang === "en" ? "en" : "pt-BR";
  }
}

function obterIdiomaDoServidor() {
  return "pt-BR";
}

export function useIdiomaLocal() {
  const idioma = useSyncExternalStore(inscreverIdioma, obterIdiomaDoNavegador, obterIdiomaDoServidor);

  function alternarIdioma() {
    const proximoIdioma = idioma === "pt-BR" ? "en" : "pt-BR";
    idiomaEmMemoria = proximoIdioma;
    try { window.localStorage.setItem(chaveIdioma, proximoIdioma); } catch { }
    document.documentElement.lang = proximoIdioma;
    window.dispatchEvent(new Event(eventoIdioma));
  }

  
  const localeUI = idioma === "en" ? "en-US" : "pt-BR";

  function ui(texto, parametros = []) {
    if (texto === null || texto === undefined) return "";

    let resultado = String(texto);

    if (Array.isArray(parametros)) {
      parametros.forEach((valor, indice) => {
        resultado = resultado.replaceAll(`{${indice}}`, String(valor));
      });
    }

    return resultado;
  }

  function formatDateTime(valor, opcoes = {}) {
    return new Intl.DateTimeFormat(localeUI, opcoes).format(new Date(valor));
  }

  return {
    idioma,
    alternarIdioma,
    localeUI,
    ui,
    formatDateTime
  };

}
