"use strict";
function intervalsOverlap(startA, endA, startB, endB) { return startA < endB && startB < endA; }
function isReservationInputValid({ date, start, end, people }, today) {
    return Number.isInteger(people) && people >= 1 && people <= 30 && date >= today && start < end;
}
function isReservationNoShow(reservation, now = new Date()) {
    if (reservation?.status_reserva !== "CONFIRMADA" || !reservation.data_reserva || !reservation.horario_fim) return false;
    const end = new Date(`${reservation.data_reserva}T${String(reservation.horario_fim).slice(0, 8)}-03:00`);
    return !Number.isNaN(end.getTime()) && now.getTime() >= end.getTime();
}
function restaurantCancellationEligibility(reservation, orderStatuses = [], now = new Date()) {
    if (!["PENDENTE", "CONFIRMADA"].includes(reservation?.status_reserva)) return { allowed: false, reason: "STATUS_INVALIDO" };
    const start = reservation?.data_reserva && reservation?.horario_inicio
        ? new Date(`${reservation.data_reserva}T${String(reservation.horario_inicio).slice(0, 8)}-03:00`)
        : null;
    if (!start || Number.isNaN(start.getTime())) return { allowed: false, reason: "HORARIO_INVALIDO" };
    if (now.getTime() >= start.getTime()) return { allowed: false, reason: "RESERVA_INICIADA" };
    if (orderStatuses.some((status) => ["EM_PREPARO", "PRONTO", "ENTREGUE"].includes(status))) return { allowed: false, reason: "PEDIDO_EM_ANDAMENTO" };
    return { allowed: true };
}

function reservationStartDate(reservation) {
    if (!reservation?.data_reserva || !reservation?.horario_inicio) return null;
    const start = new Date(`${reservation.data_reserva}T${String(reservation.horario_inicio).slice(0, 8)}-03:00`);
    return Number.isNaN(start.getTime()) ? null : start;
}

function attendanceConfirmationDeadline(reservation) {
    const start = reservationStartDate(reservation);
    return start ? new Date(start.getTime() - 60 * 60 * 1000) : null;
}

function attendanceConfirmationEligibility(reservation, now = new Date()) {
    if (!reservation) return { allowed: false, reason: "RESERVA_NAO_ENCONTRADA" };
    if (reservation.status_reserva !== "CONFIRMADA") return { allowed: false, reason: "STATUS_INVALIDO" };
    if (reservation.status_confirmacao_presenca === "RECUSADA") {
        return { allowed: false, reason: "JA_RESPONDIDA" };
    }
    const deadline = attendanceConfirmationDeadline(reservation);
    if (!deadline) return { allowed: false, reason: "HORARIO_INVALIDO" };
    if (now.getTime() > deadline.getTime()) return { allowed: false, reason: "PRAZO_ENCERRADO", deadline };
    return { allowed: true, deadline };
}

function attendanceConfirmationExpired(reservation, now = new Date()) {
    if (!reservation || reservation.status_reserva !== "CONFIRMADA") return false;
    if (reservation.status_confirmacao_presenca !== "PENDENTE") return false;
    const deadline = reservation.prazo_confirmacao_presenca
        ? new Date(reservation.prazo_confirmacao_presenca)
        : attendanceConfirmationDeadline(reservation);
    return Boolean(deadline) && !Number.isNaN(deadline.getTime()) && now.getTime() > deadline.getTime();
}

function apponoCommissionPercentage() {
    const percentage = Number(process.env.MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL ?? process.env.MERCADO_PAGO_MARKETPLACE_FEE ?? 13);
    if (!Number.isFinite(percentage)) return 13;
    return Math.max(0, Math.min(100, percentage));
}

function roundMoney(amount) {
    return Math.round(Number(amount ?? 0) * 100) / 100;
}

function calculateAttendanceRefundPolicy({ paidAmount, minimumTotal, commissionPercentage = apponoCommissionPercentage() }) {
    const paid = roundMoney(paidAmount);
    const minimum = roundMoney(minimumTotal);
    const commission = roundMoney(paid * (Number(commissionPercentage ?? 0) / 100));
    const retained = Math.min(paid, roundMoney(minimum + commission));
    const refund = Math.max(0, roundMoney(paid - retained));
    const appCommission = Math.min(commission, retained);
    const restaurantRetained = Math.max(0, roundMoney(retained - appCommission));
    return {
        commissionPercentage: Number(commissionPercentage ?? 0),
        commission,
        appCommission,
        minimum,
        paid,
        refund,
        retained,
        restaurantRetained,
    };
}

module.exports = {
    apponoCommissionPercentage,
    attendanceConfirmationDeadline,
    attendanceConfirmationExpired,
    attendanceConfirmationEligibility,
    calculateAttendanceRefundPolicy,
    intervalsOverlap,
    isReservationInputValid,
    isReservationNoShow,
    reservationStartDate,
    restaurantCancellationEligibility,
};
