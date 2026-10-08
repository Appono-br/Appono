"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  X,
  User,
  UtensilsCrossed,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { mensagemValidacao, useToast } from "@/components/ui/toast-provider";
import { apiRequest } from "@/lib/api";
import {
  clearAuthResponse,
  getDashboardPath,
  persistAuthResponse,
} from "@/lib/session";
import { supabase } from "@/lib/supabase";
import {
  chaveRetornoRestaurante,
  obterRetornoRestaurante,
} from "@/lib/retorno-restaurante.mjs";
import "../home-profile-dialog.css";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail.")
    .email("Informe um endereço de e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

const recoverySchema = z.object({
  recoveryEmail: z
    .string()
    .min(1, "Informe o e-mail cadastrado na Appono.")
    .email("Informe um e-mail válido."),
});

function obterUrlRecuperacaoSenha() {
  const urlConfigurada =
    process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL?.trim();
  if (urlConfigurada) return urlConfigurada;
  return `${window.location.origin}/recuperar-senha`;
}

function obterUrlCallbackAutenticacao() {
  const urlConfigurada =
    process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL?.trim();
  if (urlConfigurada) return urlConfigurada;
  return `${window.location.origin}/auth/callback`;
}

export function LoginForm() {
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);
  const [recoveryDialog, setRecoveryDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState({ text: "", success: false });
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email:
        typeof window === "undefined"
          ? ""
          : new URLSearchParams(window.location.search).get("email") ?? "",
      password: "",
    },
  });

  const {
    register: registerRecovery,
    handleSubmit: handleSubmitRecovery,
    setValue: setRecoveryValue,
    formState: { errors: recoveryErrors },
  } = useForm({
    resolver: zodResolver(recoverySchema),
    mode: "onTouched",
    defaultValues: { recoveryEmail: "" },
  });

  useEffect(() => {
    clearAuthResponse();
  }, []);

  async function onSubmit(data) {
    setMessage("");
    try {
      clearAuthResponse();
      const auth = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email: data.email.trim(), password: data.password }),
      });

      await persistAuthResponse({
        tipo: auth.tipo,
        perfil: auth.perfil,
        session: auth.session,
      });

      localStorage.setItem("appono:remember", JSON.stringify({ remember }));

      const destino = obterRetornoRestaurante(
        new URLSearchParams(window.location.search).get("redirect"),
        auth.tipo
      );
      window.location.assign(destino ?? getDashboardPath(auth.tipo));
    } catch (error) {
      toast.erro(error instanceof Error ? error.message : "Não foi possível entrar. Tente novamente.");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente."
      );
    }
  }

  function onInvalid(erros) {
    toast.aviso(mensagemValidacao(erros, "Informe seu e-mail e sua senha para entrar."));
  }

  async function onSubmitRecovery(data) {
    setRecoveryMessage({ text: "", success: false });
    setIsSendingRecovery(true);
    try {
      const redirectTo = obterUrlRecuperacaoSenha();
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.recoveryEmail.trim().toLowerCase(),
        { redirectTo }
      );
      if (error) throw error;
      setRecoveryMessage({
        text: "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e spam.",
        success: true,
      });
      toast.sucesso("Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e spam.");
    } catch {
      toast.erro("Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.");
      setRecoveryMessage({
        text: "Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.",
        success: false,
      });
    } finally {
      setIsSendingRecovery(false);
    }
  }

  async function entrarComGoogle() {
    setIsGoogleSubmitting(true);
    setMessage("");
    try {
      const destino = obterRetornoRestaurante(
        new URLSearchParams(window.location.search).get("redirect")
      );
      if (destino) sessionStorage.setItem(chaveRetornoRestaurante, destino);
      else sessionStorage.removeItem(chaveRetornoRestaurante);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: obterUrlCallbackAutenticacao(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error) {
      setIsGoogleSubmitting(false);
      toast.erro(error instanceof Error ? error.message : "Não foi possível iniciar o login com Google.");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o login com Google."
      );
    }
  }

  return (
    <div className="flex flex-1 text-app-cafe-profundo">
      <section className="flex w-full flex-col justify-center px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-app-creme-suave px-6 py-8 shadow-xl sm:px-10">
            {/* Cabeçalho */}
            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
              <Link
                href="/"
                className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-app-cinza hover:text-app-cafe-profundo hover:bg-app-chantilly-hover transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Início</span>
              </Link>

              <Image
                src="/brand/appono-mark.svg"
                alt="Appono"
                width={48}
                height={48}
                className="h-10 w-10"
                priority
              />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-app-cafe-profundo tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="mt-1 text-sm text-app-cinza">
                Entre para continuar sua jornada gastronômica ou torne-se membro.
              </p>
            </div>

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
              <FormInput
                label="Endereço de e-mail"
                type="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                required
                leftIcon={Mail}
                error={errors.email}
                {...register("email")}
              />

              <FormInput
                label="Senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
                leftIcon={Lock}
                error={errors.password}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-app-cinza hover:text-app-caramelo-torrado p-1"
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...register("password")}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex w-fit items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-app-caramelo-torrado accent-app-caramelo-torrado"
                  />
                  <span className="text-app-cinza text-xs font-medium">
                    Lembrar-me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryValue("recoveryEmail", getValues("email"));
                    setRecoveryMessage({ text: "", success: false });
                    setRecoveryDialog(true);
                  }}
                  className="text-xs font-semibold text-app-caramelo-torrado hover:text-app-mocha transition"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("cadastro") === "existente" && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-xs font-semibold text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    {
                      "Esta conta já existe. Entre com seu e-mail e senha para continuar."}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-app-dourado-mel hover:bg-app-caramelo-torrado text-white font-bold text-sm shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-app-dourado-mel/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  "Entrar na conta"
                )}
              </button>

              <button
                type="button"
                onClick={() => setRegisterDialog(true)}
                className="botao-criar-conta flex h-12 w-full items-center justify-center rounded-xl border border-app-baunilha-dourada/50 text-sm font-semibold text-app-cafe-profundo hover:border-app-caramelo-torrado hover:bg-app-chantilly transition-all"
              >
                Criar nova conta
              </button>
            </form>

            {/* Separador Google */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-app-chantilly-hover" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
                ou continue com
              </span>
              <div className="h-px flex-1 bg-app-chantilly-hover" />
            </div>

            {/* Botão Google */}
            <button
              type="button"
              onClick={entrarComGoogle}
              disabled={isGoogleSubmitting}
              className="botao-google flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-app-baunilha-dourada/50 bg-white text-sm font-semibold text-app-cafe-profundo hover:border-app-caramelo-torrado hover:bg-app-chantilly focus:outline-none focus:ring-2 focus:ring-app-dourado-mel/20 transition-all disabled:opacity-60"
            >
              {/* Logo Google SVG original (colorido, não substituído por Lucide) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {isGoogleSubmitting ? "Redirecionando..." : "Continuar com Google"}
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 tracking-wide text-app-cinza">
              Ao continuar, você concorda com nossos{" "}
              <Link href="#" className="text-app-caramelo-torrado underline underline-offset-2 hover:text-app-mocha">
                termos
              </Link>{" "}
              &{" "}
              <Link href="#" className="text-app-caramelo-torrado underline underline-offset-2 hover:text-app-mocha">
                privacidade
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Modal de Escolha de Cadastro */}
      {registerDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Escolha de cadastro"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRegisterDialog(false);
          }}
        >
          <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-app-caramelo-torrado">
                  Criar conta
                </p>
                <h2 className="mt-1.5 text-xl font-extrabold text-app-cafe-profundo">
                  Escolha seu perfil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRegisterDialog(false)}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full border border-app-baunilha-dourada/50 text-app-cinza hover:bg-app-chantilly-hover transition"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <Link
                href="/cadastro/cliente"
                className="home-profile-option group relative flex min-w-0 items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 border border-app-baunilha-dourada/25 hover:border-app-baunilha-dourada hover:bg-app-caramelo-torrado/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-cinza transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-app-cafe-profundo font-bold">
                    Sou cliente
                  </strong>
                  <span className="mt-0.5 block text-xs leading-5 text-app-cinza">
                    Quero reservar mesa e antecipar meu pedido.
                  </span>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-app-cinza transition-transform group-hover:translate-x-1 group-hover:text-app-caramelo-torrado" />
              </Link>

              <Link
                href="/cadastro/restaurante"
                className="home-profile-option group relative flex min-w-0 items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 border border-app-baunilha-dourada/25 hover:border-app-baunilha-dourada hover:bg-app-caramelo-torrado/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-cinza transition group-hover:bg-app-dourado-mel group-hover:text-white">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-app-cafe-profundo font-bold">
                    Sou restaurante
                  </strong>
                  <span className="mt-0.5 block text-xs leading-5 text-app-cinza">
                    Quero organizar reservas, cardápio e pedidos antecipados.
                  </span>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-app-cinza transition-transform group-hover:translate-x-1 group-hover:text-app-caramelo-torrado" />
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* Modal de Recuperação de Senha */}
      {recoveryDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Recuperação de senha"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRecoveryDialog(false);
          }}
        >
          <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-app-caramelo-torrado/10 text-app-caramelo-torrado flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-app-caramelo-torrado">
                    Acesso
                  </p>
                  <h2 className="text-lg font-extrabold text-app-cafe-profundo">
                    Recuperar senha
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryDialog(false)}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full border border-app-baunilha-dourada/50 text-app-cinza hover:bg-app-chantilly-hover transition"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-5 text-app-cinza mb-5">
              Informe o e-mail cadastrado. A Appono enviará um link seguro para você criar uma nova senha.
            </p>

            <form onSubmit={handleSubmitRecovery(onSubmitRecovery, onInvalid)} className="space-y-4" noValidate>
              <FormInput
                label="E-mail da conta"
                type="email"
                placeholder="nome@exemplo.com"
                required
                leftIcon={Mail}
                error={recoveryErrors.recoveryEmail}
                {...registerRecovery("recoveryEmail")}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRecoveryDialog(false)}
                  className="h-11 rounded-xl border border-app-baunilha-dourada/50 text-sm font-semibold text-app-cafe-profundo hover:bg-app-chantilly transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSendingRecovery}
                  className="h-11 rounded-xl bg-app-dourado-mel hover:bg-app-caramelo-torrado text-white text-sm font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isSendingRecovery ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    "Enviar link"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
