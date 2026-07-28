# Fluxo de pagamento Mercado Pago - Appono

Este documento resume o fluxo atual para apresentacao e testes do MVP.

## Configuracao obrigatoria

Backend:

```env
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL=13
MERCADO_PAGO_MODO_REPASSE=SIMULADO
MERCADO_PAGO_PERMITIR_PRODUCAO=false
BACKEND_PUBLIC_URL=https://appono-backend.vercel.app
FRONTEND_PUBLIC_URL=https://seu-front.vercel.app
MERCADO_PAGO_WEBHOOK_SECRET=secret_do_webhook
```

Frontend:

```env
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=sua_public_key
NEXT_PUBLIC_API_URL=https://appono-backend.vercel.app/api
```

## Webhook

No painel do Mercado Pago, cadastre:

```txt
https://appono-backend.vercel.app/api/pagamentos/webhook/mercado-pago
```

Evento principal: pagamento.

Se `MERCADO_PAGO_WEBHOOK_SECRET` estiver configurado, o backend valida a assinatura do webhook antes de conciliar o pagamento.

## Regra de negocio

1. O cliente cria uma reserva.
2. O cliente monta um pedido antecipado.
3. O pedido nasce como `PENDENTE`.
4. O cliente paga pelo Checkout Pro.
5. Quando o pagamento vira `APROVADO`, o pedido vira `CONFIRMADO`.
6. O valor fica retido como `AGUARDANDO_ENTREGA`.
7. Quando o restaurante marca o pedido como `ENTREGUE`, o repasse vira `LIBERADO_PARA_REPASSE`.
8. Se o pedido for cancelado, ele nao entra em vendas validas.

## Teste recomendado

1. Entrar como cliente.
2. Reservar uma mesa.
3. Criar um pedido antecipado com valor valido.
4. Abrir o pagamento.
5. Concluir o pagamento no ambiente de teste.
6. Voltar para a Appono.
7. Conferir se o pedido saiu de `PENDENTE` para `CONFIRMADO`.
8. Entrar como restaurante.
9. Conferir se o pedido aparece para preparo.
10. Marcar como `ENTREGUE`.
11. Abrir relatorio financeiro.
12. Confirmar que o valor entrou como liberado.

## Teste de cancelamento

1. Criar e pagar um pedido.
2. Cancelar o pedido antes do preparo.
3. Conferir que o pedido fica `CANCELADO`.
4. Conferir que o valor nao entra em vendas validas.
