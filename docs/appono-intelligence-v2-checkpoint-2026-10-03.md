# Checkpoint da Appono.AI - 03/10/2026

## Decisao

Decisao do marco: `RESERVA_TECNICA_CONCLUIDA_COM_CORRECOES`

Data planejada: `03/10/2026`. Execucao antecipada: `23/09/2026`, no fuso `America/Sao_Paulo`.

O Dia 02 permanece encerrado com `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE` e decisao substantiva `MANTER_V2_SEM_AJUSTE`. Nenhuma resposta humana foi inventada ou agregada.

## Integridade inicial

- branch: `main`;
- `HEAD` inicial: `4d8600b` (`Conclusao do pacote de revisao humana cega da Appono.AI`);
- alteracoes dos Dias 02 e 03 foram preservadas;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`;
- modelos executados neste marco em modo de escrita: `0`;
- placares novos produzidos: `0`.

## Auditoria e resultado

Os checks somente leitura confirmaram:

- decisor tecnico: `MANTER_V2_SEM_AJUSTE`, `REVISAO_HUMANA_PENDENTE`;
- pacote cego: 24 casos, respostas preenchidas `0`;
- desenvolvimento: 300 cenarios, 900 execucoes, hash `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`;
- validacao: 300 cenarios, 900 execucoes, hash `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`;
- metricas: `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3` e `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa`;
- comparacao: `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a`;
- guardrails: 53 regressoes classificadas, 24 candidatos cegos, zero modelos executados;
- auditoria de cenarios: 300 desenvolvimento, 300 validacao, intersecao zero;
- auditoria de particoes: isolamento confirmado.

Nenhum defeito geral de formula, elegibilidade, estado, consentimento, causalidade ou reserva foi encontrado. O teste focado do decisor foi inicialmente chamado a partir da raiz e falhou por caminho relativo; a suite correta do workspace passou com `286/286`.

## Artefatos preparados

- `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json` em estado `PREPARED_FOR_FREEZE`;
- `docs/appono-intelligence-v2-integracao-preparacao-2026-10-03.md`;
- este checkpoint.

O manifesto de congelamento registra hashes e contratos, mas ainda nao congela a candidata. O documento de integracao prepara 06/10, mas nao cria rota, migration, flag ativa ou persistencia nova.

## Formula e guardrails

Hashes preservados:

- scoring: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- controle: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- contrato longitudinal: `f4194266319ad080648b7bb82e4a03b57ee0edbae0833837c6ecc1a4a4d18e1a`;
- guardrails: `f205b05666b8607f69f2fe1136dc777d70791d16ca8c9377377c1c02038f9eeb`.

Nenhum peso, limite, decaimento, suavizacao, desempate ou limiar foi alterado. Nenhuma V2.1 foi implementada.

## Verificacoes

- suite backend: `286/286` aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- decisor `--check`: aprovado;
- pacote cego `--check`: aprovado;
- simulacao longitudinal de desenvolvimento e validacao `--check`: aprovadas;
- avaliacao longitudinal `--check`: aprovada;
- auditoria de guardrails: aprovada;
- auditorias de cenarios e particoes: aprovadas;
- `git diff --check`: aprovado.

O teste focado correto do Dia 02 e `node --test backend/test/routine-intelligence-technical-decision.test.js` a partir da raiz, ou `node --test test/routine-intelligence-technical-decision.test.js` dentro de `backend`; ele passou como parte da suite.

## Preparado para 05 e 06/10

`PREPARADO` para 05/10:

- manifesto de congelamento da V2 atual;
- auditoria final de hashes;
- matriz de regressao e preservacao de guardrails;
- checklist de congelamento.

`PREPARADO` para 06/10:

- matriz de entrada operacional;
- fallback por flag, allowlist, baixa confianca, erro e kill switch;
- persistencia de diagnostico seguro;
- testes de integracao previstos sem execucao antecipada.

Continuam abertos: congelamento formal da candidata, integracao real, homologacao interna, eventual recebimento de respostas humanas e execucao autorizada da reserva em 07/10.

## Garantias negativas

- nenhum modelo foi executado em modo de escrita;
- nenhum novo placar foi produzido;
- nenhuma reserva foi aberta, lida ou reconstruida;
- nenhuma resposta humana foi fabricada;
- nenhuma formula foi recalibrada;
- nenhuma operacao remota ocorreu;
- rollout publico permanece zero.

## Entrada exata do proximo marco

Em 05/10, congelar formalmente a V2 atual sem ajuste, validar seus hashes e executar a bateria final de regressao. Somente depois disso preparar a integracao operacional de 06/10, preservando o fallback, os guardrails, a revisao humana pendente e o rollout publico zero.
