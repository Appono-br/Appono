"use strict";

const crypto = require("node:crypto");
const { gerarPlanejamentoRotina } = require("../src/domain/routine-recommendation");
const { resolverPoliticaInteligenciaRotina } = require("../src/domain/routine-intelligence-policy");
const { candidataCongeladaDisponivel, validarDiagnosticoOperacional } = require("../src/domain/routine-intelligence-operational");

const agora = new Date("2026-09-23T12:00:00-03:00");
const semanaInicio = "2026-09-28";
const identidadeInterna = "demo-banca-interno";

function produto(idProduto, idRestaurante, nome, categoria, preco) {
    return {
        id_produto: idProduto,
        id_restaurante: idRestaurante,
        nome,
        descricao: "Fixture sintetica da demonstracao interna.",
        preco,
        disponivel: true,
        arquivado: false,
        categorias: { nome: categoria, ativo: true, arquivado: false, cardapios: { nome: "Almoco", ativo: true } },
    };
}

function restaurante(idRestaurante, nome, item) {
    return {
        id_restaurante: idRestaurante,
        nome,
        endereco: "Fixture interna",
        latitude: -23.5617,
        longitude: -46.6559,
        logo_url: null,
        valor_minimo_reserva_por_pessoa: 15,
        avaliacao_media: 4.6,
        favorito_cliente: false,
        score_operacional: 100,
        configuracao_operacao: {
            days: ["monday", "tuesday"].map((id) => ({ id, enabled: true, shifts: [{ open: "11:00", close: "16:00" }] })),
        },
        produtos: [item],
    };
}

const restaurantes = [
    restaurante(1, "Fixture Controle", produto(10, 1, "Opcao controle", "Massas", 32)),
    restaurante(2, "Fixture Personalizada", produto(20, 2, "Opcao personalizada", "Saudavel", 30)),
];

const perfil = {
    dias_semana: ["monday"],
    horario_inicio: "12:15:00",
    horario_fim: "14:00:00",
    tempo_maximo_minutos: 60,
    orcamento_diario: 40,
    orcamento_semanal: 100,
    raio_km: 10,
    latitude: -23.5617,
    longitude: -46.6559,
};

function feedbacks(quantidade) {
    return Array.from({ length: quantidade }, (_, indice) => ({
        id_sinal: `demo-sinal-${indice + 1}`,
        tipo_evento: "FEEDBACK_POSITIVO",
        consentiu_personalizacao: true,
        criado_em: "2026-09-20T12:00:00Z",
        id_restaurante: 2,
        id_produto: 20,
        categoria: "Saudavel",
        tipo_janela: "ALMOCO",
    }));
}

function executarCaso(id, env, consentimentoAtivo, sinais) {
    const politica = resolverPoliticaInteligenciaRotina({
        usuario: { id: identidadeInterna },
        consentimentoAtivo,
        env,
    });
    const planejamento = gerarPlanejamentoRotina({
        perfil,
        restaurantes,
        feedbacks: sinais,
        semanaInicio,
        agora,
        politicaInteligencia: candidataCongeladaDisponivel() ? politica : { ...politica, usarV2: false, motivo: "CANDIDATA_NAO_CONGELADA" },
        requestId: `demo:10:${id}`,
    });
    const refeicao = planejamento.refeicoes[0];
    const diagnostico = refeicao.metadados?.diagnostico_inteligencia ?? null;
    if (!diagnostico) throw new Error(`DEMO_DIAGNOSTIC_MISSING:${id}`);
    validarDiagnosticoOperacional(diagnostico);
    return {
        id,
        decision_source: diagnostico.decision_source,
        model_version: diagnostico.model_version,
        fallback_used: diagnostico.fallback_used,
        technical_code: diagnostico.technical_code,
        confidence_bucket: diagnostico.confidence_bucket,
        effective_samples_bucket: diagnostico.effective_samples_bucket,
        meals: planejamento.refeicoes.length,
        suggested_meals: planejamento.refeicoes.filter((item) => item.id_restaurante).length,
    };
}

function fingerprint(cases) {
    return crypto.createHash("sha256").update(JSON.stringify(cases)).digest("hex");
}

function main() {
    if (!candidataCongeladaDisponivel()) throw new Error("DEMO_CANDIDATE_NOT_FROZEN");
    const cases = [
        executarCaso("allowlisted_v2", { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: identidadeInterna }, true, feedbacks(8)),
        executarCaso("outside_allowlist_control", { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: "other-internal" }, true, feedbacks(8)),
        executarCaso("kill_switch_control", { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: identidadeInterna, APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH: "true" }, true, feedbacks(8)),
        executarCaso("low_confidence_fallback", { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: identidadeInterna }, true, feedbacks(1)),
    ];
    const repeated = executarCaso("allowlisted_v2", { APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST: identidadeInterna }, true, feedbacks(8));
    const deterministic = JSON.stringify(cases[0]) === JSON.stringify(repeated);
    if (!deterministic) throw new Error("DEMO_NON_DETERMINISTIC");
    const report = {
        schema_version: 1,
        demo_version: "routine-internal-demonstration-v1",
        candidate: "appono-intelligence-v2",
        candidate_state: "FROZEN",
        synthetic_fixture_only: true,
        public_rollout_percent: 0,
        reserve_accessed: false,
        human_responses_used: 0,
        formulas_changed: false,
        cases,
        deterministic_replay: true,
    };
    console.log(JSON.stringify({ ...report, report_sha256: fingerprint(report) }));
}

main();
