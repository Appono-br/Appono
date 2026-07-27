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
        PEDIDO_CRIADO: "Pedido criado",
        PEDIDO_CANCELADO: "Pedido cancelado",
        STATUS_PEDIDO: "Status do pedido",
        PAGAMENTO_CRIADO: "Pagamento criado",
        PAGAMENTO_APROVADO: "Pagamento aprovado",
        PAGAMENTO_PENDENTE: "Pagamento pendente",
        PAGAMENTO_RECUSADO: "Pagamento recusado",
        REPASSE_LIBERADO: "Repasse liberado",
        REPASSE_ESTORNADO: "Repasse estornado",
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

export function textoFluxoPagamento(fluxo) {
    const fluxos = {
        SIMULADO_APPONO: "Simulado pela Appono",
        SIMULACAO_APPONO: "Simulado pela Appono",
        DIRETO_APPONO: "Pagamento direto Appono",
        MARKETPLACE_RESTAURANTE: "Marketplace com restaurante",
    };
    return fluxos[fluxo] ?? formatarCodigoSistema(fluxo, "Appono");
}
