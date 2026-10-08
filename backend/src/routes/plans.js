"use strict";

const crypto = require("node:crypto");
const { Router } = require("express");
const { supabaseAdmin, createUserSupabaseClient } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { obterAccessTokenMercadoPago, credenciaisTesteMercadoPagoValidas, consultarContaMercadoPago, criarPlanoAssinaturaMercadoPago, criarAssinaturaMercadoPago, buscarAssinaturasPlanoMercadoPago, consultarAssinaturaMercadoPago, atualizarAssinaturaMercadoPago } = require("../services/pagamentos/mercado-pago");
const { backendPublicUrl } = require("../services/pagamentos/config");
const { assinaturaObrigatoria, validarAssinaturaWebhookMercadoPago } = require("../services/pagamentos/webhook-security");
const { PLANOS, planoValido, garantirAssinaturaInicial, obterAssinaturaRestaurante, exigirPlanoProfissional } = require("../services/planos-restaurante");

const plansRouter = Router();
const PUBLIC_PLANOS = Object.values(PLANOS);

function frontendOrigin() {
  const configurada = String(process.env.FRONTEND_PUBLIC_URL ?? "").split(",")[0].trim();
  let url;
  try {
    url = new URL(configurada);
  } catch {
    url = null;
  }
  const host = url?.hostname.toLowerCase() ?? "";
  if (!url || url.protocol !== "https:" || !host.includes(".") || host === "localhost" || host.endsWith(".localhost") || host.includes("seu-frontend")) {
    const erro = new Error("Configure FRONTEND_PUBLIC_URL com a URL HTTPS pÃºblica do frontend para habilitar o checkout mensal do Mercado Pago.");
    erro.statusCode = 503;
    throw erro;
  }
  return url.origin;
}
function arredondar(valor) { return Math.round(Number(valor ?? 0) * 100) / 100; }
const { aplicarEstadoAssinaturaMercadoPago } = require("../services/sincronizar-assinatura");
const { consultarFaturaAssinaturaMercadoPago, consultarPagamentoMercadoPago } = require("../services/pagamentos/mercado-pago");
async function obterRestaurante(res) {
  const supabase = createUserSupabaseClient(res.locals.accessToken);
  const { data, error } = await supabase.from("restaurantes").select("id_restaurante,nome,email,ativo").eq("id_auth", res.locals.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) { const erro = new Error("Apenas restaurantes podem usar este recurso."); erro.statusCode = 403; throw erro; }
  return data;
}
function normalizarCampanha(body = {}) {
  const titulo = String(body.titulo ?? "").trim();
  const descricao = String(body.descricao ?? "").trim() || null;
  const tipo_beneficio = String(body.tipo_beneficio ?? "").toUpperCase();
  const inicio_em = new Date(body.inicio_em);
  const fim_em = new Date(body.fim_em);
  const limite_usos = Number(body.limite_usos);
  const valor_beneficio = body.valor_beneficio === "" || body.valor_beneficio == null ? null : arredondar(body.valor_beneficio);
  const tipos = new Set(["DESCONTO_PERCENTUAL","DESCONTO_FIXO","ITEM_CORTESIA","BEBIDA","ENTRADA","SOBREMESA","COMBO"]);
  if (titulo.length < 3 || titulo.length > 120 || !tipos.has(tipo_beneficio) || Number.isNaN(inicio_em.getTime()) || Number.isNaN(fim_em.getTime()) || fim_em <= inicio_em || !Number.isInteger(limite_usos) || limite_usos < 1) {
    const erro = new Error("Dados da campanha invÃ¡lidos."); erro.statusCode = 400; throw erro;
  }
  if (["DESCONTO_PERCENTUAL","DESCONTO_FIXO"].includes(tipo_beneficio) && (!Number.isFinite(valor_beneficio) || valor_beneficio <= 0 || (tipo_beneficio === "DESCONTO_PERCENTUAL" && valor_beneficio > 100))) {
    const erro = new Error("Informe um benefÃ­cio vÃ¡lido para a campanha."); erro.statusCode = 400; throw erro;
  }
  return { titulo, descricao, imagem_url: String(body.imagem_url ?? "").trim() || null, tipo_beneficio, valor_beneficio, regras: String(body.regras ?? "").trim() || null, inicio_em: inicio_em.toISOString(), fim_em: fim_em.toISOString(), limite_usos, minimo_pessoas: body.minimo_pessoas ? Number(body.minimo_pessoas) : null, minimo_itens: body.minimo_itens ? Number(body.minimo_itens) : null, status: ["RASCUNHO","AGENDADA","ATIVA","PAUSADA"].includes(String(body.status ?? "").toUpperCase()) ? String(body.status).toUpperCase() : "RASCUNHO" };
}

plansRouter.get("/catalogo", (_req, res) => res.json({ planos: PUBLIC_PLANOS }));

plansRouter.get("/campanhas-publicas", async (req,res) => { try { res.json({campanhas:await require("./campaigns").publicas(req.query.restaurante_id)}); } catch(e) {res.status(400).json({error:e.message});} });

plansRouter.use((req, res, next) => {
  // Webhooks nÃ£o possuem sessÃ£o de usuÃ¡rio: a assinatura do provedor Ã© validada na rota.
  if (req.path === "/webhook/mercado-pago") return next();
  return requireAuth(req, res, () => requireRole("restaurante")(req, res, next));
});

plansRouter.get("/assinatura", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res);
    let assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    if (!assinatura) {
      const planoEsperado = restaurante.ativo === false ? "PROFISSIONAL" : "INICIAL";
      await garantirAssinaturaInicial(restaurante.id_restaurante, planoEsperado);
      assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    }
    let sincronizacaoPendente = false;
    if (assinatura?.codigo_plano === "PROFISSIONAL" && obterAccessTokenMercadoPago()) {
      try {
        const { data: tentativasCheckout, error: tentativasError } = await supabaseAdmin.from("cobrancas_assinatura_restaurante")
          .select("id_cobranca,dados_provedor,criado_em").eq("id_assinatura", assinatura.id_assinatura).eq("status", "PENDENTE").order("criado_em", { ascending: false }).limit(50);
        if (tentativasError) throw new Error(tentativasError.message);
        const planoIds = new Set([assinatura.mercadopago_preapproval_plan_id, ...(tentativasCheckout ?? []).map((item) => item.dados_provedor?.preapproval_plan_id)].filter(Boolean).map(String));
        const preapprovalIds = new Set([assinatura.mercadopago_preapproval_id, ...(tentativasCheckout ?? []).map((item) => item.dados_provedor?.preapproval_id)].filter(Boolean).map(String));
        const contaMercadoPago = await consultarContaMercadoPago();
        const assinaturaPorPlano = new Map((tentativasCheckout ?? []).map((item) => [String(item.dados_provedor?.preapproval_plan_id ?? ""), String(item.dados_provedor?.collector_id ?? "")]));
        const candidatas = [];
        for (const id of preapprovalIds) {
          const item = await consultarAssinaturaMercadoPago(id);
          if (item) candidatas.push(item);
        }
        for (const planoId of (assinatura.mercadopago_preapproval_id ? [] : planoIds)) {
          const assinaturasDoPlano = await buscarAssinaturasPlanoMercadoPago(planoId);
          candidatas.push(...assinaturasDoPlano);
        }
        const candidatasUnicas = [...new Map(candidatas.filter(Boolean).map((item) => [String(item.id), item])).values()];
        const aprovada = candidatasUnicas
          .filter((item) => {
            const planoId = String(item.preapproval_plan_id ?? "");
            const collectorEsperado = assinaturaPorPlano.get(planoId) || String(contaMercadoPago?.id ?? "");
            return planoIds.has(planoId) && String(item.collector_id ?? "") === collectorEsperado && (assinatura.mercadopago_preapproval_id ? String(item.id) === String(assinatura.mercadopago_preapproval_id) : ["authorized", "active"].includes(String(item.status ?? "").toLowerCase()));
          })
          .sort((a, b) => new Date(b.last_modified ?? b.date_created ?? 0) - new Date(a.last_modified ?? a.date_created ?? 0))[0];
        if (aprovada) assinatura = await aplicarEstadoAssinaturaMercadoPago(assinatura, aprovada);
      } catch (erroSincronizacao) {
        sincronizacaoPendente = true;
        console.error("Falha ao reconciliar assinatura do Mercado Pago:", erroSincronizacao.message);
      }
    }
    const { data: cobrancas, error } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").select("id_cobranca,valor,status,vencimento_em,pago_em,criado_em").eq("id_assinatura", assinatura?.id_assinatura ?? 0).order("criado_em", { ascending: false }).limit(12);
    if (error) throw new Error(error.message);
    res.set("Cache-Control", "no-store");
    return res.json({ planos: PUBLIC_PLANOS, assinatura, cobrancas: cobrancas ?? [], sincronizacao_pendente: sincronizacaoPendente });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.post("/checkout", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res);
    const plano = planoValido(req.body?.plano);
    if (!plano) return res.status(400).json({ error: "Plano invÃ¡lido." });
    if (plano.codigo === "INICIAL") return res.status(400).json({ error: "O Plano Inicial nÃ£o precisa de pagamento." });
    let assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    if (!assinatura) {
      await garantirAssinaturaInicial(restaurante.id_restaurante, plano.codigo);
      assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    }
    if (!assinatura) return res.status(409).json({ error: "Assinatura ainda nÃ£o foi criada. Atualize o cadastro e tente novamente." });
    if (assinatura.codigo_plano === "PROFISSIONAL" && assinatura.status === "ATIVA") return res.status(409).json({ error: "O Plano Profissional ja esta ativo." });
    const modoProducao = String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").trim().toLowerCase() === "true";
    if (!modoProducao && !credenciaisTesteMercadoPagoValidas()) {
      return res.status(409).json({ code: "MP_TEST_SELLER_CREDENTIALS_REQUIRED", error: "Configure o Access Token da aplicacao do vendedor de teste para iniciar uma assinatura de teste." });
    }
    const token = obterAccessTokenMercadoPago();
    if (!token) return res.status(409).json({ code: "SUBSCRIPTION_PAYMENT_UNAVAILABLE", error: "Configure as credenciais do Mercado Pago para contratar o Plano Profissional." });
    const payerEmail = String(modoProducao ? restaurante.email : process.env.MERCADO_PAGO_TEST_PAYER_EMAIL ?? restaurante.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      return res.status(409).json({ code: "SUBSCRIPTION_PAYER_EMAIL_REQUIRED", error: "Informe um e-mail válido para o pagador da assinatura no Mercado Pago." });
    }
    const contaMercadoPago = await consultarContaMercadoPago(token);
    const { data: cobrancasPendentes, error: cobrancasPendentesError } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").select("dados_provedor").eq("id_assinatura", assinatura.id_assinatura).eq("status", "PENDENTE").order("criado_em", { ascending: false }).limit(20);
    if (cobrancasPendentesError) throw new Error(cobrancasPendentesError.message);
    const checkoutDaContaAtual = (cobrancasPendentes ?? []).some((cobranca) =>
      String(cobranca.dados_provedor?.preapproval_plan_id ?? "") === String(assinatura.mercadopago_preapproval_plan_id ?? "") &&
      String(cobranca.dados_provedor?.collector_id ?? "") === String(contaMercadoPago?.id ?? "")
    );
    if (assinatura.codigo_plano === plano.codigo && assinatura.status === "PENDENTE_PAGAMENTO" && assinatura.checkout_url && assinatura.mercadopago_preapproval_id && assinatura.mercadopago_preapproval_plan_id && checkoutDaContaAtual) {
      return res.json({ checkout_url: assinatura.checkout_url, reutilizado: true });
    }
    const backUrl = `${frontendOrigin()}/restaurante/configuracoes/planos?assinatura=retorno`;
    const backendUrl = backendPublicUrl();
    let notificationUrl;
    try {
      const parsedBackendUrl = new URL(backendUrl);
      if (parsedBackendUrl.protocol !== "https:") throw new Error("HTTPS obrigatorio");
      notificationUrl = `${parsedBackendUrl.origin}/api/planos/webhook/mercado-pago`;
    } catch {
      const erro = new Error("Configure BACKEND_PUBLIC_URL com a URL HTTPS publica da API para receber a confirmacao da assinatura.");
      erro.statusCode = 503;
      throw erro;
    }
    let planoMPId = assinatura.mercadopago_preapproval_plan_id;
    if (!planoMPId || !checkoutDaContaAtual || assinatura.codigo_plano !== plano.codigo || assinatura.status !== "PENDENTE_PAGAMENTO") {
      const planoMP = await criarPlanoAssinaturaMercadoPago({ token, reason: `Appono Plano Profissional - restaurante ${restaurante.id_restaurante}`, amount: plano.mensalidade, backUrl });
      planoMPId = String(planoMP?.id ?? "");
      if (!planoMPId || String(planoMP?.collector_id ?? "") !== String(contaMercadoPago?.id ?? "")) throw new Error("Nao foi possivel confirmar o vendedor associado ao plano no Mercado Pago.");
    }
    const referencia = `assinatura:${assinatura.id_assinatura}:${crypto.randomUUID()}`;
    const assinaturaMP = await criarAssinaturaMercadoPago({ token, referencia, email: payerEmail, planoId: planoMPId, reason: `Appono Plano Profissional - restaurante ${restaurante.id_restaurante}`, amount: plano.mensalidade, backUrl, notificationUrl });
    const preapprovalId = String(assinaturaMP?.id ?? "");
    const checkoutUrl = assinaturaMP?.init_point;
    if (!preapprovalId || String(assinaturaMP?.preapproval_plan_id ?? "") !== planoMPId || !checkoutUrl) {
      throw new Error("O Mercado Pago nao retornou a assinatura hospedada esperada.");
    }
    const { error: assinaturaError } = await supabaseAdmin.from("assinaturas_restaurante").update({ codigo_plano: plano.codigo, status: "PENDENTE_PAGAMENTO", mensalidade: plano.mensalidade, percentual_comissao: plano.percentual_comissao, mercadopago_preapproval_id: preapprovalId, mercadopago_preapproval_plan_id: planoMPId, checkout_url: checkoutUrl }).eq("id_assinatura", assinatura.id_assinatura);
    if (assinaturaError) throw new Error(assinaturaError.message);
    await supabaseAdmin.from("historico_assinaturas_restaurante").insert({ id_assinatura: assinatura.id_assinatura, codigo_plano_anterior: assinatura.codigo_plano, codigo_plano_novo: plano.codigo, status_anterior: assinatura.status, status_novo: "PENDENTE_PAGAMENTO", motivo: "ContrataÃ§Ã£o do Plano Profissional iniciada" });
    const { error: cobrancaError } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").insert({ id_assinatura: assinatura.id_assinatura, referencia_externa: referencia, valor: plano.mensalidade, status: "PENDENTE", dados_provedor: { preapproval_id: preapprovalId, preapproval_plan_id: planoMPId, collector_id: String(contaMercadoPago.id) } });
    if (cobrancaError) throw new Error(cobrancaError.message);
    return res.status(201).json({ checkout_url: checkoutUrl });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message ?? "NÃ£o foi possÃ­vel iniciar a contrataÃ§Ã£o." }); }
});

plansRouter.post("/cancelar-renovacao", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res); const assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    if (!assinatura || assinatura.codigo_plano !== "PROFISSIONAL") return res.status(409).json({ error: "NÃ£o hÃ¡ assinatura Profissional ativa para cancelar." });
    if (assinatura.mercadopago_preapproval_id && obterAccessTokenMercadoPago()) await atualizarAssinaturaMercadoPago(assinatura.mercadopago_preapproval_id, { status: "cancelled" });
    const { error } = await supabaseAdmin.from("assinaturas_restaurante").update({ cancelar_no_fim_do_periodo: true }).eq("id_assinatura", assinatura.id_assinatura);
    if (error) throw new Error(error.message); return res.json({ message: "A renovaÃ§Ã£o foi cancelada. Os benefÃ­cios seguem atÃ© o fim do perÃ­odo pago." });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ error: error.message }); }
});

// Rotas de campanhas foram movidas para /api/campanhas.
plansRouter.post("/webhook/mercado-pago", async (req, res) => {
  const topic = String(req.body?.type ?? req.body?.topic ?? req.query?.type ?? req.query?.topic ?? "").toLowerCase();
  if (topic && !["subscription_preapproval", "preapproval", "subscription_authorized_payment", "payment"].includes(topic)) return res.json({ status: "ignored" });
  const eventoId = String(req.query?.["data.id"] ?? req.body?.data?.id ?? req.query?.id ?? "");
  let preapprovalId = eventoId;
  if (!preapprovalId) return res.status(400).json({ error: "Evento de assinatura invalido." });
  if (!validarAssinaturaWebhookMercadoPago(req, eventoId) && assinaturaObrigatoria()) return res.status(401).json({ error: "Assinatura do webhook invalida." });
  try {
    if (topic === "subscription_authorized_payment") {
      const fatura = await consultarFaturaAssinaturaMercadoPago(eventoId);
      preapprovalId = fatura?.preapproval_id;
    } else if (topic === "payment") {
      const pagamento = await consultarPagamentoMercadoPago(eventoId);
      if (!pagamento) throw new Error("Pagamento indisponivel");
      preapprovalId = pagamento.metadata?.preapproval_id;
      if (!preapprovalId) {
        const { data, error } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").select("dados_provedor").eq("mercadopago_payment_id", eventoId).maybeSingle();
        if (error) throw error;
        preapprovalId = data?.dados_provedor?.preapproval_id;
      }
    }
    if (!preapprovalId) return res.json({ status: "ignored" });
    const assinaturaMP = await consultarAssinaturaMercadoPago(preapprovalId);
    if (!assinaturaMP?.preapproval_plan_id) return res.status(202).json({ status: "ignored" });
    const { data: assinaturaPorId, error: assinaturaIdError } = await supabaseAdmin.from("assinaturas_restaurante").select("*").eq("mercadopago_preapproval_id", preapprovalId).maybeSingle();
    if (assinaturaIdError) throw new Error(assinaturaIdError.message);
    let assinatura = assinaturaPorId;
    if (!assinatura) {
      const { data, error } = await supabaseAdmin.from("assinaturas_restaurante").select("*").eq("mercadopago_preapproval_plan_id", String(assinaturaMP.preapproval_plan_id)).maybeSingle();
      if (error) throw new Error(error.message);
      assinatura = data;
    }
    if (!assinatura) {
      const { data: cobrancaPorId, error: cobrancaIdError } = await supabaseAdmin.from("cobrancas_assinatura_restaurante")
        .select("id_assinatura").eq("status", "PENDENTE").eq("dados_provedor->>preapproval_id", preapprovalId).limit(1).maybeSingle();
      if (cobrancaIdError) throw new Error(cobrancaIdError.message);
      let cobrancaCorrespondente = cobrancaPorId;
      if (!cobrancaCorrespondente) {
        const { data, error } = await supabaseAdmin.from("cobrancas_assinatura_restaurante")
          .select("id_assinatura").eq("status", "PENDENTE").eq("dados_provedor->>preapproval_plan_id", String(assinaturaMP.preapproval_plan_id)).limit(1).maybeSingle();
        if (error) throw new Error(error.message);
        cobrancaCorrespondente = data;
      }
      if (cobrancaCorrespondente) {
        const { data, error } = await supabaseAdmin.from("assinaturas_restaurante").select("*").eq("id_assinatura", cobrancaCorrespondente.id_assinatura).maybeSingle();
        if (error) throw new Error(error.message);
        assinatura = data;
      }
    }
    if (!assinatura) return res.status(202).json({ status: "ignored" });
    await aplicarEstadoAssinaturaMercadoPago(assinatura, { ...assinaturaMP, id: preapprovalId });
    return res.json({ status: "ok" });
  } catch (error) { console.error("Falha no webhook de assinatura:", error.message); return res.status(500).json({ error: "Nao foi possivel processar a assinatura." }); }
});

module.exports = { plansRouter };
