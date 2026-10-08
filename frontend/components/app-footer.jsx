"use client";

import Link from "next/link";
import { useInterface } from "@/lib/use-interface";

export function AppFooter() {
  const { ui } = useInterface();
  return (
    <footer className="app-footer mt-auto w-full shrink-0 border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-baunilha-dourada">
      <div className="flex w-full flex-col items-center justify-center gap-5 text-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Link href="/" aria-label={ui("Ir para a página inicial da Appono")} className="flex items-center justify-center lg:col-start-1 lg:justify-self-start">
          <span
            aria-hidden="true"
            className="block h-[68px] w-20 shrink-0 bg-current"
            style={{
              maskImage: "url('/brand/appono-logo.svg')",
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat",
              WebkitMaskImage: "url('/brand/appono-logo.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
            }}
          />
        </Link>
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
