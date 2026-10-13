"use strict";

const { RagError } = require("./errors");
const { validateQuestion } = require("./answer-policy");
const { normalizeText } = require("./text-normalizer");
const { retrieveChunks } = require("./retrieval-service");

function createHybridRetrievalService({ repository, embeddingService, config } = {}) {
    if (!repository) throw new RagError("REPOSITORY_REQUIRED", "Repositório é obrigatório.");
    if (!embeddingService) throw new RagError("EMBEDDING_SERVICE_REQUIRED", "Serviço de embedding é obrigatório.");
    if (!config) throw new RagError("CONFIG_REQUIRED", "Configuração é obrigatória.");

    return Object.freeze({
        async search({ question, scope, fallbackChunks = [] }) {
            const validated = validateQuestion(question, config.maxQuestionCharacters);
            const [queryEmbedding] = await embeddingService.embed([validated]);

            if (config.hybridSearchEnabled && repository.searchHybridChunks) {
                return repository.searchHybridChunks({
                    embedding: queryEmbedding,
                    question: validated,
                    tenantType: scope.tenantType,
                    tenantId: scope.tenantId,
                    userId: scope.userId,
                    limit: config.topK,
                });
            }

            if (config.vectorSearchEnabled && repository.searchChunks) {
                return repository.searchChunks({
                    embedding: queryEmbedding,
                    tenantType: scope.tenantType,
                    tenantId: scope.tenantId,
                    userId: scope.userId,
                    limit: config.topK,
                });
            }

            return retrieveChunks({
                chunks: fallbackChunks,
                query: validated,
                queryEmbedding,
                scope: { restaurantId: scope.tenantId, userId: scope.userId },
                topK: config.topK,
                minScore: config.minScore,
            });
        },
    });
}

module.exports = { createHybridRetrievalService };
