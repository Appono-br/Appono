"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const notificacoes_1 = require("../services/notificacoes");
exports.reservationsRouter = (0, express_1.Router)();
exports.reservationsRouter.use(auth_1.requireAuth);
const LIMITE_UNIDADES_POR_ITEM = 10;

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
    if (mensagem.includes("Nao ha mesa disponivel")) {
        return "Nao ha mesa disponivel para este horario e quantidade de pessoas.";
    }
    if (mensagem.includes("Cliente ja possui reserva ativa neste horario")) {
        return "Voce ja possui uma reserva ativa nesse dia e horario.";
    }
    if (mensagem.includes("ainda nao configurou horarios")) {
        return "Este restaurante ainda nao configurou horarios de funcionamento para receber reservas.";
    }
    if (mensagem.includes("fechado nesta data")) {
        return "Este restaurante esta fechado na data escolhida.";
    }
    if (mensagem.includes("antecedencia minima")) {
        return "Este horario nao respeita a antecedencia minima configurada pelo restaurante.";
    }
    if (mensagem.includes("fora do funcionamento")) {
        return "Este horario esta fora do funcionamento do restaurante.";
    }
    if (mensagem.includes("ja possui um pedido ativo")) {
        return "Esta reserva ja possui um pedido antecipado ativo.";
    }
    if (mensagem.includes("produtos sao invalidos") || mensagem.includes("indisponiveis")) {
        return "Um ou mais itens do cardapio ficaram indisponiveis. Atualize a pagina e escolha novamente.";
    }
    if (mensagem.includes("reserva iniciada")) {
        return "Nao e possivel criar pedido para uma reserva que ja iniciou.";
    }
    if (mensagem.includes("consumo minimo")) {
        return "O pedido precisa atingir o consumo minimo da reserva.";
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

exports.reservationsRouter.get("/", async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const { data: cliente } = await supabase
        .from("clientes")
        .select("id_cliente")
        .maybeSingle();
    const colunaOcultacao = cliente ? "ocultada_cliente" : "ocultada_restaurante";
    const consultaReservas = supabase
        .from("reservas")
        .select("*, restaurantes(nome, endereco), clientes(nome, telefone), mesas(numero_mesa, capacidade)")
        .eq(colunaOcultacao, false)
        .order("data_reserva", { ascending: true })
        .order("horario_inicio", { ascending: true });
    const { data, error } = await consultaReservas;
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const reservas = data ?? [];
    const idsReservas = reservas.map((reserva) => reserva.id_reserva);
    if (!idsReservas.length) {
        return res.json(reservas);
    }
    const clientePedidos = supabase_1.supabaseAdmin ?? supabase;
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
    const { data, error } = await supabase.rpc("ocultar_reserva_do_historico", {
        reserva_id: reservationId,
    });
    if (error) {
        return res.status(409).json({
            error: "Apenas reservas canceladas podem ser excluidas da lista.",
        });
    }
    return res.json(data);
});
exports.reservationsRouter.post("/", async (req, res) => {
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
            error: "A reserva foi criada, mas nao foi possivel confirma-la.",
        });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(reservaConfirmada.id_cliente, {
            titulo: "Reserva confirmada",
            mensagem: "Sua reserva foi confirmada. Agora voce ja pode acompanhar ou antecipar seu pedido.",
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
    let itensNormalizados;
    try {
        itensNormalizados = normalizarItensPedido(body.itens);
    }
    catch (erro) {
        return res.status(400).json({ error: erro instanceof Error ? erro.message : "Itens do pedido invalidos." });
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
            titulo: "Reserva confirmada",
            mensagem: "Sua reserva foi confirmada e o pedido antecipado foi vinculado para pagamento.",
            tipo_evento: "RESERVA_CONFIRMADA",
            link_destino: "/cliente/reservas",
            dados: { id_reserva: reservaCriada.id_reserva, id_pedido: pedidoCriado.id_pedido },
        }),
        (0, notificacoes_1.notificarRestaurante)(reservaCriada.id_restaurante, {
            titulo: "Nova reserva com pedido",
            mensagem: "Uma reserva foi registrada com pedido antecipado vinculado.",
            tipo_evento: "NOVA_RESERVA",
            link_destino: "/restaurante/reservas",
            dados: { id_reserva: reservaCriada.id_reserva, id_pedido: pedidoCriado.id_pedido },
        }),
        (0, notificacoes_1.notificarCliente)(pedidoCriado.id_cliente, {
            titulo: "Pedido antecipado criado",
            mensagem: "Seu pedido foi registrado e ficara vinculado a sua reserva apos o pagamento.",
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
        return res.status(404).json({ error: "Reserva nao encontrada." });
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
exports.reservationsRouter.patch("/:id/check-in", async (req, res) => {
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
        return res.status(404).json({ error: "Reserva nao encontrada para este restaurante." });
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
            error: "O check-in so pode ser registrado a partir de 15 minutos antes do horario da reserva.",
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
        return res.status(404).json({ error: "Reserva nao encontrada para este restaurante." });
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
exports.reservationsRouter.patch("/:id/cancelar", async (req, res) => {
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
            error: error.message.includes("nao pode mais ser cancelada")
                ? "A reserva nao foi encontrada ou nao pode mais ser cancelada."
                : error.message,
        });
    }
    await Promise.all([
        (0, notificacoes_1.notificarCliente)(data.id_cliente, {
            titulo: "Reserva cancelada",
            mensagem: "Sua reserva foi desmarcada. Caso queira, voce pode realizar uma nova reserva pelo modulo cliente.",
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
