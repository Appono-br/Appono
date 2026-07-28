"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
export function LoginForm() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [registerDialog, setRegisterDialog] = useState(false);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    async function submitLogin(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        try {
            const email = identifier.trim();
            const auth = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            await persistAuthResponse({ session: auth.session });
            const profile = await apiRequest("/me");
            await persistAuthResponse({ ...profile, session: auth.session });
            localStorage.setItem("appono:remember", JSON.stringify({ remember }));
            window.location.href = getDashboardPath(profile.tipo);
        }
        catch (error) {
            setMessage(error instanceof Error
                ? error.message
                : "Nao foi possivel entrar. Tente novamente.");
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (<div className="flex min-h-0 flex-1 overflow-hidden bg-app-chantilly text-app-cafe-profundo">
      <section className="flex min-h-0 w-full flex-col justify-center bg-app-creme-leve px-4 py-3 sm:px-8">
        <div className="mx-auto w-full max-w-md rounded-[12px] bg-app-chantilly px-4 py-3 shadow-[0_18px_50px_rgba(74,44,10,0.08)] ring-1 ring-app-baunilha-dourada sm:px-6">
          <div className="mb-2 flex justify-center">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={112} height={112} className="h-12 w-12" priority/>
          </div>

          <div className="mb-2 flex items-center justify-between gap-3">
            <Link href="/" className="text-xs font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
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
                Endereco de e-mail
              </span>
              <input value={identifier} onChange={(event) => {
            setIdentifier(event.target.value);
            setMessage("");
        }} placeholder="nome@exemplo.com" required className="h-8 bg-app-creme-suave px-3 text-sm outline-none ring-1 ring-app-baunilha-dourada transition placeholder:text-app-cinza/50 hover:ring-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel"/>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Senha
              </span>
              <div className="flex h-8 items-center bg-app-creme-suave ring-1 ring-app-baunilha-dourada transition hover:ring-app-caramelo-torrado focus-within:ring-2 focus-within:ring-app-dourado-mel">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => {
            setPassword(event.target.value);
            setMessage("");
        }} placeholder="********" required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-app-cinza/50"/>
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="px-3 text-xs font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className="flex flex-col gap-1.5 text-xs text-app-mocha sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-fit items-center gap-2">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-app-dourado-mel"/>
                Lembrar-me
              </label>
              <button type="button" onClick={() => setMessage("Recuperacao de senha indisponivel no momento.")} className="w-fit text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                Esqueceu a senha?
              </button>
            </div>

            <button type="submit" disabled={isSubmitting} className="h-8 w-full bg-app-dourado-mel text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <button type="button" onClick={() => setRegisterDialog(true)} className="flex h-8 w-full items-center justify-center border-2 border-app-mocha text-xs font-bold uppercase tracking-wide text-app-caramelo-torrado transition hover:bg-app-cafe-profundo hover:text-app-creme-leve">
              Cadastrar
            </button>
          </form>

          {message ? (<p className="mt-2 text-center text-xs font-semibold text-app-caramelo-torrado">
              {message}
            </p>) : null}

          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-px flex-1 bg-app-baunilha-dourada"/>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
              ou continue com
            </span>
            <div className="h-px flex-1 bg-app-baunilha-dourada"/>
          </div>

          <button type="button" onClick={() => setMessage("Login com Google indisponivel no momento.")} className="mt-2 flex h-8 w-full items-center justify-center gap-2 border border-[#dadce0] bg-white text-xs font-bold uppercase tracking-wide text-[#3c4043] transition hover:border-[#c8d3e2] hover:bg-[#f8fafd] focus:outline-none focus:ring-4 focus:ring-[#4285f4]/15">
            Google
          </button>

          <p className="mt-2 text-center text-[9px] uppercase leading-4 tracking-[0.12em] text-app-cinza">
            Ao continuar, voce concorda com nossos{" "}
            <Link href="#" className="text-app-caramelo-torrado underline underline-offset-4 transition hover:text-app-cafe-profundo">
              termos de servico
            </Link>{" "}
            &{" "}
            <Link href="#" className="text-app-caramelo-torrado underline underline-offset-4 transition hover:text-app-cafe-profundo">
              politica de privacidade
            </Link>
          </p>
        </div>
      </section>

      {registerDialog ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5" role="dialog" aria-modal="true" aria-label="Escolha de cadastro">
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
              <button type="button" onClick={() => setRegisterDialog(false)} className="border border-app-baunilha-dourada px-3 py-1 text-sm font-bold text-app-cafe-profundo transition hover:border-app-dourado-mel hover:bg-app-creme-suave" aria-label="Fechar">
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link href="/cadastro/cliente" className="group border border-app-baunilha-dourada bg-app-creme-suave p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-baunilha-dourada">
                <strong className="block text-app-cafe-profundo">
                  Sou cliente
                </strong>
                <span className="mt-2 block text-sm leading-6 text-app-mocha">
                  Quero reservar mesa e antecipar meu pedido presencial.
                </span>
              </Link>
              <Link href="/cadastro/restaurante" className="group border border-app-baunilha-dourada bg-app-creme-suave p-5 transition hover:-translate-y-1 hover:border-app-dourado-mel hover:bg-app-baunilha-dourada">
                <strong className="block text-app-cafe-profundo">
                  Sou restaurante
                </strong>
                <span className="mt-2 block text-sm leading-6 text-app-mocha">
                  Quero organizar reservas, cardapio e pedidos antecipados.
                </span>
              </Link>
            </div>
          </section>
        </div>) : null}
    </div>);
}
