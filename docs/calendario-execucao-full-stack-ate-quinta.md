# Calendário de execução Full Stack da Appono

## Período

De segunda-feira, 5 de outubro de 2026, até quinta-feira, 8 de outubro de 2026.

## Objetivo

Entregar uma versão pronta para homologação dos quatro fluxos prioritários da Appono:

1. Supabase, migrations e deploy alinhados.
2. Check-in e check-out protegidos pelos quatro últimos números do telefone.
3. Tempo de preparo calculado e exibido corretamente na cozinha.
4. Google Calendar integrado ao calendário de reservas do cliente.
5. Appono Rotina com uma primeira camada de RAG controlada, rastreável e baseada em dados reais.

Este calendário organiza uma entrega de homologação. A publicação em produção só deve ocorrer depois da revisão das migrations, das credenciais externas e dos testes ponta a ponta.

---

## Estado atual identificado

### Supabase

O repositório possui migrations incrementais em `supabase/migrations`, mas não possui schema inicial completo nem `supabase/config.toml`. A aplicação depende de um projeto Supabase já provisionado e de um histórico de migrations compatível.

### Appono Rotina

Já existem preferências, endereços, catálogo, recomendações, sinais comportamentais, feedback, planejamento e integração com Google Agenda. A implementação atual usa recuperação estruturada e pontuação. Ainda precisa ser organizada como um fluxo RAG explícito, com contexto, fontes, fallback e rastreabilidade.

### Check-in e check-out

Já existem rotas de check-in e finalização, validação de status, janela de horário e validação pelos quatro últimos dígitos do telefone. Ainda são necessários testes de segurança, concorrência, rate limit e homologação real.

### Cozinha

Já existem tempo de preparo por produto, estimativa por quantidade, fila operacional, `iniciar_preparo_em` e informações de tempo na interface. Ainda é necessário validar triggers, atualização da fila, fuso horário e comportamento com pedidos reais.

### Google Calendar

A conexão com Google Agenda já funciona para o planejamento da Appono Rotina. O calendário de reservas do cliente ainda precisa criar, atualizar e cancelar eventos específicos de reservas.

---

# Plano diário

## Segunda-feira — 5 de outubro

### Tema: Supabase, migrations e ambiente

### Objetivo do dia

Garantir que o banco usado pela homologação tenha schema, migrations e schema cache compatíveis com o backend atual.

### Atividades

1. Conferir o diretório `supabase/migrations`.
2. Inicializar a CLI somente se `supabase/config.toml` não existir:

   ```powershell
   npm.cmd run supabase -- init
   ```

3. Fazer login na CLI:

   ```powershell
   npm.cmd run supabase -- login
   ```

4. Vincular o projeto de homologação:

   ```powershell
   npm.cmd run supabase -- link --project-ref "PROJECT_REF"
   ```

5. Conferir o histórico remoto:

   ```powershell
   npm.cmd run supabase -- migration list
   ```

6. Executar simulação:

   ```powershell
   npm.cmd run supabase -- db push --dry-run
   ```

7. Aplicar somente depois da revisão:

   ```powershell
   npm.cmd run supabase -- db push
   ```

8. Validar as tabelas e relações:
   - `cardapios` → `categorias`;
   - `categorias` → `produtos`;
   - `reservas` → `clientes`;
   - `pedidos` → `reservas`;
   - `itens_pedido` → `produtos`.

9. Confirmar a migration de reparo do relacionamento entre cardápios e categorias:

   ```text
   supabase/migrations/20261004222552_repair_cardapio_categorias_relationship.sql
   ```

10. Recarregar o schema cache e testar as consultas PostgREST.

### Critérios de aceite

- O `db push --dry-run` não apresenta migrations inesperadas.
- O `db push` termina sem erro.
- O endpoint de cardápio não retorna erro de relacionamento.
- As migrations de estimativa de preparo estão aplicadas.
- O ambiente utilizado é identificado como homologação.
- Nenhuma chave secreta aparece no frontend, logs ou documentação pública.

### Entregáveis

- Projeto Supabase vinculado.
- Relatório da lista de migrations aplicadas.
- Evidência do `db push`.
- Registro de eventuais registros órfãos ou incompatibilidades.

---

## Terça-feira — 6 de outubro

### Tema: Check-in, check-out e cozinha

### Objetivo do dia

Fechar o fluxo operacional do restaurante e garantir que a reserva e o pedido avancem nos momentos corretos.

### Check-in e check-out

Validar:

1. Reserva confirmada com código correto.
2. Código incorreto.
3. Código com máscara ou espaços.
4. Telefone com menos de quatro dígitos.
5. Cliente sem telefone cadastrado.
6. Tentativas repetidas.
7. Check-in antes da janela permitida.
8. Check-in depois do horário.
9. Check-in repetido.
10. Finalização sem check-in.
11. Finalização com pedido ainda aberto.
12. Finalização correta após todos os pedidos terminarem.

Implementar ou confirmar:

- rate limit por restaurante e reserva;
- resposta técnica estável para código inválido;
- mensagens sem exposição do telefone completo;
- atualização concorrente protegida por status atual;
- auditoria mínima de tentativa e resultado.

### Cozinha

Validar:

1. Pedido com um item.
2. Pedido com várias unidades.
3. Pedido com itens de tempos diferentes.
4. Vários pedidos da mesma reserva.
5. Vários pedidos de restaurantes diferentes.
6. Pedido pendente.
7. Pedido confirmado.
8. Pedido em preparo.
9. Pedido pronto.
10. Pedido cancelado.
11. Pedido ocultado da cozinha.
12. Reserva próxima, iniciada e encerrada.

Garantir que a API forneça:

- tempo médio de preparo;
- tempo estimado mínimo e máximo;
- minutos até o início do preparo;
- horário da reserva;
- indicação de preparo liberado ou aguardando liberação.

### Critérios de aceite

- Código incorreto nunca permite check-in ou check-out.
- O cliente recebe notificação após check-in e finalização.
- Pedidos pendentes não aparecem como liberados para preparo.
- Pedidos aparecem na cozinha conforme a janela operacional.
- Alterar quantidade de itens recalcula a estimativa.
- O cálculo usa o fuso `America/Sao_Paulo`.
- O restaurante entende claramente o próximo passo operacional.

### Entregáveis

- Fluxo de reserva validado.
- Fluxo de cozinha validado.
- Evidência dos cenários executados.
- Ajustes de backend, frontend, migration ou testes necessários.

---

## Quarta-feira — 7 de outubro

### Tema: Google Calendar para reservas

### Objetivo do dia

Permitir que o cliente adicione uma reserva confirmada ao Google Calendar e manter o evento sincronizado com o estado da reserva.

### Atividades de backend

1. Reutilizar a conexão OAuth existente.
2. Criar endpoint autenticado para criar evento de reserva.
3. Criar endpoint para atualizar o evento.
4. Criar endpoint para cancelar ou remover o evento.
5. Persistir o identificador do evento externo.
6. Impedir duplicação para a mesma reserva.
7. Validar propriedade da reserva pelo cliente autenticado.
8. Não expor access token ou refresh token.
9. Tratar conexão inexistente, expirada, revogada e sem escopo de escrita.
10. Criar título, descrição, horário e local consistentes.

### Dados mínimos do evento

- Nome do restaurante.
- Data da reserva.
- Horário de início e fim.
- Endereço do restaurante.
- Quantidade de pessoas.
- Identificador interno somente em metadado técnico não exibido ao cliente.

### Atividades de frontend

1. Adicionar botão “Adicionar ao Google Calendar” na reserva.
2. Exibir estado “Adicionado”.
3. Permitir atualizar a reserva no calendário.
4. Remover ou cancelar o evento quando a reserva for cancelada.
5. Informar quando o usuário precisa reconectar o Google.
6. Adaptar o botão para celular.
7. Evitar bloquear o acesso à reserva quando o Google estiver indisponível.

### Critérios de aceite

- Uma reserva confirmada cria exatamente um evento.
- Clicar novamente não cria duplicidade.
- Alterar horário atualiza o evento.
- Cancelar reserva remove ou cancela o evento.
- Token não aparece na URL, resposta ou log.
- Falha no Google não apaga nem invalida a reserva Appono.
- O fluxo funciona em desktop e celular.

### Entregáveis

- Migration para vínculo do evento, se necessário.
- Endpoints de criação, atualização e cancelamento.
- Botão no calendário de reservas.
- Teste OAuth real em homologação.

---

## Quinta-feira — 8 de outubro

### Tema: RAG da Appono Rotina, integração e homologação final

### Objetivo do dia

Entregar um RAG inicial seguro e revisar os quatro fluxos completos.

### Escopo do RAG inicial

O RAG inicial deve trabalhar somente com dados autorizados e persistidos:

- preferências da rotina;
- endereços ativos;
- orçamento;
- restrições alimentares;
- horários disponíveis;
- restaurantes publicados;
- pratos disponíveis;
- distância calculada;
- histórico consentido;
- feedback do cliente;
- eventos ocupados do calendário.

### Pipeline esperado

```text
Perfil e contexto do cliente
        ↓
Filtros obrigatórios de segurança e disponibilidade
        ↓
Recuperação de restaurantes e pratos elegíveis
        ↓
Pontuação e ordenação por contexto
        ↓
Montagem do contexto da resposta
        ↓
Geração ou explicação estruturada
        ↓
Validação de orçamento, distância e horário
        ↓
Resposta com origem dos dados e fallback
```

### Regras do RAG

- Não recomendar restaurante fora do raio.
- Não recomendar item indisponível.
- Não ultrapassar orçamento sem informar.
- Não ignorar restrições alimentares.
- Não expor dados privados.
- Não inventar disponibilidade, preço ou horário.
- Não depender de IA para decisões críticas de pagamento ou reserva.
- Manter fallback determinístico quando o provedor de IA estiver indisponível.
- Registrar quais entidades influenciaram a recomendação.
- Respeitar consentimento para histórico e sinais comportamentais.

### Homologação final

Executar:

1. `npm.cmd run lint --workspace frontend`
2. `npm.cmd run build --workspace frontend`
3. `npm.cmd run build --workspace backend`
4. Testes de backend existentes.
5. Smoke test de login.
6. Smoke test de reserva.
7. Smoke test de check-in e check-out.
8. Smoke test de pedido antecipado.
9. Smoke test de fila da cozinha.
10. Smoke test de Google Calendar.
11. Smoke test de rotina e recomendação.
12. Teste responsivo nos fluxos de cliente e restaurante.

### Critérios de aceite

- Os quatro fluxos prioritários funcionam no ambiente de homologação.
- O build passa sem erro.
- As migrations aplicadas estão registradas.
- Não existem referências antigas a relações inexistentes.
- Falhas externas exibem mensagens compreensíveis.
- Nenhum segredo aparece no frontend ou nos logs.
- A documentação registra limitações conhecidas.

---

# Prompt mestre de execução

Copie o texto abaixo para iniciar cada sessão de implementação:

```text
Atue como um Desenvolvedor Full Stack Sênior responsável pela Appono, trabalhando neste repositório monorepo com frontend Next.js/React, backend Express/Node.js e Supabase/PostgreSQL.

Sua missão é executar o plano diário informado para a data atual. Não entregue apenas análise ou exemplos: inspecione o código, implemente a solução, crie migrations aditivas quando necessário, valide o fluxo e documente o resultado.

## Regras de trabalho

1. Leia README.md, frontend/AGENTS.md, manifests, documentação relevante, rotas envolvidas, migrations relacionadas e componentes usados pelo fluxo.
2. Preserve alterações locais existentes e não reverta trabalho sem autorização explícita.
3. Inspecione a implementação atual antes de editar.
4. Reaproveite autenticação, autorização, RLS, componentes, serviços e padrões visuais já existentes.
5. Para qualquer alteração Supabase, use uma migration nova, aditiva, revisável e idempotente.
6. Nunca invente dados de produção, respostas de provedores ou disponibilidade.
7. Nunca exponha service role key, refresh token, access token, telefone completo, CPF ou dados privados.
8. Não use dados de outro cliente ou restaurante para calcular métricas.
9. Use America/Sao_Paulo nas regras de data e horário da operação brasileira.
10. Não altere o header da home além do que foi solicitado para a tarefa atual.
11. Não remova autenticação, RLS, rate limit, validação de propriedade ou proteção de pagamento.
12. Prefira mensagens claras ao usuário e códigos técnicos estáveis para logs e diagnóstico.
13. Se uma integração externa depender de credencial ausente, implemente o contrato, trate a indisponibilidade e documente a configuração necessária.
14. Não afirme que algo foi validado em produção se apenas foi compilado localmente.

## Processo obrigatório

### Etapa A — Diagnóstico

- Liste os arquivos relevantes.
- Identifique o fluxo frontend → API → Supabase → provedor externo.
- Identifique tabelas, foreign keys, policies, funções, triggers e migrations envolvidas.
- Registre riscos e dependências antes de alterar.

### Etapa B — Implementação

- Faça a menor mudança coerente que complete o requisito.
- Mantenha contratos existentes quando possível.
- Atualize backend e frontend juntos quando o contrato mudar.
- Crie migration com nome descritivo usando a CLI do Supabase.
- Inclua tratamento de erro, estado vazio, carregamento, retry seguro e autorização.

### Etapa C — Verificação

- Execute sintaxe, lint, build e testes adequados.
- Verifique `git diff --check`.
- Confirme que nenhuma chave ou dado sensível foi incluído.
- Teste sucesso, erro, ausência de configuração, duplicidade e concorrência quando aplicável.
- Informe claramente o que foi validado e o que depende de ambiente externo.

### Etapa D — Relatório

Entregue:

- resumo do que mudou;
- arquivos alterados;
- migrations criadas;
- comandos executados;
- resultados da validação;
- limitações restantes;
- próximo passo recomendado.

## Plano por dia

### Dia 1 — Supabase

Corrija e valide configuração, migrations, relacionamentos, schema cache, triggers e deploy de homologação. Investigue qualquer erro PostgREST pelo nome exato da relação e compare com as foreign keys reais.

### Dia 2 — Check-in, check-out e cozinha

Valide os quatro últimos dígitos do telefone, horário permitido, status, concorrência, rate limit, pedidos abertos e janela de preparo. Garanta que a cozinha receba o pedido no momento previsto e mostre o tempo restante.

### Dia 3 — Google Calendar de reservas

Implemente criação, atualização, cancelamento e deduplicação de eventos específicos de reservas. Reutilize OAuth existente, proteja tokens e trate reconexão e indisponibilidade.

### Dia 4 — RAG e homologação

Organize a recuperação de contexto da Appono Rotina usando dados reais e consentidos. Implemente fallback determinístico, rastreabilidade das fontes, filtros de segurança e validação final dos quatro fluxos.

## Critério de encerramento

Não encerre a tarefa apenas porque o build passou. Encerre somente quando o requisito do dia estiver implementado, revisado, testado no nível possível e documentado com as limitações reais do ambiente.
```

---

## Comandos de validação da semana

```powershell
npm.cmd run supabase -- migration list
npm.cmd run supabase -- db push --dry-run
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
npm.cmd run build --workspace backend
npm.cmd test
git diff --check
```

## Regra para produção

O deploy de produção só deve ocorrer depois de:

- validar as migrations no projeto correto;
- confirmar backup e rollback;
- testar OAuth Google em homologação;
- confirmar variáveis de ambiente;
- revisar RLS e permissões;
- testar check-in, cozinha e calendário com dados controlados;
- registrar o commit e a versão publicada.
