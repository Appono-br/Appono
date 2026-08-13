"use strict";
function intervalsOverlap(startA, endA, startB, endB) { return startA < endB && startB < endA; }
function isReservationInputValid({ date, start, end, people }, today) {
    return Number.isInteger(people) && people >= 1 && people <= 30 && date >= today && start < end;
}
module.exports = { intervalsOverlap, isReservationInputValid };
