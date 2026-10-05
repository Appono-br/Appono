"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    JANELA_OPERACIONAL_MINUTOS,
    obterMinutosAteReserva,
    obterMinutosAteInicioPreparo,
    ordenarPorHorarioReserva,
    obterTempoPreparoMedioMinutos,
    obterTempoPreparoTotalMinutos,
    obterMargemOperacionalMinutos,
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
    assert.equal(JANELA_OPERACIONAL_MINUTOS, 90);
});

test("pedido confirmado entra na cozinha somente na janela operacional da reserva", () => {
    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(90),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(91),
    }, agora), false);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(45),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(-90),
    }, agora), true);

    assert.equal(pedidoEstaNaFilaOperacional({
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(-91),
    }, agora), false);
});

test("inicio de preparo depende da elegibilidade operacional do pedido", () => {
    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T10:15:00",
        reservas: reservaEm(90),
    }, agora), true);

    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T09:45:00",
        reservas: reservaEm(45),
    }, agora), true);

    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T09:45:00",
        reservas: reservaEm(-90),
    }, agora), true);

    assert.equal(pedidoPodeIniciarPreparo({
        status_pedido: "CONFIRMADO",
        iniciar_preparo_em: "2026-08-18T09:45:00",
        reservas: reservaEm(-91),
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

test("estimativa de preparo recalcula quantidade e combina cargas paralelas", () => {
    const pedido = {
        status_pedido: "CONFIRMADO",
        reservas: reservaEm(45),
        itens_pedido: [
            { id_produto: 1, quantidade: 3, produtos: { nome: "Massa", tempo_preparo_minutos: 20 } },
            { id_produto: 2, quantidade: 1, produtos: { nome: "Entrada", tempo_preparo_minutos: 10 } },
        ],
    };
    assert.equal(obterTempoPreparoMedioMinutos(pedido), 18);
    assert.equal(obterTempoPreparoTotalMinutos(pedido), 36);
    assert.equal(obterMargemOperacionalMinutos(pedido), 41);
    assert.equal(obterMinutosAteInicioPreparo(pedido, agora), 4);
});

test("estimativa de preparo usa piso seguro e ignora itens sem tempo válido", () => {
    const pedido = {
        itens_pedido: [
            { quantidade: 0, produtos: { tempo_preparo_minutos: 30 } },
            { quantidade: 2, produtos: { tempo_preparo_minutos: null } },
            { quantidade: 1, produtos: { tempo_preparo_minutos: -5 } },
        ],
    };
    assert.equal(obterTempoPreparoMedioMinutos(pedido), null);
    assert.equal(obterTempoPreparoTotalMinutos(pedido), null);
    assert.equal(obterMargemOperacionalMinutos(pedido), null);
});

test("pedidos cancelados, pendentes e reservas encerradas não entram na cozinha", () => {
    const base = { reservas: reservaEm(30), itens_pedido: [{ quantidade: 1, produtos: { tempo_preparo_minutos: 15 } }] };
    assert.equal(pedidoEstaNaFilaOperacional({ ...base, status_pedido: "PENDENTE" }, agora), false);
    assert.equal(pedidoEstaNaFilaOperacional({ ...base, status_pedido: "CANCELADO" }, agora), false);
    assert.equal(pedidoEstaNaFilaOperacional({ ...base, status_pedido: "CONFIRMADO", reservas: reservaEm(30, "CONCLUIDA") }, agora), false);
    assert.equal(pedidoEstaNaFilaOperacional({ ...base, status_pedido: "EM_PREPARO" }, agora), true);
    assert.equal(pedidoEstaNaFilaOperacional({ ...base, status_pedido: "PRONTO" }, agora), true);
});
