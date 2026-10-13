"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { prepararSuporteSemantico, produtoCombinaSemantico, scoreSemantico, textoProdutoParaEmbedding } = require("../src/domain/routine-rag-support");
const { cosineSimilarity } = require("../src/rag/retrieval-service");
const { criarCandidatos, motivoRecomendacao } = require("../src/domain/routine-recommendation");

function mockEmbeddingService(mapaDeSimilaridade) {
    const vetores = new Map();
    let counter = 0;
    return {
        model: { id: "test-model", revision: "test", dimensions: 4 },
        async embed(texts) {
            return texts.map((text) => {
                const key = text.toLowerCase().trim();
                if (vetores.has(key)) return vetores.get(key);
                const grupo = Object.entries(mapaDeSimilaridade).find(([, termos]) => termos.some((t) => key.includes(t)));
                const id = grupo ? grupo[0] : null;
                const base = {
                    japonesa: [0.95, 0.05, 0.05, 0.0],
                    italiana: [0.05, 0.95, 0.05, 0.0],
                    churrasco: [0.05, 0.05, 0.95, 0.0],
                };
                const vetor = id && base[id] ? base[id] : [0.1, 0.1, 0.1, 0.9 + (counter++) * 0.001];
                vetores.set(key, vetor);
                return vetor;
            });
        },
    };
}

describe("routine-rag-support", () => {
    it("textoProdutoParaEmbedding monta texto com nome, descricao e categoria", () => {
        const produto = { nome: "Sushi Especial", descricao: "Salmão, atum e camarão", categorias: { nome: "Japonesa" } };
        const restaurante = { nome: "Tokyo Sushi" };
        const texto = textoProdutoParaEmbedding(produto, restaurante);
        assert.ok(texto.includes("Sushi Especial"));
        assert.ok(texto.includes("Japonesa"));
        assert.ok(texto.includes("Tokyo Sushi"));
    });

    it("prepararSuporteSemantico retorna null sem preferencias", async () => {
        const result = await prepararSuporteSemantico({ preferencias: [], restaurantes: [{ produtos: [{ id_produto: 1, nome: "X", disponivel: true }] }], embeddingService: mockEmbeddingService({}) });
        assert.equal(result, null);
    });

    it("prepararSuporteSemantico retorna null sem restaurantes", async () => {
        const result = await prepararSuporteSemantico({ preferencias: ["japonesa"], restaurantes: [], embeddingService: mockEmbeddingService({}) });
        assert.equal(result, null);
    });

    it("prepararSuporteSemantico retorna null sem embeddingService", async () => {
        const result = await prepararSuporteSemantico({ preferencias: ["japonesa"], restaurantes: [{ produtos: [{ id_produto: 1, nome: "Sushi", disponivel: true }] }], embeddingService: null });
        assert.equal(result, null);
    });

    it("matching semantico detecta afinidade entre preferencia e produto", async () => {
        const embedding = mockEmbeddingService({
            japonesa: ["japonesa", "sushi", "sashimi", "tempura"],
            italiana: ["italiana", "pizza", "lasanha", "massa"],
        });
        const restaurantes = [
            { nome: "Tokyo Sushi", produtos: [
                { id_produto: 1, nome: "Sushi Especial", descricao: "Peixe fresco", disponivel: true },
                { id_produto: 2, nome: "Sashimi Premium", descricao: "Fatias de salmão", disponivel: true },
            ] },
            { nome: "Pizzaria Roma", produtos: [
                { id_produto: 3, nome: "Pizza Margherita", descricao: "Tomate e mozzarella", disponivel: true },
            ] },
            { nome: "Churrascaria Gaúcha", produtos: [
                { id_produto: 4, nome: "Picanha na brasa", descricao: "Corte nobre grelhado", disponivel: true },
            ] },
        ];
        const suporte = await prepararSuporteSemantico({
            preferencias: ["comida japonesa"],
            restaurantes,
            embeddingService: embedding,
            threshold: 0.5,
        });
        assert.ok(suporte, "suporte semantico deve ser criado");
        assert.ok(produtoCombinaSemantico(1, suporte), "sushi deve combinar com japonesa");
        assert.ok(produtoCombinaSemantico(2, suporte), "sashimi deve combinar com japonesa");
        assert.ok(!produtoCombinaSemantico(3, suporte), "pizza nao deve combinar com japonesa");
        assert.ok(!produtoCombinaSemantico(4, suporte), "picanha nao deve combinar com japonesa");
        assert.ok(scoreSemantico(1, suporte) > 0.5, "score do sushi deve ser significativo");
    });

    it("criarCandidatos usa suporteSemantico quando fornecido", () => {
        const mapaSemantico = new Map();
        mapaSemantico.set(10, 0.85);
        mapaSemantico.set(20, 0.62);
        const suporteSemantico = Object.freeze({ mapaSemantico, threshold: 0.40, totalProdutos: 3, totalPreferencias: 1 });
        const perfil = {
            orcamento_diario: 100,
            raio_km: 10,
            latitude: -23.55,
            longitude: -46.63,
            dias_semana: ["monday"],
            horario_inicio: "12:00:00",
            horario_fim: "14:00:00",
            tempo_maximo_minutos: 60,
        };
        const restaurantes = [{
            id_restaurante: 1,
            nome: "Sushi Bar",
            latitude: -23.551,
            longitude: -46.631,
            avaliacao_media: 4.5,
            score_operacional: 90,
            produtos: [
                { id_produto: 10, nome: "Sushi Combo", preco: 50, disponivel: true },
                { id_produto: 30, nome: "Sobremesa", preco: 20, disponivel: true },
            ],
        }];
        const candidatos = criarCandidatos({
            perfil,
            restaurantes,
            preferencias: ["comida japonesa"],
            suporteSemantico,
        });
        const sushi = candidatos.find((c) => c.produto?.id_produto === 10);
        const sobremesa = candidatos.find((c) => c.produto?.id_produto === 30);
        assert.ok(sushi, "sushi deve estar nos candidatos");
        assert.ok(sobremesa, "sobremesa deve estar nos candidatos");
        assert.ok(sushi.combinaPreferenciaRAG, "sushi deve ter combinaPreferenciaRAG=true");
        assert.ok(!sobremesa.combinaPreferenciaRAG, "sobremesa nao deve ter combinaPreferenciaRAG");
        assert.ok(sushi.pesos.afinidade_semantica > 0, "sushi deve ter bonus semantico");
        assert.equal(sobremesa.pesos.afinidade_semantica, 0, "sobremesa nao deve ter bonus semantico");
        assert.ok(sushi.pontuacao > sobremesa.pontuacao, "sushi deve ter pontuacao maior que sobremesa");
    });

    it("motivoRecomendacao indica afinidade semantica quando match veio do RAG", () => {
        const candidato = {
            pesos: { favorito_restaurante: 0, distancia_menor_2km: 15, dentro_orcamento: 20, avaliacao_maior_4: 10, preferencia_produto: 0, feedback_controlado: 0, afinidade_semantica: 3.5 },
            combinaPreferenciaRAG: true,
        };
        const motivo = motivoRecomendacao(candidato);
        assert.ok(motivo.includes("afinidade semântica"), `motivo deve mencionar afinidade semantica: ${motivo}`);
        assert.ok(!motivo.includes("combina com suas preferências"), "nao deve usar motivo de matching textual");
    });

    it("motivoRecomendacao usa texto padrao quando match veio de token", () => {
        const candidato = {
            pesos: { favorito_restaurante: 0, distancia_menor_2km: 0, dentro_orcamento: 20, avaliacao_maior_4: 0, preferencia_produto: 10, feedback_controlado: 0, afinidade_semantica: 0 },
            combinaPreferenciaRAG: false,
        };
        const motivo = motivoRecomendacao(candidato);
        assert.ok(motivo.includes("combina com suas preferências"), `motivo deve usar matching textual: ${motivo}`);
    });

    it("suporteSemantico ignora produtos arquivados e indisponiveis", async () => {
        const embedding = mockEmbeddingService({ japonesa: ["japonesa", "sushi"] });
        const restaurantes = [{
            nome: "Sushi Fechado",
            produtos: [
                { id_produto: 1, nome: "Sushi Antigo", disponivel: false },
                { id_produto: 2, nome: "Sushi Arquivado", disponivel: true, arquivado: true },
                { id_produto: 3, nome: "Sushi Ativo", disponivel: true },
            ],
        }];
        const suporte = await prepararSuporteSemantico({
            preferencias: ["japonesa"],
            restaurantes,
            embeddingService: embedding,
            threshold: 0.3,
        });
        assert.ok(suporte);
        assert.equal(suporte.totalProdutos, 1, "apenas o produto ativo deve ser processado");
    });

    it("produtoCombinaSemantico e scoreSemantico retornam false/0 sem suporte", () => {
        assert.equal(produtoCombinaSemantico(1, null), false);
        assert.equal(produtoCombinaSemantico(1, undefined), false);
        assert.equal(scoreSemantico(1, null), 0);
        assert.equal(scoreSemantico(1, undefined), 0);
    });
});
