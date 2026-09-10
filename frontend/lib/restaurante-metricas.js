export function formatarMoedaResumo(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

export function obterDataLocalISO(data = new Date()) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dataEstaNoPeriodo(dataISO, dias) {
  if (!dataISO) {
    return false;
  }
  const data = new Date(`${dataISO}T12:00:00`);
  const hoje = new Date(`${obterDataLocalISO()}T12:00:00`);
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - dias + 1);
  return data >= inicio && data <= hoje;
}

export function obterPedidosDasReservas(reservas = []) {
  return reservas.flatMap((reserva) =>
    (reserva.pedidos ?? []).map((pedido) => ({ ...pedido, reserva })),
  );
}

export function obterDataPedido(pedido) {
  return pedido.reserva?.data_reserva ?? pedido.reservas?.data_reserva ?? pedido.data_pedido?.slice(0, 10);
}

export function obterReservasHoje(reservas = []) {
  const hoje = obterDataLocalISO();
  return reservas.filter((reserva) =>
    reserva.data_reserva === hoje &&
    !["CANCELADA", "RECUSADA", "NAO_COMPARECEU"].includes(reserva.status_reserva),
  );
}

export function obterReservasNoPeriodo(reservas = [], dias = 30) {
  return reservas.filter((reserva) =>
    dataEstaNoPeriodo(reserva.data_reserva, dias) &&
    !["CANCELADA", "RECUSADA", "NAO_COMPARECEU"].includes(reserva.status_reserva),
  );
}

export function obterPedidosNoPeriodo(pedidos = [], dias = 30) {
  return pedidos.filter((pedido) => dataEstaNoPeriodo(obterDataPedido(pedido), dias));
}

export function obterPedidosAtivos(pedidos = []) {
  return pedidos.filter((pedido) =>
    ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(pedido.status_pedido),
  );
}

export function obterPedidosEntregues(pedidos = []) {
  return pedidos.filter((pedido) => pedido.status_pedido === "ENTREGUE");
}

export function obterClientesUnicos(reservas = [], pedidos = []) {
  const clientes = new Set();
  reservas.forEach((reserva) => {
    const nome = reserva.clientes?.nome;
    if (nome) {
      clientes.add(nome);
    }
  });
  pedidos.forEach((pedido) => {
    const nome = pedido.clientes?.nome ?? pedido.reserva?.clientes?.nome;
    if (nome) {
      clientes.add(nome);
    }
  });
  return clientes.size;
}

export function calcularTicketMedio(pedidos = []) {
  const pedidosValidos = pedidos.filter((pedido) =>
    !["PENDENTE", "CANCELADO"].includes(pedido.status_pedido) && Number(pedido.valor_total ?? 0) > 0,
  );
  if (!pedidosValidos.length) {
    return 0;
  }
  const total = pedidosValidos.reduce((soma, pedido) => soma + Number(pedido.valor_total ?? 0), 0);
  return total / pedidosValidos.length;
}

export function calcularItensVendidos(pedidos = []) {
  return pedidos
    .filter((pedido) => !["PENDENTE", "CANCELADO"].includes(pedido.status_pedido))
    .flatMap((pedido) => pedido.itens_pedido ?? [])
    .reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
}

export function montarSerieReservas(reservas = [], dias = 7) {
  const hoje = new Date(`${obterDataLocalISO()}T12:00:00`);
  return Array.from({ length: dias }, (_, index) => {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - (dias - 1 - index));
    const dataISO = obterDataLocalISO(data);
    return {
      data: dataISO,
      label: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valor: reservas.filter((reserva) => reserva.data_reserva === dataISO).length,
    };
  });
}
