"use strict";

const crypto = require("node:crypto");

const { pontuarCandidato, penalidadeRepeticao } = require("./routine-scoring");
const { pontuarInteligenciaRotinaV2 } = require("./routine-intelligence-v2");

const VERSION = "appono-intelligence-v2-1";
const CONFIDENCE_THRESHOLD = 0.25;

function finite(value, code) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`V2_1_INVALID: ${code}`);
    return number;
}

function numericId(value) {
    const text = String(value ?? "");
    if (!text) throw new Error("V2_1_INVALID: CANDIDATE_ID");
    return Number.parseInt(crypto.createHash("sha256").update(text).digest("hex").slice(0, 12), 16);
}

function historyCount(history, key, value) {
    return history.filter((item) => String(item[key] ?? "") === String(value ?? "")).length;
}

function toDomainCandidate(candidate) {
    return {
        candidate_id: candidate.candidate_id,
        restaurante: { id_restaurante: numericId(candidate.restaurant.id_restaurante), nome: candidate.restaurant.nome },
        produto: { id_produto: numericId(candidate.product.id_produto), nome: candidate.product.nome, categorias: { nome: candidate.product.categorias.nome } },
        preco_estimado: finite(candidate.preco_estimado, "PRICE"),
        distancia_km: finite(candidate.distancia_km, "DISTANCE"),
        avaliacao: finite(candidate.avaliacao, "RATING"),
        score_operacional: finite(candidate.score_operacional, "OPERATIONAL_SCORE"),
    };
}

function toUtilityCandidate(candidate) {
    return { id_restaurante: candidate.restaurant.id_restaurante, id_produto: candidate.product.id_produto, categoria: candidate.product.categorias.nome, preco: candidate.preco_estimado, distancia: candidate.distancia_km };
}

function scoreBase(persona, candidate, history) {
    const utility = toUtilityCandidate(candidate);
    const base = pontuarCandidato({
        favoritoRestaurante: Number(persona.afinidades.restaurantes[utility.id_restaurante] ?? 0) >= 3,
        dentroOrcamento: Number(utility.preco) <= Number(persona.perfil.orcamento),
        perto: Number(utility.distancia) < 2,
        bemAvaliado: Number(candidate.avaliacao) > 4,
        combinaPreferencia: persona.perfil.preferencias_explicitas.includes(utility.categoria),
        scoreOperacional: candidate.score_operacional,
    });
    const repetition = penalidadeRepeticao({
        restaurantes: historyCount(history, "id_restaurante", utility.id_restaurante),
        produtos: historyCount(history, "id_produto", utility.id_produto),
        categorias: historyCount(history, "categoria", utility.categoria),
    });
    return Number((base.pontuacao - repetition).toFixed(2));
}

function rankV2(candidate, { input, persona, history, signals, previous }) {
    const intelligence = pontuarInteligenciaRotinaV2({
        candidato: toDomainCandidate(candidate),
        sinais: signals,
        tipoJanela: input.meal_window,
        referencia: input.instant_utc,
        sequencia: {
            id_restaurante_anterior: previous ? numericId(previous.restaurant_id ?? previous.id_restaurante) : null,
            id_produto_anterior: previous ? numericId(previous.product_id ?? previous.id_produto) : null,
        },
    });
    const baseScore = scoreBase(persona, candidate, history);
    return {
        candidate,
        base_score: baseScore,
        adjustment: intelligence.ajuste,
        total_score: Number((baseScore + Number(intelligence.ajuste ?? 0)).toFixed(2)),
        confidence: intelligence.confianca,
        effective_samples: intelligence.amostras,
        effective_volume: intelligence.volume_efetivo,
        consistency: intelligence.consistencia,
    };
}

function decideV2_1({ input, persona, history = [], signals = [], previous = null } = {}) {
    if (!input || !Array.isArray(input.eligible_candidates) || input.eligible_candidates.length === 0) throw new Error("V2_1_INVALID: ELIGIBLE_CANDIDATES");
    const scored = input.eligible_candidates.map((candidate) => rankV2(candidate, { input, persona, history, signals, previous }));
    const preferences = new Set(persona?.perfil?.preferencias_explicitas ?? []);
    const preferred = scored.filter((item) => preferences.has(item.candidate.product.categorias.nome));
    const pool = preferred.length > 0 ? preferred : scored;
    pool.sort((left, right) => right.total_score - left.total_score || left.candidate.candidate_id.localeCompare(right.candidate.candidate_id));
    const choice = pool[0];
    if (!input.eligible_candidates.some((item) => item.candidate_id === choice.candidate.candidate_id)) throw new Error("V2_1_INVALID: INELIGIBLE_CHOICE");
    return {
        model_version: VERSION,
        candidate_id: choice.candidate.candidate_id,
        base_score: choice.base_score,
        adjustment: choice.adjustment,
        total_score: choice.total_score,
        confidence: choice.confidence,
        effective_samples: choice.effective_samples,
        effective_volume: choice.effective_volume,
        consistency: choice.consistency,
        preference_precedence_applied: preferred.length > 0,
        confidence_threshold: CONFIDENCE_THRESHOLD,
    };
}

module.exports = { CONFIDENCE_THRESHOLD, VERSION, decideV2_1, toUtilityCandidate };
