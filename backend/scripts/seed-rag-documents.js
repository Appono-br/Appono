"use strict";

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { createEmbeddingService } = require("../src/rag/embedding-service");
const { createModelRegistry } = require("../src/rag/model-registry");
const { createIngestionService } = require("../src/rag/ingestion-service");
const { createSupabaseRagRepository } = require("../src/rag/supabase-repository");
const { supabaseAdmin } = require("../src/lib/supabase");
const { loadRagConfig } = require("../src/rag/config");

const DOCUMENTS = [
    {
        tenantType: "GLOBAL",
        title: "Politica de Cancelamento de Pedidos",
        documentType: "politica",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Politica de Cancelamento de Pedidos

## Cancelamento antes do preparo
O cliente pode cancelar o pedido gratuitamente enquanto o restaurante nao tiver iniciado o preparo. O status do pedido deve estar como CONFIRMADO para que o cancelamento seja possivel.

## Cancelamento durante o preparo
Apos o restaurante iniciar o preparo (status EM_PREPARO), o cancelamento so e permitido em casos excepcionais. O cliente deve entrar em contato com o suporte.

## Reembolso
O reembolso e integral quando o cancelamento ocorre antes do preparo. O valor e devolvido na mesma forma de pagamento original. Para pagamentos via PIX, o reembolso e feito na conta original em ate 5 dias uteis. Para cartao de credito, o estorno aparece em 1 a 2 faturas.

## Rejeicao pelo restaurante
Quando o restaurante rejeita um pedido, o reembolso e automatico e o cliente recebe uma notificacao imediata.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Regras de Reserva de Mesas",
        documentType: "politica",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Regras de Reserva de Mesas

## Antecedencia minima
Reservas devem ser feitas com pelo menos 2 horas de antecedencia. O sistema nao permite reservas para horarios ja passados.

## Confirmacao
Apos solicitar a reserva, o restaurante tem ate 30 minutos para confirmar. Se nao houver confirmacao, a reserva e cancelada automaticamente e o cliente e notificado.

## No-show
Clientes que nao comparecerem a 3 reservas consecutivas podem ter o acesso a reservas temporariamente suspenso.

## Capacidade
O numero de pessoas por reserva e limitado pela capacidade do restaurante. Grupos grandes devem ser previamente acordados com o restaurante.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Formas de Pagamento",
        documentType: "faq",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Formas de Pagamento Aceitas

## PIX
O PIX e a forma de pagamento preferencial. O pagamento e confirmado instantaneamente. O QR Code e gerado automaticamente no checkout.

## Cartao de Credito
Aceitamos as principais bandeiras: Visa, Mastercard, Elo e American Express. O pagamento e processado pelo Mercado Pago.

## Cartao de Debito
Cartoes de debito Visa e Mastercard sao aceitos. A cobranca e imediata.

## Dinheiro
Pagamento em dinheiro somente para pedidos com retirada no local. O troco deve ser informado no momento do pedido.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Sistema de Entrega",
        documentType: "faq",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Como Funciona a Entrega

## Raio de entrega
Cada restaurante define seu proprio raio de entrega. O raio padrao e de 5 km a partir do endereco do restaurante.

## Tempo estimado
O tempo estimado de entrega e calculado com base na distancia, no tempo medio de preparo do restaurante e nas condicoes de trafego. O cliente acompanha o status em tempo real.

## Taxa de entrega
A taxa de entrega varia conforme a distancia. O valor e exibido antes da confirmacao do pedido.

## Acompanhamento
O cliente recebe notificacoes a cada mudanca de status: pedido confirmado, em preparo, pronto, saiu para entrega e entregue.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Suporte ao Cliente",
        documentType: "procedimento",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Suporte ao Cliente

## Canal de suporte
O suporte e feito pelo chat dentro do aplicativo. O cliente pode iniciar uma conversa a qualquer momento pelo menu de ajuda.

## Prazo de resposta
O prazo de resposta e de ate 2 horas em dias uteis e ate 4 horas em fins de semana e feriados.

## Tipos de solicitacao
- Problemas com pedidos (atraso, item errado, item faltando)
- Duvidas sobre pagamento e reembolso
- Problemas com reservas
- Sugestoes e reclamacoes
- Problemas tecnicos com o aplicativo

## Escalonamento
Se o problema nao for resolvido no primeiro contato, o caso e escalado para a equipe especializada em ate 24 horas.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Notificacoes do Sistema",
        documentType: "faq",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Notificacoes

## Tipos de notificacao para o cliente
- Confirmacao de pedido
- Atualizacao de status do pedido (em preparo, pronto, saiu para entrega, entregue)
- Confirmacao de reserva
- Lembrete de reserva (1 hora antes)
- Confirmacao de pagamento
- Confirmacao de reembolso
- Promocoes e cupons

## Tipos de notificacao para o restaurante
- Novo pedido recebido
- Pedido cancelado pelo cliente
- Nova reserva solicitada
- Avaliacao recebida

## Configuracao
O cliente pode ativar ou desativar cada tipo de notificacao nas configuracoes do aplicativo.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Taxas e Comissoes",
        documentType: "politica",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Taxas e Comissoes

## Comissao do Appono
O Appono cobra uma comissao de 13% sobre o valor de cada pedido processado pela plataforma. Essa comissao cobre o processamento de pagamento, suporte ao cliente e manutencao da plataforma.

## Repasses
Os repasses para o restaurante sao feitos semanalmente, toda segunda-feira, referente aos pedidos da semana anterior. O valor e depositado na conta bancaria cadastrada pelo restaurante.

## Taxa de entrega
A taxa de entrega e cobrada do cliente e repassada integralmente ao restaurante ou entregador, conforme o modelo de entrega.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Privacidade e LGPD",
        documentType: "politica",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Politica de Privacidade

## Dados coletados
O Appono coleta apenas os dados necessarios para a operacao do servico: nome, email, telefone, endereco de entrega e historico de pedidos.

## LGPD
O Appono esta em conformidade com a Lei Geral de Protecao de Dados (LGPD). O usuario pode solicitar a exclusao dos seus dados a qualquer momento pelo menu de configuracoes.

## Consentimento
O consentimento para coleta de dados e solicitado no cadastro. O usuario pode revogar o consentimento a qualquer momento.

## Compartilhamento
Dados pessoais nao sao compartilhados com terceiros, exceto com o restaurante (nome e endereco para entrega) e com o processador de pagamento (dados de cobranca).`,
    },
    {
        tenantType: "GLOBAL",
        title: "Cupons e Promocoes",
        documentType: "faq",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Cupons e Promocoes

## Como usar um cupom
Insira o codigo do cupom no campo apropriado durante o checkout. O desconto e aplicado automaticamente ao valor do pedido.

## Validade
Cada cupom tem uma data de validade e pode ter restricoes como valor minimo do pedido ou categorias especificas.

## Tipos de cupom
- Desconto percentual (ex: 10% de desconto)
- Desconto fixo (ex: R$10 de desconto)
- Frete gratis
- Primeira compra

## Restricoes
Cupons nao sao cumulativos. Apenas um cupom pode ser usado por pedido. Cupons expirados nao podem ser reativados.`,
    },
    {
        tenantType: "GLOBAL",
        title: "Seguranca Alimentar",
        documentType: "politica",
        origin: "seed",
        visibility: "PUBLICA",
        content: `# Seguranca Alimentar

## Informacao nutricional
E responsabilidade do restaurante fornecer informacoes nutricionais e alertas de alergenicos nos itens do cardapio.

## Alergias
O Appono exibe os alertas de alergenicos cadastrados pelo restaurante, mas nao pode garantir a ausencia de contaminacao cruzada. Clientes com alergias severas devem consultar diretamente o restaurante.

## Responsabilidade
A responsabilidade pela seguranca alimentar e do restaurante. O Appono atua como intermediario e nao inspeciona a preparacao dos alimentos.

## Denuncia
Problemas de seguranca alimentar devem ser reportados imediatamente pelo canal de suporte para que o Appono possa investigar e tomar as medidas cabiveis.`,
    },
];

async function main() {
    const config = loadRagConfig();
    if (!config.modelId || !config.modelRevision) {
        console.error("Modelo de embedding nao configurado. Verifique APPONO_RAG_MODEL_ID e APPONO_RAG_MODEL_REVISION no .env.");
        process.exit(1);
    }

    console.log("Inicializando servicos...");
    const repository = createSupabaseRagRepository({ adminClient: supabaseAdmin });
    const registry = createModelRegistry([{ id: config.modelId, revision: config.modelRevision, dimensions: 384 }]);
    const embeddingService = createEmbeddingService({ model: registry.require(config.modelId), cacheDir: config.modelCacheDir, maxBatch: config.maxEmbeddingBatch });
    const ingestionService = createIngestionService({ repository, embeddingService, maxBatch: config.maxEmbeddingBatch });

    console.log(`Ingerindo ${DOCUMENTS.length} documentos...\n`);

    for (const doc of DOCUMENTS) {
        try {
            process.stdout.write(`  ${doc.title}...`);
            const result = await ingestionService.ingest(doc);
            if (result.idempotent) {
                console.log(` idempotente (ja existe).`);
            } else {
                console.log(` OK (${result.chunks} chunks, run=${result.runId}).`);
            }
        } catch (error) {
            console.log(` ERRO: ${error.message}`);
        }
    }

    console.log("\nSeed concluido.");
}

main().catch((error) => { console.error("Erro fatal:", error.message); process.exit(1); });
