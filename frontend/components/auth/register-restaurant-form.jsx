  "use client";

  import Image from "next/image";
  import Link from "next/link";
  import { useEffect, useState } from "react";

  import { FormField } from "@/components/auth/form-field";
  import { apiRequest } from "@/lib/api";
  import { getDashboardPath, persistAuthResponse } from "@/lib/session";
  import { supabase } from "@/lib/supabase";
  import {
    aplicarMascaraCep,
    cepEstaCompleto,
  } from "@/lib/validacoes/cep";
  import {
    aplicarMascaraCnpj,
    cnpjEstaCompleto,
  } from "@/lib/validacoes/cnpj";
  import { somenteNumeros } from "@/lib/validacoes/comum";
  import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
  import {
    enviarImagemRestaurante,
    validarImagemRestaurante,
  } from "@/lib/imagem-restaurante";

  const initialForm = {
    storeName: "",
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
    password: "",
    plano: "INICIAL",
  };

function redirecionarParaLogin(email) {
  const params = new URLSearchParams();
  const emailNormalizado = String(email ?? "").trim().toLowerCase();

  params.set("cadastro", "existente");
  if (emailNormalizado) {
    params.set("email", emailNormalizado);
  }

  window.location.href = `/login?${params.toString()}`;
}

export function RegisterRestaurantForm({ googleFlow = false }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [imagemPreview, setImagemPreview] = useState("");
  const [googleSession, setGoogleSession] = useState(null);
  const [etapa, setEtapa] = useState("dados");
  const [confirmarPlano, setConfirmarPlano] = useState(false);

    const isGoogleFlow = googleFlow;

    useEffect(() => {
      if (!isGoogleFlow) {
        return;
      }

      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setMessage(
            "Entre com Google novamente para completar o cadastro."
          );
          return;
        }

        setGoogleSession(data.session);

        setForm((current) => ({
          ...current,
          email: data.session.user.email ?? current.email,
        }));
      });
    }, [isGoogleFlow]);

    function atualizarCampo(field, value) {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      setMessage("");
    }

    function dadosRestauranteEstaoPreenchidos() {
      return Boolean(
        form.legalName &&
          form.storeName &&
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
          (isGoogleFlow || form.password)
      );
    }

    function avancarParaPlanos() {
      if (!dadosRestauranteEstaoPreenchidos()) {
        setMessage("Preencha os dados obrigatórios do restaurante para continuar.");
        return;
      }

      setMessage("");
      setEtapa("plano");
    }

    function selecionarImagem(arquivo) {
      if (!arquivo) {
        return;
      }

      const erro = validarImagemRestaurante(arquivo);

      if (erro) {
        setMessage(erro);
        return;
      }

      if (imagemPreview) {
        URL.revokeObjectURL(imagemPreview);
      }

      setImagem(arquivo);
      setImagemPreview(URL.createObjectURL(arquivo));
      setMessage("");
    }

    async function validarCnpj() {
      if (!cnpjEstaCompleto(form.cnpj)) {
        return;
      }

      try {
        const company = await apiRequest(
          `/validacoes/cnpj/${somenteNumeros(form.cnpj)}`,
          {
            auth: false,
          }
        );

        setForm((current) => ({
          ...current,
          legalName: company.razaoSocial || current.legalName,
        }));

        setMessage("");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "CNPJ invalido."
        );
      }
    }

    async function validarCep() {
      if (!cepEstaCompleto(form.cep)) {
        return;
      }

      try {
        const address = await apiRequest(
          `/validacoes/cep/${somenteNumeros(form.cep)}`,
          {
            auth: false,
          }
        );

        setForm((current) => ({
          ...current,
          address: address.rua || current.address,
          neighborhood: address.bairro || current.neighborhood,
          city: address.cidade || current.city,
          uf: address.estado || current.uf,
        }));

        setMessage("");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "CEP invalido."
        );
      }
    }

    async function criarRestaurante() {
      if (!dadosRestauranteEstaoPreenchidos()) {
        setMessage(
          "Preencha os dados do restaurante antes de finalizar."
        );
        return;
      }

      setIsSubmitting(true);
      setMessage("");
      try {
        const response = await apiRequest(
          isGoogleFlow
            ? "/auth/google/restaurant"
            : "/auth/register/restaurant",
          {
            method: "POST",
            auth: isGoogleFlow,
            body: JSON.stringify(form),
          }
        );

        const session = response.session ?? googleSession;

        if (!session && form.plano === "PROFISSIONAL") {
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
            } catch (error) {
              console.warn(
                "Nao foi possivel enviar a imagem do restaurante.",
                error
              );
            }
          }

          if (form.plano === "PROFISSIONAL") {
            try {
              const contratacao = await apiRequest("/planos/checkout", {
                method: "POST",
                body: JSON.stringify({ plano: "PROFISSIONAL" }),
              });
              if (contratacao.checkout_url) {
                window.location.assign(contratacao.checkout_url);
                return;
              }
              throw new Error("Não foi possível abrir o checkout do Plano Profissional.");
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
            (form.plano === "PROFISSIONAL"
              ? "Conta criada. Confirme seu e-mail; depois, você seguirá ao Mercado Pago para concluir a assinatura Profissional."
              : "Conta criada. Confirme seu e-mail para entrar direto no painel.")
        );
      } catch (error) {
        if (error?.code === "AUTH_USER_ALREADY_EXISTS") {
          redirecionarParaLogin(form.email);
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel criar a conta do restaurante."
        );
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
      <div className={`mx-auto w-full ${etapa === "plano" ? "max-w-3xl" : "max-w-xl"}`}>
        <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-app-baunilha-dourada/45 ${etapa === "plano" ? "px-5 py-6 sm:px-7" : "px-6 py-7 sm:px-9"}`}>

          <div className="mb-5 flex justify-center">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={108}
              height={108}
              className="h-16 w-16"
              priority
            />
          </div>

          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              href={etapa === "plano" ? "#" : "/"}
              onClick={(event) => {
                if (etapa === "plano") {
                  event.preventDefault();
                  setEtapa("dados");
                }
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-app-caramelo-torrado transition hover:bg-app-chantilly hover:text-app-cafe-profundo"
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
              Cadastro de parceiro
            </p>
          </div>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-app-cafe-profundo">
              {etapa === "dados" ? "Torne-se um parceiro APPONO" : "Escolha o plano ideal"}
            </h1>
            <span className="shrink-0 rounded-full bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
              {etapa === "dados" ? "1 de 2" : "2 de 2"}
            </span>
          </div>

          <p className="mt-1 text-sm leading-5 text-app-cinza">
            {etapa === "dados"
              ? "Informe os dados operacionais do estabelecimento. A conta Mercado Pago poderá ser conectada depois, nas configurações."
              : "Comece sem mensalidade ou potencialize suas vendas com recursos profissionais."}
          </p>

          {etapa === "dados" ? <div className="mt-6 grid gap-3 sm:grid-cols-2">

            <FormField
              label="Nome da loja"
              value={form.storeName}
              onChange={(event) =>
                atualizarCampo("storeName", event.target.value)
              }
              placeholder="Nome que aparecerá para os clientes"
              required
              className="sm:col-span-2"
            />

            <FormField
              label="Razão social"
              value={form.legalName}
              onChange={(event) =>
                atualizarCampo("legalName", event.target.value)
              }
              placeholder="Ex: Terra Artisan Gastronomia LTDA"
              required
              className="sm:col-span-2"
            />

            <FormField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) =>
                atualizarCampo("email", event.target.value)
              }
              placeholder="contato@restaurante.com"
              required
              disabled={isGoogleFlow}
              className="sm:col-span-2"
            />

            <FormField
              label="Telefone"
              value={form.phone}
              onChange={(event) =>
                atualizarCampo(
                  "phone",
                  aplicarMascaraTelefone(event.target.value)
                )
              }
              placeholder="(11) 99999-9999"
              inputMode="tel"
              maxLength={15}
              required
              className="sm:col-span-2"
            />

            <FormField
              label="CNPJ"
              value={form.cnpj}
              onChange={(event) =>
                atualizarCampo(
                  "cnpj",
                  aplicarMascaraCnpj(event.target.value)
                )
              }
              onBlur={validarCnpj}
              placeholder="00.000.000/0001-00"
              inputMode="numeric"
              maxLength={18}
              required
              className="sm:col-span-2"
            />

            <FormField
              label="CEP"
              value={form.cep}
              onChange={(event) =>
                atualizarCampo(
                  "cep",
                  aplicarMascaraCep(event.target.value)
                )
              }
              onBlur={validarCep}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              required
              className="sm:col-span-2"
            />

            <FormField
              label="Endereço"
              value={form.address}
              onChange={(event) =>
                atualizarCampo("address", event.target.value)
              }
              placeholder="Rua, Avenida, etc."
              required
              className="sm:col-span-2"
            />

            <FormField
              label="Bairro"
              value={form.neighborhood}
              onChange={(event) =>
                atualizarCampo("neighborhood", event.target.value)
              }
              placeholder="Ex: Jardins"
              required
            />

            <FormField
              label="Cidade"
              value={form.city}
              onChange={(event) =>
                atualizarCampo("city", event.target.value)
              }
              placeholder="Ex: São Paulo"
              required
            />

            <FormField
              label="UF"
              value={form.uf}
              onChange={(event) =>
                atualizarCampo("uf", event.target.value)
              }
              placeholder="Ex: SP"
              required
              maxLength={2}
            />

            <FormField
              label="Número"
              value={form.number}
              onChange={(event) =>
                atualizarCampo("number", event.target.value)
              }
              placeholder="Ex: 123"
              required
            />

            <FormField
              label="Complemento"
              value={form.complement}
              onChange={(event) =>
                atualizarCampo("complement", event.target.value)
              }
              placeholder="Sala, Bloco, etc."
              className="sm:col-span-2"
            />

            <FormField
              label="Número de mesas"
              type="number"
              min="1"
              value={form.tables}
              onChange={(event) =>
                atualizarCampo("tables", event.target.value)
              }
              placeholder="Ex: 12"
              required
              className="sm:col-span-2"
            />

            {!isGoogleFlow ? (
              <FormField
                label="Senha"
                type="password"
                value={form.password}
                onChange={(event) =>
                  atualizarCampo("password", event.target.value)
                }
                placeholder="Digite aqui"
                required
                minLength={6}
                className="sm:col-span-2"
              />
            ) : null}

            <label className="group grid gap-3 rounded-xl border-2 border-dashed border-app-baunilha-dourada/50 bg-white p-5 text-center transition hover:border-app-caramelo-torrado hover:bg-app-chantilly sm:col-span-2">

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-app-caramelo-torrado">
                Imagem do restaurante
              </span>

              <div className="flex flex-col items-center gap-3">

                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app-creme-suave bg-cover bg-center ring-2 ring-app-caramelo-torrado/20 transition group-hover:ring-app-dourado-mel"
                  style={
                    imagemPreview
                      ? {
                          backgroundImage: `url("${imagemPreview}")`,
                        }
                      : undefined
                  }
                >
                  {!imagemPreview ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-app-caramelo-torrado/70"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  ) : null}
                </div>

                <span className="text-xs leading-5 text-app-cinza">
                  Selecione JPG, PNG ou WebP de até 5 MB.
                  <br />
                  Esta imagem aparecerá para os clientes.
                </span>

                <span className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-app-caramelo-torrado px-4 py-2 text-xs font-bold text-white transition hover:bg-app-cafe-profundo">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>

                  Escolher arquivo
                </span>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  selecionarImagem(event.target.files?.[0])
                }
                className="hidden"
              />
            </label>
          </div> : (
            <section className="mt-9 grid gap-4 lg:grid-cols-2">
              <label className={`relative flex min-h-[390px] cursor-pointer flex-col rounded-2xl border bg-white p-5 transition duration-200 sm:p-6 ${form.plano === "INICIAL" ? "border-app-baunilha-dourada -translate-y-0.5 shadow-md" : "border-app-baunilha-dourada hover:-translate-y-0.5 hover:border-app-caramelo-torrado hover:shadow-md"}`}>
                <input className="sr-only" type="radio" name="plano" checked={form.plano === "INICIAL"} onChange={() => atualizarCampo("plano", "INICIAL")} />
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-app-cafe-profundo">Inicial</h2><p className="mt-2 text-sm text-app-cinza">Para começar a vender na Appono.</p></div>{form.plano === "INICIAL" ? <span className="rounded-full bg-app-caramelo-torrado px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Selecionado</span> : null}</div>
                <div className="mt-7"><span className="text-4xl font-bold tracking-tight text-app-cafe-profundo">R$ 0</span><span className="ml-1 text-sm text-app-cinza">/mês</span><p className="mt-1 text-xs font-semibold text-app-caramelo-torrado">8% de comissão por prato vendido</p></div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.14em] text-app-cafe-profundo">O essencial para operar</p>
                <ul className="mt-4 grid gap-3 text-sm leading-5 text-app-mocha"><li>✓ Perfil e cardápio na Appono</li><li>✓ Reservas e pedidos antecipados</li><li>✓ Gestão operacional do restaurante</li><li>✓ Relatórios básicos de vendas</li></ul>
                <span className={`mt-8 flex h-11 items-center justify-center rounded-lg text-sm font-bold transition ${form.plano === "INICIAL" ? "bg-app-caramelo-torrado text-white" : "bg-app-creme-suave text-app-cafe-profundo"}`}>{form.plano === "INICIAL" ? "Plano selecionado" : "Selecionar Inicial"}</span>
              </label>

              <label className={`relative flex min-h-[390px] cursor-pointer flex-col rounded-2xl border-2 bg-app-cafe-profundo p-5 text-white transition duration-200 sm:p-6 ${form.plano === "PROFISSIONAL" ? "border-app-dourado-mel bg-[#3a1e12]" : "border-app-caramelo-torrado hover:-translate-y-0.5 hover:border-app-dourado-mel hover:bg-[#32180f] hover:shadow-xl"}`}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-app-dourado-mel px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">Recomendado</span>
                <input className="sr-only" type="radio" name="plano" checked={form.plano === "PROFISSIONAL"} onChange={() => atualizarCampo("plano", "PROFISSIONAL")} />
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">Profissional</h2><p className="mt-2 text-sm text-app-creme-suave/80">Para crescer com mais visibilidade e inteligência.</p></div>{form.plano === "PROFISSIONAL" ? <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-app-cafe-profundo">Selecionado</span> : null}</div>
                <div className="mt-7"><span className="text-4xl font-bold tracking-tight">R$ 200</span><span className="ml-1 text-sm text-app-creme-suave/80">/mês</span><p className="mt-1 text-xs font-semibold text-app-dourado-mel">+ apenas 3% de comissão por prato vendido</p></div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.14em] text-app-dourado-mel">Tudo do Inicial, mais</p>
                <ul className="mt-4 grid gap-3 text-sm leading-5 text-app-creme-suave"><li>✓ Destaque profissional para mais clientes</li><li>✓ Campanhas Inteligentes para horários ociosos</li><li>✓ Métricas de alcance, resgates e conversão</li><li>✓ Menor comissão em cada prato vendido</li></ul>
                <span className={`mt-8 flex h-11 items-center justify-center rounded-lg text-sm font-bold transition ${form.plano === "PROFISSIONAL" ? "bg-white text-app-cafe-profundo shadow-sm" : "bg-app-dourado-mel text-white"}`}>{form.plano === "PROFISSIONAL" ? "Plano selecionado" : "Selecionar Profissional"}</span>
              </label>
            </section>
          )}

          <div className="mt-16 flex flex-col gap-5 border-t border-app-creme-suave pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 text-sm text-app-cinza">
              <p className="text-[10px] leading-4">Ao finalizar, você concorda com nossos Termos e Política de Privacidade.</p>
              <span>
                Já possui uma conta?{" "}
                <Link href="/login" className="font-bold text-app-caramelo-torrado transition hover:text-app-dourado-mel">Entrar</Link>
              </span>
              {message ? <p className="text-xs font-semibold text-app-caramelo-torrado">{message}</p> : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <button
              type="button"
              onClick={etapa === "dados" ? avancarParaPlanos : () => form.plano === "PROFISSIONAL" ? setConfirmarPlano(true) : criarRestaurante()}
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none sm:w-auto"
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

                  Criando...
                </>
              ) : etapa === "dados" ? "Continuar" : "Criar conta"}
              </button>
            </div>
          </div>
        </div>
        {confirmarPlano ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) setConfirmarPlano(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="confirmar-plano-titulo" className="w-full max-w-md rounded-2xl bg-white p-6 text-app-cafe-profundo shadow-2xl">
              <h2 id="confirmar-plano-titulo" className="text-xl font-bold">Confirmar Plano Profissional</h2>
              <p className="mt-3 text-sm leading-6 text-app-mocha">A assinatura custa R$ 200 por mês, com 3% de comissão por prato vendido. Após criar sua conta, você será encaminhado ao checkout seguro do Mercado Pago para concluir a contratação.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" disabled={isSubmitting} onClick={() => setConfirmarPlano(false)} className="rounded-lg border border-app-baunilha-dourada px-4 py-2 text-sm font-semibold">Voltar</button>
                <button type="button" disabled={isSubmitting} onClick={() => { setConfirmarPlano(false); criarRestaurante(); }} className="rounded-lg bg-app-dourado-mel px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "Criando conta..." : "Confirmar e criar conta"}</button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    );
  }
