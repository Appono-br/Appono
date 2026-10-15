"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { useInterface } from "@/lib/use-interface";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { recuperarSenhaEmailSchema } from "@/lib/schemas/auth";
import { solicitarRecuperacaoSenha } from "@/lib/recuperacao-senha";
import { FormInput } from "@/components/ui/form-input";

export default function RestaurantSecuritySettingsPage({ onVoltar }) {
  const { ui } = useInterface();
  const { sessao, sessaoCarregada } = useSessaoLocal();
  const [mensagem, setMensagem] = useState({ texto: "", sucesso: false });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(recuperarSenhaEmailSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  async function enviarLink({ email }) {
    setMensagem({ texto: "", sucesso: false });
    try {
      await solicitarRecuperacaoSenha(email);
      const texto = "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e spam.";
      setMensagem({ texto, sucesso: true });
    } catch {
      const texto = "Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.";
      setMensagem({ texto, sucesso: false });
    }
  }

  function informarValidacao() {
    setMensagem({ texto: "", sucesso: false });
  }

  if (!sessaoCarregada) return <TelaCarregandoSessao />;
  if (sessao?.type !== "restaurant") {
    return (
      <section className="rounded-xl bg-app-creme-leve p-6 text-center">
        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" />
        <h2 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h2>
        <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
        <Link href="/login" className="app-button-primary mt-6 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold">{ui("Entrar")}</Link>
      </section>
    );
  }

  return (
    <section className="min-w-0 text-app-cafe-profundo">
      <div className="border-b border-app-baunilha-dourada/60 pb-6">
        <h2 className="text-3xl font-medium leading-tight">{ui("Segurança e Acesso")}</h2>
      </div>

      <section aria-labelledby="recuperar-senha-titulo" className="mt-8 max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-caramelo-torrado/10 text-app-caramelo-torrado">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-app-caramelo-torrado">{ui("Acesso")}</p>
            <h3 id="recuperar-senha-titulo" className="text-xl font-extrabold">{ui("Recuperar senha")}</h3>
          </div>
        </div>

        <p className="mb-5 text-sm leading-6 text-app-cinza">{ui("Informe o e-mail cadastrado. A Appono enviará um link seguro para você criar uma nova senha.")}</p>

        <form onSubmit={handleSubmit(enviarLink, informarValidacao)} noValidate aria-busy={isSubmitting} className="space-y-5">
          <FormInput
            id="recuperacao-email"
            label={ui("E-mail da conta")}
            type="email"
            autoComplete="email"
            placeholder={ui("nome@exemplo.com")}
            required
            disabled={isSubmitting}
            leftIcon={Mail}
            error={errors.email}
            {...register("email", { onChange: () => setMensagem({ texto: "", sucesso: false }) })}
          />

          <div className={`grid gap-3 ${onVoltar ? "sm:grid-cols-2" : ""}`}>
            {onVoltar ? <button type="button" onClick={onVoltar} disabled={isSubmitting} className="app-button-secondary h-11 rounded-xl px-6 text-sm font-semibold disabled:opacity-50">{ui("Voltar")}</button> : null}
            <button type="submit" disabled={isSubmitting} className="app-button-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {ui(isSubmitting ? "Enviando..." : "Enviar link")}
            </button>
          </div>

          {mensagem.texto ? <p role={mensagem.sucesso ? "status" : "alert"} className={`text-sm leading-6 ${mensagem.sucesso ? "text-app-verde-sucesso" : "text-app-vermelho-erro"}`}>{ui(mensagem.texto)}</p> : null}
        </form>
      </section>
    </section>
  );
}
