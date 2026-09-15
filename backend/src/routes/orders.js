"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const mercado_pago_1 = require("../services/pagamentos/mercado-pago");
const paymentConfig = require("../services/pagamentos/config");
const notificacoes_1 = require("../services/notificacoes");
const { canTransitionOrder } = require("../domain/order-state");
const { ordenarPorHorarioReserva, pedidoEstaNaFilaOperacional, pedidoPodeIniciarPreparo } = require("../domain/operational-queue");
const { paginationMeta, parsePagination } = require("../domain/pagination");
const { orderReviewEligibility } = require("../domain/review-state");
exports.ordersRouter = (0, express_1.Router)();
exports.ordersRouter.use(auth_1.requireAuth);

const LIMITE_UNIDADES_POR_ITEM = 10;
const STATUS_HISTORICO_RESTAURANTE = ["ENTREGUE", "CANCELADO"];

async function restaurantePodeReceberPedidoPago(restauranteId) {
    if (!paymentConfig.isRealMarketplace()) {
        return true;
    }
    if (!supabase_1.supabaseAdmin || !restauranteId) {
        return false;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("mercado_pago_conexoes_restaurante")
        .select("id_conexao")
        .eq("id_restaurante", restauranteId)
        .eq("status", "CONECTADO")
        .not("access_token", "is", null)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return Boolean(data);
}

function obterStatusPedidoPorPagamento(statusPagamento) {
    if (statusPagamento === "APROVADO") {
        return "CONFIRMADO";
    }
    if (statusPagamento === "RECUSADO") {
        return "CANCELADO";
    }
    return null;
}

function obterStatusReservaPorPagamento(statusPagamento) {
    if (statusPagamento === "APROVADO") {
        return "CONFIRMADA";
    }
    if (["RECUSADO", "ESTORNADO"].includes(statusPagamento)) {
        return "CANCELADA";
    }
    return null;
}

function obterStatusRepassePorPedido(statusPedido) {
    if (statusPedido === "ENTREGUE") {
        return "LIBERADO_PARA_REPASSE";
    }
    if (statusPedido === "CANCELADO") {
        return "ESTORNADO";
    }
    return null;
}

function obterProximoStatusRepasse(statusAtual, novoStatus) {
    if (["REPASSADO", "ESTORNADO"].includes(statusAtual)) {
        return statusAtual;
    }
    if (novoStatus === "LIBERADO_PARA_REPASSE") {
        return ["LIBERADO_PARA_REPASSE", "REPASSADO"].includes(statusAtual) ? statusAtual : novoStatus;
    }
    return novoStatus;
}

function obterModoRepasseMercadoPago() {
    return String(process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO").trim().toUpperCase();
}

function marketplaceRealAtivo() {
    return paymentConfig.isRealMarketplace();
}

async function registrarEventoFinanceiro(dados) {
    if (!supabase_1.supabaseAdmin) {
        return;
    }
    const { error } = await supabase_1.supabaseAdmin
        .from("eventos_financeiros")
        .insert({
            id_pagamento: dados.id_pagamento ?? null,
            id_pedido: dados.id_pedido ?? null,
            id_reserva: dados.id_reserva ?? null,
            tipo_evento: dados.tipo_evento,
            descricao: dados.descricao,
            valor: dados.valor ?? null,
        });
    if (error) {
        console.warn("Falha ao registrar evento financeiro:", error.message);
    }
}

async function obterTokenPagamentoPorPedido(pedido) {
    if (!marketplaceRealAtivo() || !supabase_1.supabaseAdmin || !pedido?.id_restaurante) {
        return null;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("mercado_pago_conexoes_restaurante")
        .select("access_token")
        .eq("id_restaurante", pedido.id_restaurante)
        .eq("status", "CONECTADO")
        .maybeSingle();
    if (error || !data?.access_token) {
        return null;
    }
    return data.access_token;
}

async function conciliarPedidosPendentes(pedidos) {
    if (!supabase_1.supabaseAdmin || !(0, mercado_pago_1.obterAccessTokenMercadoPago)()) {
        return pedidos;
    }
    const pedidosPendentes = (pedidos ?? []).filter((pedido) => pedido.status_pedido === "PENDENTE");
    if (!pedidosPendentes.length) {
        return pedidos;
    }
    const pedidosAtualizados = new Map();
    for (const pedido of pedidosPendentes) {
        const referencia = `pedido:${pedido.id_pedido}`;
        const tokenPagamento = await obterTokenPagamentoPorPedido(pedido);
        let pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorReferenciaMercadoPago)(referencia, tokenPagamento ?? undefined);
        if (!pagamentoMercadoPago?.status && tokenPagamento) {
            pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorReferenciaMercadoPago)(referencia);
        }
        if (!pagamentoMercadoPago?.status) {
            const { data: pagamentoLocal } = await supabase_1.supabaseAdmin
                .from("pagamentos")
                .select("mercado_pago_preference_id")
                .eq("referencia_externa", referencia)
                .maybeSingle();
            if (pagamentoLocal?.mercado_pago_preference_id) {
                pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorPreferênciaMercadoPago)(pagamentoLocal.mercado_pago_preference_id, tokenPagamento ?? undefined);
            }
            if (!pagamentoMercadoPago?.status && pagamentoLocal?.mercado_pago_preference_id && tokenPagamento) {
                pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorPreferênciaMercadoPago)(pagamentoLocal.mercado_pago_preference_id);
            }
        }
        if (!pagamentoMercadoPago?.status) {
            continue;
        }
        const statusMapeado = (0, mercado_pago_1.mapearStatusMercadoPago)(pagamentoMercadoPago.status);
        const statusPedido = obterStatusPedidoPorPagamento(statusMapeado.pagamento);
        const agora = new Date().toISOString();
        const pagamentoId = String(pagamentoMercadoPago.id);
        const { data: pagamentoExistente } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .select("id_pagamento, checkout_url, mercado_pago_preference_id, tipo_fluxo_pagamento, percentual_comissao_app, valor_comissao_app, valor_restaurante, mercado_pago_restaurante_user_id, status_repasse")
            .eq("referencia_externa", referencia)
            .maybeSingle();
        const payloadPagamento = {
            id_pedido: pedido.id_pedido,
            id_reserva: pedido.id_reserva ?? null,
            valor: Number(pagamentoMercadoPago.transaction_amount ?? pedido.valor_total ?? 0),
            valor_pago: Number(pagamentoMercadoPago.transaction_amount ?? pedido.valor_total ?? 0),
            status_pagamento: statusMapeado.pagamento,
            gateway_pagamento: "mercado_pago",
            provedor: "mercado_pago",
            referencia_externa: referencia,
            mercado_pago_payment_id: pagamentoId,
            id_transacao_gateway: pagamentoId,
            checkout_url: pagamentoExistente?.checkout_url ?? null,
            mercado_pago_preference_id: pagamentoExistente?.mercado_pago_preference_id ?? null,
            tipo_fluxo_pagamento: pagamentoExistente?.tipo_fluxo_pagamento ?? "DIRETO_APPONO",
            percentual_comissao_app: pagamentoExistente?.percentual_comissao_app ?? null,
            valor_comissao_app: pagamentoExistente?.valor_comissao_app ?? null,
            valor_restaurante: pagamentoExistente?.valor_restaurante ?? null,
            mercado_pago_restaurante_user_id: pagamentoExistente?.mercado_pago_restaurante_user_id ?? null,
            status_repasse: pagamentoExistente?.status_repasse ?? "NAO_APLICAVEL",
            atualizado_em: agora,
            updated_at: agora,
        };
        if (statusMapeado.pagamento === "APROVADO") {
            payloadPagamento.data_pagamento = agora;
            payloadPagamento.data_aprovacao = agora;
            if (["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"].includes(payloadPagamento.tipo_fluxo_pagamento)) {
                payloadPagamento.status_repasse = "AGUARDANDO_ENTREGA";
            }
        }
        const operacaoPagamento = pagamentoExistente
            ? supabase_1.supabaseAdmin.from("pagamentos").update(payloadPagamento).eq("id_pagamento", pagamentoExistente.id_pagamento)
            : supabase_1.supabaseAdmin.from("pagamentos").insert(payloadPagamento);
        await operacaoPagamento;
        if (!statusPedido) {
            continue;
        }
        const { data: pedidoAtualizado, error: pedidoError } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .update({ status_pedido: statusPedido })
            .eq("id_pedido", pedido.id_pedido)
            .select("*")
            .single();
        if (!pedidoError && pedidoAtualizado) {
            pedidosAtualizados.set(pedido.id_pedido, pedidoAtualizado);
        }
        const statusReserva = obterStatusReservaPorPagamento(statusMapeado.pagamento);
        if (statusReserva && pedido.id_reserva) {
            await supabase_1.supabaseAdmin
                .from("reservas")
                .update({ status_reserva: statusReserva })
                .eq("id_reserva", pedido.id_reserva);
        }
    }
    if (!pedidosAtualizados.size) {
        return pedidos;
    }
    return pedidos.map((pedido) => pedidosAtualizados.has(pedido.id_pedido)
        ? { ...pedido, ...pedidosAtualizados.get(pedido.id_pedido) }
        : pedido);
}

exports.ordersRouter.get("/", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { page, limit, from, to } = parsePagination(req.query);
    const { data, error, count } = await supabase
        .from("pedidos")
        .select("id_pedido, id_restaurante, id_reserva, status_pedido, valor_total, data_pedido, ocultado_cliente, restaurantes(nome), reservas(data_reserva, horario_inicio, status_reserva)", { count: "exact" })
        .eq("ocultado_cliente", false)
        .order("data_pedido", { ascending: false })
        .range(from, to);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json({ items: data ?? [], pagination: paginationMeta(count, page, limit) });
});
exports.ordersRouter.get("/historico/restaurante", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("id_restaurante")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (restauranteError) {
        return res.status(400).json({ error: restauranteError.message });
    }
    if (!restaurante) {
        return res.status(403).json({ error: "Apenas restaurantes podem consultar o histórico de pedidos." });
    }
    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const { data, error } = await clienteBanco
        .from("pedidos")
        .select("id_pedido, id_reserva, status_pedido, valor_total, data_pedido, horario_entrega_previsto, iniciar_preparo_em, ocultado_cozinha, ocultado_cozinha_em, observacoes, clientes(nome, telefone), reservas(data_reserva, horario_inicio, horario_fim, quantidade_pessoas, status_reserva, status_confirmacao_presenca, mesas(numero_mesa)), pagamentos(id_pagamento, valor_pago, status_pagamento, status_repasse, valor_restaurante, valor_comissao_app, data_pagamento), itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .eq("id_restaurante", restaurante.id_restaurante)
        .order("data_pedido", { ascending: false });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const somenteFilaCozinha = String(req.query?.fila ?? "").toLowerCase() === "cozinha";
    const historico = somenteFilaCozinha
        ? (data ?? []).filter((pedido) => pedidoEstaNaFilaOperacional(pedido)).sort(ordenarPorHorarioReserva)
        : (data ?? []).filter((pedido) => STATUS_HISTORICO_RESTAURANTE.includes(pedido.status_pedido) ||
            pedido.ocultado_cozinha === true);
    return res.json(historico);
});
exports.ordersRouter.get("/:id/avaliacao", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Pedido inválido." });
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: pedido, error: pedidoError } = await supabase.from("pedidos")
        .select("id_pedido, id_cliente, id_restaurante, status_pedido, restaurantes(nome)")
        .eq("id_pedido", orderId).eq("id_cliente", res.locals.profileId).maybeSingle();
    if (pedidoError) return res.status(400).json({ error: pedidoError.message });
    if (!pedido) return res.status(404).json({ error: "Pedido não encontrado para este cliente." });
    const { data: avaliacao, error } = await supabase.from("avaliacoes_restaurante").select("*").eq("id_pedido", orderId).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ pedido, avaliacao: avaliacao ?? null, elegivel: orderReviewEligibility(pedido).allowed });
});
exports.ordersRouter.post("/:id/avaliacao", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const orderId = Number(req.params.id);
    const nota = Number(req.body?.nota);
    const comentario = String(req.body?.comentario ?? "").trim() || null;
    if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(nota) || nota < 1 || nota > 5) return res.status(400).json({ error: "Informe uma nota de 1 a 5." });
    if (comentario && comentario.length > 1000) return res.status(400).json({ error: "O comentario deve ter no maximo 1000 caracteres." });
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: pedido, error: pedidoError } = await supabase.from("pedidos")
        .select("id_pedido, id_cliente, id_restaurante, id_reserva, status_pedido")
        .eq("id_pedido", orderId).eq("id_cliente", res.locals.profileId).maybeSingle();
    if (pedidoError) return res.status(400).json({ error: pedidoError.message });
    if (!pedido) return res.status(404).json({ error: "Pedido não encontrado para este cliente." });
    if (!orderReviewEligibility(pedido).allowed) return res.status(409).json({ error: "A avaliação fica disponível somente depois que o pedido for entregue." });
    const { data: existente, error: buscaError } = await supabase.from("avaliacoes_restaurante").select("id_avaliacao").eq("id_pedido", orderId).maybeSingle();
    if (buscaError) return res.status(400).json({ error: buscaError.message });
    const payload = { id_cliente: pedido.id_cliente, id_restaurante: pedido.id_restaurante, id_reserva: pedido.id_reserva, id_pedido: pedido.id_pedido, nota, comentario };
    const operacao = existente
        ? supabase.from("avaliacoes_restaurante").update(payload).eq("id_avaliacao", existente.id_avaliacao)
        : supabase.from("avaliacoes_restaurante").insert(payload);
    const { data, error } = await operacao.select("*").single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
});
exports.ordersRouter.get("/:id", async (req, res) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Pedido inválido." });
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase.from("pedidos")
        .select("*, restaurantes(nome, endereco), reservas(data_reserva, horario_inicio, horario_fim, quantidade_pessoas, status_reserva), itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos), item_adicional(*, adicionais(nome)))")
        .eq("id_pedido", orderId).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Pedido não encontrado." });
    return res.json(data);
});
exports.ordersRouter.post("/", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const body = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!body.id_reserva || !body.itens?.length) {
        return res.status(400).json({ error: "Pedido sem reserva ou itens." });
    }
    const itensRecebidos = body.itens.map((item) => ({
        id_produto: Number(item.id_produto),
        quantidade: Number(item.quantidade),
        observacoes: typeof item.observacoes === "string" ? item.observacoes.trim().slice(0, 180) : null,
    }));
    const itemInvalido = itensRecebidos.some((item) => !Number.isInteger(item.id_produto) ||
        item.id_produto <= 0 ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade <= 0);
    if (itemInvalido) {
        return res.status(400).json({
            error: `Cada item do pedido deve ter entre 1 e ${LIMITE_UNIDADES_POR_ITEM} unidades.`,
        });
    }
    const itensAgrupados = new Map();
    for (const item of itensRecebidos) {
        const atual = itensAgrupados.get(item.id_produto) ?? {
            id_produto: item.id_produto,
            quantidade: 0,
            observacoes: [],
        };
        atual.quantidade += item.quantidade;
        if (item.observacoes) {
            atual.observacoes.push(item.observacoes);
        }
        itensAgrupados.set(item.id_produto, atual);
    }
    const itensNormalizados = Array.from(itensAgrupados.values()).map((item) => ({
        id_produto: item.id_produto,
        quantidade: item.quantidade,
        observacoes: item.observacoes.join("; ") || null,
    }));
    if (itensNormalizados.some((item) => item.quantidade > LIMITE_UNIDADES_POR_ITEM)) {
        return res.status(400).json({
            error: `Cada item do pedido deve ter no maximo ${LIMITE_UNIDADES_POR_ITEM} unidades.`,
        });
    }
    const { data: reserva, error: reservaError } = await supabase
        .from("reservas")
        .select("id_restaurante")
        .eq("id_reserva", body.id_reserva)
        .maybeSingle();
    if (reservaError || !reserva) {
        return res.status(404).json({ error: "Reserva não encontrada para criar o pedido." });
    }
    if (!(await restaurantePodeReceberPedidoPago(reserva.id_restaurante))) {
        return res.status(409).json({
            error: "Este restaurante ainda não conectou uma conta Mercado Pago e não pode receber pedidos antecipados pagos.",
        });
    }
    const { data, error } = await supabase.rpc("criar_pedido_antecipado", {
        reserva_id: body.id_reserva,
        itens: itensNormalizados,
        observacoes_cliente: body.observacoes ?? null,
    });
    if (error) {
        const mensagem = error.message.includes("ja possui um pedido ativo")
            ? "Esta reserva já possui um pedido antecipado ativo."
            : error.message.includes("produtos sao inválidos") || error.message.includes("indisponíveis")
                ? "Um ou mais itens do cardápio ficaram indisponíveis. Atualize a página e escolha novamente."
                : error.message.includes("reserva iniciada")
                    ? "Não é possível criar pedido para uma reserva que já iniciou."
                    : error.message.includes("reserva confirmada")
                        ? "O pedido antecipado exige uma reserva confirmada."
                        : error.message.includes("consumo mínimo")
                            ? "O pedido precisa atingir o consumo mínimo da reserva."
                            : error.message;
        return res.status(409).json({ error: mensagem });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Pedido antecipado criado",
            mensagem: "Seu pedido foi registrado e ficará vinculado a sua reserva.",
            tipo_evento: "PEDIDO_CRIADO",
            link_destino: `/cliente/pedidos/${data.id_pedido}`,
            dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
            titulo: "Novo pedido antecipado",
            mensagem: "Um cliente registrou um pedido antecipado vinculado a uma reserva.",
            tipo_evento: "PEDIDO_CRIADO",
            link_destino: "/restaurante/pedidos",
            dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
        }),
    ]);
    return res.status(201).json(data);
});
exports.ordersRouter.patch("/:id/cancelar", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const orderId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(orderId)) {
        return res.status(400).json({ error: "Pedido inválido." });
    }
    const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id_cliente")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (clienteError) {
        return res.status(400).json({ error: clienteError.message });
    }
    if (!cliente) {
        return res.status(403).json({ error: "Apenas o cliente pode cancelar o próprio pedido." });
    }
    const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_cliente, id_restaurante, status_pedido, reservas(data_reserva, horario_inicio)")
        .eq("id_pedido", orderId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (pedidoError) {
        return res.status(400).json({ error: pedidoError.message });
    }
    if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado." });
    }
    if (!["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido)) {
        return res.status(409).json({
            error: "O pedido não pode ser cancelado porque o preparo já foi iniciado.",
        });
    }
    if (supabase_1.supabaseAdmin) {
        const { data: pagamentoAprovado } = await supabase_1.supabaseAdmin.from("pagamentos")
            .select("id_pagamento, mercado_pago_payment_id, status_pagamento")
            .eq("id_pedido", orderId).eq("status_pagamento", "APROVADO").maybeSingle();
        if (pagamentoAprovado?.mercado_pago_payment_id) {
            const token = (await obterTokenPagamentoPorPedido(pedido)) ?? (0, mercado_pago_1.obterAccessTokenMercadoPago)();
            try {
                await (0, mercado_pago_1.estornarPagamentoMercadoPago)(pagamentoAprovado.mercado_pago_payment_id, token);
            } catch (error) {
                return res.status(502).json({ error: `O pedido não foi cancelado porque o estorno falhou: ${error instanceof Error ? error.message : "erro desconhecido"}` });
            }
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .update({ status_pedido: "CANCELADO" })
            .eq("id_pedido", orderId)
            .eq("id_cliente", cliente.id_cliente)
            .select("*")
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const { data: pagamentosCancelados } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .update({ status_repasse: "ESTORNADO", atualizado_em: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id_pedido", orderId)
            .in("tipo_fluxo_pagamento", ["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"])
            .select("id_pagamento, valor_restaurante");
        await registrarEventoFinanceiro({
            id_pagamento: pagamentosCancelados?.[0]?.id_pagamento,
            id_pedido: orderId,
            tipo_evento: "REPASSE_ESTORNADO",
            descricao: "Repasse marcado como estornado após cancelamento do pedido.",
            valor: pagamentosCancelados?.[0]?.valor_restaurante ?? null,
        });
        await Promise.all([
            (0, notificacoes_1.notificarCliente)(data.id_cliente, {
                titulo: "Pedido cancelado",
                mensagem: "Seu pedido antecipado foi cancelado. Sua reserva continua ativa se ela ainda estiver confirmada.",
                tipo_evento: "PEDIDO_CANCELADO",
                link_destino: `/cliente/pedidos/${data.id_pedido}`,
                dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
            }),
            (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
                titulo: "Pedido antecipado cancelado",
                mensagem: "Um pedido antecipado foi cancelado pelo cliente. A reserva permanece independente do pedido.",
                tipo_evento: "PEDIDO_CANCELADO",
                link_destino: "/restaurante/pedidos",
                dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
            }),
            (0, notificacoes_1.notificarAdministradores)({
                titulo: "Pedido cancelado",
                mensagem: `Pedido #${data.id_pedido} cancelado. O repasse foi marcado como estornado quando havia pagamento vinculado.`,
                tipo_evento: "REPASSE_ESTORNADO",
                link_destino: "/admin/financeiro",
                dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva, id_pagamento: pagamentosCancelados?.[0]?.id_pagamento },
            }),
        ]);
        return res.json(data);
    }
    const { data, error } = await supabase.rpc("cancelar_pedido_próprio", {
        pedido_id: orderId,
    });
    if (error) {
        const mensagem = error.message.includes("não pode mais ser cancelado")
                ? "Este pedido não pode mais ser cancelado."
                : error.message;
        return res.status(409).json({ error: mensagem });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Pedido cancelado",
            mensagem: "Seu pedido antecipado foi cancelado. Sua reserva continua ativa se ela ainda estiver confirmada.",
            tipo_evento: "PEDIDO_CANCELADO",
            link_destino: `/cliente/pedidos/${data.id_pedido}`,
            dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
            titulo: "Pedido antecipado cancelado",
            mensagem: "Um pedido antecipado foi cancelado pelo cliente. A reserva permanece independente do pedido.",
            tipo_evento: "PEDIDO_CANCELADO",
            link_destino: "/restaurante/pedidos",
            dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva },
        }),
    ]);
    return res.json(data);
});
exports.ordersRouter.patch("/:id/ocultar", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const orderId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(orderId)) {
        return res.status(400).json({ error: "Pedido inválido." });
    }
    const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id_cliente")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (clienteError) {
        return res.status(400).json({ error: clienteError.message });
    }
    if (!cliente) {
        return res.status(403).json({ error: "Apenas o cliente pode remover o próprio pedido do histórico." });
    }
    const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_cliente, status_pedido")
        .eq("id_pedido", orderId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (pedidoError) {
        return res.status(400).json({ error: pedidoError.message });
    }
    if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado." });
    }
    if (!["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido)) {
        return res.status(409).json({
            error: "Apenas pedidos entregues ou cancelados podem ser removidos do histórico.",
        });
    }
    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const { data, error } = await clienteBanco
        .from("pedidos")
        .update({
            ocultado_cliente: true,
            ocultado_cliente_em: new Date().toISOString(),
        })
        .eq("id_pedido", orderId)
        .eq("id_cliente", cliente.id_cliente)
        .select("id_pedido, status_pedido, ocultado_cliente, ocultado_cliente_em")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
exports.ordersRouter.patch("/:id/status", (0, auth_1.requireRole)("restaurante"), async (req, res) => {
    const orderId = Number(req.params.id);
    const { status_pedido } = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const statusesPermitidos = ["CONFIRMADO", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"];
    if (!Number.isFinite(orderId) || !status_pedido || !statusesPermitidos.includes(status_pedido)) {
        return res.status(400).json({ error: "Status do pedido inválido." });
    }
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("id_restaurante")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (restauranteError) {
        return res.status(400).json({ error: restauranteError.message });
    }
    if (!restaurante) {
        return res.status(403).json({ error: "Apenas o restaurante pode atualizar o status do pedido." });
    }
    const { data: pedidoAtual, error: pedidoAtualError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_restaurante, status_pedido, iniciar_preparo_em, reservas(data_reserva, horario_inicio, status_reserva, status_confirmacao_presenca)")
        .eq("id_pedido", orderId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .maybeSingle();
    if (pedidoAtualError) {
        return res.status(400).json({ error: pedidoAtualError.message });
    }
    if (!pedidoAtual) {
        return res.status(404).json({ error: "Pedido não encontrado." });
    }
    if (!canTransitionOrder(pedidoAtual.status_pedido, status_pedido)) {
        return res.status(409).json({ error: `Transicao de ${pedidoAtual.status_pedido} para ${status_pedido} nao permitida.` });
    }
    if (status_pedido === "EM_PREPARO") {
        if (!pedidoPodeIniciarPreparo(pedidoAtual)) {
            return res.status(409).json({
                error: "Este pedido ainda não ésta elegivel para entrar em preparo. Verifique a confirmação de presença e a data da reserva.",
            });
        }
    }
    const { data, error } = await supabase
        .from("pedidos")
        .update({ status_pedido })
        .eq("id_pedido", orderId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .select("*, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const statusRepasse = obterStatusRepassePorPedido(status_pedido);
    if (statusRepasse && supabase_1.supabaseAdmin) {
        const { data: pagamentosAtuais } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .select("id_pagamento, status_repasse, valor_restaurante")
            .eq("id_pedido", orderId)
            .in("tipo_fluxo_pagamento", ["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"]);
        const proximoStatusRepasse = obterProximoStatusRepasse(pagamentosAtuais?.[0]?.status_repasse, statusRepasse);
        const { data: pagamentosAfetados } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .update({ status_repasse: proximoStatusRepasse, atualizado_em: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id_pedido", orderId)
            .in("tipo_fluxo_pagamento", ["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"])
            .select("id_pagamento, valor_restaurante");
        await registrarEventoFinanceiro({
            id_pagamento: pagamentosAfetados?.[0]?.id_pagamento,
            id_pedido: orderId,
            tipo_evento: proximoStatusRepasse === "LIBERADO_PARA_REPASSE" ? "REPASSE_LIBERADO" : "REPASSE_ESTORNADO",
            descricao: proximoStatusRepasse === "LIBERADO_PARA_REPASSE"
                ? "Repasse liberado após confirmação de entrega do pedido."
                : "Repasse estornado após cancelamento do pedido.",
            valor: pagamentosAfetados?.[0]?.valor_restaurante ?? null,
        });
        await (0, notificacoes_1.notificarAdministradores)({
            titulo: proximoStatusRepasse === "LIBERADO_PARA_REPASSE" ? "Repasse liberado" : "Repasse estornado",
            mensagem: proximoStatusRepasse === "LIBERADO_PARA_REPASSE"
                ? `Pedido #${orderId} foi entregue e ficou liberado para repasse ao restaurante.`
                : `Pedido #${orderId} foi cancelado e o repasse foi marcado como estornado.`,
            tipo_evento: proximoStatusRepasse === "LIBERADO_PARA_REPASSE" ? "REPASSE_LIBERADO" : "REPASSE_ESTORNADO",
            link_destino: "/admin/financeiro",
            dados: { id_pedido: orderId, id_reserva: data.id_reserva, id_pagamento: pagamentosAfetados?.[0]?.id_pagamento },
        });
    }
    await (0, notificacoes_1.notificarCliente)(data.id_cliente, {
        titulo: "Status do pedido atualizado",
        mensagem: `Seu pedido agora está como: ${status_pedido.replaceAll("_", " ").toLowerCase()}.`,
        tipo_evento: "STATUS_PEDIDO",
        link_destino: `/cliente/pedidos/${data.id_pedido}`,
        dados: { id_pedido: data.id_pedido, id_reserva: data.id_reserva, status_pedido },
    });
    return res.json(data);
});
exports.ordersRouter.patch("/:id/ocultar-cozinha", (0, auth_1.requireRole)("restaurante"), async (req, res) => {
    const orderId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(orderId)) {
        return res.status(400).json({ error: "Pedido inválido." });
    }
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("id_restaurante")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (restauranteError) {
        return res.status(400).json({ error: restauranteError.message });
    }
    if (!restaurante) {
        return res.status(403).json({ error: "Apenas o restaurante pode remover pedidos da cozinha." });
    }
    const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_restaurante, status_pedido")
        .eq("id_pedido", orderId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .maybeSingle();
    if (pedidoError) {
        return res.status(400).json({ error: pedidoError.message });
    }
    if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado." });
    }
    if (!["PRONTO", "ENTREGUE", "CANCELADO"].includes(pedido.status_pedido)) {
        return res.status(409).json({
            error: "Marque o pedido como pronto, entregue ou cancelado antes de remove-lo da cozinha.",
        });
    }
    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const { data, error } = await clienteBanco
        .from("pedidos")
        .update({
            ocultado_cozinha: true,
            ocultado_cozinha_em: new Date().toISOString(),
        })
        .eq("id_pedido", orderId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .select("id_pedido, status_pedido, ocultado_cozinha, ocultado_cozinha_em")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.json(data);
});
