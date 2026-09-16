"use client";

import { RoutineEmpty } from "@/components/cliente/rotina/routine-ui";
import { useEffect } from "react";

export default function RotinaError({ error, reset, unstable_retry }) {
    useEffect(() => {
        console.error("Falha inesperada no Appono Rotina", error?.digest ?? "sem identificador");
    }, [error]);

    const tentarNovamente = unstable_retry ?? reset;
    return <main className="min-h-screen bg-white px-4 py-10 text-app-cafe-profundo sm:px-6">
        <div className="mx-auto max-w-4xl">
            <RoutineEmpty
                icon="warning"
                title="Não foi possível abrir o Appono Rotina"
                description="A página encontrou uma falha inesperada. Seus dados salvos não foram alterados."
                action={<button type="button" onClick={tentarNovamente} className="min-h-11 rounded-full bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve hover:bg-app-caramelo-torrado">Tentar novamente</button>}
            />
        </div>
    </main>;
}
