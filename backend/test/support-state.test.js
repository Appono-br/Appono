"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calcularImpactoReputacao,
    prioridadePorMotivo,
    validarAberturaChamado,
} = require("../src/domain/support-state");

test("bloqueia reclamacao de pedido nao pronto quando o pedido ainda aguarda pagamento", () => {
    const resultado = validarAberturaChamado({
        motivo: "PEDIDO_NAO_PRONTO",
        descricao: "Cheguei ao restaurante e o pedido nao estava pronto.",
        pedido: { status_pedido: "PENDENTE" },
        reserva: { status_reserva: "CONFIRMADA", data_reserva: "2026-09-12", horario_inicio: "19:00:00" },
        agora: new Date("2026-09-12T19:05:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
    assert.equal(resultado.code, "PEDIDO_AGUARDANDO_PAGAMENTO");
});

test("bloqueia reclamacao de pedido nao pronto quando cliente avisou ausencia", () => {
    const resultado = validarAberturaChamado({
        motivo: "PEDIDO_NAO_PRONTO",
        descricao: "Pedido nao estava pronto no horario combinado.",
        pedido: { status_pedido: "CONFIRMADO" },
        reserva: { status_reserva: "CANCELADA", status_confirmacao_presenca: "RECUSADA", data_reserva: "2026-09-12", horario_inicio: "19:00:00" },
        agora: new Date("2026-09-12T19:05:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
});

test("encerra prazo de abertura sete dias apos a experiencia", () => {
    const resultado = validarAberturaChamado({
        motivo: "ATENDIMENTO",
        descricao: "O atendimento foi diferente do combinado no local.",
        reserva: { status_reserva: "CONCLUIDA", data_reserva: "2026-09-01", horario_inicio: "19:00:00" },
        agora: new Date("2026-09-09T19:01:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
    assert.equal(resultado.code, "PRAZO_ENCERRADO");
});

test("somente chamado procedente gera impacto operacional", () => {
    assert.equal(calcularImpactoReputacao({ procedencia: "IMPROCEDENTE", motivo: "PEDIDO_NAO_PRONTO" }), 0);
    assert.equal(calcularImpactoReputacao({ procedencia: "PROCEDENTE", motivo: "PEDIDO_NAO_PRONTO" }), 1);
    assert.equal(calcularImpactoReputacao({ procedencia: "PROCEDENTE", motivo: "RESTAURANTE_INDISPONIVEL" }), 2);
});

test("prioriza motivos criticos e operacionais", () => {
    assert.equal(prioridadePorMotivo("REEMBOLSO"), "CRITICA");
    assert.equal(prioridadePorMotivo("PEDIDO_INCORRETO"), "ALTA");
    assert.equal(prioridadePorMotivo("OUTRO"), "MEDIA");
});
