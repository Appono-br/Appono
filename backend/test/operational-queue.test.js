"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    JANELA_OPERACIONAL_MINUTOS,
    obterMinutosAteReserva,
    ordenarPorHorarioReserva,
    pedidoPodeIniciarPreparo,
    pedidoEstaNaFilaOperacional,
    reservaEstaNaFilaOperacional,
} = require("../src/domain/operational-queue");

const agora = new Date("2026-08-18T10:00:00-03:00");

function reservaEm(minutos, status = "CONFIRMADA") {
    const totalMinutos = 10 * 60 + minutos;
    const dia = 18 + Math.floor(totalMinutos / 1440);
    const minutosDoDia = ((totalMinutos % 1440) + 1440) % 1440;
    const horas = String(Math.floor(minutosDoDia / 60)).padStart(2, "0");
    const minutosHora = String(minutosDoDia % 60).padStart(2, "0");
    return {
        data_reserva: `2026-08-${String(dia).padStart(2, "0")}`,
        horario_inicio: `${horas}:${minutosHora}:00`,
        status_reserva: status,
        status_confirmacao_presenca: "CONFIRMADA",
    };
}

test("calcula a janela operacional a partir do horario da reserva", () => {
    assert.equal(obterMinutosAteReserva(reservaEm(45), agora), 45);
    assert.equal(JANELA_OPERACIONAL_MINUTOS, 60);
});

test("pedido confirmado entra na fila futura da cozinha ordenada por horario", () => {
    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(90),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(45),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(-90),
    }, agora), false);
});

test("inicio de preparo respeita o horario planejado", () => {
    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T10:15:00",
        reservas: reservaEm(90),
    }, agora), false);

    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T09:45:00",
        reservas: reservaEm(90),
    }, agora), true);

    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T09:45:00",
        reservas: reservaEm(-90),
    }, agora), false);
});

test("pedidos em andamento continuam na fila operacional", () => {
    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "EM_PREPARO",
        reservas: reservaEm(180),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "PENDENTE",
        reservas: reservaEm(15),
    }, agora), false);
});

test("pedido nao entra na cozinha quando a reserva saiu da operacao", () => {
    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(15, "NAO_COMPARECEU"),
    }, agora), false);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "EM_PREPARO",
        reservas: reservaEm(15, "CANCELADA"),
    }, agora), false);
});

test("pedido aguarda confirmacao de presenca para entrar na cozinha", () => {
    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: { ...reservaEm(30), status_confirmacao_presenca: "PENDENTE" },
    }, agora), false);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: { ...reservaEm(30), status_reserva: "CHECK_IN", status_confirmacao_presenca: "PENDENTE" },
    }, agora), true);
});

test("reserva operacional prioriza proximidade e atendimento em curso", () => {
    assert.equal(reservaEstaNaFilaOperacional(reservaEm(30), agora), true);
    assert.equal(reservaEstaNaFilaOperacional(reservaEm(1800), agora), false);
    assert.equal(reservaEstaNaFilaOperacional(reservaEm(1800, "CHECK_IN"), agora), true);

    const ordenadas = [reservaEm(120), reservaEm(30)].sort(ordenarPorHorarioReserva);
    assert.equal(obterMinutosAteReserva(ordenadas[0], agora), 30);
});
