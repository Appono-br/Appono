"use strict";

const { Router } = require("express");
const { createUserSupabaseClient } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { flagAtiva, validarPeriodoMetricas } = require("../domain/routine-insights");

const rotinaInsightsRouter = Router();
rotinaInsightsRouter.use(requireAuth, requireRole("restaurant"));

rotinaInsightsRouter.get("/demanda", async (req, res) => {
    if (!flagAtiva(process.env.APPONO_ROTINA_INSIGHTS_ENABLED)) {
        return res.status(503).json({ code: "ROUTINE_INSIGHTS_DISABLED", error: "As métricas de demanda ainda não foram ativadas para este ambiente." });
    }
    try {
        const { inicio, fim } = validarPeriodoMetricas(String(req.query.inicio ?? ""), String(req.query.fim ?? ""));
        const supabase = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabase.rpc("metricas_demanda_rotina_restaurante", { p_inicio: inicio, p_fim: fim });
        if (error) return res.status(error.code === "PT403" ? 403 : 422).json({ code: "ROUTINE_INSIGHTS_UNAVAILABLE", error: error.message });
        return res.json(data ?? { coorte_minima: 5, itens: [] });
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_INSIGHTS_INVALID_PERIOD", error: error instanceof Error ? error.message : "Não foi possível consultar a demanda." });
    }
});

module.exports = { rotinaInsightsRouter };
