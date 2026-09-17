"use client";

import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { traduzirInterface } from "@/lib/i18n";

export function useTraducao() {
  const { idioma } = useIdiomaLocal();
  return { idioma, t: (chave) => traduzirInterface(idioma, chave) };
}

export function useTextoTraduzido(texto) {
  return String(texto ?? "");
}
