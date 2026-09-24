"use strict";
const { Router } = require("express");
const { consultarCepViaCep } = require("../services/validacoes/cep");
const { consultarCnpjReceitaWs } = require("../services/validacoes/cnpj");
const { somenteNumeros } = require("../services/validacoes/comum");
const { validarCpf } = require("../services/validacoes/cpf");
const { consultarSituacaoCpf } = require("../services/validacoes/cpf-cadastral");
const { requireAuth } = require("../middleware/auth");
const { criarRateLimiter } = require("../middleware/rate-limit");
const rotasValidacoes = Router();
const limitarConsultaCpf = criarRateLimiter({ janelaMs: 60_000, limite: 10 });
rotasValidacoes.get("/cpf/:cpf", requireAuth, limitarConsultaCpf, async (req, res) => {
  const cpf = somenteNumeros(req.params.cpf);
  if (!validarCpf(cpf)) return res.status(400).json({ code: "CPF_FORMATO_INVALIDO", error: "Informe um CPF válido." });
  const resultado = await consultarSituacaoCpf({ cpf, dataNascimento: req.query.data_nascimento });
  return res.json({ valid: true, status: resultado.status, consultado: resultado.consultado, provedor: resultado.provedor ?? null, verificado_em: resultado.verificadoEm ?? null, code: resultado.motivo ?? null, message: resultado.consultado ? (resultado.status === "REGULAR" ? "CPF com situação cadastral regular." : "A situação cadastral do CPF requer atenção.") : "O formato do CPF é válido, mas a situação cadastral não pôde ser consultada agora." });
});
rotasValidacoes.get("/cep/:cep", async (req, res) => {
  try { return res.json(await consultarCepViaCep(req.params.cep)); }
  catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : "CEP inválido." }); }
});
rotasValidacoes.get("/cnpj/:cnpj", async (req, res) => {
  try { return res.json(await consultarCnpjReceitaWs(req.params.cnpj)); }
  catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : "CNPJ inválido." }); }
});
module.exports = { rotasValidacoes };
