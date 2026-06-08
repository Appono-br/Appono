"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FormField } from "@/components/auth/form-field";
import { apiRequest } from "@/lib/api";
import { AuthResponse, getDashboardPath, persistAuthResponse } from "@/lib/session";

type ClientForm = {
  name: string;
  birthDate: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
};

const initialForm: ClientForm = {
  name: "",
  birthDate: "",
  cpf: "",
  email: "",
  phone: "",
  password: "",
};

export function RegisterClientForm() {
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof ClientForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiRequest<AuthResponse>("/auth/register/client", {
        method: "POST",
        body: JSON.stringify(form),
      });

      await persistAuthResponse(response);

      if (response.session) {
        window.location.href = getDashboardPath(response.tipo);
        return;
      }

      setMessage(
        response.message ??
          "Conta criada. Confirme seu e-mail para entrar direto no painel.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a conta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="mx-auto w-full max-w-xl">
      <div className="rounded-[12px] bg-app-chantilly px-5 py-4 shadow-[0_18px_50px_rgba(74,44,10,0.08)] ring-1 ring-app-baunilha-dourada sm:px-7">
        <div className="mb-3 flex justify-center">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={108}
            height={108}
            className="h-16 w-16"
            priority
          />
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
          >
            Voltar
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
            Cadastro de cliente
          </p>
        </div>
        <h1 className="text-2xl font-bold text-app-cafe-profundo">
          Crie sua conta Appono
        </h1>
        <p className="mt-1 text-sm leading-5 text-app-mocha">
          Use seus dados reais para reservar mesa e acessar sua conta depois.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <FormField
            label="Nome completo"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ex: Maria Silva"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(event) => updateField("birthDate", event.target.value)}
            required
          />
          <FormField
            label="CPF"
            value={form.cpf}
            onChange={(event) => updateField("cpf", event.target.value)}
            placeholder="000.000.000-00"
            required
          />
          <FormField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="maria@exemplo.com"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Telefone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(11) 99999-9999"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Senha"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="********"
            required
            minLength={6}
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-3 flex flex-col-reverse gap-2 border-t border-app-baunilha-dourada pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-app-cinza">
            Ja possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
            >
              Entrar
            </Link>
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-9 w-full items-center justify-center bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? "Criando..." : "Criar conta"}
          </button>
        </div>

        {message ? (
          <p className="mt-2 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
