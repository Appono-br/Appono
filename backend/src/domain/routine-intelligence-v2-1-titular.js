"use strict";

const crypto = require("node:crypto");
const { MODELO_RECOMENDACAO_ROTINA } = require("./routine-scoring");
const { VERSION, decideV2_1 } = require("./routine-intelligence-v2-1");

const POLICY_VERSION = "routine-intelligence-v2-1-titular-v1";

function booleano(valor, padrao = false) {
    if (valor === undefined || valor === null || valor === "") return padrao;
    return ["1", "true", "yes", "on"].includes(String(valor).trim().toLowerCase());
}

function idNumericoEstavel(valor) {
    const texto = String(valor ?? "");
    if (!texto) return null;
    return Number.parseInt(crypto.createHash("sha256").update(texto).digest("hex").slice(0, 12), 16);
}

function resolverPoliticaV2_1Titular({ consentimentoAtivo = false, env = process.env } = {}) {
    const killSwitch = booleano(env.APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH);
    const habilitada = booleano(env.APPONO_ROTINA_V2_1_TITULAR_ENABLED, true);
    if (killSwitch) {
        return {
            usarV2_1: false,
            modelo: MODELO_RECOMENDACAO_ROTINA.versao,
            segmento: "controle",
            motivo: "KILL_SWITCH",
            personalizacaoConsentida: false,
        };
    }
    if (!habilitada) {
        return {
            usarV2_1: false,
            modelo: MODELO_RECOMENDACAO_ROTINA.versao,
            segmento: "controle",
            motivo: "V2_1_TITULAR_DESATIVADA",
            personalizacaoConsentida: false,
        };
    }
    return {
        usarV2_1: true,
        modelo: VERSION,
        segmento: "demonstracao_publica",
        motivo: "V2_1_TITULAR",
        personalizacaoConsentida: consentimentoAtivo === true,
    };
}

function candidatoParaV2_1(candidato, indice) {
    const produto = candidato.produto ?? {};
    const idRestaurante = candidato.restaurante?.id_restaurante;
    const idProduto = produto.id_produto ?? `sem-produto-${idRestaurante}`;
    return {
        candidate_id: `operacional-${idRestaurante}-${idProduto}-${indice}`,
        restaurant: {
            id_restaurante: String(idRestaurante),
            nome: String(candidato.restaurante?.nome ?? "Restaurante"),
        },
        product: {
            id_produto: String(idProduto),
            nome: String(produto.nome ?? "Opção do restaurante"),
            categorias: { nome: String(produto.categorias?.nome ?? "") },
        },
        preco_estimado: Number(candidato.preco_estimado ?? 0),
        distancia_km: Number(candidato.distancia_km ?? 0),
        avaliacao: Number(candidato.restaurante?.avaliacao_media ?? 0),
        score_operacional: Number(candidato.restaurante?.score_operacional ?? 100),
    };
}

function sinaisParaV2_1(sinais = []) {
    return sinais.map((sinal) => ({
        ...sinal,
        id_restaurante: idNumericoEstavel(sinal.id_restaurante),
        id_produto: idNumericoEstavel(sinal.id_produto),
    }));
}

function selecionarCandidatoV2_1({ candidatos = [], perfil = {}, preferencias = [], historico = [], historicoSemana = [], sinais = [], tipoJanela = null, referencia = new Date(), anterior = null } = {}) {
    if (!candidatos.length) return { candidato: null, falhou: true, motivo: "V2_1_SEM_CANDIDATO" };
    try {
        const categoriasPreferidas = [...new Set(candidatos
            .filter((item) => item.combinaPreferenciaExplicita === true)
            .map((item) => item.produto?.categorias?.nome)
            .filter(Boolean))];
        const preferidos = candidatos.filter((item) => item.combinaPreferenciaExplicita === true);
        let candidatosDiversos = preferidos.length ? preferidos : candidatos;
        const paresUsados = new Set(historicoSemana
            .filter((item) => item.id_restaurante)
            .map((item) => `${String(item.id_restaurante)}:${String(item.id_produto ?? `sem-produto-${item.id_restaurante}`)}`));
        const candidatosIneditos = candidatosDiversos.filter((item) => {
            const idRestaurante = item.restaurante.id_restaurante;
            const idProduto = item.produto?.id_produto ?? `sem-produto-${idRestaurante}`;
            return !paresUsados.has(`${String(idRestaurante)}:${String(idProduto)}`);
        });
        if (!candidatosIneditos.length) {
            return {
                candidato: null,
                falhou: false,
                semDiversidade: true,
                motivo: "V2_1_SEM_DIVERSIDADE",
                modelo: VERSION,
            };
        }
        candidatosDiversos = candidatosIneditos;
        const ocorrenciasRestaurante = new Map();
        const ocorrenciasProduto = new Map();
        for (const item of historicoSemana) {
            if (item.id_restaurante) ocorrenciasRestaurante.set(String(item.id_restaurante), (ocorrenciasRestaurante.get(String(item.id_restaurante)) ?? 0) + 1);
            if (item.id_produto) ocorrenciasProduto.set(String(item.id_produto), (ocorrenciasProduto.get(String(item.id_produto)) ?? 0) + 1);
        }
        const menorUsoRestaurante = Math.min(...candidatosDiversos.map((item) => ocorrenciasRestaurante.get(String(item.restaurante.id_restaurante)) ?? 0));
        candidatosDiversos = candidatosDiversos.filter((item) => (ocorrenciasRestaurante.get(String(item.restaurante.id_restaurante)) ?? 0) === menorUsoRestaurante);
        const menorUsoProduto = Math.min(...candidatosDiversos.map((item) => ocorrenciasProduto.get(String(item.produto?.id_produto ?? "")) ?? 0));
        candidatosDiversos = candidatosDiversos.filter((item) => (ocorrenciasProduto.get(String(item.produto?.id_produto ?? "")) ?? 0) === menorUsoProduto);
        const adaptados = candidatosDiversos.map(candidatoParaV2_1);
        const afinidades = Object.fromEntries(candidatos
            .filter((item) => Number(item.pesos?.favorito_restaurante ?? 0) > 0)
            .map((item) => [String(item.restaurante.id_restaurante), 3]));
        const decisao = decideV2_1({
            input: {
                meal_window: tipoJanela,
                instant_utc: new Date(referencia).toISOString(),
                eligible_candidates: adaptados,
            },
            persona: {
                perfil: {
                    orcamento: Number.isFinite(Number(perfil.orcamento_diario)) ? Number(perfil.orcamento_diario) : Number.MAX_SAFE_INTEGER,
                    preferencias_explicitas: categoriasPreferidas.length ? categoriasPreferidas : preferencias,
                },
                afinidades: { restaurantes: afinidades },
            },
            history: historico,
            signals: sinaisParaV2_1(sinais),
            previous: anterior,
        });
        const indice = adaptados.findIndex((item) => item.candidate_id === decisao.candidate_id);
        if (indice < 0 || !candidatosDiversos[indice]) throw new Error("V2_1_OPERATIONAL_CHOICE_NOT_FOUND");
        return {
            candidato: candidatosDiversos[indice],
            falhou: false,
            motivo: "V2_1_SELECIONADA",
            modelo: VERSION,
            confianca: decisao.confidence,
            amostras: decisao.effective_samples,
            pontuacao: decisao.total_score,
            preferenciaAplicada: decisao.preference_precedence_applied,
        };
    } catch (error) {
        return {
            candidato: null,
            falhou: true,
            motivo: "V2_1_FALHOU",
            erro_codigo: error?.code ?? error?.name ?? "UNKNOWN",
        };
    }
}

function decidirCandidatoV2_1Titular({ controle, resultadoV2_1, politica } = {}) {
    const fallback = {
        candidato: controle ?? null,
        modelo: MODELO_RECOMENDACAO_ROTINA.versao,
        usouV2: false,
        usouV2_1: false,
        motivo: politica?.motivo ?? "CONTROLE_PADRAO",
        segmento: politica?.segmento ?? "controle",
        confianca: 0,
        amostras: 0,
    };
    if (!controle || !politica?.usarV2_1) return fallback;
    if (resultadoV2_1?.semDiversidade) {
        return {
            candidato: null,
            modelo: VERSION,
            usouV2: false,
            usouV2_1: true,
            motivo: resultadoV2_1.motivo,
            segmento: politica.segmento,
            confianca: 0,
            amostras: 0,
        };
    }
    if (!resultadoV2_1?.candidato || resultadoV2_1.falhou) {
        return { ...fallback, motivo: resultadoV2_1?.motivo ?? "V2_1_SEM_CANDIDATO" };
    }
    return {
        candidato: resultadoV2_1.candidato,
        modelo: VERSION,
        usouV2: false,
        usouV2_1: true,
        motivo: resultadoV2_1.motivo,
        segmento: politica.segmento,
        confianca: Number(resultadoV2_1.confianca ?? 0),
        amostras: Number(resultadoV2_1.amostras ?? 0),
        pontuacao: resultadoV2_1.pontuacao,
        preferenciaAplicada: resultadoV2_1.preferenciaAplicada === true,
    };
}

function criarDiagnosticoV2_1({ decisao, requestId = null } = {}) {
    const usouV2_1 = decisao?.usouV2_1 === true;
    return Object.freeze({
        decision_source: usouV2_1 ? "V2_1" : "CONTROLE",
        model_version: String(decisao?.modelo ?? MODELO_RECOMENDACAO_ROTINA.versao),
        policy_version: POLICY_VERSION,
        titular_model: VERSION,
        fallback_used: !usouV2_1,
        technical_code: String(decisao?.motivo ?? "CONTROLE_PADRAO"),
        consented_signals_used: usouV2_1 && Number(decisao?.amostras ?? 0) > 0,
        request_id: requestId === null || requestId === undefined ? null : String(requestId).slice(0, 120),
    });
}

function diagnosticoConfiguracaoV2_1(env = process.env) {
    const habilitada = booleano(env.APPONO_ROTINA_V2_1_TITULAR_ENABLED, true);
    const killSwitch = booleano(env.APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH);
    return {
        modelo_disponivel: VERSION,
        modelo_titular: VERSION,
        habilitada_para_todos: habilitada && !killSwitch,
        habilitada_publicamente: habilitada && !killSwitch,
        rollout_percentual: habilitada && !killSwitch ? 100 : 0,
        kill_switch: killSwitch,
        modo_padrao: "DEMONSTRACAO_PUBLICA",
        fallback: MODELO_RECOMENDACAO_ROTINA.versao,
    };
}

module.exports = {
    POLICY_VERSION,
    criarDiagnosticoV2_1,
    decidirCandidatoV2_1Titular,
    diagnosticoConfiguracaoV2_1,
    resolverPoliticaV2_1Titular,
    selecionarCandidatoV2_1,
};
