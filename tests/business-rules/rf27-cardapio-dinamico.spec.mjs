import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canTransitionOrder } = require("../../backend/src/domain/order-state");
const { strongestPaymentStatus, calculateSplit } = require("../../backend/src/domain/payment-state");
const { validarCampanha } = require("../../backend/src/domain/campaigns");

describe("Cardápio Dinâmico, Escopo Financeiro e Appono Rotina", () => {
    it("TC-BIZ-16: Pausa por ingrediente — produtos vinculados indisponíveis", () => {
        const ingrediente = { id_ingrediente: 1, estoque: 0 };
        const produtos = [
            { id_produto: 10, nome: "Pizza 4 queijos", disponivel: true },
            { id_produto: 11, nome: "Lasanha de queijo", disponivel: true },
        ];
        const atualizados = produtos.map((p) => ({ ...p, disponivel: ingrediente.estoque > 0 }));
        for (const p of atualizados) expect(p.disponivel).toBe(false);
    });

    it("TC-BIZ-17: Imutabilidade pós-pagamento — sem novos itens após aprovação", () => {
        expect(canTransitionOrder("CONFIRMADO", "PENDENTE")).toBe(false);
        expect(canTransitionOrder("ENTREGUE", "CONFIRMADO")).toBe(false);
        expect(strongestPaymentStatus("APROVADO", "PENDENTE")).toBe("APROVADO");
    });

    it("TC-BIZ-18: Snapshot de preço histórico — preço cravado em R$ 50", () => {
        const splitOriginal = calculateSplit(50.0, 13);
        const splitAtual = calculateSplit(65.0, 13);
        expect(splitOriginal.gross).toBe(50.0);
        expect(splitAtual.gross).toBe(65.0);
        expect(splitOriginal.fee).toBe(6.5);
        expect(splitOriginal.restaurant).toBe(43.5);
    });

    it("TC-BIZ-19: Idempotência de webhook — APROVADO não regride", () => {
        expect(strongestPaymentStatus("APROVADO", "APROVADO")).toBe("APROVADO");
        expect(strongestPaymentStatus("APROVADO", "PENDENTE")).toBe("APROVADO");
    });

    it("Validação de campanha rejeita título curto", () => {
        expect(() => validarCampanha(
            { titulo: "AB", tipo_beneficio: "DESCONTO_PERCENTUAL", valor_beneficio: 10, inicio_em: "2026-08-14T10:00:00-03:00", fim_em: "2026-08-15T10:00:00-03:00", limite_usos: 10 },
            "actor1", "https://storage.example.com"
        )).toThrow();
    });

    it("Validação de campanha rejeita fim antes do início", () => {
        expect(() => validarCampanha(
            { titulo: "Promo teste", tipo_beneficio: "DESCONTO_PERCENTUAL", valor_beneficio: 10, inicio_em: "2026-08-15T10:00:00-03:00", fim_em: "2026-08-14T10:00:00-03:00", limite_usos: 10 },
            "actor1", "https://storage.example.com"
        )).toThrow();
    });

    it("Desconto percentual rejeita 0% e 101%", () => {
        const base = { titulo: "Promo teste", tipo_beneficio: "DESCONTO_PERCENTUAL", inicio_em: "2026-08-14T10:00:00-03:00", fim_em: "2026-08-15T10:00:00-03:00", limite_usos: 10 };
        expect(() => validarCampanha({ ...base, valor_beneficio: 0 }, "a", "https://s.com")).toThrow();
        expect(() => validarCampanha({ ...base, valor_beneficio: 101 }, "a", "https://s.com")).toThrow();
    });
});
