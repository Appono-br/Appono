"use client";

import { useSyncExternalStore } from "react";

export type Tema = "claro" | "escuro";

const chaveTema = "appono:theme";
const eventoTema = "appono:theme-change";

function inscreverTema(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventoTema, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventoTema, callback);
  };
}

function obterTemaDoNavegador(): Tema {
  return window.localStorage.getItem(chaveTema) === "dark" ? "escuro" : "claro";
}

function obterTemaDoServidor(): Tema {
  return "claro";
}

export function useTemaLocal() {
  const tema = useSyncExternalStore(
    inscreverTema,
    obterTemaDoNavegador,
    obterTemaDoServidor,
  );

  function atualizarTema(novoTema: Tema) {
    window.localStorage.setItem(
      chaveTema,
      novoTema === "escuro" ? "dark" : "light",
    );
    window.dispatchEvent(new Event(eventoTema));
  }

  return { tema, atualizarTema };
}
