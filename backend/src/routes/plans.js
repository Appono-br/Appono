"use strict";

const crypto = require("node:crypto");
const { Router } = require("express");
const { supabaseAdmin, createUserSupabaseClient } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { obterAccessTokenMercadoPago, criarAssinaturaMercadoPago, consultarAssinaturaMercadoPago, atualizarAssinaturaMercadoPago } = require("../services/pagamentos/mercado-pago");
const { assinaturaObrigatoria, validarAssinaturaWebhookMercadoPago } = require("../services/pagamentos/webhook-security");
const { PLANOS, planoValido, obterAssinaturaRestaurante, exigirPlanoProfissional } = require("../services/planos-restaurante");

const plansRouter = Router();
const PUBLIC_PLANOS = Object.values(PLANOS);

function frontendOrigin() { return (process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").split(",")[0].trim().replace(/\/$/, ""); }
function backendPublicUrl() { return String(process.env.BACKEND_PUBLIC_URL ?? "").trim().replace(/\/$/, ""); }
function arredondar(valor) { return Math.round(Number(valor ?? 0) * 100) / 100; }
function statusAssinaturaMercadoPago(status) {
  const valor = String(status ?? "").toLowerCase();
  if (["authorized", "active"].includes(valor)) return "ATIVA";
  if (["paused", "pending"].includes(valor)) return "PENDENTE_PAGAMENTO";
  if (["cancelled", "canceled"].includes(valor)) return "CANCELADA";
  return "INADIMPLENTE";
}
async function obterRestaurante(res) {
  const supabase = createUserSupabaseClient(res.locals.accessToken);
  const { data, error } = await supabase.from("restaurantes").select("id_restaurante,nome,email").eq("id_auth", res.locals.user.id).maybeSingle();
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
    const erro = new Error("Dados da campanha inválidos."); erro.statusCode = 400; throw erro;
  }
  if (["DESCONTO_PERCENTUAL","DESCONTO_FIXO"].includes(tipo_beneficio) && (!Number.isFinite(valor_beneficio) || valor_beneficio <= 0 || (tipo_beneficio === "DESCONTO_PERCENTUAL" && valor_beneficio > 100))) {
    const erro = new Error("Informe um benefício válido para a campanha."); erro.statusCode = 400; throw erro;
  }
  return { titulo, descricao, imagem_url: String(body.imagem_url ?? "").trim() || null, tipo_beneficio, valor_beneficio, regras: String(body.regras ?? "").trim() || null, inicio_em: inicio_em.toISOString(), fim_em: fim_em.toISOString(), limite_usos, minimo_pessoas: body.minimo_pessoas ? Number(body.minimo_pessoas) : null, minimo_itens: body.minimo_itens ? Number(body.minimo_itens) : null, status: ["RASCUNHO","AGENDADA","ATIVA","PAUSADA"].includes(String(body.status ?? "").toUpperCase()) ? String(body.status).toUpperCase() : "RASCUNHO" };
}

plansRouter.get("/catalogo", (_req, res) => res.json({ planos: PUBLIC_PLANOS }));

plansRouter.get("/campanhas-publicas", async (req, res) => {
  const restauranteId = Number(req.query.restaurante_id);
  if (!Number.isInteger(restauranteId) || restauranteId <= 0) return res.status(400).json({ error: "Restaurante inválido." });
  const { data, error } = await supabaseAdmin.from("campanhas_inteligentes_restaurante")
    .select("id_campanha,titulo,descricao,imagem_url,tipo_beneficio,valor_beneficio,regras,inicio_em,fim_em,limite_usos,usos_confirmados,minimo_pessoas,minimo_itens,campanhas_inteligentes_produtos(id_produto,produtos(nome))")
    .eq("id_restaurante", restauranteId).eq("status", "ATIVA").gt("fim_em", new Date().toISOString()).lt("usos_confirmados", 100000);
  if (error) return res.status(400).json({ error: error.message });
  const campanhas = (data ?? []).filter((item) => item.usos_confirmados < item.limite_usos);
  if (campanhas.length) await supabaseAdmin.from("eventos_campanha_inteligente").insert(campanhas.map((item) => ({ id_campanha: item.id_campanha, tipo: "IMPRESSION" })));
  return res.json({ campanhas });
});

plansRouter.use((req, res, next) => {
  // Webhooks não possuem sessão de usuário: a assinatura do provedor é validada na rota.
  if (req.path === "/webhook/mercado-pago") return next();
  return requireAuth(req, res, () => requireRole("restaurante")(req, res, next));
});

plansRouter.get("/assinatura", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res);
    const assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    const { data: cobrancas, error } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").select("id_cobranca,valor,status,vencimento_em,pago_em,criado_em").eq("id_assinatura", assinatura?.id_assinatura ?? 0).order("criado_em", { ascending: false }).limit(12);
    if (error) throw new Error(error.message);
    return res.json({ planos: PUBLIC_PLANOS, assinatura, cobrancas: cobrancas ?? [] });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.post("/checkout", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res);
    const plano = planoValido(req.body?.plano);
    if (!plano) return res.status(400).json({ error: "Plano inválido." });
    if (plano.codigo === "INICIAL") return res.status(400).json({ error: "O Plano Inicial não precisa de pagamento." });
    const assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    if (!assinatura) return res.status(409).json({ error: "Assinatura ainda não foi criada. Atualize o cadastro e tente novamente." });
    const token = obterAccessTokenMercadoPago();
    if (!token) return res.status(409).json({ code: "SUBSCRIPTION_PAYMENT_UNAVAILABLE", error: "Configure as credenciais do Mercado Pago para contratar o Plano Profissional." });
    const referencia = `assinatura:${assinatura.id_assinatura}:${crypto.randomUUID()}`;
    const resposta = await criarAssinaturaMercadoPago({
      token, referencia, email: restaurante.email, planoId: process.env.APPONO_MERCADO_PAGO_PROFESSIONAL_PLAN_ID,
      reason: "Appono Plano Profissional", amount: plano.mensalidade,
      backUrl: `${frontendOrigin()}/restaurante/plano?assinatura=retorno`, notificationUrl: backendPublicUrl() ? `${backendPublicUrl()}/api/planos/webhook/mercado-pago` : null,
    });
    const checkoutUrl = resposta?.init_point ?? resposta?.sandbox_init_point;
    if (!resposta?.id || !checkoutUrl) throw new Error("O Mercado Pago não retornou o checkout da assinatura.");
    const { error: assinaturaError } = await supabaseAdmin.from("assinaturas_restaurante").update({ codigo_plano: plano.codigo, status: "PENDENTE_PAGAMENTO", mensalidade: plano.mensalidade, percentual_comissao: plano.percentual_comissao, mercadopago_preapproval_id: String(resposta.id), checkout_url: checkoutUrl }).eq("id_assinatura", assinatura.id_assinatura);
    if (assinaturaError) throw new Error(assinaturaError.message);
    await supabaseAdmin.from("historico_assinaturas_restaurante").insert({ id_assinatura: assinatura.id_assinatura, codigo_plano_anterior: assinatura.codigo_plano, codigo_plano_novo: plano.codigo, status_anterior: assinatura.status, status_novo: "PENDENTE_PAGAMENTO", motivo: "Contratação do Plano Profissional iniciada" });
    const { error: cobrancaError } = await supabaseAdmin.from("cobrancas_assinatura_restaurante").insert({ id_assinatura: assinatura.id_assinatura, referencia_externa: referencia, valor: plano.mensalidade, status: "PENDENTE", dados_provedor: { preapproval_id: String(resposta.id) } });
    if (cobrancaError) throw new Error(cobrancaError.message);
    return res.status(201).json({ checkout_url: checkoutUrl });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message ?? "Não foi possível iniciar a contratação." }); }
});

plansRouter.post("/cancelar-renovacao", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res); const assinatura = await obterAssinaturaRestaurante(restaurante.id_restaurante);
    if (!assinatura || assinatura.codigo_plano !== "PROFISSIONAL") return res.status(409).json({ error: "Não há assinatura Profissional ativa para cancelar." });
    if (assinatura.mercadopago_preapproval_id && obterAccessTokenMercadoPago()) await atualizarAssinaturaMercadoPago(assinatura.mercadopago_preapproval_id, { status: "cancelled" });
    const { error } = await supabaseAdmin.from("assinaturas_restaurante").update({ cancelar_no_fim_do_periodo: true }).eq("id_assinatura", assinatura.id_assinatura);
    if (error) throw new Error(error.message); return res.json({ message: "A renovação foi cancelada. Os benefícios seguem até o fim do período pago." });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ error: error.message }); }
});

plansRouter.get("/campanhas", async (req, res) => {
  try { const restaurante = await obterRestaurante(res); await exigirPlanoProfissional(restaurante.id_restaurante);
    const { data, error } = await supabaseAdmin.from("campanhas_inteligentes_restaurante").select("*,campanhas_inteligentes_produtos(id_produto,produtos(nome))").eq("id_restaurante", restaurante.id_restaurante).order("criado_em", { ascending: false }); if (error) throw new Error(error.message); return res.json({ campanhas: data ?? [] });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.get("/campanhas/sugestoes", async (req, res) => {
  try {
    const restaurante = await obterRestaurante(res);
    await exigirPlanoProfissional(restaurante.id_restaurante);
    const hoje = new Date(); const fim = new Date(); fim.setDate(fim.getDate() + 30);
    const data = (valor) => valor.toISOString().slice(0, 10);
    const supabase = createUserSupabaseClient(res.locals.accessToken);
    const { data: demanda, error } = await supabase.rpc("metricas_demanda_rotina_restaurante", { p_inicio: data(hoje), p_fim: data(fim) });
    if (error) throw new Error(error.message);
    const sugestoes = (demanda?.itens ?? []).slice(0, 6).map((item) => ({
      data: item.data, faixa_horario: item.faixa_horario, faixa_preco: item.faixa_preco, categorias: item.categorias ?? [],
      mensagem: `Há ${item.demanda_estimada} interesse(s) agregados em ${item.faixa_horario.replaceAll("_", " ")}.`,
    }));
    return res.json({ coorte_minima: demanda?.coorte_minima ?? 5, sugestoes });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.post("/campanhas", async (req, res) => {
  try { const restaurante = await obterRestaurante(res); await exigirPlanoProfissional(restaurante.id_restaurante); const dados = normalizarCampanha(req.body);
    const produtos = [...new Set((req.body?.produtos ?? []).map(Number).filter(Number.isInteger))];
    const { data: campanha, error } = await supabaseAdmin.from("campanhas_inteligentes_restaurante").insert({ ...dados, id_restaurante: restaurante.id_restaurante }).select("*").single(); if (error) throw new Error(error.message);
    if (produtos.length) { const { data: produtosValidos, error: produtosError } = await supabaseAdmin.from("produtos").select("id_produto").eq("id_restaurante", restaurante.id_restaurante).in("id_produto", produtos); if (produtosError) throw new Error(produtosError.message); if (produtosValidos.length !== produtos.length) return res.status(400).json({ error: "Um ou mais pratos não pertencem ao restaurante." }); const { error: itensError } = await supabaseAdmin.from("campanhas_inteligentes_produtos").insert(produtos.map((id_produto) => ({ id_campanha: campanha.id_campanha, id_produto }))); if (itensError) throw new Error(itensError.message); }
    return res.status(201).json({ campanha });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.patch("/campanhas/:id", async (req, res) => {
  try { const restaurante = await obterRestaurante(res); await exigirPlanoProfissional(restaurante.id_restaurante); const id = Number(req.params.id); if (!Number.isInteger(id)) return res.status(400).json({ error: "Campanha inválida." }); const dados = normalizarCampanha(req.body); const { data, error } = await supabaseAdmin.from("campanhas_inteligentes_restaurante").update(dados).eq("id_campanha", id).eq("id_restaurante", restaurante.id_restaurante).select("*").maybeSingle(); if (error) throw new Error(error.message); if (!data) return res.status(404).json({ error: "Campanha não encontrada." }); return res.json({ campanha: data });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.get("/campanhas/:id/metricas", async (req, res) => {
  try { const restaurante = await obterRestaurante(res); await exigirPlanoProfissional(restaurante.id_restaurante); const id = Number(req.params.id); const { data: campanha, error } = await supabaseAdmin.from("campanhas_inteligentes_restaurante").select("id_campanha,usos_confirmados,limite_usos").eq("id_campanha", id).eq("id_restaurante", restaurante.id_restaurante).maybeSingle(); if (error) throw new Error(error.message); if (!campanha) return res.status(404).json({ error: "Campanha não encontrada." }); const { data: eventos, error: eventosError } = await supabaseAdmin.from("eventos_campanha_inteligente").select("tipo,id_pedido").eq("id_campanha", id); if (eventosError) throw new Error(eventosError.message); const pedidos = [...new Set((eventos ?? []).map((item) => item.id_pedido).filter(Boolean))]; let faturamento = 0; if (pedidos.length) { const { data: vendas } = await supabaseAdmin.from("pedidos").select("valor_total").in("id_pedido", pedidos); faturamento = (vendas ?? []).reduce((total, pedido) => total + Number(pedido.valor_total ?? 0), 0); } const totais = (eventos ?? []).reduce((resultado,item) => ({ ...resultado, [item.tipo]: (resultado[item.tipo] ?? 0) + 1 }), {}); return res.json({ usos: campanha.usos_confirmados, limite_usos: campanha.limite_usos, visualizacoes: totais.IMPRESSION ?? 0, cliques: totais.CLICK ?? 0, reservas_iniciadas: totais.RESERVA_INICIADA ?? 0, resgates: totais.RESGATE ?? 0, pedidos_pagos: totais.PEDIDO_PAGO ?? 0, faturamento_bruto: arredondar(faturamento) });
  } catch (error) { return res.status(error.statusCode ?? 400).json({ code: error.code, error: error.message }); }
});

plansRouter.post("/webhook/mercado-pago", async (req, res) => {
  const preapprovalId = String(req.body?.data?.id ?? req.query?.id ?? "");
  if (!preapprovalId) return res.status(400).json({ error: "Evento de assinatura inválido." });
  if (!validarAssinaturaWebhookMercadoPago(req, preapprovalId) && assinaturaObrigatoria()) return res.status(401).json({ error: "Assinatura do webhook inválida." });
  try { const assinaturaMP = await consultarAssinaturaMercadoPago(preapprovalId); if (!assinaturaMP) return res.status(202).json({ status: "ignored" }); const { data: assinatura, error } = await supabaseAdmin.from("assinaturas_restaurante").select("*").eq("mercadopago_preapproval_id", preapprovalId).maybeSingle(); if (error) throw new Error(error.message); if (!assinatura) return res.status(202).json({ status: "ignored" }); let status = statusAssinaturaMercadoPago(assinaturaMP.status); if (assinatura.cancelar_no_fim_do_periodo && assinatura.periodo_fim_em && new Date(assinatura.periodo_fim_em) > new Date()) status = "ATIVA"; const periodoInicio = assinatura.periodo_inicio_em ?? assinaturaMP.date_created ?? new Date().toISOString(); const periodoFim = assinatura.periodo_fim_em ?? new Date(new Date(periodoInicio).setMonth(new Date(periodoInicio).getMonth() + 1)).toISOString(); const { error: updateError } = await supabaseAdmin.from("assinaturas_restaurante").update({ status, periodo_inicio_em: periodoInicio, periodo_fim_em: periodoFim }).eq("id_assinatura", assinatura.id_assinatura); if (updateError) throw new Error(updateError.message); if (status === "ATIVA") { await supabaseAdmin.from("restaurantes").update({ ativo: true }).eq("id_restaurante", assinatura.id_restaurante); await supabaseAdmin.from("cobrancas_assinatura_restaurante").update({ status: "APROVADA", pago_em: new Date().toISOString(), dados_provedor: assinaturaMP }).eq("id_assinatura", assinatura.id_assinatura).eq("status", "PENDENTE"); } return res.json({ status: "ok" });
  } catch (error) { return res.status(500).json({ error: "Não foi possível processar a assinatura." }); }
});

module.exports = { plansRouter };
