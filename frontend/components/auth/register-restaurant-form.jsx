"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  FileText,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Home,
  Hash,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  UtensilsCrossed,
  Layers,
} from "lucide-react";

import { FormInput } from "@/components/ui/form-input";
import { mensagemValidacao, useToast } from "@/components/ui/toast-provider";
import { FormStepper } from "@/components/ui/form-stepper";
import { FormStepActions } from "@/components/ui/form-step-actions";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { CATEGORIAS_CULINARIAS } from "@/lib/categorias-culinarias";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { aplicarMascaraCep, cepEstaCompleto } from "@/lib/validacoes/cep";
import { aplicarMascaraCnpj, cnpjEstaCompleto } from "@/lib/validacoes/cnpj";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import { senhaValida } from "@/lib/politica-senha";
import { validarCnpj, validarCep, validarTelefone } from "@/lib/schemas/validacoes-base";
import {
  enviarImagemRestaurante,
  validarImagemRestaurante,
} from "@/lib/imagem-restaurante";

const restaurantFormSchema = z
  .object({
    storeName: z
      .string()
      .min(1, "O nome fantasia é obrigatório.")
      .min(2, "O nome fantasia deve ter no mínimo 2 caracteres."),
    legalName: z
      .string()
      .min(1, "A razão social é obrigatória.")
      .min(2, "A razão social deve ter no mínimo 2 caracteres."),
    cnpj: z
      .string()
      .min(1, "O CNPJ é obrigatório.")
      .refine(validarCnpj, "Informe um CNPJ válido com 14 dígitos."),
    email: z
      .string()
      .min(1, "O e-mail comercial é obrigatório.")
      .email("Informe um e-mail válido."),
    phone: z
      .string()
      .min(1, "O telefone comercial é obrigatório.")
      .refine(validarTelefone, "Informe um telefone comercial válido com DDD."),
    cep: z
      .string()
      .min(1, "O CEP é obrigatório.")
      .refine(validarCep, "Informe um CEP válido com 8 dígitos."),
    address: z.string().min(1, "O endereço/rua é obrigatório."),
    number: z.string().min(1, "O número é obrigatório."),
    neighborhood: z.string().min(1, "O bairro é obrigatório."),
    city: z.string().min(1, "A cidade é obrigatória."),
    uf: z.string().min(1, "O estado (UF) é obrigatório.").length(2, "UF deve ter 2 letras."),
    complement: z.string().optional().default(""),
    tables: z
      .coerce
      .number({ invalid_type_error: "Informe a quantidade de mesas." })
      .int("A quantidade de mesas deve ser um número inteiro.")
      .min(1, "O restaurante deve ter pelo menos 1 mesa."),
    categorias_culinarias: z
      .array(z.string())
      .min(1, "Selecione pelo menos uma especialidade culinária."),
    plano: z.enum(["INICIAL", "PROFISSIONAL"]).default("INICIAL"),
    password: z.string().optional().default(""),
    confirmPassword: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
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
  {
    title: "Estabelecimento",
    fields: ["storeName", "legalName", "cnpj", "email", "phone"],
  },
  {
    title: "Localização",
    fields: ["cep", "address", "number", "neighborhood", "city", "uf", "complement"],
  },
  {
    title: "Operação & Cardápio",
    fields: ["tables", "categorias_culinarias"],
  },
  {
    title: "Plano & Acesso",
    fields: ["plano", "password", "confirmPassword"],
  },
];

function redirecionarParaLogin(email) {
  const params = new URLSearchParams();
  const emailNormalizado = String(email ?? "").trim().toLowerCase();
  params.set("cadastro", "existente");
  if (emailNormalizado) params.set("email", emailNormalizado);
  window.location.href = `/login?${params.toString()}`;
}

export function RegisterRestaurantForm({ googleFlow = false }) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState("");
  const [imagem, setImagem] = useState(null);
  const [imagemPreview, setImagemPreview] = useState("");
  const [googleSession, setGoogleSession] = useState(null);
  const [confirmarPlano, setConfirmarPlano] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(restaurantFormSchema),
    mode: "onTouched",
    defaultValues: {
      storeName: "",
      legalName: "",
      cnpj: "",
      email: "",
      phone: "",
      cep: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      uf: "",
      complement: "",
      tables: "",
      categorias_culinarias: [],
      plano: "INICIAL",
      password: "",
      confirmPassword: "",
    },
  });

  const watchPlano = watch("plano");
  const watchPassword = watch("password");
  const watchCategorias = watch("categorias_culinarias") || [];

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
    });
  }, [googleFlow, setValue]);

  async function handleValidarCnpjBlur(e) {
    const raw = e.target.value;
    if (!cnpjEstaCompleto(raw)) return;

    try {
      const company = await apiRequest(`/validacoes/cnpj/${somenteNumeros(raw)}`, {
        auth: false,
      });
      if (company.razaoSocial) {
        setValue("legalName", company.razaoSocial);
      }
    } catch {
      // Ignora falha de busca remota não bloqueante
    }
  }

  async function handleValidarCepBlur(e) {
    const raw = e.target.value;
    if (!cepEstaCompleto(raw)) return;

    try {
      const address = await apiRequest(`/validacoes/cep/${somenteNumeros(raw)}`, {
        auth: false,
      });
      if (address.rua) setValue("address", address.rua);
      if (address.bairro) setValue("neighborhood", address.bairro);
      if (address.cidade) setValue("city", address.cidade);
      if (address.estado) setValue("uf", address.estado);
    } catch {
      // Ignora falha de busca remota não bloqueante
    }
  }

  function selecionarImagem(arquivo) {
    if (!arquivo) return;
    try {
      validarImagemRestaurante(arquivo);
      setImagem(arquivo);
      setImagemPreview(URL.createObjectURL(arquivo));
      setMessage("");
    } catch (error) {
      toast.erro(error instanceof Error ? error.message : "Não foi possível enviar a imagem do restaurante.");
      setImagem(null);
      setImagemPreview("");
      setMessage(error instanceof Error ? error.message : "Imagem inválida.");
    }
  }

  async function handleNextStep() {
    setMessage("");
    const fieldsToValidate = STEPS[currentStep].fields.filter(
      (f) => !(googleFlow && (f === "password" || f === "confirmPassword"))
    );
    const stepIsValid = await trigger(fieldsToValidate);
    if (stepIsValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.aviso("Revise os campos destacados antes de avançar.");
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

    if (data.plano === "PROFISSIONAL" && !confirmarPlano) {
      setConfirmarPlano(true);
      return;
    }

    await executarCriacao(data);
  }

  async function executarCriacao(data) {
    setMessage("");

    try {
      const response = await apiRequest(
        googleFlow ? "/auth/google/restaurant" : "/auth/register/restaurant",
        {
          method: "POST",
          auth: googleFlow,
          body: JSON.stringify({
            storeName: data.storeName,
            legalName: data.legalName,
            email: data.email,
            phone: data.phone,
            cnpj: data.cnpj,
            cep: data.cep,
            address: data.address,
            neighborhood: data.neighborhood,
            city: data.city,
            uf: data.uf,
            number: data.number,
            complement: data.complement,
            tables: data.tables,
            categorias_culinarias: data.categorias_culinarias,
            plano: data.plano,
            password: data.password,
          }),
        }
      );

      const session = response.session ?? googleSession;

      if (!session && data.plano === "PROFISSIONAL") {
        window.sessionStorage.setItem("appono_checkout_profissional_pendente", "1");
      }

      await persistAuthResponse({
        ...response,
        session,
      });

      if (session) {
        if (imagem) {
          try {
            await enviarImagemRestaurante(imagem, session);
          } catch (err) {
            console.warn("Falha no envio da imagem do restaurante.", err);
          }
        }

        if (data.plano === "PROFISSIONAL") {
          try {
            const contratacao = await apiRequest("/planos/checkout", {
              method: "POST",
              body: JSON.stringify({ plano: "PROFISSIONAL" }),
            });
            if (contratacao.checkout_url) {
              window.location.assign(contratacao.checkout_url);
              return;
            }
          } catch {
            window.location.assign("/restaurante/plano?checkout=pendente");
            return;
          }
        }

        window.location.href = getDashboardPath(response.tipo);
        return;
      }

      setMessage(
        response.message ??
          (data.plano === "PROFISSIONAL"
            ? "Conta criada. Confirme seu e-mail; depois você concluirá a assinatura no Mercado Pago."
            : "Conta criada. Confirme seu e-mail para acessar o painel.")
      );
    } catch (error) {
      toast.erro(error instanceof Error ? error.message : "Não foi possível concluir o cadastro do restaurante.");
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
      onSubmit={handleSubmit(onSubmit, (erros) => toast.aviso(mensagemValidacao(erros)))}
      className="mx-auto w-full max-w-2xl"
      noValidate
    >
      <div className="rounded-3xl bg-white px-6 py-8 shadow-xl border border-slate-100 sm:px-10">
        {/* Cabeçalho de Navegação e Marca */}
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
            Parceiro
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Torne-se um parceiro Appono
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre seu restaurante e potencialize suas reservas e pedidos de mesa.
          </p>
        </div>

        {/* Stepper horizontal estilo iFood Partner */}
        <FormStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />

        {/* Etapa 1: Dados do Estabelecimento */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-fadeIn">
            <FormInput
              label="Nome fantasia da loja"
              placeholder="Ex: Terra Artisan Gastronomia"
              required
              leftIcon={Building2}
              error={errors.storeName}
              {...register("storeName")}
            />

            <FormInput
              label="Razão social"
              placeholder="Ex: Terra Artisan Gastronomia LTDA"
              required
              leftIcon={FileText}
              error={errors.legalName}
              {...register("legalName")}
            />

            <FormInput
              label="CNPJ"
              placeholder="00.000.000/0001-00"
              required
              inputMode="numeric"
              maxLength={18}
              leftIcon={CreditCard}
              error={errors.cnpj}
              {...register("cnpj", {
                onChange: (e) => {
                  setValue("cnpj", aplicarMascaraCnpj(e.target.value));
                },
                onBlur: handleValidarCnpjBlur,
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="E-mail comercial"
                type="email"
                placeholder="contato@restaurante.com"
                required
                disabled={googleFlow}
                leftIcon={Mail}
                error={errors.email}
                {...register("email")}
              />

              <FormInput
                label="Telefone comercial"
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
            </div>
          </div>
        )}

        {/* Etapa 2: Localização e Endereço */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <FormInput
              label="CEP"
              placeholder="00000-000"
              required
              inputMode="numeric"
              maxLength={9}
              leftIcon={MapPin}
              error={errors.cep}
              helperText="Preencha o CEP para preenchimento automático do endereço."
              {...register("cep", {
                onChange: (e) => {
                  setValue("cep", aplicarMascaraCep(e.target.value));
                },
                onBlur: handleValidarCepBlur,
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Endereço / Logradouro"
                placeholder="Rua, Avenida, etc."
                required
                leftIcon={Home}
                error={errors.address}
                containerClassName="sm:col-span-2"
                {...register("address")}
              />

              <FormInput
                label="Número"
                placeholder="123"
                required
                leftIcon={Hash}
                error={errors.number}
                {...register("number")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Bairro"
                placeholder="Ex: Jardins"
                required
                error={errors.neighborhood}
                {...register("neighborhood")}
              />

              <FormInput
                label="Cidade"
                placeholder="Ex: São Paulo"
                required
                error={errors.city}
                {...register("city")}
              />

              <FormInput
                label="UF"
                placeholder="SP"
                required
                maxLength={2}
                error={errors.uf}
                {...register("uf")}
              />
            </div>

            <FormInput
              label="Complemento (opcional)"
              placeholder="Sala 1, Bloco B, etc."
              error={errors.complement}
              {...register("complement")}
            />
          </div>
        )}

        {/* Etapa 3: Operação e Categorias Culinárias */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <FormInput
              label="Capacidade de mesas para reserva"
              type="number"
              min="1"
              placeholder="Ex: 15"
              required
              leftIcon={Layers}
              error={errors.tables}
              {...register("tables")}
            />

            {/* Categorias Culinárias com Badges estilo iFood */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center">
                <span>Especialidades culinárias</span>
                <span className="text-red-500 ml-1 font-bold">*</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIAS_CULINARIAS.map((cat) => {
                  const selecionada = watchCategorias.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (selecionada) {
                          setValue(
                            "categorias_culinarias",
                            watchCategorias.filter((c) => c !== cat)
                          );
                        } else if (watchCategorias.length < 8) {
                          setValue("categorias_culinarias", [
                            ...watchCategorias,
                            cat,
                          ]);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        selecionada
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                      }`}
                    >
                      {selecionada && <Check className="h-3 w-3 stroke-[3]" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
              {errors.categorias_culinarias ? (
                <p className="flex items-center gap-1 text-xs font-medium text-red-600 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.categorias_culinarias.message}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Selecione até 8 categorias para ajudar clientes a encontrar seu restaurante.
                </p>
              )}
            </div>

            {/* Upload da Imagem com Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Foto de capa do restaurante (Opcional)
              </span>
              <label className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 bg-slate-50/50 hover:bg-red-50/20 transition-all cursor-pointer">
                <div
                  className="h-16 w-16 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 bg-cover bg-center border border-slate-300"
                  style={
                    imagemPreview
                      ? { backgroundImage: `url("${imagemPreview}")` }
                      : undefined
                  }
                >
                  {!imagemPreview && (
                    <UtensilsCrossed className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Escolher imagem</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG ou WebP de até 5MB.
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => selecionarImagem(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Etapa 4: Plano & Acesso */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Cards de Seleção de Plano */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plano Inicial */}
              <label
                className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  watchPlano === "INICIAL"
                    ? "border-red-500 bg-red-50/20 shadow-md ring-4 ring-red-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  value="INICIAL"
                  className="sr-only"
                  {...register("plano")}
                />
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Inicial
                  </h3>
                  {watchPlano === "INICIAL" && (
                    <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-black text-slate-900">R$ 0</span>
                  <span className="text-xs text-slate-500">/mês</span>
                  <p className="text-xs font-semibold text-red-600 mt-0.5">
                    8% de comissão por reserva
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Cardápio e reservas online</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Fila operacional da cozinha</span>
                  </li>
                </ul>
              </label>

              {/* Plano Profissional */}
              <label
                className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  watchPlano === "PROFISSIONAL"
                    ? "border-red-500 bg-red-50/20 shadow-md ring-4 ring-red-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="absolute -top-2.5 right-4 rounded-full bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  <span>Destaque</span>
                </span>
                <input
                  type="radio"
                  value="PROFISSIONAL"
                  className="sr-only"
                  {...register("plano")}
                />
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Profissional
                  </h3>
                  {watchPlano === "PROFISSIONAL" && (
                    <span className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-black text-slate-900">
                    R$ 200
                  </span>
                  <span className="text-xs text-slate-500">/mês</span>
                  <p className="text-xs font-semibold text-red-600 mt-0.5">
                    Apenas 3% de comissão
                  </p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Tudo do Inicial + Campanhas</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Prioridade e relatórios avançados</span>
                  </li>
                </ul>
              </label>
            </div>

            {/* Senha e Confirmação */}
            {!googleFlow && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <FormInput
                  label="Senha da conta"
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
                  placeholder="Confirme a senha"
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
              </div>
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
          nextLabel="Avançar etapa"
          submitLabel="Criar conta do restaurante"
          className="mt-8"
        />

        {/* Rodapé de Login */}
        <div className="mt-6 pt-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Já possui cadastro de parceiro?{" "}
            <Link
              href="/login"
              className="font-bold text-red-600 hover:text-red-700 transition"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>

      {/* Modal de Confirmação do Plano Profissional */}
      {confirmarPlano && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setConfirmarPlano(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-scaleIn"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Confirmar Plano Profissional
              </h2>
            </div>
            <p className="text-xs leading-5 text-slate-600 mb-6">
              A assinatura custa R$ 200/mês com comissão reduzida de 3%. Após a criação,
              você seguirá para o checkout seguro do Mercado Pago.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmarPlano(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setConfirmarPlano(false);
                  handleSubmit(executarCriacao)();
                }}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition"
              >
                {isSubmitting ? "Criando..." : "Confirmar e criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
