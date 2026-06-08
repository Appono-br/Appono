# Melhorias tecnicas pendentes

Este arquivo guarda os pontos de evolucao combinados para depois do MVP inicial.

## Backend

- Adicionar validacao de payloads com uma biblioteca como `zod`.
- Separar rotas, controllers e services para reduzir arquivos grandes.
- Padronizar respostas de erro da API.
- Criar transacoes para pedidos com itens e adicionais.
- Criar testes automatizados para autenticacao, reservas e pedidos.
- Implementar pagamentos reais apenas pelo backend.

## Frontend

- Remover usos antigos de `localStorage` que ainda simulam dados em telas internas.
- Criar tipos compartilhados para respostas da API.
- Melhorar fluxo real de confirmacao de e-mail.
- Corrigir textos com encoding quebrado em telas antigas.

## Banco de dados

- Criar tabelas futuras para mensagens, favoritos, avaliacoes e equipe do restaurante.
- Revisar views publicas para expor apenas dados publicos dos restaurantes.
- Monitorar indices apos a base ter volume real de dados.
