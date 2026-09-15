# Appono Rotina: integridade transacional

Validação final: 14/09/2026. Alterações locais na main; sem commit, push ou cobrança real. As duas migrations foram aplicadas pelo usuário antes do smoke test integrado.

## Implementação

- `mutar_rotina` substitui sequências REST de escrita por uma transação PostgreSQL: perfil, seleções, restrições e auditoria; geração, edição, aprovação e histórico.
- Leituras de perfil com seleções e de planejamento com refeições usam relacionamentos na mesma consulta para evitar snapshots parcialmente atualizados.
- `versao` no perfil e planejamento identifica conflitos. `versao_perfil_origem` impede aprovar/editar/converter sugestões anteriores a uma alteração do perfil. Planos legados sem essa origem precisam ser regenerados.
- Ordem de locks: advisory lock do cliente, perfil, planejamento e refeição. A trava por cliente é deliberadamente mais abrangente que cliente/semana para proteger mudanças no perfil e criação de semanas ainda inexistentes. Clientes diferentes não compartilham intencionalmente a mesma chave; eventual colisão de hash apenas serializa trabalho adicional.
- Cálculos e consultas de catálogo ficam fora da transação. O commit verifica as versões usadas no cálculo. Duas solicitações com a mesma versão não sobrescrevem silenciosamente uma à outra.
- Regeneração preserva refeições com vínculo de reserva/pedido. Custos convertidos entram no saldo semanal; após conversão com pedido, o custo da refeição reflete o valor atual do pedido. Nenhuma cobrança ocorre pela geração ou aprovação.
- Reserva simples permanece confirmada; com pedido, reserva e pedido ficam pendentes do fluxo de pagamento existente. Notificações ocorrem depois do commit e falha de envio não repete a conversão.
- Interface envia versões, informa conflitos e permite recarregar. O formulário mantém o rascunho para restauração explícita e revisão; não tenta salvar automaticamente sobre alterações de outra aba.

## Segurança

`mutar_rotina` é SECURITY INVOKER e executável somente por service_role. A API envia o UUID obtido da sessão validada, nunca `id_cliente`, `actor_id` do corpo ou user_metadata. A função resolve o cliente e verifica propriedade de cada entidade no banco.

A conversão continua usando o JWT do cliente: wrapper público invoker e função privada definer com search_path vazio. O definer é necessário para gravar nas tabelas que são somente leitura para o cliente e reutilizar as funções existentes de reserva/pedido. Identidade vem de auth.uid(). O helper antigo não é executável por anon, authenticated ou service_role; a assinatura pública sem versões foi removida. As seis tabelas mantêm RLS e bloqueio de escrita direta pelo navegador.

## Migration e dados legados

Arquivo: `supabase/migrations/20260913220856_routine_transaction_integrity.sql`, criado com o CLI oficial. A migration inicial aplicada não foi reescrita nesta etapa.

O preflight identifica IDs incompatíveis e aborta a transação inteira. Valida tempo inteiro de 30–240 minutos, início anterior ao fim, limite dentro da janela, dias válidos não vazios, raio 1–100, coordenadas em conjunto e orçamentos não negativos, sem NaN. Não exclui perfis nem altera preferências automaticamente.

Auditoria remota somente de leitura em 13/09 encontrou 1 perfil sem violações na validação de limites da API. Isso não garante que a base não mudou desde então; o preflight deve ser executado na aplicação da migration. Se abortar, revisar os IDs indicados e obter concordância do cliente para corrigir a configuração antes de reaplicar.

## Evidências

### PostgreSQL real, local e isolado: 17/17

PostgreSQL portátil 17.11, loopback 127.0.0.1:55439. A suíte cria banco com nome `appono_routine_test_<pid>` e o remove ao terminar. Não carrega .env. Tabelas centrais são uma fixture sintética mínima, não um dump da produção; funções de reserva e pedido são carregadas dos arquivos SQL reais do repositório. auth.uid() usa claim de sessão de teste, sem passar pelo emissor JWT/PostgREST do Supabase.

1. Falha intermediária no perfil desfaz perfil, preferências, restrições e histórico.
2. Falha no insert da auditoria desfaz o salvamento.
3. PATCH preserva omitidos, remove com lista vazia e limpa opcionais com null.
4. Constraints temporais, dias, raio, coordenadas e orçamentos rejeitam entradas inválidas sem efeitos parciais.
5. Dois salvamentos concorrentes: um aceito, outro em conflito.
6. Falha após exclusão de sugestões preserva integralmente a semana anterior.
7. Primeira geração e regenerações simultâneas são serializadas.
8. Perfil alterado invalida cálculo anterior.
9. Nova versão do perfil impede converter sugestão antiga.
10. Duas conversões simultâneas criam uma única reserva.
11. Conversão antes da regeneração preserva vínculo e saldo semanal.
12. Regeneração antes da conversão/edição bloqueia referência removida.
13. Edição antes da regeneração invalida cálculo concorrente.
14. Anônimo, ausência de identidade, outro cliente, escrita direta e RPC/helper antigos são bloqueados; RLS das seis tabelas é verificada.
15. Falha na auditoria da aprovação desfaz status; aprovação válida atualiza semana e refeições atomicamente.
16. Reserva simples confirmada; pedido pendente, itens persistidos e preço atual refletido no resumo.
17. Produto indisponível na conversão desfaz a reserva e os vínculos.

O setup também testa um perfil legado incompatível: a migration falha sem adicionar a coluna de versão. A correção explícita é feita somente nessa fixture sintética. Os testes de concorrência usam conexões independentes e verificam em pg_stat_activity que a segunda aguarda o advisory lock.

### Aplicação e compilação

- `npm test --workspace backend`: 80/80, incluindo testes de domínio e rotas HTTP com transporte Supabase simulado. Não equivalem aos testes SQL acima.
- `npm run build --workspace backend`: passou; esse script verifica a sintaxe do servidor, não é um build completo de todos os arquivos.
- `npm run lint --workspace frontend`: passou.
- `npm run build --workspace frontend`: passou, 48 páginas geradas.
- Testes funcionais anteriores: aprovados pelo usuário antes destas mudanças; não apresentados como nova homologação.

### Supabase integrado com JWT real: aprovado

Após a aplicação das migrations, foi executado `npm run test:rotina:supabase --workspace backend` contra o projeto Supabase configurado. O teste criou dois clientes temporários com e-mails exclusivos, autenticou ambos pelo Supabase Auth e percorreu a API Express real. Nenhum pagamento ou conversão em reserva/pedido foi iniciado.

- Acesso a `/api/rotina/perfil` sem JWT retornou HTTP 401.
- Os dois clientes salvaram perfil e preferências pela operação transacional.
- Duas alterações simultâneas sobre a versão 1 produziram exatamente um HTTP 200 e um HTTP 409; a versão persistida passou para 2.
- O segundo cliente recebeu lista vazia ao tentar ler o perfil do primeiro por RLS.
- Escrita direta autenticada na tabela de perfis foi negada.
- Duas primeiras gerações simultâneas produziram exatamente um HTTP 201 e um HTTP 409; ficou um único planejamento na versão 1.
- Aprovação do planejamento retornou HTTP 200, status `APROVADO` e versão 2.
- O segundo cliente não conseguiu visualizar o planejamento do primeiro.
- A conferência posterior encontrou 0 usuários e 0 perfis temporários restantes.

Antes desse fluxo, um smoke remoto somente de leitura confirmou as colunas `versao` e `versao_perfil_origem`; acesso anônimo às tabelas e execução anônima de `mutar_rotina`/`converter_refeicao_rotina` foram negados com PostgreSQL `42501`.

### Reproduzir os testes SQL

Prepare um cluster PostgreSQL descartável local com psql, permissão para criar banco/roles e extensão btree_gist. Não use um cluster compartilhado: a fixture cria roles ausentes. Exemplo PowerShell, ajustando caminho e porta:

```powershell
$env:APPONO_ROUTINE_PSQL = 'C:\caminho\postgres\bin\psql.exe'
$env:APPONO_ROUTINE_TEST_PORT = '55439'
$env:APPONO_ROUTINE_TEST_CLUSTER = 'isolated'
npm run test:rotina:postgres --workspace backend
```

## Estado de aceite e limites restantes

1. As migrations e o smoke com JWTs reais foram concluídos. Backend e frontend precisam ser publicados juntos; abas antigas devem recarregar por causa da remoção da assinatura antiga de conversão.
2. Confirmar visualmente no navegador o rascunho após 409, desktop/mobile e modo escuro. O comportamento HTTP foi validado, mas essa apresentação não foi inspecionada nesta etapa.
3. Conversão remota em reserva/pedido e checkout sandbox continuam cobertos por PostgreSQL local e testes da aplicação, mas não foram executados novamente no Supabase para evitar ocupar mesa ou iniciar fluxo financeiro. Devem compor o próximo teste funcional controlado quando houver restaurante e agenda próprios para QA.

A integridade transacional e a autorização têm evidência local e integrada. Esta primeira versão técnica do Appono Rotina está apta para seguir ao desenvolvimento aprimorado. Não há idempotency key para resposta perdida após commit; nesse caso deve-se recarregar e conferir o estado, não repetir automaticamente. A serialização por cliente privilegia consistência sobre paralelismo entre suas semanas.

Referências técnicas: [funções e privilégios Supabase](https://supabase.com/docs/guides/database/functions) e [locks PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
