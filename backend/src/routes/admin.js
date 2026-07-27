"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;

const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");

exports.adminRouter = (0, express_1.Router)();

function obterEmailsAdministradores() {
    return String(process.env.APPONO_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}

function usuarioEhAdministrador(user) {
    const email = String(user?.email ?? "").toLowerCase();
    return Boolean(email && obterEmailsAdministradores().includes(email));
}

function exigirAdmin(_req, res, next) {
    if (!usuarioEhAdministrador(res.locals.user)) {
        return res.status(403).json({ error: "Apenas administradores Appono podem acessar este recurso." });
    }
    next();
}

function obterPercentualComissaoAppono() {
    const percentual = Number(process.env.MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL ?? process.env.MERCADO_PAGO_MARKETPLACE_FEE ?? 13);
    return Number.isFinite(percentual) && percentual >= 0 ? percentual : 13;
}

exports.adminRouter.use(auth_1.requireAuth, exigirAdmin);

async function buscarPedidosPorPagamento(pagamentos) {
    const idsPedidos = [...new Set((pagamentos ?? [])
        .map((pagamento) => pagamento.id_pedido)
        .filter(Boolean))];
    if (!idsPedidos.length) {
        return new Map();
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from("pedidos")
        .select("id_pedido, id_restaurante, status_pedido, data_pedido, restaurantes(nome), clientes(nome), reservas(data_reserva, horario_inicio)")
        .in("id_pedido", idsPedidos);
    if (error) {
        throw new Error(error.message);
    }
    return new Map((data ?? []).map((pedido) => [pedido.id_pedido, pedido]));
}

async function buscarEventosFinanceiros() {
    const { data, error } = await supabase_1.supabaseAdmin
        .from("eventos_financeiros")
        .select("id_evento, id_pagamento, id_pedido, id_reserva, tipo_evento, descricao, valor, criado_em")
        .order("criado_em", { ascending: false })
        .limit(20);
    if (error) {
        console.warn("Falha ao consultar eventos financeiros:", error.message);
        return [];
    }
    return data ?? [];
}

async function buscarRestaurantesOperacao(pagamentosComPedido) {
    const { data: restaurantes, error } = await supabase_1.supabaseAdmin
        .from("restaurantes")
        .select("id_restaurante, nome, email, telefone, criado_em, mercado_pago_conexoes_restaurante(status, mercado_pago_user_id, live_mode, conectado_em, atualizado_em)")
        .order("nome", { ascending: true });
    if (error) {
        console.warn("Falha ao consultar restaurantes no admin:", error.message);
        return [];
    }
    const metricasPorRestaurante = new Map();
    for (const pagamento of pagamentosComPedido ?? []) {
        const restauranteId = pagamento.pedido?.id_restaurante;
        if (!restauranteId) {
            continue;
        }
        const atual = metricasPorRestaurante.get(restauranteId) ?? {
            pedidos_pagos: 0,
            valor_transacionado: 0,
            valor_retido: 0,
            valor_liberado: 0,
        };
        const foiCancelado = pagamento.status_repasse === "ESTORNADO" || pagamento.pedido?.status_pedido === "CANCELADO";
        if (!foiCancelado) {
            atual.pedidos_pagos += 1;
            atual.valor_transacionado += Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
            if (pagamento.status_repasse === "AGUARDANDO_ENTREGA") {
                atual.valor_retido += Number(pagamento.valor_restaurante ?? 0);
            }
            if (pagamento.status_repasse === "LIBERADO_PARA_REPASSE" || pagamento.status_repasse === "REPASSADO") {
                atual.valor_liberado += Number(pagamento.valor_restaurante ?? 0);
            }
        }
        metricasPorRestaurante.set(restauranteId, atual);
    }
    return (restaurantes ?? []).map((restaurante) => ({
        ...restaurante,
        conexao_mercado_pago: restaurante.mercado_pago_conexoes_restaurante?.[0] ?? null,
        mercado_pago_conexoes_restaurante: undefined,
        metricas: metricasPorRestaurante.get(restaurante.id_restaurante) ?? {
            pedidos_pagos: 0,
            valor_transacionado: 0,
            valor_retido: 0,
            valor_liberado: 0,
        },
    }));
}

exports.adminRouter.get("/financeiro/resumo", async (_req, res) => {
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    try {
        const { data: pagamentos, error } = await supabase_1.supabaseAdmin
            .from("pagamentos")
            .select("id_pagamento, id_pedido, valor_pago, valor, status_pagamento, tipo_fluxo_pagamento, percentual_comissao_app, valor_comissao_app, valor_restaurante, status_repasse, data_aprovacao, data_pagamento, atualizado_em")
            .eq("status_pagamento", "APROVADO")
            .order("atualizado_em", { ascending: false });
        if (error) {
            throw new Error(error.message);
        }
        const pedidosPorId = await buscarPedidosPorPagamento(pagamentos ?? []);
        const pagamentosComPedido = (pagamentos ?? []).map((pagamento) => ({
            ...pagamento,
            pedido: pedidosPorId.get(pagamento.id_pedido) ?? null,
        }));
        const resumo = pagamentosComPedido.reduce((acc, pagamento) => {
            const bruto = Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
            const comissao = Number(pagamento.valor_comissao_app ?? 0);
            const restaurante = Number(pagamento.valor_restaurante ?? 0);
            const foiCancelado = pagamento.status_repasse === "ESTORNADO" || pagamento.pedido?.status_pedido === "CANCELADO";
            acc.quantidade_pagamentos += 1;
            if (foiCancelado) {
                acc.valor_estornado += bruto;
                return acc;
            }
            acc.valor_transacionado += bruto;
            acc.receita_app += comissao;
            acc.valor_restaurantes += restaurante;
            if (pagamento.status_repasse === "AGUARDANDO_ENTREGA") {
                acc.valor_retido += restaurante;
                acc.pedidos_retidos += 1;
            }
            if (pagamento.status_repasse === "LIBERADO_PARA_REPASSE" || pagamento.status_repasse === "REPASSADO") {
                acc.valor_liberado += restaurante;
                acc.pedidos_liberados += 1;
            }
            return acc;
        }, {
            valor_transacionado: 0,
            receita_app: 0,
            valor_restaurantes: 0,
            valor_retido: 0,
            valor_liberado: 0,
            valor_estornado: 0,
            quantidade_pagamentos: 0,
            pedidos_retidos: 0,
            pedidos_liberados: 0,
        });
        const [eventos, restaurantes] = await Promise.all([
            buscarEventosFinanceiros(),
            buscarRestaurantesOperacao(pagamentosComPedido),
        ]);
        const suporte = {
            abertos: pagamentosComPedido.filter((pagamento) => pagamento.status_repasse === "AGUARDANDO_ENTREGA").length,
            prioridade: "Operacao financeira",
            descricao: "Acompanhamento administrativo de pagamentos, repasses e divergencias.",
            itens: pagamentosComPedido
                .filter((pagamento) => ["AGUARDANDO_ENTREGA", "ESTORNADO"].includes(pagamento.status_repasse) ||
                    pagamento.pedido?.status_pedido === "CANCELADO")
                .slice(0, 6)
                .map((pagamento) => ({
                id_pagamento: pagamento.id_pagamento,
                id_pedido: pagamento.id_pedido,
                restaurante: pagamento.pedido?.restaurantes?.nome ?? "Restaurante",
                cliente: pagamento.pedido?.clientes?.nome ?? "Cliente",
                status_repasse: pagamento.status_repasse,
                status_pedido: pagamento.pedido?.status_pedido,
                valor: pagamento.valor_restaurante ?? pagamento.valor_pago ?? pagamento.valor,
            })),
        };
        return res.json({
            resumo,
            pagamentos: pagamentosComPedido,
            eventos,
            restaurantes,
            politica_financeira: {
                percentual_comissao_app: obterPercentualComissaoAppono(),
                gatilho_repasse: "ENTREGA_DO_PEDIDO",
            },
            suporte,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Nao foi possivel consultar o financeiro administrativo." });
    }
});
