"use client";
import { useSyncExternalStore } from "react";
import { useTemaLocal } from "@/lib/use-tema-local";
import { TelaCarregandoSessao } from "@/lib/use-sessao-local";
function inscrever() {
    return () => { };
}
function obterEstadoCliente() {
    return true;
}
function obterEstadoServidor() {
    return false;
}
export default function LayoutCliente({ children }) {
    const { tema } = useTemaLocal();
    const estaNoNavegador = useSyncExternalStore(inscrever, obterEstadoCliente, obterEstadoServidor);
    if (!estaNoNavegador) {
        return <TelaCarregandoSessao />;
    }
    return (<div className={`area-autenticada min-h-full ${tema === "escuro" ? "tema-escuro" : ""}`}>
      {children}
    </div>);
}
