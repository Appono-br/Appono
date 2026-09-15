"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const notificacoes_1 = require("../services/notificacoes");
const { sincronizarReservasNaoComparecidas } = require("../services/reservas/expiracao");
const { refundApprovedPayments } = require("../services/pagamentos/refund");
const paymentConfig = require("../services/pagamentos/config");
const { ordenarPorHorarioReserva, reservaEstaNaFilaOperacional } = require("../domain/operational-queue");
const {
    attendanceConfirmationDeadline,
    attendanceConfirmationEligibility,
    apponoCommissionPercentage,
    calculateAttendanceRefundPolicy,
    restaurantCancellationEligibility,
} = require("../domain/reservation-time");
exports.reservationsRouter = (0, express_1.Router)();
exports.reservationsRouter.use(auth_1.requireAuth);
const LIMITE_UNIDADES_POR_ITEM = 10;

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

function normalizarItensPedido(itens = []) {
    const itensRecebidos = itens.map((item) => ({
        id_produto: Number(item.id_produto),
        quantidade: Number(item.quantidade),
        observacoes: typeof item.observacoes === "string" ? item.observacoes.trim().slice(0, 180) : null,
    }));
    const itemInvalido = itensRecebidos.some((item) => !Number.isInteger(item.id_produto) ||
        item.id_produto <= 0 ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade <= 0);
    if (itemInvalido) {
        throw new Error(`Cada item do pedido deve ter entre 1 e ${LIMITE_UNIDADES_POR_ITEM} unidades.`);
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
        throw new Error(`Cada item do pedido deve ter no maximo ${LIMITE_UNIDADES_POR_ITEM} unidades.`);
    }
    return itensNormalizados;
}

function mapearErroReservaPedido(mensagem) {
    if (mensagem.includes("Não há mesa disponível")) {
        return "Não há mesa disponível para este horário e quantidade de pessoas.";
    }
    if (mensagem.includes("Cliente já possui reserva ativa neste horário")) {
        return "Você já possui uma reserva ativa nesse dia e horário.";
    }
    if (mensagem.includes("ainda não configurou horários")) {
        return "Este restaurante ainda não configurou horários de funcionamento para receber reservas.";
    }
    if (mensagem.includes("fechado nesta data")) {
        return "Este restaurante está fechado na data escolhida.";
    }
    if (mensagem.includes("antecedência mínima")) {
        return "Este horário não respeita a antecedência mínima configurada pelo restaurante.";
    }
    if (mensagem.includes("fora do funcionamento")) {
        return "Este horário está fora do funcionamento do restaurante.";
    }
    if (mensagem.includes("ja possui um pedido ativo")) {
        return "Esta reserva já possui um pedido antecipado ativo.";
    }
    if (mensagem.includes("produtos sao inválidos") || mensagem.includes("indisponíveis")) {
        return "Um ou mais itens do cardápio ficaram indisponíveis. Atualize a página e escolha novamente.";
    }
    if (mensagem.includes("reserva iniciada")) {
        return "Não é possível criar pedido para uma reserva que já iniciou.";
    }
    if (mensagem.includes("consumo mínimo")) {
        return "O pedido precisa atingir o consumo mínimo da reserva.";
    }
    return mensagem;
}

function ordenarPorExibicaoENome(a, b) {
    const ordemA = Number(a.ordem_exibicao ?? 0);
    const ordemB = Number(b.ordem_exibicao ?? 0);
    if (ordemA !== ordemB) {
        return ordemA - ordemB;
    }
    return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}
function organizarCardapios(cardapios) {
    return (cardapios ?? []).map((cardapio) => ({
        ...cardapio,
        categorias: (cardapio.categorias ?? [])
            .filter((categoria) => categoria.ativo !== false && categoria.arquivado !== true)
            .sort(ordenarPorExibicaoENome)
            .map((categoria) => ({
                ...categoria,
                produtos: (categoria.produtos ?? [])
                    .filter((produto) => produto.disponivel === true && produto.arquivado !== true)
                    .sort(ordenarPorExibicaoENome),
            }))
            .filter((categoria) => categoria.produtos.length > 0),
    }));
}
function obterDataLocalSaoPaulo() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}
function obterDataHoraLocal(data, horario) {
    return new Date(`${data}T${String(horario ?? "").slice(0, 8)}`);
}

function arredondarMoeda(valor) {
    return Math.round(Number(valor ?? 0) * 100) / 100;
}

function obterMensagemErroConfirmacaoPresenca(reason) {
    const mensagens = {
        RESERVA_NAO_ENCONTRADA: "Reserva não encontrada.",
        STATUS_INVALIDO: "A confirmação de presença está disponível apenas para reservas confirmadas.",
        JA_RESPONDIDA: "Esta reserva já teve ausencia confirmada e não pode ser alterada.",
        HORARIO_INVALIDO: "Horário da reserva inválido para confirmação de presença.",
        PRAZO_ENCERRADO: "O prazo para confirmar presença encerrou 1 hora antes da reserva.",
    };
    return mensagens[reason] ?? "Não foi possível atualizar a confirmação de presença.";
}

exports.reservationsRouter.get("/", async (req, res) => {
    try {
        await sincronizarReservasNaoComparecidas();
    } catch (error) {
        return res.status(503).json({ error: error instanceof Error ? error.message : "Não foi possível atualizar as reservas vencidas." });
    }
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: cliente } = await supabase
        .from("clientes")
        .select("id_cliente")
        .maybeSingle();
    const { data: restaurante, error: restauranteError } = cliente ? { data: null, error: null } : await supabase
        .from("restaurantes")
        .select("id_restaurante")
        .eq("id_auth", res.locals.user.id)
        .maybeSingle();
    if (restauranteError) {
        return res.status(400).json({ error: restauranteError.message });
    }
    if (!cliente && !restaurante) {
        return res.status(403).json({ error: "Perfil não encontrado para consultar reservas." });
    }
    const clienteBanco = cliente ? supabase : (supabase_1.supabaseAdmin ?? supabase);
    const colunaOcultacao = cliente ? "ocultada_cliente" : "ocultada_restaurante";
    let consultaReservas = clienteBanco
        .from("reservas")
        .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
        .eq(colunaOcultacao, false)
        .order("data_reserva", { ascending: true })
        .order("horario_inicio", { ascending: true });
    if (restaurante) {
        consultaReservas = consultaReservas.eq("id_restaurante", restaurante.id_restaurante);
    }
    const { data, error } = await consultaReservas;
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const somenteFilaOperacional = !cliente && String(req.query?.fila ?? "").toLowerCase() === "operacional";
    const reservas = somenteFilaOperacional
        ? (data ?? []).filter((reserva) => reservaEstaNaFilaOperacional(reserva)).sort(ordenarPorHorarioReserva)
        : data ?? [];
    const idsReservas = reservas.map((reserva) => reserva.id_reserva);
    if (!idsReservas.length) {
        return res.json(reservas);
    }
    const clientePedidos = cliente ? (supabase_1.supabaseAdmin ?? supabase) : clienteBanco;
    const { data: pedidos, error: pedidosError } = await clientePedidos
        .from("pedidos")
        .select("id_pedido, id_reserva, status_pedido, valor_total, horario_entrega_previsto, iniciar_preparo_em, ocultado_cozinha, ocultado_cozinha_em, observacoes, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .in("id_reserva", idsReservas);
    if (pedidosError) {
        return res.json(reservas.map((reserva) => ({ ...reserva, pedidos: [] })));
    }
    return res.json(reservas.map((reserva) => ({
        ...reserva,
        pedidos: (pedidos ?? []).filter((pedido) => pedido.id_reserva === reserva.id_reserva),
    })));
});
exports.reservationsRouter.patch("/:id/ocultar", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    await sincronizarReservasNaoComparecidas().catch(() => null);
    const { data, error } = await supabase.rpc("ocultar_reserva_do_historico", {
        reserva_id: reservationId,
    });
    if (error) {
        if (!supabase_1.supabaseAdmin) {
            return res.status(409).json({
                error: "Apenas reservas canceladas ou finalizadas podem ser excluídas da lista.",
            });
        }
        const { data: cliente } = await supabase_1.supabaseAdmin
            .from("clientes")
            .select("id_cliente")
            .eq("id_auth", res.locals.user.id)
            .maybeSingle();
        const { data: restaurante } = await supabase_1.supabaseAdmin
            .from("restaurantes")
            .select("id_restaurante")
            .eq("id_auth", res.locals.user.id)
            .maybeSingle();
        const statusOcultaveis = ["CANCELADA", "RECUSADA", "CONCLUIDA", "NAO_COMPARECEU"];
        let consulta;
        if (cliente) {
            consulta = supabase_1.supabaseAdmin
                .from("reservas")
                .update({ ocultada_cliente: true })
                .eq("id_reserva", reservationId)
                .eq("id_cliente", cliente.id_cliente)
                .in("status_reserva", statusOcultaveis)
                .select("*")
                .single();
        }
        else if (restaurante) {
            consulta = supabase_1.supabaseAdmin
                .from("reservas")
                .update({ ocultada_restaurante: true })
                .eq("id_reserva", reservationId)
                .eq("id_restaurante", restaurante.id_restaurante)
                .in("status_reserva", statusOcultaveis)
                .select("*")
                .single();
        }
        else {
            return res.status(403).json({ error: "Perfil não encontrado para excluir a reserva da lista." });
        }
        const { data: reservaOcultada, error: fallbackError } = await consulta;
        if (fallbackError || !reservaOcultada) {
            return res.status(409).json({
                error: "Apenas reservas canceladas ou finalizadas podem ser excluídas da lista.",
            });
        }
        return res.json(reservaOcultada);
    }
    return res.json(data);
});
exports.reservationsRouter.post("/", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    const body = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!body.id_restaurante ||
        !body.data_reserva ||
        !body.horario_inicio ||
        !body.horario_fim ||
        !body.quantidade_pessoas) {
        return res.status(400).json({ error: "Dados da reserva incompletos." });
    }
    const { data, error } = await supabase.rpc("criar_reserva_com_mesa_disponivel", {
        restaurante_id: body.id_restaurante,
        data_escolhida: body.data_reserva,
        inicio: body.horario_inicio,
        fim: body.horario_fim,
        pessoas: body.quantidade_pessoas,
        observacoes_cliente: body.observacoes ?? null,
    });
    if (error) {
        const mensagem = mapearErroReservaPedido(error.message);
        return res.status(409).json({ error: mensagem });
    }
    const clienteAtualizacao = supabase_1.supabaseAdmin ?? supabase;
    const { data: reservaConfirmada, error: atualizacaoError } = await clienteAtualizacao
        .from("reservas")
        .update({ status_reserva: "CONFIRMADA" })
        .eq("id_reserva", data.id_reserva)
        .select("*")
        .single();
    if (atualizacaoError) {
        return res.status(400).json({
            error: "A reserva foi criada, mas não foi possível confirma-la.",
        });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(reservaConfirmada.id_cliente, {
            titulo: "Reserva confirmada",
            mensagem: "Sua reserva foi confirmada. Agora você já pode acompanhar ou antecipar seu pedido.",
            tipo_evento: "RESERVA_CONFIRMADA",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: reservaConfirmada.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(reservaConfirmada.id_restaurante, {
            titulo: "Nova reserva recebida",
            mensagem: `Uma reserva para ${reservaConfirmada.quantidade_pessoas} pessoa(s) foi registrada na sua agenda.`,
            tipo_evento: "NOVA_RESERVA",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: reservaConfirmada.id_reserva },
        }),
    ]);
    return res.status(201).json(reservaConfirmada);
});
exports.reservationsRouter.post("/com-pedido", async (req, res) => {
    const body = req.body;
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!body.id_restaurante ||
        !body.data_reserva ||
        !body.horario_inicio ||
        !body.horario_fim ||
        !body.quantidade_pessoas ||
        !body.itens?.length) {
        return res.status(400).json({ error: "Dados da reserva com pedido incompletos." });
    }
    if (!(await restaurantePodeReceberPedidoPago(Number(body.id_restaurante)))) {
        return res.status(409).json({
            error: "Este restaurante ainda não conectou uma conta Mercado Pago e não pode receber pedidos antecipados pagos.",
        });
    }
    let itensNormalizados;
    try {
        itensNormalizados = normalizarItensPedido(body.itens);
    }
    catch (erro) {
        return res.status(400).json({ error: erro instanceof Error ? erro.message : "Itens do pedido inválidos." });
    }
    const { data, error } = await supabase.rpc("criar_reserva_com_pedido_antecipado", {
        restaurante_id: body.id_restaurante,
        data_escolhida: body.data_reserva,
        inicio: body.horario_inicio,
        fim: body.horario_fim,
        pessoas: body.quantidade_pessoas,
        observacoes_reserva: body.observacoes_reserva ?? null,
        itens: itensNormalizados,
        observacoes_pedido: body.observacoes_pedido ?? null,
    });
    if (error) {
        return res.status(409).json({ error: mapearErroReservaPedido(error.message) });
    }
    const reservaCriada = data?.reserva;
    const pedidoCriado = data?.pedido;
    if (!reservaCriada?.id_reserva || !pedidoCriado?.id_pedido) {
        return res.status(400).json({ error: "A reserva e o pedido foram processados, mas a resposta veio incompleta." });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(reservaCriada.id_cliente, {
            titulo: "Reserva aguardando pagamento",
            mensagem: "Sua reserva foi registrada e será confirmada assim que o pagamento do pedido antecipado for aprovado.",
            tipo_evento: "RESERVA_AGUARDANDO_PAGAMENTO",
            link_destino: `/cliente/pagamentos/pedido/${pedidoCriado.id_pedido}`,
            dados: { id_reserva: reservaCriada.id_reserva, id_pedido: pedidoCriado.id_pedido },
        }),
        (0, notificacoes_1.notificarRestaurante)(reservaCriada.id_restaurante, {
            titulo: "Reserva aguardando pagamento",
            mensagem: "Uma reserva com pedido antecipado foi iniciada e aparecerá na operação após o pagamento.",
            tipo_evento: "RESERVA_AGUARDANDO_PAGAMENTO",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: reservaCriada.id_reserva, id_pedido: pedidoCriado.id_pedido },
        }),
        (0, notificacoes_1.notificarCliente)(pedidoCriado.id_cliente, {
            titulo: "Pedido antecipado criado",
            mensagem: "Seu pedido foi registrado e ficará vinculado a sua reserva após o pagamento.",
            tipo_evento: "PEDIDO_CRIADO",
            link_destino: "/cliente/detalhes-pedido",
            dados: { id_pedido: pedidoCriado.id_pedido, id_reserva: reservaCriada.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(pedidoCriado.id_restaurante, {
            titulo: "Novo pedido antecipado",
            mensagem: "Um cliente registrou um pedido antecipado vinculado a uma reserva.",
            tipo_evento: "PEDIDO_CRIADO",
            link_destino: "/restaurante/pedidos",
            dados: { id_pedido: pedidoCriado.id_pedido, id_reserva: reservaCriada.id_reserva },
        }),
    ]);
    return res.status(201).json({ reserva: reservaCriada, pedido: pedidoCriado });
});
exports.reservationsRouter.get("/:id/cardapio", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const { data: reserva, error: reservaError } = await supabase
        .from("reservas")
        .select("id_reserva, id_restaurante, data_reserva, horario_inicio, status_reserva, valor_minimo_total, restaurantes(nome)")
        .eq("id_reserva", reservationId)
        .maybeSingle();
    if (reservaError) {
        return res.status(400).json({ error: reservaError.message });
    }
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada." });
    }
    const { data: pedidos } = await supabase
        .from("pedidos")
        .select("id_pedido, id_reserva, status_pedido, valor_total, horario_entrega_previsto, iniciar_preparo_em, ocultado_cozinha, ocultado_cozinha_em, observacoes, itens_pedido(quantidade, preco_unitario, observacoes, produtos(nome, descricao, imagem_url, tempo_preparo_minutos))")
        .eq("id_reserva", reservationId);
    const { data: cardapios, error: cardapiosError } = await supabase
        .from("cardapios")
        .select("id_cardapio, nome, descricao, categorias(id_categoria, nome, ativo, arquivado, ordem_exibicao, produtos(id_produto, nome, descricao, tempo_preparo_minutos, preco, imagem_url, disponivel, arquivado, ordem_exibicao))")
        .eq("id_restaurante", reserva.id_restaurante)
        .eq("ativo", true)
        .eq("categorias.ativo", true)
        .eq("categorias.arquivado", false)
        .eq("categorias.produtos.disponivel", true)
        .eq("categorias.produtos.arquivado", false)
        .order("nome");
    if (cardapiosError) {
        return res.status(400).json({ error: cardapiosError.message });
    }
    return res.json({ reserva: { ...reserva, pedidos: pedidos ?? [] }, cardapios: organizarCardapios(cardapios) });
});
exports.reservationsRouter.patch("/:id/presenca", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    await sincronizarReservasNaoComparecidas().catch(() => null);
    const reservationId = Number(req.params.id);
    const acao = String(req.body?.acao ?? "").trim().toUpperCase();
    if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    if (!["CONFIRMAR", "NAO_COMPARECEREI"].includes(acao)) {
        return res.status(400).json({ error: "Informe se você irá comparecer ou nao." });
    }
    if (!supabase_1.supabaseAdmin) {
        return res.status(409).json({ error: "SUPABASE_SECRET_KEY precisa estar configurada no backend." });
    }
    try {
        const { data: cliente, error: clienteError } = await supabase_1.supabaseAdmin
            .from("clientes")
            .select("id_cliente, nome")
            .eq("id_auth", res.locals.user.id)
            .maybeSingle();
        if (clienteError) throw new Error(clienteError.message);
        if (!cliente) return res.status(403).json({ error: "Apenas clientes podem confirmar presença." });

        const { data: reserva, error: reservaError } = await supabase_1.supabaseAdmin
            .from("reservas")
            .select("id_reserva, id_cliente, id_restaurante, status_reserva, status_confirmacao_presenca, data_reserva, horario_inicio, horario_fim, valor_minimo_total, restaurantes(nome)")
            .eq("id_reserva", reservationId)
            .eq("id_cliente", cliente.id_cliente)
            .maybeSingle();
        if (reservaError) throw new Error(reservaError.message);
        if (!reserva) return res.status(404).json({ error: "Reserva não encontrada para este cliente." });

        const elegibilidade = attendanceConfirmationEligibility(reserva, obterDataLocalSaoPaulo());
        if (!elegibilidade.allowed) {
            return res.status(409).json({ error: obterMensagemErroConfirmacaoPresenca(elegibilidade.reason), code: elegibilidade.reason });
        }

        const prazo = attendanceConfirmationDeadline(reserva);
        const agora = new Date().toISOString();
        if (acao === "CONFIRMAR") {
            const { data, error } = await supabase_1.supabaseAdmin
                .from("reservas")
                .update({
                    status_confirmacao_presenca: "CONFIRMADA",
                    confirmacao_presenca_em: agora,
                    prazo_confirmacao_presenca: prazo?.toISOString() ?? null,
                    motivo_confirmacao_presenca: "Cliente confirmou presença.",
                })
                .eq("id_reserva", reservationId)
                .eq("id_cliente", cliente.id_cliente)
                .eq("status_reserva", "CONFIRMADA")
                .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
                .single();
            if (error) throw new Error(error.message);
            await Promise.all([
                (0, notificacoes_1.notificarCliente)(data.id_cliente, {
                    titulo: "Presença confirmada",
                    mensagem: "Sua presença foi confirmada. O restaurante já pode organizar sua experiência.",
                    tipo_evento: "PRESENCA_CONFIRMADA",
                    link_destino: "/cliente/reservas",
                    dados: { id_reserva: data.id_reserva },
                }),
                (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
                    titulo: "Cliente confirmou presença",
                    mensagem: `${cliente.nome ?? "Um cliente"} confirmou presenca na reserva.`,
                    tipo_evento: "PRESENCA_CONFIRMADA",
                    link_destino: "/restaurante/reservas",
                    dados: { id_reserva: data.id_reserva },
                }),
            ]);
            return res.json({ reserva: data, reembolso: null });
        }

        const { data: pedidos, error: pedidosError } = await supabase_1.supabaseAdmin
            .from("pedidos")
            .select("id_pedido, id_reserva, id_cliente, id_restaurante, status_pedido, valor_total")
            .eq("id_reserva", reservationId);
        if (pedidosError) throw new Error(pedidosError.message);
        const pedidosEmAndamento = (pedidos ?? []).filter((pedido) => ["EM_PREPARO", "PRONTO", "ENTREGUE"].includes(pedido.status_pedido));
        if (pedidosEmAndamento.length) {
            return res.status(409).json({ error: "Não é possível cancelar a presença porque o pedido já entrou em preparo ou atendimento." });
        }

        const idsPedidos = (pedidos ?? []).map((pedido) => pedido.id_pedido);
        let pagamentos = [];
        if (idsPedidos.length) {
            const { data, error } = await supabase_1.supabaseAdmin
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
            const valorReembolso = politica.refund;
            if (valorReembolso > 0) {
                valorPorPagamento.set(pagamento.id_pagamento, arredondarMoeda(valorReembolso));
            }
        }
        const pagamentosParaReembolso = pagamentosAprovados.filter((pagamento) => valorPorPagamento.has(pagamento.id_pagamento));
        const estornos = await refundApprovedPayments(pagamentosParaReembolso, reserva.id_restaurante, valorPorPagamento);
        let totalReembolsado = 0;
        const totalRetido = Array.from(politicaPorPagamento.values())
            .reduce((total, politica) => total + Number(politica.retained ?? 0), 0);
        const pagamentosPendentes = pagamentos.filter((pagamento) => pagamento.status_pagamento === "PENDENTE");
        for (const pagamento of pagamentosPendentes) {
            await supabase_1.supabaseAdmin
                .from("pagamentos")
                .update({
                    status_pagamento: "RECUSADO",
                    status_repasse: "ESTORNADO",
                    atualizado_em: agora,
                    updated_at: agora,
                })
                .eq("id_pagamento", pagamento.id_pagamento);
            await supabase_1.supabaseAdmin.from("eventos_financeiros").insert({
                id_pagamento: pagamento.id_pagamento,
                id_pedido: pagamento.id_pedido,
                id_reserva: reservationId,
                tipo_evento: "PAGAMENTO_RECUSADO_AUSENCIA",
                descricao: "Checkout pendente encerrado porque o cliente avisou que não comparecerá.",
                valor: pagamento.valor_pago ?? pagamento.valor ?? 0,
                origem: "CLIENTE",
            });
        }
        for (const pagamento of pagamentosAprovados) {
            const politica = politicaPorPagamento.get(pagamento.id_pagamento) ?? calculateAttendanceRefundPolicy({
                paidAmount: pagamento.valor_pago ?? pagamento.valor ?? 0,
                minimumTotal: reserva.valor_minimo_total,
                commissionPercentage: percentualComissaoAppono,
            });
            const valorReembolso = valorPorPagamento.get(pagamento.id_pagamento) ?? 0;
            totalReembolsado += valorReembolso;
            const valorPago = Number(pagamento.valor_pago ?? pagamento.valor ?? 0);
            const totalJaReembolsado = arredondarMoeda(Number(pagamento.valor_reembolsado ?? 0) + valorReembolso);
            const reembolsoTotal = totalJaReembolsado >= valorPago;
            const valorRestauranteRetido = arredondarMoeda(politica.restaurantRetained ?? 0);
            const valorComissaoRetida = arredondarMoeda(politica.appCommission ?? politica.commission ?? 0);
            await supabase_1.supabaseAdmin
                .from("pagamentos")
                .update({
                    valor_reembolsado: totalJaReembolsado,
                    valor_restaurante: valorRestauranteRetido,
                    valor_comissao_app: valorComissaoRetida,
                    status_pagamento: reembolsoTotal ? "ESTORNADO" : pagamento.status_pagamento,
                    status_repasse: valorRestauranteRetido > 0 ? "LIBERADO_PARA_REPASSE" : "ESTORNADO",
                    atualizado_em: agora,
                    updated_at: agora,
                })
                .eq("id_pagamento", pagamento.id_pagamento);
            const pedido = (pedidos ?? []).find((item) => item.id_pedido === pagamento.id_pedido);
            if (valorReembolso > 0) {
                await supabase_1.supabaseAdmin.from("solicitacoes_reembolso").insert({
                    id_pagamento: pagamento.id_pagamento,
                    id_pedido: pagamento.id_pedido,
                    id_reserva: reservationId,
                    id_cliente: reserva.id_cliente,
                    id_restaurante: reserva.id_restaurante,
                    valor_solicitado: valorReembolso,
                    motivo: "Cliente informou ausencia antes do prazo de confirmação de presença.",
                    resposta: "Reembolso parcial processado automaticamente: valor pago menos consumo mínimo da reserva e comissão Appono.",
                    status_reembolso: "CONCLUIDO",
                    modo_execucao: paymentConfig.productionAllowed() ? "MERCADO_PAGO_PRODUCAO" : "MERCADO_PAGO_TESTE",
                    analisado_em: agora,
                    concluido_em: agora,
                    id_auth_analista: res.locals.user.id,
                });
                await supabase_1.supabaseAdmin.from("eventos_financeiros").insert({
                    id_pagamento: pagamento.id_pagamento,
                    id_pedido: pagamento.id_pedido,
                    id_reserva: reservationId,
                    tipo_evento: "REEMBOLSO_PARCIAL_AUSENCIA",
                    descricao: `Cliente avisou ausencia. Reembolso parcial calculado por excedente: pago menos consumo minimo e comissao Appono de ${percentualComissaoAppono}%.`,
                    valor: valorReembolso,
                    origem: "CLIENTE",
                });
            }
            await supabase_1.supabaseAdmin.from("eventos_financeiros").insert({
                id_pagamento: pagamento.id_pagamento,
                id_pedido: pagamento.id_pedido,
                id_reserva: reservationId,
                tipo_evento: "RETENCAO_AUSENCIA",
                descricao: `Cliente avisou ausencia. Restaurante manteve R$ ${valorRestauranteRetido.toFixed(2).replace(".", ",")} e Appono manteve R$ ${valorComissaoRetida.toFixed(2).replace(".", ",")}.`,
                valor: arredondarMoeda(politica.retained ?? 0),
                origem: "CLIENTE",
            });
            if (pedido) {
                await supabase_1.supabaseAdmin.from("eventos_financeiros").insert({
                    id_pagamento: pagamento.id_pagamento,
                    id_pedido: pedido.id_pedido,
                    id_reserva: reservationId,
                    tipo_evento: "PEDIDO_CANCELADO_AUSENCIA",
                    descricao: "Pedido cancelado porque o cliente avisou que não comparecerá.",
                    valor: pedido.valor_total,
                    origem: "CLIENTE",
                });
            }
        }

        if (idsPedidos.length) {
            await supabase_1.supabaseAdmin
                .from("pedidos")
                .update({ status_pedido: "CANCELADO" })
                .eq("id_reserva", reservationId)
                .in("status_pedido", ["PENDENTE", "CONFIRMADO"]);
        }

        const { data: reservaCancelada, error: updateError } = await supabase_1.supabaseAdmin
            .from("reservas")
            .update({
                status_reserva: "CANCELADA",
                status_confirmacao_presenca: "RECUSADA",
                confirmacao_presenca_em: agora,
                prazo_confirmacao_presenca: prazo?.toISOString() ?? null,
                percentual_comissao_ausencia: percentualComissaoAppono,
                valor_retido_ausencia: arredondarMoeda(totalRetido),
                valor_reembolso_ausencia: arredondarMoeda(totalReembolsado),
                motivo_confirmacao_presenca: "Cliente informou que não irá comparecer.",
            })
            .eq("id_reserva", reservationId)
            .eq("id_cliente", cliente.id_cliente)
            .eq("status_reserva", "CONFIRMADA")
            .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
            .single();
        if (updateError) throw new Error(updateError.message);

        await Promise.all([
            (0, notificacoes_1.notificarCliente)(reservaCancelada.id_cliente, {
                titulo: "Reserva cancelada",
                mensagem: totalReembolsado > 0
                    ? `Sua ausencia foi registrada e um reembolso parcial de R$ ${arredondarMoeda(totalReembolsado).toFixed(2).replace(".", ",")} foi processado.`
                    : "Sua ausencia foi registrada e a reserva foi cancelada.",
                tipo_evento: "PRESENCA_RECUSADA",
                link_destino: "/cliente/reservas",
                dados: { id_reserva: reservationId, valor_reembolso: arredondarMoeda(totalReembolsado) },
            }),
            (0, notificacoes_1.notificarRestaurante)(reservaCancelada.id_restaurante, {
                titulo: "Cliente não irá comparecer",
                mensagem: "A reserva foi cancelada e saiu da fila operacional. Pedidos vinculados foram cancelados.",
                tipo_evento: "PRESENCA_RECUSADA",
                link_destino: "/restaurante/reservas",
                dados: { id_reserva: reservationId },
            }),
            (0, notificacoes_1.notificarAdministradores)({
                titulo: "Ausencia informada",
                mensagem: `Reserva #${reservationId} cancelada pelo cliente com reembolso do excedente apos consumo minimo e comissao Appono.`,
                tipo_evento: "REEMBOLSO_PARCIAL_AUSENCIA",
                link_destino: "/admin/financeiro",
                dados: { id_reserva: reservationId, valor_reembolso: arredondarMoeda(totalReembolsado) },
            }),
        ]);
        return res.json({
            reserva: reservaCancelada,
            reembolso: {
                percentual_comissao_app: percentualComissaoAppono,
                valor: arredondarMoeda(totalReembolsado),
                estornos: estornos.length,
                politica: Array.from(politicaPorPagamento.values())[0] ?? null,
            },
        });
    } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a presença." });
    }
});
exports.reservationsRouter.patch("/:id/check-in", async (req, res) => {
    await sincronizarReservasNaoComparecidas().catch(() => null);
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
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
        return res.status(403).json({ error: "Apenas restaurantes podem registrar check-in." });
    }
    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const { data: reserva, error: reservaError } = await clienteBanco
        .from("reservas")
        .select("id_reserva, id_cliente, id_restaurante, status_reserva, data_reserva, horario_inicio, clientes(nome)")
        .eq("id_reserva", reservationId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .maybeSingle();
    if (reservaError) {
        return res.status(400).json({ error: reservaError.message });
    }
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada para este restaurante." });
    }
    if (reserva.status_reserva === "CHECK_IN") {
        return res.json(reserva);
    }
    if (reserva.status_reserva !== "CONFIRMADA") {
        return res.status(409).json({ error: "Apenas reservas confirmadas podem receber check-in." });
    }
    const dataHoraReserva = obterDataHoraLocal(reserva.data_reserva, reserva.horario_inicio);
    const inicioJanelaCheckIn = new Date(dataHoraReserva.getTime() - 15 * 60 * 1000);
    if (obterDataLocalSaoPaulo() < inicioJanelaCheckIn) {
        return res.status(409).json({
            error: "O check-in só pode ser registrado a partir de 15 minutos antes do horário da reserva.",
        });
    }
    const { data, error } = await clienteBanco
        .from("reservas")
        .update({ status_reserva: "CHECK_IN" })
        .eq("id_reserva", reservationId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .eq("status_reserva", "CONFIRMADA")
        .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Check-in realizado",
            mensagem: "Seu check-in foi registrado pelo restaurante. Boa experiencia!",
            tipo_evento: "RESERVA_CHECK_IN",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
            titulo: "Check-in registrado",
            mensagem: `A reserva de ${data.clientes?.nome ?? "um cliente"} entrou em atendimento.`,
            tipo_evento: "RESERVA_CHECK_IN",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
    ]);
    return res.json(data);
});
exports.reservationsRouter.patch("/:id/concluir", async (req, res) => {
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
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
        return res.status(403).json({ error: "Apenas restaurantes podem finalizar reservas." });
    }
    const clienteBanco = supabase_1.supabaseAdmin ?? supabase;
    const { data: reserva, error: reservaError } = await clienteBanco
        .from("reservas")
        .select("id_reserva, id_cliente, id_restaurante, status_reserva, clientes(nome)")
        .eq("id_reserva", reservationId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .maybeSingle();
    if (reservaError) {
        return res.status(400).json({ error: reservaError.message });
    }
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada para este restaurante." });
    }
    if (reserva.status_reserva === "CONCLUIDA") {
        return res.json(reserva);
    }
    if (reserva.status_reserva !== "CHECK_IN") {
        return res.status(409).json({ error: "Apenas reservas com check-in realizado podem ser finalizadas." });
    }
    const { data: pedidosAbertos, error: pedidosError } = await clienteBanco
        .from("pedidos")
        .select("id_pedido, status_pedido")
        .eq("id_reserva", reservationId)
        .not("status_pedido", "in", "(ENTREGUE,CANCELADO)");
    if (pedidosError) {
        return res.status(400).json({ error: pedidosError.message });
    }
    if ((pedidosAbertos ?? []).length) {
        return res.status(409).json({
            error: "Finalize ou cancele os pedidos vinculados antes de concluir a reserva.",
        });
    }
    const { data, error } = await clienteBanco
        .from("reservas")
        .update({ status_reserva: "CONCLUIDA" })
        .eq("id_reserva", reservationId)
        .eq("id_restaurante", restaurante.id_restaurante)
        .eq("status_reserva", "CHECK_IN")
        .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
        .single();
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Reserva finalizada",
            mensagem: "Seu atendimento foi finalizado pelo restaurante. Obrigado por usar a Appono.",
            tipo_evento: "RESERVA_CONCLUIDA",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
            titulo: "Reserva finalizada",
            mensagem: `A reserva de ${data.clientes?.nome ?? "um cliente"} foi concluida.`,
            tipo_evento: "RESERVA_CONCLUIDA",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
    ]);
    return res.json(data);
});
exports.reservationsRouter.patch("/:id/cancelar", (0, auth_1.requireRole)("cliente"), async (req, res) => {
    await sincronizarReservasNaoComparecidas().catch(() => null);
    const reservationId = Number(req.params.id);
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    if (!Number.isFinite(reservationId)) {
        return res.status(400).json({ error: "Reserva invalida." });
    }
    const { data, error } = await supabase.rpc("cancelar_reserva_propria", {
        reserva_id: reservationId,
    });
    if (error) {
        return res.status(409).json({
            error: error.message.includes("não pode mais ser cancelada")
                ? "A reserva não foi encontrada ou não pode mais ser cancelada."
                : error.message,
        });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Reserva cancelada",
            mensagem: "Sua reserva foi desmarcada. Caso queira, você pode realizar uma nova reserva pelo módulo cliente.",
            tipo_evento: "RESERVA_CANCELADA",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
        (0, notificacoes_1.notificarRestaurante)(data.id_restaurante, {
            titulo: "Reserva desmarcada",
            mensagem: "Uma reserva foi cancelada e saiu da agenda operacional do restaurante.",
            tipo_evento: "RESERVA_CANCELADA",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: data.id_reserva },
        }),
    ]);
    return res.json(data);
});

exports.reservationsRouter.patch("/:id/cancelar-restaurante", (0, auth_1.requireRole)("restaurante"), async (req, res) => {
    await sincronizarReservasNaoComparecidas().catch(() => null);
    const reservationId = Number(req.params.id);
    if (!Number.isInteger(reservationId) || reservationId <= 0 || !supabase_1.supabaseAdmin) return res.status(400).json({ error: "Reserva invalida." });
    try {
        const { data: restaurante } = await supabase_1.supabaseAdmin.from("restaurantes").select("id_restaurante").eq("id_auth", res.locals.user.id).maybeSingle();
        if (!restaurante) return res.status(403).json({ error: "Perfil de restaurante não encontrado." });
        const { data: reserva } = await supabase_1.supabaseAdmin.from("reservas")
            .select("id_reserva, id_cliente, id_restaurante, status_reserva, data_reserva, horario_inicio")
            .eq("id_reserva", reservationId).eq("id_restaurante", restaurante.id_restaurante).maybeSingle();
        if (!reserva) return res.status(404).json({ error: "Reserva não encontrada para este restaurante." });
        const { data: pedidos, error: ordersError } = await supabase_1.supabaseAdmin.from("pedidos").select("id_pedido, status_pedido").eq("id_reserva", reservationId);
        if (ordersError) throw new Error(ordersError.message);
        const elegibilidade = restaurantCancellationEligibility(reserva, (pedidos ?? []).map((pedido) => pedido.status_pedido), new Date());
        if (!elegibilidade.allowed) return res.status(409).json({ error: elegibilidade.reason === "PEDIDO_EM_ANDAMENTO" ? "A reserva não pode ser desmarcada depois que o preparo ou atendimento comecou." : elegibilidade.reason === "RESERVA_INICIADA" ? "A reserva não pode ser desmarcada depois do horário de início." : "Esta reserva não pode mais ser desmarcada." });
        const idsPedidos = (pedidos ?? []).map((pedido) => pedido.id_pedido);
        let pagamentos = [];
        if (idsPedidos.length) {
            const result = await supabase_1.supabaseAdmin.from("pagamentos").select("id_pagamento, id_pedido, status_pagamento, mercado_pago_payment_id, valor_pago").in("id_pedido", idsPedidos);
            if (result.error) throw new Error(result.error.message);
            pagamentos = result.data ?? [];
        }
        const estornos = await refundApprovedPayments(pagamentos, restaurante.id_restaurante);
        const { data: atualizada, error: updateError } = await supabase_1.supabaseAdmin.from("reservas")
            .update({ status_reserva: "CANCELADA" }).eq("id_reserva", reservationId).eq("id_restaurante", restaurante.id_restaurante)
            .in("status_reserva", ["PENDENTE", "CONFIRMADA"]).select("*").single();
        if (updateError) throw new Error(updateError.message);
        for (const { payment } of estornos) {
            const agora = new Date().toISOString();
            await supabase_1.supabaseAdmin.from("pagamentos").update({ status_pagamento: "ESTORNADO", status_repasse: "ESTORNADO", atualizado_em: agora, updated_at: agora }).eq("id_pagamento", payment.id_pagamento);
            await supabase_1.supabaseAdmin.from("eventos_financeiros").insert({ id_pagamento: payment.id_pagamento, id_pedido: payment.id_pedido, id_reserva: reservationId, tipo_evento: "PAGAMENTO_ESTORNADO_RESTAURANTE", descricao: "Pagamento estornado após cancelamento da reserva pelo restaurante.", valor: payment.valor_pago, origem: "RESTAURANTE" });
        }
        await Promise.all([
            (0, notificacoes_1.notificarCliente)(atualizada.id_cliente, { titulo: "Reserva cancelada pelo restaurante", mensagem: estornos.length ? "O restaurante cancelou a reserva e o pagamento foi estornado pelo Mercado Pago." : "O restaurante cancelou sua reserva.", tipo_evento: "RESERVA_CANCELADA", link_destino: "/cliente/reservas", dados: { id_reserva: reservationId } }),
            (0, notificacoes_1.notificarRestaurante)(atualizada.id_restaurante, { titulo: "Reserva cancelada", mensagem: estornos.length ? "Reserva cancelada e pagamento estornado." : "Reserva cancelada com sucesso.", tipo_evento: "RESERVA_CANCELADA", link_destino: "/restaurante/reservas", dados: { id_reserva: reservationId } }),
        ]);
        return res.json({ ...atualizada, estornos: estornos.length });
    } catch (error) {
        return res.status(502).json({ error: `A reserva nao foi cancelada: ${error instanceof Error ? error.message : "erro desconhecido"}` });
    }
});
