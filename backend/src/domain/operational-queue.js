"use strict";

const JANELA_OPERACIONAL_MINUTOS = 60;
const HORIZONTE_RESERVAS_OPERACIONAIS_HORAS = 24;

function obterDataHoraReserva(reserva) {
    if (!reserva?.data_reserva || !reserva?.horario_inicio) {
        return null;
    }

    const data = new Date(`${reserva.data_reserva}T${String(reserva.horario_inicio).slice(0, 8)}-03:00`);
    return Number.isNaN(data.getTime()) ? null : data;
}

function obterMinutosAteReserva(reserva, agora = new Date()) {
    const inicio = obterDataHoraReserva(reserva);
    if (!inicio) {
        return null;
    }

    return Math.floor((inicio.getTime() - agora.getTime()) / 60000);
}

function pedidoEstaNaFilaOperacional(pedido, agora = new Date(), janelaMinutos = JANELA_OPERACIONAL_MINUTOS) {
    if (!pedido || pedido.ocultado_cozinha === true || pedido.status_pedido === "PENDENTE") {
        return false;
    }

    if (["EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"].includes(pedido.status_pedido)) {
        return true;
    }

    if (pedido.status_pedido !== "CONFIRMADO") {
        return false;
    }

    const minutosAteReserva = obterMinutosAteReserva(pedido.reservas, agora);
    return minutosAteReserva !== null && minutosAteReserva <= janelaMinutos;
}

function reservaEstaNaFilaOperacional(reserva, agora = new Date()) {
    if (!reserva || reserva.ocultada_restaurante === true) {
        return false;
    }

    if (!["PENDENTE", "CONFIRMADA", "CHECK_IN"].includes(reserva.status_reserva)) {
        return false;
    }

    if (reserva.status_reserva === "CHECK_IN") {
        return true;
    }

    const minutosAteReserva = obterMinutosAteReserva(reserva, agora);
    const horizonteMinutos = HORIZONTE_RESERVAS_OPERACIONAIS_HORAS * 60;
    return minutosAteReserva !== null && minutosAteReserva >= -60 && minutosAteReserva <= horizonteMinutos;
}

function ordenarPorHorarioReserva(a, b) {
    const inicioA = obterDataHoraReserva(a.reservas ?? a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const inicioB = obterDataHoraReserva(b.reservas ?? b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return inicioA - inicioB;
}

module.exports = {
    HORIZONTE_RESERVAS_OPERACIONAIS_HORAS,
    JANELA_OPERACIONAL_MINUTOS,
    obterDataHoraReserva,
    obterMinutosAteReserva,
    ordenarPorHorarioReserva,
    pedidoEstaNaFilaOperacional,
    reservaEstaNaFilaOperacional,
};
