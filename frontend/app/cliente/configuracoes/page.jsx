"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SeletorTema } from "@/components/configuracoes/seletor-tema";
import { BotaoIdioma } from "@/components/configuracoes/botao-idioma";
import { encerrarSessao } from "@/lib/session";
import { useTraducao } from "@/lib/use-traducao";
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        card: "M4 7h16v10H4V7z M4 10h16M8 14h3",
        "chevron-right": "m9 18 6-6-6-6",
        edit: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z M13.5 7.5l3 3",
        "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
        menu: "M4 7h16M4 12h16M4 17h16",
        user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
export default function SettingsPage() {
    const { ui } = useInterface();
    const { t } = useTraducao();
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    useEffect(() => {
        window.localStorage.removeItem("appono:paymentDraft");
    }, []);
    async function logout() {
        await encerrarSessao();
        window.location.assign("/");
    }
    const profileName = session?.name || t("settings.unknownProfile");
    const profileType = session?.type === "restaurant"
        ? "Conta de restaurante"
        : session?.type === "client"
            ? t("settings.clientAccount")
            : t("settings.completeProfile");
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{t("settings.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-app-cafe-profundo sm:text-4xl">{t("settings.title")}</h1>
        </div>

        <Link href="/cliente/configuracoes/conta" className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-app-baunilha-dourada/60 bg-white p-5 shadow-sm transition hover:border-app-caramelo-torrado/60 hover:bg-app-chantilly">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-app-cafe-profundo text-app-creme-leve">
              <Icon type="user" className="h-5 w-5"/>
            </span>
            <span className="min-w-0 text-left">
              <strong className="block truncate text-sm text-app-cafe-profundo">{profileName}</strong>
              <span className="mt-0.5 block text-sm text-app-cinza">{ui(profileType)}</span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">
            {t("settings.account")} <Icon type="chevron-right" className="h-4 w-4"/>
          </span>
        </Link>

        <BotaoIdioma />
        <SeletorTema />

        <div className="mt-7 border-t border-app-baunilha-dourada/60 pt-5 text-center">
          <button type="button" onClick={logout} className="inline-flex items-center gap-3 text-sm font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo">
            <Icon type="log-out"/>
            {t("settings.logout")}
          </button>
        </div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Política de Privacidade")}</Link>
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Termos de Uso")}</Link>
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Contato")}</Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">{ui("© 2026 APPONO. Todos os direitos reservados.")}</p>
        </div>
      </footer>
    </main>);
}
