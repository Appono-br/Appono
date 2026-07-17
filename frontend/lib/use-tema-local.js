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
function obterTemaDoNavegador() {
    return window.localStorage.getItem(chaveTema) === "dark" ? "escuro" : "claro";
}
function obterTemaDoServidor() {
    return "claro";
}
export function useTemaLocal() {
    const tema = useSyncExternalStore(inscreverTema, obterTemaDoNavegador, obterTemaDoServidor);
    function atualizarTema(novoTema) {
        window.localStorage.setItem(chaveTema, novoTema === "escuro" ? "dark" : "light");
        window.dispatchEvent(new Event(eventoTema));
    }
    return { tema, atualizarTema };
}
