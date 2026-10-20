import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calculateSplit, roundMoney } = require("../../backend/src/domain/payment-state");
const {
    LIMITE_DIARIO_PADRAO,
    LIMITE_SEMANAL_PADRAO,
    verificarLimiteDiario,
    verificarLimiteSemanal,
    filtrarSugestoesDentroDoOrcamento,
    validarLimitesOrcamento,
} = require("../../backend/src/domain/rotina-limites");
const { verificarDisponibilidadePreCobranca } = require("../../backend/src/domain/dupla-checagem");

describe("Appono Rotina — Limites de Orçamento da IA (TC-BIZ-20a)", () => {
    it("TC-BIZ-20a: Limite diário — sugestões dentro do limite passam", () => {
        const sugestoes = [
            { restaurante: "Restaurante A", preco: 22.0 },
            { restaurante: "Restaurante B", preco: 18.0 },
        ];
        const resultado = verificarLimiteDiario(sugestoes, LIMITE_DIARIO_PADRAO);
        expect(resultado.totalDia).toBe(40.0);
        expect(resultado.limiteDiario).toBe(45.0);
        expect(resultado.excedeu).toBe(false);
        expect(resultado.margem).toBe(5.0);
    });

    it("TC-BIZ-20a-2: Limite diário — excedente é bloqueado", () => {
        const sugestoes = [
            { restaurante: "Restaurante A", preco: 22.0 },
            { restaurante: "Restaurante B", preco: 18.0 },
            { restaurante: "Restaurante C", preco: 10.0 },
        ];
        const resultado = verificarLimiteDiario(sugestoes, LIMITE_DIARIO_PADRAO);
        expect(resultado.totalDia).toBe(50.0);
        expect(resultado.excedeu).toBe(true);
    });

    it("TC-BIZ-20a-3: Limite semanal — 5 dias dentro, 6º dia excede", () => {
        const semana5dias = Array.from({ length: 5 }, (_, i) => ({
            restaurante: `Restaurante ${i}`,
            preco: 40.0,
        }));
        const resultado5 = verificarLimiteSemanal(semana5dias, LIMITE_SEMANAL_PADRAO);
        expect(resultado5.totalSemana).toBe(200.0);
        expect(resultado5.excedeu).toBe(false);

        const semana6dias = [...semana5dias, { restaurante: "Extra", preco: 40.0 }];
        const resultado6 = verificarLimiteSemanal(semana6dias, LIMITE_SEMANAL_PADRAO);
        expect(resultado6.excedeu).toBe(true);
    });

    it("TC-BIZ-20a-4: Filtro real — aceita dentro, rejeita fora do saldo", () => {
        const sugestoes = [
            { restaurante: "A", preco: 22.0 },
            { restaurante: "B", preco: 18.0 },
            { restaurante: "C", preco: 10.0 },
        ];
        const { aceitas, rejeitadas, saldoDia } = filtrarSugestoesDentroDoOrcamento(sugestoes, {
            gastosDia: 0,
            gastosSemana: 0,
            limiteDiario: 45.0,
            limiteSemanal: 200.0,
        });
        expect(aceitas).toHaveLength(2);
        expect(rejeitadas).toHaveLength(1);
        expect(rejeitadas[0].motivo_rejeicao).toBe("EXCEDE_LIMITE_DIARIO");
        expect(saldoDia).toBe(5.0);
    });

    it("TC-BIZ-20a-5: Semanal esgotado bloqueia mesmo com diário sobrando", () => {
        const sugestoes = [{ restaurante: "A", preco: 20.0 }];
        const { aceitas, rejeitadas } = filtrarSugestoesDentroDoOrcamento(sugestoes, {
            gastosDia: 0,
            gastosSemana: 195.0,
            limiteDiario: 45.0,
            limiteSemanal: 200.0,
        });
        expect(aceitas).toHaveLength(0);
        expect(rejeitadas).toHaveLength(1);
        expect(rejeitadas[0].motivo_rejeicao).toBe("EXCEDE_LIMITE_SEMANAL");
    });

    it("Validação de perfil de orçamento", () => {
        expect(validarLimitesOrcamento({ orcamento_diario: 45, orcamento_semanal: 200 }).valido).toBe(true);
        expect(validarLimitesOrcamento({ orcamento_diario: -1, orcamento_semanal: 200 }).motivo).toBe("ORCAMENTO_DIARIO_INVALIDO");
        expect(validarLimitesOrcamento({ orcamento_diario: 0, orcamento_semanal: 200 }).motivo).toBe("ORCAMENTO_DIARIO_INVALIDO");
    });

    it("Constantes padrão são os valores esperados", () => {
        expect(LIMITE_DIARIO_PADRAO).toBe(45.0);
        expect(LIMITE_SEMANAL_PADRAO).toBe(200.0);
    });
});

describe("Dupla Checagem BPMN — Verificação Pré-Cobrança (TC-BIZ-20b)", () => {
    const mesaOk = { id_mesa: 1, capacidade: 4, status: "ATIVA", disponivel: true, reservas_conflitantes: [] };
    const reservaOk = {
        status_reserva: "CONFIRMADA",
        data_reserva: "2026-08-14",
        horario_inicio: "19:00:00",
        pessoas: 3,
    };
    const agora = new Date("2026-08-14T15:00:00-03:00");

    it("TC-BIZ-20b: Mesa indisponível bloqueia cobrança com sugestões", () => {
        const mesaIndisponivel = { ...mesaOk, disponivel: false };
        const resultado = verificarDisponibilidadePreCobranca({ mesa: mesaIndisponivel, reserva: reservaOk, agora });
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.motivo).toBe("MESA_INDISPONIVEL");
        expect(resultado.sugestoes.length).toBeGreaterThan(0);
        expect(resultado.sugestoes).toContain("Horário alternativo");
    });

    it("TC-BIZ-20b-2: Mesa OK + reserva OK — cobrança liberada", () => {
        const resultado = verificarDisponibilidadePreCobranca({ mesa: mesaOk, reserva: reservaOk, agora });
        expect(resultado.bloqueado).toBe(false);
        expect(resultado.motivo).toBeNull();
    });

    it("TC-BIZ-20b-3: Conflito de horário bloqueia", () => {
        const mesaConflito = { ...mesaOk, reservas_conflitantes: [{ id_reserva: 99 }] };
        const resultado = verificarDisponibilidadePreCobranca({ mesa: mesaConflito, reserva: reservaOk, agora });
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.motivo).toBe("CONFLITO_HORARIO");
    });

    it("TC-BIZ-20b-4: Capacidade excedida bloqueia", () => {
        const reservaGrande = { ...reservaOk, pessoas: 6 };
        const resultado = verificarDisponibilidadePreCobranca({ mesa: mesaOk, reserva: reservaGrande, agora });
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.motivo).toBe("CAPACIDADE_EXCEDIDA");
        expect(resultado.sugestoes).toContain("Selecionar mesa maior");
    });

    it("TC-BIZ-20b-5: Reserva já iniciada bloqueia nova cobrança", () => {
        const depoisDoInicio = new Date("2026-08-14T19:05:00-03:00");
        const resultado = verificarDisponibilidadePreCobranca({ mesa: mesaOk, reserva: reservaOk, agora: depoisDoInicio });
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.motivo).toBe("RESERVA_JA_INICIADA");
    });

    it("TC-BIZ-20b-6: Mesa não encontrada bloqueia", () => {
        const resultado = verificarDisponibilidadePreCobranca({ mesa: null, reserva: reservaOk, agora });
        expect(resultado.bloqueado).toBe(true);
        expect(resultado.motivo).toBe("MESA_NAO_ENCONTRADA");
    });
});

describe("Cálculos financeiros do split", () => {
    it("Cálculo de split mantém centavos corretos", () => {
        const split = calculateSplit(99.99, 13);
        expect(split.gross).toBe(99.99);
        expect(split.fee).toBe(13.0);
        expect(split.restaurant).toBe(86.99);
        expect(split.fee + split.restaurant).toBe(split.gross);
    });

    it("Arredondamento monetário consistente", () => {
        expect(roundMoney(10.005)).toBe(10.01);
        expect(roundMoney(10.004)).toBe(10.0);
        expect(roundMoney(0)).toBe(0);
        expect(roundMoney(null)).toBe(0);
    });
});
