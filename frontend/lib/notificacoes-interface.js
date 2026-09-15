import { traduzirTextoInterface } from "./i18n";

// Somente modelos gerados pelo sistema, associados ao tipo de evento conhecido.
// Os grupos capturados (nomes, IDs e valores) são preservados, nunca traduzidos.
const modelos = [
  ["MENSAGEM_RECEBIDA", /^(.+) enviou uma mensagem no chat\.$/s, (nome) => `${nome} sent a message in the chat.`],
  ["MENSAGEM_RECEBIDA", /^(.+) respondeu sua conversa\.$/s, (nome) => `${nome} replied to your conversation.`],
  ["NOVA_RESERVA", /^Uma reserva para (\d+) pessoa\(s\) foi registrada na sua agenda\.$/, (n) => `A reservation for ${n} ${Number(n) === 1 ? "guest" : "guests"} was added to your schedule.`],
  ["PRESENCA_CONFIRMADA", /^(.+) confirmou presenca na reserva\.$/s, (nome) => `${nome} confirmed attendance for the reservation.`],
  ["RESERVA_CHECK_IN", /^A reserva de (.+) entrou em atendimento\.$/s, (nome) => `The reservation for ${nome} is now in progress.`],
  ["RESERVA_CONCLUIDA", /^A reserva de (.+) foi concluida\.$/s, (nome) => `The reservation for ${nome} was completed.`],
  ["REEMBOLSO_SOLICITADO", /^O cliente solicitou reembolso do pedido #(\d+)\.$/, (id) => `The customer requested a refund for order #${id}.`],
  ["REEMBOLSO_CONCLUIDO", /^A solicitacao do pedido #(\d+) foi concluida no ambiente de testes do Mercado Pago\.$/, (id) => `The request for order #${id} was completed in Mercado Pago's test environment.`],
  ["PRESENCA_RECUSADA", /^Sua ausencia foi registrada e um reembolso parcial de R\$ ([\d.,]+) foi processado\.$/, (valor) => `Your absence was recorded and a partial refund of BRL ${valor} was processed.`],
];

export function mensagemNotificacaoUI(notificacao, idioma) {
  const texto = String(notificacao.mensagem ?? "");
  if (idioma !== "en" || ["REEMBOLSO_RECUSADO", "INFORMATIVO"].includes(notificacao.tipo_evento)) return texto;
  if (notificacao.tipo_evento === "STATUS_PEDIDO") {
    const status = texto.match(/^Seu pedido agora está como: (pendente|confirmado|em preparo|pronto|entregue|cancelado)\.$/);
    if (status) return `Your order is now: ${traduzirTextoInterface(status[1], idioma).toLowerCase()}.`;
  }
  for (const [evento, expressao, traduzir] of modelos) {
    if (evento !== notificacao.tipo_evento) continue;
    const resultado = texto.match(expressao);
    if (resultado) return traduzir(...resultado.slice(1));
  }
  return traduzirTextoInterface(texto, idioma);
}
