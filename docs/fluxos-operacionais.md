# Fluxos operacionais do Appono

[Voltar ao README](../README.md)

Referência de regras e endpoints presentes no código. Os fluxos dependem do schema e das integrações configuradas; sua descrição não substitui testes de ponta a ponta. Consulte também a [preparação do Supabase](preparacao-supabase.md).

## Segurança de pagamentos

A Appono não coleta nem armazena número completo de cartão, validade ou CVV. Esses dados são informados exclusivamente no checkout do Mercado Pago. Dados legados são removidos do navegador ao carregar a aplicação.

O webhook usa assinatura quando o segredo está configurado, controle de idempotência e trilha de processamento. Eventos atrasados não regridem pagamento aprovado; estorno e chargeback prevalecem como estados terminais.

Pedidos pendentes podem iniciar ou reutilizar um checkout quando a reserva está `PENDENTE` ou `CONFIRMADA` e ainda não chegou ao horário marcado, conforme [payment-eligibility.js](../backend/src/domain/payment-eligibility.js). Os serviços de expiração encerram pedidos e pagamentos pendentes vencidos e registram eventos. Na conciliação, o backend compara `date_approved` do Mercado Pago — ou `date_created` como fallback — com o horário da reserva; o horário de chegada do webhook não define esse prazo. A regra de aprovação tardia prevê estorno idempotente, sem solicitar um segundo estorno para pagamentos já estornados.

Pagamento aprovado e check-in são estados independentes: o pagamento confirma o pedido, enquanto o check-in registra a presença e só é liberado 15 minutos antes da reserva. O restaurante pode desmarcar uma reserva antes do início, respeitando as restrições de preparo. Se houver pagamento aprovado, `PATCH /api/reservas/:id/cancelar-restaurante` processa o reembolso antes de cancelar a reserva e o pedido. A chamada ao gateway depende do modo financeiro e do tipo do pagamento; quando exigida, sua falha impede o cancelamento.

Quando `MERCADO_PAGO_PERMITIR_PRODUCAO=false`, o backend entrega exclusivamente `sandbox_init_point`; nunca utiliza `init_point`, independentemente do prefixo da credencial. Pagamentos reais legados exigem uma credencial de produção com permissão de pagamentos para serem estornados, ou estorno manual pelo painel Mercado Pago.
Nos fluxos que consultam o gateway, uma nova tentativa após estorno manual reconhece `refunded` e sincroniza os registros sem solicitar outro estorno.

A confirmação de presença ou o aviso de ausência pode ocorrer até uma hora antes da reserva. A ausência cancela os pedidos elegíveis e calcula o reembolso pelo excedente: valor pago menos consumo mínimo e comissão, limitado a zero. A comissão padrão é 13%, configurável por `MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL`. As regras estão em [reservation-time.js](../backend/src/domain/reservation-time.js) e na migration de confirmação de presença.

## Reembolsos no ambiente atual

O modo de desenvolvimento usa `MERCADO_PAGO_MODO_REPASSE=SIMULADO` e `MERCADO_PAGO_PERMITIR_PRODUCAO=false`. No serviço atual, `shouldRefundViaGateway` retorna falso para pagamentos `SIMULADO_APPONO` e para modos que não sejam marketplace real. Nesse caso, a conclusão é registrada internamente, sem solicitar estorno ao Mercado Pago. Uma notificação ou status de conclusão no Appono não comprova uma devolução no gateway.

Quando o fluxo exige o gateway, o backend consulta o pagamento, verifica sua elegibilidade e bloqueia pagamentos com `live_mode` real se produção estiver desabilitada. A fonte dessa distinção é [refund.js](../backend/src/services/pagamentos/refund.js). Estornos efetivos precisam de validação separada no ambiente de testes do provedor.

Fluxo disponível:

- O cliente solicita o valor total no detalhe de um pedido pago e informa o motivo.
- Restaurante ou administrador consulta e analisa a solicitação.
- A aprovação processa o reembolso conforme o modo financeiro; nos fluxos de gateway, envia o estorno idempotente ou reconhece um estorno já realizado.
- A API chama a função SQL de conclusão para atualizar pagamento, repasse e solicitação depois dessa etapa; no modo simulado, ela não depende de confirmação externa.
- Recusas exigem justificativa; solicitações recusadas ou canceladas podem ser refeitas.
- Eventos financeiros e notificações registram solicitação, recusa e conclusão.

Rotas principais: `POST /api/reembolsos`, `GET /api/reembolsos/pedido/:id`, `GET /api/reembolsos/restaurante`, `GET /api/reembolsos/admin` e `PATCH /api/reembolsos/:id/analisar`.

A migration `20260815000100_create_simulated_refunds.sql` cria a tabela, as políticas de leitura, a unicidade de reembolso ativo e a conclusão transacional. Ela deve ser aplicada antes de testar as telas `/restaurante/reembolsos` e `/admin/reembolsos`.

## Suporte e reclamações

O suporte cria uma camada formal para casos em que chat simples não basta, como pedido não pronto, pedido incorreto, reserva não reconhecida, mesa indisponível, problemas de pagamento, reembolso e atendimento. O cliente abre um chamado com contexto de pedido, reserva ou restaurante, e cliente, restaurante e administração acompanham o protocolo com histórico preservado.

Rotas principais:

- `GET /api/suporte`: lista chamados do perfil autenticado.
- `POST /api/suporte`: abre chamado para cliente, validando propriedade do pedido, reserva ou restaurante.
- `GET /api/suporte/:id`: carrega detalhes, mensagens e contexto.
- `POST /api/suporte/:id/mensagens`: adiciona mensagem e move o chamado para o próximo responsável.
- `PATCH /api/suporte/:id`: cancela, assume, contesta, resolve ou decide um chamado conforme o perfil.

Regras de negócio:

- Um cliente não pode abrir chamado duplicado ativo para o mesmo pedido, reserva ou restaurante e motivo.
- Reclamação de pedido não pronto exige pedido vinculado e não é aceita se o pedido ainda aguarda pagamento.
- Chamados sobre pedido não pronto são bloqueados quando a reserva foi cancelada, marcada como não comparecimento ou teve ausência informada pelo cliente.
- O prazo padrão para abertura é de 7 dias após a experiência.
- Somente chamados decididos como procedentes pela Appono impactam o score operacional do restaurante.
- Se o restaurante assumir responsabilidade, o chamado passa a ser tratado como procedente e entra no fator operacional.
- Quando o restaurante informa uma solução, o chamado volta para o cliente confirmar se resolveu ou pedir análise da Appono.
- O impacto é controlado por motivo e pode ser ajustado pelo admin dentro do limite de segurança.
- Se o cliente solicitar reembolso em um chamado vinculado a pedido elegível, o backend cria uma solicitação em `solicitacoes_reembolso` e vincula o protocolo, reutilizando o fluxo financeiro existente.

Telas disponíveis:

- Cliente: `/cliente/suporte`, com abertura de protocolo e acompanhamento.
- Restaurante: `/restaurante/suporte`, com resposta, contestação e resolução.
- Administração: `/admin/suporte`, com decisão de procedência e impacto operacional.

As notificações internas avisam restaurante e administração na abertura, e o cliente quando houver resposta ou decisão final.

Segurança aplicada:

- O frontend usa apenas as rotas Express do suporte.
- A API resolve o perfil real em `clientes`, `restaurantes` ou `APPONO_ADMIN_EMAILS`; não confia em metadata editável.
- A migration libera leitura por RLS para participantes reais, mas não concede escrita direta pelo Data API. Abertura, mensagens e decisões passam pelo backend com service role e validações de propriedade.
- Mensagens de sistema são criadas apenas pelo backend.

## Pedidos do cliente

`GET /api/pedidos?page=1&limit=12` retorna uma listagem resumida e paginada no formato `{ items, pagination }`; `GET /api/pedidos/:id` carrega relacionamentos e itens somente para o pedido aberto. A tela de pedidos direciona cada registro para `/cliente/pedidos/:id`, onde ficam pagamento, cancelamento e acesso à avaliação. Rotas estáticas, como `/api/pedidos/historico/restaurante`, são declaradas antes da rota dinâmica por ID.

Na página do restaurante, o cliente pode selecionar quantidades diretamente no cardápio. Sem itens, `POST /api/reservas` cria somente a reserva; com itens e o consumo mínimo atingido, `POST /api/reservas/com-pedido` cria reserva e pedido antecipado na mesma transação e direciona ao checkout do pedido.

## Fila operacional de reservas e cozinha

A fila usa proximidade do horário da reserva, estado do pedido e confirmação de presença. A referência atual é [operational-queue.js](../backend/src/domain/operational-queue.js); a janela definida no backend é de **90 minutos**. A proposta anterior de 60 minutos não descreve a constante atual.

Regras implementadas:

- Reservas aparecem para o restaurante em ordem de proximidade do horário.
- A tela de reservas prioriza agendamentos do dia, check-in, finalização e não comparecimento.
- A cozinha exibe somente pedidos pagos e próximos do horário da reserva.
- Pedidos muito futuros não devem poluir a fila da cozinha.
- O pedido antecipado continua vinculado à reserva, mas sua preparação passa a depender da janela operacional configurada pela Appono/restaurante.
- Pedidos `CONFIRMADO` entram na fila no intervalo de 90 minutos antes a 90 minutos depois do início, desde que a reserva esteja `CONFIRMADA` ou `CHECK_IN` e tenha presença confirmada ou check-in realizado.
- Pedidos `EM_PREPARO` e `PRONTO` permanecem na fila, respeitadas as condições de reserva e presença. Pedidos pendentes ou ocultados não aparecem.
- A fila de reservas considera o horizonte de 24 horas à frente e até uma hora após o início; reservas em check-in permanecem elegíveis.
- A configuração dessa janela pela interface continua como evolução; o valor atual é definido no código.
- Na API, a fila da cozinha é carregada por `GET /api/pedidos/historico/restaurante?fila=cozinha`.
- Na API, a fila operacional de reservas é carregada por `GET /api/reservas?fila=operacional`.
- As listagens operacionais do restaurante validam o restaurante autenticado e só então usam consulta privilegiada para carregar nome/telefone do cliente, evitando que a interface mostre apenas “Cliente” por limitação de RLS.

Fluxo esperado:

```text
Cliente reserva mesa
  ├─ sem pedido antecipado → aparece na fila de reservas
  └─ com pedido antecipado → paga o pedido → pedido fica confirmado
                              → entra na fila da cozinha apenas perto do horário
```

Estados exibidos no fluxo:

- Reserva futura: visível na agenda, mas sem destaque operacional.
- Reserva próxima: aparece no topo da fila de reservas.
- Pedido confirmado futuro: pago, mas ainda fora da fila de preparo.
- Pedido liberado para cozinha: dentro da janela operacional, pronto para ser preparado.
- Pedido em preparo, pronto e entregue: fluxo normal da cozinha.

Essa regra reduz ruído operacional, melhora a experiência do restaurante e evita que a Appono assuma uma responsabilidade difícil de garantir: prever exatamente quando cada prato deve começar a ser preparado.

## Favoritos e avaliações

Endpoints disponíveis:

- `GET /api/restaurantes`: inclui média, quantidade de avaliações, total de favoritos e favorito do cliente autenticado.
- `GET /api/restaurantes/:id`: inclui métricas e avaliações recentes.
- `PATCH /api/restaurantes/:id/favorito`: adiciona ou remove favorito; somente cliente.
- `GET /api/pedidos/:id/avaliacao`: consulta a avaliação vinculada ao pedido do cliente.
- `POST /api/pedidos/:id/avaliacao`: cria ou atualiza a avaliação somente depois da entrega do pedido.
- `GET /api/restaurantes/me/avaliacoes`: lista avaliações recebidas pelo restaurante autenticado.

As escritas usam o token do usuário e respeitam RLS; não utilizam `supabaseAdmin` para ignorar autorização.

No frontend, o dashboard persiste favoritos, `/cliente/favoritos` reúne a seleção do cliente, a página pública do restaurante exibe avaliações verificadas sem misturar o formulário com reserva e cardápio, `/cliente/pedidos/:id/avaliar` publica a avaliação pós-entrega e `/restaurante/desempenho` apresenta média, volume e comentários reais.

Testes de concorrência real, RLS entre usuários e webhooks completos precisam de um Supabase exclusivo de testes. Não devem criar dados artificiais no banco com dados reais.

## Chat seguro

O chat está disponível para cliente e restaurante em `/cliente/mensagens` e `/restaurante/mensagens`. O cliente pode iniciar conversa pelo perfil público do restaurante, pelo detalhe de uma reserva, pelo detalhe de um pedido ou pela tela de adicionar pedido antecipado. O restaurante pode abrir conversa pela tela de reservas ou pela cozinha, vinculando automaticamente o atendimento à reserva ou ao pedido. Quando há pedido ou reserva, a conversa carrega esse contexto para reduzir ruído no atendimento.

Rotas principais:

- `GET /api/mensagens`: lista conversas do participante autenticado.
- `POST /api/mensagens/conversas`: cria ou reutiliza uma conversa direta, de reserva ou de pedido.
- `GET /api/mensagens/:id`: carrega a conversa e marca como lida para o participante.
- `POST /api/mensagens/:id/mensagens`: envia mensagem para uma conversa aberta.
- `PATCH /api/mensagens/:id/arquivar`: limpa o histórico da conversa apenas para o participante atual.

Segurança aplicada:

- A API exige autenticação em todas as rotas do chat.
- O backend resolve o perfil real do usuário em `clientes` ou `restaurantes`; não usa dados editáveis de metadata como fonte de autorização.
- Antes de abrir, enviar ou arquivar, a API confirma se a conversa pertence ao cliente ou ao restaurante logado.
- A criação por `id_pedido` ou `id_reserva` valida se o recurso pertence aos participantes.
- O restaurante não pode criar conversa direta com qualquer cliente sem vínculo operacional.
- Mensagens vazias, IDs inválidos e mensagens acima de 1200 caracteres são recusados.
- O envio de mensagem cria notificação interna para o outro participante.
- A limpeza do histórico é individual: oculta a conversa para quem executou a ação, sem apagar o registro do outro participante nem remover dados necessários para auditoria.

UX atual:

- Enter envia mensagem; Shift + Enter quebra linha.
- A listagem mostra conversas não lidas, último conteúdo, contexto de pedido/reserva e foto do restaurante quando disponível.
- A conversa possui estados de carregamento, vazio e erro, mantendo o histórico restrito aos participantes.
- Listas e telas internas possuem ação de limpar histórico com confirmação antes de executar.

## Prontidão

### Bloqueadores antes de pagamentos reais ou piloto

- Criar Supabase exclusivo para testes automatizados.
- Executar concorrência real de reservas e pedidos.
- Executar matriz RLS autenticada com dois clientes, dois restaurantes e administrador.
- Validar webhook duplicado, pendente → aprovado e aprovado → estornado no sandbox.
- Validar estorno real no sandbox Mercado Pago.
- Implementar conciliação periódica independente das telas.
- Configurar alertas externos e testar backup/restauração.
- Revisar termos e política de privacidade juridicamente.

### Não bloqueia evolução dos módulos

- Melhorias visuais e skeletons.
- Paginação adicional enquanto o volume permanece baixo.
- Refatoração gradual dos arquivos grandes.

Durante a revisão da documentação, também foi identificada uma inconsistência no trecho de conciliação em [payments.js](../backend/src/routes/payments.js): a variável declarada como `conciliacao` é acessada em seguida como `conciliação`. O trecho precisa de correção e validação antes de considerar esse caminho funcional. Esta revisão não alterou o código da aplicação.

Os critérios acima continuam sujeitos a validação em ambientes isolados. Consulte o [plano de piloto](piloto-controlado.md) e o [guia de operação](operacao-producao.md); seus limites e rotinas são requisitos operacionais, não uma confirmação de implementação automática.
