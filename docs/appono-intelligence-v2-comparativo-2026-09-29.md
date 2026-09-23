# Comparativo longitudinal da Appono.AI - 29/09/2026

## 1. Escopo e pergunta

Este relatorio compara controle, V1 e V2 pela utilidade externa das personas ao longo de seis semanas. Os resultados sao offline e sinteticos: nao representam validacao por clientes, piloto ou evidencia comercial.

## 2. Fontes e hashes

- Bruto de desenvolvimento: `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`.
- Bruto de validacao: `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`.
- Snapshot de desenvolvimento: `f377be1c9611fc0d1fb07663a134a4e1be4970f7a6a50c6b2cfb81545c3fb975`.
- Snapshot de validacao: `0f666561fc093f8adbe074ee630f8047b8f60fad71a3e34763df5a69ee1dadd0`.
- Personas: `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`.

## 3. Definicoes

- Utilidade: regua externa `persona-utility-v1`, independente do modelo.
- Arrependimento: melhor utilidade elegivel menos utilidade da escolha nativa.
- Reacao positiva: `CONVERSAO_SIMULADA` ou `APROVACAO`, somente no denominador consentido.
- Concentracao: maior participacao e HHI das escolhas por restaurante, produto e categoria.
- Fallback: excluido de escolha nativa e de credito de qualidade.

## 4. Qualidade dos dados

Ambos os conjuntos possuem 900 registros, 300 por modelo, 100% de juncao com os snapshots, zero duplicata, zero escolha inelegivel, zero falha, zero fallback e zero arrependimento negativo. Os hashes comuns e os conjuntos de candidatos coincidem entre modelos em cada cenario.

## 5. Desenvolvimento

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Restaurantes distintos | Concentracao maxima | Confianca media |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| deterministico-v3 | 1.081715 | 5.374024 | 0.414815 | 300 | 0.003333 | N/A |
| appono-intelligence-v1 | 2.378288 | 4.515372 | 0.485185 | 300 | 0.003333 | 0.813233 |
| appono-intelligence-v2 | 1.221671 | 5.231996 | 0.422222 | 300 | 0.003333 | 0.19818 |

## 6. Validacao

| Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Restaurantes distintos | Concentracao maxima | Confianca media |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| deterministico-v3 | 1.949626 | 5.372953 | 0.425926 | 300 | 0.003333 | N/A |
| appono-intelligence-v1 | 3.466295 | 4.263973 | 0.5 | 300 | 0.003333 | 0.813733 |
| appono-intelligence-v2 | 2.491734 | 4.926099 | 0.462963 | 300 | 0.003333 | 0.198063 |

## 7. Tabela global por modelo

As tabelas de desenvolvimento e validacao acima usam denominadores separados. Validacao e a fonte primaria de aceitacao.

## 8. Validacao por persona

| Persona | Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Categorias distintas | Cobertura explicita | Confianca media |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| avesso_repeticao | appono-intelligence-v1 | -1.36033 | 3.442875 | 0.4 | 7 | 0.7 | 0.866667 |
| avesso_repeticao | appono-intelligence-v2 | -0.926552 | 2.471812 | 0.5 | 8 | 0.633333 | 0.196367 |
| avesso_repeticao | deterministico-v3 | -1.36033 | 3.442875 | 0.4 | 7 | 0.7 | N/A |
| contraditorio | appono-intelligence-v1 | 5.256554 | 2.42034 | 0.533333 | 6 | 0.8 | 0.866667 |
| contraditorio | appono-intelligence-v2 | 5.262122 | 2.861399 | 0.533333 | 7 | 0.766667 | 0.184767 |
| contraditorio | deterministico-v3 | 4.219244 | 3.506671 | 0.5 | 7 | 0.733333 | N/A |
| controle_sem_historico | appono-intelligence-v1 | 0.514016 | 2.347479 | null | 8 | 0.533333 | 0.35 |
| controle_sem_historico | appono-intelligence-v2 | 0.514016 | 2.347479 | null | 8 | 0.533333 | 0 |
| controle_sem_historico | deterministico-v3 | 0.514016 | 2.347479 | null | 8 | 0.533333 | N/A |
| economico | appono-intelligence-v1 | -0.648213 | 4.016195 | 0.466667 | 7 | 0.766667 | 0.866667 |
| economico | appono-intelligence-v2 | -1.26007 | 4.628051 | 0.433333 | 7 | 0.7 | 0.1237 |
| economico | deterministico-v3 | -1.697773 | 4.655134 | 0.4 | 7 | 0.7 | N/A |
| explorador | appono-intelligence-v1 | -1.854667 | 3.242121 | 0.3 | 7 | 0.666667 | 0.859 |
| explorador | appono-intelligence-v2 | -1.541317 | 3.022498 | 0.333333 | 7 | 0.7 | 0.322933 |
| explorador | deterministico-v3 | -2.04976 | 3.507123 | 0.3 | 7 | 0.7 | N/A |
| fiel_prato | appono-intelligence-v1 | 9.158183 | 5.081515 | 0.7 | 7 | 0.7 | 0.866667 |
| fiel_prato | appono-intelligence-v2 | 7.453768 | 6.157837 | 0.633333 | 7 | 0.633333 | 0.144133 |
| fiel_prato | deterministico-v3 | 6.670199 | 6.908281 | 0.6 | 7 | 0.6 | N/A |
| fiel_restaurante | appono-intelligence-v1 | 8.161939 | 5.497978 | 0.666667 | 7 | 0.666667 | 0.866667 |
| fiel_restaurante | appono-intelligence-v2 | 5.420603 | 7.775455 | 0.566667 | 7 | 0.566667 | 0.196567 |
| fiel_restaurante | deterministico-v3 | 3.959391 | 8.50906 | 0.5 | 8 | 0.5 | N/A |
| mudanca_gradual | appono-intelligence-v1 | 0.06436 | 7.026744 | 0.233333 | 8 | N/A | 0.861667 |
| mudanca_gradual | appono-intelligence-v2 | -0.23396 | 7.35958 | 0.233333 | 8 | N/A | 0.4419 |
| mudanca_gradual | deterministico-v3 | -0.23396 | 7.35958 | 0.233333 | 8 | N/A | N/A |
| preferencia_forte | appono-intelligence-v1 | 9.961401 | 4.44565 | 0.7 | 6 | 0.7 | 0.866667 |
| preferencia_forte | appono-intelligence-v2 | 8.050784 | 6.009828 | 0.6 | 7 | 0.6 | 0.092667 |
| preferencia_forte | deterministico-v3 | 6.794738 | 7.195399 | 0.533333 | 7 | 0.533333 | N/A |
| sensivel_distancia | appono-intelligence-v1 | 5.409706 | 5.118833 | 0.5 | 7 | 0.666667 | 0.866667 |
| sensivel_distancia | appono-intelligence-v2 | 2.177942 | 6.627045 | 0.333333 | 7 | 0.533333 | 0.2776 |
| sensivel_distancia | deterministico-v3 | 2.680493 | 6.29793 | 0.366667 | 8 | 0.533333 | N/A |

## 9. Validacao por semana

| Semana | Modelo | Utilidade media | Arrependimento medio | Reacao positiva | Categorias distintas | Confianca media |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 0 | appono-intelligence-v1 | 3.166296 | 2.409286 | 0.644444 | 8 | 0.6746 |
| 0 | appono-intelligence-v2 | 2.878755 | 2.681827 | 0.622222 | 8 | 0.17162 |
| 0 | deterministico-v3 | 2.852897 | 2.707685 | 0.622222 | 8 | N/A |
| 1 | appono-intelligence-v1 | 2.560729 | 3.804973 | 0.444444 | 8 | 0.8278 |
| 1 | appono-intelligence-v2 | 2.293421 | 3.967795 | 0.444444 | 8 | 0.2295 |
| 1 | deterministico-v3 | 1.889691 | 4.381525 | 0.377778 | 8 | N/A |
| 2 | appono-intelligence-v1 | 3.29879 | 4.242588 | 0.444444 | 7 | 0.845 |
| 2 | appono-intelligence-v2 | 2.933726 | 4.509109 | 0.444444 | 7 | 0.1909 |
| 2 | deterministico-v3 | 2.890069 | 4.418237 | 0.444444 | 7 | N/A |
| 3 | appono-intelligence-v1 | 3.127362 | 4.751015 | 0.511111 | 8 | 0.845 |
| 3 | appono-intelligence-v2 | 2.156447 | 5.540901 | 0.466667 | 8 | 0.19364 |
| 3 | deterministico-v3 | 1.490436 | 6.014406 | 0.422222 | 8 | N/A |
| 4 | appono-intelligence-v1 | 3.329778 | 5.486157 | 0.4 | 8 | 0.845 |
| 4 | appono-intelligence-v2 | 2.450217 | 5.794296 | 0.4 | 8 | 0.20148 |
| 4 | deterministico-v3 | 1.628206 | 6.584745 | 0.311111 | 8 | N/A |
| 5 | appono-intelligence-v1 | 5.314814 | 4.889819 | 0.555556 | 8 | 0.845 |
| 5 | appono-intelligence-v2 | 2.237836 | 7.062663 | 0.4 | 8 | 0.20124 |
| 5 | deterministico-v3 | 0.946454 | 8.131122 | 0.377778 | 8 | N/A |

## 10. Comparacoes pareadas de validacao

| Esquerda | Direita | Concordancias | Divergencias | Vitorias esquerda | Vitorias direita | Empates | Excluidos | Delta utilidade |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| deterministico-v3 | appono-intelligence-v1 | 274 | 26 | 13 | 83 | 204 | 0 | -1.516669 |
| deterministico-v3 | appono-intelligence-v2 | 279 | 21 | 14 | 61 | 225 | 0 | -0.542108 |
| appono-intelligence-v1 | appono-intelligence-v2 | 272 | 28 | 63 | 35 | 202 | 0 | 0.974561 |

As comparacoes usam o mesmo cenario e a mesma regua externa, mas nao constituem experimento online randomizado porque as trajetorias podem divergir.

## 11. Diversidade, repeticao e concentracao

Na validacao, a V2 escolheu 300 restaurantes, 300 produtos e 8 categorias. A participacao maxima global de restaurante foi 0.003333; a repeticao consecutiva de restaurante foi 0.

## 12. Preferencias explicitas

A cobertura condicionada da V2 foi 0.62963 na validacao e 0.588889 no desenvolvimento. O denominador inclui somente cenarios com ao menos uma opcao elegivel da categoria explicitamente preferida.

## 13. Confianca e evidencia

A confianca media da V2 foi 0.198063, com 102/300 decisoes em confianca igual ou superior a 0,25. Essas faixas sao diagnosticas e nao demonstram calibracao real.

## 14. Criterios congelados

| Criterio | Estado | Observado |
| --- | --- | --- |
| eliminatory_violations | PASS | 0 |
| deterministic | PASS | true |
| neutral_without_history | PASS | true |
| v2_regret_not_worse_than_v1 | FAIL | 0.662126 |
| v2_regret_not_worse_than_control | PASS | -0.446854 |
| maximum_persona_regret_regression | PASS | 0.329115 |
| explicit_preference_regression_margin | PASS | 0.014815 |
| concentration_not_worse_than_v1 | PASS | {"v2":0.033333,"v1":0.033333} |
| minimum_internal_confidence | INSUFFICIENT_EVIDENCE | {"numerator":102,"denominator":300,"rate":0.34} |
| active_consent_required | PASS | true |
| fallback_on_error_low_confidence_or_no_history | INSUFFICIENT_EVIDENCE | {"failures":0,"fallbacks":0} |

## 15. Regressao maxima

Valores positivos significam maior arrependimento da V2.

| Persona | V2 menos controle | V2 menos V1 |
| --- | ---: | ---: |
| sensivel_distancia | 0.329115 | 1.508212 |
| controle_sem_historico | 0 | 0 |
| mudanca_gradual | 0 | 0.332836 |
| economico | -0.027083 | 0.611856 |
| explorador | -0.484625 | -0.219623 |
| contraditorio | -0.645272 | 0.441059 |
| fiel_restaurante | -0.733605 | 2.277477 |
| fiel_prato | -0.750444 | 1.076322 |
| avesso_repeticao | -0.971063 | -0.971063 |
| preferencia_forte | -1.185571 | 1.564178 |

A pior regressao da V2 contra o controle ocorreu em `sensivel_distancia`, com delta de arrependimento 0.329115. O criterio global contra V1 falhou: a V2 teve arrependimento medio 4.926099, contra 4.263973 da V1.

## 16. Desacordos a investigar

- V1 versus V2: 28 escolhas divergentes na validacao.
- Controle versus V2: 21 escolhas divergentes na validacao.
- Persona prioritaria: `sensivel_distancia`.
- Os casos devem virar testes de guardrail em 30/09; nao justificam recalibracao oportunistica.

## 17. Limitacoes

- Personas, reacoes e conversoes sao sinteticas.
- Confianca interna nao equivale a probabilidade calibrada de satisfacao.
- Restaurantes e produtos das fixtures sao instancias sinteticas com alta cardinalidade.
- A reserva prospectiva permanece selada e nao participou desta analise.

## 18. Conclusao tecnica

As metricas comparativas sao integras e reproduziveis. Na validacao, a V2 supera o controle em utilidade e arrependimento, mas nao supera a V1; portanto, o criterio `v2_regret_not_worse_than_v1` esta reprovado. Este marco nao aprova V2.1, promocao ou homologacao.

## 19. Entrada para 30/09

Transformar as regressoes por persona, perdas de preferencia, baixa evidencia, contradicao e repeticao em testes de guardrail, mantendo formulas e criterios congelados.

## Rastreabilidade

- Metricas: `routine-longitudinal-metrics-v1`.
- Desenvolvimento: `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3`.
- Validacao: `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa`.
- Comparacao: `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a`.
- Reserva prospectiva: nao acessada, estado preservado como `SEALED_UNMATERIALIZED`.
- Rollout publico: 0%.

## Leitura correta

O conjunto de validacao e a referencia primaria para os criterios congelados. Desenvolvimento serve para diagnostico. Confianca e apresentada como diagnostico interno, nao como probabilidade calibrada de satisfacao. Trajetorias podem divergir depois da primeira escolha, portanto os resultados medem politicas longitudinais completas.
