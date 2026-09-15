"use strict";
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
let estadoPlanejamento;
let validarJanela;
before(async () => {
    ({ estadoPlanejamento, validarJanela } = await import("../../frontend/lib/routine-view.mjs"));
});
const base = { perfil: {}, planejamento: { semana_fim: "2026-09-20" }, refeicoes: [], agora: new Date("2026-09-14T12:00:00-03:00") };

test("perfil salvo sem semana oferece gerar; semana sem opcoes oferece diagnostico", () => {
    assert.equal(estadoPlanejamento({ ...base, planejamento: null }).acao, "gerar");
    const estado = estadoPlanejamento({ ...base, refeicoes: [{ data_refeicao: "2026-09-15", horario_sugerido: "12:00:00" }] });
    assert.equal(estado.titulo, "Nenhuma opção compatível");
    assert.equal(estado.acao, "ver");
});
test("nao anuncia como proxima uma refeicao passada no mesmo dia ou recusada", () => {
    const refeicoes = [{ data_refeicao: "2026-09-14", horario_sugerido: "11:00:00", id_restaurante: 1 },
        { data_refeicao: "2026-09-15", horario_sugerido: "12:00:00", id_restaurante: 1, status: "RECUSADA" }];
    assert.equal(estadoPlanejamento({ ...base, refeicoes }).titulo, "Sem próximas refeições");
});
test("semana expirada nao aparece como vazia", () => {
    assert.equal(estadoPlanejamento({ ...base, planejamento: { semana_fim: "2026-09-13" } }).titulo, "Planejamento encerrado");
});
test("formulario informa erro de limite e aceita janela maior que a saida", () => {
    const form = { horario_inicio: "12:00", horario_fim: "13:30", tempo_maximo_minutos: 60, dias_semana: ["monday"], raio_km: 5 };
    assert.equal(validarJanela(form), "");
    assert.match(validarJanela({ ...form, tempo_maximo_minutos: 120 }), /90 minutos/);
    assert.match(validarJanela({ ...form, dias_semana: [] }), /pelo menos um/);
});
