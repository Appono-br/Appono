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
            { label: "Ticket medio", icon: "money", value: formatarMoedaResumo(calcularTicketMedio(pedidos30Dias)) },
            { label: "Clientes no periodo", icon: "user", value: obterClientesUnicos(reservas, pedidos30Dias) },
        ],
        serieReservas: montarSerieReservas(reservas, 7),
        proximosPedidos,
        produtoDestaque: produtoDestaqueResposta.data ?? null,
        pedidosAtivosCozinha: pedidosFilaCozinha.length,
    });
});
