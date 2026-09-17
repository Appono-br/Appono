"use client";
import { useSyncExternalStore } from "react";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { useTemaLocal } from "@/lib/use-tema-local";
import { TelaCarregandoSessao } from "@/lib/use-sessao-local";
import { RestauranteSidebar } from "@/components/restaurante/restaurante-sidebar";
function inscrever() {
    return () => { };
}
function obterEstadoCliente() {
    return true;
}
function obterEstadoServidor() {
    return false;
}
export default function LayoutRestaurante({ children }) {
    const { tema } = useTemaLocal();
    const estaNoNavegador = useSyncExternalStore(inscrever, obterEstadoCliente, obterEstadoServidor);
    if (!estaNoNavegador) {
        return <TelaCarregandoSessao />;
    }
    return (<RotaProtegida perfisPermitidos={["restaurant"]}>
      <div data-appono-sem-traducao className={`area-autenticada area-restaurante restaurant-shell min-h-full ${tema === "escuro" ? "tema-escuro" : ""}`}>
        <RestauranteSidebar />
        <div className="restaurant-page-content">{children}</div>
      </div>
    </RotaProtegida>);
}
