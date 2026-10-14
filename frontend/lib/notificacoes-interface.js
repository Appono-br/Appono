import { traduzirTextoInterface } from "./i18n";

const modelos = [
  ["MENSAGEM_RECEBIDA", /^(.+) enviou uma mensagem no chat\.$/s, (nome) => `${nome} sent a message in the chat.`],
  ["MENSAGEM_RECEBIDA", /^(.+) respondeu sua conversa\.$/s, (nome) => `${nome} replied to your conversation.`],
  ["NOVA_RESERVA", /^Uma reserva para (\d+) pessoa\(s\) foi registrada na sua agenda\.$/, (n) => `A reservation for ${n} ${Number(n) === 1 ? "guest" : "guests"} was added to your schedule.`],
  ["PRESENCA_CONFIRMADA", /^(.+) confirmou presen[cç]a na reserva\.$/s, (nome) => `${nome} confirmed attendance for the reservation.`],
  ["RESERVA_CHECK_IN", /^A reserva de (.+) entrou em atendimento\.$/s, (nome) => `The reservation for ${nome} is now in progress.`],
  ["RESERVA_CONCLUIDA", /^A reserva de (.+) foi conclu[ií]da\.$/s, (nome) => `The reservation for ${nome} was completed.`],
  ["REEMBOLSO_SOLICITADO", /^O cliente solicitou reembolso do pedido #(\d+)\.$/, (id) => `The customer requested a refund for order #${id}.`],
  ["REEMBOLSO_SOLICITADO", /^O pedido #(\d+) possui uma solicita[cç][aã]o para an[aá]lise\.$/, (id) => `Order #${id} has a request awaiting review.`],
  ["REEMBOLSO_SOLICITADO", /^O cliente solicitou reembolso pelo chamado #(\d+)\.$/, (id) => `The customer requested a refund through support ticket #${id}.`],
  ["REEMBOLSO_SOLICITADO", /^Chamado #(\d+) gerou uma solicita[cç][aã]o de reembolso\.$/, (id) => `Support ticket #${id} generated a refund request.`],
  ["REEMBOLSO_CONCLUIDO", /^A solicita[cç][aã]o do pedido #(\d+) foi conclu[ií]da no ambiente de testes do Mercado Pago\.$/, (id) => `The request for order #${id} was completed in Mercado Pago's test environment.`],
  ["PRESENCA_RECUSADA", /^Sua aus[eê]ncia foi registrada e um reembolso parcial de R\$ ([\d.,]+) foi processado\.$/, (valor) => `Your absence was recorded and a partial refund of ${moedaBRL(valor)} was processed.`],
  ["PRESENCA_EXPIRADA", /^O prazo de confirma[cç][aã]o expirou e um reembolso parcial de R\$ ([\d.,]+) foi processado\.$/, (valor) => `The confirmation deadline expired and a partial refund of ${moedaBRL(valor)} was processed.`],
  ["PRESENCA_EXPIRADA", /^Reserva #(\d+) cancelada automaticamente por falta de confirma[cç][aã]o de presen[cç]a\.$/, (id) => `Reservation #${id} was automatically cancelled because attendance was not confirmed.`],
  ["REEMBOLSO_PARCIAL_AUSENCIA", /^Reserva #(\d+) cancelada pelo cliente com reembolso do excedente ap[oó]s pre[cç]o da reserva e comiss[aã]o Appono\.$/, (id) => `Reservation #${id} was cancelled by the customer, with the remaining amount refunded after the reservation fee and Appono commission.`],
  ["PAGAMENTO_APROVADO", /^Pedido #(\d+) aprovado no Mercado Pago para concilia[cç][aã]o financeira\.$/, (id) => `Order #${id} was approved by Mercado Pago for financial reconciliation.`],
  ["REPASSE_LIBERADO", /^Pedido #(\d+) foi entregue e ficou liberado para repasse ao restaurante\.$/, (id) => `Order #${id} was delivered and the payout to the restaurant was released.`],
  ["REPASSE_ESTORNADO", /^Pedido #(\d+) foi cancelado e o repasse foi marcado como estornado\.$/, (id) => `Order #${id} was cancelled and the payout was marked as reversed.`],
  ["REPASSE_ESTORNADO", /^Pedido #(\d+) cancelado\. O repasse foi marcado como estornado quando havia pagamento vinculado\.$/, (id) => `Order #${id} was cancelled. The payout was marked as reversed when a payment was linked to the order.`],
  ["SUPORTE_CHAMADO_ABERTO", /^O cliente abriu um chamado: (.+)\.$/, (motivo) => `The customer opened a support ticket: ${traduzirTextoInterface(motivo, "en")}.`],
  ["SUPORTE_CHAMADO_ABERTO", /^Chamado #(\d+): (.+)\.$/, (id, motivo) => `Support ticket #${id}: ${traduzirTextoInterface(motivo, "en")}.`],
  ["SUPORTE_RESPOSTA_RECEBIDA", /^O cliente respondeu o chamado #(\d+)\.$/, (id) => `The customer replied to support ticket #${id}.`],
  ["SUPORTE_RESPOSTA_RECEBIDA", /^Seu chamado #(\d+) recebeu uma resposta\.$/, (id) => `Your support ticket #${id} received a reply.`],
  ["SUPORTE_DECISAO_FINAL", /^O chamado #(\d+) foi atualizado para (aberto|aguardando_restaurante|aguardando_cliente|em_analise_admin|resolvido|recusado|cancelado)\.$/, (id, status) => `Support ticket #${id} was updated to ${statusSuporteEn[status]}.`],
];

const statusPedidoEn = {
  pendente: "pending", confirmado: "confirmed", "em preparo": "preparing",
  pronto: "ready", entregue: "delivered", cancelado: "cancelled",
};

const statusSuporteEn = {
  aberto: "open", aguardando_restaurante: "awaiting the restaurant",
  aguardando_cliente: "awaiting the customer", em_analise_admin: "under Appono review",
  resolvido: "resolved", recusado: "rejected", cancelado: "cancelled",
};

function moedaBRL(valor) {
  const numero = Number(valor.replaceAll(".", "").replace(",", "."));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "BRL" }).format(numero);
}

export function mensagemNotificacaoUI(notificacao, idioma) {
  const mensagem = String(notificacao.mensagem ?? "");
  const texto = notificacao.tipo_evento === "RESERVA_CANCELADA"
    ? mensagem.replace("pelo módulo cliente.", "pela área do cliente.")
    : mensagem;
  if (idioma !== "en" || ["REEMBOLSO_RECUSADO", "INFORMATIVO"].includes(notificacao.tipo_evento)) return texto;
  if (notificacao.tipo_evento === "STATUS_PEDIDO") {
    const status = texto.match(/^Seu pedido agora está como: (pendente|confirmado|em preparo|pronto|entregue|cancelado)\.$/);
    if (status) return `Your order is now: ${statusPedidoEn[status[1]]}.`;
  }
  for (const [evento, expressao, traduzir] of modelos) {
    if (evento !== notificacao.tipo_evento) continue;
    const resultado = texto.match(expressao);
    if (resultado) return traduzir(...resultado.slice(1));
  }
  return traduzirTextoInterface(texto, idioma);
}
