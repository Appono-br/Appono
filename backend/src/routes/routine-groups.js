"use strict";

const crypto = require("node:crypto");
const { Router } = require("express");
const { createUserSupabaseClient } = require("../lib/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { flagAtiva } = require("../domain/routine-insights");

const rotinaGroupsRouter = Router();
rotinaGroupsRouter.use(requireAuth, requireRole("cliente"));

function numeroOpcional(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function validarGrupo(body = {}) {
    const nome = String(body.nome ?? "").trim();
    const inicio = new Date(body.inicio_em);
    const fim = new Date(body.fim_em);
    const latitude = numeroOpcional(body.latitude_aproximada);
    const longitude = numeroOpcional(body.longitude_aproximada);
    const orcamento = numeroOpcional(body.orcamento_por_pessoa);
    const capacidade = Number(body.quantidade_maxima);
    const expira = new Date(body.expira_em);
    if (nome.length < 2 || nome.length > 80 || !Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || fim <= inicio || fim - inicio > 8 * 60 * 60 * 1000) throw new Error("Informe nome e janela válida para o grupo.");
    if ((latitude === null) !== (longitude === null) || (latitude !== null && (Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) throw new Error("Informe coordenadas aproximadas válidas.");
    if (!Number.isInteger(capacidade) || capacidade < 2 || capacidade > 20 || (orcamento !== null && orcamento < 0)) throw new Error("Revise orçamento e quantidade de participantes.");
    if (!Number.isFinite(expira.getTime()) || expira <= new Date() || expira.getTime() > Date.now() + 30 * 86_400_000) throw new Error("Defina um prazo de convite de até 30 dias.");
    return { nome, inicio_em: inicio.toISOString(), fim_em: fim.toISOString(), latitude, longitude, orcamento, capacidade, expira_em: expira.toISOString() };
}

function tokenHash(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function recursoAtivo(res) {
    if (flagAtiva(process.env.APPONO_ROTINA_GROUPS_ENABLED)) return true;
    res.status(503).json({ code: "ROUTINE_GROUPS_DISABLED", error: "O almoço em grupo ainda não foi ativado para este ambiente." });
    return false;
}

rotinaGroupsRouter.get("/", async (_req, res) => {
    if (!recursoAtivo(res)) return;
    try {
        const supabase = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabase.from("grupos_rotina")
            .select("id_grupo_rotina,nome,inicio_em,fim_em,orcamento_por_pessoa,quantidade_maxima,status,id_restaurante_escolhido,participantes_grupo_rotina(id_participante_grupo,papel,status,confirmou_presenca)")
            .order("inicio_em", { ascending: true }).limit(30);
        if (error) throw error;
        return res.json({ grupos: data ?? [] });
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_GROUPS_LIST_FAILED", error: error.message ?? "Não foi possível carregar os grupos." });
    }
});

rotinaGroupsRouter.post("/", async (req, res) => {
    if (!recursoAtivo(res)) return;
    try {
        const grupo = validarGrupo(req.body);
        const token = crypto.randomBytes(32).toString("base64url");
        const supabase = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabase.rpc("criar_grupo_rotina", {
            p_nome: grupo.nome, p_inicio_em: grupo.inicio_em, p_fim_em: grupo.fim_em,
            p_latitude: grupo.latitude, p_longitude: grupo.longitude, p_orcamento: grupo.orcamento,
            p_quantidade_maxima: grupo.capacidade, p_expira_em: grupo.expira_em, p_token_hash: tokenHash(token),
        });
        if (error) return res.status(error.code === "PT401" ? 401 : 422).json({ code: "ROUTINE_GROUPS_CREATE_FAILED", error: error.message });
        return res.status(201).json({ ...data, convite_token: token });
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_GROUPS_INVALID", error: error.message ?? "Não foi possível criar o grupo." });
    }
});

rotinaGroupsRouter.post("/entrar", async (req, res) => {
    if (!recursoAtivo(res)) return;
    const token = String(req.body?.token ?? "").trim();
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return res.status(400).json({ code: "ROUTINE_GROUP_INVITE_INVALID", error: "Convite inválido." });
    try {
        const supabase = createUserSupabaseClient(res.locals.accessToken);
        const { data, error } = await supabase.rpc("entrar_grupo_rotina", { p_token_hash: tokenHash(token) });
        if (error) return res.status(error.code === "PT404" ? 404 : error.code === "PT409" ? 409 : 400).json({ code: "ROUTINE_GROUP_JOIN_FAILED", error: error.message });
        return res.json(data);
    } catch (error) {
        return res.status(400).json({ code: "ROUTINE_GROUP_JOIN_FAILED", error: error.message ?? "Não foi possível entrar no grupo." });
    }
});

module.exports = { rotinaGroupsRouter, tokenHash, validarGrupo };
