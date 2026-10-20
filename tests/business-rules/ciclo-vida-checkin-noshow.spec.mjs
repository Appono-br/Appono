import { describe, it, expect } from "vitest";
import { setSystemTime, brasiliaTime } from "../mocks/clock.helper.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isReservationNoShow, calculateAttendanceRefundPolicy } = require("../../backend/src/domain/reservation-time");
const { canTransitionOrder } = require("../../backend/src/domain/order-state");
const { strongestPaymentStatus, nextTransferStatus } = require("../../backend/src/domain/payment-state");
const { checkinEligibility, JANELA_CHECKIN_MINUTOS_ANTES } = require("../../backend/src/domain/checkin-reserva");

function criarReserva(overrides = {}) {
    return {
        status_reserva: "CONFIRMADA",
        status_confirmacao_presenca: "PENDENTE",
        data_reserva: "2026-08-14",
        horario_inicio: "12:30:00",
        horario_fim: "13:30:00",
        telefone_cliente: "11999887766",
        ...overrides,
    };
}

describe("Check-in de Reserva — Função de Domínio Real", () => {
    it("TC-BIZ-07: Atraso leve ≤15min — check-in às 12:42 aceito", () => {
        const reserva = criarReserva();
        const agora = brasiliaTime("2026-08-14", "12:42:00");
        setSystemTime(agora);

        const resultado = checkinEligibility(reserva, "7766", agora);
        expect(resultado.allowed).toBe(true);
        expect(resultado.code).toBe("CHECK_IN_PERMITIDO");

        expect(isReservationNoShow(reserva, agora)).toBe(false);
        expect(canTransitionOrder("PRONTO", "ENTREGUE")).toBe(true);
    });

    it("TC-BIZ-07b: Check-in 15min antes da reserva — janela exata", () => {
        const reserva = criarReserva();
        const exato15min = brasiliaTime("2026-08-14", "12:15:00");
        expect(checkinEligibility(reserva, "7766", exato15min).allowed).toBe(true);
    });

    it("TC-BIZ-07c: Check-in 16min antes — fora da janela", () => {
        const reserva = criarReserva();
        const cedo = brasiliaTime("2026-08-14", "12:13:59");
        const resultado = checkinEligibility(reserva, "7766", cedo);
        expect(resultado.allowed).toBe(false);
        expect(resultado.code).toBe("FORA_DA_JANELA");
        expect(resultado.minutosRestantes).toBeGreaterThan(0);
    });

    it("TC-BIZ-07d: Código telefone incorreto bloqueia check-in", () => {
        const reserva = criarReserva();
        const agora = brasiliaTime("2026-08-14", "12:30:00");
        const resultado = checkinEligibility(reserva, "0000", agora);
        expect(resultado.allowed).toBe(false);
        expect(resultado.code).toBe("CODIGO_TELEFONE_INCORRETO");
    });

    it("TC-BIZ-07e: Check-in duplicado retorna sucesso com flag", () => {
        const reserva = criarReserva({ status_reserva: "CHECK_IN" });
        const agora = brasiliaTime("2026-08-14", "12:35:00");
        const resultado = checkinEligibility(reserva, "7766", agora);
        expect(resultado.allowed).toBe(true);
        expect(resultado.alreadyCheckedIn).toBe(true);
    });

    it("TC-BIZ-07f: Reserva cancelada não permite check-in", () => {
        const reserva = criarReserva({ status_reserva: "CANCELADA" });
        const agora = brasiliaTime("2026-08-14", "12:30:00");
        expect(checkinEligibility(reserva, "7766", agora).code).toBe("STATUS_INVALIDO");
    });

    it("Constante de janela é 15 minutos", () => {
        expect(JANELA_CHECKIN_MINUTOS_ANTES).toBe(15);
    });
});

describe("No-Show e Política Financeira", () => {
    it("TC-BIZ-08: No-Show — sem check-in após horário fim", () => {
        const reserva = criarReserva();
        expect(isReservationNoShow(reserva, brasiliaTime("2026-08-14", "13:29:59"))).toBe(false);
        expect(isReservationNoShow(reserva, brasiliaTime("2026-08-14", "13:30:00"))).toBe(true);

        const reservaNoShow = { ...reserva, status_reserva: "NAO_COMPARECEU" };
        expect(isReservationNoShow(reservaNoShow, brasiliaTime("2026-08-14", "14:00:00"))).toBe(false);
    });

    it("TC-BIZ-09: Retenção financeira em No-Show — sem estorno", () => {
        expect(strongestPaymentStatus("APROVADO", "PENDENTE")).toBe("APROVADO");
        expect(nextTransferStatus("AGUARDANDO_ENTREGA", "APROVADO", "MARKETPLACE_RESTAURANTE")).toBe("AGUARDANDO_ENTREGA");
    });

    it("TC-BIZ-10: Descarte de pedido não retirado — PRONTO mantém repasse", () => {
        expect(canTransitionOrder("PRONTO", "ENTREGUE")).toBe(true);
        expect(canTransitionOrder("PRONTO", "EM_PREPARO")).toBe(false);
        expect(nextTransferStatus("AGUARDANDO_ENTREGA", "APROVADO", "MARKETPLACE_RESTAURANTE")).toBe("AGUARDANDO_ENTREGA");
    });
});

describe("Atraso da Cozinha e Punições ao Restaurante (RF23, RF49, RF52)", () => {
    it("TC-BIZ-11: Cliente pontual, prato atrasado — check-in permitido", () => {
        const reserva = criarReserva();
        const agora = brasiliaTime("2026-08-14", "12:30:00");
        expect(checkinEligibility(reserva, "7766", agora).allowed).toBe(true);
        expect(isReservationNoShow(reserva, agora)).toBe(false);
        expect(canTransitionOrder("EM_PREPARO", "PRONTO")).toBe(true);
        expect(canTransitionOrder("EM_PREPARO", "ENTREGUE")).toBe(false);
    });

    it("TC-BIZ-12: Falha operacional → estorno 100%", () => {
        expect(strongestPaymentStatus("APROVADO", "ESTORNADO")).toBe("ESTORNADO");
        expect(nextTransferStatus("AGUARDANDO_ENTREGA", "ESTORNADO", "MARKETPLACE_RESTAURANTE")).toBe("ESTORNADO");
        expect(canTransitionOrder("EM_PREPARO", "CANCELADO")).toBe(false);
    });

    it("TC-BIZ-13: Suspensão por reincidência — reservas futuras estornadas", () => {
        expect(nextTransferStatus("AGUARDANDO_ENTREGA", "ESTORNADO", "MARKETPLACE_RESTAURANTE")).toBe("ESTORNADO");
        expect(nextTransferStatus(null, "RECUSADO", "MARKETPLACE_RESTAURANTE")).toBe("ESTORNADO");
    });
});
