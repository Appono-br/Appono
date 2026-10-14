"use client";

import { useCallback } from "react";
import { useIdiomaLocal } from "@/lib/use-idioma-local";

export function useInterface() {
  const contexto = useIdiomaLocal();

  const dataHoraUI = useCallback(
    (valor) => {
      if (!valor || Number.isNaN(new Date(valor).getTime())) {
        return contexto.ui("Sem data");
      }
      return contexto.formatDateTime(valor, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [contexto]
  );

  const horarioUI = useCallback(
    (linha) => {
      const partes = String(linha ?? "").match(
        /^(Segunda-feira|Terça-feira|Terca-feira|Quarta-feira|Quinta-feira|Sexta-feira|Sábado|Sabado|Domingo):\s*([\d:,\s-]+(?:(?:as|às)[\d:,\s-]+)*)$/i
      );
      if (!partes) return contexto.ui(linha);
      return `${contexto.ui(partes[1])}: ${partes[2].replace(/\s+(as|às)\s+/g, " – ")}`;
    },
    [contexto]
  );

  return { ...contexto, dataHoraUI, horarioUI };
}
