"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useInterface } from "@/lib/use-interface";

const moeda = (valor, locale = "pt-BR") => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
const rotuloStatus = (status) => ({
  PENDENTE_PAGAMENTO: "Pagamento pendente",
  ATIVA: "Ativa",
  INADIMPLENTE: "Inadimplente",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  ESTORNADA: "Estornada",
}[String(status ?? "").toUpperCase()] ?? String(status ?? "").replaceAll("_", " "));

export default function PlanoRestaurantePage() {
  const { ui, localeUI } = useInterface();
  const [dados, setDados] = useState(null);
  const [mensagem, setMensagem] = useState("Carregando plano e faturamento...");
  const [carregando, setCarregando] = useState(false);
  const carregar = () => apiRequest("/planos/assinatura", { forceRefresh: true }).then((resposta) => { setDados(resposta); setMensagem(resposta.sincronizacao_pendente ? "Nao foi possivel confirmar o pagamento agora. Tentaremos novamente automaticamente." : ""); return resposta; }).catch((error) => { setMensagem(error.message); return null; });
  useEffect(() => {
    let encerrado = false;
    let emAndamento = false;
    let timer;
    const verificarPagamento = async () => {
      if (encerrado || emAndamento) return;
      clearTimeout(timer);
      emAndamento = true;
      let resposta;
      try {
        if (document.visibilityState === "visible") resposta = await carregar();
      } finally {
        emAndamento = false;
        if (!encerrado) timer = setTimeout(verificarPagamento, resposta?.assinatura?.status === "PENDENTE_PAGAMENTO" ? 5000 : 30000);
      }
    };
    verificarPagamento();
    window.addEventListener("focus", verificarPagamento);
    return () => {
      encerrado = true;
      clearTimeout(timer);
      window.removeEventListener("focus", verificarPagamento);
    };
  }, []);
  async function contratar() {
    setCarregando(true); setMensagem("");
    try { const resposta = await apiRequest("/planos/checkout", { method: "POST", body: JSON.stringify({ plano: "PROFISSIONAL" }) }); window.location.assign(resposta.checkout_url); }
    catch (error) { setMensagem(error.message); setCarregando(false); }
  }
  async function cancelar() {
    setCarregando(true); setMensagem("");
    try { const resposta = await apiRequest("/planos/cancelar-renovacao", { method: "POST" }); setMensagem(resposta.message); await carregar(); }
    catch (error) { setMensagem(error.message); }
    finally { setCarregando(false); }
  }
  const assinatura = dados?.assinatura;
  const profissional = assinatura?.codigo_plano === "PROFISSIONAL" && assinatura?.status === "ATIVA";
  const aguardandoPagamentoProfissional = assinatura?.codigo_plano === "PROFISSIONAL" && assinatura?.status !== "ATIVA";
  return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto w-full max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-app-caramelo-torrado">Assinatura</p><h1 className="mt-2 text-4xl font-semibold">Plano e faturamento</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-app-cinza">Escolha como a Appono apoia o crescimento do seu restaurante. A taxa de comissão é salva em cada venda, preservando seu histórico.</p>
    {mensagem ? <p className="mt-6 rounded-lg bg-app-creme-leve p-4 text-sm text-app-mocha">{ui(mensagem)}</p> : null}
    <section className="mt-8 grid gap-5 md:grid-cols-2">{(dados?.planos ?? []).map((plano) => { const ativo = plano.codigo === "INICIAL" ? assinatura?.codigo_plano === "INICIAL" && assinatura?.status === "ATIVA" : profissional; const selecionadoPendente = plano.codigo === "PROFISSIONAL" && aguardandoPagamentoProfissional; return <article key={plano.codigo} className={`rounded-xl border p-6 ${ativo ? "border-app-caramelo-torrado bg-app-creme-leve" : "border-app-baunilha-dourada bg-white"}`}><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">{plano.nome}</h2><p className="mt-2 text-sm text-app-cinza">{plano.mensalidade ? `${moeda(plano.mensalidade, localeUI)}/mês` : "Sem mensalidade"} · {plano.percentual_comissao}% de comissão por prato vendido.</p></div>{ativo ? <span className="rounded-full bg-app-caramelo-torrado px-3 py-1 text-xs font-bold text-white">Plano atual</span> : selecionadoPendente ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Pagamento pendente</span> : null}</div><ul className="mt-6 grid gap-2 text-sm text-app-mocha"><li>✓ Cardápio, reservas, pedidos e desempenho</li><li>✓ {plano.destaque_profissional ? "Destaque Profissional em áreas relevantes" : "Presença orgânica na Appono"}</li><li>✓ {plano.campanhas_inteligentes ? "Campanhas Inteligentes e métricas de conversão" : "Sem campanhas promocionais"}</li></ul>{plano.codigo === "PROFISSIONAL" && !profissional ? <button type="button" disabled={carregando} onClick={contratar} className="mt-6 h-11 rounded-lg bg-app-dourado-mel px-5 text-sm font-bold text-white disabled:opacity-60">{carregando ? "Preparando checkout..." : selecionadoPendente ? "Continuar para o Mercado Pago" : "Assinar Profissional"}</button> : null}</article>; })}</section>
    {assinatura ? <section className="mt-8 rounded-xl border border-app-baunilha-dourada p-6"><h2 className="text-xl font-semibold">Situação da assinatura</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-app-cinza">Status</dt><dd className="mt-1 font-semibold">{rotuloStatus(assinatura.status)}</dd></div><div><dt className="text-app-cinza">Próxima renovação</dt><dd className="mt-1 font-semibold">{assinatura.periodo_fim_em ? new Date(assinatura.periodo_fim_em).toLocaleDateString(localeUI) : "Não se aplica"}</dd></div><div><dt className="text-app-cinza">Cancelamento</dt><dd className="mt-1 font-semibold">{assinatura.cancelar_no_fim_do_periodo ? "Programado ao fim do período" : "Renovação ativa"}</dd></div></dl>{profissional && !assinatura.cancelar_no_fim_do_periodo ? <button type="button" disabled={carregando} onClick={cancelar} className="mt-6 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-60">Cancelar renovação</button> : null}{profissional && assinatura.status === "ATIVA" ? <Link href="/restaurante/campanhas" className="ml-3 inline-flex rounded-lg bg-app-cafe-profundo px-4 py-2 text-sm font-semibold text-white">Abrir campanhas</Link> : null}</section> : null}
    {dados?.cobrancas?.length ? <section className="mt-8 overflow-hidden rounded-xl border border-app-baunilha-dourada"><h2 className="p-6 text-xl font-semibold">Histórico de cobranças</h2>{dados.cobrancas.map((cobranca) => <div key={cobranca.id_cobranca} className="flex items-center justify-between border-t border-app-baunilha-dourada px-6 py-4 text-sm"><span>{new Date(cobranca.criado_em).toLocaleDateString(localeUI)}</span><span>{rotuloStatus(cobranca.status)}</span><strong>{moeda(cobranca.valor, localeUI)}</strong></div>)}</section> : null}
  </section></main>;
}
