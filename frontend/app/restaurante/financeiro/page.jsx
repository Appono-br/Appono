"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido, textoStatusRepasse } from "@/lib/formatadores-status";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
const navItems = [
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
const financeCards = [
    {
        label: "Receita considerada",
        key: "valor_bruto",
        description: "Valor pago menos reembolsos. Entram pedidos entregues, em andamento e ausencias com retencao.",
    },
    {
        label: "Valor do restaurante",
        key: "valor_liquido_recebido",
        description: "Parte do restaurante depois da taxa Appono e dos reembolsos aplicados.",
    },
    {
        label: "Retido ate entrega",
        key: "valor_a_receber",
        description: "Pedidos pagos que ainda aguardam conclusao.",
    },
];
const tableHeaders = ["Pedido", "Cliente", "Reserva", "Pedido", "Repasse", "Reembolso", "Valor restaurante"];
const periodos = [
    { label: "Hoje", value: "hoje" },
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "Todos", value: "todos" },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
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
    const valorRestaurante = Number(repasse.valor_restaurante ?? 0);
    if (repasse.pedido?.status_pedido === "CANCELADO" && valorRestaurante > 0) {
        return "Minimo retido por ausencia";
    }
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

function FinanceCard({ label, value, description, featured = false, }) {
    return (<article className={`min-h-40 rounded-[8px] p-5 shadow-sm ${featured
            ? "bg-app-cafe-profundo text-app-creme-leve"
            : "bg-white text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/45"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${featured ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
        {label}
      </p>
      <strong className="mt-5 block text-2xl font-semibold sm:text-3xl">{formatarMoeda(value)}</strong>
      <p className={`mt-4 text-xs leading-5 ${featured ? "text-app-creme-suave" : "text-app-cinza"}`}>
        {description}
      </p>
    </article>);
}
function RepassesTable({ repasses }) {
    if (!repasses.length) {
        return (<div className="overflow-hidden rounded-[8px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="grid gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
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
    return (<div className="overflow-hidden rounded-[8px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="hidden gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
        {tableHeaders.map((header) => (<span key={header}>{header}</span>))}
      </div>
      <div className="divide-y divide-app-baunilha-dourada/45 border-t border-app-baunilha-dourada/45">
        {repasses.map((repasse) => {
          const valorRestaurante = Number(repasse.valor_restaurante ?? 0);
          const reembolso = Number(repasse.valor_reembolsado ?? 0);
          const canceladoComRetencao = repasse.pedido?.status_pedido === "CANCELADO" && valorRestaurante > 0;
          return (<article key={repasse.id_pagamento} className="grid gap-4 px-6 py-5 text-sm text-app-mocha lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
          <div>
            <strong className="block text-app-cafe-profundo">Pedido #{repasse.id_pedido}</strong>
            <span className="text-xs text-app-cinza">{formatarData(repasse.data_pagamento ?? repasse.atualizado_em)}</span>
          </div>
          <span>{repasse.pedido?.clientes?.nome ?? "Cliente"}</span>
          <span>{formatarReserva(repasse.pedido?.reservas?.data_reserva, repasse.pedido?.reservas?.horario_inicio)}</span>
          <span>{textoStatusPedido(repasse.pedido?.status_pedido)}</span>
          <div>
            <strong className="block text-app-caramelo-torrado">
              {canceladoComRetencao ? "Retencao por ausencia" : repasse.pedido?.status_pedido === "CANCELADO" ? "Sem repasse" : textoStatusRepasse(repasse.status_repasse)}
            </strong>
            <span className="text-xs text-app-cinza">{obterPrevisaoRepasse(repasse)}</span>
          </div>
          <strong className="block text-app-cafe-profundo">{formatarMoeda(reembolso)}</strong>
          <div>
            <strong className="block text-app-cafe-profundo">{formatarMoeda(repasse.valor_restaurante)}</strong>
            <span className="text-xs text-app-cinza">
              Bruto {formatarMoeda(repasse.valor_pago ?? repasse.valor)}
            </span>
          </div>
        </article>);
        })}
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
    const { sessao: session, sessaoCarregada } = useSessaoLocal();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [conexaoMercadoPago, setConexaoMercadoPago] = useState(null);
    const [resumoFinanceiro, setResumoFinanceiro] = useState({
        valor_bruto: 0,
        valor_comissao_app: 0,
        valor_restaurante: 0,
        valor_liquido_recebido: 0,
        quantidade_pagamentos: 0,
        quantidade_liberados: 0,
        valor_a_receber: 0,
        valor_liberado: 0,
        valor_reembolsado: 0,
    });
    const [repasses, setRepasses] = useState([]);
    const [mensagemMercadoPago, setMensagemMercadoPago] = useState("Carregando conexao Mercado Pago...");
    const [acaoMercadoPago, setAcaoMercadoPago] = useState(false);
    const [modalMercadoPago, setModalMercadoPago] = useState(null);
    const [periodoAtivo, setPeriodoAtivo] = useState("30d");
    const [politicaFinanceira, setPoliticaFinanceira] = useState({
        percentual_comissao_app: 13,
        gatilho_repasse: "ENTREGA_DO_PEDIDO",
    });
    const isRestaurant = session?.type === "restaurant";
    const mercadoPagoConectado = conexaoMercadoPago?.status === "CONECTADO";

    useEffect(() => {
        const statusMercadoPago = searchParams.get("mercado_pago");
        const detalheMercadoPago = searchParams.get("detalhe");
        let mensagemRetorno = "";
        if (statusMercadoPago === "erro" && detalheMercadoPago === "conta-producao") {
            mensagemRetorno = "A conta selecionada no Mercado Pago e de producao. Para testar sem transacao real, saia dessa conta no Mercado Pago e conecte uma conta vendedora de teste.";
        }
        else if (statusMercadoPago === "conectado") {
            mensagemRetorno = "Conta Mercado Pago conectada com sucesso.";
        }
        else if (statusMercadoPago === "erro") {
            mensagemRetorno = "Nao foi possivel concluir a conexao Mercado Pago. Tente novamente com a conta correta.";
        }
        if (mensagemRetorno) {
            queueMicrotask(() => setMensagemMercadoPago(mensagemRetorno));
        }
    }, [searchParams]);

    async function carregarStatusMercadoPago() {
        const resposta = await apiRequest("/marketplace/mercado-pago/status", { forceRefresh: true });
        setConexaoMercadoPago(resposta.conexao);
        setMensagemMercadoPago("");
        return resposta;
    }

    async function confirmarAcaoMercadoPago() {
        if (modalMercadoPago === "conectar") {
            await conectarMercadoPagoOAuth();
            return;
        }
        if (modalMercadoPago === "desconectar") {
            await desconectarMercadoPago();
        }
    }

    async function conectarMercadoPagoOAuth() {
        setAcaoMercadoPago(true);
        setMensagemMercadoPago("");
        try {
            const resposta = await apiRequest("/marketplace/mercado-pago/conectar", { method: "POST" });
            if (!resposta.authorization_url) {
                throw new Error("O Mercado Pago nao retornou a URL de autorizacao.");
            }
            window.location.assign(resposta.authorization_url);
        }
        catch (error) {
            setMensagemMercadoPago(error instanceof Error ? error.message : "Nao foi possivel iniciar a conexao Mercado Pago.");
            setAcaoMercadoPago(false);
        }
    }

    async function desconectarMercadoPago() {
        setAcaoMercadoPago(true);
        setMensagemMercadoPago("");
        try {
            const resposta = await apiRequest("/marketplace/mercado-pago/desconectar", { method: "POST" });
            setConexaoMercadoPago(resposta.conexao);
            setMensagemMercadoPago("Conta Mercado Pago desconectada.");
            setModalMercadoPago(null);
        }
        catch (error) {
            setMensagemMercadoPago(error instanceof Error ? error.message : "Nao foi possivel desconectar a conta.");
        }
        finally {
            setAcaoMercadoPago(false);
        }
    }

    useEffect(() => {
        if (!sessaoCarregada) {
            return;
        }
        if (!isRestaurant) {
            return;
        }
        queueMicrotask(() => {
            carregarStatusMercadoPago()
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
        });
    }, [isRestaurant, sessaoCarregada, periodoAtivo]);

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
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
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
            {navItems.map((item) => (<Link key={item.label} href={item.href} className={item.href === "/restaurante/financeiro"
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-finance-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-finance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/financeiro"
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
            <Link href="/restaurante/reembolsos" className="mt-5 inline-flex rounded-[8px] border border-app-caramelo-torrado px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">
              Analisar reembolsos
            </Link>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
              Acompanhe valores pagos, reembolsos e repasses. Ausencia avisada pode manter o minimo do restaurante e devolver apenas o excedente ao cliente.
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

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {financeCards.map((card, index) => (<FinanceCard key={card.label} label={card.label} value={resumoFinanceiro[card.key]} description={card.description} featured={index === 1}/>))}
        </section>

        <section className="mt-8 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                Marketplace Mercado Pago
              </p>
              <h2 className="mt-2 text-2xl font-medium text-app-cafe-profundo">
                Conta de recebimento
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-mocha">
                Esta conta recebe os repasses dos pedidos entregues e valores retidos por ausencia conforme a regra comercial da Appono.
              </p>
            </div>
            <div className="rounded-[8px] bg-white p-5 text-sm ring-1 ring-app-baunilha-dourada/45 lg:min-w-96">
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
              {mercadoPagoConectado ? (
                <button
                  type="button"
                  disabled={acaoMercadoPago}
                  onClick={() => setModalMercadoPago("desconectar")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-app-caramelo-torrado px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-caramelo-torrado hover:text-app-creme-leve disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acaoMercadoPago ? "Desconectando..." : "Desconectar conta"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={acaoMercadoPago}
                  onClick={() => setModalMercadoPago("conectar")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-app-cafe-profundo px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acaoMercadoPago ? "Abrindo login..." : "Conectar Mercado Pago"}
                </button>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[8px] bg-white p-4 text-sm leading-6 text-app-mocha ring-1 ring-app-baunilha-dourada/45">
              {mercadoPagoConectado ? (
                <p>
                  Sua conta Mercado Pago esta conectada. Para trocar de vendedor, desconecte a conta atual e conecte novamente pelo login do Mercado Pago.
                </p>
              ) : (
                <p>
                  Conecte a conta de recebimento do restaurante. A Appono abrira o login seguro do Mercado Pago para autorizacao.
                </p>
              )}
            </div>
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

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
              Politica comercial
            </p>
            <h2 className="mt-3 text-2xl font-medium text-app-cafe-profundo">
              Taxa da Appono
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              A taxa e aplicada somente sobre pedidos pagos e validos. Cancelamentos nao entram nos indicadores de venda nem no valor previsto para repasse.
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
              Leitura dos valores
            </p>
            <h2 className="mt-3 text-2xl font-medium text-app-cafe-profundo">
              Como interpretar o relatorio
            </h2>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-app-mocha">
              <p>
                <strong className="text-app-cafe-profundo">Receita considerada:</strong> mostra o valor aprovado que permaneceu na operacao depois dos reembolsos.
              </p>
              <p>
                <strong className="text-app-cafe-profundo">Valor do restaurante:</strong> mostra a parte do restaurante sobre pedidos validos e ausencias com minimo retido.
              </p>
              <p>
                <strong className="text-app-cafe-profundo">Retido ate entrega:</strong> valor ainda protegido pela Appono enquanto o pedido nao foi entregue.
              </p>
              <p>
                <strong className="text-app-cafe-profundo">Reembolso:</strong> aparece na tabela quando parte do pagamento voltou ao cliente.
              </p>
            </div>
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

      {modalMercadoPago ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/65 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-mercado-pago-titulo">
          <section className="w-full max-w-lg rounded-[14px] bg-app-creme-leve p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-app-baunilha-dourada/70 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
              Mercado Pago
            </p>
            <h2 id="modal-mercado-pago-titulo" className="mt-3 text-2xl font-semibold">
              {modalMercadoPago === "conectar" ? "Conectar conta Mercado Pago?" : "Desconectar conta Mercado Pago?"}
            </h2>
            <p className="mt-4 text-sm leading-6 text-app-mocha">
              {modalMercadoPago === "conectar"
                ? "A Appono vai abrir a tela segura do Mercado Pago para login e autorizacao. Se quiser usar outra conta, saia da conta atual do Mercado Pago ou use uma janela anonima antes de continuar."
                : "Ao desconectar, este restaurante deixa de ter uma conta Mercado Pago vinculada para recebimento. Voce podera conectar novamente depois."}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={acaoMercadoPago} onClick={() => setModalMercadoPago(null)} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-60">
                Cancelar
              </button>
              <button type="button" disabled={acaoMercadoPago} onClick={confirmarAcaoMercadoPago} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                {acaoMercadoPago ? "Processando..." : modalMercadoPago === "conectar" ? "Continuar" : "Desconectar"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>);
}
