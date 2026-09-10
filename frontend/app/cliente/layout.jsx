"use client";
import { useEffect, useSyncExternalStore } from "react";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { useTemaLocal } from "@/lib/use-tema-local";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
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
    const { idioma } = useIdiomaLocal();
    const estaNoNavegador = useSyncExternalStore(inscrever, obterEstadoCliente, obterEstadoServidor);
    useEffect(() => {
        document.documentElement.lang = idioma;
    }, [idioma]);
    if (!estaNoNavegador) {
        return <TelaCarregandoSessao />;
    }
    return (<RotaProtegida perfisPermitidos={["client"]}>
      <div data-appono-sem-traducao className={`area-autenticada area-cliente min-h-full ${tema === "escuro" ? "tema-escuro" : ""}`}>
        {children}
      </div>
    </RotaProtegida>);
}
