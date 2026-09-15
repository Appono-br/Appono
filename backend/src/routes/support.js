"use strict";

const { Router } = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");
const {
    STATUS_TERMINAIS_SUPORTE,
    calcularImpactoReputacao,
    normalizarMotivoSuporte,
    normalizarTextoSuporte,
    prioridadePorMotivo,
    proximoStatusPorMensagem,
    validarAberturaChamado,
} = require("../domain/support-state");
const { normalizeRefundReason, refundRequestEligibility } = require("../domain/refund-state");
const { notificarAdministradores, notificarCliente, notificarRestaurante } = require("../services/notificacoes");
const paymentConfig = require("../services/pagamentos/config");

const supportRouter = Router();

const SELECT_CHAMADO_LISTA = "*, clientes(nome, telefone, email), restaurantes(nome, telefone, email, logo_url), reservas(data_reserva, horario_inicio, status_reserva), pedidos(status_pedido, valor_total), solicitacoes_reembolso(status_reembolso, valor_solicitado)";
const SELECT_CHAMADO_DETALHE = "*, clientes(nome, telefone, email), restaurantes(nome, telefone, email, logo_url), reservas(data_reserva, horario_inicio, status_reserva, status_confirmacao_presenca), pedidos(status_pedido, valor_total, data_pedido), solicitacoes_reembolso(status_reembolso, valor_solicitado, motivo), mensagens_suporte(*)";

supportRouter.use(requireAuth);

function exigirBancoAdmin() {
    if (!supabaseAdmin) {
        const erro = new Error("Suporte temporariamente indisponivel.");
        erro.status = 503;
        throw erro;
    }
}

function obterAdmins() {
    return new Set(String(process.env.APPONO_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean));
}

function normalizarId(valor, mensagem = "Identificador invalido.") {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        const erro = new Error(mensagem);
        erro.status = 400;
        throw erro;
    }
    return id;
}

function mensagemErroValidacao(code) {
    const mensagens = {
        DESCRICAO_CURTA: "Descreva o ocorrido em pelo menos 10 caracteres.",
        PEDIDO_OBRIGATORIO: "Este motivo exige um pedido vinculado.",
        RESERVA_OBRIGATORIA: "Este motivo exige uma reserva vinculada.",
        PEDIDO_AGUARDANDO_PAGAMENTO: "Este pedido ainda aguarda pagamento e nao pode receber esse tipo de reclamacao.",
        RESERVA_INATIVA: "Esta reserva nao permite reclamacao de pedido nao pronto.",
        AUSENCIA_INFORMADA: "Voce informou ausencia para esta reserva, entao esse tipo de reclamacao precisa de analise direta da Appono.",
        PRAZO_ENCERRADO: "O prazo para abrir chamado sobre esta experiencia foi encerrado.",
    };
    return mensagens[code] ?? "Nao foi possivel abrir este chamado.";
}

function mensagemErroReembolso(code) {
    const mensagens = {
        PAGAMENTO_NAO_ENCONTRADO: "Nao encontramos um pagamento aprovado para criar o reembolso automaticamente.",
        PAGAMENTO_NAO_APROVADO: "O pagamento ainda nao esta aprovado, entao o reembolso nao foi criado automaticamente.",
        PAGAMENTO_JA_ESTORNADO: "Este pagamento ja foi estornado.",
        REEMBOLSO_EM_ANDAMENTO: "Ja existe uma solicitacao de reembolso em andamento para este pagamento.",
        REEMBOLSO_JA_CONCLUIDO: "Este pagamento ja possui reembolso concluido.",
    };
    return mensagens[code] ?? "Nao foi possivel criar o reembolso automaticamente.";
}

async function obterPerfil(user) {
    exigirBancoAdmin();
    if (obterAdmins().has(String(user?.email ?? "").toLowerCase())) {
        return { tipo: "admin", id: null, dados: { email: user.email, nome: "Administracao" } };
    }
    const [{ data: cliente, error: clienteError }, { data: restaurante, error: restauranteError }] = await Promise.all([
        supabaseAdmin.from("clientes").select("id_cliente, nome, telefone, email").eq("id_auth", user.id).maybeSingle(),
        supabaseAdmin.from("restaurantes").select("id_restaurante, nome, telefone, email, logo_url").eq("id_auth", user.id).maybeSingle(),
    ]);
    if (clienteError || restauranteError) {
        throw new Error(clienteError?.message ?? restauranteError?.message);
    }
    if (cliente) return { tipo: "cliente", id: cliente.id_cliente, dados: cliente };
    if (restaurante) return { tipo: "restaurante", id: restaurante.id_restaurante, dados: restaurante };
    const erro = new Error("Perfil nao encontrado para acessar o suporte.");
    erro.status = 403;
    throw erro;
}

function chamadoPertenceAoPerfil(chamado, perfil) {
    if (perfil.tipo === "admin") return true;
    if (perfil.tipo === "cliente") return Number(chamado.id_cliente) === Number(perfil.id);
    if (perfil.tipo === "restaurante") return Number(chamado.id_restaurante) === Number(perfil.id);
    return false;
}

function textoMotivo(motivo) {
    const mapa = {
        PEDIDO_NAO_PRONTO: "Pedido nao estava pronto",
        PEDIDO_INCORRETO: "Pedido incorreto",
        RESERVA_NAO_RECONHECIDA: "Reserva nao reconhecida",
        MESA_INDISPONIVEL: "Mesa indisponivel",
        RESTAURANTE_INDISPONIVEL: "Restaurante indisponivel",
        PAGAMENTO: "Problema com pagamento",
        REEMBOLSO: "Solicitacao de reembolso",
        ATENDIMENTO: "Atendimento",
        OUTRO: "Outro problema",
    };
    return mapa[motivo] ?? "Chamado de suporte";
}

function montarResumo(chamado) {
    return {
        ...chamado,
        motivo_texto: textoMotivo(chamado.motivo),
        mensagens_suporte: undefined,
    };
}

function montarDetalhe(chamado) {
    return {
        ...chamado,
        motivo_texto: textoMotivo(chamado.motivo),
        mensagens: (chamado.mensagens_suporte ?? [])
            .slice()
            .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em)),
        mensagens_suporte: undefined,
    };
}

async function buscarChamadoPorId(idChamado, perfil, select = SELECT_CHAMADO_DETALHE) {
    const { data, error } = await supabaseAdmin
        .from("chamados_suporte")
        .select(select)
        .eq("id_chamado", idChamado)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || !chamadoPertenceAoPerfil(data, perfil)) {
        const erro = new Error("Chamado nao encontrado.");
        erro.status = 404;
        throw erro;
    }
    return data;
}

async function obterContextoAbertura(body, perfil) {
    if (perfil.tipo !== "cliente") {
        const erro = new Error("Apenas clientes podem abrir chamados.");
        erro.status = 403;
        throw erro;
    }
    const idPedido = Number(body.id_pedido || 0) || null;
    const idReserva = Number(body.id_reserva || 0) || null;
    const idRestaurante = Number(body.id_restaurante || 0) || null;
    let pedido = null;
    let reserva = null;
    let restaurante = null;

    if (idPedido) {
        const { data, error } = await supabaseAdmin
            .from("pedidos")
            .select("id_pedido, id_cliente, id_restaurante, id_reserva, status_pedido, valor_total, data_pedido, reservas(id_reserva, id_cliente, id_restaurante, data_reserva, horario_inicio, status_reserva, status_confirmacao_presenca)")
            .eq("id_pedido", idPedido)
            .eq("id_cliente", perfil.id)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
            const erro = new Error("Pedido nao encontrado para este cliente.");
            erro.status = 404;
            throw erro;
        }
        pedido = data;
        reserva = data.reservas ?? null;
        restaurante = { id_restaurante: data.id_restaurante };
    }

    if (!pedido && idReserva) {
        const { data, error } = await supabaseAdmin
            .from("reservas")
            .select("id_reserva, id_cliente, id_restaurante, data_reserva, horario_inicio, status_reserva, status_confirmacao_presenca")
            .eq("id_reserva", idReserva)
            .eq("id_cliente", perfil.id)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
            const erro = new Error("Reserva nao encontrada para este cliente.");
            erro.status = 404;
            throw erro;
        }
        reserva = data;
        restaurante = { id_restaurante: data.id_restaurante };
    }

    if (!pedido && !reserva && idRestaurante) {
        const { data, error } = await supabaseAdmin
            .from("restaurantes")
            .select("id_restaurante")
            .eq("id_restaurante", idRestaurante)
            .eq("ativo", true)
            .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
            const erro = new Error("Restaurante nao encontrado.");
            erro.status = 404;
            throw erro;
        }
        restaurante = data;
    }

    if (!restaurante?.id_restaurante) {
        const erro = new Error("Informe pedido, reserva ou restaurante para abrir o chamado.");
        erro.status = 400;
        throw erro;
    }

    return {
        pedido,
        reserva,
        id_cliente: perfil.id,
        id_restaurante: restaurante.id_restaurante,
        id_reserva: pedido?.id_reserva ?? reserva?.id_reserva ?? null,
        id_pedido: pedido?.id_pedido ?? null,
    };
}

async function buscarChamadoAtivoDuplicado(contexto, motivo) {
    let consulta = supabaseAdmin
        .from("chamados_suporte")
        .select("id_chamado")
        .eq("id_cliente", contexto.id_cliente)
        .eq("motivo", motivo)
        .not("status", "in", "(RESOLVIDO,RECUSADO,CANCELADO)")
        .limit(1);
    if (contexto.id_pedido) {
        consulta = consulta.eq("id_pedido", contexto.id_pedido);
    }
    else if (contexto.id_reserva) {
        consulta = consulta.eq("id_reserva", contexto.id_reserva).is("id_pedido", null);
    }
    else {
        consulta = consulta.eq("id_restaurante", contexto.id_restaurante).is("id_pedido", null).is("id_reserva", null);
    }
    const { data, error } = await consulta.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}

async function inserirMensagemSistema(idChamado, conteudo, dados = {}) {
    return supabaseAdmin.from("mensagens_suporte").insert({
        id_chamado: idChamado,
        tipo_remetente: "sistema",
        conteudo,
        dados,
    });
}

async function inserirMensagemParticipante({ chamado, perfil, conteudo, dados = {} }) {
    const texto = normalizarTextoSuporte(conteudo);
    if (!texto) {
        const erro = new Error("Escreva uma mensagem antes de enviar.");
        erro.status = 400;
        throw erro;
    }
    const { data, error } = await supabaseAdmin.from("mensagens_suporte").insert({
        id_chamado: chamado.id_chamado,
        id_auth_remetente: resUserId(perfil),
        tipo_remetente: perfil.tipo,
        conteudo: texto,
        dados,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return data;
}

function resUserId(perfil) {
    return perfil.userId ?? null;
}

async function notificarAbertura(chamado) {
    await Promise.all([
        notificarRestaurante(chamado.id_restaurante, {
            titulo: "Novo chamado de suporte",
            mensagem: `O cliente abriu um chamado: ${textoMotivo(chamado.motivo)}.`,
            tipo_evento: "SUPORTE_CHAMADO_ABERTO",
            link_destino: `/restaurante/suporte`,
            dados: { id_chamado: chamado.id_chamado, id_pedido: chamado.id_pedido, id_reserva: chamado.id_reserva },
            dedupe_key: `suporte:${chamado.id_chamado}:aberto:restaurante`,
        }),
        notificarAdministradores({
            titulo: "Chamado de suporte aberto",
            mensagem: `Chamado #${chamado.id_chamado}: ${textoMotivo(chamado.motivo)}.`,
            tipo_evento: "SUPORTE_CHAMADO_ABERTO",
            link_destino: `/admin/suporte`,
            dados: { id_chamado: chamado.id_chamado, id_pedido: chamado.id_pedido, id_reserva: chamado.id_reserva },
            dedupe_key: `suporte:${chamado.id_chamado}:aberto:admin`,
        }),
    ]);
}

async function criarReembolsoVinculado({ chamado, contexto, descricao }) {
    if (!chamado.solicita_reembolso || !contexto.id_pedido) return null;
    if (paymentConfig.isRealMarketplace() || paymentConfig.productionAllowed()) {
        return { error: "O chamado foi aberto, mas o reembolso automatico esta disponivel apenas no marketplace simulado." };
    }
    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
        .from("pagamentos")
        .select("*")
        .eq("id_pedido", contexto.id_pedido)
        .order("atualizado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (pagamentoError) throw new Error(pagamentoError.message);

    let reembolsoExistente = null;
    if (pagamento?.id_pagamento) {
        const { data, error } = await supabaseAdmin
            .from("solicitacoes_reembolso")
            .select("*")
            .eq("id_pagamento", pagamento.id_pagamento)
            .order("solicitado_em", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(error.message);
        reembolsoExistente = data;
    }

    const elegibilidade = refundRequestEligibility({ payment: pagamento, existingRefund: reembolsoExistente });
    if (!elegibilidade.allowed) {
        return { error: mensagemErroReembolso(elegibilidade.code) };
    }
    if (pagamento.tipo_fluxo_pagamento !== "SIMULADO_APPONO") {
        return { error: "Este pagamento nao pertence ao marketplace simulado e exige analise manual do reembolso." };
    }

    const valor = Number(pagamento.valor_pago ?? pagamento.valor ?? contexto.pedido?.valor_total ?? 0);
    const motivo = normalizeRefundReason(`Chamado #${chamado.id_chamado} - ${textoMotivo(chamado.motivo)}. ${descricao}`);
    const { data: reembolso, error } = await supabaseAdmin
        .from("solicitacoes_reembolso")
        .insert({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: contexto.id_pedido,
            id_reserva: contexto.id_reserva,
            id_cliente: contexto.id_cliente,
            id_restaurante: contexto.id_restaurante,
            valor_solicitado: valor,
            motivo,
            modo_execucao: "MERCADO_PAGO_TESTE",
        })
        .select("*")
        .single();
    if (error) {
        return { error: error.code === "23505" ? "Ja existe um reembolso ativo para este pagamento." : error.message };
    }

    await Promise.all([
        supabaseAdmin
            .from("chamados_suporte")
            .update({ id_reembolso: reembolso.id_reembolso, atualizado_em: new Date().toISOString() })
            .eq("id_chamado", chamado.id_chamado),
        supabaseAdmin.from("eventos_financeiros").insert({
            id_pagamento: pagamento.id_pagamento,
            id_pedido: contexto.id_pedido,
            id_reserva: contexto.id_reserva,
            tipo_evento: "REEMBOLSO_SOLICITADO",
            descricao: motivo,
            valor,
        }),
        notificarRestaurante(contexto.id_restaurante, {
            titulo: "Nova solicitacao de reembolso",
            mensagem: `O cliente solicitou reembolso pelo chamado #${chamado.id_chamado}.`,
            tipo_evento: "REEMBOLSO_SOLICITADO",
            link_destino: "/restaurante/reembolsos",
            dados: { id_reembolso: reembolso.id_reembolso, id_pedido: contexto.id_pedido, id_chamado: chamado.id_chamado },
            dedupe_key: `suporte:${chamado.id_chamado}:reembolso:restaurante`,
        }),
        notificarAdministradores({
            titulo: "Reembolso solicitado pelo suporte",
            mensagem: `Chamado #${chamado.id_chamado} gerou uma solicitacao de reembolso.`,
            tipo_evento: "REEMBOLSO_SOLICITADO",
            link_destino: "/admin/reembolsos",
            dados: { id_reembolso: reembolso.id_reembolso, id_pedido: contexto.id_pedido, id_chamado: chamado.id_chamado },
            dedupe_key: `suporte:${chamado.id_chamado}:reembolso:admin`,
        }),
    ]);

    return { reembolso };
}

async function notificarResposta(chamado, perfil) {
    if (perfil.tipo === "cliente") {
        await notificarRestaurante(chamado.id_restaurante, {
            titulo: "Cliente respondeu ao suporte",
            mensagem: `O cliente respondeu o chamado #${chamado.id_chamado}.`,
            tipo_evento: "SUPORTE_RESPOSTA_RECEBIDA",
            link_destino: `/restaurante/suporte`,
            dados: { id_chamado: chamado.id_chamado },
            dedupe_key: `suporte:${chamado.id_chamado}:resposta:${Date.now()}:restaurante`,
        });
    }
    else if (perfil.tipo === "restaurante" || perfil.tipo === "admin") {
        await notificarCliente(chamado.id_cliente, {
            titulo: "Resposta no suporte",
            mensagem: `Seu chamado #${chamado.id_chamado} recebeu uma resposta.`,
            tipo_evento: "SUPORTE_RESPOSTA_RECEBIDA",
            link_destino: `/cliente/suporte`,
            dados: { id_chamado: chamado.id_chamado },
            dedupe_key: `suporte:${chamado.id_chamado}:resposta:${Date.now()}:cliente`,
        });
    }
}

supportRouter.get("/", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user);
        perfil.userId = res.locals.user.id;
        let consulta = supabaseAdmin
            .from("chamados_suporte")
            .select(SELECT_CHAMADO_LISTA)
            .order("atualizado_em", { ascending: false });
        if (perfil.tipo === "cliente") consulta = consulta.eq("id_cliente", perfil.id);
        if (perfil.tipo === "restaurante") consulta = consulta.eq("id_restaurante", perfil.id);
        if (req.query.status) consulta = consulta.eq("status", String(req.query.status).toUpperCase());
        if (req.query.motivo) consulta = consulta.eq("motivo", normalizarMotivoSuporte(req.query.motivo));
        if (req.query.prioridade) consulta = consulta.eq("prioridade", String(req.query.prioridade).trim().toUpperCase());
        if (perfil.tipo === "admin" && req.query.id_cliente) consulta = consulta.eq("id_cliente", normalizarId(req.query.id_cliente, "Cliente invalido."));
        if (perfil.tipo === "admin" && req.query.id_restaurante) consulta = consulta.eq("id_restaurante", normalizarId(req.query.id_restaurante, "Restaurante invalido."));
        const { data, error } = await consulta;
        if (error) throw new Error(error.message);
        return res.json({ items: (data ?? []).map(montarResumo), perfil: perfil.tipo });
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Nao foi possivel carregar o suporte." });
    }
});

supportRouter.post("/", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user);
        perfil.userId = res.locals.user.id;
        const contexto = await obterContextoAbertura(req.body ?? {}, perfil);
        const motivo = normalizarMotivoSuporte(req.body?.motivo);
        const validacao = validarAberturaChamado({
            motivo,
            descricao: req.body?.descricao,
            pedido: contexto.pedido,
            reserva: contexto.reserva,
        });
        if (!validacao.allowed) {
            return res.status(409).json({ error: mensagemErroValidacao(validacao.code), code: validacao.code });
        }
        const duplicado = await buscarChamadoAtivoDuplicado(contexto, motivo);
        if (duplicado) {
            return res.status(409).json({ error: "Ja existe um chamado ativo para este contexto e motivo.", id_chamado: duplicado.id_chamado });
        }
        const payload = {
            id_cliente: contexto.id_cliente,
            id_restaurante: contexto.id_restaurante,
            id_reserva: contexto.id_reserva,
            id_pedido: contexto.id_pedido,
            motivo,
            descricao: validacao.descricao,
            prioridade: prioridadePorMotivo(motivo),
            status: "ABERTO",
            solicita_reembolso: Boolean(req.body?.solicita_reembolso || motivo === "REEMBOLSO"),
            evidencias: Array.isArray(req.body?.evidencias) ? req.body.evidencias.slice(0, 5) : [],
        };
        const { data, error } = await supabaseAdmin
            .from("chamados_suporte")
            .insert(payload)
            .select(SELECT_CHAMADO_DETALHE)
            .single();
        if (error) throw new Error(error.code === "23505" ? "Ja existe um chamado ativo para este contexto e motivo." : error.message);
        await inserirMensagemSistema(data.id_chamado, `Chamado aberto: ${textoMotivo(motivo)}.`, { motivo });
        const resultadoReembolso = await criarReembolsoVinculado({ chamado: data, contexto, descricao: validacao.descricao });
        if (resultadoReembolso?.reembolso) {
            await inserirMensagemSistema(data.id_chamado, `Solicitacao de reembolso #${resultadoReembolso.reembolso.id_reembolso} vinculada ao chamado.`, {
                id_reembolso: resultadoReembolso.reembolso.id_reembolso,
            });
        }
        else if (resultadoReembolso?.error) {
            await inserirMensagemSistema(data.id_chamado, resultadoReembolso.error, { reembolso: "nao_criado" });
        }
        await notificarAbertura(data);
        const chamado = await buscarChamadoPorId(data.id_chamado, perfil);
        return res.status(201).json(montarDetalhe(chamado));
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Nao foi possivel abrir o chamado." });
    }
});

supportRouter.get("/:id", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user);
        perfil.userId = res.locals.user.id;
        const idChamado = normalizarId(req.params.id, "Chamado invalido.");
        const chamado = await buscarChamadoPorId(idChamado, perfil);
        return res.json({ chamado: montarDetalhe(chamado), perfil: perfil.tipo });
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Nao foi possivel carregar o chamado." });
    }
});

supportRouter.post("/:id/mensagens", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user);
        perfil.userId = res.locals.user.id;
        const idChamado = normalizarId(req.params.id, "Chamado invalido.");
        const chamado = await buscarChamadoPorId(idChamado, perfil, "*");
        if (STATUS_TERMINAIS_SUPORTE.has(chamado.status)) {
            return res.status(409).json({ error: "Este chamado ja foi encerrado." });
        }
        const mensagem = await inserirMensagemParticipante({
            chamado,
            perfil,
            conteudo: req.body?.conteudo,
        });
        const proximoStatus = proximoStatusPorMensagem(perfil.tipo, chamado.status);
        await supabaseAdmin
            .from("chamados_suporte")
            .update({ status: proximoStatus, atualizado_em: new Date().toISOString() })
            .eq("id_chamado", chamado.id_chamado);
        await notificarResposta(chamado, perfil);
        return res.status(201).json(mensagem);
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Nao foi possivel enviar a mensagem." });
    }
});

supportRouter.patch("/:id", async (req, res) => {
    try {
        const perfil = await obterPerfil(res.locals.user);
        perfil.userId = res.locals.user.id;
        const idChamado = normalizarId(req.params.id, "Chamado invalido.");
        const chamado = await buscarChamadoPorId(idChamado, perfil, "*");
        const acao = String(req.body?.acao ?? "").trim().toUpperCase();
        const agora = new Date().toISOString();
        let update = { atualizado_em: agora };
        let mensagemSistema = null;
        let mensagemUsuario = normalizarTextoSuporte(req.body?.mensagem ?? "", 1200);

        if (perfil.tipo === "cliente") {
            if (acao === "CANCELAR") {
                update = { ...update, status: "CANCELADO", cancelado_em: agora };
                mensagemSistema = "Chamado cancelado pelo cliente.";
            }
            else if (acao === "CONFIRMAR_RESOLUCAO") {
                update = { ...update, status: "RESOLVIDO", resolvido_em: agora };
                mensagemSistema = "Cliente confirmou que a solucao resolveu o chamado.";
            }
            else if (acao === "ANALISE_ADMIN") {
                update = { ...update, status: "EM_ANALISE_ADMIN" };
                mensagemSistema = "Cliente solicitou analise da Appono.";
            }
            else {
                return res.status(403).json({ error: "Acao nao permitida para cliente." });
            }
        }
        else if (perfil.tipo === "restaurante") {
            if (acao === "ASSUMIR") {
                update = {
                    ...update,
                    status: "AGUARDANDO_CLIENTE",
                    procedencia: "PROCEDENTE",
                    impacto_reputacao: calcularImpactoReputacao({ procedencia: "PROCEDENTE", motivo: chamado.motivo }),
                    id_auth_responsavel: res.locals.user.id,
                };
                mensagemSistema = "Restaurante assumiu o chamado.";
            }
            else if (acao === "CONTESTAR") {
                update = { ...update, status: "EM_ANALISE_ADMIN", id_auth_responsavel: res.locals.user.id };
                mensagemSistema = "Restaurante contestou o chamado e pediu analise da Appono.";
            }
            else if (acao === "RESOLVER") {
                update = { ...update, status: "AGUARDANDO_CLIENTE", resolucao: mensagemUsuario || "Solucao informada pelo restaurante.", id_auth_responsavel: res.locals.user.id };
                mensagemSistema = "Restaurante informou uma solucao e aguarda validacao do cliente.";
            }
            else if (acao === "ANALISE_ADMIN") {
                update = { ...update, status: "EM_ANALISE_ADMIN", id_auth_responsavel: res.locals.user.id };
                mensagemSistema = "Restaurante solicitou analise da Appono.";
            }
            else {
                return res.status(403).json({ error: "Acao nao permitida para restaurante." });
            }
        }
        else if (perfil.tipo === "admin") {
            if (acao !== "DECIDIR") {
                return res.status(403).json({ error: "Acao administrativa invalida." });
            }
            const procedencia = String(req.body?.procedencia ?? "").toUpperCase() === "PROCEDENTE" ? "PROCEDENTE" : "IMPROCEDENTE";
            const impacto = calcularImpactoReputacao({
                procedencia,
                motivo: chamado.motivo,
                impactoInformado: req.body?.impacto_reputacao,
            });
            update = {
                ...update,
                status: procedencia === "PROCEDENTE" ? "RESOLVIDO" : "RECUSADO",
                procedencia,
                impacto_reputacao: impacto,
                resolucao: mensagemUsuario || (procedencia === "PROCEDENTE" ? "Chamado considerado procedente pela Appono." : "Chamado considerado improcedente pela Appono."),
                resolvido_em: agora,
                id_auth_responsavel: res.locals.user.id,
            };
            mensagemSistema = procedencia === "PROCEDENTE"
                ? "Appono marcou o chamado como procedente."
                : "Appono marcou o chamado como improcedente.";
        }

        const { data, error } = await supabaseAdmin
            .from("chamados_suporte")
            .update(update)
            .eq("id_chamado", chamado.id_chamado)
            .select(SELECT_CHAMADO_DETALHE)
            .single();
        if (error) throw new Error(error.message);
        if (mensagemUsuario) {
            await inserirMensagemParticipante({ chamado, perfil, conteudo: mensagemUsuario, dados: { acao } });
        }
        if (mensagemSistema) {
            await inserirMensagemSistema(chamado.id_chamado, mensagemSistema, { acao });
        }
        if (["RESOLVIDO", "RECUSADO", "CANCELADO"].includes(data.status)) {
            await notificarCliente(data.id_cliente, {
                titulo: "Chamado atualizado",
                mensagem: `O chamado #${data.id_chamado} foi atualizado para ${data.status.toLowerCase()}.`,
                tipo_evento: "SUPORTE_DECISAO_FINAL",
                link_destino: "/cliente/suporte",
                dados: { id_chamado: data.id_chamado },
                dedupe_key: `suporte:${data.id_chamado}:status:${data.status}`,
            });
        }
        return res.json(montarDetalhe(await buscarChamadoPorId(data.id_chamado, perfil)));
    } catch (error) {
        return res.status(error.status ?? 400).json({ error: error.message ?? "Nao foi possivel atualizar o chamado." });
    }
});

module.exports = { supportRouter };
