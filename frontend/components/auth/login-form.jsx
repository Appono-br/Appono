"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  clearAuthResponse,
  getDashboardPath,
  persistAuthResponse,
} from "@/lib/session";
import { supabase } from "@/lib/supabase";

function obterUrlRecuperacaoSenha() {
  const urlConfigurada =
    process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL?.trim();

  if (urlConfigurada) {
    return urlConfigurada;
  }

  return `${window.location.origin}/recuperar-senha`;
}

function obterUrlCallbackAutenticacao() {
  const urlConfigurada =
    process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL?.trim();

  if (urlConfigurada) {
    return urlConfigurada;
  }

  return `${window.location.origin}/auth/callback`;
}

export function LoginForm() {
  const [identifier, setIdentifier] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("email") ?? "";
  });
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [recoveryDialog, setRecoveryDialog] = useState(false);
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("cadastro") === "existente"
      ? "Esta conta ja existe. Entre com seu e-mail e senha para continuar."
      : "";
  });
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  useEffect(() => {
    clearAuthResponse();
  }, []);

  async function submitLogin(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      clearAuthResponse();

      const email = identifier.trim();

      const auth = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });

      await persistAuthResponse({
        tipo: auth.tipo,
        perfil: auth.perfil,
        session: auth.session,
      });

      localStorage.setItem(
        "appono:remember",
        JSON.stringify({ remember })
      );

      window.location.href = getDashboardPath(auth.tipo);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel entrar. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPasswordRecovery(event) {
    event.preventDefault();

    const email = recoveryEmail.trim().toLowerCase();

    if (!email) {
      setRecoveryMessage("Informe o e-mail cadastrado na Appono.");
      return;
    }

    setIsSendingRecovery(true);
    setRecoveryMessage("");

    try {
      const redirectTo = obterUrlRecuperacaoSenha();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      );

      if (error) {
        throw error;
      }

      setRecoveryMessage(
        "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e spam."
      );
    } catch (error) {
      setRecoveryMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar o e-mail de recuperacao."
      );
    } finally {
      setIsSendingRecovery(false);
    }
  }

  async function entrarComGoogle() {
    setIsGoogleSubmitting(true);
    setMessage("");

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: obterUrlCallbackAutenticacao(),
            queryParams: {
              prompt: "select_account",
            },
          },
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsGoogleSubmitting(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar o login com Google."
      );
    }
  }

  return (
    <div className="flex flex-1 bg-white text-app-cafe-profundo">
      <section className="flex w-full flex-col justify-center bg-white px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white px-6 py-7 shadow-xl sm:px-9">
          
          <div className="mb-4 flex justify-center">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={108}
              height={108}
              className="h-16 w-16"
              priority
            />
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-app-caramelo-torrado transition hover:bg-app-creme-suave hover:text-app-cafe-profundo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Voltar
            </Link>

            <p className="rounded-full bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
              Acesso Appono
            </p>
          </div>

          <h1 className="text-2xl font-bold text-app-cafe-profundo">
            Bem-vindo de volta
          </h1>

          <p className="mt-1 text-sm leading-5 text-app-mocha">
            Entre para continuar sua jornada gastronomica ou torne-se um membro.
          </p>

          <form
            onSubmit={submitLogin}
            className="mt-5 space-y-3"
          >
            
            {/* E-MAIL */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Endereco de e-mail
              </span>

              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setMessage("");
                }}
                placeholder="nome@exemplo.com"
                required
                className="h-11 rounded-xl border border-app-baunilha-dourada bg-white px-3 text-sm outline-none transition placeholder:text-app-cinza/50 hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
              />
            </label>

            {/* SENHA */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Senha
              </span>

              <div className="flex h-11 items-center rounded-xl border border-app-baunilha-dourada bg-white transition hover:border-app-caramelo-torrado focus-within:border-app-dourado-mel focus-within:ring-2 focus-within:ring-app-dourado-mel/20">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                  placeholder="********"
                  required
                  className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm outline-none placeholder:text-app-cinza/50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="px-3 text-xs font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className="flex flex-col gap-1.5 text-sm text-app-mocha sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-fit items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                  className="h-4 w-4 rounded accent-app-dourado-mel"
                />
                Lembrar-me
              </label>

              <button
                type="button"
                onClick={() => {
                  setRecoveryEmail(identifier);
                  setRecoveryMessage("");
                  setRecoveryDialog(true);
                }}
                className="w-fit text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>

            <button
              type="button"
              onClick={() => setRegisterDialog(true)}
              className="flex h-10 w-full items-center justify-center rounded-full border-2 border-app-mocha text-xs font-bold uppercase tracking-wide text-app-caramelo-torrado transition hover:-translate-y-0.5 hover:bg-app-cafe-profundo hover:text-app-creme-leve"
            >
              Cadastrar
            </button>
          </form>

          {message ? (
            <p className="mt-3 rounded-lg bg-app-creme-suave px-3 py-2 text-center text-sm font-semibold text-app-caramelo-torrado">
              {message}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-app-baunilha-dourada" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
              ou continue com
            </span>

            <div className="h-px flex-1 bg-app-baunilha-dourada" />
          </div>

          <button
            type="button"
            onClick={entrarComGoogle}
            disabled={isGoogleSubmitting}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#dadce0] bg-white text-xs font-bold uppercase tracking-wide text-[#3c4043] transition hover:-translate-y-0.5 hover:border-[#c8d3e2] hover:bg-[#f8fafd] focus:outline-none focus:ring-4 focus:ring-[#4285f4]/15"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>

            {isGoogleSubmitting
              ? "Redirecionando..."
              : "Google"}
          </button>

          <p className="mt-3 text-center text-[9px] uppercase leading-4 tracking-[0.12em] text-app-cinza">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Escolha de cadastro"
        >
          <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-baunilha-dourada text-app-cafe-profundo transition hover:bg-app-creme-suave"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/cadastro/cliente"
                className="group relative flex flex-col rounded-2xl border-0 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-app-creme-suave text-app-caramelo-torrado transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <strong className="block text-app-cafe-profundo">
                  Sou cliente
                </strong>

                <span className="mt-2 block text-sm leading-6 text-app-mocha">
                  Quero reservar mesa e antecipar meu pedido presencial.
                </span>
              </Link>

              <Link
                href="/cadastro/restaurante"
                className="group relative flex flex-col rounded-2xl border-0 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-app-creme-suave text-app-caramelo-torrado transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 9h1" />
                    <path d="M9 13h1" />
                    <path d="M14 9h1" />
                    <path d="M14 13h1" />
                  </svg>
                </div>

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

      {recoveryDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Recuperacao de senha"
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
                  Recuperar senha
                </p>

                <h2 className="mt-2 text-2xl font-bold text-app-cafe-profundo">
                  Enviar link de acesso
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setRecoveryDialog(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-baunilha-dourada text-app-cafe-profundo transition hover:bg-app-creme-suave"
                aria-label="Fechar recuperacao de senha"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Informe o e-mail cadastrado. A Appono enviara um link seguro para voce criar uma nova senha.
            </p>

            <form
              onSubmit={submitPasswordRecovery}
              className="mt-5 space-y-4"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                  E-mail da conta
                </span>

                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(event) => {
                    setRecoveryEmail(event.target.value);
                    setRecoveryMessage("");
                  }}
                  placeholder="nome@exemplo.com"
                  required
                  className="h-11 rounded-xl border border-app-baunilha-dourada bg-white px-3 text-sm outline-none transition placeholder:text-app-cinza/50 hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
                />
              </label>

              {recoveryMessage ? (
                <p className="rounded-lg bg-app-creme-suave px-3 py-2 text-sm font-semibold leading-5 text-app-caramelo-torrado">
                  {recoveryMessage}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRecoveryDialog(false)}
                  className="h-11 rounded-full border border-app-baunilha-dourada text-xs font-bold uppercase tracking-wide text-app-cafe-profundo transition hover:bg-app-creme-suave"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={isSendingRecovery}
                  className="h-11 rounded-full bg-app-dourado-mel px-5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
                >
                  {isSendingRecovery
                    ? "Enviando..."
                    : "Enviar link"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
