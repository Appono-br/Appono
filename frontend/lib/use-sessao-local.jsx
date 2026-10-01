"use client";
import { useMemo, useSyncExternalStore } from "react";
const semSessao = "__APPONO_SEM_SESSAO__";
function inscreverSessao(callback) {
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
    const sessaoArmazenada = useSyncExternalStore(inscreverSessao, obterSessaoDoNavegador, obterSessaoDoServidor);
    const sessao = useMemo(() => {
        if (!sessaoArmazenada || sessaoArmazenada === semSessao) {
            return null;
        }
        try {
            return JSON.parse(sessaoArmazenada);
        }
        catch {
            return null;
        }
    }, [sessaoArmazenada]);
    return { sessao, sessaoCarregada: sessaoArmazenada !== null };
}
export function TelaCarregandoSessao() {
    return null;
}
