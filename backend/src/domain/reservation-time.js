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
module.exports = { intervalsOverlap, isReservationInputValid, isReservationNoShow };
