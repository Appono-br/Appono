"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;

const express_1 = require("express");
const crypto = require("crypto");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const mercado_pago_1 = require("../services/pagamentos/mercado-pago");
const notificacoes_1 = require("../services/notificacoes");

exports.paymentsRouter = (0, express_1.Router)();

function obterFrontendOrigin() {
    return (process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");
}

function obterBackendPublicUrl() {
    return (process.env.BACKEND_PUBLIC_URL ?? "")
        .trim()
        .replace(/\/$/, "");
}

function obterWebhookSecretMercadoPago() {
    return process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ?? "";
}

function urlPermiteRetornoAutomatico(url) {
    return /^https:\/\//i.test(url);
}

function tokenMercadoPagoEhTeste(token) {
    return /^TEST-/i.test(String(token ?? ""));
}

function mercadoPagoProducaoPermitida() {
    return String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true";
}

function obterModoRepasseMercadoPago() {
    return String(process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO").trim().toUpperCase();
}

function marketplaceRealAtivo() {
    return ["MARKETPLACE_REAL", "REAL", "PRODUCAO"].includes(obterModoRepasseMercadoPago());
}

function obterCheckoutUrlMercadoPago(preferencia, token) {
    if (tokenMercadoPagoEhTeste(token)) {
        return preferencia.sandbox_init_point ?? preferencia.init_point;
    }
    return preferencia.init_point ?? preferencia.sandbox_init_point;
}

function obterPrimeiroValorQuery(valor) {
    return Array.isArray(valor) ? valor[0] : valor;
}

function obterStatusRetornoMercadoPago(query) {
    return obterPrimeiroValorQuery(query.status ?? query.collection_status);
}

function obterPaymentIdRetornoMercadoPago(query) {
    const paymentId = obterPrimeiroValorQuery(query.payment_id ?? query.collection_id);
    return paymentId && paymentId !== "null" ? String(paymentId) : null;
}

function obterPreferenceIdRetornoMercadoPago(query) {
    const preferenceId = obterPrimeiroValorQuery(query.preference_id);
    return preferenceId && preferenceId !== "null" ? String(preferenceId) : null;
}

function obterReferencia(referencia) {
    const match = String(referencia ?? "").match(/^(reserva|pedido):(\d+)$/);
    return match ? { tipo: match[1], id: Number(match[2]) } : null;
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

function obterPercentualComissaoAppono() {
    const percentual = Number(process.env.MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL ?? process.env.MERCADO_PAGO_MARKETPLACE_FEE ?? 13);
    return Number.isFinite(percentual) && percentual >= 0 ? percentual : 13;
}

function arredondarMoeda(valor) {
    return Math.round(Number(valor ?? 0) * 100) / 100;
}

function calcularResumoFinanceiro(valorTotal, conexaoRestaurante) {
    const percentualComissao = obterPercentualComissaoAppono();
    const valorPedido = arredondarMoeda(valorTotal);
    const usaMarketplaceReal = marketplaceRealAtivo() && conexaoRestaurante;
    const valorComissao = arredondarMoeda(valorPedido * (percentualComissao / 100));
    return {
        tipo_fluxo_pagamento: usaMarketplaceReal ? "MARKETPLACE_RESTAURANTE" : "SIMULADO_APPONO",
        percentual_comissao_app: percentualComissao,
        valor_comissao_app: valorComissao,
        valor_restaurante: arredondarMoeda(valorPedido - valorComissao),
        mercado_pago_restaurante_user_id: usaMarketplaceReal ? conexaoRestaurante?.mercado_pago_user_id ?? null : null,
        status_repasse: "AGUARDANDO_PAGAMENTO",
    };
}

function statusPagamentoEhMaisForte(statusAtual, novoStatus) {
    const prioridade = {
        PENDENTE: 1,
        RECUSADO: 2,
        APROVADO: 3,
    };
    return (prioridade[statusAtual] ?? 0) > (prioridade[novoStatus] ?? 0);
}

function obterProximoStatusRepasse(statusAtual, novoStatus, tipoFluxoPagamento) {
    const usaRepasse = ["MARKETPLACE_RESTAURANTE", "SIMULADO_APPONO"].includes(tipoFluxoPagamento);
    if (!usaRepasse) {
        return "NAO_APLICAVEL";
    }
    if (["LIBERADO_PARA_REPASSE", "REPASSADO", "ESTORNADO"].includes(statusAtual)) {
        return statusAtual;
    }
    if (novoStatus === "APROVADO") {
        return "AGUARDANDO_ENTREGA";
    }
    if (novoStatus === "RECUSADO") {
        return "ESTORNADO";
    }
    return statusAtual ?? "AGUARDANDO_PAGAMENTO";
}

async function obterClienteAtual(supabase, userId) {
    const { data: cliente, error } = await supabase
        .from("clientes")
        .select("id_cliente, nome, email")
        .eq("id_auth", userId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return cliente;
}

async function obterConexaoMercadoPagoRestaurante(restauranteId) {
    if (!supabase_1.supabaseAdmin || !restauranteId) {
        return null;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("mercado_pago_conexoes_restaurante")
        .select("id_restaurante, mercado_pago_user_id, access_token, status, live_mode, expires_at")
        .eq("id_restaurante", restauranteId)
        .eq("status", "CONECTADO")
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    if (!data?.access_token) {
        return null;
    }
    return data;
}

async function obterTokenPagamentoPorPedido(pedidoId) {
    if (!marketplaceRealAtivo() || !supabase_1.supabaseAdmin || !pedidoId) {
        return null;
    }
    const { data: pedido } = await supabase_1.supabaseAdmin
        .from("pedidos")
        .select("id_restaurante")
        .eq("id_pedido", pedidoId)
        .maybeSingle();
    if (!pedido?.id_restaurante) {
        return null;
    }
    const conexao = await obterConexaoMercadoPagoRestaurante(pedido.id_restaurante);
    return conexao?.access_token ?? null;
}

async function obterPedidoDoCliente(supabase, pedidoId, userId) {
    const cliente = await obterClienteAtual(supabase, userId);
    if (!cliente) {
        return { cliente: null, pedido: null };
    }
    const { data: pedido, error } = await supabase
        .from("pedidos")
        .select("id_pedido, id_cliente, id_restaurante, id_reserva, status_pedido, valor_total, restaurantes(nome), reservas(data_reserva, horario_inicio)")
        .eq("id_pedido", pedidoId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return { cliente, pedido };
}

async function obterReservaDoCliente(supabase, reservaId, userId) {
    const cliente = await obterClienteAtual(supabase, userId);
    if (!cliente) {
        return { cliente: null, reserva: null };
    }
    const { data: reserva, error } = await supabase
        .from("reservas")
        .select("id_reserva, id_cliente, id_restaurante, data_reserva, horario_inicio, horario_fim, quantidade_pessoas, valor_minimo_total, status_reserva, restaurantes(nome)")
        .eq("id_reserva", reservaId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return { cliente, reserva };
}

async function salvarPagamento(dados) {
    if (!supabase_1.supabaseAdmin) {
        throw new Error("SUPABASE_SECRET_KEY precisa estar configurada no backend para registrar pagamentos.");
    }
    const { data: existente, error: buscaError } = await supabase_1.supabaseAdmin
        .from("pagamentos")
        .select("*")
        .eq("referencia_externa", dados.referencia_externa)
        .maybeSingle();
    if (buscaError) {
        throw new Error(buscaError.message);
    }
    const agora = new Date().toISOString();
    const tipoFluxoPagamento = dados.tipo_fluxo_pagamento ?? existente?.tipo_fluxo_pagamento ?? "DIRETO_APPONO";
    const statusPagamento = statusPagamentoEhMaisForte(existente?.status_pagamento, dados.status_pagamento)
        ? existente.status_pagamento
        : dados.status_pagamento;
    const statusRepasse = obterProximoStatusRepasse(
        existente?.status_repasse ?? dados.status_repasse,
        statusPagamento,
        tipoFluxoPagamento,
    );
    const payload = {
        id_pedido: dados.id_pedido ?? null,
        id_reserva: dados.id_reserva ?? null,
        valor: dados.valor_pago,
        valor_pago: dados.valor_pago,
        status_pagamento: statusPagamento,
        gateway_pagamento: "mercado_pago",
        provedor: "mercado_pago",
        referencia_externa: dados.referencia_externa,
        mercado_pago_preference_id: dados.mercado_pago_preference_id ?? existente?.mercado_pago_preference_id ?? null,
        mercado_pago_payment_id: dados.mercado_pago_payment_id ?? existente?.mercado_pago_payment_id ?? null,
        id_transacao_gateway: dados.mercado_pago_payment_id ?? existente?.id_transacao_gateway ?? null,
        checkout_url: dados.checkout_url ?? existente?.checkout_url ?? null,
        tipo_fluxo_pagamento: tipoFluxoPagamento,
        percentual_comissao_app: dados.percentual_comissao_app ?? existente?.percentual_comissao_app ?? null,
        valor_comissao_app: dados.valor_comissao_app ?? existente?.valor_comissao_app ?? null,
        valor_restaurante: dados.valor_restaurante ?? existente?.valor_restaurante ?? null,
        mercado_pago_restaurante_user_id: dados.mercado_pago_restaurante_user_id ?? existente?.mercado_pago_restaurante_user_id ?? null,
        status_repasse: statusRepasse,
        atualizado_em: agora,
        updated_at: agora,
    };
    if (statusPagamento === "APROVADO") {
        payload.data_pagamento = existente?.data_pagamento ?? agora;
        payload.data_aprovacao = existente?.data_aprovacao ?? agora;
    }
    const operacao = existente
        ? supabase_1.supabaseAdmin.from("pagamentos").update(payload).eq("id_pagamento", existente.id_pagamento)
        : supabase_1.supabaseAdmin.from("pagamentos").insert(payload);
    const { data, error } = await operacao.select("*").single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

async function atualizarPedidoPorPagamento(pedidoId, statusPedido) {
    if (!statusPedido || !supabase_1.supabaseAdmin) {
        return null;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("pedidos")
        .update({ status_pedido: statusPedido })
        .eq("id_pedido", pedidoId)
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

async function atualizarReservaPorPagamento(reservaId, statusReserva) {
    if (!statusReserva || !supabase_1.supabaseAdmin) {
        return null;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("reservas")
        .update({ status_reserva: statusReserva })
        .eq("id_reserva", reservaId)
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

async function obterPagamentoExistentePorReferencia(referencia) {
    if (!supabase_1.supabaseAdmin) {
        return null;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("pagamentos")
        .select("*")
        .eq("referencia_externa", referencia)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
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

async function aplicarStatusRetornoPedido(pedido, referencia, query) {
    const pagamentoExistente = await obterPagamentoExistentePorReferencia(referencia);
    const statusRetorno = obterStatusRetornoMercadoPago(query);
    if (!pagamentoExistente || !statusRetorno) {
        return null;
    }
    const statusMapeado = (0, mercado_pago_1.mapearStatusMercadoPago)(statusRetorno);
    const resumoFinanceiro = {
        tipo_fluxo_pagamento: pagamentoExistente.tipo_fluxo_pagamento,
        percentual_comissao_app: pagamentoExistente.percentual_comissao_app,
        valor_comissao_app: pagamentoExistente.valor_comissao_app,
        valor_restaurante: pagamentoExistente.valor_restaurante,
        mercado_pago_restaurante_user_id: pagamentoExistente.mercado_pago_restaurante_user_id,
        status_repasse: pagamentoExistente.status_repasse,
    };
    const pagamento = await salvarPagamento({
        id_pedido: pedido.id_pedido,
        id_reserva: pedido.id_reserva,
        valor_pago: Number(pedido.valor_total ?? pagamentoExistente.valor_pago ?? pagamentoExistente.valor ?? 0),
        status_pagamento: statusMapeado.pagamento,
        referencia_externa: referencia,
        mercado_pago_payment_id: obterPaymentIdRetornoMercadoPago(query),
        mercado_pago_preference_id: obterPreferenceIdRetornoMercadoPago(query) ?? pagamentoExistente.mercado_pago_preference_id,
        checkout_url: pagamentoExistente.checkout_url,
        ...resumoFinanceiro,
    });
    await registrarEventoFinanceiro({
        id_pagamento: pagamento.id_pagamento,
        id_pedido: pedido.id_pedido,
        id_reserva: pedido.id_reserva,
        tipo_evento: `PAGAMENTO_${statusMapeado.pagamento}`,
        descricao: `Pagamento ${statusMapeado.pagamento.toLowerCase()} pelo retorno do Mercado Pago.`,
        valor: Number(pedido.valor_total ?? pagamentoExistente.valor_pago ?? pagamentoExistente.valor ?? 0),
    });
    const pedidoAtualizado = await atualizarPedidoPorPagamento(
        pedido.id_pedido,
        obterStatusPedidoPorPagamento(statusMapeado.pagamento),
    );
    if (statusMapeado.pagamento === "APROVADO" && pagamentoExistente.status_pagamento !== "APROVADO") {
        await Promise.all([
            (0, notificacoes_1.notificarCliente)(pedido.id_cliente, {
                titulo: "Pagamento aprovado",
                mensagem: "Seu pagamento foi aprovado e o restaurante ja pode acompanhar o pedido antecipado.",
                tipo_evento: "PAGAMENTO_APROVADO",
                link_destino: "/cliente/detalhes-pedido",
                dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva },
            }),
            (0, notificacoes_1.notificarRestaurante)(pedido.id_restaurante, {
                titulo: "Pedido pago",
                mensagem: "Um pedido antecipado foi pago e esta pronto para acompanhamento operacional.",
                tipo_evento: "PAGAMENTO_APROVADO",
                link_destino: "/restaurante/pedidos",
                dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva },
            }),
            (0, notificacoes_1.notificarAdministradores)({
                titulo: "Pagamento aprovado",
                mensagem: `Pedido #${pedido.id_pedido} aprovado no Mercado Pago para conciliacao financeira.`,
                tipo_evento: "PAGAMENTO_APROVADO",
                link_destino: "/admin/financeiro",
                dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva, id_pagamento: pagamento.id_pagamento },
            }),
        ]);
    }
    return {
        pagamento,
        pedido: pedidoAtualizado ?? pedido,
        status_pagamento: statusMapeado.pagamento,
    };
}

async function aplicarPagamentoMercadoPago(pagamentoMercadoPago, fallbackReferencia = null) {
    const referencia = pagamentoMercadoPago?.external_reference ?? fallbackReferencia;
    const referenciaInfo = obterReferencia(referencia);
    if (!referenciaInfo || !supabase_1.supabaseAdmin || !pagamentoMercadoPago?.status) {
        return null;
    }
    const statusMapeado = (0, mercado_pago_1.mapearStatusMercadoPago)(pagamentoMercadoPago.status);
    const valorPago = Number(pagamentoMercadoPago.transaction_amount ?? 0);
    const pagamentoId = String(pagamentoMercadoPago.id);

    if (referenciaInfo.tipo === "pedido") {
        const { data: pedido, error: pedidoError } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .select("id_pedido, id_cliente, id_restaurante, id_reserva, valor_total, status_pedido")
            .eq("id_pedido", referenciaInfo.id)
            .maybeSingle();
        if (pedidoError || !pedido) {
            throw new Error(pedidoError?.message ?? "Pedido nao encontrado para conciliacao.");
        }
        const pagamentoExistente = await obterPagamentoExistentePorReferencia(referencia);
        const resumoFinanceiro = pagamentoExistente
            ? {
                tipo_fluxo_pagamento: pagamentoExistente.tipo_fluxo_pagamento,
                percentual_comissao_app: pagamentoExistente.percentual_comissao_app,
                valor_comissao_app: pagamentoExistente.valor_comissao_app,
                valor_restaurante: pagamentoExistente.valor_restaurante,
                mercado_pago_restaurante_user_id: pagamentoExistente.mercado_pago_restaurante_user_id,
                status_repasse: pagamentoExistente.status_repasse,
            }
            : {};
        const pagamento = await salvarPagamento({
            id_pedido: pedido.id_pedido,
            id_reserva: pedido.id_reserva,
            valor_pago: valorPago || Number(pedido.valor_total ?? 0),
            status_pagamento: statusMapeado.pagamento,
            referencia_externa: referencia,
            mercado_pago_payment_id: pagamentoId,
            ...resumoFinanceiro,
        });
        await registrarEventoFinanceiro({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: pedido.id_pedido,
            id_reserva: pedido.id_reserva,
            tipo_evento: `PAGAMENTO_${statusMapeado.pagamento}`,
            descricao: `Pagamento ${statusMapeado.pagamento.toLowerCase()} conciliado pelo Mercado Pago.`,
            valor: valorPago || Number(pedido.valor_total ?? 0),
        });
        const pedidoAtualizado = await atualizarPedidoPorPagamento(
            pedido.id_pedido,
            obterStatusPedidoPorPagamento(statusMapeado.pagamento),
        );
        if (statusMapeado.pagamento === "APROVADO" && pagamentoExistente?.status_pagamento !== "APROVADO") {
            await Promise.all([
                (0, notificacoes_1.notificarCliente)(pedido.id_cliente, {
                    titulo: "Pagamento aprovado",
                    mensagem: "Seu pagamento foi aprovado e o pedido antecipado foi confirmado.",
                    tipo_evento: "PAGAMENTO_APROVADO",
                    link_destino: "/cliente/detalhes-pedido",
                    dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva },
                }),
                (0, notificacoes_1.notificarRestaurante)(pedido.id_restaurante, {
                    titulo: "Pedido pago",
                    mensagem: "Um pedido antecipado foi pago e pode ser preparado conforme o horario da reserva.",
                    tipo_evento: "PAGAMENTO_APROVADO",
                    link_destino: "/restaurante/pedidos",
                    dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva },
                }),
                (0, notificacoes_1.notificarAdministradores)({
                    titulo: "Pagamento aprovado",
                    mensagem: `Pedido #${pedido.id_pedido} aprovado no Mercado Pago para conciliacao financeira.`,
                    tipo_evento: "PAGAMENTO_APROVADO",
                    link_destino: "/admin/financeiro",
                    dados: { id_pedido: pedido.id_pedido, id_reserva: pedido.id_reserva, id_pagamento: pagamento.id_pagamento },
                }),
            ]);
        }
        return {
            pagamento,
            pedido: pedidoAtualizado ?? pedido,
            status_pagamento: statusMapeado.pagamento,
        };
    }

    const { data: reserva, error: reservaError } = await supabase_1.supabaseAdmin
        .from("reservas")
        .select("id_reserva, valor_minimo_total, status_reserva")
        .eq("id_reserva", referenciaInfo.id)
        .maybeSingle();
    if (reservaError || !reserva) {
        throw new Error(reservaError?.message ?? "Reserva nao encontrada para conciliacao.");
    }
    const pagamento = await salvarPagamento({
        id_reserva: reserva.id_reserva,
        valor_pago: valorPago || Number(reserva.valor_minimo_total ?? 0),
        status_pagamento: statusMapeado.pagamento,
        referencia_externa: referencia,
        mercado_pago_payment_id: pagamentoId,
    });
    const reservaAtualizada = await atualizarReservaPorPagamento(reserva.id_reserva, statusMapeado.reserva);
    return {
        pagamento,
        reserva: reservaAtualizada ?? reserva,
        status_pagamento: statusMapeado.pagamento,
    };
}

async function obterResumoFinanceiroPagamentoExistente(referencia) {
    const pagamentoExistente = await obterPagamentoExistentePorReferencia(referencia);
    if (!pagamentoExistente) {
        return {};
    }
    return {
        tipo_fluxo_pagamento: pagamentoExistente.tipo_fluxo_pagamento,
        percentual_comissao_app: pagamentoExistente.percentual_comissao_app,
        valor_comissao_app: pagamentoExistente.valor_comissao_app,
        valor_restaurante: pagamentoExistente.valor_restaurante,
        mercado_pago_restaurante_user_id: pagamentoExistente.mercado_pago_restaurante_user_id,
        status_repasse: pagamentoExistente.status_repasse,
    };
}

function obterMercadoPagoUserIdNotificacao(req) {
    return obterPrimeiroValorQuery(req.body?.user_id ?? req.query.user_id);
}

function obterValorAssinatura(xSignature, chave) {
    return String(xSignature ?? "")
        .split(",")
        .map((parte) => parte.trim().split("="))
        .find(([nome]) => nome === chave)?.[1];
}

function validarAssinaturaWebhookMercadoPago(req, paymentId) {
    const secret = obterWebhookSecretMercadoPago();
    if (!secret) {
        return true;
    }
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];
    const ts = obterValorAssinatura(xSignature, "ts");
    const assinaturaRecebida = obterValorAssinatura(xSignature, "v1");
    if (!xRequestId || !ts || !assinaturaRecebida) {
        return false;
    }
    const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
    const assinaturaCalculada = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");
    if (!/^[a-f0-9]+$/i.test(assinaturaRecebida) || assinaturaCalculada.length !== assinaturaRecebida.length) {
        return false;
    }
    return crypto.timingSafeEqual(
        Buffer.from(assinaturaCalculada, "hex"),
        Buffer.from(assinaturaRecebida, "hex"),
    );
}

exports.paymentsRouter.post("/webhook/mercado-pago", async (req, res) => {
    const paymentId = obterPrimeiroValorQuery(req.query["data.id"] ?? req.query.id ?? req.body?.data?.id ?? req.body?.id);
    if (!paymentId) {
        return res.status(200).json({ received: true });
    }
    if (!validarAssinaturaWebhookMercadoPago(req, paymentId)) {
        return res.status(401).json({ received: false });
    }
    try {
        let pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoMercadoPago)(paymentId);
        const mercadoPagoUserId = obterMercadoPagoUserIdNotificacao(req);
        if (!pagamentoMercadoPago?.status && mercadoPagoUserId && supabase_1.supabaseAdmin) {
            const { data: conexao } = await supabase_1.supabaseAdmin
                .from("mercado_pago_conexoes_restaurante")
                .select("access_token")
                .eq("mercado_pago_user_id", String(mercadoPagoUserId))
                .eq("status", "CONECTADO")
                .maybeSingle();
            pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoMercadoPago)(paymentId, conexao?.access_token);
        }
        await aplicarPagamentoMercadoPago(pagamentoMercadoPago);
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.warn("Falha ao conciliar webhook Mercado Pago:", error instanceof Error ? error.message : error);
        return res.status(200).json({ received: true });
    }
});

exports.paymentsRouter.use(auth_1.requireAuth);

exports.paymentsRouter.post("/pedido/:id/preferencia", async (req, res) => {
    const pedidoId = Number(req.params.id);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return res.status(400).json({ error: "Pedido invalido." });
    }
    const tokenPadrao = (0, mercado_pago_1.obterAccessTokenMercadoPago)();
    if (!tokenPadrao) {
        return res.status(409).json({
            error: "MERCADO_PAGO_ACCESS_TOKEN ainda nao esta configurado no backend.",
        });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        const { cliente, pedido } = await obterPedidoDoCliente(supabase, pedidoId, res.locals.user.id);
        if (!cliente || !pedido) {
            return res.status(404).json({ error: "Pedido nao encontrado para este cliente." });
        }
        if (pedido.status_pedido !== "PENDENTE") {
            return res.status(409).json({ error: "Este pedido nao pode receber pagamento." });
        }
        if (Number(pedido.valor_total ?? 0) <= 0) {
            return res.status(400).json({ error: "Valor do pedido invalido." });
        }
        const conexaoRestaurante = await obterConexaoMercadoPagoRestaurante(pedido.id_restaurante);
        if (marketplaceRealAtivo() && conexaoRestaurante?.live_mode && !mercadoPagoProducaoPermitida()) {
            return res.status(409).json({
                error: "A conta Mercado Pago do restaurante foi conectada em modo producao. Para testes sem transacao real, desconecte e conecte uma conta de teste, ou habilite producao explicitamente no backend.",
            });
        }
        const token = marketplaceRealAtivo() && conexaoRestaurante?.access_token ? conexaoRestaurante.access_token : tokenPadrao;
        const resumoFinanceiro = calcularResumoFinanceiro(pedido.valor_total, conexaoRestaurante);
        const referencia = `pedido:${pedido.id_pedido}`;
        const pagamentoExistente = await obterPagamentoExistentePorReferencia(referencia);
        if (pagamentoExistente?.status_pagamento === "PENDENTE" &&
            pagamentoExistente.mercado_pago_preference_id &&
            pagamentoExistente.checkout_url) {
            return res.status(200).json({
                pedido,
                pagamento: pagamentoExistente,
                checkout_url: pagamentoExistente.checkout_url,
                return_url: `${obterFrontendOrigin()}/cliente/pagamentos/retorno?pedido=${pedido.id_pedido}`,
                auto_return: null,
                preference_id: pagamentoExistente.mercado_pago_preference_id,
                financeiro: {
                    tipo_fluxo_pagamento: pagamentoExistente.tipo_fluxo_pagamento,
                    percentual_comissao_app: pagamentoExistente.percentual_comissao_app,
                    valor_comissao_app: pagamentoExistente.valor_comissao_app,
                    valor_restaurante: pagamentoExistente.valor_restaurante,
                    status_repasse: pagamentoExistente.status_repasse,
                },
            });
        }
        const frontendOrigin = obterFrontendOrigin();
        const backUrl = `${frontendOrigin}/cliente/pagamentos/retorno?pedido=${pedido.id_pedido}`;
        const body = {
            items: [
                {
                    id: String(pedido.id_pedido),
                    title: `Pedido Appono - ${pedido.restaurantes?.nome ?? "Restaurante"}`,
                    description: `Pedido antecipado para reserva ${pedido.reservas?.data_reserva ?? ""} as ${String(pedido.reservas?.horario_inicio ?? "").slice(0, 5)}`,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: Number(pedido.valor_total),
                },
            ],
            payer: {
                name: cliente.nome,
                email: cliente.email,
            },
            back_urls: {
                success: `${backUrl}&resultado=success`,
                pending: `${backUrl}&resultado=pending`,
                failure: `${backUrl}&resultado=failure`,
            },
            external_reference: referencia,
            metadata: {
                pedido_id: pedido.id_pedido,
                reserva_id: pedido.id_reserva,
                cliente_id: cliente.id_cliente,
                restaurante_id: pedido.id_restaurante,
                tipo_fluxo_pagamento: resumoFinanceiro.tipo_fluxo_pagamento,
                percentual_comissao_app: resumoFinanceiro.percentual_comissao_app,
                valor_comissao_app: resumoFinanceiro.valor_comissao_app,
                valor_restaurante: resumoFinanceiro.valor_restaurante,
            },
        };
        if (marketplaceRealAtivo() && resumoFinanceiro.tipo_fluxo_pagamento === "MARKETPLACE_RESTAURANTE") {
            body.marketplace_fee = resumoFinanceiro.valor_comissao_app ?? undefined;
        }
        if (urlPermiteRetornoAutomatico(frontendOrigin)) {
            body.auto_return = "approved";
        }
        const backendPublicUrl = obterBackendPublicUrl();
        if (urlPermiteRetornoAutomatico(backendPublicUrl)) {
            body.notification_url = `${backendPublicUrl}/api/pagamentos/webhook/mercado-pago`;
        }
        const clientePreferencia = (0, mercado_pago_1.criarPreferenciaMercadoPago)(token);
        if (!clientePreferencia) {
            return res.status(409).json({
                error: "Nao foi possivel inicializar o SDK do Mercado Pago.",
            });
        }
        const preferencia = await clientePreferencia.create({ body }).catch((error) => {
            const causa = Array.isArray(error?.cause) && error.cause.length
                ? ` ${error.cause.map((item) => item.description ?? item.message).filter(Boolean).join(" ")}`
                : "";
            throw new Error(`${error?.message ?? "Nao foi possivel criar a preferencia de pagamento."}${causa}`.trim());
        });
        const checkoutUrl = obterCheckoutUrlMercadoPago(preferencia, token);
        if (!checkoutUrl) {
            return res.status(502).json({
                error: "O Mercado Pago criou a preferencia, mas nao retornou a URL do checkout.",
            });
        }
        const pagamento = await salvarPagamento({
            id_pedido: pedido.id_pedido,
            id_reserva: pedido.id_reserva,
            valor_pago: Number(pedido.valor_total),
            status_pagamento: "PENDENTE",
            referencia_externa: referencia,
            mercado_pago_preference_id: preferencia.id,
            checkout_url: checkoutUrl,
            ...resumoFinanceiro,
        });
        await registrarEventoFinanceiro({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: pedido.id_pedido,
            id_reserva: pedido.id_reserva,
            tipo_evento: "PAGAMENTO_CRIADO",
            descricao: "Preferencia de pagamento criada no Mercado Pago.",
            valor: Number(pedido.valor_total),
        });
        return res.status(201).json({
            pedido,
            pagamento,
            checkout_url: checkoutUrl,
            return_url: backUrl,
            auto_return: body.auto_return ?? null,
            preference_id: preferencia.id,
            financeiro: resumoFinanceiro,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel iniciar o pagamento.",
        });
    }
});

exports.paymentsRouter.get("/pedido/:id/status", async (req, res) => {
    const pedidoId = Number(req.params.id);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return res.status(400).json({ error: "Pedido invalido." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        const { pedido } = await obterPedidoDoCliente(supabase, pedidoId, res.locals.user.id);
        if (!pedido) {
            return res.status(404).json({ error: "Pedido nao encontrado para este cliente." });
        }
        const paymentId = obterPaymentIdRetornoMercadoPago(req.query);
        const referencia = `pedido:${pedido.id_pedido}`;
        const tokenPedido = await obterTokenPagamentoPorPedido(pedido.id_pedido);
        let pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoMercadoPago)(paymentId, tokenPedido ?? undefined);
        if (!pagamentoMercadoPago?.status && tokenPedido) {
            pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoMercadoPago)(paymentId);
        }
        if (!pagamentoMercadoPago?.status) {
            pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorReferenciaMercadoPago)(referencia, tokenPedido ?? undefined);
        }
        if (!pagamentoMercadoPago?.status && tokenPedido) {
            pagamentoMercadoPago = await (0, mercado_pago_1.consultarPagamentoPorReferenciaMercadoPago)(referencia);
        }
        let pagamento = null;
        let statusPagamento = "PENDENTE";
        if (pagamentoMercadoPago?.status) {
            const conciliacao = await aplicarPagamentoMercadoPago(pagamentoMercadoPago, referencia);
            pagamento = conciliacao?.pagamento ?? null;
            statusPagamento = conciliacao?.status_pagamento ?? "PENDENTE";
            if (conciliacao?.pedido) {
                pedido.status_pedido = conciliacao.pedido.status_pedido;
            }
        }
        else {
            const conciliacaoPorRetorno = await aplicarStatusRetornoPedido(pedido, referencia, req.query);
            if (conciliacaoPorRetorno) {
                pagamento = conciliacaoPorRetorno.pagamento;
                statusPagamento = conciliacaoPorRetorno.status_pagamento;
                if (conciliacaoPorRetorno.pedido) {
                    pedido.status_pedido = conciliacaoPorRetorno.pedido.status_pedido;
                }
            }
        }
        if (!pagamento) {
            const { data } = await supabase
                .from("pagamentos")
                .select("*")
                .eq("id_pedido", pedido.id_pedido)
                .order("atualizado_em", { ascending: false })
                .limit(1)
                .maybeSingle();
            pagamento = data;
        }
        return res.json({
            pedido,
            pagamento,
            status_pagamento: pagamento?.status_pagamento ?? statusPagamento,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel consultar o pagamento.",
        });
    }
});

exports.paymentsRouter.get("/reserva/:id/status", async (req, res) => {
    const reservaId = Number(req.params.id);
    if (!Number.isInteger(reservaId) || reservaId <= 0) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        const { reserva } = await obterReservaDoCliente(supabase, reservaId, res.locals.user.id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva nao encontrada para este cliente." });
        }
        return res.json({
            reserva,
            pagamento: null,
            status_pagamento: "NAO_APLICAVEL",
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel consultar a reserva.",
        });
    }
});
