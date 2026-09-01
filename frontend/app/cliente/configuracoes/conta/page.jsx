"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { atualizarNomeSessao } from "@/lib/session";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCpf } from "@/lib/validacoes/cpf";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        info: "M12 17v-6M12 7h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
const formularioInicial = {
    name: "",
    birthDate: "",
    documentLabel: "CPF",
    cpf: "",
    email: "",
    phone: "",
};
export default function AccountSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(formularioInicial);
    const [message, setMessage] = useState("Carregando dados cadastrados...");
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "client") {
            return;
        }
        apiRequest("/me")
            .then(({ perfil }) => {
            setForm({
                name: perfil.nome ?? "",
                birthDate: perfil.dt_nasc ?? "",
                documentLabel: "CPF",
                cpf: aplicarMascaraCpf(perfil.cpf ?? ""),
                email: perfil.email ?? "",
                phone: aplicarMascaraTelefone(perfil.telefone ?? ""),
            });
            setMessage("");
        })
            .catch((error) => {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os dados.");
        });
    }, [sessao, sessaoCarregada]);
    function atualizarCampo(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    async function enviarFormulario(event) {
        event.preventDefault();
        setSalvando(true);
        try {
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({
                    nome: form.name,
                    email: form.email,
                    telefone: form.phone,
                }),
            });
            atualizarNomeSessao(resposta.perfil.nome);
            setMessage(resposta.message ?? "Alterações salvas com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
        }
        finally {
            setSalvando(false);
        }
    }
    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="border-b border-app-baunilha-dourada/50 bg-white">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority/>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/cliente/configuracoes" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para configurações">
              <Icon type="arrow-left" className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">
              Configurações
            </h1>
          </div>
          <div className="justify-self-end text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
        <div>
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            Conta
          </p>
          <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
            Detalhes Pessoais
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-mocha sm:text-base">
            Atualize suas informações de contato. Data de nascimento e documento
            permanecem bloqueados por segurança.
          </p>
        </div>

        <form onSubmit={enviarFormulario} className="mt-10 rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:grid sm:grid-cols-2 sm:gap-6 sm:p-8">
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Nome completo
            </span>
            <input value={form.name} onChange={(event) => atualizarCampo("name", event.target.value)} className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Data de nascimento
            </span>
            <input type="date" value={form.birthDate} readOnly disabled className="h-12 cursor-not-allowed border-b border-app-baunilha-dourada bg-transparent text-base text-app-cinza"/>
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              {form.documentLabel}
            </span>
            <input value={form.cpf} readOnly disabled className="h-12 cursor-not-allowed border-b border-app-baunilha-dourada bg-transparent text-base text-app-cinza"/>
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Endereço de e-mail
            </span>
            <input type="email" value={form.email} onChange={(event) => atualizarCampo("email", event.target.value)} className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Telefone
            </span>
            <input value={form.phone} onChange={(event) => atualizarCampo("phone", aplicarMascaraTelefone(event.target.value))} inputMode="tel" maxLength={15} className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
          </label>

          <div className="mt-8 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" disabled={salvando} className="h-11 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
            <Link href="/cliente/configuracoes" className="flex h-11 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-chantilly">
              Cancelar
            </Link>
          </div>
        </form>

        <aside className="mt-8 rounded-[8px] bg-white p-5 ring-1 ring-app-baunilha-dourada/60 sm:p-6">
          <div className="flex gap-3">
            <Icon type="info" className="mt-0.5 h-5 w-5 shrink-0 text-app-caramelo-torrado"/>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                Privacidade de dados
              </h3>
              <p className="mt-2 text-sm leading-5 text-app-cinza">
                Suas informações são utilizadas para identificação da conta e
                segurança de acesso.
              </p>
            </div>
          </div>
        </aside>

        {message ? (<p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>) : null}
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-4 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={56} height={56} className="h-10 w-10 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Política de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}
