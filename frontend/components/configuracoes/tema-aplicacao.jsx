"use client";

import { useLayoutEffect } from "react";
import { useTemaLocal, obterTemaDoNavegador } from "@/lib/use-tema-local";

// A mesma preferência usada nos seletores alcança páginas públicas e portais.
export function TemaAplicacao() {
  const { tema } = useTemaLocal();
  useLayoutEffect(() => {
    document.documentElement.dataset.tema = obterTemaDoNavegador();
  }, [tema]);
  return null;
}
