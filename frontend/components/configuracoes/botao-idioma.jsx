"use client";

import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { useTraducao } from "@/lib/use-traducao";

function IconeIdioma() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M5 5h8M9 3v2M7 17l4-10M5 17h8M15 19l2.5-6 2.5 6M16 17h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function BotaoIdioma() {
  const { idioma, alternarIdioma } = useIdiomaLocal();
  const { t } = useTraducao();
  const emIngles = idioma === "en";

  return (
    <section className="mt-5 rounded-xl border border-app-baunilha-dourada/60 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-app-chantilly text-app-caramelo-torrado">
            <IconeIdioma />
          </span>
          <div>
            <h2 className="text-sm font-bold text-app-cafe-profundo">{t("settings.language")}</h2>
            <p className="mt-0.5 text-sm text-app-cinza">
              {emIngles ? "English" : t("settings.portuguese")}
            </p>
          </div>
        </div>
        <button type="button" onClick={alternarIdioma} className="h-10 rounded-lg border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:border-app-caramelo-torrado hover:text-app-caramelo-torrado">
          {emIngles ? t("settings.switchToPortuguese") : t("settings.switchToEnglish")}
        </button>
      </div>
    </section>
  );
}
