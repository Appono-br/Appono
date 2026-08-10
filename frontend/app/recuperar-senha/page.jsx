"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export default function RecuperarSenhaPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("Validando seu link de recuperacao...");
  const [linkValido, setLinkValido] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [senhaAlterada, setSenhaAlterada] = useState(false);

  useEffect(() => {
    async function prepararSessaoDeRecuperacao() {
      try {
        const urlAtual = new URL(window.location.href);
        const parametrosHash = new URLSearchParams(window.location.hash.slice(1));
        const descricaoErro = urlAtual.searchParams.get("error_description") ?? parametrosHash.get("error_description");
        if (descricaoErro) {
          throw new Error(descricaoErro);
        }

        const codigo = urlAtual.searchParams.get("code");
        if (codigo) {
          const { error } = await supabase.auth.exchangeCodeForSession(codigo);
          if (error) {
            throw error;
          }
        }

        const accessToken = parametrosHash.get("access_token");
        const refreshToken = parametrosHash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Link invalido ou expirado. Solicite um novo link de recuperacao.");
        }

        setLinkValido(true);
        setMensagem("Digite sua nova senha para recuperar o acesso.");
      } catch (error) {
        setLinkValido(false);
        setMensagem(error instanceof Error ? error.message : "Nao foi possivel validar o link de recuperacao.");
      }
    }

    prepararSessaoDeRecuperacao();
  }, []);

  async function alterarSenha(event) {
    event.preventDefault();
    if (novaSenha.length < 6) {
      setMensagem("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setMensagem("A confirmacao precisa repetir a nova senha.");
      return;
    }

    setSalvando(true);
    setMensagem("");
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      if (error) {
        throw error;
      }
      await supabase.auth.signOut({ scope: "local" });
      clearAuthResponse();
      setSenhaAlterada(true);
      setMensagem("Senha alterada com sucesso. Agora entre novamente com sua nova senha.");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Nao foi possivel alterar sua senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-4 py-10 text-app-cafe-profundo">
      <section className="w-full max-w-md rounded-2xl bg-app-creme-leve px-6 py-7 shadow-2xl ring-1 ring-app-baunilha-dourada sm:px-8">
        <div className="flex justify-center">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={112} height={112} className="h-14 w-14" priority />
        </div>

        <div className="mt-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
            Recuperacao de senha
          </p>
          <h1 className="mt-2 text-3xl font-bold text-app-cafe-profundo">
            Crie uma nova senha
          </h1>
          <p className="mt-3 text-sm leading-6 text-app-mocha">
            {mensagem}
          </p>
        </div>

        {linkValido && !senhaAlterada ? (
          <form onSubmit={alterarSenha} className="mt-6 space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Nova senha
              </span>
              <div className="flex h-11 items-center rounded-xl bg-app-creme-suave ring-1 ring-app-baunilha-dourada transition hover:ring-app-caramelo-torrado focus-within:ring-2 focus-within:ring-app-dourado-mel">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(event) => {
                    setNovaSenha(event.target.value);
                    setMensagem("");
                  }}
                  placeholder="Digite a nova senha"
                  minLength={6}
                  required
                  className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm outline-none placeholder:text-app-cinza/50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((atual) => !atual)}
                  className="px-3 text-xs font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
                >
                  {mostrarSenha ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-app-mocha">
                Confirmar senha
              </span>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={confirmacaoSenha}
                onChange={(event) => {
                  setConfirmacaoSenha(event.target.value);
                  setMensagem("");
                }}
                placeholder="Repita a nova senha"
                minLength={6}
                required
                className="h-11 rounded-xl bg-app-creme-suave px-3 text-sm outline-none ring-1 ring-app-baunilha-dourada transition placeholder:text-app-cinza/50 hover:ring-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel"
              />
            </label>

            <button
              type="submit"
              disabled={salvando}
              className="flex h-11 w-full items-center justify-center rounded-full bg-app-dourado-mel px-5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
            >
              {salvando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        ) : null}

        <Link
          href="/login"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-full border border-app-baunilha-dourada text-xs font-bold uppercase tracking-wide text-app-cafe-profundo transition hover:bg-app-creme-suave"
        >
          Voltar para login
        </Link>
      </section>
    </main>
  );
}
