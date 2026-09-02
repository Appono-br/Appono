"use strict";
const { supabaseAdmin } = require("../../lib/supabase");
const {
    apponoCommissionPercentage,
    attendanceConfirmationDeadline,
    attendanceConfirmationExpired,
    calculateAttendanceRefundPolicy,
    reservationStartDate,
} = require("../../domain/reservation-time");
const { refundApprovedPayments } = require("../pagamentos/refund");
const paymentConfig = require("../pagamentos/config");
const { notificarAdministradores, notificarCliente, notificarRestaurante } = require("../notificacoes");

function arredondarMoeda(valor) {
    return Math.round(Number(valor ?? 0) * 100) / 100;
}

function agoraLocalSaoPaulo() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

async function inserirEventoFinanceiro(evento) {
    const { error } = await supabaseAdmin.from("eventos_financeiros").insert(evento);
    if (error) {
        console.warn("Falha ao registrar evento financeiro de expiracao:", error.message);
    }
}

async function inserirReembolsoAusencia(reembolso) {
    const { error } = await supabaseAdmin.from("solicitacoes_reembolso").insert(reembolso);
    if (error && error.code !== "23505") {
        console.warn("Falha ao registrar reembolso por ausencia:", error.message);
    }
}

async function cancelarReservaSemConfirmacao(reserva, agoraIso, statusPermitidos = ["CONFIRMADA"]) {
    const { data: pedidos, error: pedidosError } = await supabaseAdmin
        .from("pedidos")
        .select("id_pedido, id_reserva, id_cliente, id_restaurante, status_pedido, valor_total")
        .eq("id_reserva", reserva.id_reserva);
    if (pedidosError) throw new Error(pedidosError.message);

    const pedidosEmAndamento = (pedidos ?? []).filter((pedido) => ["EM_PREPARO", "PRONTO", "ENTREGUE"].includes(pedido.status_pedido));
    if (pedidosEmAndamento.length) {
        console.warn(`Reserva ${reserva.id_reserva} passou do prazo de presenca, mas ja possui pedido em andamento.`);
        return false;
    }

    const idsPedidos = (pedidos ?? []).map((pedido) => pedido.id_pedido);
    let pagamentos = [];
    if (idsPedidos.length) {
        const { data, error } = await supabaseAdmin
            .from("pagamentos")
            .select("id_pagamento, id_pedido, id_reserva, status_pagamento, status_repasse, tipo_fluxo_pagamento, mercado_pago_payment_id, valor_pago, valor, valor_reembolsado")
            .in("id_pedido", idsPedidos);
        if (error) throw new Error(error.message);
        pagamentos = data ?? [];
    }

    const percentualComissaoAppono = apponoCommissionPercentage();
    const pagamentosAprovados = pagamentos.filter((pagamento) => pagamento.status_pagamento === "APROVADO");
    const valorPorPagamento = new Map();
    const politicaPorPagamento = new Map();
    for (const pagamento of pagamentosAprovados) {
        const valorBase = Number(pagamento.valor_pago ?? pagamento.valor ?? 0) - Number(pagamento.valor_reembolsado ?? 0);
        const politica = calculateAttendanceRefundPolicy({
            paidAmount: valorBase,
            minimumTotal: reserva.valor_minimo_total,
            commissionPercentage: percentualComissaoAppono,
        });
        politicaPorPagamento.set(pagamento.id_pagamento, politica);
        if (politica.refund > 0) {
            valorPorPagamento.set(pagamento.id_pagamento, arredondarMoeda(politica.refund));
        }
    }

    const pagamentosParaReembolso = pagamentosAprovados.filter((pagamento) => valorPorPagamento.has(pagamento.id_pagamento));
    await refundApprovedPayments(pagamentosParaReembolso, reserva.id_restaurante, valorPorPagamento);

    for (const pagamento of pagamentos.filter((item) => item.status_pagamento === "PENDENTE")) {
        await supabaseAdmin
            .from("pagamentos")
            .update({
                status_pagamento: "RECUSADO",
                status_repasse: "ESTORNADO",
                atualizado_em: agoraIso,
                updated_at: agoraIso,
            })
            .eq("id_pagamento", pagamento.id_pagamento);
        await inserirEventoFinanceiro({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: pagamento.id_pedido,
            id_reserva: reserva.id_reserva,
            tipo_evento: "PAGAMENTO_RECUSADO_PRESENCA_EXPIRADA",
            descricao: "Checkout pendente encerrado porque o prazo de confirmacao de presenca expirou.",
            valor: pagamento.valor_pago ?? pagamento.valor ?? 0,
            origem: "SISTEMA",
        });
    }

    let totalReembolsado = 0;
    const totalRetido = Array.from(politicaPorPagamento.values())
        .reduce((total, politica) => total + Number(politica.retained ?? 0), 0);
    for (const pagamento of pagamentosAprovados) {
        const politica = politicaPorPagamento.get(pagamento.id_pagamento);
        if (!politica) continue;
        const valorReembolso = valorPorPagamento.get(pagamento.id_pagamento) ?? 0;
        totalReembolsado += valorReembolso;
        const valorPago = Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
        const totalJaReembolsado = arredondarMoeda(Number(pagamento.valor_reembolsado ?? 0) + valorReembolso);
        const reembolsoTotal = totalJaReembolsado >= valorPago;
        const valorRestauranteRetido = arredondarMoeda(politica.restaurantRetained ?? 0);
        const valorComissaoRetida = arredondarMoeda(politica.appCommission ?? politica.commission ?? 0);

        await supabaseAdmin
            .from("pagamentos")
            .update({
                valor_reembolsado: totalJaReembolsado,
                valor_restaurante: valorRestauranteRetido,
                valor_comissao_app: valorComissaoRetida,
                status_pagamento: reembolsoTotal ? "ESTORNADO" : pagamento.status_pagamento,
                status_repasse: valorRestauranteRetido > 0 ? "LIBERADO_PARA_REPASSE" : "ESTORNADO",
                atualizado_em: agoraIso,
                updated_at: agoraIso,
            })
            .eq("id_pagamento", pagamento.id_pagamento);

        if (valorReembolso > 0) {
            await inserirReembolsoAusencia({
                id_pagamento: pagamento.id_pagamento,
                id_pedido: pagamento.id_pedido,
                id_reserva: reserva.id_reserva,
                id_cliente: reserva.id_cliente,
                id_restaurante: reserva.id_restaurante,
                valor_solicitado: valorReembolso,
                motivo: "Prazo de confirmacao de presenca expirado sem resposta do cliente.",
                resposta: "Reembolso parcial processado automaticamente: valor pago menos consumo minimo da reserva e comissao Appono.",
                status_reembolso: "CONCLUIDO",
                modo_execucao: paymentConfig.productionAllowed() ? "MERCADO_PAGO_PRODUCAO" : "MERCADO_PAGO_TESTE",
                analisado_em: agoraIso,
                concluido_em: agoraIso,
                id_auth_analista: null,
            });
            await inserirEventoFinanceiro({
                id_pagamento: pagamento.id_pagamento,
                id_pedido: pagamento.id_pedido,
                id_reserva: reserva.id_reserva,
                tipo_evento: "REEMBOLSO_PARCIAL_PRESENCA_EXPIRADA",
                descricao: `Prazo de presenca expirado. Reembolso parcial calculado por excedente: pago menos consumo minimo e comissao Appono de ${percentualComissaoAppono}%.`,
                valor: valorReembolso,
                origem: "SISTEMA",
            });
        }
        await inserirEventoFinanceiro({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: pagamento.id_pedido,
            id_reserva: reserva.id_reserva,
            tipo_evento: "RETENCAO_PRESENCA_EXPIRADA",
            descricao: `Prazo de presenca expirado. Restaurante manteve R$ ${valorRestauranteRetido.toFixed(2).replace(".", ",")} e Appono manteve R$ ${valorComissaoRetida.toFixed(2).replace(".", ",")}.`,
            valor: arredondarMoeda(politica.retained ?? 0),
            origem: "SISTEMA",
        });
    }

    if (idsPedidos.length) {
        await supabaseAdmin
            .from("pedidos")
            .update({ status_pedido: "CANCELADO" })
            .eq("id_reserva", reserva.id_reserva)
            .in("status_pedido", ["PENDENTE", "CONFIRMADO"]);
    }

    const prazo = reserva.prazo_confirmacao_presenca ? new Date(reserva.prazo_confirmacao_presenca) : attendanceConfirmationDeadline(reserva);
    const { data: reservaCancelada, error: updateError } = await supabaseAdmin
        .from("reservas")
        .update({
            status_reserva: "CANCELADA",
            status_confirmacao_presenca: "EXPIRADA",
            confirmacao_presenca_em: agoraIso,
            prazo_confirmacao_presenca: prazo?.toISOString() ?? null,
            percentual_comissao_ausencia: percentualComissaoAppono,
            valor_retido_ausencia: arredondarMoeda(totalRetido),
            valor_reembolso_ausencia: arredondarMoeda(totalReembolsado),
            motivo_confirmacao_presenca: "Prazo de confirmacao de presenca expirado sem resposta do cliente.",
        })
        .eq("id_reserva", reserva.id_reserva)
        .in("status_reserva", statusPermitidos)
        .eq("status_confirmacao_presenca", "PENDENTE")
        .select("*")
        .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (!reservaCancelada) return false;

    await Promise.all([
        notificarCliente(reserva.id_cliente, {
            titulo: "Reserva cancelada",
            mensagem: totalReembolsado > 0
                ? `O prazo de confirmacao expirou e um reembolso parcial de R$ ${arredondarMoeda(totalReembolsado).toFixed(2).replace(".", ",")} foi processado.`
                : "O prazo de confirmacao expirou e sua reserva foi cancelada.",
            tipo_evento: "PRESENCA_EXPIRADA",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: reserva.id_reserva, valor_reembolso: arredondarMoeda(totalReembolsado) },
        }),
        notificarRestaurante(reserva.id_restaurante, {
            titulo: "Reserva cancelada automaticamente",
            mensagem: "O cliente nao confirmou presenca dentro do prazo. A reserva e pedidos vinculados foram cancelados.",
            tipo_evento: "PRESENCA_EXPIRADA",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: reserva.id_reserva },
        }),
        notificarAdministradores({
            titulo: "Presenca expirada",
            mensagem: `Reserva #${reserva.id_reserva} cancelada automaticamente por falta de confirmacao de presenca.`,
            tipo_evento: "PRESENCA_EXPIRADA",
            link_destino: "/admin/financeiro",
            dados: { id_reserva: reserva.id_reserva, valor_reembolso: arredondarMoeda(totalReembolsado) },
        }),
    ]);
    return true;
}

async function cancelarReservasPendentesVencidas(agoraLocal, agoraIso) {
    const { data: reservasPendentes, error } = await supabaseAdmin
        .from("reservas")
        .select("id_reserva, id_cliente, id_restaurante, status_reserva, status_confirmacao_presenca, data_reserva, horario_inicio, horario_fim, prazo_confirmacao_presenca, valor_minimo_total")
        .eq("status_reserva", "PENDENTE");
    if (error) throw new Error(`Falha ao consultar reservas pendentes vencidas: ${error.message}`);

    let total = 0;
    for (const reserva of reservasPendentes ?? []) {
        const inicio = reservationStartDate(reserva);
        if (!inicio || agoraLocal.getTime() < inicio.getTime()) continue;
        try {
            if (await cancelarReservaSemConfirmacao(reserva, agoraIso, ["PENDENTE"])) total += 1;
        } catch (erro) {
            console.warn(`Falha ao cancelar reserva pendente ${reserva.id_reserva}:`, erro instanceof Error ? erro.message : erro);
        }
    }
    return total;
}

async function sincronizarReservasNaoComparecidas() {
    if (!supabaseAdmin) return 0;
    const agoraLocal = agoraLocalSaoPaulo();
    const agoraIso = new Date().toISOString();
    const { data: reservasPendentes, error: reservasError } = await supabaseAdmin
        .from("reservas")
        .select("id_reserva, id_cliente, id_restaurante, status_reserva, status_confirmacao_presenca, data_reserva, horario_inicio, horario_fim, prazo_confirmacao_presenca, valor_minimo_total")
        .eq("status_reserva", "CONFIRMADA")
        .eq("status_confirmacao_presenca", "PENDENTE");
    if (reservasError) throw new Error(`Falha ao consultar reservas com presenca pendente: ${reservasError.message}`);

    let total = 0;
    for (const reserva of reservasPendentes ?? []) {
        if (!attendanceConfirmationExpired(reserva, agoraLocal)) continue;
        try {
            if (await cancelarReservaSemConfirmacao(reserva, agoraIso)) total += 1;
        } catch (error) {
            console.warn(`Falha ao cancelar reserva ${reserva.id_reserva} por presenca expirada:`, error instanceof Error ? error.message : error);
        }
    }
    total += await cancelarReservasPendentesVencidas(agoraLocal, agoraIso);

    const { data, error } = await supabaseAdmin.rpc("expirar_reservas_nao_comparecidas");
    if (error) throw new Error(`Falha ao atualizar reservas vencidas: ${error.message}`);
    return total + Number(data ?? 0);
}

module.exports = { sincronizarReservasNaoComparecidas };
