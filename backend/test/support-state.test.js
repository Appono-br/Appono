"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calcularImpactoReputacao,
    motivoExigePedido,
    motivoExigeReserva,
    normalizarMotivoSuporte,
    normalizarTextoSuporte,
    prioridadePorMotivo,
    proximoStatusPorMensagem,
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
    assert.equal(prioridadePorMotivo("RESTAURANTE_INDISPONIVEL"), "CRITICA");
    assert.equal(prioridadePorMotivo("PEDIDO_INCORRETO"), "ALTA");
    assert.equal(prioridadePorMotivo("PEDIDO_NAO_PRONTO"), "ALTA");
    assert.equal(prioridadePorMotivo("MESA_INDISPONIVEL"), "ALTA");
    assert.equal(prioridadePorMotivo("PAGAMENTO"), "ALTA");
    assert.equal(prioridadePorMotivo("OUTRO"), "MEDIA");
    assert.equal(prioridadePorMotivo("ATENDIMENTO"), "MEDIA");
});

test("normaliza motivos invalidos para OUTRO", () => {
    assert.equal(normalizarMotivoSuporte("invalido"), "OUTRO");
    assert.equal(normalizarMotivoSuporte(""), "OUTRO");
    assert.equal(normalizarMotivoSuporte(null), "OUTRO");
    assert.equal(normalizarMotivoSuporte("pedido_nao_pronto"), "PEDIDO_NAO_PRONTO");
});

test("normaliza texto de suporte removendo espacos extras e limitando tamanho", () => {
    assert.equal(normalizarTextoSuporte("  texto   com   espacos  "), "texto com espacos");
    assert.equal(normalizarTextoSuporte("a".repeat(2000), 100).length, 100);
    assert.equal(normalizarTextoSuporte(null), "");
});

test("motivos que exigem pedido", () => {
    assert.equal(motivoExigePedido("PEDIDO_NAO_PRONTO"), true);
    assert.equal(motivoExigePedido("PEDIDO_INCORRETO"), true);
    assert.equal(motivoExigePedido("REEMBOLSO"), true);
    assert.equal(motivoExigePedido("ATENDIMENTO"), false);
    assert.equal(motivoExigePedido("OUTRO"), false);
});

test("motivos que exigem reserva", () => {
    assert.equal(motivoExigeReserva("RESERVA_NAO_RECONHECIDA"), true);
    assert.equal(motivoExigeReserva("MESA_INDISPONIVEL"), true);
    assert.equal(motivoExigeReserva("PEDIDO_NAO_PRONTO"), false);
});

test("transicoes de status por mensagem de cada perfil", () => {
    assert.equal(proximoStatusPorMensagem("cliente", "ABERTO"), "AGUARDANDO_RESTAURANTE");
    assert.equal(proximoStatusPorMensagem("cliente", "AGUARDANDO_CLIENTE"), "AGUARDANDO_RESTAURANTE");
    assert.equal(proximoStatusPorMensagem("restaurante", "AGUARDANDO_RESTAURANTE"), "AGUARDANDO_CLIENTE");
    assert.equal(proximoStatusPorMensagem("restaurante", "ABERTO"), "AGUARDANDO_CLIENTE");
    assert.equal(proximoStatusPorMensagem("admin", "AGUARDANDO_RESTAURANTE"), "EM_ANALISE_ADMIN");
    assert.equal(proximoStatusPorMensagem("admin", "ABERTO"), "EM_ANALISE_ADMIN");
});

test("status terminal nao muda por mensagem", () => {
    assert.equal(proximoStatusPorMensagem("cliente", "RESOLVIDO"), "RESOLVIDO");
    assert.equal(proximoStatusPorMensagem("restaurante", "RECUSADO"), "RECUSADO");
    assert.equal(proximoStatusPorMensagem("admin", "CANCELADO"), "CANCELADO");
});

test("permite abertura valida com pedido e reserva", () => {
    const resultado = validarAberturaChamado({
        motivo: "PEDIDO_NAO_PRONTO",
        descricao: "Cheguei ao restaurante e meu pedido nao estava pronto conforme combinado.",
        pedido: { status_pedido: "CONFIRMADO" },
        reserva: { status_reserva: "CONFIRMADA", data_reserva: "2026-10-13", horario_inicio: "12:00:00" },
        agora: new Date("2026-10-13T12:30:00-03:00"),
    });
    assert.equal(resultado.allowed, true);
    assert.equal(resultado.motivo, "PEDIDO_NAO_PRONTO");
});

test("bloqueia descricao curta", () => {
    const resultado = validarAberturaChamado({
        motivo: "OUTRO",
        descricao: "curto",
        reserva: { status_reserva: "CONFIRMADA", data_reserva: "2026-10-13", horario_inicio: "12:00:00" },
        agora: new Date("2026-10-13T12:30:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
    assert.equal(resultado.code, "DESCRICAO_CURTA");
});

test("bloqueia motivo que exige pedido sem pedido", () => {
    const resultado = validarAberturaChamado({
        motivo: "PEDIDO_NAO_PRONTO",
        descricao: "Cheguei ao restaurante e meu pedido nao estava pronto.",
        pedido: null,
        reserva: { status_reserva: "CONFIRMADA", data_reserva: "2026-10-13", horario_inicio: "12:00:00" },
        agora: new Date("2026-10-13T12:30:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
    assert.equal(resultado.code, "PEDIDO_OBRIGATORIO");
});

test("bloqueia motivo que exige reserva sem reserva", () => {
    const resultado = validarAberturaChamado({
        motivo: "RESERVA_NAO_RECONHECIDA",
        descricao: "O restaurante disse que nao tinha minha reserva no sistema.",
        pedido: null,
        reserva: null,
        agora: new Date("2026-10-13T12:30:00-03:00"),
    });
    assert.equal(resultado.allowed, false);
    assert.equal(resultado.code, "RESERVA_OBRIGATORIA");
});

test("impacto reputacao respeita limite maximo de 10", () => {
    assert.equal(calcularImpactoReputacao({ procedencia: "PROCEDENTE", motivo: "PEDIDO_NAO_PRONTO", impactoInformado: 15 }), 10);
    assert.equal(calcularImpactoReputacao({ procedencia: "PROCEDENTE", motivo: "PEDIDO_NAO_PRONTO", impactoInformado: 5 }), 5);
});
