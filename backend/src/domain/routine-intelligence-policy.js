"use strict";

const crypto = require("node:crypto");
const { MODELO_RECOMENDACAO_ROTINA } = require("./routine-scoring");
const { MODELO_INTELIGENCIA_ROTINA_V2 } = require("./routine-intelligence-v2");

const MODO_INTELIGENCIA_ROTINA = Object.freeze({
    CONTROLE: "CONTROLE",
    INTERNO: "INTERNO",
    ROLLOUT: "ROLLOUT",
});

function booleano(valor) {
    return ["1", "true", "yes", "on"].includes(String(valor ?? "").trim().toLowerCase());
}

function percentual(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 0;
    return Math.max(0, Math.min(100, numero));
}

function lista(valor) {
    return new Set(String(valor ?? "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean));
}

function bucketEstavel(identidade, sal) {
    if (!identidade) return 100;
    const hash = crypto.createHash("sha256").update(`${sal}:${identidade}`).digest();
    return hash.readUInt32BE(0) % 100;
}

function resolverPoliticaInteligenciaRotina({ usuario = {}, idCliente = null, consentimentoAtivo = false, env = process.env } = {}) {
    const base = {
        modo: MODO_INTELIGENCIA_ROTINA.CONTROLE,
        modelo: MODELO_RECOMENDACAO_ROTINA.versao,
        usarV2: false,
        segmento: "controle",
        motivo: "FEATURE_DESATIVADA",
        confiancaMinima: Math.max(0, Math.min(0.9, Number(env.APPONO_ROTINA_INTELLIGENCE_MIN_CONFIDENCE ?? 0.25) || 0.25)),
    };
    if (booleano(env.APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH)) {
        return { ...base, motivo: "KILL_SWITCH" };
    }
    if (!consentimentoAtivo) {
        return { ...base, motivo: "SEM_CONSENTIMENTO" };
    }

    const allowlist = lista(env.APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST);
    const identidades = [usuario.id, usuario.email, idCliente]
        .map((item) => String(item ?? "").trim().toLowerCase())
        .filter(Boolean);
    if (identidades.some((item) => allowlist.has(item))) {
        return {
            ...base,
            modo: MODO_INTELIGENCIA_ROTINA.INTERNO,
            modelo: MODELO_INTELIGENCIA_ROTINA_V2.versao,
            usarV2: true,
            segmento: "interno",
            motivo: "ALLOWLIST_INTERNA",
        };
    }

    if (!booleano(env.APPONO_ROTINA_INTELLIGENCE_ENABLED)) return base;
    const rollout = percentual(env.APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT);
    const identidade = usuario.id ?? idCliente;
    if (rollout > 0 && bucketEstavel(identidade, env.APPONO_ROTINA_INTELLIGENCE_ROLLOUT_SALT ?? "appono-rotina-v2") < rollout) {
        return {
            ...base,
            modo: MODO_INTELIGENCIA_ROTINA.ROLLOUT,
            modelo: MODELO_INTELIGENCIA_ROTINA_V2.versao,
            usarV2: true,
            segmento: "rollout",
            motivo: "BUCKET_ROLLOUT",
        };
    }
    return { ...base, motivo: rollout > 0 ? "FORA_DO_BUCKET" : "ROLLOUT_ZERO" };
}

function decidirCandidatoInteligencia({ controle, v2, politica } = {}) {
    const padrao = {
        candidato: controle ?? null,
        modelo: MODELO_RECOMENDACAO_ROTINA.versao,
        usouV2: false,
        motivo: politica?.motivo ?? "CONTROLE_PADRAO",
        segmento: politica?.segmento ?? "controle",
        confianca: 0,
        amostras: 0,
    };
    if (!controle || !politica?.usarV2) return padrao;
    if (!v2) return { ...padrao, motivo: "V2_SEM_CANDIDATO" };
    const inteligencia = v2.inteligenciaV2 ?? {};
    if (inteligencia.falhou) return { ...padrao, motivo: "V2_FALHOU" };
    const amostras = Number(inteligencia.amostras ?? 0);
    const confianca = Number(inteligencia.confianca ?? 0);
    if (!Number.isFinite(amostras) || amostras <= 0) return { ...padrao, motivo: "V2_SEM_HISTORICO" };
    if (!Number.isFinite(confianca) || confianca < Number(politica.confiancaMinima ?? 0.25)) {
        return { ...padrao, motivo: "V2_CONFIANCA_INSUFICIENTE", confianca: Number.isFinite(confianca) ? confianca : 0, amostras };
    }
    return {
        candidato: v2,
        modelo: MODELO_INTELIGENCIA_ROTINA_V2.versao,
        usouV2: true,
        motivo: "V2_SELECIONADA",
        segmento: politica.segmento,
        confianca,
        amostras,
    };
}

function diagnosticoConfiguracaoInteligencia(env = process.env) {
    return {
        modelo_disponivel: MODELO_INTELIGENCIA_ROTINA_V2.versao,
        habilitada_publicamente: booleano(env.APPONO_ROTINA_INTELLIGENCE_ENABLED),
        rollout_percentual: percentual(env.APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT),
        kill_switch: booleano(env.APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH),
        confianca_minima: Math.max(0, Math.min(0.9, Number(env.APPONO_ROTINA_INTELLIGENCE_MIN_CONFIDENCE ?? 0.25) || 0.25)),
        contas_internas_configuradas: lista(env.APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST).size,
        modo_padrao: MODO_INTELIGENCIA_ROTINA.CONTROLE,
    };
}

module.exports = {
    MODO_INTELIGENCIA_ROTINA,
    bucketEstavel,
    decidirCandidatoInteligencia,
    diagnosticoConfiguracaoInteligencia,
    resolverPoliticaInteligenciaRotina,
};
