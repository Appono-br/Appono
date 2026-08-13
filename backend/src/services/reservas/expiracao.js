"use strict";
const { supabaseAdmin } = require("../../lib/supabase");

async function sincronizarReservasNaoComparecidas() {
    if (!supabaseAdmin) return 0;
    const { data, error } = await supabaseAdmin.rpc("expirar_reservas_nao_comparecidas");
    if (error) throw new Error(`Falha ao atualizar reservas vencidas: ${error.message}`);
    return Number(data ?? 0);
}

module.exports = { sincronizarReservasNaoComparecidas };
