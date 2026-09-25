# Prompt do Dia 17 - Homologacao interna controlada da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, backend, seguranca, privacidade, observabilidade e testes trabalhando diretamente no projeto Appono. Execute integralmente o marco de **8 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **ativar a V2 congelada somente para homologacao interna autorizada**, com allowlist explicita, flag publica desligada, fallback para o controle, diagnostico seguro, kill switch e reversibilidade. A reserva prospectiva do Dia 07 ja foi executada uma unica vez e nao pode ser reaberta, reexecutada ou usada para recalibrar a formula.

Nao entregue apenas analise, pseudocodigo ou lista de proximos passos. Inspecione o estado real do repositorio, valide as pre-condicoes, implemente somente o que for necessario para homologacao interna, adicione testes, execute verificacoes locais e produza um checkpoint datado.

Nao faca commit, push, deploy, migration remota, seed remoto, pagamento, e-mail ou operacao em Supabase sem autorizacao explicita.

## Limite deste marco

Homologacao interna significa executar o fluxo somente para identidades sintéticas ou contas internas explicitamente autorizadas no ambiente local/de homologacao. Nao significa cliente publico, piloto aberto, validacao comercial, superioridade da V2, release ou IA pronta.

O rollout publico deve permanecer `0`. A flag global publica deve permanecer desligada. O controle deterministico continua sendo o fallback e a referencia operacional.

## Entrega esperada

Ao final, deve existir uma integracao de homologacao interna reproduzivel, reversivel e auditavel, com:

- V2 exatamente igual a `appono-intelligence-v2` em estado `FROZEN`;
- allowlist interna explicita e limitada;
- flag publica desligada por padrao;
- kill switch funcional;
- controle usado fora da allowlist, com flag desligada, em baixa confianca e em qualquer falha;
- filtros eliminatorios aplicados antes da personalizacao;
- consentimento, revogacao, atividade e idempotencia respeitados;
- diagnostico allowlist-only, sem PII, segredo, agenda, coordenada ou sinal individual;
- nenhum acesso a reserva, simulacao, reavaliacao ou recalibracao;
- testes de rota, dominio e concorrencia;
- checkpoint do Dia 08;
- calendario atualizado somente depois de todas as verificacoes.

## Decisoes permitidas

Use somente uma:

- `HOMOLOGACAO_INTERNA_CONCLUIDA`;
- `HOMOLOGACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`;
- `HOMOLOGACAO_INTERNA_PARCIAL`;
- `HOMOLOGACAO_INTERNA_BLOQUEADA`.

Nao use `IA_PRONTA`, `VALIDACAO_COMERCIAL_CONCLUIDA`, `ROLLOUT_PUBLICO`, `RELEASE` ou `V2_1_IMPLEMENTADA`.

## Pre-condicoes obrigatorias

Antes de editar ou executar o fluxo, confirme:

- checkpoint do Dia 07 presente e coerente;
- decisao do Dia 07 igual a `VALIDACAO_RESERVA_CONCLUIDA` ou ressalva nao bloqueante documentada;
- candidata `appono-intelligence-v2` em estado `FROZEN`;
- manifesto e relatorio de congelamento com hashes canonicos validos;
- controle, V1, V2, politica, contrato e guardrails preservados;
- reserva historica `OPENED_ONCE_CONTAMINATED` e reserva prospectiva consumida uma unica vez;
- nenhum arquivo de resposta humana foi inventado;
- rollout publico igual a `0`;
- allowlist publica inexistente ou desativada;
- suite, builds, lint e `git diff --check` aprovados no Dia 07;
- arvore de trabalho, branch e HEAD registrados antes das edicoes.

Se uma pre-condicao falhar, nao ative a homologacao. Registre `HOMOLOGACAO_INTERNA_BLOQUEADA` e preserve todos os artefatos.

## Leitura obrigatoria

Leia integralmente:

- `README.md`, `package.json`, `backend/package.json` e `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints dos Dias 05, 06 e 07;
- prompts dos Dias 14, 15 e 16;
- manifesto e relatorio `FROZEN`;
- `backend/src/domain/routine-intelligence-operational.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/routes/routine.js`;
- servicos de planejamento, perfil, consentimento, agenda, elegibilidade e diagnostico;
- testes de recomendacao, politica, allowlist, fallback, consentimento, idempotencia, rotas e integracao;
- protocolo de reserva e resumo interno do Dia 07 somente para confirmar estado e hashes.

Nao abra arquivos privados da reserva, nao execute a CLI de reserva, nao execute simulacao e nao use resultados de reserva como configuracao.

## Regras inegociaveis

1. Nao altere formulas, pesos, limites, limiar `0.25`, decaimento, suavizacao ou desempates.
2. Nao crie V2.1 ou variante comportamental.
3. Nao altere manifesto, relatorio, snapshots ou metricas congeladas.
4. Nao reexecute a reserva historica ou prospectiva.
5. Nao use dados reais de cliente como fixture ou evidencia.
6. Nao habilite rollout publico, piloto aberto ou sugestoes publicas.
7. Nao permita que erro da V2 interrompa o controle.
8. Nao envie candidato inelegivel a qualquer modelo.
9. Nao personalize sem consentimento valido e atual.
10. Nao use sinal futuro, revogado, inativo ou duplicado.
11. Nao persista PII, texto livre, agenda, coordenada, dado medico ou sinal individual.
12. Nao chame banco, HTTP, pagamento, e-mail ou reserva a partir de dominio puro.
13. Nao transforme diagnostico em placar ou evidencia comercial.
14. Nao invente resposta humana, consenso ou preferencia.
15. Nao faca operacao remota, commit ou deploy neste marco.

## Fase 1 - Inventario do ambiente

Registre antes da primeira edicao:

- branch, HEAD, Node.js, npm e estado da arvore;
- ponto de entrada do planejamento real;
- estado atual das flags, allowlist e kill switch;
- caminho de selecao da V2 e do controle;
- contrato de diagnostico e persistencia existente;
- identidade tecnica usada para homologacao;
- estado da sessao e consentimento;
- testes existentes e lacunas reais;
- hashes da candidata, politica, guardrails e checkpoints;
- ausencia de chamadas de reserva, simulacao ou avaliacao.

Separe codigo operacional, dominio puro, configuracao local, testes e artefatos experimentais.

## Fase 2 - Contrato de ativacao interna

Formalize ou valide uma funcao pura que receba somente:

- entrada comum validada;
- candidatos elegiveis;
- estado isolado do usuario e do modelo;
- consentimento e sinais elegiveis;
- versao congelada;
- flag interna;
- allowlist interna;
- kill switch;
- request id tecnico.

Ela deve retornar:

- escolha efetiva;
- fonte tecnica da decisao;
- se houve fallback;
- codigo tecnico;
- diagnostico permitido;
- identificador de idempotencia.

Ela nao deve retornar score privado, ranking completo, sinal individual, PII, chave, semente, agenda ou snapshot.

## Fase 3 - Politica de ativacao

Comprove esta ordem deterministica:

1. manifesto ausente, divergente ou nao `FROZEN`: controle;
2. flag global desligada: controle;
3. identidade fora da allowlist: controle;
4. kill switch ativo: controle;
5. entrada invalida: erro seguro ou controle;
6. candidatos inelegiveis removidos antes da personalizacao;
7. consentimento ausente ou revogado: controle sem personalizacao;
8. sinais futuros, inativos ou duplicados removidos;
9. confianca abaixo de `0.25`: controle;
10. erro ou timeout da V2: controle;
11. escolha fora do universo elegivel: controle ou erro seguro;
12. somente entao a V2 pode decidir.

Nenhuma ordem pode ser alterada para favorecer a V2.

## Fase 4 - Allowlist e configuracao segura

Implemente ou valide configuracao local que:

- seja desligada por padrao;
- aceite apenas identificadores tecnicos permitidos;
- nao aceite e-mail ou telefone em diagnostico;
- rejeite wildcard ou allowlist vazia como ativacao ampla;
- nao seja controlada por argumento arbitrario em producao;
- possua kill switch prioritario;
- seja auditavel sem revelar membros da allowlist;
- mantenha `public_rollout_percent: 0`.

Nao crie segredo novo nem altere ambiente remoto.

## Fase 5 - Integracao com planejamento

Use os campos que o planejamento ja possui e comprove:

- janela alimentar, horario e semana validos;
- agenda usada apenas como disponibilidade;
- orcamento, raio, funcionamento e disponibilidade como filtros;
- seguranca alimentar preservada;
- universo comum entre controle e V2;
- estado isolado por usuario, persona e versao;
- sinais anteriores, ativos, consentidos e idempotentes;
- grupo sem historico neutro;
- timestamp fornecido pelo fluxo, sem relogio escondido no dominio;
- resposta reversivel pelo controle.

## Fase 6 - Diagnostico e persistencia

O diagnostico permitido pode conter apenas:

- `decision_source`;
- `model_version` tecnica permitida;
- `policy_version`;
- `fallback_used`;
- `technical_code`;
- buckets de confianca ou volume, se ja previstos;
- guardrails aplicados;
- request id tecnico sem PII;
- timestamp operacional do adaptador.

Rejeite explicitamente:

- nome, e-mail, telefone, endereco ou coordenada;
- agenda completa;
- alergia ou condicao medica;
- texto livre;
- sinal individual;
- token, senha ou credencial;
- score, ranking completo ou utilidade privada;
- material de reserva.

Se nao houver persistencia segura existente, use adaptador local aprovado ou registre a limitacao. Nao crie migration remota.

## Fase 7 - Idempotencia, concorrencia e reversao

Teste que:

- mesma solicitacao nao duplica planejamento nem diagnostico;
- request id tecnico permanece estavel no escopo permitido;
- duas chamadas concorrentes nao misturam estados;
- fallback e V2 nao produzem decisoes conflitantes para a mesma chave;
- reprocessamento e detectavel;
- kill switch reverte para controle sem apagar dados validos;
- desativar a flag restaura o comportamento anterior;
- nenhuma recomendacao grava feedback como efeito colateral.

## Fase 8 - Testes obrigatorios

Adicione ou confirme cobertura para:

- V2 dentro da allowlist;
- controle fora da allowlist;
- flag global desligada;
- kill switch;
- manifesto nao `FROZEN`;
- hash divergente;
- baixa confianca;
- erro e timeout da V2;
- candidato inelegivel;
- filtros de seguranca, funcionamento, disponibilidade, orcamento e raio;
- consentimento ausente e revogado;
- sinal inativo, futuro e duplicado;
- grupo sem historico;
- isolamento de estado;
- diagnostico sem PII ou segredo;
- idempotencia e concorrencia;
- nenhum HTTP, banco ou reserva no dominio puro;
- rollout publico zero;
- reversao imediata pelo kill switch.

Use fixtures sinteticas. Nao use clientes reais, respostas humanas ou resultados da reserva como fixture.

## Fase 9 - Auditoria estatica

Varra codigo, testes e diagnosticos procurando:

- PII, tokens, credenciais, agenda e coordenadas;
- importacao de reserva ou arquivo privado;
- alteracao de formula ou limiar;
- chamada de banco/HTTP no dominio puro;
- uso de relogio real fora do adaptador operacional;
- V2 fora da politica;
- fallback creditado como V2;
- rollout diferente de zero;
- alegacao de vencedor, validacao comercial ou release.

Analise falsos positivos individualmente.

## Fase 10 - Verificacao

Descubra e execute os comandos reais equivalentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem os checks de integridade existentes em modo somente leitura:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run execute:rotina:reserve --workspace backend -- --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Rode os testes focados da homologacao pelo menos tres vezes. Nao execute a reserva em `--write`, simulacoes em escrita ou qualquer servico remoto.

## Fase 11 - Checkpoint do Dia 08

Crie `docs/appono-intelligence-v2-checkpoint-2026-10-08.md` contendo:

1. decisao do marco;
2. data planejada e real;
3. confirmacao de encerramento do Dia 07;
4. branch, HEAD e estado inicial;
5. manifesto e hashes da candidata;
6. arquitetura da homologacao;
7. allowlist, flags e kill switch;
8. politica de ativacao e fallback;
9. filtros, consentimento e sinais;
10. diagnostico e persistencia;
11. idempotencia e concorrencia;
12. testes e resultados;
13. auditoria de privacidade;
14. arquivos criados ou alterados;
15. confirmacao de formulas inalteradas;
16. confirmacao de que nenhuma reserva foi acessada;
17. confirmacao de rollout publico zero;
18. limitacoes e riscos residuais;
19. itens preparados para 09 e 10/10;
20. entrada exata do proximo marco.

Atualize o calendario somente depois dos testes e do checkpoint. Marque apenas 08/10.

## Criterios de encerramento

O Dia 08 somente pode ser concluido quando:

- Dia 07 continuar aprovado;
- V2 usada em homologacao for `FROZEN` e hash-validada;
- allowlist interna funcionar sem ativar publico;
- flag publica continuar desligada;
- fallback passar em erro, timeout e baixa confianca;
- filtros eliminatorios ocorrerem antes da personalizacao;
- consentimento, revogacao, causalidade e idempotencia passarem;
- diagnostico nao expuser PII, segredo ou sinal individual;
- kill switch reverter para controle;
- nenhuma reserva, simulacao ou recalibracao ocorrer;
- suite, builds, lint, diff e testes focados passarem;
- checkpoint estiver completo;
- rollout publico continuar zero;
- nenhuma operacao remota ou commit ocorrer.

## Trabalho preparado para 09 e 10/10

Pode ficar `PREPARADO`:

- roteiro de smoke test interno;
- matriz de observabilidade;
- checklist de rollback;
- monitoramento de fallback e baixa confianca;
- demonstracao interna sem dados reais;
- plano de encerramento e comunicacao honesta.

Nao pode ficar concluido:

- piloto publico;
- rollout;
- validacao comercial;
- release;
- IA pronta para clientes;
- V2.1.

## Entrega final

Apresente:

1. decisao do marco;
2. confirmacao do Dia 07;
3. arquivos criados ou alterados;
4. hashes da candidata;
5. ponto de integracao;
6. allowlist, flags e kill switch;
7. fallback e falhas cobertas;
8. filtros, consentimento e causalidade;
9. diagnostico e privacidade;
10. idempotencia e concorrencia;
11. testes, builds, lint e diff;
12. confirmacao de formulas inalteradas;
13. confirmacao de que nenhuma reserva foi acessada;
14. confirmacao de rollout publico zero;
15. limitacoes;
16. trabalho preparado para 09 e 10/10;
17. entrada exata do proximo marco: executar smoke test e monitoramento interno, mantendo allowlist, fallback, kill switch e rollout publico zero.

Nao confunda homologacao interna com rollout publico, allowlist com validacao comercial, fallback com vitoria da V2, diagnostico com dado pessoal ou software integrado com produto liberado.
