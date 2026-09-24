"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { STATUS, consultarSituacaoCpf, dataParaSerpro, normalizarSituacaoSerpro } = require("../src/services/validacoes/cpf-cadastral");
test("normaliza data e situações cadastrais", () => {
  assert.equal(dataParaSerpro("1990-12-31"), "31121990"); assert.equal(dataParaSerpro("2024-02-31"), null);
  assert.equal(normalizarSituacaoSerpro("Pendente de regularização"), STATUS.IRREGULAR); assert.equal(normalizarSituacaoSerpro("REGULAR"), STATUS.REGULAR);
});
test("CPF inválido não chama o provedor", async () => {
  let chamadas = 0; const resultado = await consultarSituacaoCpf({ cpf: "11111111111", dataNascimento: "1990-01-01", fetchImpl: async () => { chamadas += 1; } });
  assert.equal(resultado.status, STATUS.FORMATO_INVALIDO); assert.equal(chamadas, 0);
});
test("sem credencial nunca informa regularidade", async () => {
  const resultado = await consultarSituacaoCpf({ cpf: "52998224725", dataNascimento: "1990-01-01", env: {} });
  assert.equal(resultado.status, STATUS.SERVICO_INDISPONIVEL); assert.equal(resultado.consultado, false);
});
test("normaliza resposta e não expõe dados do titular", async () => {
  const respostas = [{ ok: true, status: 200, json: async () => ({ access_token: "segredo" }) }, { ok: true, status: 200, json: async () => ({ situacao: { descricao: "REGULAR" }, nome: "Dado privado" }) }];
  const resultado = await consultarSituacaoCpf({ cpf: "52998224725", dataNascimento: "1990-01-01", env: { SERPRO_CPF_CONSUMER_KEY: "key", SERPRO_CPF_CONSUMER_SECRET: "secret", SERPRO_CPF_TIMEOUT_MS: "1000" }, fetchImpl: async () => respostas.shift() });
  assert.equal(resultado.status, STATUS.REGULAR); assert.equal(resultado.provedor, "SERPRO_CPF_V3"); assert.equal("nome" in resultado, false);
});
test("rate limit do provedor não aprova CPF", async () => {
  const resultado = await consultarSituacaoCpf({ cpf: "52998224725", dataNascimento: "1990-01-01", env: { SERPRO_CPF_CONSUMER_KEY: "key", SERPRO_CPF_CONSUMER_SECRET: "secret" }, fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) });
  assert.equal(resultado.status, STATUS.SERVICO_INDISPONIVEL); assert.equal(resultado.motivo, "LIMITE_PROVEDOR");
});
