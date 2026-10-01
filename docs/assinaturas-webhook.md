# Confirmacao automatica de assinaturas

## Configuracao no Mercado Pago e na Vercel

Na aplicacao do vendedor usada pelo backend, em **Suas integracoes > Webhooks**:

- URL: `https://appono-backend.vercel.app/api/planos/webhook/mercado-pago`
- Habilitar **Planos e assinaturas** (eventos `subscription_preapproval` e `subscription_authorized_payment`) e **Pagamentos** (`payment`).
- Usar o ambiente correspondente as credenciais do backend.
- Copiar a assinatura secreta fornecida pelo Mercado Pago para `MERCADO_PAGO_WEBHOOK_SECRET` no backend da Vercel. Nao versionar o segredo.
- Configurar `BACKEND_PUBLIC_URL=https://appono-backend.vercel.app` na Vercel.
- Publicar o backend e frontend atualizados. O arquivo `.env` local nao configura a Vercel.

Referencia: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks

## Comportamento

O webhook consulta o recurso no Mercado Pago, identifica a assinatura local e reconsulta suas faturas e pagamentos. A autorizacao da assinatura sozinha nao aprova cobrancas. O pagamento precisa ter vendedor, valor e moeda correspondentes. O ID unico do pagamento evita duplicar a cobranca em notificacoes repetidas.

Falhas de processamento retornam HTTP 500 para permitir nova entrega. A pagina tambem reconcilia o estado ao abrir, ao recuperar foco e a cada 5 segundos enquanto pendente (30 segundos nos demais estados). A consulta periodica ocorre somente com a pagina visivel; nao substitui configurar o webhook.

A confirmacao acontece quando o provedor envia o evento. Nao existe garantia de latencia zero: atrasos do Mercado Pago ou indisponibilidade de rede podem adiar a atualizacao. Falhas na conciliacao aparecem na tela e nos logs do backend.

## Recuperacao realizada

Em 30/09/2026, a assinatura 37 do restaurante 14 foi conciliada com a assinatura `04b5e1816c55415ca8960c439a91f6da` e o pagamento aprovado `180348402207`. A cobranca 2 foi vinculada ao pagamento; a tentativa 1 nao tem pagamento confirmado e foi preservada.
