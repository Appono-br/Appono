# Prompt de evolução completa do Appono Rotina

Você é um agente sênior de produto e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Sua missão é evoluir o **Appono Rotina** do MVP técnico atual para uma experiência completa, segura, profissional e integrada, implementando os itens 1 a 9 descritos neste documento.

Não entregue apenas análise, arquitetura, pseudocódigo ou plano. Inspecione o repositório, implemente cada fase, escreva migrations incrementais, atualize backend e frontend, crie testes, valide os fluxos e atualize a documentação. Trabalhe de forma incremental e preserve tudo que já funciona.

## Contexto obrigatório

- Frontend: Next.js/React em JavaScript.
- Backend: Node.js/Express em JavaScript.
- Banco, autenticação e RLS: Supabase/PostgreSQL.
- Pagamentos: Mercado Pago, com testes exclusivamente em sandbox.
- Notificações internas já existem; notificações por e-mail devem usar a infraestrutura configurada no projeto, preferencialmente Resend.
- Geolocalização já usa coordenadas e cálculo de distância; não invente distâncias quando os dados forem insuficientes.
- O tempo de preparo dos pratos não faz parte da recomendação. A operação de preparo pertence ao restaurante.
- O Appono Rotina individual atual suporta perfil, preferências, restrições, planejamento semanal, sugestões, aprovação, edição e conversão em reserva/pedido.
- A integridade transacional, concorrência, versões e RLS já foram implementadas e testadas. Não substitua essa base por gravações REST fragmentadas.

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-integridade-transacional.md`;
- `docs/appono-rotina-relatorio-prints.md`;
- `docs/appono-rotina-commit.md`;
- `backend/src/routes/routine.js`;
- `backend/src/domain/routine-recommendation.js`;
- `frontend/app/cliente/rotina/`;
- `frontend/lib/routine-view.mjs`;
- migrations `20260912000200_create_appono_routine.sql` e `20260913220856_routine_transaction_integrity.sql`;
- fluxos atuais de autenticação, geolocalização, reservas, pedidos, pagamentos, cozinha, avaliações, suporte, chat e notificações.

Leia também as instruções do repositório. Para qualquer alteração Supabase, consulte a documentação e o changelog atuais. Para Next.js, leia a documentação correspondente instalada em `node_modules/next/dist/docs` antes de editar.

## Regras de execução

1. Preserve alterações locais e padrões existentes. Não reverta trabalho do usuário.
2. Trabalhe na branch atual. Não troque de branch, faça commit, push ou deploy sem autorização explícita.
3. Não edite migrations já aplicadas. Crie migrations incrementais pelo Supabase CLI, após consultar `--help`.
4. Antes de adicionar constraints, audite dados legados. Não apague nem corrija dados reais silenciosamente.
5. Não aplique migrations remotamente sem autorização específica. Entregue os arquivos e instruções de ordem.
6. Nunca exponha `service_role`, client secret, access token, refresh token ou credenciais OAuth no frontend, logs ou respostas da API.
7. Não use `user_metadata` editável como fonte de autorização. Resolva propriedade pela sessão validada e pelo banco.
8. Toda tabela exposta deve ter RLS e políticas por propriedade. `authenticated` isoladamente não constitui autorização.
9. Prefira `SECURITY INVOKER`. Quando `SECURITY DEFINER` for indispensável, use schema privado, `search_path = ''`, validação interna de identidade, `REVOKE` de `PUBLIC/anon` e grants mínimos.
10. Preserve o controle de concorrência atual: versão do perfil, versão do planejamento, versão de origem e ordem comum de locks. Novas mutações relacionadas devem participar da mesma estratégia.
11. Operações externas, como Google, Outlook, Resend e Mercado Pago, não podem manter transações PostgreSQL abertas.
12. Use idempotência em callbacks, webhooks, notificações e ações repetíveis. Retentativas não podem duplicar reserva, pedido, e-mail, evento ou feedback.
13. Não execute pagamento real. Não limpe a base compartilhada. Testes remotos devem usar dados temporários identificáveis e limpeza exata no `finally`.
14. Se faltarem credenciais externas, conclua schema, serviços, rotas, UI, mocks e testes independentes; mantenha a integração desativada por feature flag e documente exatamente o bloqueio.
15. Não declare uma fase concluída apenas porque build e lint passaram. Exija evidência funcional, de autorização e de persistência proporcional ao risco.

## Ordem de implementação

Implemente as fases abaixo em ordem. Antes de iniciar cada fase, revise dependências da fase anterior. Ao terminar cada uma, execute os testes específicos, atualize o relatório e prossiga. Só pare para pedir decisão quando faltar uma credencial, escolha de negócio ou autorização externa que realmente impeça trabalho adicional seguro.

## Fase 1 — Fechamento visual e UX

Reestruture as telas `/cliente/rotina`, `/cliente/rotina/configurar` e `/cliente/rotina/planejamento` para uma experiência minimalista, profissional, responsiva e coerente com o módulo cliente.

Implemente:

- hierarquia visual clara entre perfil, semana, próxima refeição, orçamento e ações;
- planejamento semanal em cards ou linha do tempo que funcione em desktop e mobile;
- estados de carregamento com skeletons estáveis, sem saltos grandes de layout;
- estados vazios diferentes para perfil ausente, semana não gerada, semana encerrada, ausência de candidatos e erro real;
- indicação objetiva de sugestão, aprovação, recusa, alteração, reserva e pedido;
- edição de restaurante, prato e horário sem perder o contexto do dia;
- confirmação antes de regenerar, converter, recusar ou descartar edição;
- tratamento visual de HTTP 409, preservando o rascunho local e permitindo comparar/recarregar a versão salva;
- mensagens de sucesso e erro curtas, úteis e com acentuação correta;
- tema claro e escuro profissional, contraste WCAG AA e foco visível;
- navegação por teclado, labels, `aria-*`, diálogos com focus trap e retorno do foco;
- responsividade em 320, 390, 768, 1024 e 1440 px;
- ausência de overflow, botões escondidos e conteúdo cortado;
- texto informativo somente quando ajuda uma decisão. Não inclua falas sobre banca, apresentação ou explicações internas do software.

Critérios de aceite:

- todas as ações existentes continuam funcionais;
- conflito entre duas abas é compreensível e não perde a edição;
- claro/escuro e desktop/mobile foram inspecionados visualmente;
- screenshots ou evidências visuais são registradas no relatório;
- nenhum componente altera a regra de negócio apenas para simplificar a interface.

## Fase 2 — Integração segura com Google Agenda e Outlook

Implemente primeiro Google Agenda e, após estabilizá-lo, Outlook/Microsoft Graph. A finalidade é detectar horários ocupados e calcular janelas livres para almoço. Não copie indiscriminadamente o conteúdo pessoal da agenda.

Modele, em migrations incrementais:

- conexão de agenda por cliente e provedor;
- status da conexão, escopos, expiração, última sincronização e erro sanitizado;
- referência protegida aos tokens, preferencialmente por mecanismo seguro do backend/Vault, nunca em tabela legível pelo navegador;
- cursores de sincronização quando suportados;
- janelas ocupadas normalizadas e mínimas para recomendação;
- log de sincronização e idempotência de callbacks;
- opção de desconectar, revogar acesso e excluir dados importados.

OAuth e segurança:

- Authorization Code com PKCE quando aplicável;
- `state` aleatório, curto e associado à sessão para impedir CSRF;
- redirect URIs allowlisted e separadas por ambiente;
- escopo mínimo e somente leitura/free-busy;
- tokens criptografados e mascarados em logs;
- refresh no backend, rotação segura e tratamento de revogação;
- não usar título, descrição, convidados ou local do evento se free/busy for suficiente;
- política de retenção e ação explícita para apagar dados da agenda;
- uma conexão de cada provedor por cliente, com restrição de unicidade coerente.

Regras de negócio:

- modo manual continua disponível sem agenda;
- calendário usa o timezone do evento e converte para `America/Sao_Paulo` na regra atual;
- compromissos ocupados reduzem a janela de almoço, mas nunca criam reservas automaticamente;
- dias sem janela suficiente recebem diagnóstico objetivo;
- sincronização falha não apaga a última visão válida; marque-a como possivelmente desatualizada;
- alterações de agenda que invalidem um planejamento ainda não convertido exigem regeneração;
- reservas/pedidos já convertidos permanecem e recebem apenas aviso de conflito.

Frontend:

- seção “Agenda” dentro das preferências da rotina;
- botões separados “Conectar Google Agenda”, “Conectar Outlook”, “Sincronizar” e “Desconectar”;
- pop-up de confirmação para conectar/desconectar;
- status, última sincronização e permissões de forma clara;
- revisão das janelas livres calculadas antes de gerar o planejamento.

Testes:

- callback com `state` inválido/reutilizado;
- token expirado, refresh, revogação e provedor indisponível;
- sincronização idempotente e concorrente;
- timezone e eventos sobrepostos;
- desconexão remove tokens e dados importados do cliente correto;
- RLS impede qualquer cliente de ler conexão ou janelas de outro;
- conteúdo pessoal não aparece em logs nem respostas.

## Fase 3 — Recomendações mais inteligentes e explicáveis

Evolua o motor determinístico existente sem criar dependência obrigatória de IA generativa. Preserve reprodutibilidade e possibilidade de explicar cada decisão.

Considere:

- restaurantes e pratos explicitamente priorizados;
- favoritos existentes sem aplicar peso duplicado;
- orçamento diário e semanal como limites eliminatórios;
- raio e distância real disponível;
- compatibilidade com agenda, funcionamento e antecedência;
- avaliações e score operacional;
- feedback anterior do cliente;
- repetição recente de restaurante, prato e categoria;
- variedade da semana;
- disponibilidade e preço atuais;
- restrições e alérgenos estruturados da fase 4 quando disponíveis.

Implemente:

- pesos versionados e centralizados, sem números espalhados pelas rotas;
- explicação curta voltada ao cliente, como “dentro do seu orçamento e próximo do trabalho”;
- diagnóstico técnico nos metadados, sem expor dados sensíveis;
- penalidade gradual de repetição, sem banir favoritos;
- fallback quando não houver prato: sugerir apenas mesa se isso for seguro e útil;
- possibilidade de pedir outra sugestão para um único dia sem regenerar toda a semana;
- comparação de alternativas com diferença de preço, distância e aderência;
- indicador de dados insuficientes em vez de pontuação inventada;
- versionamento do modelo de recomendação registrado no planejamento;
- métricas de cobertura: dias com sugestão, motivos de eliminação e taxa de conversão.

Não prometa “melhor restaurante”, nutrição, ausência de alergênicos, tempo de preparo ou rota exata.

Testes devem cobrir determinismo, desempate estável, diversidade, limites eliminatórios, histórico, favoritos, ausência de dados, mudança de pesos e regressões dos testes atuais.

## Fase 4 — Ingredientes, restrições e alérgenos estruturados

Crie uma modelagem confiável para que restaurantes informem ingredientes e alérgenos dos produtos.

Inclua:

- catálogo padronizado de alérgenos;
- ingredientes associados ao produto;
- alérgenos presentes, “pode conter” e risco de contaminação cruzada;
- origem da informação, responsável e data da última revisão;
- status “informação incompleta”;
- edição no módulo restaurante, com validação e confirmação;
- visualização clara no cardápio e na rotina do cliente;
- preferências alimentares separadas de alergias médicas;
- possibilidade de o cliente bloquear ou apenas alertar determinado item;
- auditoria de alterações relevantes.

Regras:

- informação incompleta nunca deve ser interpretada como ausência de risco;
- alergia com dados insuficientes continua impedindo sugestão automática de prato;
- “pode conter” deve bloquear recomendações quando o cliente marcou alergia severa;
- restaurante é responsável pela informação, com texto jurídico simples e não invasivo;
- nenhuma tela deve declarar garantia absoluta de segurança alimentar.

Adicione RLS, índices, constraints, testes de propriedade e testes do motor de recomendação para combinação de ingredientes, alérgenos e contaminação cruzada.

## Fase 5 — Conversão completa: sugestão, reserva, pedido e pagamento

Feche e valide o fluxo integrado:

```text
Sugestão
→ confirmação explícita do cliente
→ revalidação de restaurante, mesa, produto, preço, funcionamento e orçamento
→ reserva simples confirmada
OU reserva com pedido pendente
→ checkout Mercado Pago sandbox
→ webhook aprovado
→ pedido e reserva confirmados
→ pedido entra na fila operacional da cozinha no momento correto
```

Requisitos:

- idempotency key por tentativa de conversão e pagamento;
- uma sugestão não pode gerar duas reservas/pedidos;
- manter locks e versões já implementados;
- preço final vem do produto atual, não da sugestão antiga;
- mudança de preço exige confirmação do cliente antes do checkout quando relevante;
- item indisponível, restaurante fechado, mesa ocupada ou orçamento excedido retornam alternativa segura;
- reserva com pedido continua pendente até pagamento aprovado;
- falha ou abandono do checkout não confirma reserva/pedido indevidamente;
- webhook repetido ou fora de ordem não duplica nem regride estado;
- notificações somente após commit;
- retorno e botão voltar nunca levam a tela branca;
- detalhes do pedido mostram itens, valores, restaurante, reserva e status coerentes;
- cozinha recebe itens somente após pagamento e conforme a fila operacional vigente.

Execute apenas sandbox. Cubra sucesso, pendência, rejeição, expiração, cancelamento, webhook duplicado, resposta perdida após commit e indisponibilidade entre sugestão e conversão.

## Fase 6 — Automação e notificações por e-mail

Integre notificações internas e e-mail sem colocar envio externo dentro da transação principal.

Implemente um padrão de outbox/fila com:

- evento único e chave de idempotência;
- destinatário, template, dados mínimos, status, tentativas e próxima tentativa;
- processamento assíncrono seguro por cron/worker;
- retry com backoff e limite;
- dead-letter ou estado de falha permanente;
- logs sem conteúdo sensível;
- preferência do usuário por categoria e canal;
- cancelamento de lembretes obsoletos quando o estado muda.

Eventos mínimos:

- planejamento semanal disponível;
- agenda desconectada ou sincronização falhou repetidamente;
- sugestão aprovada/alterada;
- reserva criada;
- pagamento pendente, aprovado, rejeitado ou expirado;
- confirmação de presença próxima do prazo;
- reserva próxima;
- alteração/cancelamento relevante;
- solicitação de feedback após experiência elegível.

E-mail:

- templates responsivos, acessíveis e coerentes com a identidade Appono;
- links absolutos e allowlisted;
- unsubscribe/preferências quando aplicável;
- domínio remetente e variáveis por ambiente;
- feature flag que desativa envio real em desenvolvimento;
- Resend configurado apenas no backend;
- testes com transporte fake e, quando autorizado, domínio/ambiente de teste.

Não envie e-mail a cada mudança interna. Agrupe eventos quando isso reduzir ruído e respeite horário de silêncio configurável.

## Fase 7 — Feedback e aprendizado controlado

Após uma refeição realmente elegível, solicite feedback específico sobre a recomendação, separado da avaliação pública do restaurante.

Modele:

- vínculo com refeição planejada, reserva, pedido e cliente;
- gostou/não gostou, repetiria, motivo opcional e tags estruturadas;
- uma resposta ativa por experiência, com possibilidade de edição auditada;
- momento de elegibilidade e expiração;
- consentimento para usar o feedback na personalização.

Regras:

- feedback só existe após reserva concluída ou pedido entregue;
- não confundir reclamação operacional com avaliação da sugestão;
- reclamações continuam no suporte;
- peso de feedback deve ser limitado, explicável e reversível;
- poucos feedbacks não podem dominar preferências explícitas;
- permitir apagar histórico de personalização sem apagar registros financeiros/operacionais obrigatórios;
- registrar qual versão do modelo utilizou cada sinal.

Mostre ao cliente como o feedback afetará futuras sugestões. Crie testes de duplicidade, elegibilidade, propriedade, edição, exclusão lógica e impacto no ranking.

## Fase 8 — Almoço em grupo

Implemente somente depois que o fluxo individual, agenda e feedback estiverem estáveis.

Escopo da primeira versão:

- um cliente cria o grupo, janela, localização aproximada, orçamento por pessoa e número de participantes;
- convite por link/token expirável e não enumerável;
- participantes aceitam ou recusam;
- cada participante informa restrições que podem ser usadas no cálculo sem serem exibidas aos demais;
- sugestões consideram interseção de agenda, capacidade, orçamento e segurança alimentar;
- votação de restaurante/prato com prazo e desempate explícito;
- organizador confirma a opção final;
- cada participante confirma presença individualmente;
- reserva pertence ao grupo, mas possui organizador e participantes auditáveis.

Decisões obrigatórias:

- não implementar pagamento dividido real sem regra financeira aprovada;
- na primeira versão, pedido antecipado em grupo deve ficar desativado ou usar um único pagador explicitamente informado;
- participantes não veem dados privados de agenda, alergias detalhadas, endereço-base ou histórico uns dos outros;
- saída de participante recalcula capacidade/orçamento antes da conversão;
- convite revogado ou expirado não pode ser reutilizado;
- concorrência em votos, entrada e confirmação deve ser transacional.

Modele estados do grupo, participantes, convites, votos e vínculo com planejamento/refeição/reserva. Crie RLS por participação e testes com organizador, participante, não participante e usuário anônimo.

## Fase 9 — Inteligência agregada para restaurantes

Crie uma visão operacional de demanda futura sem revelar hábitos individuais.

Exiba somente dados agregados como:

- demanda estimada por dia e faixa de horário;
- faixas de preço mais buscadas;
- categorias/pratos mais desejados;
- conversões, recusas e indisponibilidades agregadas;
- regiões ou faixas de distância amplas quando houver volume suficiente;
- tendência semanal, nunca localização individual em tempo real.

Privacidade obrigatória:

- limite mínimo de coorte, inicialmente 5 clientes distintos, antes de mostrar qualquer segmento;
- suprimir combinações que permitam reidentificação;
- não expor nome, e-mail, endereço, coordenada exata, agenda, alergia ou histórico individual;
- agregações calculadas no backend/banco, não enviando registros brutos ao navegador do restaurante;
- restaurante vê apenas dados pertinentes ao próprio estabelecimento, salvo benchmark global realmente anonimizado;
- retenção definida e documentação do propósito;
- alergias e restrições não devem aparecer como segmento comercial individualizável;
- registrar acesso às métricas sensíveis e aplicar rate limit.

Crie dashboard profissional no módulo restaurante, filtros temporais limitados, estados vazios honestos e explicação de que demanda prevista não representa reserva garantida. Teste coorte abaixo/acima do limite, RLS, arredondamento, filtros e tentativas de inferência por combinações estreitas.

## Requisitos transversais de arquitetura

- Separe domínio, transporte e persistência. Rotas Express não devem concentrar todas as regras.
- Use schemas/validadores consistentes para entrada. Não faça coerção silenciosa de dados inválidos.
- Padronize erros em `code`, `error` e contexto seguro; use 400, 401, 403, 404, 409, 422, 429 e 503 corretamente.
- Aplique paginação, limites de payload, timeouts, AbortSignal e cache somente onde não causar dados obsoletos perigosos.
- Evite N+1 em planejamento, histórico, demanda e grupos. Adicione índices conforme o padrão real das consultas e valide planos quando relevante.
- Datas persistidas em UTC quando representam instantes; datas/horários locais devem carregar timezone ou regra explícita.
- Preserve `America/Sao_Paulo` como regra atual de apresentação e cálculo local, sem assumir que todo provedor externo usa esse fuso.
- Use feature flags para agenda, e-mail, grupo e inteligência do restaurante.
- Adicione observabilidade: request ID, duração, operação, resultado e códigos de falha, sem PII ou tokens.
- Não introduza dependência externa quando uma solução local clara e testável atender melhor.
- Dependências novas devem ter versão fixada/lockfile atualizado, justificativa e verificação de manutenção/licença.

## Estratégia de migrations

Para cada fase com mudança de banco:

1. Audite schema, constraints, índices, grants e dados legados.
2. Crie migration incremental pelo CLI.
3. Use transação quando compatível.
4. Faça preflight e falhe com diagnóstico antes de constraints destrutivas.
5. Habilite RLS e defina políticas por propriedade.
6. Revogue privilégios padrão de funções e tabelas sensíveis.
7. Inclua índices das FKs e consultas mais frequentes.
8. Prepare rollback operacional ou estratégia de desativação por feature flag.
9. Não aplique ao remoto sem autorização.
10. Registre ordem de implantação entre migration, backend, worker e frontend.

## Testes obrigatórios

Mantenha os testes atuais e amplie progressivamente:

- testes unitários de domínio;
- testes HTTP das rotas reais com dependências controladas;
- testes PostgreSQL reais para constraints, transações, locks e RLS;
- testes com duas identidades e tentativas de acesso cruzado;
- testes de concorrência com conexões independentes;
- testes de integração dos provedores usando mocks oficiais/fakes;
- smoke remoto somente quando autorizado, com dados temporários e cleanup verificado;
- testes de acessibilidade e responsividade das telas principais;
- testes de fluxo com navegador para configuração, planejamento, agenda, conversão, feedback e grupo;
- sandbox do Mercado Pago, sem cobrança real;
- transporte de e-mail fake por padrão.

Ao final de cada fase e no fechamento geral, execute:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute também as suítes PostgreSQL e smoke específicas quando o ambiente estiver autorizado. Não deixe processos de teste ou portas abertas.

## Documentação contínua

Atualize o README após cada fase com:

- funcionalidade e regra de negócio;
- novas rotas, tabelas, funções e workers;
- variáveis de ambiente apenas pelo nome, nunca pelo valor;
- migrations e ordem de aplicação;
- feature flags;
- testes executados e resultados;
- limitações e pendências reais.

Mantenha um relatório em `docs/appono-rotina-evolucao.md` com checklist dos itens 1 a 9, decisões, riscos, evidências e débitos técnicos. Não apague relatórios históricos.

## Definição global de pronto

O trabalho estará concluído somente quando:

- os nove itens estiverem implementados ou houver bloqueio externo explícito e isolado sem impedir o restante;
- os fluxos individual, agenda, recomendação, segurança alimentar, conversão, notificações, feedback, grupo e demanda estiverem integrados sem duplicar regras existentes;
- migrations incrementais estiverem revisadas e com estratégia de implantação;
- RLS, propriedade, concorrência e idempotência tiverem evidências;
- nenhuma credencial ou `.env` estiver no diff;
- builds, lint, testes automatizados e testes PostgreSQL passarem;
- estados de erro, vazio, loading, responsividade e modo escuro estiverem verificados;
- documentação refletir o comportamento real;
- checkout e e-mail reais não tiverem sido acionados sem autorização;
- nenhum commit, push, deploy ou migration remota tiver sido feito sem autorização explícita.

## Entrega final

Ao terminar, apresente:

1. resumo executivo do que foi entregue em cada fase;
2. arquivos e migrations principais;
3. regras de negócio finais;
4. decisões de segurança e privacidade;
5. resultados dos testes, separando unitário, simulado, PostgreSQL real, smoke remoto e navegador;
6. credenciais ou configurações ainda necessárias, somente pelos nomes;
7. limitações e riscos restantes;
8. ordem segura de implantação;
9. sugestões de commits separados por fase, sem executá-los;
10. recomendação objetiva do próximo ciclo de produto após os nove itens.

Não esconda falhas, não confunda mock com integração real e não declare uma funcionalidade pronta quando apenas sua interface existir. Implemente com foco no valor central da Appono: transformar a rotina de almoço em uma experiência organizada, confiável e útil para cliente e restaurante, sem sacrificar privacidade, segurança alimentar ou consistência operacional.
