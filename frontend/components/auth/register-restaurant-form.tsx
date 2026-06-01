"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { FormField } from "@/components/auth/form-field";

type RestaurantForm = {
  legalName: string;
  email: string;
  phone: string;
  cnpj: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  number: string;
  complement: string;
  tables: string;
  bankCode: string;
  agency: string;
  checkingAccount: string;
  pixKey: string;
  password: string;
};

const initialForm: RestaurantForm = {
  legalName: "",
  email: "",
  phone: "",
  cnpj: "",
  cep: "",
  address: "",
  neighborhood: "",
  city: "",
  uf: "",
  number: "",
  complement: "",
  tables: "",
  bankCode: "",
  agency: "",
  checkingAccount: "",
  pixKey: "",
  password: "",
};

export function RegisterRestaurantForm() {
  const [form, setForm] = useState<RestaurantForm>(initialForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState("");

  function updateField(field: keyof RestaurantForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function restaurantDetailsAreFilled() {
    return Boolean(
      form.legalName &&
        form.email &&
        form.phone &&
        form.cnpj &&
        form.cep &&
        form.address &&
        form.neighborhood &&
        form.city &&
        form.uf &&
        form.number &&
        form.tables &&
        form.password,
    );
  }

  function goToBankStep() {
    if (!restaurantDetailsAreFilled()) {
      setMessage("Preencha os dados do restaurante antes de continuar.");
      return;
    }

    setStep(2);
    setMessage("");
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restaurantDetailsAreFilled()) {
      setStep(1);
      setMessage("Preencha os dados do restaurante antes de finalizar.");
      return;
    }

    const current = JSON.parse(
      localStorage.getItem("appono:restaurants") ?? "[]",
    ) as RestaurantForm[];
    const next = [
      ...current.filter((restaurant) => restaurant.cnpj !== form.cnpj),
      form,
    ];

    localStorage.setItem("appono:restaurants", JSON.stringify(next));
    setMessage("Perfil de restaurante cadastrado neste navegador.");
  }

  return (
    <form onSubmit={submitForm} className="mx-auto w-full max-w-6xl">
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
            Cadastro de parceiro
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-2xl font-bold text-app-cafe-profundo">
              Torne-se um parceiro APPONO
            </h1>
            <p className="mt-1 text-sm leading-5 text-app-mocha">
              {step === 1
                ? "Informe os dados operacionais do estabelecimento."
                : "Cadastre a conta juridica para receber os repasses da plataforma."}
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden border border-app-baunilha-dourada text-center text-[10px] font-bold uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-4 py-2 transition ${
                step === 1
                  ? "bg-app-cafe-profundo text-app-creme-leve"
                  : "bg-app-creme-suave text-app-caramelo-torrado hover:bg-app-baunilha-dourada"
              }`}
            >
              Etapa 1
            </button>
            <button
              type="button"
              onClick={goToBankStep}
              className={`px-4 py-2 transition ${
                step === 2
                  ? "bg-app-cafe-profundo text-app-creme-leve"
                  : "bg-app-creme-suave text-app-caramelo-torrado hover:bg-app-baunilha-dourada"
              }`}
            >
              Etapa 2
            </button>
          </div>
        </div>

        {step === 1 ? (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
            <FormField
              label="Razao social"
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
              placeholder="Ex: Terra Artisan Gastronomia LTDA"
              required
              className="sm:col-span-6 xl:col-span-4"
            />
            <FormField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="contato@restaurante.com"
              required
              className="sm:col-span-3 xl:col-span-3"
            />
            <FormField
              label="Telefone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="(11) 99999-9999"
              required
              className="sm:col-span-3 xl:col-span-2"
            />
            <FormField
              label="CNPJ"
              value={form.cnpj}
              onChange={(event) => updateField("cnpj", event.target.value)}
              placeholder="00.000.000/0001-00"
              required
              className="sm:col-span-3 xl:col-span-3"
            />
            <FormField
              label="CEP"
              value={form.cep}
              onChange={(event) => updateField("cep", event.target.value)}
              placeholder="00000-000"
              required
              className="sm:col-span-2 xl:col-span-2"
            />
            <FormField
              label="Endereco"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Rua, Avenida, etc."
              required
              className="sm:col-span-4 xl:col-span-4"
            />
            <FormField
              label="Bairro"
              value={form.neighborhood}
              onChange={(event) => updateField("neighborhood", event.target.value)}
              placeholder="Ex: Jardins"
              required
              className="sm:col-span-2 xl:col-span-2"
            />
            <FormField
              label="Cidade"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Ex: Sao Paulo"
              required
              className="sm:col-span-2 xl:col-span-3"
            />
            <FormField
              label="UF"
              value={form.uf}
              onChange={(event) => updateField("uf", event.target.value)}
              placeholder="Ex: SP"
              required
              maxLength={2}
              className="sm:col-span-2 xl:col-span-1"
            />
            <FormField
              label="Numero"
              value={form.number}
              onChange={(event) => updateField("number", event.target.value)}
              placeholder="Ex: 123"
              required
              className="sm:col-span-3 xl:col-span-2"
            />
            <FormField
              label="Complemento"
              value={form.complement}
              onChange={(event) => updateField("complement", event.target.value)}
              placeholder="Sala, Bloco, etc."
              className="sm:col-span-3 xl:col-span-3"
            />
            <FormField
              label="Numero de mesas"
              type="number"
              min="1"
              value={form.tables}
              onChange={(event) => updateField("tables", event.target.value)}
              placeholder="Ex: 12"
              required
              className="sm:col-span-3 xl:col-span-2"
            />
            <FormField
              label="Senha"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Digite aqui"
              required
              minLength={6}
              className="sm:col-span-3 xl:col-span-2"
            />
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-6">
            <FormField
              label="Codigo do banco"
              value={form.bankCode}
              onChange={(event) => updateField("bankCode", event.target.value)}
              placeholder="Ex: 260, 001"
              required
              className="sm:col-span-2"
            />
            <FormField
              label="Agencia"
              value={form.agency}
              onChange={(event) => updateField("agency", event.target.value)}
              placeholder="Ex: 0001"
              required
              className="sm:col-span-2"
            />
            <FormField
              label="Conta corrente com digito"
              value={form.checkingAccount}
              onChange={(event) =>
                updateField("checkingAccount", event.target.value)
              }
              placeholder="Ex: 12345-6"
              required
              className="sm:col-span-2"
            />
            <FormField
              label="Chave Pix vinculada a conta"
              value={form.pixKey}
              onChange={(event) => updateField("pixKey", event.target.value)}
              placeholder="Opcional"
              className="sm:col-span-6"
            />
            <div className="border border-app-baunilha-dourada bg-app-creme-suave px-4 py-3 text-xs leading-5 text-app-mocha sm:col-span-6">
              Os dados bancarios devem pertencer ao mesmo CNPJ informado na etapa
              1. A validacao de titularidade e o split de pagamento serao
              tratados pelo backend posteriormente.
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col-reverse gap-2 border-t border-app-baunilha-dourada pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] leading-4 text-app-cinza">
            Ao finalizar, voce concorda com nossos{" "}
            <Link href="#" className="underline transition hover:text-app-mocha">
              Termos
            </Link>{" "}
            e{" "}
            <Link href="#" className="underline transition hover:text-app-mocha">
              Politica de Privacidade
            </Link>
            .
          </p>
          {step === 1 ? (
            <button
              type="button"
              onClick={goToBankStep}
              className="flex h-9 w-full items-center justify-center bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 sm:w-auto"
            >
              Continuar
            </button>
          ) : (
            <button
              type="submit"
              className="flex h-9 w-full items-center justify-center bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 sm:w-auto"
            >
              Criar conta
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 text-sm text-app-cinza sm:flex-row sm:items-center sm:justify-between">
          <span>
            Ja possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-app-cafe-profundo transition hover:text-app-caramelo-torrado"
            >
              Entrar
            </Link>
          </span>
          {message ? (
            <span className="font-semibold text-app-caramelo-torrado">
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
