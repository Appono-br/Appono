import { Suspense } from "react";
import { AgendaCliente } from "@/components/cliente/agenda-cliente";

export default function AgendaPage() {
    return (
        <Suspense fallback={<div aria-busy="true" className="mx-auto min-h-screen max-w-7xl px-5 py-14"><div className="h-12 w-64 animate-pulse rounded-[12px] bg-app-chantilly" /><div className="mt-8 h-96 animate-pulse rounded-[18px] bg-app-chantilly" /></div>}>
            <AgendaCliente />
        </Suspense>
    );
}
