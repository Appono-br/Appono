"use strict";

function reservationCheckoutTotals({ reservation, orderTotal = 0 }) {
    const items = Number(orderTotal);
    const price = reservation?.status_reserva === "PENDENTE"
        ? Number(reservation.valor_minimo_total ?? 0)
        : 0;
    if (!Number.isFinite(items) || items < 0 || !Number.isFinite(price) || price < 0) {
        throw new Error("Valor de pagamento inválido.");
    }
    return {
        valor_itens: items,
        preco_reserva: price,
        valor_total_checkout: Math.round((items + price) * 100) / 100,
    };
}

module.exports = { reservationCheckoutTotals };
