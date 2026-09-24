"use strict";
const { validarCpf } = require("./cpf");
const { somenteNumeros } = require("./comum");
const STATUS = Object.freeze({ FORMATO_INVALIDO: "FORMATO_INVALIDO", REGULAR: "REGULAR", IRREGULAR: "IRREGULAR", NAO_ENCONTRADO: "NAO_ENCONTRADO", INDETERMINADO: "INDETERMINADO", SERVICO_INDISPONIVEL: "SERVICO_INDISPONIVEL" });
function dataParaSerpro(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor ?? ""));
  if (!partes) return null;
  const [, ano, mes, dia] = partes;
  const data = new Date(`${ano}-${mes}-${dia}T12:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.getUTCFullYear() !== Number(ano) || data.getUTCMonth() + 1 !== Number(mes) || data.getUTCDate() !== Number(dia)) return null;
  return `${dia}${mes}${ano}`;
}
function normalizarSituacaoSerpro(valor) {
  const situacao = String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
  if (situacao === "REGULAR") return STATUS.REGULAR;
  if (["NAO ENCONTRADO", "INEXISTENTE", "CPF NAO ENCONTRADO"].includes(situacao)) return STATUS.NAO_ENCONTRADO;
  if (["PENDENTE DE REGULARIZACAO", "SUSPENSA", "CANCELADA", "TITULAR FALECIDO", "NULA", "IRREGULAR"].includes(situacao)) return STATUS.IRREGULAR;
  return STATUS.INDETERMINADO;
}
function configuracaoSerpro(env) {
  return { consumerKey: String(env.SERPRO_CPF_CONSUMER_KEY ?? "").trim(), consumerSecret: String(env.SERPRO_CPF_CONSUMER_SECRET ?? "").trim(), tokenUrl: String(env.SERPRO_CPF_TOKEN_URL ?? "https://gateway.apiserpro.serpro.gov.br/token").trim(), apiUrl: String(env.SERPRO_CPF_API_URL ?? "https://gateway.apiserpro.serpro.gov.br/consulta-cpf-df/v3").replace(/\/$/, ""), timeoutMs: Math.min(15000, Math.max(1000, Number(env.SERPRO_CPF_TIMEOUT_MS ?? 5000))) };
}
async function requisitarJson(url, opcoes, fetchImpl, timeoutMs) {
  const controlador = new AbortController(); const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  try { const resposta = await fetchImpl(url, { ...opcoes, signal: controlador.signal }); let corpo = {}; try { corpo = await resposta.json(); } catch {} return { resposta, corpo }; }
  finally { clearTimeout(temporizador); }
}
async function consultarSituacaoCpf({ cpf, dataNascimento, fetchImpl = fetch, env = process.env }) {
  const normalizado = somenteNumeros(cpf);
  if (!validarCpf(normalizado)) return { status: STATUS.FORMATO_INVALIDO, consultado: false };
  const nascimento = dataParaSerpro(dataNascimento);
  if (!nascimento) return { status: STATUS.INDETERMINADO, consultado: false, motivo: "DATA_NASCIMENTO_INVALIDA" };
  const config = configuracaoSerpro(env);
  if (!config.consumerKey || !config.consumerSecret) return { status: STATUS.SERVICO_INDISPONIVEL, consultado: false, motivo: "PROVEDOR_NAO_CONFIGURADO" };
  try {
    const credencial = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
    const token = await requisitarJson(config.tokenUrl, { method: "POST", headers: { Authorization: `Basic ${credencial}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" }, fetchImpl, config.timeoutMs);
    if (!token.resposta.ok || !token.corpo.access_token) return { status: STATUS.SERVICO_INDISPONIVEL, consultado: false, motivo: token.resposta.status === 429 ? "LIMITE_PROVEDOR" : "AUTENTICACAO_PROVEDOR" };
    const consulta = await requisitarJson(`${config.apiUrl}/ConsultaCPF/${normalizado}/${nascimento}`, { method: "GET", headers: { Authorization: `Bearer ${token.corpo.access_token}`, Accept: "application/json" } }, fetchImpl, config.timeoutMs);
    if (consulta.resposta.status === 404) return { status: STATUS.NAO_ENCONTRADO, consultado: true, provedor: "SERPRO_CPF_V3" };
    if (!consulta.resposta.ok) return { status: STATUS.SERVICO_INDISPONIVEL, consultado: false, motivo: consulta.resposta.status === 429 ? "LIMITE_PROVEDOR" : "RESPOSTA_PROVEDOR" };
    const situacao = consulta.corpo.situacao?.descricao ?? consulta.corpo.situacao ?? consulta.corpo.status;
    return { status: normalizarSituacaoSerpro(situacao), consultado: true, provedor: "SERPRO_CPF_V3", verificadoEm: new Date().toISOString() };
  } catch (erro) { return { status: STATUS.SERVICO_INDISPONIVEL, consultado: false, motivo: erro?.name === "AbortError" ? "TIMEOUT_PROVEDOR" : "FALHA_PROVEDOR" }; }
}
module.exports = { STATUS, consultarSituacaoCpf, dataParaSerpro, normalizarSituacaoSerpro };
