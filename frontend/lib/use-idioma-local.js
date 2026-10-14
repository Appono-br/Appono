"use client";

<<<<<<< HEAD
import { useIdiomaContexto } from "@/components/internacionalizacao/provedor-idioma";

export function useIdiomaLocal() {
  return useIdiomaContexto();
=======
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

  return { idioma, alternarIdioma };
>>>>>>> Yuji
}
