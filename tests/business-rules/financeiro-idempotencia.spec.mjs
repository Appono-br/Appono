import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calculateSplit, strongestPaymentStatus, nextTransferStatus, roundMoney } = require("../../backend/src/domain/payment-state");
const { refundRequestEligibility, refundReviewEligibility, normalizeRefundReason } = require("../../backend/src/domain/refund-state");
const { paymentEligibility } = require("../../backend/src/domain/payment-eligibility");
const { calculateAttendanceRefundPolicy, apponoCommissionPercentage } = require("../../backend/src/domain/reservation-time");

describe("Financeiro — Idempotência, Split e Reembolso", () => {
    describe("Split e comissão", () => {
        it("Calcula split sem perder centavos", () => {
            const split = calculateSplit(99.99, 13);
            expect(split.gross).toBe(99.99);
            expect(split.fee).toBe(13.0);
            expect(split.restaurant).toBe(86.99);
        });

        it("Split com valor zero", () => {
            const split = calculateSplit(0, 13);
            expect(split.gross).toBe(0);
            expect(split.fee).toBe(0);
            expect(split.restaurant).toBe(0);
        });

        it("Comissão padrão é válida (0-100%)", () => {
            const c = apponoCommissionPercentage();
            expect(c).toBeGreaterThanOrEqual(0);
            expect(c).toBeLessThanOrEqual(100);
        });
    });

    describe("Máquina de estados de pagamento", () => {
        it("Evento atrasado não regride pagamento aprovado", () => {
            expect(strongestPaymentStatus("APROVADO", "PENDENTE")).toBe("APROVADO");
            expect(strongestPaymentStatus("APROVADO", "RECUSADO")).toBe("APROVADO");
        });

        it("Estorno prevalece sobre aprovação", () => {
            expect(strongestPaymentStatus("APROVADO", "ESTORNADO")).toBe("ESTORNADO");
        });

        it("Fluxo direto não cria repasse", () => {
            expect(nextTransferStatus(null, "APROVADO", "DIRETO_APPONO")).toBe("NAO_APLICAVEL");
        });

        it("Marketplace cria repasse ao restaurante", () => {
            expect(nextTransferStatus(null, "APROVADO", "MARKETPLACE_RESTAURANTE")).toBe("AGUARDANDO_ENTREGA");
        });

        it("Estorno reverte repasse", () => {
            expect(nextTransferStatus("AGUARDANDO_ENTREGA", "ESTORNADO", "MARKETPLACE_RESTAURANTE")).toBe("ESTORNADO");
        });
    });

    describe("Elegibilidade de pagamento", () => {
        it("Reserva ausente bloqueia pagamento", () => {
            expect(paymentEligibility(null).code).toBe("RESERVA_AUSENTE");
        });

        it("Reserva válida permite pagamento", () => {
            const reserva = { status_reserva: "PENDENTE", data_reserva: "2026-08-14", horario_inicio: "20:00:00" };
            expect(paymentEligibility(reserva, new Date("2026-08-14T15:00:00-03:00")).allowed).toBe(true);
        });

        it("Reserva vencida bloqueia pagamento", () => {
            const reserva = { status_reserva: "PENDENTE", data_reserva: "2026-08-14", horario_inicio: "12:00:00" };
            expect(paymentEligibility(reserva, new Date("2026-08-14T16:00:00-03:00")).code).toBe("RESERVA_VENCIDA");
        });
    });

    describe("Reembolso", () => {
        it("Motivo normalizado e limitado a 500 chars", () => {
            expect(normalizeRefundReason("  pedido   incorreto  ")).toBe("pedido incorreto");
            expect(normalizeRefundReason("x".repeat(700)).length).toBe(500);
        });

        it("Somente solicitação aberta pode ser analisada", () => {
            expect(refundReviewEligibility({ status_reembolso: "SOLICITADO" }).allowed).toBe(true);
            expect(refundReviewEligibility({ status_reembolso: "RECUSADO" }).allowed).toBe(false);
        });

        it("Política de reembolso calcula retenção corretamente", () => {
            const p = calculateAttendanceRefundPolicy({ paidAmount: 100, minimumTotal: 20, commissionPercentage: 13 });
            expect(p.paid).toBe(100);
            expect(p.commission).toBe(13);
            expect(p.retained).toBeLessThanOrEqual(100);
            expect(p.refund).toBeGreaterThanOrEqual(0);
            expect(roundMoney(p.retained + p.refund)).toBe(100);
        });
    });
});
