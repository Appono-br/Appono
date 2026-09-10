"use client";

import { useCallback } from "react";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { traduzirTextoInterface } from "@/lib/i18n";

// Tradução declarativa: valores interpolados nunca passam pelo dicionário.
export function useInterface() {
  const { idioma } = useIdiomaLocal();
  const ui = useCallback((texto, valores) => {
    if (typeof texto !== "string") return texto;
    const traduzido = traduzirTextoInterface(texto, idioma);
    return valores ? traduzido.replace(/\{(\d+)\}/g, (original, chave) => String(valores[chave] ?? original)) : traduzido;
  }, [idioma]);
  const localeUI = idioma === "en" ? "en-US" : "pt-BR";
  const dataHoraUI = useCallback((valor) => {
    if (!valor || Number.isNaN(new Date(valor).getTime())) return traduzirTextoInterface("Sem data", idioma);
    return new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "pt-BR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(valor));
  }, [idioma]);
  const horarioUI = useCallback((linha) => {
    const partes = String(linha).match(/^(Segunda-feira|Terça-feira|Terca-feira|Quarta-feira|Quinta-feira|Sexta-feira|Sábado|Sabado|Domingo):\s*([\d:,\s-]+(?:(?:as|às)[\d:,\s-]+)*)$/i);
    if (!partes) return traduzirTextoInterface(linha, idioma);
    return `${traduzirTextoInterface(partes[1], idioma)}: ${partes[2].replace(/\s+(as|às)\s+/g, " – ")}`;
  }, [idioma]);
  return { ui, localeUI, dataHoraUI, horarioUI };
}
