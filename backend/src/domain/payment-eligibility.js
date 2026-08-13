"use strict";

function reservationDateTime(reservation) {
    if (!reservation?.data_reserva || !reservation?.horario_inicio) return null;
    const value = `${reservation.data_reserva}T${String(reservation.horario_inicio).slice(0, 8)}-03:00`;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function paymentEligibility(reservation, now = new Date()) {
    if (!reservation) return { allowed: false, code: "RESERVA_AUSENTE", message: "A reserva vinculada ao pedido nao foi encontrada." };
    if (reservation.status_reserva !== "CONFIRMADA") {
        return { allowed: false, code: "RESERVA_INATIVA", message: "O pagamento so esta disponivel para reservas confirmadas." };
    }
    const deadline = reservationDateTime(reservation);
    if (!deadline) return { allowed: false, code: "HORARIO_INVALIDO", message: "O horario da reserva e invalido." };
    if (now.getTime() >= deadline.getTime()) {
        return { allowed: false, code: "RESERVA_VENCIDA", message: "O prazo de pagamento terminou porque o horario da reserva ja passou.", deadline };
    }
    return { allowed: true, code: "PAGAMENTO_DISPONIVEL", deadline };
}

module.exports = { paymentEligibility, reservationDateTime };
