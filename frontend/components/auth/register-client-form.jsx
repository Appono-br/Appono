"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { FormStepper } from "@/components/ui/form-stepper";
import { FormStepActions } from "@/components/ui/form-step-actions";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { aplicarMascaraCpf } from "@/lib/validacoes/cpf";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import { senhaValida } from "@/lib/politica-senha";
import { validarCpf, validarTelefone } from "@/lib/schemas/validacoes-base";

const clientFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "O nome completo é obrigatório.")
      .min(3, "O nome deve ter pelo menos 3 caracteres."),
    birthDate: z
      .string()
      .min(1, "Informe sua data de nascimento."),
    cpf: z
      .string()
      .min(1, "O CPF é obrigatório.")
      .refine(validarCpf, "Informe um CPF válido com 11 dígitos."),
    email: z
      .string()
      .min(1, "O e-mail é obrigatório.")
      .email("Informe um e-mail válido."),
    phone: z
      .string()
      .min(1, "O telefone/celular é obrigatório.")
      .refine(validarTelefone, "Informe um telefone válido com DDD."),
    password: z
      .string()
      .optional()
      .default(""),
    confirmPassword: z
      .string()
      .optional()
      .default(""),
  })
  .superRefine((data, ctx) => {
    // Validação de senha condicional
    if (data.password || data.confirmPassword) {
      if (!senhaValida(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A senha deve ter pelo menos 6 caracteres, maiúscula, minúscula, número e caractere especial.",
          path: ["password"],
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "As senhas não coincidem.",
          path: ["confirmPassword"],
        });
      }
    }
  });

const STEPS = [
  { title: "Identificação Pessoal", fields: ["name", "birthDate", "cpf"] },
  { title: "Contato e Acesso", fields: ["email", "phone", "password", "confirmPassword"] },
];

function redirecionarParaLogin(email) {
  const params = new URLSearchParams();
  const emailNormalizado = String(email ?? "").trim().toLowerCase();
  params.set("cadastro", "existente");
  if (emailNormalizado) params.set("email", emailNormalizado);
  window.location.href = `/login?${params.toString()}`;
}

export function RegisterClientForm({ googleFlow = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleSession, setGoogleSession] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      birthDate: "",
      cpf: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = watch("password");

  useEffect(() => {
    if (!googleFlow) return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMessage("Entre com Google novamente para completar o cadastro.");
        return;
      }
      setGoogleSession(data.session);
      if (data.session.user.email) {
        setValue("email", data.session.user.email);
      }
      if (data.session.user.user_metadata?.full_name) {
        setValue("name", data.session.user.user_metadata.full_name);
      }
    });
  }, [googleFlow, setValue]);

  async function handleNextStep() {
    setMessage("");
    const fieldsToValidate = STEPS[currentStep].fields.filter(
      (f) => !(googleFlow && (f === "password" || f === "confirmPassword"))
    );
    const stepIsValid = await trigger(fieldsToValidate);
    if (stepIsValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }

  function handleBackStep() {
    setMessage("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(data) {
    if (!googleFlow && !senhaValida(data.password)) {
      setMessage("A senha precisa cumprir todos os requisitos de segurança.");
      return;
    }

    setMessage("");

    try {
      const response = await apiRequest(
        googleFlow ? "/auth/google/client" : "/auth/register/client",
        {
          method: "POST",
          auth: googleFlow,
          body: JSON.stringify({
            name: data.name,
            birthDate: data.birthDate,
            cpf: data.cpf,
            email: data.email,
            phone: data.phone,
            password: data.password,
          }),
        }
      );

      await persistAuthResponse({
        ...response,
        session: response.session ?? googleSession,
      });

      if (response.session || googleSession) {
        window.location.href = getDashboardPath(response.tipo);
        return;
      }

      setMessage(
        response.message ??
          "Conta criada. Confirme seu e-mail para entrar direto no painel."
      );
    } catch (error) {
      if (error?.code === "AUTH_USER_ALREADY_EXISTS") {
        redirecionarParaLogin(data.email);
        return;
      }
      setMessage(
        error instanceof Error ? error.message : "Não foi possível criar a conta."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-xl"
      noValidate
    >
      <div className="rounded-3xl bg-white px-6 py-8 shadow-xl border border-slate-100 sm:px-10">
        {/* Cabeçalho de Marca e Voltar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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

          <span className="rounded-full bg-red-50 text-red-600 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
            Cliente
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Crie sua conta Appono
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre-se para reservar mesas e antecipar seus pedidos de forma prática.
          </p>
        </div>

        {/* Stepper inspirado no iFood */}
        <FormStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />

        {/* Etapa 1: Dados Pessoais */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-fadeIn">
            <FormInput
              label="Nome completo"
              placeholder="Ex: Maria Silva"
              required
              leftIcon={User}
              error={errors.name}
              {...register("name")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Data de nascimento"
                type="date"
                required
                leftIcon={Calendar}
                error={errors.birthDate}
                {...register("birthDate")}
              />

              <FormInput
                label="CPF"
                placeholder="000.000.000-00"
                required
                inputMode="numeric"
                maxLength={14}
                leftIcon={CreditCard}
                error={errors.cpf}
                {...register("cpf", {
                  onChange: (e) => {
                    setValue("cpf", aplicarMascaraCpf(e.target.value));
                  },
                })}
              />
            </div>
          </div>
        )}

        {/* Etapa 2: Contato e Acesso */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <FormInput
              label="E-mail"
              type="email"
              placeholder="seu.email@exemplo.com"
              required
              disabled={googleFlow}
              leftIcon={Mail}
              error={errors.email}
              {...register("email")}
            />

            <FormInput
              label="Telefone / Celular (WhatsApp)"
              placeholder="(11) 99999-9999"
              required
              inputMode="tel"
              maxLength={15}
              leftIcon={Phone}
              error={errors.phone}
              {...register("phone", {
                onChange: (e) => {
                  setValue("phone", aplicarMascaraTelefone(e.target.value));
                },
              })}
            />

            {!googleFlow && (
              <>
                <FormInput
                  label="Senha de acesso"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha segura"
                  required
                  leftIcon={Lock}
                  error={errors.password}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
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

                <PasswordRequirements value={watchPassword || ""} />

                <FormInput
                  label="Confirmar senha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  required
                  leftIcon={Lock}
                  error={errors.confirmPassword}
                  rightAction={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label={
                        showConfirmPassword ? "Ocultar senha" : "Exibir senha"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  {...register("confirmPassword")}
                />
              </>
            )}
          </div>
        )}

        {/* Mensagens de Feedback */}
        {message && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-xs font-semibold text-amber-800 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Ações da Etapa */}
        <FormStepActions
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onBack={handleBackStep}
          onNext={handleNextStep}
          isSubmitting={isSubmitting}
          nextLabel="Avançar para Acesso"
          submitLabel="Concluir Cadastro"
          className="mt-8"
        />

        {/* Rodapé de Login */}
        <div className="mt-6 pt-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Já tem uma conta no Appono?{" "}
            <Link
              href="/login"
              className="font-bold text-red-600 hover:text-red-700 transition"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
