"use client";

import Link from "next/link";
import { useInterface } from "@/lib/use-interface";

export function AppFooter() {
  const { ui } = useInterface();
  return (
    <footer className="app-footer mt-auto border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-baunilha-dourada">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 text-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <nav aria-label={ui("Links do rodapé")} className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase lg:col-start-2">
          <Link href="#" className="transition hover:underline">{ui("Política de Privacidade")}</Link>
          <Link href="#" className="transition hover:underline">{ui("Termos de Uso")}</Link>
          <Link href="#" className="transition hover:underline">{ui("Contato")}</Link>
        </nav>
        <p className="self-end text-right text-xs font-semibold lg:col-start-3 lg:self-center lg:justify-self-end">{ui("© 2026 APPONO. Todos os direitos reservados.")}</p>
      </div>
    </footer>
  );
}
