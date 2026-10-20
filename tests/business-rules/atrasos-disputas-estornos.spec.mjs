import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canTransitionOrder } = require("../../backend/src/domain/order-state");
const { strongestPaymentStatus, nextTransferStatus } = require("../../backend/src/domain/payment-state");
const { refundRequestEligibility } = require("../../backend/src/domain/refund-state");

describe("Verificação de Entrega e Disputa (Anti-Fraude)", () => {
    it("TC-BIZ-14: Bloqueio de baixa unilateral — sem saltos no pedido", () => {
        expect(canTransitionOrder("PRONTO", "ENTREGUE")).toBe(true);
        expect(canTransitionOrder("PENDENTE", "ENTREGUE")).toBe(false);
        expect(canTransitionOrder("CONFIRMADO", "ENTREGUE")).toBe(false);
    });

    it("TC-BIZ-15: Fluxo de contestação — retenção cautelar", () => {
        expect(strongestPaymentStatus("APROVADO", "PENDENTE")).toBe("APROVADO");
        expect(strongestPaymentStatus("APROVADO", "ESTORNADO")).toBe("ESTORNADO");
        expect(nextTransferStatus("AGUARDANDO_ENTREGA", "ESTORNADO", "MARKETPLACE_RESTAURANTE")).toBe("ESTORNADO");
        expect(nextTransferStatus("REPASSADO", "APROVADO", "MARKETPLACE_RESTAURANTE")).toBe("REPASSADO");
    });

    it("Reembolso exige pagamento aprovado e sem estorno prévio", () => {
        expect(refundRequestEligibility({ payment: null }).code).toBe("PAGAMENTO_NAO_ENCONTRADO");
        expect(refundRequestEligibility({ payment: { status_pagamento: "PENDENTE" } }).code).toBe("PAGAMENTO_NAO_APROVADO");
        expect(refundRequestEligibility({ payment: { status_pagamento: "APROVADO", status_repasse: "ESTORNADO" } }).code).toBe("PAGAMENTO_JA_ESTORNADO");
        expect(refundRequestEligibility({ payment: { status_pagamento: "APROVADO", status_repasse: "AGUARDANDO_ENTREGA" } }).allowed).toBe(true);
    });

    it("Reembolso ativo ou concluído impede duplicação", () => {
        const payment = { status_pagamento: "APROVADO", status_repasse: "AGUARDANDO_ENTREGA" };
        expect(refundRequestEligibility({ payment, existingRefund: { status_reembolso: "SOLICITADO" } }).code).toBe("REEMBOLSO_EM_ANDAMENTO");
        expect(refundRequestEligibility({ payment, existingRefund: { status_reembolso: "CONCLUIDO" } }).code).toBe("REEMBOLSO_JA_CONCLUIDO");
    });
});
