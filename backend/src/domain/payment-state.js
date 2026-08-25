"use strict";
function roundMoney(value) { return Math.round(Number(value ?? 0) * 100) / 100; }
function calculateSplit(total, percentage) {
    const gross = roundMoney(total);
    const fee = roundMoney(gross * (Number(percentage) / 100));
    return { gross, fee, restaurant: roundMoney(gross - fee) };
}
function strongestPaymentStatus(current, incoming) {
    const priority = { PENDENTE: 1, RECUSADO: 2, APROVADO: 3, ESTORNADO: 4 };
    return (priority[current] ?? 0) > (priority[incoming] ?? 0) ? current : incoming;
}
function nextTransferStatus(current, paymentStatus, flowType) {
    if (!["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"].includes(flowType)) return "NAO_APLICAVEL";
    if (paymentStatus === "ESTORNADO") return "ESTORNADO";
    if (["LIBERADO_PARA_REPASSE", "REPASSADO", "ESTORNADO"].includes(current)) return current;
    if (paymentStatus === "APROVADO") return "AGUARDANDO_ENTREGA";
    if (paymentStatus === "RECUSADO") return "ESTORNADO";
    return current ?? "AGUARDANDO_PAGAMENTO";
}
module.exports = { calculateSplit, nextTransferStatus, roundMoney, strongestPaymentStatus };
