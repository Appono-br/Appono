"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Session = {
  type?: "client" | "restaurant";
  name?: string;
};

type AccountForm = {
  name: string;
  birthDate: string;
  documentLabel: "CPF" | "CNPJ";
  cpf: string;
  email: string;
  phone: string;
};

type StoredClient = {
  name: string;
  birthDate?: string;
  cpf?: string;
  email: string;
  phone?: string;
};

type StoredRestaurant = {
  legalName: string;
  cnpj?: string;
  email: string;
  phone?: string;
};

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "arrow-left" | "info";
  className?: string;
}) {
  const paths = {
    "arrow-left": "M19 12H5M12 19l-7-7 7-7",
    info: "M12 17v-6M12 7h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        d={paths[type]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getInitialForm(): AccountForm {
  const empty = {
    name: "",
    birthDate: "",
    documentLabel: "CPF" as const,
    cpf: "",
    email: "",
    phone: "",
  };

  if (typeof window === "undefined") {
    return empty;
  }

  const storedSession = window.localStorage.getItem("appono:session");
  const session = storedSession ? (JSON.parse(storedSession) as Session) : null;

  if (session?.type === "client") {
    const clients = JSON.parse(
      window.localStorage.getItem("appono:clients") ?? "[]",
    ) as StoredClient[];
    const client =
      clients.find((item) => item.name === session.name) ??
      (clients.length === 1 ? clients[0] : undefined);

    return {
      name: client?.name ?? session.name ?? "",
      birthDate: client?.birthDate ?? "",
      documentLabel: "CPF",
      cpf: client?.cpf ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
    };
  }

  if (session?.type === "restaurant") {
    const restaurants = JSON.parse(
      window.localStorage.getItem("appono:restaurants") ?? "[]",
    ) as StoredRestaurant[];
    const restaurant =
      restaurants.find((item) => item.legalName === session.name) ??
      (restaurants.length === 1 ? restaurants[0] : undefined);

    return {
      name: restaurant?.legalName ?? session.name ?? "",
      birthDate: "",
      documentLabel: "CNPJ",
      cpf: restaurant?.cnpj ?? "",
      email: restaurant?.email ?? "",
      phone: restaurant?.phone ?? "",
    };
  }

  return empty;
}

export default function AccountSettingsPage() {
  const [form, setForm] = useState<AccountForm>(() => getInitialForm());
  const [message, setMessage] = useState("");

  function updateField(field: "name" | "email" | "phone", value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("appono:accountDraft", JSON.stringify(form));
    setMessage("Alterações salvas neste navegador.");
  }

  return (
    <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="border-b border-app-baunilha-dourada/50 bg-app-creme-suave">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5">
          <Link href="/" aria-label="Ir para o início">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={72}
              height={72}
              className="h-14 w-14"
              priority
            />
          </Link>
          <div className="flex items-center justify-center gap-6">
            <Link
              href="/configuracoes"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Voltar para configurações"
            >
              <Icon type="arrow-left" className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-[0.16em] sm:text-3xl">
              Configurações
            </h1>
          </div>
          <div className="w-14" />
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

        <form
          onSubmit={submitForm}
          className="mt-10 rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:grid sm:grid-cols-2 sm:gap-6 sm:p-8"
        >
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Nome completo
            </span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
            />
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Data de nascimento
            </span>
            <input
              type="date"
              value={form.birthDate}
              readOnly
              disabled
              className="h-12 cursor-not-allowed border-b border-app-baunilha-dourada bg-transparent text-base text-app-cinza"
            />
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              {form.documentLabel}
            </span>
            <input
              value={form.cpf}
              readOnly
              disabled
              className="h-12 cursor-not-allowed border-b border-app-baunilha-dourada bg-transparent text-base text-app-cinza"
            />
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Endereço de e-mail
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
            />
          </label>

          <label className="mt-6 grid gap-2 sm:mt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-cinza">
              Telefone
            </span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="h-12 border-b border-app-baunilha-dourada bg-transparent text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"
            />
          </label>

          <div className="mt-8 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button
              type="submit"
              className="h-11 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado"
            >
              Salvar alterações
            </button>
            <Link
              href="/configuracoes"
              className="flex h-11 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <aside className="mt-8 rounded-[8px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada/60 sm:p-6">
          <div className="flex gap-3">
            <Icon
              type="info"
              className="mt-0.5 h-5 w-5 shrink-0 text-app-caramelo-torrado"
            />
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

        {message ? (
          <p className="mt-3 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>
        ) : null}
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-4 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={56}
            height={56}
            className="h-10 w-10 brightness-0 invert"
          />
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
    </main>
  );
}
