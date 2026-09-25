# Prompt do Dia 19 - Demonstracao interna e encerramento controlado da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, backend, seguranca, privacidade, observabilidade, produto e comunicacao tecnica trabalhando diretamente no projeto Appono. Execute integralmente o marco de **10 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **demonstrar a Appono.AI funcionando em homologacao interna controlada**, com configuracao de rotina, planejamento, selecao da V2 congelada quando autorizada, diagnostico seguro, fallback para o controle e kill switch. O encerramento deve documentar com precisao o que foi comprovado e o que continua pendente para clientes reais.

Este marco nao autoriza rollout publico, piloto com clientes, release comercial, pagamento, e-mail, migration remota, acesso a Supabase remoto, nova simulacao, nova reserva, respostas humanas inventadas ou implementacao de V2.1.

Nao entregue apenas uma narrativa ou uma lista de proximos passos. Inspecione o repositorio, valide as pre-condicoes, execute uma demonstracao local/reproduzivel com fixtures sinteticas ou ambiente interno autorizado, confirme os caminhos de sucesso e fallback, produza os artefatos finais e crie um checkpoint datado.

Nao faca commit, push ou deploy sem autorizacao explicita.

## Resultado esperado

Demonstrar, sem dados reais, que:

- uma identidade interna autorizada pode configurar a rotina;
- o backend valida perfil, janelas, agenda e elegibilidade;
- candidatos inelegiveis sao removidos antes da personalizacao;
- a V2 `appono-intelligence-v2` e usada somente sob allowlist e consentimento;
- o planejamento e produzido de forma deterministica;
- o diagnostico identifica a fonte tecnica sem expor score ou PII;
- a falha, timeout, baixa confianca ou kill switch retorna ao controle;
- uma identidade fora da allowlist permanece no controle;
- idempotencia impede duplicacao indevida;
- rollout publico continua `0`;
- nenhuma formula congelada foi alterada.

A demonstracao deve ser descrita como **homologacao interna controlada**, nao como validacao comercial ou release.

## Decisoes permitidas

Use uma destas decisoes:

- `DEMONSTRACAO_INTERNA_CONCLUIDA`;
- `DEMONSTRACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`;
- `DEMONSTRACAO_INTERNA_PARCIAL`;
- `DEMONSTRACAO_INTERNA_BLOQUEADA`.

Nao use `IA_PRONTA_PARA_CLIENTES`, `VALIDACAO_COMERCIAL_CONCLUIDA`, `ROLLOUT_PUBLICO`, `RELEASE`, `HOMOLOGACAO_PUBLICA` ou `V2_1_IMPLEMENTADA`.

## Pre-condicoes obrigatorias

Antes de editar ou demonstrar, confirme:

- checkpoint do Dia 09 presente e coerente;
- decisao do Dia 09 igual a `VERIFICACAO_FINAL_CONCLUIDA` ou `VERIFICACAO_FINAL_CONCLUIDA_COM_RESSALVAS`;
- ressalva do Dia 08 tratada e o `--check` da reserva sem material privado;
- candidata em estado `FROZEN`;
- manifesto e relatorio de congelamento com hashes validos;
- V2, politica, guardrails, contrato e scoring preservados;
- reserva historica intocada e reserva prospectiva nao reexecutada;
- respostas humanas continuam ausentes ou pendentes;
- rollout publico igual a `0`;
- flag publica desligada;
- allowlist usada somente em fixture ou ambiente interno autorizado;
- nenhuma conta ou dado real sera introduzido pelo agente;
- branch, HEAD e estado do Git registrados.

Se uma pre-condicao falhar, nao demonstre a V2 como ativa. Registre `DEMONSTRACAO_INTERNA_BLOQUEADA` ou `DEMONSTRACAO_INTERNA_PARCIAL`, conforme o caso.

## Leitura obrigatoria

Leia integralmente:

- `README.md`, `package.json`, `backend/package.json` e `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints dos Dias 05 a 09;
- prompts dos Dias 14 a 18;
- manifesto e relatorio da candidata `FROZEN`;
- `backend/src/domain/routine-intelligence-operational.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/routes/routine.js`;
- contratos de perfil, agenda, consentimento, elegibilidade, planejamento e diagnostico;
- testes de recomendacao, politica, rotas, fallback, idempotencia e privacidade;
- resumo seguro da reserva somente para confirmar hashes e estado.

Nao abra material privado da reserva, nao execute simulacao, nao execute a CLI de reserva em `--write` e nao use resultado de reserva para configurar a demonstracao.

## Regras inegociaveis

1. Nao altere formula, pesos, limites, limiar `0.25`, decaimento, suavizacao ou desempates.
2. Nao implemente V2.1.
3. Nao altere snapshots, relatorios, pacote cego, chave ou hashes congelados.
4. Nao use clientes reais, PII, agenda real, feedback real ou resposta humana inventada.
5. Nao abra nem execute novamente a reserva.
6. Nao habilite rollout publico, piloto aberto ou sugestoes para clientes.
7. Nao use e-mail real ou telefone real na allowlist de fixtures.
8. Nao permita falha da V2 interromper o controle.
9. Nao personalize sem consentimento valido.
10. Nao use sinal futuro, revogado, inativo ou duplicado.
11. Nao persista PII, score, ranking, texto livre ou sinal individual no diagnostico.
12. Nao execute banco, HTTP, Supabase, pagamento, e-mail ou migration remota.
13. Nao confunda demonstracao com validacao comercial.
14. Nao faca commit, push ou deploy neste marco.

## Fase 1 - Inventario final

Registre:

- branch, HEAD, Node.js, npm e arvore de trabalho;
- hashes da V2, manifesto, relatorio, politica e guardrails;
- estado dos Dias 07, 08 e 09;
- estado das flags, allowlist, kill switch e rollout;
- estado das respostas humanas;
- estado das reservas;
- comandos de teste e demonstracao;
- arquivos que serao criados ou alterados;
- limites da demonstracao sem ambiente remoto.

Separe codigo, fixtures, saida da demonstracao, checkpoint e documentacao de comunicacao.

## Fase 2 - Fixture sintetica de demonstracao

Use somente uma fixture local e sintetica contendo:

- identidade tecnica anonima, como `internal-demo-user-01`;
- perfil sem PII;
- janelas alimentares sinteticas;
- restaurantes e produtos sinteticos;
- candidatos elegiveis e inelegiveis;
- consentimento explicito e revogavel;
- historico sintetico anterior ao instante da decisao;
- request id tecnico deterministico;
- allowlist interna local, sem e-mail ou telefone real.

A fixture deve ser independente dos placares prospectivos e nao pode conter resultado esperado codificado de forma a esconder falha.

## Fase 3 - Roteiro principal

Execute e registre o fluxo:

1. carregar fixture sintetica;
2. validar manifesto `FROZEN` e hashes;
3. confirmar flag publica desligada e rollout zero;
4. ativar somente a identidade tecnica da allowlist local;
5. validar consentimento;
6. filtrar candidatos por funcionamento, disponibilidade, seguranca, orcamento, raio e agenda;
7. executar o planejamento com entrada comum;
8. selecionar V2 somente se confianca, historico e politica permitirem;
9. produzir diagnostico operacional seguro;
10. verificar planejamento deterministico e idempotente;
11. repetir a solicitacao e confirmar ausencia de duplicacao;
12. remover a identidade da allowlist e confirmar retorno ao controle.

Nao grave dados em ambiente remoto ou fluxo publico.

## Fase 4 - Roteiro de falhas e rollback

Demonstre com fixtures controladas:

- identidade fora da allowlist;
- flag desligada;
- kill switch ativo;
- manifesto invalido ou candidata nao congelada;
- consentimento ausente;
- consentimento revogado;
- baixa confianca;
- erro simulado da V2;
- timeout simulado;
- candidato inelegivel;
- sinal futuro;
- chamada repetida com mesma idempotencia.

Para cada caso confirme:

- controle efetivo ou erro seguro;
- codigo tecnico seguro;
- nenhum score ou dado privado exposto;
- nenhuma duplicacao;
- nenhuma chamada remota indevida;
- nenhuma alteracao na formula;
- possibilidade de rollback imediato.

## Fase 5 - Diagnostico e privacidade

Audite a saida final e permita somente:

- fonte da decisao;
- versao tecnica;
- politica;
- fallback;
- codigo tecnico;
- bucket de confianca e amostras;
- guardrails aplicados;
- request id tecnico;
- timestamp operacional, quando necessario.

Rejeite ou remova:

- nome, e-mail, telefone, endereco e coordenada;
- agenda completa;
- alergia ou condicao medica;
- texto livre;
- score, ajuste, ranking e utilidade;
- sinal individual;
- token, senha, chave ou seed;
- qualquer material da reserva.

## Fase 6 - Verificacao de determinismo

Comprove:

- mesma fixture e mesma configuracao produzem a mesma decisao tecnica;
- ordem de entrada nao muda a escolha;
- request id nao injeta aleatoriedade;
- timestamp de demonstracao nao altera a formula quando o instante e fornecido;
- repeticao idempotente nao duplica planejamento;
- kill switch sempre prevalece;
- identidade fora da allowlist nunca recebe V2.

## Fase 7 - Documentacao de comunicacao honesta

Prepare um resumo interno que diferencie:

- software de recomendacao implementado;
- candidata V2 congelada;
- homologacao interna demonstrada;
- ausencia de validacao comercial;
- ausencia de respostas humanas;
- rollout publico zero;
- necessidade de observacao real futura;
- limitacoes dos dados sinteticos.

Nao use linguagem de vencedor, superioridade, garantia, autonomia ou validacao de mercado.

## Fase 8 - Auditoria estatica

Varra codigo, fixtures, logs e relatorios novos procurando:

- PII, tokens, credenciais e dados sensiveis;
- seed, salt ou material privado da reserva;
- importacao de modelos fora da politica;
- chamada de banco ou HTTP no dominio puro;
- uso de relogio real indevido;
- fallback apresentado como V2;
- rollout diferente de zero;
- alegacao de release ou validacao comercial.

Analise falsos positivos individualmente.

## Fase 9 - Verificacao obrigatoria

Descubra e execute os comandos reais equivalentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run execute:rotina:reserve --workspace backend -- --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Rode os testes focados do roteiro de demonstracao pelo menos tres vezes. O `--check` da reserva deve ser somente leitura, sem material privado, sem reexecucao e sem escrita.

Nao execute `--write`, nova simulacao, nova reserva, Supabase, pagamento, e-mail, migration ou deploy.

## Fase 10 - Artefatos finais

Crie somente em destinos novos:

- fixture sintetica, se necessaria;
- roteiro ou resultado agregado da demonstracao sem PII;
- checklist de rollback;
- resumo de limites e comunicacao;
- `docs/appono-intelligence-v2-checkpoint-2026-10-10.md`.

Nao grave snapshots completos, dados de conta, tokens, logs privados ou material da reserva.

## Fase 11 - Checkpoint do Dia 10

O checkpoint deve registrar:

1. decisao do marco;
2. data planejada e real;
3. confirmacao do Dia 09 e ressalvas;
4. branch, HEAD e estado inicial;
5. identificador e hash da candidata;
6. roteiro e fixture da demonstracao;
7. resultado do fluxo principal;
8. resultado dos fallbacks e rollback;
9. allowlist, flags e kill switch;
10. filtros, consentimento e idempotencia;
11. diagnostico e auditoria de privacidade;
12. determinismo;
13. reserva e respostas humanas;
14. testes, builds, lint e diff;
15. arquivos criados ou alterados;
16. formulas e hashes preservados;
17. rollout publico zero;
18. limitacoes e ausencia de validacao comercial;
19. estado preparado para os proximos trabalhos;
20. entrada exata do proximo marco, se houver.

Atualize o calendario somente depois de concluir a demonstracao, os testes e o checkpoint. Marque apenas 10/10.

## Criterios de encerramento

O Dia 10 somente pode ser concluido quando:

- Dia 09 estiver aprovado ou com ressalva nao bloqueante documentada;
- V2 continuar `FROZEN` e hash-validada;
- demonstracao interna com fixture sintetica for reproduzivel;
- allowlist funcionar sem rollout publico;
- controle continuar como fallback;
- baixa confianca, erro, timeout e kill switch passarem;
- filtros precederem personalizacao;
- consentimento e revogacao passarem;
- idempotencia e determinismo passarem;
- diagnostico nao expuser dados privados;
- reserva nao for acessada ou reexecutada;
- respostas humanas nao forem inventadas;
- suite, builds, lint, diff e testes focados passarem;
- checkpoint estiver completo;
- rollout publico continuar zero;
- nenhuma operacao remota, commit ou deploy ocorrer.

## Decisao de comunicacao

Se todos os testes passarem, declare somente que a Appono possui **software de recomendacao com IA em homologacao interna controlada**, pronto para demonstracao técnica sob limites definidos.

Declare explicitamente que ainda nao existe:

- validacao comercial;
- evidencia de clientes reais;
- consenso humano;
- release publico;
- rollout publico;
- garantia de superioridade sobre o controle.

## Entrega final

Apresente:

1. decisao do marco;
2. confirmacao do Dia 09;
3. identificador, estado e hash da V2;
4. roteiro e resultado da demonstracao;
5. allowlist, flags, kill switch e fallback;
6. filtros, consentimento e idempotencia;
7. diagnostico e privacidade;
8. determinismo e rollback;
9. testes, builds, lint e diff;
10. confirmacao de formulas inalteradas;
11. confirmacao de que nenhuma reserva foi acessada;
12. confirmacao de que nenhuma resposta humana foi inventada;
13. confirmacao de rollout publico zero;
14. limitacoes e comunicacao honesta;
15. arquivos criados ou alterados;
16. proximo trabalho, se houver.

Nao confunda demonstracao interna com release, software implementado com validacao comercial, V2 congelada com superioridade, fallback com vitoria ou rollout zero com produto publico.
