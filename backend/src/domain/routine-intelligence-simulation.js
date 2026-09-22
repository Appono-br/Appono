"use strict";

const crypto = require("node:crypto");
const { MODELO_RECOMENDACAO_ROTINA, penalidadeRepeticao, pontuarCandidato } = require("./routine-scoring");
const { MODELO_INTELIGENCIA_ROTINA, pontuarInteligenciaRotina } = require("./routine-intelligence");
const { MODELO_INTELIGENCIA_ROTINA_V2, pontuarInteligenciaRotinaV2 } = require("./routine-intelligence-v2");
const { ordenarPorPontuacao } = require("./routine-shadow-evaluation");

const CONJUNTOS_SIMULACAO = Object.freeze({
    desenvolvimento: Object.freeze({ semente: 22092026, referencia: "2026-01-05T12:00:00Z" }),
    validacao: Object.freeze({ semente: 23112026, referencia: "2026-03-02T12:00:00Z" }),
    reserva: Object.freeze({ semente: 10102026, referencia: "2026-05-04T12:00:00Z" }),
});

const PERSONAS_ROTINA = Object.freeze([
    { id: "economico", orcamento: 32, raio: 7, categorias: { Brasileira: 2, Lanches: 1 }, preco: 2.2, distancia: 0.5, variedade: 0.4, ruido: 0.1 },
    { id: "explorador", orcamento: 60, raio: 10, categorias: { Asiática: 1, Mediterrânea: 1 }, preco: 0.3, distancia: 0.3, variedade: 2.2, ruido: 0.2 },
    { id: "fiel_restaurante", orcamento: 55, raio: 8, categorias: { Massas: 1 }, restaurantes: { 2: 4 }, preco: 0.4, distancia: 0.4, variedade: -0.4, ruido: 0.1 },
    { id: "fiel_prato", orcamento: 50, raio: 8, categorias: { Saudável: 1 }, produtos: { 105: 5 }, preco: 0.4, distancia: 0.4, variedade: -0.6, ruido: 0.1 },
    { id: "sensivel_distancia", orcamento: 55, raio: 4, categorias: { Brasileira: 1 }, preco: 0.4, distancia: 2.4, variedade: 0.3, ruido: 0.1 },
    { id: "avesso_repeticao", orcamento: 55, raio: 9, categorias: { Massas: 1, Saudável: 1 }, preco: 0.3, distancia: 0.4, variedade: 3, ruido: 0.1 },
    { id: "preferencia_forte", orcamento: 65, raio: 9, categorias: { Vegetariana: 5 }, preco: 0.2, distancia: 0.2, variedade: 0.5, ruido: 0.05 },
    { id: "contraditorio", orcamento: 48, raio: 8, categorias: { Lanches: 2, Saudável: 2 }, preco: 0.7, distancia: 0.7, variedade: 0.8, ruido: 1.2, contraditorio: true },
    { id: "mudanca_gradual", orcamento: 58, raio: 8, categorias: { Massas: 3 }, categoriaFutura: "Asiática", preco: 0.4, distancia: 0.5, variedade: 0.5, ruido: 0.15 },
    { id: "controle_sem_historico", orcamento: 50, raio: 8, categorias: { Brasileira: 2 }, preco: 0.5, distancia: 0.5, variedade: 0.5, ruido: 0, controle: true },
]);

const CATALOGO_BASE = Object.freeze([
    { id_restaurante: 1, restaurante: "Casa Brasileira", id_produto: 101, produto: "PF da casa", categoria: "Brasileira", preco: 28, distancia: 1.2, avaliacao: 4.5 },
    { id_restaurante: 2, restaurante: "Cantina Central", id_produto: 102, produto: "Penne ao sugo", categoria: "Massas", preco: 39, distancia: 2.1, avaliacao: 4.7 },
    { id_restaurante: 3, restaurante: "Estação Casual", id_produto: 103, produto: "Sanduíche artesanal", categoria: "Lanches", preco: 31, distancia: 0.9, avaliacao: 4.3 },
    { id_restaurante: 4, restaurante: "Oriente Bowl", id_produto: 104, produto: "Bowl oriental", categoria: "Asiática", preco: 44, distancia: 3.3, avaliacao: 4.8 },
    { id_restaurante: 5, restaurante: "Verde Vivo", id_produto: 105, produto: "Bowl verde", categoria: "Saudável", preco: 36, distancia: 2.5, avaliacao: 4.6 },
    { id_restaurante: 6, restaurante: "Horta Urbana", id_produto: 106, produto: "Risoto vegetal", categoria: "Vegetariana", preco: 47, distancia: 4.1, avaliacao: 4.8 },
    { id_restaurante: 7, restaurante: "Mesa Mediterrânea", id_produto: 107, produto: "Cuscuz mediterrâneo", categoria: "Mediterrânea", preco: 52, distancia: 5.2, avaliacao: 4.7 },
    { id_restaurante: 8, restaurante: "Sabor do Dia", id_produto: 108, produto: "Executivo do dia", categoria: "Brasileira", preco: 34, distancia: 2.8, avaliacao: 4.2 },
]);

function aleatorio(semente) {
    let estado = semente >>> 0;
    return () => {
        estado += 0x6D2B79F5;
        let valor = estado;
        valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
        valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
        return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
    };
}

function hashEntrada(valor) {
    return crypto.createHash("sha256").update(JSON.stringify(valor)).digest("hex");
}

function catalogoDoConjunto(configuracao) {
    const random = aleatorio(configuracao.semente);
    return CATALOGO_BASE.map((item) => ({
        ...item,
        preco: Number((item.preco + (random() - 0.5) * 4).toFixed(2)),
        distancia: Number(Math.max(0.2, item.distancia + (random() - 0.5) * 0.8).toFixed(2)),
    }));
}

function categoriaPersona(persona, semana) {
    if (persona.categoriaFutura && semana >= 3) {
        const categorias = { ...persona.categorias };
        categorias[persona.categoriaFutura] = (semana - 2) * 1.2;
        return categorias;
    }
    return persona.categorias;
}

function utilidadeExterna(persona, candidato, contexto, ruido = 0) {
    const categorias = categoriaPersona(persona, contexto.semana);
    const afinidadeCategoria = Number(categorias[candidato.categoria] ?? 0) * 2;
    const afinidadeRestaurante = Number(persona.restaurantes?.[candidato.id_restaurante] ?? 0);
    const afinidadeProduto = Number(persona.produtos?.[candidato.id_produto] ?? 0);
    const custo = (candidato.preco / Math.max(1, persona.orcamento)) * Number(persona.preco ?? 0);
    const deslocamento = (candidato.distancia / Math.max(1, persona.raio)) * Number(persona.distancia ?? 0);
    const repeticoes = contexto.usosRestaurante.get(candidato.id_restaurante) ?? 0;
    const variedade = -repeticoes * Number(persona.variedade ?? 0);
    const inversao = persona.contraditorio && (contexto.indice % 4 === 3) ? -afinidadeCategoria * 0.8 : 0;
    return Number((afinidadeCategoria + afinidadeRestaurante + afinidadeProduto + variedade - custo - deslocamento + inversao + ruido).toFixed(4));
}

function elegiveis(persona, catalogo) {
    return catalogo.filter((item) => item.preco <= persona.orcamento && item.distancia <= persona.raio);
}

function candidatoDominio(item) {
    return {
        restaurante: { id_restaurante: item.id_restaurante, nome: item.restaurante },
        produto: { id_produto: item.id_produto, nome: item.produto, categorias: { nome: item.categoria } },
        preco_estimado: item.preco,
        distancia_km: item.distancia,
    };
}

function pontuacaoControle(persona, candidato, usos) {
    const categorias = Object.keys(persona.categorias ?? {});
    const base = pontuarCandidato({
        favoritoRestaurante: Number(persona.restaurantes?.[candidato.id_restaurante] ?? 0) >= 3,
        dentroOrcamento: true,
        perto: candidato.distancia < 2,
        bemAvaliado: candidato.avaliacao > 4,
        combinaPreferencia: categorias.includes(candidato.categoria),
        scoreOperacional: 100,
    }).pontuacao;
    return Number((base - penalidadeRepeticao({ restaurantes: usos.get(candidato.id_restaurante) ?? 0 })).toFixed(2));
}

function sinalDaReacao({ persona, candidato, utilidade, melhorUtilidade, instante, id }) {
    const relativo = utilidade - melhorUtilidade;
    const positivo = relativo >= -1.2;
    return {
        id_sinal: id,
        tipo_evento: positivo ? (relativo >= -0.25 ? "CONVERSAO_PEDIDO" : "APROVACAO") : (relativo < -2.5 ? "RECUSA" : "ALTERNATIVA"),
        gostou: positivo,
        repetiria: relativo >= -0.25,
        consentiu_personalizacao: !persona.controle,
        criado_em: instante.toISOString(),
        id_restaurante: candidato.id_restaurante,
        id_produto: candidato.id_produto,
        categoria: candidato.categoria,
        preco_estimado: candidato.preco,
        distancia_km: candidato.distancia,
        tipo_janela: "ALMOCO",
    };
}

function estadoModelo() {
    return { usos: new Map(), sequencia: {}, escolhas: [], utilidades: [], arrependimentos: [], confiancas: [] };
}

function escolherModelo({ modelo, persona, candidatos, sinais, estado, referencia }) {
    const pontuados = candidatos.map((item) => {
        const dominio = candidatoDominio(item);
        const controle = pontuacaoControle(persona, item, estado.usos);
        if (modelo === MODELO_RECOMENDACAO_ROTINA.versao) return { ...item, score: controle, confianca: 0 };
        if (modelo === MODELO_INTELIGENCIA_ROTINA.versao) {
            const resultado = pontuarInteligenciaRotina({ candidato: dominio, perfil: { orcamento_diario: persona.orcamento, raio_km: persona.raio }, feedbacks: sinais, tipoJanela: "ALMOCO" });
            return { ...item, score: controle + resultado.ajuste, confianca: resultado.confianca };
        }
        const resultado = pontuarInteligenciaRotinaV2({ candidato: dominio, sinais, tipoJanela: "ALMOCO", referencia, sequencia: estado.sequencia });
        return { ...item, score: controle + resultado.ajuste, confianca: resultado.confianca };
    });
    return ordenarPorPontuacao(pontuados.map((item) => ({
        ...item,
        pontuacaoSimulacao: item.score,
        restaurante: { id_restaurante: item.id_restaurante, nome: item.restaurante },
        produto: { id_produto: item.id_produto, nome: item.produto },
        preco_estimado: item.preco,
        distancia_km: item.distancia,
    })), "pontuacaoSimulacao")[0];
}

function registrarEscolha(estado, escolha, utilidade, melhorUtilidade) {
    estado.escolhas.push(`${escolha.id_restaurante}:${escolha.id_produto}`);
    estado.utilidades.push(utilidade);
    estado.arrependimentos.push(Number((melhorUtilidade - utilidade).toFixed(4)));
    estado.confiancas.push(Number(escolha.confianca ?? 0));
    estado.usos.set(escolha.id_restaurante, (estado.usos.get(escolha.id_restaurante) ?? 0) + 1);
    estado.sequencia = { id_restaurante_anterior: escolha.id_restaurante, id_produto_anterior: escolha.id_produto };
}

function media(valores) {
    return valores.length ? Number((valores.reduce((soma, valor) => soma + valor, 0) / valores.length).toFixed(4)) : 0;
}

function resumirEstado(estado) {
    const frequencias = new Map();
    estado.escolhas.forEach((item) => frequencias.set(item, (frequencias.get(item) ?? 0) + 1));
    return {
        decisoes: estado.escolhas.length,
        utilidade_media: media(estado.utilidades),
        arrependimento_medio: media(estado.arrependimentos),
        confianca_media: media(estado.confiancas),
        opcoes_distintas: frequencias.size,
        concentracao_maxima: Math.max(0, ...frequencias.values()),
    };
}

function simularInteligenciaRotina({ conjunto = "desenvolvimento", semanas = 6 } = {}) {
    const configuracao = CONJUNTOS_SIMULACAO[conjunto];
    if (!configuracao) throw new Error(`Conjunto de simulacao invalido: ${conjunto}`);
    if (!Number.isInteger(semanas) || semanas < 6 || semanas > 52) throw new Error("A simulacao exige entre 6 e 52 semanas");
    const catalogo = catalogoDoConjunto(configuracao);
    const random = aleatorio(configuracao.semente ^ 0xABCDEF);
    const resultados = [];
    const desacordos = [];
    let idSinal = 1;

    for (const persona of PERSONAS_ROTINA) {
        const sinais = [];
        const estados = new Map([
            [MODELO_RECOMENDACAO_ROTINA.versao, estadoModelo()],
            [MODELO_INTELIGENCIA_ROTINA.versao, estadoModelo()],
            [MODELO_INTELIGENCIA_ROTINA_V2.versao, estadoModelo()],
        ]);
        const opcoes = elegiveis(persona, catalogo);
        for (let semana = 0; semana < semanas; semana += 1) {
            for (let dia = 0; dia < 5; dia += 1) {
                const indice = semana * 5 + dia;
                const referencia = new Date(new Date(configuracao.referencia).getTime() + indice * 86400000);
                const ruidos = new Map(opcoes.map((item) => [item.id_produto, (random() - 0.5) * persona.ruido]));
                const escolhas = {};
                for (const [modelo, estado] of estados) {
                    const utilidades = new Map(opcoes.map((item) => [item.id_produto, utilidadeExterna(persona, item, {
                        semana,
                        indice,
                        usosRestaurante: estado.usos,
                    }, ruidos.get(item.id_produto))]));
                    const melhorUtilidade = Math.max(...utilidades.values());
                    const escolha = escolherModelo({ modelo, persona, candidatos: opcoes, sinais, estado, referencia });
                    const utilidade = utilidades.get(escolha.id_produto);
                    registrarEscolha(estado, escolha, utilidade, melhorUtilidade);
                    escolhas[modelo] = { escolha, utilidade, melhorUtilidade };
                }
                const oficial = escolhas[MODELO_RECOMENDACAO_ROTINA.versao];
                if (!persona.controle) sinais.push(sinalDaReacao({ persona, candidato: oficial.escolha, utilidade: oficial.utilidade, melhorUtilidade: oficial.melhorUtilidade, instante: referencia, id: idSinal++ }));
                const v2 = escolhas[MODELO_INTELIGENCIA_ROTINA_V2.versao];
                if (oficial.escolha.id_produto !== v2.escolha.id_produto) {
                    desacordos.push({
                        id: `${conjunto}:${persona.id}:${semana}:${dia}`,
                        conjunto,
                        persona: persona.id,
                        semana,
                        contexto: { orcamento: persona.orcamento, raio: persona.raio, preferencias: Object.keys(categoriaPersona(persona, semana)) },
                        controle: { restaurante: oficial.escolha.restaurante, produto: oficial.escolha.produto, utilidade: oficial.utilidade },
                        v2: { restaurante: v2.escolha.restaurante, produto: v2.escolha.produto, utilidade: v2.utilidade, confianca: v2.escolha.confianca },
                    });
                }
            }
        }
        resultados.push({
            persona: persona.id,
            controle: resumirEstado(estados.get(MODELO_RECOMENDACAO_ROTINA.versao)),
            v1: resumirEstado(estados.get(MODELO_INTELIGENCIA_ROTINA.versao)),
            v2: resumirEstado(estados.get(MODELO_INTELIGENCIA_ROTINA_V2.versao)),
            sinais: sinais.length,
        });
    }
    return {
        protocolo: "appono-intelligence-longitudinal-v1",
        conjunto,
        semente: configuracao.semente,
        referencia: configuracao.referencia,
        semanas,
        hash_catalogo: hashEntrada(catalogo),
        hash_personas: hashEntrada(PERSONAS_ROTINA),
        personas: resultados,
        desacordos,
        violacoes_eliminatorias: 0,
    };
}

function anonimizarRevisaoCega(relatorio) {
    return relatorio.desacordos.map((item, indice) => {
        const inverter = Number.parseInt(hashEntrada(`${relatorio.semente}:${item.id}`).slice(0, 2), 16) % 2 === 1;
        const opcoes = inverter ? [item.v2, item.controle] : [item.controle, item.v2];
        return {
            id: `caso-${String(indice + 1).padStart(4, "0")}`,
            persona: item.persona,
            semana: item.semana,
            contexto: item.contexto,
            opcao_a: { restaurante: opcoes[0].restaurante, produto: opcoes[0].produto },
            opcao_b: { restaurante: opcoes[1].restaurante, produto: opcoes[1].produto },
            escolha: null,
            motivo: null,
        };
    });
}

module.exports = {
    CONJUNTOS_SIMULACAO,
    PERSONAS_ROTINA,
    anonimizarRevisaoCega,
    hashEntrada,
    simularInteligenciaRotina,
    utilidadeExterna,
};
