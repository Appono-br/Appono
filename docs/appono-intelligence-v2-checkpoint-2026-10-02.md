# Checkpoint da Appono.AI - 02/10/2026

## Decisao

Decisao do marco: `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE`

Decisao substantiva: `MANTER_V2_SEM_AJUSTE`

Data planejada: `02/10/2026`. Execucao antecipada: `23/09/2026`, no fuso `America/Sao_Paulo`.

Nao houve respostas humanas submetidas. Portanto, nenhum resultado humano, maioria, empate, consenso ou preferencia humana foi produzido. A decisao foi tomada somente com as evidencias automatizadas congeladas e permanece aberta a revisao humana auxiliar posterior.

## Integridade inicial

- branch: `main`;
- `HEAD` inicial: `4d8600b` (`Conclusao do pacote de revisao humana cega da Appono.AI`);
- alteracoes locais do Dia 02 foram preservadas;
- `responses-submitted.json`: ausente;
- respostas humanas validas: `0`;
- revisores: `0`;
- estado humano: `REVISAO_HUMANA_PENDENTE`;
- pacote cego: 24 casos, sem julgamentos;
- compromisso da chave: presente e nao agregado;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`.

## Protocolos e hashes novos

- protocolo: `routine-technical-decision-v1`;
- protocolo arquivo SHA-256: `61327ee5be8ce8ce81b8cb29bd8456fe44749bf2e5f05bfe5b21175c57244a6a`;
- protocolo hash canonico: `bda3b9feb4b4bc04b977b1253d7b60d217bc9439eb706be8998b151da42d8b33`;
- hipoteses arquivo SHA-256: `c43f2a518d6ad5cb1e3c1c0769b585e521cb7222bc92ac13df3f9e11ff8fe67f`;
- hipoteses hash canonico: `d3dac8508d96d30d33e74ed4f58502147167f499a0fb55347505370d98397de0`;
- relatorio de decisao arquivo SHA-256: `b667219faede2f1ca271459c32e993f24e4adb812ac1df46642076d0c2488748`;
- relatorio de decisao hash canonico: `623854fcc19f291b718d56d50db597d1017257efc00e2b3f59702dced5910dbe`;
- relatorio de decisao canonico reportado: `acf4349cafaaf1be165ae0fa695eacae25d83131a7c6e51b5b8bec4d75f4125a`.

O protocolo foi registrado antes de qualquer agregacao humana. Ele fixa ausencia de resposta como estado pendente, proibe que essa ausencia aceite hipotese nova e impede alteracao de formula, reserva ou rollout.

## Evidencia automatizada

- execucoes prospectivas: `1.800`;
- falhas: `0`;
- fallbacks: `0`;
- violacoes eliminatorias: `0`;
- arrependimento medio do controle na validacao: `5.372953`;
- arrependimento medio da V1 na validacao: `4.263973`;
- arrependimento medio da V2 na validacao: `4.926099`;
- V2 menos controle: `-0.446854`, criterio aprovado;
- V2 menos V1: `+0.662126`, criterio reprovado;
- V2 com confianca maior ou igual a `0.25`: `102/300`;
- regressoes classificadas: `53`;
- guardrails: `7` cobertos por contrato de teste e `3` aprovados;
- candidatos cegos: `24`.

Interpretacao registrada:

- V2 melhora o controle na metrica congelada de arrependimento;
- V2 permanece pior que V1 no criterio comparativo congelado;
- ausencia de violacoes eliminatorias demonstra seguranca estrutural, nao superioridade de qualidade;
- fallback e politica operacional nao transformam escolha nativa em vitoria da V2;
- nenhuma evidencia sintetica equivale a validacao comercial.

## Estado das hipoteses

As quatro hipoteses candidatas foram avaliadas sem alterar modelo ou relatorios:

| Hipotese | Estado | Motivo |
| --- | --- | --- |
| `confidence_is_not_quality_calibration` | `INSUFFICIENT_EVIDENCE` | mecanismo geral ainda nao confirmado pela evidencia congelada |
| `explicit_preference_requires_broader_precedence` | `DEFERRED_HUMAN_REVIEW` | requer evidencia auxiliar humana para fechar a interpretacao |
| `distance_tradeoff_requires_recalibration` | `INSUFFICIENT_EVIDENCE` | nao ha mecanismo geral confirmado |
| `gradual_change_transition_requires_new_formula` | `INSUFFICIENT_EVIDENCE` | criterio V2 x V1 reprovado e mecanismo nao confirmado |

Hipoteses aceitas: `0`.

Nenhuma proposta de peso, limiar, decaimento ou desempate foi criada. Nenhum caso foi removido. Nenhuma hipotese depende da reserva.

## Consequencias

- a V2 atual permanece a candidata tecnica;
- a V2 nao foi promovida contra a V1;
- a politica de baixa confianca continua usando o controle;
- a revisao humana permanece pendente como evidencia auxiliar;
- nao existe V2.1 implementada ou aprovada;
- a decisao futura devera reabrir somente com nova evidencia legitimamente coletada e novo protocolo, se necessario.

## Implementacao

Criados ou alterados:

- `backend/experiments/routine-intelligence/technical-decision-protocol-v1.json`;
- `backend/experiments/routine-intelligence/technical-hypotheses-v1.json`;
- `backend/reports/routine-intelligence/prospective/technical-decision-v1.json`;
- `backend/src/domain/routine-intelligence-technical-decision.js`;
- `backend/scripts/decide-routine-intelligence.js`;
- `backend/test/routine-intelligence-technical-decision.test.js`;
- `backend/package.json`, com `decide:rotina:intelligence`;
- este checkpoint.

O decisor possui dois fluxos seguros: ausencia de respostas, que gera estado pendente sem agregacao, e submissao humana completa, que exige congelamento, hash do arquivo e verificacao do compromisso antes da agregacao. Submissoes incompletas permanecem auditaveis, mas nao sao tratadas como evidencia humana.

## Verificacoes

- testes focados do decisor: `12/12` aprovados em tres execucoes;
- suite backend: `286/286` testes aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- decisor `--write`: aprovado nos artefatos novos;
- decisor `--check`: igualdade canonica aprovada;
- gerador cego `--check`: aprovado;
- simulacao longitudinal de desenvolvimento e validacao em `--check`: aprovadas, sem escrita;
- avaliacao longitudinal em `--check`: aprovada;
- auditorias de guardrails, cenarios e particoes: aprovadas;
- `git diff --check`: aprovado.

Nenhum modelo foi executado neste marco. Nenhum relatorio de qualidade foi regenerado. Nenhuma reserva foi acessada.

## Integridade preservada e limitacoes

Os hashes dos modelos, snapshots, relatorios brutos, metricas, comparacao, guardrails, pacote cego e chave permaneceram validos. Controle, V1, V2 e utilidade das personas nao foram alterados.

A decisao usa dados sinteticos e offline. A amostra cega e intencional, nao representa clientes reais e nao fornece significancia comercial. A ausencia de revisor impede qualquer afirmacao humana, mas nao invalida a decisao conservadora de nao ajustar a V2.

Nenhuma operacao remota, Supabase, banco, migration, pagamento, e-mail, deploy, commit ou push ocorreu neste marco.

## Preparado para 03 e 04/10

`PREPARADO`:

- fixtures gerais para investigar as quatro hipoteses sem alterar a V2;
- comparador de regressao contra controle e V1;
- checklist de preservacao dos guardrails;
- manifesto de congelamento da V2 atual;
- plano de integracao com fallback para 06/10.

Nao foi implementada V2.1, nao foram executados novos cenarios de qualidade e nao foi aberta a reserva.

## Entrada de 05/10

Congelar e testar a V2 atual sem ajuste, mantendo a decisao `MANTER_V2_SEM_AJUSTE`, ou implementar somente uma hipotese que venha a ser legitimamente aceita por novo protocolo antes do congelamento. Nenhuma alteracao pode ser guiada por placar conhecido ou pela reserva.
