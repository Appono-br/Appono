const assert = require("node:assert/strict");
const test = require("node:test");
const { loadFrontend } = require("./support/load-frontend.cjs");

const carregarNotificacoes = loadFrontend("lib/notificacoes-interface.js");

test("translates generated notifications with accents while preserving names and identifiers", async () => {
  const { mensagemNotificacaoUI } = await carregarNotificacoes;
  const exemplos = [
    ["MENSAGEM_RECEBIDA", "João & Filhos enviou uma mensagem no chat.", "João & Filhos sent a message in the chat."],
    ["MENSAGEM_RECEBIDA", "Café São José respondeu sua conversa.", "Café São José replied to your conversation."],
    ["NOVA_RESERVA", "Uma reserva para 1 pessoa(s) foi registrada na sua agenda.", "A reservation for 1 guest was added to your schedule."],
    ["NOVA_RESERVA", "Uma reserva para 3 pessoa(s) foi registrada na sua agenda.", "A reservation for 3 guests was added to your schedule."],
    ["PRESENCA_CONFIRMADA", "João confirmou presença na reserva.", "João confirmed attendance for the reservation."],
    ["RESERVA_CHECK_IN", "A reserva de João entrou em atendimento.", "The reservation for João is now in progress."],
    ["RESERVA_CONCLUIDA", "A reserva de João foi concluída.", "The reservation for João was completed."],
    ["REEMBOLSO_SOLICITADO", "O cliente solicitou reembolso do pedido #42.", "The customer requested a refund for order #42."],
    ["REEMBOLSO_SOLICITADO", "O pedido #42 possui uma solicitação para análise.", "Order #42 has a request awaiting review."],
    ["REEMBOLSO_SOLICITADO", "O cliente solicitou reembolso pelo chamado #8.", "The customer requested a refund through support ticket #8."],
    ["REEMBOLSO_SOLICITADO", "Chamado #8 gerou uma solicitação de reembolso.", "Support ticket #8 generated a refund request."],
    ["REEMBOLSO_CONCLUIDO", "A solicitação do pedido #42 foi concluída no ambiente de testes do Mercado Pago.", "The request for order #42 was completed in Mercado Pago's test environment."],
    ["PAGAMENTO_APROVADO", "Pedido #42 aprovado no Mercado Pago para conciliação financeira.", "Order #42 was approved by Mercado Pago for financial reconciliation."],
    ["REPASSE_LIBERADO", "Pedido #42 foi entregue e ficou liberado para repasse ao restaurante.", "Order #42 was delivered and the payout to the restaurant was released."],
    ["REPASSE_ESTORNADO", "Pedido #42 foi cancelado e o repasse foi marcado como estornado.", "Order #42 was cancelled and the payout was marked as reversed."],
    ["REPASSE_ESTORNADO", "Pedido #42 cancelado. O repasse foi marcado como estornado quando havia pagamento vinculado.", "Order #42 was cancelled. The payout was marked as reversed when a payment was linked to the order."],
    ["SUPORTE_CHAMADO_ABERTO", "O cliente abriu um chamado: Pedido incorreto.", "The customer opened a support ticket: Incorrect order."],
    ["SUPORTE_CHAMADO_ABERTO", "Chamado #8: Pedido não estava pronto.", "Support ticket #8: Order was not ready."],
    ["SUPORTE_RESPOSTA_RECEBIDA", "O cliente respondeu o chamado #8.", "The customer replied to support ticket #8."],
    ["SUPORTE_RESPOSTA_RECEBIDA", "Seu chamado #8 recebeu uma resposta.", "Your support ticket #8 received a reply."],
    ["PRESENCA_EXPIRADA", "Reserva #12 cancelada automaticamente por falta de confirmação de presença.", "Reservation #12 was automatically cancelled because attendance was not confirmed."],
    ["REEMBOLSO_PARCIAL_AUSENCIA", "Reserva #12 cancelada pelo cliente com reembolso do excedente após preço da reserva e comissão Appono.", "Reservation #12 was cancelled by the customer, with the remaining amount refunded after the reservation fee and Appono commission."],
  ];
  for (const [tipo_evento, mensagem, esperado] of exemplos) {
    const notificacao = { tipo_evento, mensagem };
    assert.equal(mensagemNotificacaoUI(notificacao, "en"), esperado, tipo_evento);
    assert.equal(mensagemNotificacaoUI(notificacao, "pt-BR"), mensagem, tipo_evento);
  }
});

test("translates all generated order and support statuses", async () => {
  const { mensagemNotificacaoUI } = await carregarNotificacoes;
  for (const [status, ingles] of Object.entries({ pendente: "pending", confirmado: "confirmed", "em preparo": "preparing", pronto: "ready", entregue: "delivered", cancelado: "cancelled" })) {
    assert.equal(mensagemNotificacaoUI({ tipo_evento: "STATUS_PEDIDO", mensagem: `Seu pedido agora está como: ${status}.` }, "en"), `Your order is now: ${ingles}.`);
  }
  for (const [status, ingles] of Object.entries({ aberto: "open", aguardando_restaurante: "awaiting the restaurant", aguardando_cliente: "awaiting the customer", em_analise_admin: "under Appono review", resolvido: "resolved", recusado: "rejected", cancelado: "cancelled" })) {
    assert.equal(mensagemNotificacaoUI({ tipo_evento: "SUPORTE_DECISAO_FINAL", mensagem: `O chamado #8 foi atualizado para ${status}.` }, "en"), `Support ticket #8 was updated to ${ingles}.`);
  }
});

test("formats partial refund amounts in English without changing the amount", async () => {
  const { mensagemNotificacaoUI } = await carregarNotificacoes;
  assert.equal(mensagemNotificacaoUI({ tipo_evento: "PRESENCA_RECUSADA", mensagem: "Sua ausência foi registrada e um reembolso parcial de R$ 1.234,56 foi processado." }, "en"), "Your absence was recorded and a partial refund of R$1,234.56 was processed.");
  assert.equal(mensagemNotificacaoUI({ tipo_evento: "PRESENCA_EXPIRADA", mensagem: "O prazo de confirmação expirou e um reembolso parcial de R$ 25,50 foi processado." }, "en"), "The confirmation deadline expired and a partial refund of R$25.50 was processed.");
});

test("preserves custom notification and refusal messages even when they match interface text", async () => {
  const { mensagemNotificacaoUI } = await carregarNotificacoes;
  for (const tipo_evento of ["INFORMATIVO", "REEMBOLSO_RECUSADO"]) {
    for (const mensagem of ["Pedido cancelado", "João confirmou presença na reserva.", "O restaurante informou: pagamento já devolvido."]) {
      assert.equal(mensagemNotificacaoUI({ tipo_evento, mensagem }, "en"), mensagem);
    }
  }
  assert.equal(mensagemNotificacaoUI({ tipo_evento: "MENSAGEM_RECEBIDA", mensagem: "Mensagem escrita pela cliente: podemos chegar às 20h?" }, "en"), "Mensagem escrita pela cliente: podemos chegar às 20h?");
});

test("translates composed recommendation reasons without translating custom content", async () => {
  const { traduzirMotivoRecomendacao, traduzirConteudoGlossario } = await loadFrontend("lib/glossario-conteudo.js");
  const motivo = "restaurante favorito, perto da sua base, dentro do orçamento, bem avaliado, combina com suas preferências, considera seus retornos anteriores";
  assert.equal(traduzirMotivoRecomendacao(motivo, "en"), "favorite restaurant, near your base location, within your budget, highly rated, matches your preferences, takes your previous feedback into account");
  assert.equal(traduzirMotivoRecomendacao(motivo, "pt-BR"), motivo);
  assert.equal(traduzirMotivoRecomendacao("afinidade semântica com suas preferências", "en"), "matches the meaning of your preferences");
  assert.equal(traduzirMotivoRecomendacao("melhor opção disponível para sua rotina", "en"), "best available option for your routine");
  assert.equal(traduzirMotivoRecomendacao("restaurante favorito, almoço da minha filha", "en"), "restaurante favorito, almoço da minha filha");
  assert.equal(traduzirConteudoGlossario("Prato da família João", "en"), "Prato da família João");
  for (const texto of ["constructor", "__proto__", "toString"]) {
    assert.equal(traduzirConteudoGlossario(texto, "en"), texto);
    assert.equal(traduzirMotivoRecomendacao(texto, "en"), texto);
  }
});

test("translates combined generated diagnostics only when every sentence is known", async () => {
  const { traduzirMotivoRecomendacao } = await loadFrontend("lib/glossario-conteudo.js");
  const motivo = "Há restaurantes fora da distância máxima. Há restaurantes sem localização cadastrada. Há opções acima do orçamento diário. Há cardápios incompatíveis com as restrições ou os horários disponíveis.";
  assert.equal(traduzirMotivoRecomendacao(motivo, "en"), "Some restaurants are beyond the maximum distance. Some restaurants have no registered location. Some options exceed your daily budget. Some menus do not match your restrictions or available times.");
  assert.equal(traduzirMotivoRecomendacao(motivo, "pt-BR"), motivo);
  const personalizado = "Há opções acima do orçamento diário. Eu quero almoçar com João.";
  assert.equal(traduzirMotivoRecomendacao(personalizado, "en"), personalizado);
});
