# Checkpoint da Appono.AI - 29/09/2026

## Decisao do dia

`METRICAS_COMPARATIVAS_CONCLUIDAS`

Os dados brutos estavam integros, a juncao com os snapshots atingiu 100%, a agregacao foi reproduzivel e os criterios congelados foram avaliados sem alteracao. A decisao conclui o marco de metricas, nao aprova a V2, V2.1, piloto ou homologacao.

O marco estava planejado para 29/09/2026 e foi executado antecipadamente em 22/09/2026.

## Pre-condicoes e estado inicial

- Dia 28: `SIMULACAO_LONGITUDINAL_CONCLUIDA`;
- branch: `main`;
- `HEAD`: `5e3c7d4a5aa7cd7a0acd584a1613a4cabcc731ef`;
- arvore inicialmente limpa;
- Node.js `v24.14.0` e npm `11.9.0`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: 0%.

## Entradas preservadas

| Artefato | SHA-256 do arquivo | SHA-256 do conteudo |
| --- | --- | --- |
| Bruto de desenvolvimento | `b8033dc6d5b15e40e4ad2acc15897c65c451828953f1112b105a06f382718467` | `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57` |
| Bruto de validacao | `1abfe85103adc84baf76735380eeb6eb7443b99519608c49e7dedc133669ecee` | `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc` |
| Manifesto dos brutos | `7223109f3f804805b6362ad7ef07b270808bd20f4e26d2622bdabc67fae36288` | N/A |
| Snapshot de desenvolvimento | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` | `f377be1c9611fc0d1fb07663a134a4e1be4970f7a6a50c6b2cfb81545c3fb975` |
| Snapshot de validacao | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` | `0f666561fc093f8adbe074ee630f8047b8f60fad71a3e34763df5a69ee1dadd0` |

Personas e particoes mantiveram os hashes canonicos `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474` e `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`.

## Agregador

- versao: `routine-longitudinal-metrics-v1`;
- schema: `routine-longitudinal-metrics-report-v1`;
- arquivo: `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- SHA-256 do arquivo: `d078a6fbaf7b546778153bb2270318c4395b7a6914e4782924e8a21b5acec56e`.

O modulo nao importa controle, V1, V2, banco, HTTP, Supabase, politica de rollout ou relogio real. Ele valida os brutos, junta candidatos aos snapshots, calcula estatisticas e produz hashes canonicos.

## Definicoes e denominadores

- decisao nativa: escolha presente, sem erro tecnico e sem fallback;
- utilidade: `persona-utility-v1`, externa aos modelos;
- arrependimento: melhor utilidade elegivel menos utilidade escolhida;
- reacao positiva: `CONVERSAO_SIMULADA` ou `APROVACAO`;
- denominador reativo: 270 decisoes consentidas por modelo e conjunto;
- cobertura explicita: somente cenarios com opcao elegivel da categoria preferida;
- empate: tolerancia absoluta `1e-9`;
- percentis: interpolacao linear;
- concentracao primaria: maior participacao de restaurante por persona.

Valores ausentes de confianca, volume e consistencia permaneceram `null`; nao foram convertidos em zero.

## Qualidade dos dados

Cada conjunto possui 900 registros, 300 por modelo, 30 por persona e modelo, seis semanas e cinco decisoes semanais. Foram observados:

- cobertura de juncao: 100%;
- chaves duplicadas: 0;
- escolhas inelegiveis: 0;
- hashes comuns divergentes: 0;
- conjuntos de candidatos divergentes: 0;
- utilidades nao finitas: 0;
- arrependimentos negativos: 0;
- falhas: 0;
- fallbacks: 0;
- violacoes eliminatorias: 0.

## Metricas globais

### Desenvolvimento

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Confianca media |
| --- | ---: | ---: | ---: | ---: |
| `deterministico-v3` | 1.081715 | 5.374024 | 0.414815 | N/A |
| `appono-intelligence-v1` | 2.378288 | 4.515372 | 0.485185 | 0.813233 |
| `appono-intelligence-v2` | 1.221671 | 5.231996 | 0.422222 | 0.198180 |

### Validacao

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Confianca media |
| --- | ---: | ---: | ---: | ---: |
| `deterministico-v3` | 1.949626 | 5.372953 | 0.425926 | N/A |
| `appono-intelligence-v1` | 3.466295 | 4.263973 | 0.500000 | 0.813733 |
| `appono-intelligence-v2` | 2.491734 | 4.926099 | 0.462963 | 0.198063 |

Na validacao, a V2 melhorou o arrependimento medio contra o controle em `0.446854`, mas piorou contra a V1 em `0.662126`.

## Resultados por persona

Delta positivo significa maior arrependimento da V2.

| Persona | V2 menos controle | V2 menos V1 |
| --- | ---: | ---: |
| `sensivel_distancia` | 0.329115 | 1.508212 |
| `controle_sem_historico` | 0 | 0 |
| `mudanca_gradual` | 0 | 0.332836 |
| `economico` | -0.027083 | 0.611856 |
| `explorador` | -0.484625 | -0.219623 |
| `contraditorio` | -0.645272 | 0.441059 |
| `fiel_restaurante` | -0.733605 | 2.277477 |
| `fiel_prato` | -0.750444 | 1.076322 |
| `avesso_repeticao` | -0.971063 | -0.971063 |
| `preferencia_forte` | -1.185571 | 1.564178 |

A pior regressao da V2 contra o controle foi `sensivel_distancia`, com `0.329115`, abaixo do limite congelado de `2,0`. Contra a V1, a pior foi `fiel_restaurante`, com `2.277477`.

## Resultados semanais da V2 em validacao

| Semana | Utilidade | Arrependimento | Reacao positiva | Confianca |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 2.878755 | 2.681827 | 0.622222 | 0.171620 |
| 1 | 2.293421 | 3.967795 | 0.444444 | 0.229500 |
| 2 | 2.933726 | 4.509109 | 0.444444 | 0.190900 |
| 3 | 2.156447 | 5.540901 | 0.466667 | 0.193640 |
| 4 | 2.450217 | 5.794296 | 0.400000 | 0.201480 |
| 5 | 2.237836 | 7.062663 | 0.400000 | 0.201240 |

A maior variacao consecutiva de utilidade da V2 foi `0.777279`; o desvio padrao entre semanas foi `0.306343`.

## Comparacoes pareadas de validacao

| Comparacao | Concordancias | Divergencias | Vitorias esquerda | Vitorias direita | Empates | Excluidos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Controle x V1 | 274 | 26 | 13 | 83 | 204 | 0 |
| Controle x V2 | 279 | 21 | 14 | 61 | 225 | 0 |
| V1 x V2 | 272 | 28 | 63 | 35 | 202 | 0 |

## Diversidade, repeticao e preferencias

Na validacao, todos os modelos cobriram oito categorias. A V2 teve concentracao maxima de categoria `0.200000` e HHI `0.142867`; a V1 teve `0.216667` e `0.149378`. A repeticao consecutiva de categoria foi `0.241379` na V2, `0.293103` na V1 e `0.220690` no controle.

A cobertura de preferencia explicita foi:

- controle: `166/270 = 0.614815`;
- V1: `186/270 = 0.688889`;
- V2: `170/270 = 0.629630`.

Restaurantes e produtos possuem alta cardinalidade sintetica: cada escolha usou uma instancia distinta. Por isso, as metricas de categoria sao mais informativas neste conjunto.

## Confianca e evidencia

Na validacao, a V2 apresentou:

- confianca media: `0.198063`;
- decisoes com confianca igual ou superior a 0,25: `102/300`;
- amostras efetivas medias: `15.813333`;
- volume efetivo medio: `13.369080`;
- consistencia media: `0.273120`.

O grupo `controle_sem_historico` manteve confianca, amostras e ajuste iguais a zero. A confianca e diagnostica e nao representa probabilidade calibrada de satisfacao real.

## Criterios congelados

Estados na validacao:

- `PASS`: violacoes eliminatorias, determinismo, neutralidade sem historico, V2 contra controle, regressao maxima por persona, cobertura explicita, concentracao e consentimento;
- `FAIL`: `v2_regret_not_worse_than_v1`;
- `INSUFFICIENT_EVIDENCE`: confianca minima operacional e fallback de producao, pois a execucao foi offline e nao acionou a politica de rollout.

O criterio reprovado nao foi flexibilizado. Desenvolvimento nao substituiu a validacao.

## Arquivos

Criados:

- `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- `backend/scripts/evaluate-routine-intelligence-longitudinal.js`;
- `backend/test/routine-intelligence-longitudinal-metrics.test.js`;
- tres JSONs prospectivos de metricas e comparacao;
- `docs/appono-intelligence-v2-comparativo-2026-09-29.md`;
- este checkpoint.

Alterados:

- `backend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`.

## Saidas e hashes

| Saida | SHA-256 canonico | SHA-256 do arquivo |
| --- | --- | --- |
| Metricas de desenvolvimento | `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3` | `d99a2c72b647f92913a766e8e425942fd7142fa50661e28c41bd57030a4969f9` |
| Metricas de validacao | `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa` | `3adc252c2299e7d75b8aa3054adb2627aa311c7de74d932318307621b5de8c5e` |
| Comparacao | `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a` | `8741b09dc047d68215cf3b0a849c3c4736155f0ba96adc554ed2dfd3d16d1c09` |
| Relatorio Markdown | N/A | `ae425285ae0799a81684d424f556dbecabc5253a6a0982a58791b4b81d4830b2` |

## Verificacoes executadas

- testes focados: 16 aprovados em tres execucoes consecutivas;
- suite backend: 249 aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- simulacoes de desenvolvimento e validacao em `--check`: identicas aos brutos;
- auditorias de cenarios e particoes: aprovadas, intersecao zero;
- avaliador por conjunto e conjunto completo em `--check`: aprovado;
- `git diff --check`: aprovado;
- auditoria estatica dos novos artefatos: nenhum PII, segredo ou material de reserva encontrado.

## Integridade e limites

Os hashes de controle, V1 e V2 continuam, respectivamente:

- `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`.

Nenhuma formula, snapshot ou relatorio bruto foi alterado. Nenhuma reserva foi acessada. Nenhuma operacao remota, commit, push, deploy, pagamento, e-mail ou migration ocorreu. O rollout publico permaneceu em zero.

As conclusoes sao limitadas por personas e reacoes sinteticas. Nao ha validacao comercial nem evidencia de comportamento de clientes reais.

## Preparado para 30/09

Ficam preparados:

- regressao de `sensivel_distancia` contra o controle;
- perdas de V2 contra V1 em `fiel_restaurante`, `preferencia_forte`, `sensivel_distancia` e `fiel_prato`;
- crescimento do arrependimento semanal da V2;
- casos de confianca abaixo de 0,25;
- contradicao, mudanca gradual, repeticao e cobertura explicita por persona;
- comparacoes pareadas por persona para extrair fixtures de regressao.

A entrada exata do proximo marco e transformar essas observacoes em testes de guardrail para preferencia explicita, pouca evidencia, contradicao, revogacao, repeticao e causalidade, sem recalibrar oportunisticamente a V2.
