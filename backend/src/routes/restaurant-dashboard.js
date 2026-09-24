"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.restaurantDashboardRouter = void 0;

const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const { ordenarPorHorarioReserva, pedidoEstaNaFilaOperacional } = require("../domain/operational-queue");

exports.restaurantDashboardRouter = (0, express_1.Router)();
exports.restaurantDashboardRouter.use(auth_1.requireAuth);

const STATUS_PEDIDOS_PAGOS_ATIVOS = ["CONFIRMADO", "EM_PREPARO", "PRONTO"];

function formatarMoedaResumo(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    }).format(Number(valor ?? 0));
}

function obterDataLocalISO(data = new Date()) {
    return new Date(data.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
        .toISOString()
        .slice(0, 10);
}

function obterDataPedido(pedido) {
    const valor = pedido.data_pedido ?? pedido.criado_em ?? pedido.created_at;
    if (!valor) {
        return null;
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

function dataEstaNoPeriodo(data, dias) {
    const dataReferencia = data instanceof Date ? data : new Date(data);
    if (Number.isNaN(dataReferencia.getTime())) {
        return false;
    }
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return dataReferencia >= limite;
}

function obterPedidosNoPeriodo(pedidos, dias) {
    return (pedidos ?? []).filter((pedido) => {
        const data = obterDataPedido(pedido);
        return data ? dataEstaNoPeriodo(data, dias) : false;
    });
}

function calcularTicketMedio(pedidos) {
    const pedidosValidos = (pedidos ?? []).filter((pedido) => !["CANCELADO", "PENDENTE"].includes(pedido.status_pedido));
    if (!pedidosValidos.length) {
        return 0;
    }
    const total = pedidosValidos.reduce((soma, pedido) => soma + Number(pedido.valor_total ?? 0), 0);
    return total / pedidosValidos.length;
}

function obterClientesUnicos(reservas, pedidos) {
    const ids = new Set();
    for (const reserva of reservas ?? []) {
        if (reserva.id_cliente) {
            ids.add(`reserva-${reserva.id_cliente}`);
        }
    }
    for (const pedido of pedidos ?? []) {
        if (pedido.id_cliente) {
            ids.add(`pedido-${pedido.id_cliente}`);
        }
    }
    return ids.size;
}

function montarSerieReservas(reservas, dias = 7) {
    const hoje = new Date(`${obterDataLocalISO()}T12:00:00`);
    const pontos = [];
    for (let indice = dias - 1; indice >= 0; indice -= 1) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - indice);
        const iso = data.toISOString().slice(0, 10);
        pontos.push({
            data: iso,
            label: data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
            valor: (reservas ?? []).filter((reserva) => reserva.data_reserva === iso).length,
        });
    }
    return pontos;
}

function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };
    return statusMap[status] ?? status;
}

exports.restaurantDashboardRouter.get("/dashboard/resumo", async (_req, res) => {
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
        return res.status(403).json({ error: "Apenas restaurantes podem consultar o resumo do dashboard." });
    }

    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const [reservasResposta, pedidosResposta, produtoDestaqueResposta] = await Promise.all([
        clienteBanco
            .from("reservas")
            .select("id_reserva, id_cliente, id_restaurante, data_reserva, horario_inicio, quantidade_pessoas, status_reserva, clientes(nome, telefone), mesas(numero_mesa, capacidade)")
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("ocultada_restaurante", false)
            .order("data_reserva", { ascending: true })
            .order("horario_inicio", { ascending: true }),
        clienteBanco
            .from("pedidos")
            .select("id_pedido, id_reserva, id_cliente, id_restaurante, status_pedido, valor_total, data_pedido, horario_entrega_previsto, iniciar_preparo_em, observacoes, ocultado_cozinha, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos)), reservas(data_reserva, horario_inicio, status_reserva, status_confirmacao_presenca, clientes(nome))")
            .eq("id_restaurante", restaurante.id_restaurante)
            .order("data_pedido", { ascending: false }),
        clienteBanco
            .from("produtos")
            .select("id_produto, nome, descricao, preco, tempo_preparo_minutos, imagem_url")
            .eq("id_restaurante", restaurante.id_restaurante)
            .eq("destaque", true)
            .eq("disponivel", true)
            .eq("arquivado", false)
            .order("ordem_exibicao", { ascending: true })
            .limit(1)
            .maybeSingle(),
    ]);

    if (reservasResposta.error) {
        return res.status(400).json({ error: reservasResposta.error.message });
    }
    if (pedidosResposta.error) {
        return res.status(400).json({ error: pedidosResposta.error.message });
    }
    if (produtoDestaqueResposta.error) {
        return res.status(400).json({ error: produtoDestaqueResposta.error.message });
    }

    const reservas = reservasResposta.data ?? [];
    const pedidos = pedidosResposta.data ?? [];
    const pedidos30Dias = obterPedidosNoPeriodo(pedidos, 30);
    const hoje = obterDataLocalISO();
    const reservasHoje = reservas.filter((reserva) => reserva.data_reserva === hoje);
    const pedidosAtivos = pedidos.filter((pedido) =>
        STATUS_PEDIDOS_PAGOS_ATIVOS.includes(pedido.status_pedido) &&
        pedido.ocultado_cozinha !== true,
    );
    const pedidosFilaCozinha = pedidos
        .filter((pedido) =>
            STATUS_PEDIDOS_PAGOS_ATIVOS.includes(pedido.status_pedido) &&
            pedidoEstaNaFilaOperacional(pedido),
        )
        .sort(ordenarPorHorarioReserva);
    const proximosPedidos = pedidosFilaCozinha
        .filter((pedido) => pedido.ocultado_cozinha !== true)
        .slice(0, 3)
        .map((pedido) => ({
            id_pedido: pedido.id_pedido,
            status_pedido: pedido.status_pedido,
            status_formatado: obterStatusPedido(pedido.status_pedido),
            valor_total: pedido.valor_total,
            itens_pedido: pedido.itens_pedido ?? [],
            reserva: {
                data_reserva: pedido.reservas?.data_reserva ?? "--",
                horario_inicio: pedido.reservas?.horario_inicio ?? "--:--",
                clientes: pedido.reservas?.clientes ?? null,
            },
        }));

    return res.json({
        metricas: [
            { label: "Pedidos ativos", icon: "orders", value: pedidosAtivos.length },
            { label: "Reservas hoje", icon: "seat", value: reservasHoje.length, highlighted: true },
            { label: "Ticket médio", icon: "money", value: formatarMoedaResumo(calcularTicketMedio(pedidos30Dias)) },
            { label: "Clientes no período", icon: "user", value: obterClientesUnicos(reservas, pedidos30Dias) },
        ],
        serieReservas: montarSerieReservas(reservas, 7),
        proximosPedidos,
        produtoDestaque: produtoDestaqueResposta.data ?? null,
        pedidosAtivosCozinha: pedidosFilaCozinha.length,
    });
});

exports.restaurantDashboardRouter.get("/desempenho", async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: restaurante } = await supabase.from("restaurantes").select("id_restaurante").eq("id_auth", res.locals.user.id).maybeSingle();
    if (!restaurante) return res.status(403).json({ code: "RESTAURANT_REQUIRED", error: "Este relatório está disponível apenas para restaurantes." });
    const dias = [7, 30, 90].includes(Number(req.query.dias)) ? Number(req.query.dias) : 30;
    const inicio = new Date(); inicio.setDate(inicio.getDate() - (dias - 1));
    const dataInicio = obterDataLocalISO(inicio);
    const banco = supabase_1.supabaseAdmin ?? supabase;
    const [reservasR, pedidosR, avaliacoesR] = await Promise.all([
        banco.from("reservas").select("id_reserva, status_reserva, status_confirmacao_presenca, data_reserva").eq("id_restaurante", restaurante.id_restaurante).gte("data_reserva", dataInicio),
        banco.from("pedidos").select("id_pedido, status_pedido, valor_total, data_pedido").eq("id_restaurante", restaurante.id_restaurante).gte("data_pedido", `${dataInicio}T00:00:00-03:00`),
        banco.from("avaliacoes_restaurante").select("nota, created_at").eq("id_restaurante", restaurante.id_restaurante).gte("created_at", `${dataInicio}T00:00:00-03:00`),
    ]);
    const falha = [reservasR, pedidosR, avaliacoesR].find((item) => item.error);
    if (falha) return res.status(400).json({ code: "PERFORMANCE_QUERY_FAILED", error: "Não foi possível calcular o desempenho agora." });
    const reservas = reservasR.data ?? []; const pedidos = pedidosR.data ?? []; const avaliacoes = avaliacoesR.data ?? [];
    const contar = (lista, campo, valores) => lista.filter((item) => valores.includes(item[campo])).length;
    const reservasCanceladas = contar(reservas, "status_reserva", ["CANCELADA", "CANCELADO"]);
    const reservasConcluidas = contar(reservas, "status_reserva", ["CONCLUIDA", "CONCLUIDO", "FINALIZADA"]);
    const naoComparecimentos = reservas.filter((item) => ["NAO_COMPARECEU", "AUSENTE"].includes(item.status_confirmacao_presenca)).length;
    const pedidosValidos = pedidos.filter((item) => !["CANCELADO", "PENDENTE"].includes(item.status_pedido));
    const bruto = pedidosValidos.reduce((total, item) => total + Number(item.valor_total ?? 0), 0);
    const serie = new Map();
    for (const reserva of reservas) serie.set(reserva.data_reserva, { data: reserva.data_reserva, reservas: (serie.get(reserva.data_reserva)?.reservas ?? 0) + 1, pedidos: serie.get(reserva.data_reserva)?.pedidos ?? 0 });
    for (const pedido of pedidos) { const data = String(pedido.data_pedido ?? "").slice(0, 10); const atual = serie.get(data) ?? { data, reservas: 0, pedidos: 0 }; atual.pedidos += 1; serie.set(data, atual); }
    return res.json({ periodo: { dias, inicio: dataInicio, fuso: "America/Sao_Paulo" }, possui_amostra: reservas.length + pedidos.length + avaliacoes.length > 0,
        reservas: { criadas: reservas.length, confirmadas: contar(reservas, "status_reserva", ["CONFIRMADA", "CONFIRMADO"]), concluidas: reservasConcluidas, canceladas: reservasCanceladas, nao_comparecimentos: naoComparecimentos, taxa_conclusao: reservas.length ? Number((reservasConcluidas / reservas.length * 100).toFixed(1)) : null, taxa_cancelamento: reservas.length ? Number((reservasCanceladas / reservas.length * 100).toFixed(1)) : null },
        pedidos: { criados: pedidos.length, confirmados: contar(pedidos, "status_pedido", ["PAGO", "CONFIRMADO"]), em_preparo: contar(pedidos, "status_pedido", ["EM_PREPARO", "PRONTO"]), entregues: contar(pedidos, "status_pedido", ["ENTREGUE"]), cancelados: contar(pedidos, "status_pedido", ["CANCELADO"]), faturamento_bruto: Number(bruto.toFixed(2)), ticket_medio: pedidosValidos.length ? Number((bruto / pedidosValidos.length).toFixed(2)) : null },
        avaliacoes: { media: avaliacoes.length ? Number((avaliacoes.reduce((s, a) => s + Number(a.nota), 0) / avaliacoes.length).toFixed(1)) : null, quantidade: avaliacoes.length }, serie: [...serie.values()].sort((a, b) => a.data.localeCompare(b.data)) });
});
