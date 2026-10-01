"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validarCampanha, validarPeriodoMetricas, gerarSugestoesCampanha, calcularMetricas } = require("../src/domain/campaigns");

const campanha = (overrides = {}) => ({
  titulo: "Oferta almoço", tipo_beneficio: "DESCONTO_PERCENTUAL", valor_beneficio: "5", status: "RASCUNHO",
  inicio_em: "2026-10-02T11:00:00-03:00", fim_em: "2026-10-02T13:00:00-03:00", limite_usos: "10",
  produtos: [1], beneficio_itens: [], ...overrides,
});

test("valida e normaliza valores e produtos de campanha", () => {
  const out = validarCampanha(campanha({ titulo: "  Oferta almoço  ", produtos: ["1"] }), "auth-id", "https://example.supabase.co");
  assert.equal(out.titulo, "Oferta almoço");
  assert.equal(out.valor_beneficio, 5);
  assert.deepEqual(out.produtos, [1]);
});

test("rejeita campanha inválida antes de chamar o banco", () => {
  assert.throws(() => validarCampanha(campanha({ valor_beneficio: 101 }), "auth-id", "https://example.supabase.co"), /no máximo 100%/);
  assert.throws(() => validarCampanha(campanha({ inicio_em: "2026-10-02T11:00" }), "auth-id", "https://example.supabase.co"), /fuso horário/);
  assert.throws(() => validarCampanha(campanha({ inicio_em: "2026-02-30T11:00:00-03:00" }), "auth-id", "https://example.supabase.co"), /datas válidas/);
  assert.throws(() => validarCampanha(campanha({ produtos: [1, "1"] }), "auth-id", "https://example.supabase.co"), /produtos inválida/);
  assert.throws(() => validarCampanha(campanha({ status: "PUBLICADA" }), "auth-id", "https://example.supabase.co"), /Status/);
});

test("limita e valida períodos de métricas", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  assert.deepEqual(validarPeriodoMetricas(undefined, undefined, "2026-09-01T00:00:00Z", now), {
    inicio: "2026-09-01T00:00:00.000Z", fim: "2026-10-01T12:00:00.000Z",
  });
  assert.equal(validarPeriodoMetricas(undefined, undefined, "2020-01-01", now).inicio, new Date(now.getTime() - 366 * 86400000).toISOString());
  assert.throws(() => validarPeriodoMetricas("invalido", undefined, "2026-09-01", now), /período válido/);
  assert.throws(() => validarPeriodoMetricas("2026-09-02", "2026-09-01", "2026-09-01", now), /posterior/);
  assert.throws(() => validarPeriodoMetricas("2024-01-01", now.toISOString(), "2024-01-01", now), /366 dias/);
  assert.throws(() => validarPeriodoMetricas(undefined, "2026-10-02", "2026-09-01", now), /futuro/);
});

test("sugere rascunhos futuros a partir da demanda agregada histórica", () => {
  const now = new Date("2026-10-01T12:00:00-03:00");
  const demanda = { coorte_minima: 5, itens: [
    { data: "2026-09-17", faixa_horario: "12h_13h30", clientes_distintos: 8, demanda_estimada: 10 },
    { data: "2026-09-24", faixa_horario: "12h_13h30", clientes_distintos: 6, demanda_estimada: 9 },
    { data: "2026-09-18", faixa_horario: "12h_13h30", clientes_distintos: 4, demanda_estimada: 9 },
  ] };
  const suggestions = gerarSugestoesCampanha(demanda, [{ id_produto: 8, nome: "Prato", preco: 20 }], now);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].metodo, "REGRA_FIXA");
  assert.equal(suggestions[0].rascunho.status, "RASCUNHO");
  assert.equal(suggestions[0].amostra.refeicoes_planejadas, 19);
  assert.equal(suggestions[0].amostra.dias_observados, 2);
  assert.ok(Date.parse(suggestions[0].rascunho.inicio_em) > now.getTime());
  assert.match(suggestions[0].limitacao, /não de vendas confirmadas/);
  assert.deepEqual(gerarSugestoesCampanha(demanda, [], now), []);
});

test("calcula métricas sem misturar resgates cancelados, caixa bruto, reembolsos e receita líquida", () => {
  const m = calcularMetricas([
    { tipo: "IMPRESSION", id_cliente: 1, chave_deduplicacao: "a" },
    { tipo: "IMPRESSION", id_cliente: 1, chave_deduplicacao: "a" },
    { tipo: "IMPRESSION", id_cliente: 2, chave_deduplicacao: "b" },
    { tipo: "CLICK", id_cliente: 1, chave_deduplicacao: "a" },
    { tipo: "RESERVA_INICIADA", id_cliente: 1, chave_deduplicacao: "a" },
  ], [
    { id_pedido: 10, status: "RESERVADO", entregue_em: "2026-10-01", valor_beneficio: 3 },
    { id_pedido: 11, status: "CANCELADO", valor_beneficio: 8 },
  ], [
    { id_pedido: 10, status_pagamento: "APROVADO", valor: 20, valor_pago: 20, valor_reembolsado: 5 },
    { id_pedido: 11, status_pagamento: "APROVADO", valor: 99 },
  ]);
  assert.equal(m.visualizacoes, 3);
  assert.equal(m.visualizacoes_unicas, 2);
  assert.equal(m.resgates_validos, 1);
  assert.equal(m.resgates_cancelados, 1);
  assert.equal(m.beneficios_entregues, 1);
  assert.equal(m.pedidos_pagos, 1);
  assert.equal(m.receita_bruta_atribuida, 20);
  assert.equal(m.reembolsos_atribuidos, 5);
  assert.equal(m.receita_liquida_atribuida, 15);
  assert.equal(m.descontos_registrados, 3);
  assert.equal(m.resgates_com_pedido, 1);
  assert.equal(m.taxa_pedido_pago_por_resgate_com_pedido, 1);
});

test("devolve taxas zero quando não há atividade e sinaliza históricos incompletos", () => {
  const vazio = calcularMetricas();
  assert.equal(vazio.indice_cliques_por_visualizacao, 0);
  assert.equal(vazio.indice_reservas_iniciadas_por_clique, 0);
  assert.equal(vazio.taxa_pedido_pago_por_resgate_com_pedido, 0);
  assert.equal(vazio.historico_limitado, false);
  assert.equal(calcularMetricas([{ tipo: "CLICK", id_cliente: null }]).historico_limitado, true);
  assert.equal(calcularMetricas([{ tipo: "CLICK", id_cliente: 12 }]).historico_limitado, true);
  const estornado = calcularMetricas([], [{ id_pedido: 1, status: "APLICADO" }], [{ id_pedido: 1, status_pagamento: "ESTORNADO", valor: 12 }]);
  assert.equal(estornado.receita_liquida_atribuida, 0);
  assert.equal(estornado.historico_limitado, true);
});
