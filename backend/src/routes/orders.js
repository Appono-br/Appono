"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const mercado_pago_1 = require("../services/pagamentos/mercado-pago");
exports.ordersRouter = (0, express_1.Router)();
exports.ordersRouter.use(auth_1.requireAuth);

const LIMITE_UNIDADES_POR_ITEM = 10;

function obterStatusPedidoPorPagamento(statusPagamento) {
    if (statusPagamento === "APROVADO") {
        return "CONFIRMADO";
    }
    if (statusPagamento === "RECUSADO") {
        return "CANCELADO";
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
    return ["MARKETPLACE_REAL", "REAL", "PRODUCAO"].includes(obterModoRepasseMercadoPago());
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
    }
    if (!pedidosAtualizados.size) {
        return pedidos;
    }
    return pedidos.map((pedido) => pedidosAtualizados.has(pedido.id_pedido)
        ? { ...pedido, ...pedidosAtualizados.get(pedido.id_pedido) }
        : pedido);
}

exports.ordersRouter.get("/", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data, error } = await supabase
        .from("pedidos")
        .select("*, restaurantes(nome), reservas(data_reserva, horario_inicio)")
        .order("data_pedido", { ascending: false });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const pedidos = await conciliarPedidosPendentes(data ?? []);
    const idsPedidos = pedidos.map((pedido) => pedido.id_pedido);
    if (!idsPedidos.length) {
        return res.json(pedidos);
    }
    const clienteItens = supabase_1.supabaseAdmin ?? supabase;
    const { data: itens, error: itensError } = await clienteItens
        .from("itens_pedido")
        .select("id_pedido, quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos), item_adicional(*, adicionais(nome))")
        .in("id_pedido", idsPedidos);
    if (itensError) {
        return res.json(pedidos.map((pedido) => ({ ...pedido, itens_pedido: [] })));
    }
    return res.json(pedidos.map((pedido) => ({
        ...pedido,
        itens_pedido: (itens ?? []).filter((item) => item.id_pedido === pedido.id_pedido),
    })));
});
exports.ordersRouter.post("/", async (req, res) => {
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
    const { data, error } = await supabase.rpc("criar_pedido_antecipado", {
        reserva_id: body.id_reserva,
        itens: itensNormalizados,
        observacoes_cliente: body.observacoes ?? null,
    });
    if (error) {
        const mensagem = error.message.includes("ja possui um pedido ativo")
            ? "Esta reserva ja possui um pedido antecipado ativo."
            : error.message.includes("produtos sao invalidos") || error.message.includes("indisponiveis")
                ? "Um ou mais itens do cardapio ficaram indisponiveis. Atualize a pagina e escolha novamente."
                : error.message.includes("reserva iniciada")
                    ? "Nao e possivel criar pedido para uma reserva que ja iniciou."
                    : error.message.includes("reserva confirmada")
                        ? "O pedido antecipado exige uma reserva confirmada."
                        : error.message.includes("consumo minimo")
                            ? "O pedido precisa atingir o consumo minimo da reserva."
                            : error.message;
        return res.status(409).json({ error: mensagem });
    }
    return res.status(201).json(data);
});
exports.ordersRouter.patch("/:id/cancelar", async (req, res) => {
    const orderId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(orderId)) {
        return res.status(400).json({ error: "Pedido invalido." });
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
        return res.status(403).json({ error: "Apenas o cliente pode cancelar o proprio pedido." });
    }
    const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_cliente, status_pedido, reservas(data_reserva, horario_inicio)")
        .eq("id_pedido", orderId)
        .eq("id_cliente", cliente.id_cliente)
        .maybeSingle();
    if (pedidoError) {
        return res.status(400).json({ error: pedidoError.message });
    }
    if (!pedido) {
        return res.status(404).json({ error: "Pedido nao encontrado." });
    }
    if (!["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido)) {
        return res.status(409).json({
            error: "O pedido nao pode ser cancelado porque o preparo ja foi iniciado.",
        });
    }
    const dataReserva = pedido.reservas?.data_reserva;
    const horarioReserva = pedido.reservas?.horario_inicio;
    if (dataReserva && horarioReserva) {
        const dataHoraReserva = new Date(`${dataReserva}T${horarioReserva}`);
        const limiteCancelamento = new Date(dataHoraReserva.getTime() - 30 * 60 * 1000);
        if (new Date() > limiteCancelamento) {
            return res.status(409).json({
                error: "O pedido so pode ser cancelado ate 30 minutos antes da reserva.",
            });
        }
    }
    if (supabase_1.supabaseAdmin) {
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
            descricao: "Repasse marcado como estornado apos cancelamento do pedido.",
            valor: pagamentosCancelados?.[0]?.valor_restaurante ?? null,
        });
        return res.json(data);
    }
    const { data, error } = await supabase.rpc("cancelar_pedido_proprio", {
        pedido_id: orderId,
    });
    if (error) {
        const mensagem = error.message.includes("30 minutos")
            ? "O pedido so pode ser cancelado ate 30 minutos antes da reserva."
            : error.message.includes("nao pode mais ser cancelado")
                ? "Este pedido nao pode mais ser cancelado."
                : error.message;
        return res.status(409).json({ error: mensagem });
    }
    return res.json(data);
});
exports.ordersRouter.patch("/:id/status", async (req, res) => {
    const orderId = Number(req.params.id);
    const { status_pedido } = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const statusesPermitidos = ["CONFIRMADO", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"];
    if (!Number.isFinite(orderId) || !status_pedido || !statusesPermitidos.includes(status_pedido)) {
        return res.status(400).json({ error: "Status do pedido invalido." });
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
                ? "Repasse liberado apos confirmacao de entrega do pedido."
                : "Repasse estornado apos cancelamento do pedido.",
            valor: pagamentosAfetados?.[0]?.valor_restaurante ?? null,
        });
    }
    return res.json(data);
});
