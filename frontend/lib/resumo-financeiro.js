function numeroDisponivel(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

export function obterIndicadoresFinanceiros(resumo, repasses) {
  if (!resumo || !Array.isArray(repasses)) return { bruto: null, taxas: null, estornos: null, liquido: null, pendente: null, disponivel: null };
  let bruto = 0;
  let pendente = 0;
  if (Number(resumo.quantidade_pagamentos) > repasses.length) {
    return { bruto: null, taxas: numeroDisponivel(resumo.valor_comissao_app), estornos: numeroDisponivel(resumo.valor_reembolsado), liquido: numeroDisponivel(resumo.valor_restaurante), pendente: null, disponivel: numeroDisponivel(resumo.valor_liberado) };
  }
  for (const pagamento of repasses) {
    if (!pagamento.status_pagamento || !pagamento.pedido?.status_pedido) {
      bruto = null;
      pendente = null;
      continue;
    }
    if (pagamento.status_pagamento !== "APROVADO") continue;
    const restaurante = numeroDisponivel(pagamento.valor_restaurante);
    if (pagamento.status_repasse === "ESTORNADO" ||
      (pagamento.pedido?.status_pedido === "CANCELADO" && restaurante === 0)) continue;
    if (pagamento.pedido?.status_pedido === "CANCELADO" && restaurante === null) {
      bruto = null;
      pendente = null;
      continue;
    }
    const pago = numeroDisponivel(pagamento.valor_pago ?? pagamento.valor);
    bruto = bruto === null || pago === null ? null : bruto + pago;
    if (["AGUARDANDO_ENTREGA", "LIBERADO_PARA_REPASSE"].includes(pagamento.status_repasse)) {
      pendente = pendente === null || restaurante === null ? null : pendente + restaurante;
    } else if (pagamento.status_repasse !== "REPASSADO") {
      pendente = null;
    }
  }
  return { bruto, taxas: numeroDisponivel(resumo.valor_comissao_app), estornos: numeroDisponivel(resumo.valor_reembolsado), liquido: numeroDisponivel(resumo.valor_restaurante), pendente, disponivel: numeroDisponivel(resumo.valor_liberado) };
}
