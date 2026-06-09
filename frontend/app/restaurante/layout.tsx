"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { TelaCarregandoSessao } from "@/lib/use-sessao-local";

function inscrever() {
  return () => {};
}

function obterEstadoCliente() {
  return true;
}

function obterEstadoServidor() {
  return false;
}

export default function LayoutRestaurante({ children }: { children: ReactNode }) {
  const estaNoNavegador = useSyncExternalStore(
    inscrever,
    obterEstadoCliente,
    obterEstadoServidor,
  );

  if (!estaNoNavegador) {
    return <TelaCarregandoSessao />;
  }

  return children;
}
