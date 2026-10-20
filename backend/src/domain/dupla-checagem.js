"use strict";

function verificarDisponibilidadePreCobranca({ mesa, reserva, agora = new Date() }) {
    if (!mesa) return { bloqueado: true, motivo: "MESA_NAO_ENCONTRADA", sugestoes: [] };
    if (!reserva) return { bloqueado: true, motivo: "RESERVA_NAO_ENCONTRADA", sugestoes: [] };

    if (mesa.status === "INATIVA" || mesa.disponivel === false) {
        return {
            bloqueado: true,
            motivo: "MESA_INDISPONIVEL",
            sugestoes: ["Selecionar outra mesa", "Horário alternativo"],
        };
    }

    if (!["PENDENTE", "CONFIRMADA"].includes(reserva.status_reserva)) {
        return {
            bloqueado: true,
            motivo: "RESERVA_STATUS_INVALIDO",
            sugestoes: ["Criar nova reserva"],
        };
    }

    const inicioReserva = reserva.data_reserva && reserva.horario_inicio
        ? new Date(`${reserva.data_reserva}T${String(reserva.horario_inicio).slice(0, 8)}-03:00`)
        : null;
    if (!inicioReserva || Number.isNaN(inicioReserva.getTime())) {
        return { bloqueado: true, motivo: "HORARIO_INVALIDO", sugestoes: [] };
    }

    if (agora.getTime() > inicioReserva.getTime()) {
        return {
            bloqueado: true,
            motivo: "RESERVA_JA_INICIADA",
            sugestoes: ["Horário alternativo"],
        };
    }

    if (mesa.capacidade != null && reserva.pessoas != null && reserva.pessoas > mesa.capacidade) {
        return {
            bloqueado: true,
            motivo: "CAPACIDADE_EXCEDIDA",
            sugestoes: ["Selecionar mesa maior", "Reduzir número de pessoas"],
        };
    }

    if (Array.isArray(mesa.reservas_conflitantes) && mesa.reservas_conflitantes.length > 0) {
        return {
            bloqueado: true,
            motivo: "CONFLITO_HORARIO",
            sugestoes: ["Horário alternativo", "Selecionar outra mesa"],
        };
    }

    return { bloqueado: false, motivo: null, sugestoes: [] };
}

module.exports = {
    verificarDisponibilidadePreCobranca,
};
