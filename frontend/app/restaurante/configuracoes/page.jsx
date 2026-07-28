"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SeletorTema } from "@/components/configuracoes/seletor-tema";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { atualizarNomeSessao, encerrarSessao } from "@/lib/session";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCep } from "@/lib/validacoes/cep";
import { aplicarMascaraCnpj } from "@/lib/validacoes/cnpj";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import { enviarImagemRestaurante, validarImagemRestaurante, } from "@/lib/imagem-restaurante";
const initialForm = {
    storeName: "",
    document: "",
    legalName: "",
    phone: "",
    email: "",
    address: "",
    postalCode: "",
    logoUrl: "",
    minimumReservationValue: "0",
};
const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Pedidos", href: "/restaurante/pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
const settingsItems = [
    { label: "Informacoes da loja", icon: "store", href: "/restaurante/configuracoes" },
    { label: "Endereco da loja", icon: "map-pin", href: "/restaurante/configuracoes/endereco" },
    {
        label: "Preferencias de notificacao",
        icon: "bell",
        href: "/restaurante/configuracoes/notificacoes",
    },
    {
        label: "Seguranca e acesso",
        icon: "shield",
        href: "/restaurante/configuracoes/seguranca",
    },
    {
        label: "Dados bancarios",
        icon: "card",
        href: "/restaurante/configuracoes/dados-bancarios",
    },
    {
        label: "Operacao & logistica",
        icon: "settings",
        href: "/restaurante/configuracoes/operacao",
    },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        camera: "M4 8h4l2-3h4l2 3h4v12H4V8z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
        card: "M4 7h16v10H4V7z M4 10h16M8 14h3",
        "chevron-right": "m9 18 6-6-6-6",
        "map-pin": "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        menu: "M4 7h16M4 12h16M4 17h16",
        "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
        settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6.9H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z",
        store: "M4 10h16l-1-5H5l-1 5z M6 10v10h12V10M9 20v-6h6v6",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Field({ label, value, onChange, className = "", disabled = false, }) {
    return (<label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
        {label}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20 disabled:cursor-not-allowed disabled:opacity-65"/>
    </label>);
}
export default function RestaurantSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(initialForm);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [message, setMessage] = useState("Carregando dados cadastrados...");
    const [salvando, setSalvando] = useState(false);
    const [novaImagem, setNovaImagem] = useState(null);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        async function carregarDadosCadastrados() {
            try {
                const resposta = await apiRequest("/me");
                const restaurante = resposta.perfil;
                setForm({
                    storeName: restaurante.nome ?? "",
                    document: aplicarMascaraCnpj(restaurante.cnpj ?? ""),
                    legalName: restaurante.razao_social ?? "",
                    phone: aplicarMascaraTelefone(restaurante.telefone ?? ""),
                    email: restaurante.email ?? "",
                    address: restaurante.endereco ?? "",
                    postalCode: aplicarMascaraCep(restaurante.cep ?? ""),
                    logoUrl: restaurante.logo_url ?? "",
                    minimumReservationValue: String(restaurante.valor_minimo_reserva_por_pessoa ?? 0),
                });
                setMessage("");
            }
            catch (error) {
                setMessage(error instanceof Error
                    ? error.message
                    : "Nao foi possivel carregar os dados cadastrados.");
            }
        }
        carregarDadosCadastrados();
    }, [sessao, sessaoCarregada]);
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
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
        setNovaImagem(arquivo);
        setForm((atual) => ({ ...atual, logoUrl: URL.createObjectURL(arquivo) }));
        setMessage("");
    }
    async function submitForm(event) {
        event.preventDefault();
        setSalvando(true);
        try {
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({
                    nome: form.storeName,
                    telefone: form.phone,
                    email: form.email,
                    endereco: form.address,
                    cep: form.postalCode,
                    valor_minimo_reserva_por_pessoa: Number(form.minimumReservationValue),
                }),
            });
            if (novaImagem) {
                const logoUrl = await enviarImagemRestaurante(novaImagem);
                setForm((atual) => ({ ...atual, logoUrl }));
                setNovaImagem(null);
            }
            atualizarNomeSessao(resposta.perfil.nome);
            setMessage(resposta.message ?? "Alteracoes salvas com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar as alteracoes.");
        }
        finally {
            setSalvando(false);
        }
    }
    async function logout() {
        await encerrarSessao();
        window.location.assign("/");
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
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
            {navItems.map((item) => (<Link key={item.label} href={item.href} className={item.href === "/restaurante/configuracoes"
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-settings-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-settings-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/configuracoes"
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
                Perfil
              </p>
              <h1 className="mt-3 text-3xl font-medium italic leading-tight text-app-cafe-profundo">
                Configuracoes do Perfil
              </h1>
              <p className="mt-5 text-sm leading-6 text-app-mocha">
                Gerencie as informacoes da loja e dados fiscais do
                estabelecimento.
              </p>
            </section>

            <nav className="rounded-[8px] bg-app-chantilly p-2 shadow-sm ring-1 ring-app-baunilha-dourada/45">
              {settingsItems.map((item, index) => (<Link key={item.label} href={item.href} className={`flex w-full items-center justify-between gap-4 rounded-[8px] px-5 py-4 text-left transition ${index === 0
                ? "bg-app-creme-suave text-app-cafe-profundo"
                : "text-app-mocha hover:bg-app-creme-leve"}`}>
                  <span className="flex items-center gap-3">
                    <Icon type={item.icon} className="h-5 w-5"/>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>
                  <Icon type="chevron-right" className="h-4 w-4"/>
                </Link>))}
            </nav>
          </aside>

          <form onSubmit={submitForm} className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-6 border-b border-app-baunilha-dourada/60 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-medium text-app-cafe-profundo">
                  Dados Cadastrais
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-app-mocha">
                  Preencha as informacoes fiscais e de contato da sua loja.
                </p>
              </div>

              <div className="grid w-full max-w-xs grid-cols-2 rounded-[8px] bg-app-creme-suave p-1 text-center text-xs font-bold uppercase text-app-mocha">
                <button type="button" className="rounded-[8px] bg-app-cafe-profundo px-4 py-3 text-app-creme-leve">
                  PJ (CNPJ)
                </button>
                <button type="button" className="px-4 py-3">
                  PF (CPF)
                </button>
              </div>
            </div>

            <section className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <label className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-visible rounded-[8px] bg-app-cafe-profundo bg-cover bg-center text-app-creme-leve" style={form.logoUrl ? { backgroundImage: `url("${form.logoUrl}")` } : undefined}>
                {!form.logoUrl ? <Icon type="store" className="h-10 w-10"/> : null}
                <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-app-caramelo-torrado text-app-chantilly ring-4 ring-app-chantilly">
                  <Icon type="camera" className="h-4 w-4"/>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selecionarImagem(event.target.files?.[0])} className="sr-only"/>
              </label>
              <div>
                <h3 className="text-lg font-semibold text-app-cafe-profundo">
                  Logotipo da Loja
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-cinza">
                  Formatos suportados: JPG, PNG. Tamanho recomendado:
                  500x500px.
                </p>
              </div>
            </section>

            <section className="mt-8 grid gap-6 sm:grid-cols-2">
              <Field label="Nome da loja" value={form.storeName} onChange={(value) => updateField("storeName", value)}/>
              <Field label="CNPJ" value={form.document} onChange={(value) => updateField("document", value)} disabled/>
              <Field label="Razao social" value={form.legalName} onChange={(value) => updateField("legalName", value)} disabled/>
              <Field label="Telefone de contato" value={form.phone} onChange={(value) => updateField("phone", value)}/>
              <Field label="Email comercial" value={form.email} onChange={(value) => updateField("email", value)} className="sm:col-span-2"/>
              <Field label="Consumo minimo por pessoa (R$)" value={form.minimumReservationValue} onChange={(value) => updateField("minimumReservationValue", value.replace(/[^\d.,]/g, "").replace(",", "."))} className="sm:col-span-2"/>
            </section>

            <section className="mt-8 border-t border-app-baunilha-dourada/60 pt-8">
              <h3 className="flex items-center gap-2 text-2xl font-medium italic text-app-cafe-profundo">
                <Icon type="map-pin" className="h-5 w-5"/>
                Localizacao
              </h3>

              <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_0.42fr]">
                <Field label="Endereco" value={form.address} onChange={(value) => updateField("address", value)}/>
                <Field label="CEP" value={form.postalCode} onChange={(value) => updateField("postalCode", value)}/>
              </div>
            </section>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => {
            setForm(initialForm);
            setMessage("");
        }} className="h-11 rounded-[8px] px-8 text-xs font-bold uppercase tracking-[0.18em] text-app-mocha transition hover:bg-app-creme-leve">
                Descartar
              </button>
              <button type="submit" disabled={salvando} className="h-11 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>

            {message ? (<p className="mt-4 text-sm font-semibold text-app-caramelo-torrado">
                {message}
              </p>) : null}
          </form>
        </div>

        <section className="mx-auto mt-10 max-w-4xl rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
            <div className="flex min-h-32 items-center justify-center rounded-[8px] bg-app-cafe-profundo/55 text-app-creme-leve">
              <Icon type="shield" className="h-10 w-10"/>
            </div>
            <div>
              <h2 className="text-xl font-medium text-app-cafe-profundo">
                Precisa alterar dados restritos?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-app-mocha">
                Algumas informacoes cadastrais requerem validacao manual para
                garantir a seguranca da plataforma.
              </p>
              <button type="button" className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                Falar com consultor
              </button>
            </div>
          </div>
        </section>

        <SeletorTema />

        <div className="mx-auto mt-7 max-w-md border-t border-app-baunilha-dourada/60 pt-5 text-center">
          <button type="button" onClick={logout} className="inline-flex items-center gap-3 text-sm font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo">
            <Icon type="log-out"/>
            Sair da conta
          </button>
        </div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
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
