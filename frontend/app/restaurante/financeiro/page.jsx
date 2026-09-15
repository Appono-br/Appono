"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { obterIndicadoresFinanceiros } from "@/lib/resumo-financeiro";
import { useIdiomaLocal } from "@/lib/use-idioma-local";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido, textoStatusRepasse } from "@/lib/formatadores-status";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
const navItems = [
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestão de cardápio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatório financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Histórico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Suporte", href: "/restaurante/suporte" },
    { label: "Configurações", href: "/restaurante/configuracoes" },
];
const financeCards = [
    {
        label: "Venda bruta",
        key: "bruto",
        description: "Pagamentos aprovados antes das deduções. Exclui estornos e cancelamentos sem retenção.",
    },
    {
        label: "Valor líquido",
        key: "liquido",
        description: "Parte do restaurante após comissão e reembolsos informados. Não significa saldo já recebido.",
    },
    {
        label: "A receber",
        key: "pendente",
        description: "Parte do restaurante aguardando entrega ou liberada para repasse, ainda não repassada.",
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
function formatarMoeda(valor, idioma = "pt-BR") {
    return new Intl.NumberFormat(idioma, {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarData(data, localeUI = "pt-BR") {
    if (!data) {
        return localeUI.startsWith("en") ? "No date" : "Sem data";
    }
    return new Date(data).toLocaleDateString(localeUI);
}

function formatarReserva(data, horario, localeUI = "pt-BR") {
    if (!data) {
        return localeUI.startsWith("en") ? "No reservation" : "Sem reserva";
    }
    const dataFormatada = new Date(`${data}T12:00:00`).toLocaleDateString(localeUI);
    return horario ? `${dataFormatada} ${localeUI.startsWith("en") ? "at" : "às"} ${String(horario).slice(0, 5)}` : dataFormatada;
}

function obterPrevisaoRepasse(repasse) {
    const valorRestaurante = Number(repasse.valor_restaurante ?? 0);
    if (repasse.pedido?.status_pedido === "CANCELADO" && valorRestaurante > 0) {
        return "Mínimo retido por ausência";
    }
    if (repasse.pedido?.status_pedido === "CANCELADO") {
        return "Pedido cancelado";
    }
    if (repasse.status_repasse === "REPASSADO") return "Repassado";
    if (repasse.status_repasse === "LIBERADO_PARA_REPASSE") {
        return "Disponível para repasse";
    }
    if (repasse.status_repasse === "ESTORNADO") {
        return "Sem repasse";
    }
    return "Após confirmação de entrega";
}

function FinanceCard({ label, value, description, idioma, carregando, erro }) {
    const { ui } = useInterface();
    return (<div className="min-w-0 p-5 sm:p-6">
      <dt className="text-sm font-semibold text-app-mocha">{ui(label)}</dt>
      <dd className="mt-3 break-words text-2xl font-semibold tabular-nums text-app-cafe-profundo sm:text-3xl">{ui(carregando ? "Carregando..." : erro ? "Erro ao carregar" : value === null ? "Indisponível" : formatarMoeda(value, idioma))}</dd>
      <p className="mt-3 text-sm leading-6 text-app-cinza">{ui(description)}</p>
      {!carregando && !erro && value === null ? <p className="mt-2 text-xs text-app-cinza">{ui("Faltam valores ou estados financeiros suficientes na resposta.")}</p> : null}
    </div>);
}
function RepassesTable({ repasses }) {
    const { ui , localeUI } = useInterface();
    if (!repasses.length) {
        return (<div className="overflow-hidden rounded-[8px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="grid gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
        {tableHeaders.map((header) => (<span key={header}>{ui(header)}</span>))}
      </div>
      <div className="flex min-h-56 flex-col justify-center border-t border-app-baunilha-dourada/45 px-6 py-10">
        <h3 className="text-xl font-semibold text-app-cafe-profundo">{ui("Nenhum repasse registrado")}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">{ui("Os ciclos financeiros aparecerão nesta tabela após os pagamentos confirmados.")}</p>
      </div>
    </div>);
    }
    return (<div className="overflow-hidden rounded-[8px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="hidden gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha lg:grid lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
        {tableHeaders.map((header) => (<span key={header}>{ui(header)}</span>))}
      </div>
      <div className="divide-y divide-app-baunilha-dourada/45 border-t border-app-baunilha-dourada/45">
        {repasses.map((repasse) => {
          const valorRestaurante = Number(repasse.valor_restaurante ?? 0);
          const reembolso = Number(repasse.valor_reembolsado ?? 0);
          const canceladoComRetencao = repasse.pedido?.status_pedido === "CANCELADO" && valorRestaurante > 0;
          return (<article key={repasse.id_pagamento} className="grid gap-4 px-6 py-5 text-sm text-app-mocha lg:grid-cols-[0.8fr_1fr_1.1fr_0.9fr_1fr_0.8fr_0.9fr]">
          <div>
            <strong className="block text-app-cafe-profundo">{ui("Pedido #")}{repasse.id_pedido}</strong>
            <span className="text-xs text-app-cinza">{formatarData(repasse.data_pagamento ?? repasse.atualizado_em, localeUI)}</span>
          </div>
          <span>{repasse.pedido?.clientes?.nome ?? ui("Cliente")}</span>
          <span>{formatarReserva(repasse.pedido?.reservas?.data_reserva, repasse.pedido?.reservas?.horario_inicio, localeUI)}</span>
          <span>{ui(textoStatusPedido(repasse.pedido?.status_pedido))}</span>
          <div>
            <strong className="block text-app-caramelo-torrado">
              {ui(canceladoComRetencao ? "Retenção por ausência" : repasse.pedido?.status_pedido === "CANCELADO" ? "Sem repasse" : textoStatusRepasse(repasse.status_repasse))}
            </strong>
            <span className="text-xs text-app-cinza">{ui(obterPrevisaoRepasse(repasse))}</span>
          </div>
          <strong className="block text-app-cafe-profundo">{formatarMoeda(reembolso, localeUI)}</strong>
          <div>
            <strong className="block text-app-cafe-profundo">{formatarMoeda(repasse.valor_restaurante, localeUI)}</strong>
            <span className="text-xs text-app-cinza">{ui("Bruto ")}{formatarMoeda(repasse.valor_pago ?? repasse.valor, localeUI)}
            </span>
          </div>
        </article>);
        })}
      </div>
    </div>);
}
function obterTextoStatusMercadoPago(status) {
    const statusMap = {
        NAO_CONECTADO: "Não conectado",
        AGUARDANDO_AUTORIZACAO: "Aguardando autorização",
        CONECTADO: "Conectado",
        ERRO: "Erro na conexão",
        DESCONECTADO: "Desconectado",
    };
    return statusMap[status] ?? "Não conectado";
}
export default function RestaurantFinancialReportPage() {
    const { ui, localeUI } = useInterface();
    const { idioma } = useIdiomaLocal();
    const { sessao: session, sessaoCarregada } = useSessaoLocal();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [conexaoMercadoPago, setConexaoMercadoPago] = useState(null);
    const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
    const [estadoFinanceiro, setEstadoFinanceiro] = useState({ periodo: null, erro: false });
    const [repasses, setRepasses] = useState([]);
    const [mensagemMercadoPago, setMensagemMercadoPago] = useState("Carregando conexão Mercado Pago...");
    const [acaoMercadoPago, setAcaoMercadoPago] = useState(false);
    const [modalMercadoPago, setModalMercadoPago] = useState(null);
    const [periodoAtivo, setPeriodoAtivo] = useState("30d");
    const [politicaFinanceira, setPoliticaFinanceira] = useState({
        percentual_comissao_app: 13,
        gatilho_repasse: "ENTREGA_DO_PEDIDO",
    });
    const isRestaurant = session?.type === "restaurant";
    const mercadoPagoConectado = conexaoMercadoPago?.status === "CONECTADO";
    const carregandoFinanceiro = estadoFinanceiro.periodo !== periodoAtivo;
    const indicadores = obterIndicadoresFinanceiros(resumoFinanceiro, repasses);

    useEffect(() => {
        const statusMercadoPago = searchParams.get("mercado_pago");
        const detalheMercadoPago = searchParams.get("detalhe");
        let mensagemRetorno = "";
        if (statusMercadoPago === "erro" && detalheMercadoPago === "conta-producao") {
            mensagemRetorno = "A conta selecionada no Mercado Pago e de produção. Para testar sem transação real, saia dessa conta no Mercado Pago e conecte uma conta vendedora de teste.";
        }
        else if (statusMercadoPago === "conectado") {
            mensagemRetorno = "Conta Mercado Pago conectada com sucesso.";
        }
        else if (statusMercadoPago === "erro") {
            mensagemRetorno = "Não foi possível concluir a conexão Mercado Pago. Tente novamente com a conta correta.";
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
                throw new Error("O Mercado Pago não retornou a URL de autorização.");
            }
            window.location.assign(resposta.authorization_url);
        }
        catch (error) {
            setMensagemMercadoPago(error instanceof Error ? error.message : "Não foi possível iniciar a conexão Mercado Pago.");
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
            setMensagemMercadoPago(error instanceof Error ? error.message : "Não foi possível desconectar a conta.");
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
        let cancelado = false;
        queueMicrotask(() => {
            if (cancelado) return;
            carregarStatusMercadoPago()
                .catch((error) => {
                    setMensagemMercadoPago(error instanceof Error ? error.message : "Não foi possível consultar o Mercado Pago.");
                });
            apiRequest(`/marketplace/financeiro/resumo?periodo=${periodoAtivo}`)
                .then((resposta) => {
                    if (cancelado) return;
                    setResumoFinanceiro(resposta.resumo);
                    setEstadoFinanceiro({ periodo: periodoAtivo, erro: !resposta.resumo || !Array.isArray(resposta.repasses) });
                    setRepasses(resposta.repasses ?? []);
                    if (resposta.politica_financeira) {
                        setPoliticaFinanceira(resposta.politica_financeira);
                    }
                })
                .catch(() => {
                    if (cancelado) return;
                    setResumoFinanceiro(null);
                    setRepasses([]);
                    setEstadoFinanceiro({ periodo: periodoAtivo, erro: true });
                });
        });
        return () => { cancelado = true; };
    }, [isRestaurant, sessaoCarregada, periodoAtivo]);

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Entrar")}</Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:min-h-20">
          <div aria-label={ui("Appono")}>
            <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
            {navItems.map((item) => (<Link key={item.label} href={item.href} className={item.href === "/restaurante/financeiro"
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {ui(item.label)}
              </Link>))}
          </nav>

          <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden" aria-label={ui("Abrir menu")} aria-expanded={mobileMenuOpen} aria-controls="restaurant-finance-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-finance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/financeiro"
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {ui(item.label)}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">{ui("Financeiro")}</p>
            <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">{ui("Relatório financeiro")}</h1>
            <Link href="/restaurante/reembolsos" className="mt-5 inline-flex rounded-[8px] border border-app-caramelo-torrado px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">{ui("Analisar reembolsos")}</Link>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">{ui("Acompanhe valores pagos, reembolsos e repasses. Ausência avisada pode manter o mínimo do restaurante e devolver apenas o excedente ao cliente.")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {periodos.map((periodo) => (<button key={periodo.value} type="button" onClick={() => setPeriodoAtivo(periodo.value)} className={`inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition ${periodoAtivo === periodo.value
                ? "bg-app-cafe-profundo text-app-creme-leve"
                : "bg-app-creme-suave text-app-mocha hover:bg-app-baunilha-dourada"}`}>
              {ui(periodo.label)}
            </button>))}
          </div>
        </div>

        <section aria-label={ui("Resumo financeiro")} aria-busy={carregandoFinanceiro} className="mt-8 rounded-xl border border-app-baunilha-dourada/60 bg-app-creme-leve">
          <div className="border-b border-app-baunilha-dourada/60 px-5 py-4">
            <h2 className="text-lg font-semibold">{ui("Resumo do período")}</h2>
            <p className="mt-1 text-sm text-app-cinza">{ui("Período: ")}{ui(periodos.find((periodo) => periodo.value === periodoAtivo)?.label)}</p>
            <p className="mt-1 text-xs leading-5 text-app-cinza">{ui("Filtro por aprovação do pagamento; na ausência, data do pagamento ou da atualização. Valores em BRL.")}</p>
          </div>
          <dl className="grid divide-y divide-app-baunilha-dourada/60 md:grid-cols-3 md:divide-x md:divide-y-0">
            {financeCards.map((card) => (<FinanceCard key={card.key} label={ui(card.label)} value={indicadores[card.key]} description={ui(card.description)} idioma={idioma} carregando={carregandoFinanceiro} erro={estadoFinanceiro.erro}/>))}
          </dl>
          <p className="border-t border-app-baunilha-dourada/60 px-5 py-4 text-xs leading-5 text-app-cinza">{ui("Os indicadores se sobrepõem e não devem ser somados. Reembolsos parciais reduzem o líquido, não a venda bruta original.")}</p>
          {!carregandoFinanceiro && estadoFinanceiro.erro ? <p role="alert" className="px-5 pb-4 text-sm text-app-vermelho-erro">{ui("Não foi possível carregar o resumo financeiro. Recarregue a página ou selecione outro período.")}</p> : null}
          {!carregandoFinanceiro && !estadoFinanceiro.erro && !repasses.length ? <p role="status" className="px-5 pb-4 text-sm text-app-cinza">{ui("Nenhum pagamento aprovado neste período.")}</p> : null}
        </section>

        <section className="mt-8 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Marketplace Mercado Pago")}</p>
              <h2 className="mt-2 text-2xl font-medium text-app-cafe-profundo">{ui("Conta de recebimento")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-mocha">{ui("Esta conta recebe os repasses dos pedidos entregues e valores retidos por ausência conforme a regra comercial da Appono.")}</p>
            </div>
            <div className="rounded-[8px] bg-white p-5 text-sm ring-1 ring-app-baunilha-dourada/45 lg:min-w-96">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-cinza">{ui("Status da conexão")}</p>
              <strong className="mt-2 block text-xl text-app-cafe-profundo">
                {ui(obterTextoStatusMercadoPago(conexaoMercadoPago?.status))}
              </strong>
              {conexaoMercadoPago?.mercado_pago_user_id ? (
                <p className="mt-2 text-xs text-app-mocha">{ui("Conta MP: ")}{conexaoMercadoPago.mercado_pago_user_id}
                </p>
              ) : null}
              {conexaoMercadoPago?.conectado_em ? (
                <p className="mt-1 text-xs text-app-cinza">{ui("Conectado em ")}{new Date(conexaoMercadoPago.conectado_em).toLocaleDateString(localeUI)}
                </p>
              ) : null}
              {mercadoPagoConectado ? (
                <button
                  type="button"
                  disabled={acaoMercadoPago}
                  onClick={() => setModalMercadoPago("desconectar")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-app-caramelo-torrado px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-caramelo-torrado hover:text-app-creme-leve disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ui(acaoMercadoPago ? "Desconectando..." : "Desconectar conta")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={acaoMercadoPago}
                  onClick={() => setModalMercadoPago("conectar")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-app-cafe-profundo px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ui(acaoMercadoPago ? "Abrindo login..." : "Conectar Mercado Pago")}
                </button>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[8px] bg-white p-4 text-sm leading-6 text-app-mocha ring-1 ring-app-baunilha-dourada/45">
              {mercadoPagoConectado ? (
                <p>{ui("Sua conta Mercado Pago está conectada. Para trocar de vendedor, desconecte a conta atual e conecte novamente pelo login do Mercado Pago.")}</p>
              ) : (
                <p>{ui("Conecte a conta de recebimento do restaurante. A Appono abrira o login seguro do Mercado Pago para autorização.")}</p>
              )}
            </div>
            {mensagemMercadoPago ? (
              <p className="text-sm font-semibold text-app-caramelo-torrado">
                {ui(mensagemMercadoPago)}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-10">
          {!carregandoFinanceiro && !estadoFinanceiro.erro ? <RepassesTable repasses={repasses} /> : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">{ui("Política comercial")}</p>
            <h2 className="mt-3 text-2xl font-medium text-app-cafe-profundo">{ui("Taxa da Appono")}</h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">{ui("A comissão segue os dados do pagamento. Estornos e cancelamentos sem retenção ficam fora do resumo; ausências com retenção permanecem conforme os registros financeiros.")}</p>
            <div className="mt-6 grid gap-5">
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">{ui("Comissão da plataforma")}</span>
                <strong className="text-app-cafe-profundo">
                  {Number(politicaFinanceira.percentual_comissao_app ?? 13).toLocaleString(localeUI)}{ui("% por pedido pago")}</strong>
              </div>
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">{ui("Liberação")}</span>
                <strong className="text-app-cafe-profundo">{ui("Após entrega")}</strong>
              </div>
              <div className="flex items-center justify-between gap-5 text-sm">
                <span className="text-app-mocha">{ui("Cancelamentos")}</span>
                <strong className="text-app-cafe-profundo">{ui("Estorno financeiro")}</strong>
              </div>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">{ui("Leitura dos valores")}</p>
            <h2 className="mt-3 text-2xl font-medium text-app-cafe-profundo">{ui("Como interpretar o relatório")}</h2>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-app-mocha">
              <p>
                <strong className="text-app-cafe-profundo">{ui("Venda bruta:")}</strong>{ui(" pagamentos aprovados considerados, antes das deduções e dos reembolsos parciais.")}</p>
              <p>
                <strong className="text-app-cafe-profundo">{ui("Valor líquido:")}</strong>{ui(" mostra a parte do restaurante sobre pedidos válidos e ausências com mínimo retido.")}</p>
              <p>
                <strong className="text-app-cafe-profundo">{ui("A receber:")}</strong>{ui(" inclui valores aguardando entrega ou repasse. Não inclui pagamentos já repassados.")}</p>
              <p>
                <strong className="text-app-cafe-profundo">{ui("Reembolso:")}</strong>{ui(" aparece na tabela quando parte do pagamento voltou ao cliente.")}</p>
            </div>
          </article>
        </section>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Política de Privacidade")}</Link>
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Termos de Uso")}</Link>
            <Link href="#" className="transition hover:text-app-chantilly">{ui("Contato")}</Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">{ui("© 2026 APPONO. Todos os direitos reservados.")}</p>
        </div>
      </footer>

      {modalMercadoPago ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="modal-mercado-pago-titulo">
          <section className="w-full max-w-lg rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">{ui("Mercado Pago")}</p>
            <h2 id="modal-mercado-pago-titulo" className="mt-3 text-2xl font-semibold">
              {ui(modalMercadoPago === "conectar" ? "Conectar conta Mercado Pago?" : "Desconectar conta Mercado Pago?")}
            </h2>
            <p className="mt-4 text-sm leading-6 text-app-mocha">
              {ui(modalMercadoPago === "conectar"
                ? "A Appono vai abrir a tela segura do Mercado Pago para login e autorização. Se quiser usar outra conta, saia da conta atual do Mercado Pago ou use uma janela anonima antes de continuar."
                : "Ao desconectar, este restaurante deixa de ter uma conta Mercado Pago vinculada para recebimento. Você podera conectar novamente depois.")}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={acaoMercadoPago} onClick={() => setModalMercadoPago(null)} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-60">{ui("Cancelar")}</button>
              <button type="button" disabled={acaoMercadoPago} onClick={confirmarAcaoMercadoPago} className={`inline-flex h-11 items-center justify-center rounded-[8px] px-5 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${modalMercadoPago === "desconectar" ? "botao-acao-critica" : "bg-app-cafe-profundo text-app-creme-leve hover:bg-app-caramelo-torrado"}`}>
                {ui(acaoMercadoPago ? "Processando..." : modalMercadoPago === "conectar" ? "Continuar" : "Desconectar")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>);
}
