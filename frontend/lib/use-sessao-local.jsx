"use client";
import Image from "next/image";
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
    return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
      <section className="w-full max-w-sm rounded-[28px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada/60">
        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-16 w-16" priority />
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
          Appono
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">
          Preparando sua experiência
        </h1>
        <div className="mx-auto mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-app-creme-suave">
          <div className="h-full w-1/2 animate-[appLoading_1.15s_ease-in-out_infinite] rounded-full bg-app-caramelo-torrado" />
        </div>
      </section>
    </main>);
}
