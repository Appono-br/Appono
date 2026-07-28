"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Pedidos", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
const financeCards = [
    { label: "Vendas validas", key: "valor_bruto" },
    { label: "Liquido restaurante", key: "valor_restaurante" },
    { label: "A receber", key: "valor_a_receber" },
    { label: "Liberado", key: "valor_liberado" },
];
const tableHeaders = ["Pedido", "Cliente", "Reserva", "Status", "Financeiro", "Liquido"];
const periodos = [
    { label: "Hoje", value: "hoje" },
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "Todos", value: "todos" },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        menu: "M4 7h16M4 12h16M4 17h16",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarData(data) {
    if (!data) {
        return "Sem data";
    }
    return new Date(data).toLocaleDateString("pt-BR");
}

function formatarReserva(data, horario) {
    if (!data) {
        return "Sem reserva";
    }
    const dataFormatada = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
    return horario ? `${dataFormatada} as ${String(horario).slice(0, 5)}` : dataFormatada;
}

function obterPrevisaoRepasse(repasse) {
    if (repasse.pedido?.status_pedido === "CANCELADO") {
        return "Pedido cancelado";
    }
    if (repasse.status_repasse === "LIBERADO_PARA_REPASSE" || repasse.status_repasse === "REPASSADO") {
        return "Disponivel para repasse";
    }
    if (repasse.status_repasse === "ESTORNADO") {
        return "Sem repasse";
    }
    return "Apos confirmacao de entrega";
}

function obterTextoStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Aguardando pagamento",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };
    return statusMap[status] ?? "Em acompanhamento";
}

function obterTextoStatusRepasse(status) {
    const statusMap = {
        AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
        AGUARDANDO_ENTREGA: "Aguardando entrega",
        LIBERADO_PARA_REPASSE: "Liberado",
        REPASSADO: "Repassado",
        ESTORNADO: "Estornado",
        NAO_APLICAVEL: "Nao aplicavel",
    };
    return statusMap[status] ?? "Pendente";
}

function FinanceCard({ label, value, featured = false, }) {
    return (<article className={`min-h-40 rounded-[8px] p-6 shadow-sm ${featured
            ? "bg-app-cafe-profundo text-app-creme-leve"
            : "bg-app-chantilly text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/45"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${featured ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
        {label}
      </p>
      <strong className="mt-7 block text-3xl font-medium">{formatarMoeda(value)}</strong>
      <div className={`mt-7 h-2 max-w-56 rounded-full ${featured ? "bg-app-mocha" : "bg-app-baunilha-dourada/45"}`}>
        <div className="h-2 w-0 rounded-full bg-app-caramelo-torrado"/>
      </div>
    </article>);
}
function RepassesTable({ repasses }) {
    if (!repasses.length) {
        return (<div className="overflow-hidden rounded-[8px] bg-app-chantilly shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="grid gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid-cols-[1fr_1fr_1.2fr_1fr_1fr_1fr]">
        {tableHeaders.map((header) => (<span key={header}>{header}</span>))}
      </div>
      <div className="flex min-h-56 flex-col justify-center border-t border-app-baunilha-dourada/45 px-6 py-10">
        <h3 className="text-xl font-semibold text-app-cafe-profundo">
          Nenhum repasse registrado
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
          Os ciclos financeiros aparecerao nesta tabela apos os pagamentos confirmados.
        </p>
      </div>
    </div>);
    }
    return (<div className="overflow-hidden rounded-[8px] bg-app-chantilly shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="hidden gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid lg:grid-cols-[1fr_1fr_1.2fr_1fr_1fr_1fr]">
        {tableHeaders.map((header) => (<span key={header}>{header}</span>))}
      </div>
      <div className="divide-y divide-app-baunilha-dourada/45 border-t border-app-baunilha-dourada/45">
        {repasses.map((repasse) => (<article key={repasse.id_pagamento} className="grid gap-4 px-6 py-5 text-sm text-app-mocha lg:grid-cols-[1fr_1fr_1.2fr_1fr_1fr_1fr]">
          <div>
            <strong className="block text-app-cafe-profundo">Pedido #{repasse.id_pedido}</strong>
            <span className="text-xs text-app-cinza">{formatarData(repasse.data_pagamento ?? repasse.atualizado_em)}</span>
          </div>
          <span>{repasse.pedido?.clientes?.nome ?? "Cliente"}</span>
          <span>{formatarReserva(repasse.pedido?.reservas?.data_reserva, repasse.pedido?.reservas?.horario_inicio)}</span>
          <span>{obterTextoStatusPedido(repasse.pedido?.status_pedido)}</span>
          <div>
            <strong className="block text-app-caramelo-torrado">
              {repasse.pedido?.status_pedido === "CANCELADO" ? "Sem repasse" : obterTextoStatusRepasse(repasse.status_repasse)}
            </strong>
            <span className="text-xs text-app-cinza">{obterPrevisaoRepasse(repasse)}</span>
          </div>
          <div>
            <strong className="block text-app-cafe-profundo">{formatarMoeda(repasse.valor_restaurante)}</strong>
            <span className="text-xs text-app-cinza">
              Bruto {formatarMoeda(repasse.valor_pago ?? repasse.valor)}
            </span>
          </div>
        </article>))}
      </div>
    </div>);
}
function obterTextoStatusMercadoPago(status) {
    const statusMap = {
        NAO_CONECTADO: "Nao conectado",
        AGUARDANDO_AUTORIZACAO: "Aguardando autorizacao",
        CONECTADO: "Conectado",
        ERRO: "Erro na conexao",
        DESCONECTADO: "Desconectado",
    };
    return statusMap[status] ?? "Nao conectado";
}
export default function RestaurantFinancialReportPage() {
    const [session, setSession] = useState(null);
    const [sessaoCarregada, setSessaoCarregada] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [conexaoMercadoPago, setConexaoMercadoPago] = useState(null);
    const [resumoFinanceiro, setResumoFinanceiro] = useState({
        valor_bruto: 0,
        valor_comissao_app: 0,
        valor_restaurante: 0,
        quantidade_pagamentos: 0,
        quantidade_liberados: 0,
        valor_a_receber: 0,
        valor_liberado: 0,
        valor_estornado: 0,
    });
    const [repasses, setRepasses] = useState([]);
    const [mensagemMercadoPago, setMensagemMercadoPago] = useState("Carregando conexao Mercado Pago...");
    const [periodoAtivo, setPeriodoAtivo] = useState("30d");
    const [politicaFinanceira, setPoliticaFinanceira] = useState({
        percentual_comissao_app: 13,
        gatilho_repasse: "ENTREGA_DO_PEDIDO",
    });
    const isRestaurant = session?.type === "restaurant";

    useEffect(() => {
        apiRequest("/me")
            .then((resposta) => {
                const sessionType = resposta.tipo === "restaurante" ? "restaurant" : "client";
                const sessaoAtualizada = {
                    type: sessionType,
                    name: resposta.perfil?.nome ?? "Perfil Appono",
                };
                window.localStorage.setItem("appono:session", JSON.stringify(sessaoAtualizada));
                setSession(sessaoAtualizada);
            })
            .catch((error) => {
                setSession(null);
                setMensagemMercadoPago(error instanceof Error ? error.message : "Entre novamente para conectar o Mercado Pago.");
            })
            .finally(() => setSessaoCarregada(true));
    }, []);

    useEffect(() => {
        if (!sessaoCarregada) {
            return;
        }
        if (!isRestaurant) {
            return;
        }
        apiRequest("/marketplace/mercado-pago/status")
            .then((resposta) => {
                setConexaoMercadoPago(resposta.conexao);
                setMensagemMercadoPago("");
            })
            .catch((error) => {
                setMensagemMercadoPago(error instanceof Error ? error.message : "Nao foi possivel consultar o Mercado Pago.");
            });
        apiRequest(`/marketplace/financeiro/resumo?periodo=${periodoAtivo}`)
            .then((resposta) => {
                setResumoFinanceiro(resposta.resumo);
                setRepasses(resposta.repasses ?? []);
                if (resposta.politica_financeira) {
                    setPoliticaFinanceira(resposta.politica_financeira);
                }
            })
            .catch((error) => {
                setMensagemMercadoPago(error instanceof Error ? error.message : "Nao foi possivel consultar o financeiro.");
            });
    }, [isRestaurant, sessaoCarregada, periodoAtivo]);

    if (!sessaoCarregada) {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Validando sessao</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Estamos conferindo se esta conta pertence a um restaurante.
          </p>
        </section>
      </main>);
    }
    if (!isRestaurant) {
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
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 4
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-end gap-3 justify-self-end"><ItemHeaderNotificacoes href="/restaurante/notificacoes"/><button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-finance-menu"><Icon type="menu"/></button></div>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-finance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 4
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Financeiro
            </p>
            <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
              Relatorio Financeiro
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
              Veja vendas validas, repasses e saude financeira da operacao. Pedidos cancelados nao entram no total de vendas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {periodos.map((periodo) => (<button key={periodo.value} type="button" onClick={() => setPeriodoAtivo(periodo.value)} className={`inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition ${periodoAtivo === periodo.value
                ? "bg-app-cafe-profundo text-app-creme-leve"
                : "bg-app-creme-suave text-app-mocha hover:bg-app-baunilha-dourada"}`}>
              {periodo.label}
            </button>))}
          </div>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {financeCards.map((card, index) => (<FinanceCard key={card.label} label={card.label} value={resumoFinanceiro[card.key]} featured={index === 0}/>))}
        </section>

        <section className="mt-10 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                Marketplace Mercado Pago
              </p>
              <h2 className="mt-2 text-2xl font-medium text-app-cafe-profundo">
                Conta de recebimento configurada
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-mocha">
                Acompanhe os recebimentos vinculados aos pedidos e o valor liquido previsto para repasse.
              </p>
            </div>
            <div className="rounded-[8px] bg-app-chantilly p-5 text-sm ring-1 ring-app-baunilha-dourada/45 lg:min-w-80">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-cinza">
                Status da conexao
              </p>
              <strong className="mt-2 block text-xl text-app-cafe-profundo">
                {obterTextoStatusMercadoPago(conexaoMercadoPago?.status)}
              </strong>
              {conexaoMercadoPago?.mercado_pago_user_id ? (
                <p className="mt-2 text-xs text-app-mocha">
                  Conta MP: {conexaoMercadoPago.mercado_pago_user_id}
                </p>
              ) : null}
              {conexaoMercadoPago?.conectado_em ? (
                <p className="mt-1 text-xs text-app-cinza">
                  Conectado em {new Date(conexaoMercadoPago.conectado_em).toLocaleDateString("pt-BR")}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-6">
            {mensagemMercadoPago ? (
              <p className="text-sm font-semibold text-app-caramelo-torrado">
                {mensagemMercadoPago}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-10">
          <RepassesTable repasses={repasses} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
              Politica comercial
            </p>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              A Appono aplica uma taxa de plataforma sobre pedidos pagos. O detalhamento contabil e a conciliacao ficam na administracao da Appono.
            </p>
            <div className="mt-6 grid gap-5">
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">Comissao da plataforma</span>
                <strong className="text-app-cafe-profundo">
                  {Number(politicaFinanceira.percentual_comissao_app ?? 13).toLocaleString("pt-BR")}% por pedido pago
                </strong>
              </div>
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">Liberacao</span>
                <strong className="text-app-cafe-profundo">Apos entrega</strong>
              </div>
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">Cancelamentos</span>
                <strong className="text-app-cafe-profundo">Estorno financeiro</strong>
              </div>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <h2 className="text-2xl font-medium italic text-app-cafe-profundo">
              Crescimento Mensal
            </h2>
            <div className="mt-8 flex min-h-44 items-end gap-4 rounded-[8px] border border-dashed border-app-caramelo-torrado/25 bg-app-creme-leve px-5 py-6">
              {Array.from({ length: 5 }).map((_, index) => (<div key={index} className="h-16 flex-1 rounded-t-[8px] bg-app-baunilha-dourada/45"/>))}
            </div>
            <p className="mt-5 text-sm leading-6 text-app-cinza">
              O crescimento mensal aparecera neste painel.
            </p>
          </article>
        </section>
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
