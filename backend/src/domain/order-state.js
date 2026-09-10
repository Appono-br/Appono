"use strict";
const TRANSITIONS = {
    PENDENTE: new Set(["CONFIRMADO", "CANCELADO"]),
    CONFIRMADO: new Set(["EM_PREPARO", "CANCELADO"]),
    EM_PREPARO: new Set(["PRONTO"]),
    PRONTO: new Set(["ENTREGUE"]),
    ENTREGUE: new Set(),
    CANCELADO: new Set(),
};
function canTransitionOrder(from, to) { return Boolean(TRANSITIONS[from]?.has(to)); }
module.exports = { TRANSITIONS, canTransitionOrder };
