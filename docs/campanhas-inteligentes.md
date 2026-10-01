# Campanhas inteligentes

## Como funcionam

Para criar uma sugestão, a API consulta os últimos 90 dias de refeições planejadas agregadas. Ela agrupa dias equivalentes por dia da semana e faixa de horário e agenda o rascunho para a próxima ocorrência do grupo com maior volume. Cada dia considerado precisa ter a coorte mínima de cinco clientes distintos. Quando não há grupos que atendam a essa regra ou não há produto disponível, nenhuma sugestão é exibida.

As recomendações atuais são **rascunhos gerados por regras fixas**, não por um modelo de IA treinado. A API usa a RPC `metricas_demanda_rotina_restaurante`, que devolve demanda agregada de refeições planejadas com coorte mínima de cinco clientes distintos, e considera produtos disponíveis do próprio restaurante. O rascunho usa um produto de menor preço e um desconto de exemplo de 5%; isso não é uma previsão de conversão ou margem. O restaurante precisa revisar e publicar explicitamente.

As ofertas personalizadas em `/api/campanhas/ofertas` exigem consentimento ativo e correspondem apenas a restaurantes favoritos explícitos. Revogar o consentimento interrompe a listagem personalizada. Ofertas públicas exibidas no perfil do restaurante continuam sujeitas à validade, limite, configuração e plano profissional ativo.

O endpoint de eventos aceita impressões, cliques e início de reserva. Cada evento de marketing é deduplicado por campanha, tipo e cliente/dia; o limite de 200 eventos por cliente em uma hora é aplicado sob lock transacional. A migration `20261001000100_atomic_campaign_event_ingestion.sql` precisa estar aplicada para que o endpoint registre eventos.

## Definições das métricas

O endpoint `GET /api/campanhas/:id/metricas` restringe os dados ao restaurante dono da campanha e a um período de até 366 dias, iniciado por padrão na criação da campanha. Eventos e resgates usam a data de criação; valores financeiros representam o estado atual dos pagamentos ligados aos pedidos desses resgates no período.

| Métrica | Definição |
| --- | --- |
| Visualizações / cliques / reservas iniciadas | Ocorrências gravadas. No tracking atual, cada cliente só pode gerar um evento de cada tipo por campanha/dia. |
| Métricas únicas | Clientes com ID distinto preservado no período. Registros sem identidade preservada não entram na contagem única e fazem o histórico ser sinalizado como limitado. |
| Índice de cliques por visualização | Cliques gravados divididos por visualizações gravadas no mesmo período. É uma razão agregada de eventos, não conversão atribuída à mesma sessão. |
| Índice de reservas iniciadas por clique | Reservas iniciadas divididas por cliques gravados no mesmo período. Os eventos não provam que a reserva resultou em reserva confirmada nem identificam a mesma sessão. |
| Resgates válidos/cancelados | Resgates criados no período, separados pelo estado atual do registro. |
| Benefícios entregues | Resgates com `entregue_em` preenchido. |
| Pedidos pagos atribuídos | Pedidos de resgates válidos com pagamento aprovado ou estornado e valor líquido positivo. |
| Resgates com pedido | Resgates válidos associados a um pedido. O denominador exclui resgates de reserva sem pedido vinculado. |
| Pagamentos antes de reembolsos | Soma de `valor_pago` (ou `valor`) dos pagamentos aprovados/estornados ligados a resgates válidos. O pedido já pode incluir o desconto da campanha. |
| Reembolsos atribuídos | Soma de `valor_reembolsado`; estorno sem valor de reembolso registrado é tratado como reembolso integral e marca histórico limitado. |
| Pagamentos após reembolsos | Pagamentos antes de reembolsos menos reembolsos, sem permitir valor negativo. Não representa receita contábil, lucro ou efeito incremental da campanha. |
| Descontos registrados | `valor_beneficio` dos resgates válidos. O custo de itens gratuitos não está disponível nessa coluna. |
| Taxa de pedido pago por resgate com pedido | Pedidos pagos atribuídos divididos por resgates válidos que têm pedido vinculado. |

Registros anteriores à deduplicação e históricos de pagamento sem dados de reembolso completos são sinalizados como limitados. Eventos únicos não devem ser interpretados como usuários ativos únicos durante toda a vida da campanha, pois o denominador é o período filtrado.

## Operação e segurança

- Criação/edição usa `salvar_campanha_atomica`; o banco valida propriedade do restaurante, plano profissional, versão concorrente e produtos elegíveis.
- Aplicação do benefício ocorre nas funções transacionais de reserva/pedido. Cancelamentos liberam usos; a entrega é confirmada após check-in/conclusão.
- Eventos são escritos pelo backend com Service Role através da função atômica, que valida o cliente autenticado, a disponibilidade da campanha e o limite de frequência. A função é concedida somente a `service_role`.
- A atualização de estados agendados/expirados usa `pg_cron` quando disponível ou `GET /api/campanhas/manutencao` com `CRON_SECRET` configurado.
- Métricas grandes são paginadas até um teto operacional. Se uma consulta passar do teto, reduza o período.

## Verificação

Execute `npm test --workspace backend` e `npm run lint --workspace frontend`. Validação de concorrência real das funções SQL requer um Supabase/Postgres de teste com as migrations aplicadas; testes unitários de domínio não substituem esse cenário.
