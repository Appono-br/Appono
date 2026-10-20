import { describe, it, expect, vi } from "vitest";
import { setSystemTime, brasiliaTime } from "../mocks/clock.helper.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
    obterTempoPreparoTotalMinutos,
    obterMargemOperacionalMinutos,
    obterMinutosAteReserva,
    pedidoPodeIniciarPreparo,
    pedidoEstaNaFilaOperacional,
} = require("../../backend/src/domain/operational-queue");

function criarPedido({ itens, statusPedido = "CONFIRMADO", reserva = {} }) {
    return {
        status_pedido: statusPedido,
        itens_pedido: itens.map((item) => ({
            id_produto: item.id,
            quantidade: item.quantidade ?? 1,
            produtos: { id_produto: item.id, nome: item.nome ?? `Prato ${item.id}`, tempo_preparo_minutos: item.tempo },
        })),
        reservas: {
            status_reserva: "CONFIRMADA",
            status_confirmacao_presenca: "CONFIRMADA",
            data_reserva: "2026-08-14",
            horario_inicio: "13:00:00",
            ...reserva,
        },
    };
}

describe("RF31 — Logística de Antecipação e Deadlines de Preparo", () => {
    it("TC-BIZ-01: Pedido válido — prato com 25min enviado 45min antes", () => {
        const agora = brasiliaTime("2026-08-14", "12:15:00");
        setSystemTime(agora);

        const pedido = criarPedido({ itens: [{ id: 1, tempo: 25 }] });
        const minutosAteReserva = obterMinutosAteReserva(pedido.reservas, agora);
        expect(minutosAteReserva).toBe(45);

        const margem = obterMargemOperacionalMinutos(pedido);
        expect(margem).toBeGreaterThan(0);
        // 45min restantes > margem (~30min) → pedido aceito pelo deadline
        expect(minutosAteReserva).toBeGreaterThanOrEqual(margem);

        // A fila operacional só exibe o pedido quando está dentro da janela de exibição
        // (min(90, margem)). Com margem=30, pedido a 45min ainda não aparece na fila.
        // Isso é correto: a fila mostra pedidos próximos ao horário de início de preparo.
        expect(pedidoEstaNaFilaOperacional(pedido, agora)).toBe(false);

        // Avançando para 30min antes, o pedido entra na fila
        const agoraPerto = brasiliaTime("2026-08-14", "12:30:00");
        expect(pedidoEstaNaFilaOperacional(pedido, agoraPerto)).toBe(true);
    });

    it("TC-BIZ-02: Violação de deadline — prato com 40min enviado apenas 25min antes", () => {
        const agora = brasiliaTime("2026-08-14", "12:35:00");
        setSystemTime(agora);

        const pedido = criarPedido({ itens: [{ id: 1, tempo: 40 }] });
        const minutosAteReserva = obterMinutosAteReserva(pedido.reservas, agora);
        expect(minutosAteReserva).toBe(25);

        const margem = obterMargemOperacionalMinutos(pedido);
        expect(margem).toBeGreaterThanOrEqual(45);
        expect(minutosAteReserva).toBeLessThan(margem);
    });

    it("TC-BIZ-03: Múltiplos itens — max(15, 35) como linha de corte", () => {
        const agora = brasiliaTime("2026-08-14", "12:00:00");
        setSystemTime(agora);

        const pedidoA = criarPedido({ itens: [{ id: 1, tempo: 15 }] });
        const pedidoB = criarPedido({ itens: [{ id: 2, tempo: 35 }] });
        const pedidoCombinado = criarPedido({
            itens: [{ id: 1, tempo: 15 }, { id: 2, tempo: 35 }],
        });

        const tempoA = obterTempoPreparoTotalMinutos(pedidoA);
        const tempoB = obterTempoPreparoTotalMinutos(pedidoB);
        const tempoCombinado = obterTempoPreparoTotalMinutos(pedidoCombinado);

        expect(tempoCombinado).toBeGreaterThanOrEqual(Math.max(tempoA, tempoB));
        const margemCombinada = obterMargemOperacionalMinutos(pedidoCombinado);
        const margemB = obterMargemOperacionalMinutos(pedidoB);
        expect(margemCombinada).toBeGreaterThanOrEqual(margemB);
    });
});
