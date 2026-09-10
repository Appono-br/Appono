"use strict";

function orderReviewEligibility(order) {
    if (!order) return { allowed: false, code: "PEDIDO_NAO_ENCONTRADO" };
    if (order.status_pedido !== "ENTREGUE") return { allowed: false, code: "PEDIDO_NAO_ENTREGUE" };
    return { allowed: true, code: "ELEGIVEL" };
}

module.exports = { orderReviewEligibility };
