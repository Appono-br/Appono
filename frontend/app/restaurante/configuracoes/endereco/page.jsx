"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCep } from "@/lib/validacoes/cep";
const initialForm = {
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
};
function separarEndereco(endereco) {
    const [street = "", number = "", complement = "", district = "", city = "", state = ""] = endereco?.split(",").map((parte) => parte.trim()) ?? [];
    return { ...initialForm, street, number, complement, district, city, state };
}
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        "chevron-down": "m6 9 6 6 6-6",
        help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1 .6-1.5 1.1-1.5 2.2M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        "map-pin": "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        navigation: "M12 3 20 21l-8-4-8 4 8-18z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Field({ label, value, onChange, className = "", placeholder, }) {
    return (<label className={`grid gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 border-b border-app-cinza/70 bg-transparent px-3 text-base text-app-cafe-profundo outline-none transition placeholder:text-app-cinza/55 focus:border-app-caramelo-torrado"/>
    </label>);
}
export default function RestaurantAddressSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("Carregando endereco cadastrado...");
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        apiRequest("/me")
            .then(({ perfil }) => {
            setForm({
                ...separarEndereco(perfil.endereco),
                postalCode: aplicarMascaraCep(perfil.cep ?? ""),
            });
            setMessage("");
        })
            .catch((error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o endereco."));
    }, [sessao, sessaoCarregada]);
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    async function submitForm(event) {
        event.preventDefault();
        setSalvando(true);
        try {
            const endereco = [
                form.street,
                form.number,
                form.complement,
                form.district,
                form.city,
                form.state,
            ]
                .filter(Boolean)
                .join(", ");
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({ cep: form.postalCode, endereco }),
            });
            setMessage(resposta.message ?? "Endereco salvo com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o endereco.");
        }
        finally {
            setSalvando(false);
        }
    }
    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (sessao?.type !== "restaurant") {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority/>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/restaurante/configuracoes" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para configuracoes">
              <Icon type="arrow-left" className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">
              Configuracoes
            </h1>
          </div>
          <div className="hidden items-center justify-self-end gap-3 text-right sm:flex">
            <Icon type="help" className="h-5 w-5 text-app-mocha"/>
            <div>
              <p className="text-xs font-semibold text-app-mocha">
                Gestor de Restaurante
              </p>
              <p className="text-[10px] font-semibold text-app-caramelo-torrado">
                Acesso Administrativo
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-app-baunilha-dourada/45 bg-app-chantilly px-5 py-7">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-creme-suave text-app-caramelo-torrado">
            <Icon type="map-pin" className="h-6 w-6"/>
          </span>
          <div>
            <h2 className="text-3xl font-medium italic leading-tight text-app-cafe-profundo">
              Endereco da Loja
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
              Localizacao fisica e fiscal
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-5 py-10 lg:grid-cols-[1fr_0.7fr] lg:items-start">
        <form onSubmit={submitForm} className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[0.48fr_1fr] sm:items-end">
            <Field label="CEP" value={form.postalCode} onChange={(value) => updateField("postalCode", aplicarMascaraCep(value))} placeholder="00000-000"/>
            <p className="pb-3 text-sm font-semibold text-app-caramelo-torrado">
              Consulte seu CEP automaticamente quando a integracao estiver ativa.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Field label="Endereco (rua, avenida)" value={form.street} onChange={(value) => updateField("street", value)} className="sm:col-span-2"/>
            <Field label="Numero" value={form.number} onChange={(value) => updateField("number", value)}/>
            <Field label="Complemento" value={form.complement} onChange={(value) => updateField("complement", value)}/>
            <Field label="Bairro" value={form.district} onChange={(value) => updateField("district", value)} className="sm:col-span-2"/>
            <Field label="Cidade" value={form.city} onChange={(value) => updateField("city", value)}/>
            <label className="grid gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                Estado
              </span>
              <span className="relative">
                <select value={form.state} onChange={(event) => updateField("state", event.target.value)} className="h-12 w-full appearance-none rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 pr-10 text-base text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20">
                  <option value="">UF</option>
                  {[
            "AC",
            "AL",
            "AP",
            "AM",
            "BA",
            "CE",
            "DF",
            "ES",
            "GO",
            "MA",
            "MT",
            "MS",
            "MG",
            "PA",
            "PB",
            "PR",
            "PE",
            "PI",
            "RJ",
            "RN",
            "RS",
            "RO",
            "RR",
            "SC",
            "SP",
            "SE",
            "TO",
        ].map((state) => (<option key={state} value={state}>
                      {state}
                    </option>))}
                </select>
                <Icon type="chevron-down" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza"/>
              </span>
            </label>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={salvando} className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar endereco"}
            </button>
            <Link href="/restaurante/configuracoes" className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">
              Cancelar
            </Link>
          </div>

          {message ? (<p className="mt-4 text-sm font-semibold text-app-caramelo-torrado">
              {message}
            </p>) : null}
        </form>

        <aside className="overflow-hidden rounded-[8px] bg-app-creme-suave shadow-sm ring-1 ring-app-baunilha-dourada/60">
          <div className="relative flex min-h-[260px] items-center justify-center bg-app-baunilha-dourada/45">
            <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(30deg,rgba(138,85,42,.22)_1px,transparent_1px),linear-gradient(120deg,rgba(47,27,16,.16)_1px,transparent_1px)] [background-size:42px_42px]"/>
            <span className="relative inline-flex items-center gap-3 rounded-[8px] bg-app-chantilly px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-app-mocha shadow-sm">
              <Icon type="navigation" className="h-5 w-5 text-app-caramelo-torrado"/>
              Mapa preview
            </span>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Dica de configuracao
            </p>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              A posicao exata do marcador sera ajustada quando o servico de mapa
              estiver conectado ao backend.
            </p>
          </div>
        </aside>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-4 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={56} height={56} className="h-10 w-10 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Politica de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}
