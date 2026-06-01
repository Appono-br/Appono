"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type StoredClient = {
  name: string;
  cpf: string;
  email: string;
  password: string;
};

type StoredRestaurant = {
  legalName: string;
  email: string;
  cnpj: string;
  password: string;
};

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [message, setMessage] = useState("");

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clients = JSON.parse(
      localStorage.getItem("appono:clients") ?? "[]",
    ) as StoredClient[];
    const restaurants = JSON.parse(
      localStorage.getItem("appono:restaurants") ?? "[]",
    ) as StoredRestaurant[];

    const client = clients.find(
      (item) =>
        (item.email === identifier || item.cpf === identifier) &&
        item.password === password,
    );
    const restaurant = restaurants.find(
      (item) =>
        (item.email === identifier || item.cnpj === identifier) &&
        item.password === password,
    );

    if (client) {
      localStorage.setItem(
        "appono:session",
        JSON.stringify({ type: "client", name: client.name, remember }),
      );
      localStorage.setItem(
        "appono:pendingVerification",
        JSON.stringify({ type: "client", name: client.name, email: client.email }),
      );
      window.location.href = "/verificacao";
      return;
    }

    if (restaurant) {
      localStorage.setItem(
        "appono:session",
        JSON.stringify({
          type: "restaurant",
          name: restaurant.legalName,
          remember,
        }),
      );
      localStorage.setItem(
        "appono:pendingVerification",
        JSON.stringify({
          type: "restaurant",
          name: restaurant.legalName,
          email: restaurant.email,
        }),
      );
      window.location.href = "/verificacao";
      return;
    }

    setMessage("Cadastro nao encontrado neste navegador.");
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-app-chantilly text-app-cafe-profundo">
      <section className="flex min-h-0 w-full flex-col justify-center bg-app-creme-leve px-4 py-3 sm:px-8">
        <div className="mx-auto w-full max-w-md rounded-[12px] bg-app-chantilly px-4 py-3 shadow-[0_18px_50px_rgba(74,44,10,0.08)] ring-1 ring-app-baunilha-dourada sm:px-6">
          <div className="mb-2 flex justify-center">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={112}
              height={112}
              className="h-12 w-12"
              priority
            />
          </div>

          <div className="mb-2 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
            >
              Voltar
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
              Acesso Appono
            </p>
          </div>
          <h1 className="text-2xl italic text-app-cafe-profundo">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-xs leading-4 text-app-mocha">
            Entre para continuar sua jornada gastronomica ou torne-se um membro.
          </p>

          <form onSubmit={submitLogin} className="mt-3 space-y-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Endereco de e-mail ou CPF/CNPJ
              </span>
              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setMessage("");
                }}
                placeholder="nome@exemplo.com"
                required
                className="h-8 bg-app-creme-suave px-3 text-sm outline-none ring-1 ring-app-baunilha-dourada transition placeholder:text-app-cinza/50 hover:ring-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Senha
              </span>
              <div className="flex h-8 items-center bg-app-creme-suave ring-1 ring-app-baunilha-dourada transition hover:ring-app-caramelo-torrado focus-within:ring-2 focus-within:ring-app-dourado-mel">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                  placeholder="********"
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-app-cinza/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="px-3 text-xs font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className="flex flex-col gap-1.5 text-xs text-app-mocha sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-fit items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 accent-app-dourado-mel"
                />
                Lembrar-me
              </label>
              <button
                type="button"
                onClick={() => setMessage("Recuperacao de senha sera ligada ao backend.")}
                className="w-fit text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              className="h-8 w-full bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setRegisterDialog(true)}
              className="flex h-8 w-full items-center justify-center border-2 border-app-mocha text-xs font-bold uppercase tracking-wide text-app-caramelo-torrado transition hover:bg-app-cafe-profundo hover:text-app-creme-leve"
            >
              Cadastrar
            </button>
          </form>

          {message ? (
            <p className="mt-2 text-center text-xs font-semibold text-app-caramelo-torrado">
              {message}
            </p>
          ) : null}

          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-px flex-1 bg-app-baunilha-dourada" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
              ou continue com
            </span>
            <div className="h-px flex-1 bg-app-baunilha-dourada" />
          </div>

          <button
            type="button"
            onClick={() => setMessage("Login com Google sera conectado depois.")}
            className="mt-2 flex h-8 w-full items-center justify-center gap-2 border border-[#dadce0] bg-white text-xs font-bold uppercase tracking-wide text-[#3c4043] transition hover:border-[#c8d3e2] hover:bg-[#f8fafd] focus:outline-none focus:ring-4 focus:ring-[#4285f4]/15"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Google
          </button>

          <p className="mt-2 text-center text-[9px] uppercase leading-4 tracking-[0.12em] text-app-cinza">
            Ao continuar, voce concorda com nossos{" "}
            <Link
              href="#"
              className="text-app-caramelo-torrado underline underline-offset-4 transition hover:text-app-cafe-profundo"
            >
              termos de servico
            </Link>{" "}
            &{" "}
            <Link
              href="#"
              className="text-app-caramelo-torrado underline underline-offset-4 transition hover:text-app-cafe-profundo"
            >
              politica de privacidade
            </Link>
          </p>
        </div>
      </section>

      {registerDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Escolha de cadastro"
        >
          <section className="w-full max-w-2xl bg-app-chantilly p-6 shadow-[0_24px_80px_rgba(47,27,16,0.28)] ring-1 ring-app-baunilha-dourada sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
                  Criar conta
                </p>
                <h2 className="mt-2 text-2xl font-bold text-app-cafe-profundo">
                  Escolha seu perfil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRegisterDialog(false)}
                className="border border-app-baunilha-dourada px-3 py-1 text-sm font-bold text-app-cafe-profundo transition hover:border-app-dourado-mel hover:bg-app-creme-suave"
                aria-label="Fechar"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/cadastro/cliente"
                className="group border border-app-baunilha-dourada bg-app-creme-suave p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-baunilha-dourada"
              >
                <strong className="block text-app-cafe-profundo">
                  Sou cliente
                </strong>
                <span className="mt-2 block text-sm leading-6 text-app-mocha">
                  Quero reservar mesa e antecipar meu pedido presencial.
                </span>
              </Link>
              <Link
                href="/cadastro/restaurante"
                className="group border border-app-baunilha-dourada bg-app-creme-suave p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-baunilha-dourada"
              >
                <strong className="block text-app-cafe-profundo">
                  Sou restaurante
                </strong>
                <span className="mt-2 block text-sm leading-6 text-app-mocha">
                  Quero organizar reservas, cardapio e pedidos antecipados.
                </span>
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
