"use strict";

const JANELA_CHECKIN_MINUTOS_ANTES = 15;

function obterDataHoraLocal(dataReserva, horarioInicio) {
    const dt = new Date(`${dataReserva}T${String(horarioInicio).slice(0, 8)}-03:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function checkinEligibility(reserva, codigoTelefone, agora = new Date()) {
    if (!reserva) return { allowed: false, code: "RESERVA_NAO_ENCONTRADA" };

    if (!codigoTelefone || String(codigoTelefone).replace(/\D/g, "").length !== 4) {
        return { allowed: false, code: "CODIGO_INVALIDO" };
    }

    const telefoneLimpo = String(reserva.telefone_cliente ?? "").replace(/\D/g, "");
    const codigoLimpo = String(codigoTelefone).replace(/\D/g, "");
    if (telefoneLimpo.length < 4 || telefoneLimpo.slice(-4) !== codigoLimpo) {
        return { allowed: false, code: "CODIGO_TELEFONE_INCORRETO" };
    }

    if (reserva.status_reserva === "CHECK_IN") {
        return { allowed: true, code: "JA_CHECKIN", alreadyCheckedIn: true };
    }

    if (reserva.status_reserva !== "CONFIRMADA") {
        return { allowed: false, code: "STATUS_INVALIDO" };
    }

    const dataHora = obterDataHoraLocal(reserva.data_reserva, reserva.horario_inicio);
    if (!dataHora) return { allowed: false, code: "HORARIO_INVALIDO" };

    const inicioJanela = new Date(dataHora.getTime() - JANELA_CHECKIN_MINUTOS_ANTES * 60_000);
    if (agora.getTime() < inicioJanela.getTime()) {
        return {
            allowed: false,
            code: "FORA_DA_JANELA",
            abreEm: inicioJanela,
            minutosRestantes: Math.ceil((inicioJanela.getTime() - agora.getTime()) / 60_000),
        };
    }

    return { allowed: true, code: "CHECK_IN_PERMITIDO" };
}

module.exports = {
    JANELA_CHECKIN_MINUTOS_ANTES,
    checkinEligibility,
};
