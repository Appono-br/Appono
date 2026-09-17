"use client";

import { useLayoutEffect } from "react";
import { useTemaLocal, obterTemaDoNavegador } from "@/lib/use-tema-local";

export function TemaAplicacao() {
  const { tema } = useTemaLocal();
  useLayoutEffect(() => {
    document.documentElement.dataset.tema = obterTemaDoNavegador();
  }, [tema]);
  return null;
}
