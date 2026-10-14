"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { traduzirTextoInterface } from "@/lib/i18n";

const CHAVE_IDIOMA = "appono:language";
const IdiomaContexto = createContext(null);
const ouvintes = new Set();

function idiomaPersistido() {
  try {
    return window.localStorage.getItem(CHAVE_IDIOMA) === "en" ? "en" : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

function inscreverIdioma(callback) {
  ouvintes.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    ouvintes.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function idiomaDoServidor() {
  return "pt-BR";
}

function substituirValores(texto, valores) {
  if (!Array.isArray(valores)) return texto;
  return texto.replace(/\{(\d+)\}/g, (original, indice) => String(valores[indice] ?? original));
}

const contextoPadrao = {
  idioma: "pt-BR",
  idiomaPronto: true,
  setIdioma: () => {},
  alternarIdioma: () => {},
  ui: (texto, valores) => {
    if (typeof texto !== "string") return texto;
    return substituirValores(traduzirTextoInterface(texto, "pt-BR"), valores);
  },
  localeUI: "pt-BR",
  formatNumber: (valor, opcoes) => {
    const num = Number(valor);
    return new Intl.NumberFormat("pt-BR", opcoes).format(Number.isFinite(num) ? num : 0);
  },
  formatCurrency: (valor, moeda = "BRL") => {
    const num = Number(valor);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(Number.isFinite(num) ? num : 0);
  },
  formatDate: (valor, opcoes) => {
    if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", opcoes).format(new Date(valor));
  },
  formatDateTime: (valor, opcoes) => {
    if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...opcoes,
    }).format(new Date(valor));
  },
  formatTime: (valor, opcoes) => {
    if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", ...opcoes }).format(new Date(valor));
  },
};

export function ProvedorIdioma({ children }) {
  const idioma = useSyncExternalStore(inscreverIdioma, idiomaPersistido, idiomaDoServidor);

  useEffect(() => {
    try {
      document.documentElement.lang = idioma;
    } catch {}
  }, [idioma]);

  const setIdioma = useCallback((proximo) => {
    const idiomaNormalizado = proximo === "en" ? "en" : "pt-BR";
    try {
      window.localStorage.setItem(CHAVE_IDIOMA, idiomaNormalizado);
      document.documentElement.lang = idiomaNormalizado;
    } catch {}
    ouvintes.forEach((ouvinte) => ouvinte());
  }, []);

  const alternarIdioma = useCallback(
    () => setIdioma(idioma === "en" ? "pt-BR" : "en"),
    [idioma, setIdioma]
  );

  const ui = useCallback(
    (texto, valores) => {
      if (typeof texto !== "string") return texto;
      return substituirValores(traduzirTextoInterface(texto, idioma), valores);
    },
    [idioma]
  );

  const localeUI = idioma === "en" ? "en-US" : "pt-BR";

  const formatNumber = useCallback(
    (valor, opcoes) => {
      const num = Number(valor);
      return new Intl.NumberFormat(localeUI, opcoes).format(Number.isFinite(num) ? num : 0);
    },
    [localeUI]
  );

  const formatCurrency = useCallback(
    (valor, moeda = "BRL") => formatNumber(valor, { style: "currency", currency: moeda }),
    [formatNumber]
  );

  const formatDate = useCallback(
    (valor, opcoes) => {
      if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
      return new Intl.DateTimeFormat(localeUI, opcoes).format(new Date(valor));
    },
    [localeUI]
  );

  const formatDateTime = useCallback(
    (valor, opcoes) => {
      if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
      return formatDate(valor, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...opcoes,
      });
    },
    [formatDate]
  );

  const formatTime = useCallback(
    (valor, opcoes) => {
      if (!valor || Number.isNaN(new Date(valor).getTime())) return "";
      return new Intl.DateTimeFormat(localeUI, { hour: "2-digit", minute: "2-digit", ...opcoes }).format(new Date(valor));
    },
    [localeUI]
  );

  const contexto = useMemo(
    () => ({
      idioma,
      idiomaPronto: true,
      setIdioma,
      alternarIdioma,
      ui,
      localeUI,
      formatNumber,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatTime,
    }),
    [
      idioma,
      setIdioma,
      alternarIdioma,
      ui,
      localeUI,
      formatNumber,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatTime,
    ]
  );

  return <IdiomaContexto.Provider value={contexto}>{children}</IdiomaContexto.Provider>;
}

export function useIdiomaContexto() {
  const contexto = useContext(IdiomaContexto);
  return contexto ?? contextoPadrao;
}
