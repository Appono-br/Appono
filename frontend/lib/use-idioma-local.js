"use client";

import { useSyncExternalStore } from "react";

const chaveIdioma = "appono:language";
const eventoIdioma = "appono:language-change";

function inscreverIdioma(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventoIdioma, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventoIdioma, callback);
  };
}

function obterIdiomaDoNavegador() {
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
    try { window.localStorage.setItem(chaveIdioma, proximoIdioma); } catch { /* Preferência válida nesta aba. */ }
    document.documentElement.lang = proximoIdioma;
    window.dispatchEvent(new Event(eventoIdioma));
  }

  return { idioma, alternarIdioma };
}
