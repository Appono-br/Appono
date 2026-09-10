"use strict";

const { Router } = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");
const { notificarCliente, notificarRestaurante } = require("../services/notificacoes");

const messagesRouter = Router();

messagesRouter.use(requireAuth);

function exigirBancoAdmin() {
    if (!supabaseAdmin) {
        const erro = new Error("Chat temporariamente indisponível.");
        erro.status = 503;
        throw erro;
    }
}

function normalizarTexto(valor, limite = 1200) {
    return String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, limite);
}

function normalizarId(valor, mensagemErro = "Identificador inválido.") {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        const erro = new Error(mensagemErro);
        erro.status = 400;
        throw erro;
    }
    return id;
}

function formatarHora(data) {
    if (!data) return "";
    return new Date(data).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function obterIniciais(nome) {
    const partes = String(nome ?? "A")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "AP";
}

async function obterPerfil(userId) {
    exigirBancoAdmin();
    const [{ data: cliente, error: clienteError }, { data: restaurante, error: restauranteError }] = await Promise.all([
        supabaseAdmin.from("clientes").select("id_cliente, nome, telefone").eq("id_auth", userId).maybeSingle(),
        supabaseAdmin.from("restaurantes").select("id_restaurante, nome, telefone, logo_url").eq("id_auth", userId).maybeSingle(),
    ]);
    if (clienteError || restauranteError) {
        throw new Error(clienteError?.message ?? restauranteError?.message);
    }
    if (cliente) {
        return { tipo: "cliente", id: cliente.id_cliente, dados: cliente };
    }
    if (restaurante) {
        return { tipo: "restaurante", id: restaurante.id_restaurante, dados: restaurante };
    }
    const erro = new Error("Perfil não encontrado para o chat.");
    erro.status = 403;
    throw erro;
}

function conversaPertenceAoPerfil(conversa, perfil) {
    if (perfil.tipo === "cliente") return Number(conversa.id_cliente) === Number(perfil.id);
    if (perfil.tipo === "restaurante") return Number(conversa.id_restaurante) === Number(perfil.id);
    return false;
}

function montarResumoConversa(conversa, perfil) {
    const ultimaMensagem = conversa.mensagens_chat?.[0] ?? null;
    const outroNome = perfil.tipo === "cliente"
        ? conversa.restaurantes?.nome
        : conversa.clientes?.nome;
    const lidaEm = perfil.tipo === "cliente" ? conversa.lida_cliente_em : conversa.lida_restaurante_em;
    const ultimaMensagemPropria = ultimaMensagem?.tipo_remetente === perfil.tipo;
    const naoLida = Boolean(ultimaMensagem && !ultimaMensagemPropria && (!lidaEm || new Date(lidaEm) < new Date(ultimaMensagem.criado_em)));

    return {
        id_conversa: conversa.id_conversa,
        id_cliente: conversa.id_cliente,
        id_restaurante: conversa.id_restaurante,
        id_reserva: conversa.id_reserva,
        id_pedido: conversa.id_pedido,
        titulo: outroNome ?? "Conversa Appono",
        iniciais: obterIniciais(outroNome),
        assunto: conversa.assunto,
        status: conversa.status,
        nao_lida: naoLida,
        ultima_mensagem: ultimaMensagem?.conteudo ?? "Conversa iniciada.",
        atualizado_em: conversa.ultima_mensagem_em ?? conversa.atualizado_em ?? conversa.criado_em,
        atualizado_formatado: formatarHora(conversa.ultima_mensagem_em ?? conversa.atualizado_em ?? conversa.criado_em),
        cliente: conversa.clientes ?? null,
        restaurante: conversa.restaurantes ?? null,
        reserva: conversa.reservas ?? null,
        pedido: conversa.pedidos ?? null,
    };
}

function montarMensagem(mensagem) {
    return {
        id_mensagem: mensagem.id_mensagem,
        id_conversa: mensagem.id_conversa,
        tipo_remetente: mensagem.tipo_remetente,
        conteudo: mensagem.conteudo,
        criado_em: mensagem.criado_em,
        criado_formatado: formatarHora(mensagem.criado_em),
    };
}

async function buscarConversaPorId(idConversa, perfil) {
    const { data, error } = await supabaseAdmin
        .from("conversas_chat")
        .select("*, clientes(nome, telefone), restaurantes(nome, telefone, logo_url), reservas(id_reserva, data_reserva, horario_inicio, quantidade_pessoas, status_reserva), pedidos(id_pedido, status_pedido, valor_total)")
        .eq("id_conversa", idConversa)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || !conversaPertenceAoPerfil(data, perfil)) {
        const erro = new Error("Conversa não encontrada.");
        erro.status = 404;
        throw erro;
    }
    return data;
}

async function obterContextoConversa(body, perfil) {
    const idPedido = Number(body.id_pedido || 0) || null;
    const idReserva = Number(body.id_reserva || 0) || null;
    const idRestauranteBody = Number(body.id_restaurante || 0) || null;

    if (idPedido) {
        const { data: pedido, error } = await supabaseAdmin
            .from("pedidos")
            .select("id_pedido, id_cliente, id_restaurante, id_reserva")
            .eq("id_pedido", idPedido)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!pedido) {
            const erro = new Error("Pedido não encontrado para iniciar a conversa.");
            erro.status = 404;
            throw erro;
        }
        if ((perfil.tipo === "cliente" && Number(pedido.id_cliente) !== Number(perfil.id)) ||
            (perfil.tipo === "restaurante" && Number(pedido.id_restaurante) !== Number(perfil.id))) {
            const erro = new Error("Você não tem permissão para conversar sobre este pedido.");
            erro.status = 403;
            throw erro;
        }
        return {
            id_cliente: pedido.id_cliente,
            id_restaurante: pedido.id_restaurante,
            id_reserva: pedido.id_reserva ?? idReserva,
            id_pedido: pedido.id_pedido,
        };
    }

    if (idReserva) {
        const { data: reserva, error } = await supabaseAdmin
            .from("reservas")
            .select("id_reserva, id_cliente, id_restaurante")
            .eq("id_reserva", idReserva)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!reserva) {
            const erro = new Error("Reserva não encontrada para iniciar a conversa.");
            erro.status = 404;
            throw erro;
        }
        if ((perfil.tipo === "cliente" && Number(reserva.id_cliente) !== Number(perfil.id)) ||
            (perfil.tipo === "restaurante" && Number(reserva.id_restaurante) !== Number(perfil.id))) {
            const erro = new Error("Você não tem permissão para conversar sobre esta reserva.");
            erro.status = 403;
            throw erro;
        }
        return {
            id_cliente: reserva.id_cliente,
            id_restaurante: reserva.id_restaurante,
            id_reserva: reserva.id_reserva,
            id_pedido: null,
        };
    }

    if (perfil.tipo === "cliente" && idRestauranteBody) {
        const { data: restaurante, error } = await supabaseAdmin
            .from("restaurantes")
            .select("id_restaurante")
            .eq("id_restaurante", idRestauranteBody)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!restaurante) {
            const erro = new Error("Restaurante não encontrado para iniciar a conversa.");
            erro.status = 404;
            throw erro;
        }
        return {
            id_cliente: perfil.id,
            id_restaurante: restaurante.id_restaurante,
            id_reserva: null,
            id_pedido: null,
        };
    }

    const erro = new Error("Informe restaurante, reserva ou pedido para iniciar a conversa.");
    erro.status = 400;
    throw erro;
}

async function buscarConversaExistente(contexto) {
    let query = supabaseAdmin.from("conversas_chat").select("*").limit(1);
    if (contexto.id_pedido) {
        query = query.eq("id_pedido", contexto.id_pedido);
    }
    else if (contexto.id_reserva) {
        query = query.eq("id_reserva", contexto.id_reserva).is("id_pedido", null);
    }
    else {
        query = query
            .eq("id_cliente", contexto.id_cliente)
            .eq("id_restaurante", contexto.id_restaurante)
            .is("id_reserva", null)
            .is("id_pedido", null);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}

async function marcarConversaComoLida(idConversa, perfil) {
    const campo = perfil.tipo === "cliente" ? "lida_cliente_em" : "lida_restaurante_em";
    await supabaseAdmin
        .from("conversas_chat")
        .update({ [campo]: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .eq("id_conversa", idConversa);
}

messagesRouter.get("/", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user.id);
        const colunaPerfil = perfil.tipo === "cliente" ? "id_cliente" : "id_restaurante";
        const colunaOculta = perfil.tipo === "cliente" ? "ocultada_cliente" : "ocultada_restaurante";
        const { data, error } = await supabaseAdmin
            .from("conversas_chat")
            .select("*, clientes(nome, telefone), restaurantes(nome, telefone, logo_url), reservas(id_reserva, data_reserva, horario_inicio, quantidade_pessoas, status_reserva), pedidos(id_pedido, status_pedido, valor_total), mensagens_chat(id_mensagem, tipo_remetente, conteudo, criado_em)")
            .eq(colunaPerfil, perfil.id)
            .eq(colunaOculta, false)
            .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })
            .order("criado_em", { referencedTable: "mensagens_chat", ascending: false })
            .limit(1, { referencedTable: "mensagens_chat" });
        if (error) throw new Error(error.message);
        return res.json((data ?? []).map((conversa) => montarResumoConversa(conversa, perfil)));
    }
    catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Não foi possível carregar as conversas." });
    }
});

messagesRouter.post("/conversas", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user.id);
        const contexto = await obterContextoConversa(req.body ?? {}, perfil);
        const assunto = normalizarTexto(req.body?.assunto ?? "", 160) || null;
        const existente = await buscarConversaExistente(contexto);
        if (existente) {
            return res.status(200).json(montarResumoConversa(await buscarConversaPorId(existente.id_conversa, perfil), perfil));
        }
        const agora = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from("conversas_chat")
            .insert({
                ...contexto,
                assunto,
                ultima_mensagem_em: agora,
                atualizado_em: agora,
            })
            .select("*")
            .single();
        if (error) throw new Error(error.message);
        return res.status(201).json(montarResumoConversa(await buscarConversaPorId(data.id_conversa, perfil), perfil));
    }
    catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Não foi possível iniciar a conversa." });
    }
});

messagesRouter.get("/:id", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user.id);
        const idConversa = normalizarId(req.params.id, "Conversa inválida.");
        const conversa = await buscarConversaPorId(idConversa, perfil);
        const { data: mensagens, error } = await supabaseAdmin
            .from("mensagens_chat")
            .select("*")
            .eq("id_conversa", conversa.id_conversa)
            .order("criado_em", { ascending: true });
        if (error) throw new Error(error.message);
        await marcarConversaComoLida(conversa.id_conversa, perfil);
        return res.json({
            conversa: montarResumoConversa(conversa, perfil),
            mensagens: (mensagens ?? []).map(montarMensagem),
            perfil: perfil.tipo,
        });
    }
    catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Não foi possível carregar a conversa." });
    }
});

messagesRouter.post("/:id/mensagens", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user.id);
        const idConversa = normalizarId(req.params.id, "Conversa inválida.");
        const conversa = await buscarConversaPorId(idConversa, perfil);
        if (conversa.status !== "ABERTA") {
            return res.status(400).json({ error: "Esta conversa está encerrada." });
        }
        if (String(req.body?.conteudo ?? "").trim().length > 1200) {
            return res.status(400).json({ error: "A mensagem deve ter no máximo 1200 caracteres." });
        }
        const conteudo = normalizarTexto(req.body?.conteudo);
        if (!conteudo) {
            return res.status(400).json({ error: "Escreva uma mensagem antes de enviar." });
        }
        const agora = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from("mensagens_chat")
            .insert({
                id_conversa: conversa.id_conversa,
                id_auth_remetente: res.locals.user.id,
                tipo_remetente: perfil.tipo,
                conteudo,
            })
            .select("*")
            .single();
        if (error) throw new Error(error.message);
        const updates = {
            ultima_mensagem_em: agora,
            atualizado_em: agora,
            ocultada_cliente: false,
            ocultada_restaurante: false,
        };
        if (perfil.tipo === "cliente") {
            updates.lida_cliente_em = agora;
            updates.lida_restaurante_em = null;
        }
        else {
            updates.lida_restaurante_em = agora;
            updates.lida_cliente_em = null;
        }
        await supabaseAdmin.from("conversas_chat").update(updates).eq("id_conversa", conversa.id_conversa);

        const destinoLink = perfil.tipo === "cliente"
            ? `/restaurante/mensagens/${conversa.id_conversa}`
            : `/cliente/mensagens/${conversa.id_conversa}`;
        if (perfil.tipo === "cliente") {
            await notificarRestaurante(conversa.id_restaurante, {
                titulo: "Nova mensagem",
                mensagem: `${perfil.dados.nome ?? "Cliente"} enviou uma mensagem no chat.`,
                tipo_evento: "MENSAGEM_RECEBIDA",
                link_destino: destinoLink,
                dados: { id_conversa: conversa.id_conversa, id_reserva: conversa.id_reserva, id_pedido: conversa.id_pedido },
                dedupe_key: `chat:${conversa.id_conversa}:${data.id_mensagem}`,
            });
        }
        else {
            await notificarCliente(conversa.id_cliente, {
                titulo: "Nova mensagem",
                mensagem: `${perfil.dados.nome ?? "Restaurante"} respondeu sua conversa.`,
                tipo_evento: "MENSAGEM_RECEBIDA",
                link_destino: destinoLink,
                dados: { id_conversa: conversa.id_conversa, id_reserva: conversa.id_reserva, id_pedido: conversa.id_pedido },
                dedupe_key: `chat:${conversa.id_conversa}:${data.id_mensagem}`,
            });
        }

        return res.status(201).json(montarMensagem(data));
    }
    catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Não foi possível enviar a mensagem." });
    }
});

messagesRouter.patch("/:id/arquivar", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user.id);
        const idConversa = normalizarId(req.params.id, "Conversa inválida.");
        const conversa = await buscarConversaPorId(idConversa, perfil);
        const campo = perfil.tipo === "cliente" ? "ocultada_cliente" : "ocultada_restaurante";
        const { data, error } = await supabaseAdmin
            .from("conversas_chat")
            .update({ [campo]: true, atualizado_em: new Date().toISOString() })
            .eq("id_conversa", conversa.id_conversa)
            .select("*")
            .single();
        if (error) throw new Error(error.message);
        return res.json(montarResumoConversa(data, perfil));
    }
    catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Não foi possível arquivar a conversa." });
    }
});

module.exports = { messagesRouter };
