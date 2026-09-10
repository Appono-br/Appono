"use client";

import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { traduzirInterface } from "@/lib/i18n";
import { traduzirConteudoGlossario } from "@/lib/glossario-conteudo";

export function useTraducao() {
  const { idioma } = useIdiomaLocal();
  return { idioma, t: (chave) => traduzirInterface(idioma, chave) };
}

export function useTextoTraduzido(texto, idiomaOrigem = "PT") {
  const { idioma } = useIdiomaLocal();
  if (String(idiomaOrigem).toUpperCase() !== "PT") return String(texto ?? "");
  return traduzirConteudoGlossario(texto, idioma);
}
