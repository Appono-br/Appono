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

function obterDataReferenciaPagamento(pagamento) {
    const valor = pagamento?.data_aprovacao ?? pagamento?.data_pagamento ?? pagamento?.atualizado_em;
    if (!valor) {
        return null;
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

function obterInicioPeriodo(periodo) {
    const agora = new Date();
    if (periodo === "hoje") {
        const inicio = new Date(agora);
        inicio.setHours(0, 0, 0, 0);
        return inicio;
    }
    if (periodo === "7d" || periodo === "30d") {
        const dias = periodo === "7d" ? 7 : 30;
        const inicio = new Date(agora);
        inicio.setDate(inicio.getDate() - (dias - 1));
        inicio.setHours(0, 0, 0, 0);
        return inicio;
    }
    return null;
}

function filtrarPagamentosPorPeriodo(pagamentos, periodo) {
    const inicio = obterInicioPeriodo(periodo);
    if (!inicio) {
        return pagamentos ?? [];
    }
    return (pagamentos ?? []).filter((pagamento) => {
        const data = obterDataReferenciaPagamento(pagamento);
        return data ? data >= inicio : false;
    });
}

function formatarChaveData(data) {
    return data.toISOString().slice(0, 10);
}

function criarSerieFinanceira(pagamentosComPedido, periodo) {
    const inicio = obterInicioPeriodo(periodo === "todos" ? "30d" : periodo);
    const base = inicio ?? obterInicioPeriodo("30d");
    const dias = periodo === "hoje" ? 1 : periodo === "7d" ? 7 : 30;
    const serie = new Map();
    for (let indice = 0; indice < dias; indice += 1) {
        const data = new Date(base);
        data.setDate(base.getDate() + indice);
        const chave = formatarChaveData(data);
        serie.set(chave, {
            data: chave,
            label: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            valor_transacionado: 0,
            receita_app: 0,
            valor_retido: 0,
            valor_liberado: 0,
            pedidos: 0,
        });
    }
    for (const pagamento of pagamentosComPedido ?? []) {
        const data = obterDataReferenciaPagamento(pagamento);
        if (!data) {
            continue;
        }
        const chave = formatarChaveData(data);
        if (!serie.has(chave)) {
            continue;
        }
        const foiCancelado = pagamento.status_repasse === "ESTORNADO" || pagamento.pedido?.status_pedido === "CANCELADO";
        if (foiCancelado) {
            continue;
        }
        const ponto = serie.get(chave);
        ponto.valor_transacionado += Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
        ponto.receita_app += Number(pagamento.valor_comissao_app ?? 0);
        if (pagamento.status_repasse === "AGUARDANDO_ENTREGA") {
            ponto.valor_retido += Number(pagamento.valor_restaurante ?? 0);
        }
        if (pagamento.status_repasse === "LIBERADO_PARA_REPASSE" || pagamento.status_repasse === "REPASSADO") {
            ponto.valor_liberado += Number(pagamento.valor_restaurante ?? 0);
        }
        ponto.pedidos += 1;
    }
    return [...serie.values()].map((ponto) => ({
        ...ponto,
        valor_transacionado: Math.round(ponto.valor_transacionado * 100) / 100,
        receita_app: Math.round(ponto.receita_app * 100) / 100,
        valor_retido: Math.round(ponto.valor_retido * 100) / 100,
        valor_liberado: Math.round(ponto.valor_liberado * 100) / 100,
    }));
}

async function contarRegistros(tabela) {
    const { count, error } = await supabase_1.supabaseAdmin
        .from(tabela)
        .select("*", { count: "exact", head: true });
    if (error) {
        console.warn(`Falha ao contar registros de ${tabela}:`, error.message);
        return 0;
    }
    return count ?? 0;
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
        .select("id_restaurante, nome, email, telefone")
        .order("nome", { ascending: true });
    if (error) {
        console.warn("Falha ao consultar restaurantes no admin:", error.message);
        return [];
    }
    const idsRestaurantes = (restaurantes ?? []).map((restaurante) => restaurante.id_restaurante);
    let conexoesPorRestaurante = new Map();
    if (idsRestaurantes.length) {
        const { data: conexoes, error: conexoesError } = await supabase_1.supabaseAdmin
            .from("mercado_pago_conexoes_restaurante")
            .select("id_restaurante, status, mercado_pago_user_id, live_mode, conectado_em, atualizado_em")
            .in("id_restaurante", idsRestaurantes);
        if (conexoesError) {
            console.warn("Falha ao consultar conexoes Mercado Pago no admin:", conexoesError.message);
        }
        else {
            conexoesPorRestaurante = new Map((conexoes ?? []).map((conexao) => [conexao.id_restaurante, conexao]));
        }
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
        conexao_mercado_pago: conexoesPorRestaurante.get(restaurante.id_restaurante) ?? null,
        metricas: metricasPorRestaurante.get(restaurante.id_restaurante) ?? {
            pedidos_pagos: 0,
            valor_transacionado: 0,
            valor_retido: 0,
            valor_liberado: 0,
        },
    }));
}

async function buscarMetricasGerais(restaurantes, pagamentosComPedido) {
    const [totalClientes, totalReservas, totalPedidos] = await Promise.all([
        contarRegistros("clientes"),
        contarRegistros("reservas"),
        contarRegistros("pedidos"),
    ]);
    const restaurantesConectados = (restaurantes ?? []).filter((restaurante) => restaurante.conexao_mercado_pago?.status === "CONECTADO").length;
    const pedidosAtivos = (pagamentosComPedido ?? []).filter((pagamento) => ["CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(pagamento.pedido?.status_pedido)).length;
    const pagamentosValidos = (pagamentosComPedido ?? []).filter((pagamento) => pagamento.status_repasse !== "ESTORNADO" &&
        pagamento.pedido?.status_pedido !== "CANCELADO");
    const ticketMedio = pagamentosValidos.length
        ? pagamentosValidos.reduce((total, pagamento) => total + Number(pagamento.valor_pago ?? pagamento.valor ?? 0), 0) / pagamentosValidos.length
        : 0;
    return {
        total_clientes: totalClientes,
        total_restaurantes: restaurantes?.length ?? 0,
        restaurantes_conectados: restaurantesConectados,
        total_reservas: totalReservas,
        total_pedidos: totalPedidos,
        pedidos_ativos: pedidosAtivos,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
    };
}

exports.adminRouter.get("/financeiro/resumo", async (req, res) => {
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
        const periodoSolicitado = String(req.query.periodo ?? "30d");
        const periodo = ["hoje", "7d", "30d", "todos"].includes(periodoSolicitado) ? periodoSolicitado : "30d";
        const pagamentosPeriodo = filtrarPagamentosPorPeriodo(pagamentos ?? [], periodo);
        const pedidosPorId = await buscarPedidosPorPagamento(pagamentosPeriodo ?? []);
        const pagamentosComPedido = (pagamentosPeriodo ?? []).map((pagamento) => ({
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
        const metricas_gerais = await buscarMetricasGerais(restaurantes, pagamentosComPedido);
        const serie_financeira = criarSerieFinanceira(pagamentosComPedido, periodo);
        const pendencias = {
            abertos: pagamentosComPedido.filter((pagamento) => pagamento.status_repasse === "AGUARDANDO_ENTREGA").length,
            prioridade: "Operação financeira",
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
            metricas_gerais,
            pagamentos: pagamentosComPedido,
            eventos,
            restaurantes,
            serie_financeira,
            periodo: {
                ativo: periodo,
                inicio: obterInicioPeriodo(periodo)?.toISOString() ?? null,
            },
            politica_financeira: {
                percentual_comissao_app: obterPercentualComissaoAppono(),
                gatilho_repasse: "ENTREGA_DO_PEDIDO",
            },
            suporte: pendencias,
            pendencias,
        });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível consultar o financeiro administrativo." });
    }
});
