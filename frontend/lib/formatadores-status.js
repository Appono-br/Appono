export function formatarCodigoSistema(valor, fallback = "Em acompanhamento") {
    if (!valor) {
        return fallback;
    }
    return String(valor)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export function textoTipoEvento(tipo) {
    const eventos = {
        NOVA_RESERVA: "Nova reserva",
        RESERVA_CONFIRMADA: "Reserva confirmada",
        RESERVA_CANCELADA: "Reserva cancelada",
        RESERVA_CHECK_IN: "Check-in realizado",
        RESERVA_CONCLUIDA: "Reserva finalizada",
        PRESENCA_CONFIRMADA: "Presenca confirmada",
        PRESENCA_RECUSADA: "Ausencia informada",
        PEDIDO_CRIADO: "Pedido criado",
        PEDIDO_CANCELADO: "Pedido cancelado",
        STATUS_PEDIDO: "Status do pedido",
        PAGAMENTO_CRIADO: "Pagamento criado",
        PAGAMENTO_APROVADO: "Pagamento aprovado",
        PAGAMENTO_PENDENTE: "Pagamento pendente",
        PAGAMENTO_RECUSADO: "Pagamento recusado",
        REPASSE_LIBERADO: "Repasse liberado",
        REPASSE_ESTORNADO: "Repasse estornado",
        REEMBOLSO_SOLICITADO: "Reembolso solicitado",
        REEMBOLSO_CONCLUIDO: "Reembolso concluido",
        REEMBOLSO_RECUSADO: "Reembolso recusado",
        INFORMATIVO: "Informativo",
    };
    return eventos[tipo] ?? formatarCodigoSistema(tipo, "Notificacao");
}

export function textoStatusRepasse(status) {
    const statusMap = {
        AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
        AGUARDANDO_ENTREGA: "Retido ate entrega",
        LIBERADO_PARA_REPASSE: "Liberado para repasse",
        REPASSADO: "Repassado",
        ESTORNADO: "Estornado",
        NAO_APLICAVEL: "Nao aplicavel",
    };
    return statusMap[status] ?? formatarCodigoSistema(status, "Em acompanhamento");
}

export function textoStatusReembolso(status) {
    const statusMap = {
        SOLICITADO: "Solicitado",
        EM_ANALISE: "Em analise",
        APROVADO: "Aprovado",
        RECUSADO: "Recusado",
        CONCLUIDO: "Concluido (simulado)",
        CANCELADO: "Cancelado pelo cliente",
    };
    return statusMap[status] ?? formatarCodigoSistema(status, "Reembolso");
}

export function textoStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Aguardando pagamento",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };
    return statusMap[status] ?? formatarCodigoSistema(status, "Pedido");
}

export function textoStatusReserva(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADA: "Confirmada",
        CHECK_IN: "Check-in realizado",
        CANCELADA: "Cancelada",
        CONCLUIDA: "Concluida",
        NAO_COMPARECEU: "Não compareceu",
    };
    return statusMap[status] ?? formatarCodigoSistema(status, "Reserva");
}

export function textoStatusPagamento(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        APROVADO: "Aprovado",
        RECUSADO: "Recusado",
        ESTORNADO: "Estornado",
        CANCELADO: "Cancelado",
        NAO_APLICAVEL: "Nao aplicavel",
    };
    return statusMap[status] ?? formatarCodigoSistema(status, "Pagamento");
}

export function textoFluxoPagamento(fluxo) {
    const fluxos = {
        SIMULADO_APPONO: "Simulado pela Appono",
        SIMULACAO_APPONO: "Simulado pela Appono",
        DIRETO_APPONO: "Pagamento direto Appono",
        MARKETPLACE_RESTAURANTE: "Marketplace com restaurante",
    };
    return fluxos[fluxo] ?? formatarCodigoSistema(fluxo, "Appono");
}
