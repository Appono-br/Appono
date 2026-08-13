"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { intervalsOverlap, isReservationInputValid } = require("../src/domain/reservation-time");
test("detecta conflito e permite horarios adjacentes", () => {
    assert.equal(intervalsOverlap("19:00", "20:00", "19:30", "20:30"), true);
    assert.equal(intervalsOverlap("19:00", "20:00", "20:00", "21:00"), false);
});
test("valida data, intervalo e quantidade de pessoas", () => {
    assert.equal(isReservationInputValid({ date: "2026-08-14", start: "19:00", end: "20:00", people: 2 }, "2026-08-13"), true);
    assert.equal(isReservationInputValid({ date: "2026-08-12", start: "19:00", end: "20:00", people: 2 }, "2026-08-13"), false);
});
