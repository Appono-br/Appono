"use strict";

const { supabaseAdmin: db } = require("../lib/supabase");
const { buscarFaturasAssinaturaMercadoPago, consultarPagamentoMercadoPago, consultarContaMercadoPago } = require("./pagamentos/mercado-pago");

// Reconsultar o provedor torna notificacoes repetidas ou fora de ordem seguras.
async function aplicarEstadoAssinaturaMercadoPago(assinatura, mp) {
  const conta = await consultarContaMercadoPago();
  if (String(mp.collector_id) !== String(conta.id)) throw new Error("Vendedor da assinatura divergente.");
  if (assinatura.mercadopago_preapproval_id && String(assinatura.mercadopago_preapproval_id) !== String(mp.id)) {
    throw new Error("Evento pertence a outra assinatura do restaurante.");
  }
  let faturas = [];
  try {
    faturas = await buscarFaturasAssinaturaMercadoPago(mp.id);
  } catch (error) {
    const statusMercadoPago = String(mp.status ?? "").toLowerCase();
    if (!['authorized', 'active'].includes(statusMercadoPago)) throw error;
    console.warn("Faturas da assinatura ainda não disponíveis; usando o status autorizado do Mercado Pago:", error.message);
  }
  const pagamentos = [];
  for (const fatura of faturas) {
    if (String(fatura.preapproval_id) !== String(mp.id) || !fatura.payment?.id) continue;
    const p = await consultarPagamentoMercadoPago(fatura.payment.id);
    if (!p) throw new Error("Nao foi possivel consultar o pagamento da assinatura.");
    if (String(p.collector_id) !== String(conta.id) || p.currency_id !== "BRL" || Number(p.transaction_amount) !== Number(assinatura.mensalidade)) {
      throw new Error("Pagamento da assinatura com vendedor, moeda ou valor divergente.");
    }
    pagamentos.push(p);
    const status = ({ approved: "APROVADA", rejected: "RECUSADA", cancelled: "RECUSADA", refunded: "ESTORNADA", charged_back: "ESTORNADA" })[p.status] ?? "PENDENTE";
    const { data: existentes, error: leituraError } = await db.from("cobrancas_assinatura_restaurante")
      .select("id_cobranca,mercadopago_payment_id,dados_provedor").eq("id_assinatura", assinatura.id_assinatura).order("id_cobranca");
    if (leituraError) throw leituraError;
    const existente = existentes.find(c => String(c.mercadopago_payment_id) === String(p.id)) ?? existentes.find(c => !c.mercadopago_payment_id &&
      (c.dados_provedor?.preapproval_id ? String(c.dados_provedor.preapproval_id) === String(mp.id) : String(c.dados_provedor?.preapproval_plan_id) === String(mp.preapproval_plan_id)));
    const campos = {
      status, valor: Number(p.transaction_amount), mercadopago_payment_id: String(p.id),
      pago_em: p.date_approved ?? null,
      dados_provedor: { preapproval_id: String(mp.id), preapproval_plan_id: mp.preapproval_plan_id, collector_id: String(conta.id), authorized_payment_id: String(fatura.id), payment_status: p.status },
    };
    let resultado;
    if (existente) {
      let query = db.from("cobrancas_assinatura_restaurante").update(campos).eq("id_cobranca", existente.id_cobranca);
      query = existente.mercadopago_payment_id ? query.eq("mercadopago_payment_id", String(p.id)) : query.is("mercadopago_payment_id", null);
      resultado = await query.select("id_cobranca");
      if (resultado.error) throw resultado.error;
    }
    if (!resultado?.data?.length) resultado = await db.from("cobrancas_assinatura_restaurante").upsert({ ...campos, id_assinatura: assinatura.id_assinatura, referencia_externa: `assinatura:payment:${p.id}` }, { onConflict: "mercadopago_payment_id" });
    if (resultado.error) throw resultado.error;
  }
  const aprovados = pagamentos.filter(p => p.status === "approved" && p.date_approved).sort((a,b) => new Date(b.date_approved) - new Date(a.date_approved));
  const ultimo = aprovados[0];
  let inicio = null, fim = null;
  if (ultimo) {
    inicio = ultimo.date_approved;
    const data = new Date(inicio);
    data.setUTCMonth(data.getUTCMonth() + 1);
    fim = data.toISOString();
    // A proxima cobranca do provedor delimita o ciclo, se posterior ao pagamento.
    // Nunca prolongar um periodo pago porque uma cobranca futura foi reagendada.
    if (mp.next_payment_date && new Date(mp.next_payment_date) > new Date(inicio) && new Date(mp.next_payment_date) < new Date(fim)) fim = mp.next_payment_date;
  } else if (["authorized", "active"].includes(String(mp.status ?? "").toLowerCase())) {
    // O Mercado Pago pode autorizar a assinatura antes de publicar a fatura
    // em /authorized_payments. O status autorizado já representa a aprovação
    // do checkout; a fatura será conciliada quando o webhook chegar.
    inicio = mp.date_created ?? mp.last_modified ?? new Date().toISOString();
    const data = new Date(inicio);
    data.setUTCMonth(data.getUTCMonth() + 1);
    fim = data.toISOString();
  }
  const pagoVigente = fim && new Date(fim) > new Date();
  const cancelada = ["cancelled", "canceled"].includes(mp.status);
  const status = pagoVigente ? "ATIVA" : cancelada ? "CANCELADA" : pagamentos.length ? "INADIMPLENTE" : "PENDENTE_PAGAMENTO";
  const { data, error } = await db.from("assinaturas_restaurante").update({
    status, mercadopago_preapproval_id: String(mp.id), mercadopago_preapproval_plan_id: mp.preapproval_plan_id,
    periodo_inicio_em: inicio, periodo_fim_em: fim,
    cancelar_no_fim_do_periodo: cancelada || assinatura.cancelar_no_fim_do_periodo,
  }).eq("id_assinatura", assinatura.id_assinatura).select("*").single();
  if (error) throw error;
  if (status === "ATIVA") {
    const { error: ativacaoError } = await db.from("restaurantes").update({ ativo: true }).eq("id_restaurante", assinatura.id_restaurante);
    if (ativacaoError) throw ativacaoError;
  }
  return data;
}

module.exports = { aplicarEstadoAssinaturaMercadoPago };
