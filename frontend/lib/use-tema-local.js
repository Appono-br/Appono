"use client";
import { useSyncExternalStore } from "react";
const chaveTema = "appono:theme";
const eventoTema = "appono:theme-change";
function inscreverTema(callback) {
    window.addEventListener("storage", callback);
    window.addEventListener(eventoTema, callback);
    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(eventoTema, callback);
    };
}
export function obterTemaDoNavegador() {
    try {
        return window.localStorage.getItem(chaveTema) === "dark" ? "escuro" : "claro";
    } catch {
        return document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro";
    }
}
function obterTemaDoServidor() {
    return "claro";
}
export function useTemaLocal() {
    const tema = useSyncExternalStore(inscreverTema, obterTemaDoNavegador, obterTemaDoServidor);
    function atualizarTema(novoTema) {
        document.documentElement.dataset.tema = novoTema === "escuro" ? "escuro" : "claro";
        try {
            window.localStorage.setItem(chaveTema, novoTema === "escuro" ? "dark" : "light");
        } catch {
            // Mantém a troca visual mesmo quando o navegador bloqueia o storage.
        }
        window.dispatchEvent(new Event(eventoTema));
    }
    return { tema, atualizarTema };
}
