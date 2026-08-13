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
module.exports = { intervalsOverlap, isReservationInputValid, isReservationNoShow, restaurantCancellationEligibility };
