"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { PLANOS, planoValido, assinaturaProfissionalAtiva } = require("../src/services/planos-restaurante");

test("catalogo de planos mantém preços e comissão contratados", () => {
  assert.equal(PLANOS.INICIAL.percentual_comissao, 8);
  assert.equal(PLANOS.PROFISSIONAL.mensalidade, 200);
  assert.equal(PLANOS.PROFISSIONAL.percentual_comissao, 3);
  assert.equal(planoValido("profissional").codigo, "PROFISSIONAL");
  assert.equal(planoValido("inexistente"), null);
});

test("somente assinatura profissional ativa libera campanhas", () => {
  assert.equal(assinaturaProfissionalAtiva({ codigo_plano: "PROFISSIONAL", status: "ATIVA" }), true);
  assert.equal(assinaturaProfissionalAtiva({ codigo_plano: "INICIAL", status: "ATIVA" }), false);
  assert.equal(assinaturaProfissionalAtiva({ codigo_plano: "PROFISSIONAL", status: "INADIMPLENTE" }), false);
  assert.equal(assinaturaProfissionalAtiva({ codigo_plano: "PROFISSIONAL", status: "ATIVA", periodo_fim_em: "2020-01-01T00:00:00Z" }), false);
});
