# Prompt do Dia 18 - Verificacao final ponta a ponta da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, backend, seguranca, privacidade, observabilidade, testes e release controlado trabalhando diretamente no projeto Appono. Execute integralmente o marco de **9 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **realizar a verificacao final ponta a ponta da integracao interna**, corrigindo somente defeitos gerais de contrato, fallback, diagnostico, teste ou documentacao. A V2 continua congelada, a formula nao pode ser recalibrada e o rollout publico deve permanecer zero.

Este marco nao e release publico, nao e validacao comercial, nao e nova simulacao, nao e nova reserva, nao e revisao humana e nao autoriza V2.1. O resultado deve deixar o software pronto para uma demonstracao interna honesta no Dia 10, sem afirmar que clientes reais validaram a IA.

Nao entregue apenas analise ou lista de proximos passos. Inspecione o repositorio, valide o estado real, execute os smoke tests locais, corrija lacunas permitidas, produza um checkpoint datado e atualize somente 09/10 no calendario.

Nao faca commit, push, deploy, migration remota, seed remoto, pagamento, e-mail ou operacao em Supabase sem autorizacao explicita.

## Objetivo e limite

O Dia 09 deve confirmar que o fluxo completo local/de homologacao interna:

- recebe uma entrada valida;
- filtra candidatos antes da personalizacao;
- preserva o controle como fallback;
- seleciona V2 somente sob allowlist e consentimento;
- respeita baixa confianca, erro, timeout e kill switch;
- persiste ou retorna diagnostico seguro;
- mantem idempotencia e isolamento de estado;
- nao ativa o publico;
- nao toca em reserva, snapshots, relatorios congelados ou respostas humanas.

O Dia 09 nao deve criar cliente real, conta publica, piloto, pagamento, reserva operacional ou resultado comercial.

## Decisoes permitidas

Use somente uma:

- `VERIFICACAO_FINAL_CONCLUIDA`;
- `VERIFICACAO_FINAL_CONCLUIDA_COM_RESSALVAS`;
- `VERIFICACAO_FINAL_PARCIAL`;
- `VERIFICACAO_FINAL_BLOQUEADA`.

Nao use `IA_PRONTA`, `VALIDACAO_COMERCIAL_CONCLUIDA`, `ROLLOUT_PUBLICO`, `RELEASE` ou `V2_1_IMPLEMENTADA`.

## Pre-condicoes obrigatorias

Antes de editar ou executar qualquer smoke test, confirme:

- checkpoint do Dia 08 presente e coerente;
- decisao do Dia 08 igual a `HOMOLOGACAO_INTERNA_CONCLUIDA` ou `HOMOLOGACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`;
- ressalva do verificador da reserva corrigida e documentada;
- candidata `appono-intelligence-v2` em estado `FROZEN`;
- hashes do manifesto, relatorio, V2, politica, guardrails e contrato preservados;
- reserva historica contaminada e reserva prospectiva intocadas neste marco;
- `responses-submitted.json` ausente ou sem respostas humanas validas;
- rollout publico igual a `0`;
- flag publica desligada;
- allowlist interna somente local e explicitamente controlada;
- nenhuma alteracao local alheia sera revertida;
- branch, HEAD, Node.js, npm e estado do Git registrados.

Se uma pre-condicao falhar, nao execute a verificacao ponta a ponta com V2. Registre `VERIFICACAO_FINAL_BLOQUEADA` e preserve os artefatos.

## Leitura obrigatoria

Leia integralmente:

- `README.md`, `package.json`, `backend/package.json` e `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints dos Dias 05 a 08;
- prompts dos Dias 14 a 17;
- manifesto e relatorio `FROZEN`;
- `backend/src/domain/routine-intelligence-operational.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/routes/routine.js`;
- contratos de perfil, consentimento, agenda, elegibilidade, planejamento, idempotencia e diagnostico;
- testes de dominio, recomendacao, politica, rotas, fallback, consentimento, sombra e reserva;
- protocolo de abertura da reserva somente para confirmar que o modo `--check` nao le material privado.

Nao abra o arquivo privado da reserva, nao execute `--write`, nao reexecute a reserva e nao use resultados da reserva para configurar o fluxo.

## Regras inegociaveis

1. Nao altere formulas, pesos, limites, limiar `0.25`, decaimento, suavizacao ou desempates.
2. Nao implemente V2.1 nem variante comportamental.
3. Nao altere hashes de artefatos congelados para acomodar testes.
4. Nao execute reserva, simulacao ou avaliacao comparativa em modo de escrita.
5. Nao acesse seed, salt, catalogo privado ou material da reserva.
6. Nao use cliente real, PII ou resposta humana inventada.
7. Nao habilite rollout publico, piloto aberto ou allowlist publica.
8. Nao permita falha da V2 interromper o controle.
9. Nao envie candidato inelegivel a modelo.
10. Nao personalize sem consentimento valido e atual.
11. Nao use sinais futuros, revogados, inativos ou duplicados.
12. Nao persista PII, agenda completa, coordenada, dado medico, token ou sinal individual.
13. Nao introduza migration, chamada remota ou dependencia operacional nova sem autorizacao.
14. Nao grave em snapshots, metricas, relatorios ou pacotes congelados.
15. Nao declare validacao comercial, release ou IA pronta.
16. Nao faca commit, push ou deploy neste marco.

## Fase 1 - Inventario e integridade

Registre antes da primeira edicao:

- branch, HEAD, Node.js, npm e arvore de trabalho;
- arquivos modificados e nao rastreados;
- hashes da candidata, politica, guardrails, protocolo cego e decisao;
- estado do checkpoint do Dia 08;
- flags, allowlist, kill switch e rollout;
- ausencia de respostas humanas validas;
- estado das reservas;
- comandos disponiveis;
- numero esperado de testes;
- defeitos do Dia 08 e sua classificacao.

Separe alteracoes do Dia 08, trabalho novo do Dia 09 e arquivos de prompt nao funcionais.

## Fase 2 - Contrato ponta a ponta

Comprove por testes locais que o caminho completo preserva a mesma entrada comum para controle e V2:

- perfil e janela alimentar validos;
- semana e horario permitidos;
- agenda usada somente para disponibilidade;
- orcamento e raio usados como filtros;
- funcionamento e disponibilidade usados como filtros;
- seguranca alimentar preservada;
- candidatos inelegiveis eliminados antes da personalizacao;
- estado isolado por usuario, conjunto e versao;
- sinais anteriores, ativos, consentidos e idempotentes;
- grupo sem historico neutro;
- timestamp fornecido pelo fluxo;
- resultado reversivel para o controle.

Se a rota exigir banco para ser testada, use somente mocks, stubs ou fixtures locais existentes. Nao conecte a Supabase remoto.

## Fase 3 - Matriz de ativacao

Teste e documente a seguinte ordem:

1. manifesto ausente, adulterado ou nao `FROZEN`: controle;
2. flag global desligada: controle;
3. identidade fora da allowlist: controle;
4. kill switch: controle;
5. entrada invalida: erro seguro ou controle;
6. universo elegivel comum;
7. consentimento ausente ou revogado: controle sem personalizacao;
8. sinais futuros, inativos ou duplicados: ignorados;
9. confianca abaixo de `0.25`: controle;
10. erro ou timeout da V2: controle;
11. escolha fora do universo: controle ou erro seguro;
12. V2 somente para identidade interna autorizada.

Nenhum teste pode depender de uma formula diferente da V2 congelada.

## Fase 4 - Smoke tests locais

Execute fixtures sinteticas para:

- controle padrao;
- V2 dentro da allowlist;
- usuario fora da allowlist;
- flag desativada;
- kill switch ativado;
- manifesto divergente;
- baixa confianca;
- ausencia de historico;
- erro controlado da V2;
- timeout controlado;
- candidato inelegivel;
- consentimento ausente;
- consentimento revogado;
- sinal futuro;
- sinal duplicado;
- duas chamadas idempotentes;
- chamadas concorrentes;
- diagnostico privado rejeitado;
- rollback imediato para controle.

Registre apenas contagens e codigos tecnicos seguros. Nao grave objetos completos ou dados pessoais.

## Fase 5 - Observabilidade e diagnostico

Confirme que o diagnostico contem somente:

- `decision_source`;
- `model_version` permitida;
- `policy_version`;
- `fallback_used`;
- `technical_code`;
- buckets de confianca e amostras, se previstos;
- guardrails aplicados;
- request id tecnico;
- timestamp do adaptador, quando necessario.

Rejeite score, ajuste, ranking, utilidade, texto livre, sinal individual, PII, token, agenda e material de reserva.

Confirme que falhas sao observaveis sem revelar a causa sensivel ao cliente.

## Fase 6 - Idempotencia e concorrencia

Comprove:

- a mesma chave nao gera duas decisoes efetivas;
- o diagnostico nao duplica indevidamente;
- concorrencia nao mistura estados entre usuarios;
- o fallback e deterministico;
- o kill switch nao exige migracao;
- a desativacao da allowlist restaura controle;
- recomendacao nao cria feedback ou conversao como efeito colateral.

## Fase 7 - Auditoria do verificador da reserva

Valide somente em `--check` que:

- a CLI nao le `.private/reserve-reveal-v1.json`;
- nao reconstrui snapshot;
- nao executa modelos;
- nao altera arquivos;
- valida apenas os cinco artefatos ja produzidos;
- rejeita caminho arbitrario e `--write` neste marco;
- reserva historica nunca e chamada.

Se essa garantia falhar, classifique como bloqueador e nao continue para demonstracao interna.

## Fase 8 - Auditoria estatica e privacidade

Varra codigo, testes, logs e novos relatorios procurando:

- PII, coordenadas, agenda, dados medicos ou financeiros;
- JWT, senha, token ou credencial;
- seed, salt ou material privado da reserva;
- importacao indevida de reserva;
- chamada de banco ou HTTP em modulo puro;
- relogio real em contrato deterministico;
- V2 fora da politica;
- fallback creditado como V2;
- linguagem de vencedor, release ou validacao comercial;
- rollout diferente de zero.

Analise falsos positivos individualmente.

## Fase 9 - Verificacao obrigatoria

Descubra os comandos reais e execute:

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

Rode os testes focados ponta a ponta pelo menos tres vezes. O `--check` da reserva deve continuar sem material privado, sem reexecucao e sem escrita. Nao execute `--write`, simulacao, reserva, Supabase ou qualquer operacao remota.

## Fase 10 - Checkpoint do Dia 09

Crie `docs/appono-intelligence-v2-checkpoint-2026-10-09.md` contendo:

1. decisao do marco;
2. data planejada e real;
3. confirmacao do Dia 08 e sua ressalva;
4. branch, HEAD e estado inicial;
5. hashes da candidata e da politica;
6. matriz de ativacao;
7. smoke tests executados;
8. allowlist, flag, kill switch e rollout;
9. filtros e consentimento;
10. idempotencia e concorrencia;
11. diagnostico e privacidade;
12. auditoria do `--check` da reserva;
13. defeitos encontrados e correcoes;
14. testes, builds, lint e diff;
15. arquivos criados ou alterados;
16. formulas e pesos preservados;
17. nenhuma reserva acessada ou reexecutada;
18. nenhum modelo executado fora do fluxo local permitido;
19. rollout publico zero;
20. limitacoes;
21. trabalho preparado para 10/10;
22. entrada exata do proximo marco.

Atualize o calendario somente depois de todos os testes. Marque apenas 09/10.

## Criterios de encerramento

O Dia 09 somente pode ser concluido quando:

- Dia 08 estiver coerente e sua ressalva tratada;
- V2 continuar `FROZEN` e hash-validada;
- fluxo ponta a ponta passar com allowlist interna;
- fora da allowlist o controle for usado;
- flag publica continuar desligada e rollout `0`;
- fallback passar em baixa confianca, erro e timeout;
- filtros precederem personalizacao;
- consentimento, causalidade, idempotencia e concorrencia passarem;
- diagnostico nao expuser dados privados;
- `--check` da reserva nao ler material privado;
- nenhum artefato congelado for alterado;
- suite, builds, lint, diff e focados passarem;
- checkpoint estiver completo;
- nenhuma operacao remota ocorrer.

## Trabalho preparado para 10/10

Pode ficar `PREPARADO`:

- roteiro de demonstracao interna;
- checklist de comunicacao honesta;
- smoke test de rollback;
- relatorio final de limites;
- lista de contas internas somente se autorizada e sem dados pessoais no repositorio.

Nao pode ficar concluido:

- release;
- piloto publico;
- rollout;
- validacao comercial;
- respostas humanas;
- V2.1;
- IA pronta para clientes.

## Entrega final

Apresente:

1. decisao do marco;
2. confirmacao do Dia 08;
3. arquivos criados ou alterados;
4. hashes preservados;
5. matriz de ativacao;
6. smoke tests;
7. fallback, kill switch e rollback;
8. filtros, consentimento e causalidade;
9. diagnostico e privacidade;
10. idempotencia e concorrencia;
11. auditoria do `--check` da reserva;
12. testes, builds, lint e diff;
13. confirmacao de formulas inalteradas;
14. confirmacao de que nenhuma reserva foi acessada;
15. confirmacao de rollout publico zero;
16. limitacoes e ressalvas;
17. trabalho preparado para 10/10;
18. entrada exata: `demonstrar a Appono.AI em homologacao interna, com limites, fallback, diagnostico seguro, kill switch e rollout publico zero, sem declarar validacao comercial ou release`.

Nao confunda verificacao ponta a ponta com validacao comercial, homologacao interna com rollout publico, software pronto para demonstracao com IA pronta para clientes ou `--check` com execucao de reserva.
