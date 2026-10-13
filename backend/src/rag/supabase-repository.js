"use strict";

const { RagError } = require("./errors");

function assertAdminClient(client) {
    if (!client || typeof client.from !== "function") {
        throw new RagError("SUPABASE_UNAVAILABLE", "Persistência do RAG indisponível.", { status: 503, publicMessage: "O serviço de conhecimento está temporariamente indisponível." });
    }
}

async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw new RagError("RAG_PERSISTENCE_FAILED", "Falha na persistência do RAG.", { status: 503, publicMessage: "Não foi possível acessar a base de conhecimento.", cause: error });
    return data;
}

function documentRow(input) {
    return {
        tenant_type: input.tenantType,
        tenant_id: input.tenantId,
        id_auth_owner: input.ownerAuthId,
        titulo: input.title,
        tipo_documento: input.documentType,
        origem: input.origin,
        uri_origem: input.uriOrigin,
        conteudo_hash: input.contentHash,
        versao: input.version ?? 1,
        prioridade: input.priority ?? 0,
        status: input.status ?? "RASCUNHO",
        visibilidade: input.visibility ?? "INTERNA",
        idioma: input.language ?? "pt-BR",
        metadados: input.metadata ?? {},
        criado_por: input.createdBy ?? null,
    };
}

function mapDocument(row) {
    if (!row) return null;
    return {
        id_documento: row.id_documento,
        tenantType: row.tenant_type,
        tenantId: row.tenant_id,
        ownerAuthId: row.id_auth_owner,
        title: row.titulo,
        documentType: row.tipo_documento,
        origin: row.origem,
        uriOrigin: row.uri_origem,
        contentHash: row.conteudo_hash,
        version: row.versao,
        priority: row.prioridade,
        status: row.status,
        visibility: row.visibilidade,
        language: row.idioma,
        metadata: row.metadados ?? {},
        createdBy: row.criado_por,
        createdAt: row.criado_em,
        updatedAt: row.atualizado_em,
        activeAt: row.ativo_em,
    };
}

function mapChunk(row) {
    return {
        chunkId: row.id_chunk,
        documentId: row.id_documento,
        title: row.rag_documents?.titulo ?? row.title,
        section: row.metadados?.section ?? row.section ?? null,
        content: row.conteudo ?? row.content,
        tenantType: row.rag_documents?.tenant_type ?? row.tenant_type,
        tenantId: row.rag_documents?.tenant_id ?? row.tenant_id,
        score: row.score,
        embedding: row.embedding,
        status: row.status,
    };
}

function createSupabaseRagRepository({ adminClient } = {}) {
    assertAdminClient(adminClient);
    return Object.freeze({
        async findByHash({ contentHash, tenantType, tenantId = null, ownerAuthId = null, version = 1 }) {
            let query = adminClient.from("rag_documents").select("*").eq("conteudo_hash", contentHash).eq("tenant_type", tenantType).eq("versao", version);
            query = tenantType === "RESTAURANTE" ? query.eq("tenant_id", tenantId) : query.is("tenant_id", null);
            query = tenantType === "USUARIO" ? query.eq("id_auth_owner", ownerAuthId) : query.is("id_auth_owner", null);
            const row = await unwrap(query.maybeSingle());
            return mapDocument(row);
        },
        async createDocument(input) {
            const row = await unwrap(adminClient.from("rag_documents").insert(documentRow(input)).select("*").single());
            return mapDocument(row);
        },
        async createRun(input) {
            return unwrap(adminClient.from("rag_ingestion_runs").insert({
                id_execucao: input.id,
                id_documento: input.documentId,
                status: input.status,
                modelo_embedding: input.model?.id ?? input.model,
                embedding_revisao: input.model?.revision,
                dimensao_embedding: input.model?.dimensions,
                iniciado_em: input.startedAt,
            }).select("*").single());
        },
        async updateRun(id, input) {
            const row = {};
            if (input.status) row.status = input.status;
            if (input.chunksProcessed !== undefined) row.chunks_processados = input.chunksProcessed;
            if (input.totalChunks !== undefined) row.total_chunks = input.totalChunks;
            if (input.errorCode) row.erro_codigo = input.errorCode;
            if (input.publicError) row.erro_publico = input.publicError;
            if (input.finishedAt) row.finalizado_em = input.finishedAt;
            return unwrap(adminClient.from("rag_ingestion_runs").update(row).eq("id_execucao", id).select("*").single());
        },
        async updateDocument(id, input) {
            const row = {};
            if (input.status) row.status = input.status;
            if (input.activeAt) row.ativo_em = input.activeAt;
            if (input.updatedAt) row.atualizado_em = input.updatedAt;
            if (input.title) row.titulo = input.title;
            if (input.documentType) row.tipo_documento = input.documentType;
            if (input.origin) row.origem = input.origin;
            if (input.uriOrigin !== undefined) row.uri_origem = input.uriOrigin;
            if (input.priority !== undefined) row.prioridade = input.priority;
            if (input.visibility) row.visibilidade = input.visibility;
            if (input.metadata) row.metadados = input.metadata;
            return mapDocument(await unwrap(adminClient.from("rag_documents").update(row).eq("id_documento", id).select("*").single()));
        },
        async replaceChunks(documentId, chunks) {
            const rows = chunks.map((chunk) => ({
                id_documento: documentId,
                indice: chunk.index,
                conteudo: chunk.content,
                conteudo_hash: chunk.contentHash,
                tokens_estimados: chunk.tokensEstimated,
                embedding_modelo: chunk.embeddingModel,
                embedding_revisao: chunk.embeddingRevision,
                embedding_dimensao: chunk.embeddingDimensions,
                embedding: chunk.embedding,
                status: chunk.status ?? "INDEXADO",
                metadados: chunk.metadata ?? {},
            }));
            if (rows.length) await unwrap(adminClient.from("rag_chunks").upsert(rows, { onConflict: "id_documento,indice" }));
            await unwrap(adminClient.from("rag_chunks").delete().eq("id_documento", documentId).gt("indice", Math.max(-1, rows.length - 1)));
        },
        async listDocuments({ limit = 100, status } = {}) {
            let query = adminClient.from("rag_documents").select("*").order("atualizado_em", { ascending: false }).limit(limit);
            if (status) query = query.eq("status", status);
            return (await unwrap(query)).map(mapDocument);
        },
        async getDocument(id) {
            return mapDocument(await unwrap(adminClient.from("rag_documents").select("*").eq("id_documento", id).maybeSingle()));
        },
        async listRuns({ documentId, limit = 50 } = {}) {
            let query = adminClient.from("rag_ingestion_runs").select("*").order("criado_em", { ascending: false }).limit(limit);
            if (documentId !== undefined) query = query.eq("id_documento", documentId);
            return unwrap(query);
        },
        async getRun(id) {
            return unwrap(adminClient.from("rag_ingestion_runs").select("*").eq("id_execucao", id).maybeSingle());
        },
        async searchChunks({ embedding, tenantType = "GLOBAL", tenantId = null, userId = null, limit = 10 }) {
            const rows = await unwrap(adminClient.rpc("rag_search_chunks", { p_query_embedding: embedding, p_tenant_type: tenantType, p_tenant_id: tenantId, p_user_id: userId, p_limit: limit }));
            return (rows ?? []).map(mapChunk);
        },
        async searchHybridChunks({ embedding, question, tenantType = "GLOBAL", tenantId = null, userId = null, limit = 10 }) {
            const rows = await unwrap(adminClient.rpc("rag_search_chunks_hybrid", { p_query_embedding: embedding, p_question: question, p_tenant_type: tenantType, p_tenant_id: tenantId, p_user_id: userId, p_limit: limit }));
            return (rows ?? []).map(mapChunk);
        },
        async audit(record) {
            await unwrap(adminClient.from("rag_query_audit").insert({
                request_id: record.requestId,
                id_auth_actor: record.actorId ?? null,
                role_actor: record.scope?.role ?? null,
                tenant_type: record.scope?.tenantType ?? null,
                tenant_id_hash: record.scope?.tenantIdHash ?? null,
                question_hash: record.questionHash,
                modelo_embedding: record.model?.id ?? null,
                embedding_revisao: record.model?.revision ?? null,
                index_version: record.indexVersion ?? null,
                chunk_ids: record.chunkIds ?? [],
                scores: record.scores ?? [],
                abstained: Boolean(record.abstained),
                fallback_code: record.fallback ?? null,
                timings_ms: record.timings ?? {},
            }));
        },
    });
}

module.exports = { createSupabaseRagRepository, mapChunk, mapDocument, documentRow };
