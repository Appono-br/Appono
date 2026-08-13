# Operacao segura da Appono

## Ambientes

Manter projetos, bancos, credenciais e URLs distintos para `development`, `staging` e `production`. Testes automatizados devem usar um quarto projeto Supabase descartavel, sem copia de dados pessoais. Nunca reutilizar tokens Mercado Pago de producao em homologacao.

Variaveis minimas por ambiente: `NODE_ENV`, `FRONTEND_ORIGIN`, `FRONTEND_PUBLIC_URL`, `BACKEND_PUBLIC_URL`, chaves Supabase, credenciais Mercado Pago, `MERCADO_PAGO_WEBHOOK_SECRET`, modo de repasse e lista de administradores. Segredos ficam no cofre do provedor, com rotacao trimestral e imediata apos incidente ou desligamento de operador.

## Checklist de implantacao

- Executar migrações e validar backup antes da mudança.
- Executar `npm test`, `npm run lint` e `npm run build`.
- Confirmar CORS, URLs de retorno e assinatura do webhook.
- Confirmar `MERCADO_PAGO_PERMITIR_PRODUCAO=false` fora de produção.
- Fazer transação sintética de baixo valor e validar comissão, entrega e estorno.
- Validar alertas de webhook, pedidos parados e divergência financeira.
- Registrar responsável, versão implantada e plano de reversão.

## Backup e restauracao

Habilitar backup gerenciado diário e retenção compatível com a operação. Trimestralmente, restaurar o backup em projeto isolado, executar verificações de integridade e registrar RPO/RTO real. Backup não testado não deve ser considerado recuperável.

## Monitoramento e alertas

Os logs são JSON e incluem `request_id`; campos sensíveis são removidos. Alertar quando houver webhook em `ERRO`, pagamentos pendentes acima de 15 minutos, pedidos confirmados sem evolução próximo da reserva, estorno recusado, divergência entre valor local e Mercado Pago ou aumento de respostas 5xx. Nunca registrar autorização, tokens, PAN ou CVV.

## Conciliação

Executar tarefa periódica a cada 10 minutos para pagamentos pendentes e, diariamente, reconciliar pagamentos aprovados/estornados com o Mercado Pago. A tarefa deve operar por páginas, ter limite de execução, ser idempotente e produzir evento de auditoria para cada divergência. A listagem de telas não executa conciliação.

## Interrupcao emergencial

Para interromper novas transações: definir `MERCADO_PAGO_PERMITIR_PRODUCAO=false`, trocar o modo de repasse para `SIMULADO`, desabilitar o início de novos checkouts e manter consulta/webhook ativos para concluir a conciliação do que já existe. Comunicar usuários afetados e preservar a trilha de auditoria.
