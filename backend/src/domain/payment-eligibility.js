"use strict";

function reservationDateTime(reservation) {
    if (!reservation?.data_reserva || !reservation?.horario_inicio) return null;
    const value = `${reservation.data_reserva}T${String(reservation.horario_inicio).slice(0, 8)}-03:00`;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function paymentEligibility(reservation, now = new Date()) {
    if (!reservation) return { allowed: false, code: "RESERVA_AUSENTE", message: "A reserva vinculada ao pedido não foi encontrada." };
    if (!["PENDENTE", "CONFIRMADA"].includes(reservation.status_reserva)) {
        return { allowed: false, code: "RESERVA_INATIVA", message: "O pagamento só está disponível para reservas aguardando pagamento ou confirmadas." };
    }
    const deadline = reservationDateTime(reservation);
    if (!deadline) return { allowed: false, code: "HORARIO_INVALIDO", message: "O horário da reserva e inválido." };
    if (now.getTime() >= deadline.getTime()) {
        return { allowed: false, code: "RESERVA_VENCIDA", message: "O prazo de pagamento terminou porque o horário da reserva já passou.", deadline };
    }
    return { allowed: true, code: "PAGAMENTO_DISPONIVEL", deadline };
}

function gatewayPaymentDate(payment) {
    const candidates = [
        ["date_approved", payment?.date_approved],
        ["date_created", payment?.date_created],
    ];
    for (const [source, value] of candidates) {
        if (!value) continue;
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return { date, source };
    }
    return null;
}

function lateApprovalDecision({ gatewayStatus, existingStatus, reservation, payment }) {
    if (gatewayStatus !== "APROVADO") return { finalStatus: gatewayStatus, shouldRefund: false };
    if (existingStatus === "ESTORNADO") return { finalStatus: "ESTORNADO", shouldRefund: false, reason: "JA_ESTORNADO" };
    const paymentDate = gatewayPaymentDate(payment);
    if (!paymentDate) {
        const error = new Error("O Mercado Pago não informou uma data valida para a aprovação.");
        error.code = "DATA_APROVACAO_AUSENTE";
        throw error;
    }
    const deadline = reservationDateTime(reservation);
    if (!deadline) {
        const error = new Error("A reserva não possui horário válido para conciliar o pagamento.");
        error.code = "HORARIO_RESERVA_INVALIDO";
        throw error;
    }
    const inactive = ["CANCELADA", "RECUSADA", "NAO_COMPARECEU"].includes(reservation?.status_reserva);
    if (inactive || paymentDate.date.getTime() >= deadline.getTime()) {
        return {
            finalStatus: "ESTORNADO",
            shouldRefund: true,
            reason: inactive ? "RESERVA_INATIVA" : "APROVACAO_FORA_DO_PRAZO",
            paymentDate: paymentDate.date,
            paymentDateSource: paymentDate.source,
            deadline,
        };
    }
    return {
        finalStatus: "APROVADO",
        shouldRefund: false,
        paymentDate: paymentDate.date,
        paymentDateSource: paymentDate.source,
        deadline,
    };
}

module.exports = { gatewayPaymentDate, lateApprovalDecision, paymentEligibility, reservationDateTime };
