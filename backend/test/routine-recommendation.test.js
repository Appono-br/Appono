"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calcularDistanciaKm,
    gerarPlanejamentoRotina,
    produtoIncompativel,
    horarioCompativel,
    janelasLivresDia,
    validarLimitesRotina,
    semanaPlanejamento,
} = require("../src/domain/routine-recommendation");

function restaurante(overrides = {}) {
    return {
        id_restaurante: overrides.id_restaurante ?? 1,
        nome: overrides.nome ?? "Outback",
        endereco: "Rua Maurício de Oliveira, 170",
        latitude: overrides.latitude ?? -23.5617,
        longitude: overrides.longitude ?? -46.6559,
        logo_url: null,
        valor_minimo_reserva_por_pessoa: overrides.valor_minimo_reserva_por_pessoa ?? 15,
        avaliacao_media: overrides.avaliacao_media ?? 4.6,
        favorito_cliente: overrides.favorito_cliente ?? false,
        score_operacional: overrides.score_operacional ?? 100,
        configuracao_operacao: overrides.configuracao_operacao ?? { days: ["monday", "tuesday"].map((id) => ({ id, enabled: true, shifts: [{ open: "11:00", close: "16:00" }] })) },
        produtos: overrides.produtos ?? [
            {
                id_produto: 10,
                id_restaurante: overrides.id_restaurante ?? 1,
                nome: "Lasanha da casa",
                descricao: "Massa ao molho de tomate",
                preco: 32,
                disponivel: true,
                arquivado: false,
                categorias: { nome: "Massas", ativo: true, arquivado: false, cardapios: { nome: "Almoço", ativo: true } },
            },
        ],
    };
}

const perfilBase = {
    dias_semana: ["monday", "tuesday"],
    horario_inicio: "12:15:00",
    horario_fim: "14:00:00",
    tempo_maximo_minutos: 60,
    orcamento_diario: 40,
    raio_km: 10,
    latitude: -23.5617,
    longitude: -46.6559,
};

test("calcula distancia em quilometros entre coordenadas", () => {
    assert.equal(calcularDistanciaKm(-23.5617, -46.6559, -23.5617, -46.6559), 0);
    assert.ok(calcularDistanciaKm(-23.5617, -46.6559, -23.5700, -46.6600) > 0);
});

test("agenda ocupada recorta a janela de almoço sem importar conteúdo pessoal", () => {
    assert.deepEqual(janelasLivresDia(perfilBase, "2026-09-14", [
        { inicio_em: "2026-09-14T15:30:00.000Z", fim_em: "2026-09-14T16:15:00.000Z" },
        { inicio_em: "2026-09-14T16:00:00.000Z", fim_em: "2026-09-14T16:30:00.000Z" },
    ]), [
        { horario_inicio: "12:15:00", horario_fim: "12:30:00" },
        { horario_inicio: "13:30:00", horario_fim: "14:00:00" },
    ]);
});

test("dia totalmente ocupado recebe diagnóstico sem sugestão", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: perfilBase,
        restaurantes: [restaurante()],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
        janelasOcupadas: [{ inicio_em: "2026-09-14T15:00:00.000Z", fim_em: "2026-09-14T17:00:00.000Z" }],
    });
    assert.equal(planejamento.refeicoes[0].id_restaurante, undefined);
    assert.match(planejamento.refeicoes[0].motivo_recomendacao, /agenda/);
    assert.equal(planejamento.resumo.agenda_aplicada, true);
});

test("alergia exige ficha revisada e bloqueia presente, pode conter e contaminação", () => {
    const base = restaurante({ produtos: [{
        id_produto: 10, id_restaurante: 1, nome: "Prato revisado", preco: 30, disponivel: true, arquivado: false,
        categorias: { nome: "Principais", ativo: true, arquivado: false, cardapios: { ativo: true } },
        seguranca_alimentar_produto: { status: "REVISADA" },
        alergenos_produto: [{ tipo: "PRESENTE", alergenos_catalogo: { codigo: "SOJA", nome: "Soja" } }],
    }] });
    const seguro = gerarPlanejamentoRotina({ perfil: { ...perfilBase, dias_semana: ["monday"] }, restaurantes: [base], alergias: ["amendoim"], semanaInicio: "2026-09-14", agora: new Date("2026-09-12T12:00:00-03:00") });
    assert.equal(seguro.refeicoes[0].id_produto, 10);
    const bloqueado = gerarPlanejamentoRotina({ perfil: { ...perfilBase, dias_semana: ["monday"] }, restaurantes: [base], alergias: ["soja"], semanaInicio: "2026-09-14", agora: new Date("2026-09-12T12:00:00-03:00") });
    assert.equal(bloqueado.refeicoes[0].id_produto, null);
});

test("exclui produto incompativel com restricao ou alergia", () => {
    const produto = restaurante().produtos[0];
    assert.equal(produtoIncompativel(produto, restaurante(), ["tomate"]), true);
    assert.equal(produtoIncompativel(produto, restaurante(), ["camarão"]), false);
});

test("prioriza favorito, orcamento, distancia e avaliacao", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: perfilBase,
        restaurantes: [
            restaurante({ id_restaurante: 1, nome: "Distante", latitude: -23.7, longitude: -46.8, avaliacao_media: 3.8 }),
            restaurante({ id_restaurante: 2, nome: "Favorito", favorito_cliente: true, avaliacao_media: 4.8 }),
        ],
        preferencias: ["lasanha"],
        restricoes: [],
        favoritosRestaurantes: [2],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
    });

    assert.equal(planejamento.refeicoes.length, 2);
    assert.equal(planejamento.refeicoes[0].id_restaurante, 2);
    assert.equal(planejamento.refeicoes[0].id_produto, 10);
    assert.match(planejamento.refeicoes[0].motivo_recomendacao, /restaurante favorito/);
});

test("modelo versionado penaliza repetição recente sem banir o restaurante", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: { ...perfilBase, dias_semana: ["monday"] },
        restaurantes: [restaurante({ id_restaurante: 1, nome: "Repetido" }), restaurante({ id_restaurante: 2, nome: "Alternativa" })],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
        historicoRecente: Array.from({ length: 5 }, () => ({ id_restaurante: 1, id_produto: 10 })),
    });
    assert.equal(planejamento.resumo.modelo, "deterministico-v3");
    assert.equal(planejamento.refeicoes[0].id_restaurante, 2);
    assert.equal(planejamento.refeicoes[0].metadados.modelo_recomendacao, "deterministico-v3");
});

test("feedback consentido ajusta o ranking sem superar limites eliminatorios", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: { ...perfilBase, dias_semana: ["monday"] },
        restaurantes: [restaurante({ id_restaurante: 1, nome: "Com retorno" }), restaurante({ id_restaurante: 2, nome: "Sem retorno" })],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
        feedbacks: [{ consentiu_personalizacao: true, gostou: true, id_restaurante: 1, id_produto: 10 }],
    });
    assert.equal(planejamento.refeicoes[0].id_restaurante, 1);
    assert.match(planejamento.refeicoes[0].motivo_recomendacao, /retornos anteriores/);
    const semConsentimento = gerarPlanejamentoRotina({
        perfil: { ...perfilBase, dias_semana: ["monday"], raio_km: 1 },
        restaurantes: [restaurante({ id_restaurante: 1, latitude: -24, longitude: -47 })],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
        feedbacks: [{ consentiu_personalizacao: true, gostou: true, id_restaurante: 1, id_produto: 10 }],
    });
    assert.equal(semConsentimento.refeicoes[0].id_restaurante, undefined);
});

test("registra alternativas comparáveis sem inventar distância", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: { ...perfilBase, dias_semana: ["monday"] },
        restaurantes: [restaurante({ id_restaurante: 1, nome: "A" }), restaurante({ id_restaurante: 2, nome: "B" })],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
    });
    const alternativa = planejamento.refeicoes[0].metadados.alternativas[0];
    assert.equal(typeof alternativa.diferenca_preco, "number");
    assert.equal(typeof alternativa.diferenca_aderencia, "number");
    assert.equal(typeof alternativa.diferenca_distancia_km, "number");
});

test("nao sugere restaurante fora do raio quando ha coordenada", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: { ...perfilBase, raio_km: 1 },
        restaurantes: [
            restaurante({ id_restaurante: 1, nome: "Perto" }),
            restaurante({ id_restaurante: 2, nome: "Longe", latitude: -24.1, longitude: -47.0 }),
        ],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
    });

    assert.equal(planejamento.refeicoes[0].id_restaurante, 1);
});

function planejar(perfil = {}, restaurantes = [restaurante()], outros = {}) {
    return gerarPlanejamentoRotina({ perfil: { ...perfilBase, ...perfil }, restaurantes,
        semanaInicio: "2026-09-14", agora: new Date("2026-09-12T12:00:00-03:00"), ...outros });
}

test("orcamento diario e limite eliminatorio mesmo para favorito", () => {
    assert.ok(planejar({ orcamento_diario: 20 }, [restaurante({ favorito_cliente: true })]).refeicoes.every((item) => !item.id_restaurante));
});

test("soma da semana respeita limite e contabiliza refeicoes ja convertidas", () => {
    const semana = planejar({ orcamento_semanal: 40 });
    assert.equal(semana.refeicoes.filter((item) => item.id_restaurante).length, 1);
    const regenerada = planejar({ orcamento_semanal: 40 }, undefined, { refeicoesExistentes: [{ data_refeicao: "2026-09-14", preco_estimado: 32 }] });
    assert.equal(regenerada.refeicoes.length, 1);
    assert.ok(!regenerada.refeicoes[0].id_restaurante);
});

test("gera uma sugestao por janela alimentar e preserva conversao da janela correspondente", () => {
    const janelasAlimentacao = [
        { id_janela_alimentacao: 10, tipo: "CAFE", nome: "Café", dias_semana: ["monday"], horario_inicio: "07:00", horario_fim: "10:00", tempo_maximo_minutos: 60, raio_km: 10 },
        { id_janela_alimentacao: 11, tipo: "ALMOCO", nome: "Almoço", dias_semana: ["monday"], horario_inicio: "12:15", horario_fim: "14:00", tempo_maximo_minutos: 60, raio_km: 10 },
    ];
    const planejamento = planejar({}, undefined, { janelasAlimentacao });
    assert.deepEqual(planejamento.refeicoes.map((item) => item.id_janela_alimentacao), [10, 11]);
    const regenerado = planejar({}, undefined, { janelasAlimentacao, refeicoesExistentes: [{ data_refeicao: "2026-09-14", id_janela_alimentacao: 10, preco_estimado: 20 }] });
    assert.deepEqual(regenerado.refeicoes.map((item) => item.id_janela_alimentacao), [11]);
});

test("restaurante sem operacao ou fechado nao recebe sugestao", () => {
    assert.ok(planejar({}, [restaurante({ configuracao_operacao: {} })]).refeicoes.every((item) => !item.id_restaurante));
    const apenasTerca = { days: [{ id: "tuesday", enabled: true, shifts: [{ open: "11:00", close: "16:00" }] }] };
    const resultado = planejar({}, [restaurante({ configuracao_operacao: apenasTerca })]);
    assert.ok(!resultado.refeicoes[0].id_restaurante);
    assert.equal(resultado.refeicoes[1].id_restaurante, 1);
});

test("score operacional reduz ranking entre restaurantes equivalentes", () => {
    const resultado = planejar({}, [restaurante({ id_restaurante: 1, score_operacional: 30 }), restaurante({ id_restaurante: 2, score_operacional: 100 })]);
    assert.equal(resultado.refeicoes[0].id_restaurante, 2);
});

test("sem coordenadas nao inventa distancia e tempo de trajeto", () => {
    assert.ok(planejar({ latitude: null, longitude: null }).refeicoes.every((item) => !item.id_restaurante));
});

test("tempo total inclui deslocamento e permanencia e bloqueia janela curta", () => {
    assert.ok(planejar({ tempo_maximo_minutos: 20 }).refeicoes.every((item) => !item.id_restaurante));
    assert.ok(planejar({ horario_fim: "12:40" }).refeicoes.every((item) => !item.id_restaurante));
    assert.equal(planejar().refeicoes[0].tempo_estimado_minutos, 30);
});

test("horario passado e turno sem duas horas para reserva sao bloqueados", () => {
    const candidato = { restaurante: restaurante(), distancia_km: 0 };
    assert.equal(horarioCompativel(candidato, perfilBase, "2026-09-14", new Date("2026-09-14T13:00:00-03:00")), null);
    assert.equal(horarioCompativel(candidato, perfilBase, "2026-09-14", new Date("2026-09-12"), "15:00"), null);
});

test("alergias nao geram recomendacao de prato sem informacao estruturada", () => {
    const resultado = planejar({}, undefined, { alergias: ["amendoim"] });
    assert.equal(resultado.refeicoes[0].id_restaurante, 1);
    assert.equal(resultado.refeicoes[0].id_produto, null);
});

test("janela de 90 minutos aceita limite de 60 e rejeita limite de 120", () => {
    const perfil = { ...perfilBase, horario_inicio: "12:00", horario_fim: "13:30", tempo_maximo_minutos: 60 };
    assert.doesNotThrow(() => validarLimitesRotina(perfil));
    assert.throws(() => validarLimitesRotina({ ...perfil, tempo_maximo_minutos: 120 }), /90 minutos/);
    assert.throws(() => validarLimitesRotina({ ...perfil, tempo_maximo_minutos: 15 }), /30 e 240/);
    assert.throws(() => validarLimitesRotina({ ...perfil, raio_km: -1 }), /raio/);
    assert.throws(() => validarLimitesRotina({ ...perfil, dias_semana: [] }), /dia/);
});

test("semana segue Sao Paulo e avanca apos ultima janela selecionada", () => {
    assert.equal(semanaPlanejamento(new Date("2026-09-19T01:00:00Z"), ["friday"], "13:30").inicio, "2026-09-21");
    assert.equal(semanaPlanejamento(new Date("2026-09-14T01:00:00Z"), ["sunday"], "23:59").inicio, "2026-09-07");
});

test("geracao exclui dias passados e explica eliminacao por horario", () => {
    const resultado = planejar({}, undefined, { agora: new Date("2026-09-15T17:00:00-03:00") });
    assert.equal(resultado.refeicoes.length, 1);
    assert.equal(resultado.refeicoes[0].data_refeicao, "2026-09-15");
    assert.match(resultado.refeicoes[0].motivo_recomendacao, /funcionamento.*tempo/);
});

test("falta de sugestao explica saldo semanal e raio", () => {
    assert.match(planejar({ orcamento_semanal: 40 }).refeicoes[1].motivo_recomendacao, /orçamento semanal/);
    assert.match(planejar({ raio_km: 1 }, [restaurante({ latitude: -25 })]).refeicoes[0].motivo_recomendacao, /distância máxima/);
});

test("gera refeicao sem sugestao quando todas as opcoes violam restricoes", () => {
    const planejamento = gerarPlanejamentoRotina({
        perfil: perfilBase,
        restaurantes: [restaurante()],
        restricoes: ["tomate", "massa"],
        semanaInicio: "2026-09-14",
        agora: new Date("2026-09-12T12:00:00-03:00"),
    });

    assert.equal(planejamento.refeicoes[0].id_restaurante, undefined);
    assert.equal(planejamento.refeicoes[0].metadados.sem_sugestao, true);
});
