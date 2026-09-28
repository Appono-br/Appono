"use strict";

const { supabaseAdmin } = require("../lib/supabase");

const PLANOS = Object.freeze({
  INICIAL: { codigo: "INICIAL", nome: "Plano Inicial", mensalidade: 0, percentual_comissao: 8, campanhas_inteligentes: false, destaque_profissional: false },
  PROFISSIONAL: { codigo: "PROFISSIONAL", nome: "Plano Profissional", mensalidade: 200, percentual_comissao: 3, campanhas_inteligentes: true, destaque_profissional: true },
});

function planoValido(codigo) {
  return PLANOS[String(codigo ?? "INICIAL").toUpperCase()] ?? null;
}

async function garantirAssinaturaInicial(idRestaurante, codigo = "INICIAL") {
  if (!supabaseAdmin || !idRestaurante) return null;
  const plano = planoValido(codigo) ?? PLANOS.INICIAL;
  const { data, error } = await supabaseAdmin.from("assinaturas_restaurante").upsert({
    id_restaurante: idRestaurante,
    codigo_plano: plano.codigo,
    status: plano.codigo === "PROFISSIONAL" ? "PENDENTE_PAGAMENTO" : "ATIVA",
    mensalidade: plano.mensalidade,
    percentual_comissao: plano.percentual_comissao,
  }, { onConflict: "id_restaurante", ignoreDuplicates: true }).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function obterAssinaturaRestaurante(idRestaurante) {
  if (!supabaseAdmin || !idRestaurante) return null;
  const { data, error } = await supabaseAdmin.from("assinaturas_restaurante")
    .select("*, planos_restaurante(codigo,nome,mensalidade,percentual_comissao,campanhas_inteligentes,destaque_profissional)")
    .eq("id_restaurante", idRestaurante).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function assinaturaProfissionalAtiva(assinatura, agora = new Date()) {
  if (!assinatura || assinatura.codigo_plano !== "PROFISSIONAL" || assinatura.status !== "ATIVA") return false;
  if (assinatura.periodo_fim_em && new Date(assinatura.periodo_fim_em) < agora) return false;
  return true;
}

async function exigirPlanoProfissional(idRestaurante) {
  const assinatura = await obterAssinaturaRestaurante(idRestaurante);
  if (!assinaturaProfissionalAtiva(assinatura)) {
    const error = new Error("Este recurso exige uma assinatura Profissional ativa.");
    error.code = "PROFESSIONAL_PLAN_REQUIRED";
    error.statusCode = 402;
    throw error;
  }
  return assinatura;
}

async function resolverComissaoDoRestaurante(idRestaurante) {
  const assinatura = await obterAssinaturaRestaurante(idRestaurante);
  if (assinaturaProfissionalAtiva(assinatura)) {
    return { codigo_plano: "PROFISSIONAL", percentual_comissao: Number(assinatura.percentual_comissao ?? 3) };
  }
  return { codigo_plano: "INICIAL", percentual_comissao: Number(assinatura?.percentual_comissao ?? 8) };
}

module.exports = { PLANOS, planoValido, garantirAssinaturaInicial, obterAssinaturaRestaurante, assinaturaProfissionalAtiva, exigirPlanoProfissional, resolverComissaoDoRestaurante };
