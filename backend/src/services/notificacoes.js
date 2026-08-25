"use strict";

const { supabaseAdmin } = require("../lib/supabase");

const mapaEventosPreferenciasRestaurante = {
    NOVA_RESERVA: "newReservation",
    RESERVA_CONFIRMADA: "newReservation",
    RESERVA_CANCELADA: "reservationChange",
    RESERVA_CHECK_IN: "reservationChange",
    RESERVA_CONCLUIDA: "reservationChange",
    PEDIDO_CRIADO: "orderAhead",
    PEDIDO_CANCELADO: "orderAhead",
    STATUS_PEDIDO: "orderAhead",
    PAGAMENTO_APROVADO: "billing",
    REPASSE_LIBERADO: "billing",
    REPASSE_ESTORNADO: "billing",
    REEMBOLSO_SOLICITADO: "billing",
    REEMBOLSO_CONCLUIDO: "billing",
    REEMBOLSO_RECUSADO: "billing",
};

function obterEmailsAdministradores() {
    return String(process.env.APPONO_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}

function obterDedupeKey(dados) {
    if (dados.dedupe_key) {
        return dados.dedupe_key;
    }
    const idPedido = dados.dados?.id_pedido ?? "sem-pedido";
    const idReserva = dados.dados?.id_reserva ?? "sem-reserva";
    return `${dados.tipo_evento ?? "INFORMATIVO"}:${idPedido}:${idReserva}`;
}

async function buscarAuthCliente(idCliente) {
    if (!supabaseAdmin || !idCliente) {
        return null;
    }
    const { data, error } = await supabaseAdmin
        .from("clientes")
        .select("id_auth")
        .eq("id_cliente", idCliente)
        .maybeSingle();
    if (error) {
        console.warn("Falha ao buscar auth do cliente para notificacao:", error.message);
        return null;
    }
    return data?.id_auth ?? null;
}

async function buscarAuthRestaurante(idRestaurante) {
    if (!supabaseAdmin || !idRestaurante) {
        return null;
    }
    const { data, error } = await supabaseAdmin
        .from("restaurantes")
        .select("id_auth")
        .eq("id_restaurante", idRestaurante)
        .maybeSingle();
    if (error) {
        console.warn("Falha ao buscar auth do restaurante para notificacao:", error.message);
        return null;
    }
    return data?.id_auth ?? null;
}

async function buscarPreferenciasRestaurante(idRestaurante) {
    if (!supabaseAdmin || !idRestaurante) {
        return null;
    }
    const { data, error } = await supabaseAdmin
        .from("restaurantes")
        .select("preferencias_notificacao")
        .eq("id_restaurante", idRestaurante)
        .maybeSingle();
    if (error) {
        console.warn("Falha ao buscar preferencias de notificacao:", error.message);
        return null;
    }
    return data?.preferencias_notificacao ?? null;
}

function restauranteAceitaNotificacao(preferencias, tipoEvento) {
    const regra = mapaEventosPreferenciasRestaurante[tipoEvento];
    if (!regra || !preferencias?.rules?.length) {
        return true;
    }
    const configuracao = preferencias.rules.find((item) => item.key === regra);
    if (!configuracao) {
        return true;
    }
    return Boolean(configuracao.channels?.push);
}

async function criarNotificacao(dados) {
    if (!supabaseAdmin || !dados?.id_auth_destinatario) {
        return null;
    }
    const dedupeKey = obterDedupeKey(dados);
    if (dedupeKey) {
        const { data: existente, error: buscaError } = await supabaseAdmin
            .from("notificacoes")
            .select("*")
            .eq("id_auth_destinatario", dados.id_auth_destinatario)
            .eq("dedupe_key", dedupeKey)
            .maybeSingle();
        if (buscaError) {
            console.warn("Falha ao verificar notificacao duplicada:", buscaError.message);
        }
        if (existente) {
            return existente;
        }
    }
    const { data, error } = await supabaseAdmin
        .from("notificacoes")
        .insert({
            id_auth_destinatario: dados.id_auth_destinatario,
            tipo_destinatario: dados.tipo_destinatario,
            titulo: dados.titulo,
            mensagem: dados.mensagem,
            tipo_evento: dados.tipo_evento ?? "INFORMATIVO",
            link_destino: dados.link_destino ?? null,
            dados: dados.dados ?? {},
            dedupe_key: dedupeKey,
        })
        .select("*")
        .single();
    if (error) {
        console.warn("Falha ao criar notificacao:", error.message);
        return null;
    }
    return data;
}

async function notificarCliente(idCliente, dados) {
    const idAuth = await buscarAuthCliente(idCliente);
    return criarNotificacao({
        ...dados,
        id_auth_destinatario: idAuth,
        tipo_destinatario: "cliente",
    });
}

async function notificarRestaurante(idRestaurante, dados) {
    const preferencias = await buscarPreferenciasRestaurante(idRestaurante);
    if (!restauranteAceitaNotificacao(preferencias, dados.tipo_evento)) {
        return null;
    }
    const idAuth = await buscarAuthRestaurante(idRestaurante);
    return criarNotificacao({
        ...dados,
        id_auth_destinatario: idAuth,
        tipo_destinatario: "restaurante",
    });
}

async function notificarAdministradores(dados) {
    if (!supabaseAdmin) {
        return [];
    }
    const emails = obterEmailsAdministradores();
    if (!emails.length) {
        return [];
    }
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.warn("Falha ao listar administradores para notificacao:", error.message);
        return [];
    }
    const admins = (data?.users ?? []).filter((user) => emails.includes(String(user.email ?? "").toLowerCase()));
    return Promise.all(admins.map((admin) => criarNotificacao({
        ...dados,
        id_auth_destinatario: admin.id,
        tipo_destinatario: "admin",
    })));
}

module.exports = {
    criarNotificacao,
    notificarCliente,
    notificarRestaurante,
    notificarAdministradores,
};
