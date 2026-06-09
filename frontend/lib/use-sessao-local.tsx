"use client";

import { useMemo, useSyncExternalStore } from "react";

export type SessaoLocal = {
  type?: "client" | "restaurant";
  name?: string;
};

const semSessao = "__APPONO_SEM_SESSAO__";

function inscreverSessao(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function obterSessaoDoNavegador() {
  return window.localStorage.getItem("appono:session") ?? semSessao;
}

function obterSessaoDoServidor() {
  return null;
}

export function useSessaoLocal() {
  const sessaoArmazenada = useSyncExternalStore(
    inscreverSessao,
    obterSessaoDoNavegador,
    obterSessaoDoServidor,
  );

  const sessao = useMemo(() => {
    if (!sessaoArmazenada || sessaoArmazenada === semSessao) {
      return null;
    }

    try {
      return JSON.parse(sessaoArmazenada) as SessaoLocal;
    } catch {
      return null;
    }
  }, [sessaoArmazenada]);

  return { sessao, sessaoCarregada: sessaoArmazenada !== null };
}

export function TelaCarregandoSessao() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
      <p className="text-sm font-semibold text-app-caramelo-torrado">
        Carregando seu acesso...
      </p>
    </main>
  );
}
