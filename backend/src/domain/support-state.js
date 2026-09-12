"use strict";

const MOTIVOS_SUPORTE = new Set([
    "PEDIDO_NAO_PRONTO",
    "PEDIDO_INCORRETO",
    "RESERVA_NAO_RECONHECIDA",
    "MESA_INDISPONIVEL",
    "RESTAURANTE_INDISPONIVEL",
    "PAGAMENTO",
    "REEMBOLSO",
    "ATENDIMENTO",
    "OUTRO",
]);

const STATUS_TERMINAIS_SUPORTE = new Set(["RESOLVIDO", "RECUSADO", "CANCELADO"]);

function normalizarTextoSuporte(valor, limite = 1200) {
    return String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, limite);
}

function normalizarMotivoSuporte(valor) {
    const motivo = String(valor ?? "").trim().toUpperCase();
    return MOTIVOS_SUPORTE.has(motivo) ? motivo : "OUTRO";
}

function prioridadePorMotivo(motivo) {
    const motivoNormalizado = normalizarMotivoSuporte(motivo);
    if (["RESTAURANTE_INDISPONIVEL", "REEMBOLSO"].includes(motivoNormalizado)) {
        return "CRITICA";
    }
    if (["PEDIDO_NAO_PRONTO", "PEDIDO_INCORRETO", "MESA_INDISPONIVEL", "PAGAMENTO"].includes(motivoNormalizado)) {
        return "ALTA";
    }
    return "MEDIA";
}

function motivoExigePedido(motivo) {
    return ["PEDIDO_NAO_PRONTO", "PEDIDO_INCORRETO", "REEMBOLSO"].includes(normalizarMotivoSuporte(motivo));
}

function motivoExigeReserva(motivo) {
    return ["RESERVA_NAO_RECONHECIDA", "MESA_INDISPONIVEL"].includes(normalizarMotivoSuporte(motivo));
}

function motivoPodeAfetarReputacao(motivo) {
    return [
        "PEDIDO_NAO_PRONTO",
        "PEDIDO_INCORRETO",
        "RESERVA_NAO_RECONHECIDA",
        "MESA_INDISPONIVEL",
        "RESTAURANTE_INDISPONIVEL",
        "ATENDIMENTO",
    ].includes(normalizarMotivoSuporte(motivo));
}

function dataHoraReserva(reserva) {
    if (!reserva?.data_reserva || !reserva?.horario_inicio) {
        return null;
    }
    const data = new Date(`${reserva.data_reserva}T${String(reserva.horario_inicio).slice(0, 8)}`);
    return Number.isNaN(data.getTime()) ? null : data;
}

function prazoReclamacaoEncerrado({ reserva, pedido, agora = new Date(), dias = 7 }) {
    const base = dataHoraReserva(reserva) ?? (pedido?.data_pedido ? new Date(pedido.data_pedido) : null);
    if (!base || Number.isNaN(base.getTime())) {
        return false;
    }
    const limite = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000);
    return agora > limite;
}

function validarAberturaChamado({ motivo, descricao, pedido, reserva, agora = new Date() }) {
    const motivoNormalizado = normalizarMotivoSuporte(motivo);
    const descricaoNormalizada = normalizarTextoSuporte(descricao);
    if (descricaoNormalizada.length < 10) {
        return { allowed: false, code: "DESCRICAO_CURTA" };
    }
    if (motivoExigePedido(motivoNormalizado) && !pedido) {
        return { allowed: false, code: "PEDIDO_OBRIGATORIO" };
    }
    if (motivoExigeReserva(motivoNormalizado) && !reserva) {
        return { allowed: false, code: "RESERVA_OBRIGATORIA" };
    }
    if (pedido && motivoNormalizado !== "PAGAMENTO" && pedido.status_pedido === "PENDENTE") {
        return { allowed: false, code: "PEDIDO_AGUARDANDO_PAGAMENTO" };
    }
    if (reserva && ["CANCELADA", "NAO_COMPARECEU"].includes(reserva.status_reserva) && motivoNormalizado === "PEDIDO_NAO_PRONTO") {
        return { allowed: false, code: "RESERVA_INATIVA" };
    }
    if (reserva?.status_confirmacao_presenca === "RECUSADA" && motivoNormalizado === "PEDIDO_NAO_PRONTO") {
        return { allowed: false, code: "AUSENCIA_INFORMADA" };
    }
    if (prazoReclamacaoEncerrado({ reserva, pedido, agora })) {
        return { allowed: false, code: "PRAZO_ENCERRADO" };
    }
    return { allowed: true, motivo: motivoNormalizado, descricao: descricaoNormalizada };
}

function proximoStatusPorMensagem(tipoRemetente, statusAtual) {
    if (STATUS_TERMINAIS_SUPORTE.has(statusAtual)) {
        return statusAtual;
    }
    if (tipoRemetente === "cliente") {
        return "AGUARDANDO_RESTAURANTE";
    }
    if (tipoRemetente === "restaurante") {
        return "AGUARDANDO_CLIENTE";
    }
    if (tipoRemetente === "admin") {
        return "EM_ANALISE_ADMIN";
    }
    return statusAtual;
}

function calcularImpactoReputacao({ procedencia, motivo, impactoInformado }) {
    if (procedencia !== "PROCEDENTE" || !motivoPodeAfetarReputacao(motivo)) {
        return 0;
    }
    const informado = Number(impactoInformado);
    if (Number.isFinite(informado) && informado >= 0) {
        return Math.min(informado, 10);
    }
    return prioridadePorMotivo(motivo) === "CRITICA" ? 2 : 1;
}

module.exports = {
    MOTIVOS_SUPORTE,
    STATUS_TERMINAIS_SUPORTE,
    calcularImpactoReputacao,
    motivoExigePedido,
    motivoExigeReserva,
    motivoPodeAfetarReputacao,
    normalizarMotivoSuporte,
    normalizarTextoSuporte,
    prioridadePorMotivo,
    proximoStatusPorMensagem,
    validarAberturaChamado,
};
