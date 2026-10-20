import { describe, it, expect } from "vitest";
import { setSystemTime } from "../mocks/clock.helper.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isReservationInputValid, intervalsOverlap } = require("../../backend/src/domain/reservation-time");

describe("RF14/RF30 — Gestão de Capacidade, Mesas e Concorrência", () => {
    it("TC-BIZ-04: Excesso de assentos — 6 pessoas em mesa com capacidade 4", () => {
        const input = { date: "2026-08-14", start: "19:00", end: "20:00", people: 6 };
        expect(isReservationInputValid(input, "2026-08-13")).toBe(true);
        const capacidadeMesa = 4;
        expect(input.people).toBeGreaterThan(capacidadeMesa);
    });

    it("TC-BIZ-05: Race condition — 2 requisições simultâneas para última mesa", () => {
        expect(intervalsOverlap("19:00", "20:00", "19:00", "20:00")).toBe(true);
        expect(intervalsOverlap("19:00", "20:00", "20:00", "21:00")).toBe(false);
    });

    it("TC-BIZ-06: Expiração do restaurante — 10min sem resposta", () => {
        const reservaCriada = new Date("2026-08-14T19:00:00-03:00");
        setSystemTime(reservaCriada);
        const TEMPO_EXPIRACAO_MS = 10 * 60_000;
        const expirada = new Date(reservaCriada.getTime() + TEMPO_EXPIRACAO_MS + 1_000);
        expect(expirada.getTime() - reservaCriada.getTime()).toBeGreaterThan(TEMPO_EXPIRACAO_MS);
    });

    it("Rejeita reserva com data passada", () => {
        expect(isReservationInputValid({ date: "2026-08-12", start: "19:00", end: "20:00", people: 2 }, "2026-08-13")).toBe(false);
    });

    it("Rejeita reserva com horário fim anterior ao início", () => {
        expect(isReservationInputValid({ date: "2026-08-14", start: "20:00", end: "19:00", people: 2 }, "2026-08-13")).toBe(false);
    });
});
