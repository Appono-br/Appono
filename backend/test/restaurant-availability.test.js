"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const codigo = fs.readFileSync(path.join(__dirname, "../src/routes/restaurants.js"), "utf8");
const contexto = vm.createContext({ Date });
vm.runInContext(codigo.slice(codigo.indexOf("const diasSemanaOperacao"), codigo.indexOf('exports.restaurantsRouter.get("/",')), contexto);

function horarios(agora, dataReserva = "2026-10-01", open = "18:00", close = "24:00", antecedencia = 60) {
    return contexto.montarHorariosOperacionais({
        restaurante: { configuracao_operacao: {
            antecedenciaMinutosReserva: antecedencia,
            days: [{ id: "thursday", enabled: true, shifts: [{ open, close }] }],
        } },
        dataReserva, pessoas: 2, reservas: [], mesas: [{ id_mesa: 1, capacidade: 2 }], agora: new Date(agora),
    }).horarios;
}

test("reserva terminando a meia-noite preserva 24:00 para o banco", () => {
    const slot = horarios("2026-10-01T17:00:00-03:00").find((item) => item.horario === "22:00");
    assert.equal(slot.disponivel, true);
    assert.equal(slot.horario_fim, "24:00");
});

test("antecedencia considera segundos e independe do fuso do servidor", () => {
    const slots = horarios("2026-10-01T17:00:01-03:00");
    assert.equal(slots.find((item) => item.horario === "18:00").disponivel, false);
    assert.equal(slots.find((item) => item.horario === "18:30").disponivel, true);
    assert.equal(horarios("2026-10-01T17:00:00-03:00")[0].disponivel, true);
});

test("antecedencia que atravessa meia-noite bloqueia inicio no dia seguinte", () => {
    const slots = horarios("2026-09-30T23:30:00-03:00", "2026-10-01", "00:00", "04:00", 120);
    assert.equal(slots.find((item) => item.horario === "01:00").disponivel, false);
    assert.equal(slots.find((item) => item.horario === "01:30").disponivel, true);
});

test("datas passadas nao oferecem horarios disponiveis", () => {
    assert.equal(horarios("2026-10-02T00:00:00-03:00").some((slot) => slot.disponivel), false);
});
