"use client";
import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BotaoIdioma } from "@/components/configuracoes/botao-idioma";
import { apiRequest } from "@/lib/api";
import { atualizarNomeSessao, encerrarSessao } from "@/lib/session";
import { useTraducao } from "@/lib/use-traducao";
import { aplicarMascaraCpf } from "@/lib/validacoes/cpf";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";

const formularioContaInicial = {
    name: "",
    birthDate: "",
    documentLabel: "CPF",
    cpf: "",
    email: "",
    phone: "",
};
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
        appearance: "M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
        support: "M4 19.5V12a8 8 0 0 1 16 0v7.5M4 16h3v4H5a1 1 0 0 1-1-1v-3ZM20 16h-3v4h2a1 1 0 0 0 1-1v-3ZM12 20h2",
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
    const [formularioConta, setFormularioConta] = useState(formularioContaInicial);
    const [mensagemConta, setMensagemConta] = useState("Carregando dados cadastrados...");
    const [salvandoConta, setSalvandoConta] = useState(false);
    const [painelAtivo, setPainelAtivo] = useState("conta");
    useEffect(() => {
        window.localStorage.removeItem("appono:paymentDraft");
    }, []);
    useEffect(() => {
        if (session?.type !== "client") {
            return;
        }
        apiRequest("/me")
            .then(({ perfil }) => {
            setFormularioConta({
                name: perfil.nome ?? "",
                birthDate: perfil.dt_nasc ?? "",
                documentLabel: "CPF",
                cpf: aplicarMascaraCpf(perfil.cpf ?? ""),
                email: perfil.email ?? "",
                phone: aplicarMascaraTelefone(perfil.telefone ?? ""),
            });
            setMensagemConta("");
        })
            .catch((error) => {
            setMensagemConta(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
        });
    }, [session]);
    function atualizarCampoConta(campo, valor) {
        setFormularioConta((atual) => ({ ...atual, [campo]: valor }));
        setMensagemConta("");
    }
    async function salvarConta(event) {
        event.preventDefault();
        setSalvandoConta(true);
        try {
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({
                    nome: formularioConta.name,
                    email: formularioConta.email,
                    telefone: formularioConta.phone,
                }),
            });
            atualizarNomeSessao(resposta.perfil.nome);
            setMensagemConta(resposta.message ?? "Alterações salvas com sucesso.");
        }
        catch (error) {
            setMensagemConta(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
        }
        finally {
            setSalvandoConta(false);
        }
    }
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
      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[0.42fr_1fr]">
          <aside className="rounded-[8px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-6">
            <h1 className="text-3xl font-medium italic leading-tight text-app-cafe-profundo">{t("settings.title")}</h1>
            <div className="mt-6 px-3">
              <strong className="block text-sm text-app-cafe-profundo">{profileName}</strong>
              <span className="mt-1 block text-xs text-app-cinza">{ui(profileType)}</span>
            </div>

            <nav aria-label={ui("Seções de configurações")} className="mt-7 grid gap-2">
              <button type="button" onClick={() => setPainelAtivo("conta")} aria-current={painelAtivo === "conta" ? "page" : undefined} className={`flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado ${painelAtivo === "conta" ? "bg-app-cafe-profundo text-app-creme-leve" : "text-app-cafe-profundo hover:bg-white"}`}>
                <Icon type="user" />
                {ui("Conta")}
              </button>
              <button type="button" onClick={() => setPainelAtivo("aparencia")} aria-current={painelAtivo === "aparencia" ? "page" : undefined} className={`flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado ${painelAtivo === "aparencia" ? "bg-app-cafe-profundo text-app-creme-leve" : "text-app-cafe-profundo hover:bg-white"}`}>
                <Icon type="appearance" />
                {ui("Aparência")}
              </button>
              <Link href="/cliente/suporte" className="flex min-h-12 items-center gap-3 rounded-[8px] px-3 text-sm font-bold text-app-cafe-profundo outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado">
                <Icon type="support" />
                {ui("Suporte")}
              </Link>
              <button type="button" onClick={logout} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-bold text-app-vermelho-erro outline-none transition hover:bg-app-vermelho-claro focus-visible:ring-2 focus-visible:ring-app-vermelho-erro">
                <Icon type="log-out" />
                {t("settings.logout")}
              </button>
            </nav>
          </aside>

          <section className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            {painelAtivo === "conta" ? (
              <form onSubmit={salvarConta}>
                <h2 className="text-3xl font-medium text-app-cafe-profundo">{ui("Dados da Conta")}</h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <label className="grid gap-2 sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Nome completo")}</span>
                    <input value={formularioConta.name} onChange={(event) => atualizarCampoConta("name", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Data de nascimento")}</span>
                    <input type="date" value={formularioConta.birthDate} readOnly disabled className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cinza disabled:cursor-not-allowed" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui(formularioConta.documentLabel)}</span>
                    <input value={formularioConta.cpf} readOnly disabled className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cinza disabled:cursor-not-allowed" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Endereço de e-mail")}</span>
                    <input type="email" value={formularioConta.email} onChange={(event) => atualizarCampoConta("email", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Telefone")}</span>
                    <input value={formularioConta.phone} onChange={(event) => atualizarCampoConta("phone", aplicarMascaraTelefone(event.target.value))} inputMode="tel" maxLength={15} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20" />
                  </label>
                </div>
                <div className="mt-10 flex justify-end">
                  <button type="submit" disabled={salvandoConta} className="h-11 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                    {ui(salvandoConta ? "Salvando..." : "Salvar alterações")}
                  </button>
                </div>
                {mensagemConta ? <p className="mt-4 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagemConta)}</p> : null}
              </form>
            ) : (
              <div>
                <h2 className="text-3xl font-medium text-app-cafe-profundo">{ui("Aparência")}</h2>
                <BotaoIdioma embutido />
              </div>
            )}
          </section>
        </div>
      </section>


    </main>);
}
