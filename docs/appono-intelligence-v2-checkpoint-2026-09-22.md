# Checkpoint da Appono Intelligence V2 - 22/09/2026

## Decisao do dia

`BASELINE_CONGELADO`

O protocolo experimental foi vinculado ao codigo, aos conjuntos e aos relatorios por hashes SHA-256. Desenvolvimento e validacao foram reproduzidos localmente. O rollout publico permanece em zero.

Este checkpoint nao aprova a V2 para clientes e nao substitui os marcos posteriores. Ele registra a referencia contra a qual qualquer mudanca futura devera ser comparada.

## Objetivo

Congelar o baseline e o protocolo usados no ciclo de entrega ate 10/10/2026, sem recalibrar controle, V1 ou V2 e sem reexecutar o conjunto de reserva.

## Estado do codigo

- branch: `main`;
- `HEAD`: `4d4b81fc98dad9d2f7b2fa9555c9507d96127af2`;
- arvore de trabalho: suja, contendo o ciclo de inteligencia ainda nao commitado;
- hash do diff rastreado antes do fechamento: `ae53995a314b7570d6233f944557b4cf64d38d1a`;
- Node.js: `v24.14.0`;
- npm: `11.9.0`.

Dependencias resolvidas relevantes para este ciclo:

- `@supabase/supabase-js@2.111.0`;
- `express@5.2.1`;
- `dotenv@17.4.2`;
- `next@16.3.0`;
- `react@19.2.4` e `react-dom@19.2.4`;
- `eslint@9.39.4`;
- Supabase CLI `2.117.0`.

As dependencias opcionais Linux ausentes no Windows nao impediram lint, testes ou builds.

Como o trabalho ainda nao esta em um commit, o manifesto registra hashes individuais dos arquivos de dominio que produziram o baseline. O teste `routine-experiment-manifest.test.js` recalcula esses hashes e falha se o codigo ou os artefatos congelados mudarem.

## Modelos e protocolo

- protocolo: `appono-intelligence-longitudinal-v1`;
- controle: `deterministico-v3`;
- referencia historica: `appono-intelligence-v1`;
- desafiante: `appono-intelligence-v2`;
- regua independente: `persona-utility-v1`;
- personas: 10;
- periodo: 6 semanas por persona;
- decisoes: 300 por modelo e conjunto.

Hashes dos modelos e da infraestrutura principal:

| Arquivo | SHA-256 |
| --- | --- |
| `routine-scoring.js` | `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18` |
| `routine-intelligence.js` | `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b` |
| `routine-intelligence-v2.js` | `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4` |
| `routine-intelligence-simulation.js` | `44021e591056a42694897eb739975f2c2e429f85e71f96c7b2c4c6d040e76dd1` |
| `routine-intelligence-policy.js` | `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69` |
| `routine-experiment-manifest.js` | `8ca02cc726d530761666231e78085645c402722f4009b7b5e3f7215277ce6fd7` |
| `simulate-routine-intelligence.js` | `9a2615a463f03640381a897b56b4701787969fd1905ecac129d3dbbe8d81485d` |
| `evaluate-routine-intelligence.js` | `2cbd2c84fa9a50cdfdc0b3213b252fa80c67badde47be21052e1ada4f7382532` |

Nenhuma formula desses modelos foi alterada no fechamento do baseline.

## Inventario de migrations relacionadas

| Migration | Finalidade no fluxo da Rotina |
| --- | --- |
| `20260912000200_create_appono_routine.sql` | Estrutura inicial de perfis, preferencias, restricoes, planejamentos, refeicoes e historico. |
| `20260913220856_routine_transaction_integrity.sql` | Integridade transacional, locks, versoes e conversoes atomicas. |
| `20260914212206_appono_routine_calendar_connections.sql` | Conexoes OAuth e janelas ocupadas da agenda. |
| `20260914214302_routine_food_safety.sql` | Alergenos, ingredientes e seguranca alimentar como limites eliminatorios. |
| `20260915201021_routine_feedback.sql` | Feedback elegivel, consentimento individual e exclusao controlada. |
| `20260915205452_routine_meal_windows_and_geocoding.sql` | Multiplas janelas alimentares e endereco geocodificado. |
| `20260920191137_routine_google_calendar_planning_events.sql` | Vinculo idempotente entre refeicoes planejadas e eventos do Google Calendar. |
| `20260920210706_routine_intelligence_shadow_evaluation.sql` | Comparacoes privadas entre controle e desafiantes. |
| `20260920220421_routine_intelligence_v2_metrics.sql` | Metricas, diagnostico agregado e falha segura da V2. |
| `20260921204635_routine_behavioral_consent_and_signals.sql` | Consentimento comportamental reversivel e sinais privados idempotentes. |

Nenhuma migration foi alterada ou aplicada durante o fechamento de 22/09.

## Conjuntos congelados

| Conjunto | Semente | Referencia UTC | Catalogo | Personas | Estado |
| --- | ---: | --- | --- | --- | --- |
| desenvolvimento | `22092026` | `2026-01-05T12:00:00Z` | `9fffd3771e427b17be186d010b58ed663ed892f6706b3c4b5213dc0272e45732` | `2e611a58c4663fc20c5f8a255b6d487e9017efbe56a1a311782e48d78f6fa840` | `FROZEN` |
| validacao | `23112026` | `2026-03-02T12:00:00Z` | `a6a330142241e43116302d9b6900096dab0835498b131401446c2be314bd5995` | `2e611a58c4663fc20c5f8a255b6d487e9017efbe56a1a311782e48d78f6fa840` | `FROZEN` |
| reserva | `10102026` | `2026-05-04T12:00:00Z` | `58fc7a3cfa522b5ee1a55803e2e38540e04be6f329742240170362d3b953da91` | `2e611a58c4663fc20c5f8a255b6d487e9017efbe56a1a311782e48d78f6fa840` | `OPENED_ONCE` |

## Baseline sombra anterior

O baseline comportamental anterior e separado da simulacao longitudinal:

- 100 sinais sinteticos coletados pelas rotas reais em contas DEMO;
- 32 aprovacoes, 34 recusas e 34 alternativas;
- 42 comparacoes por modelo no teste posterior a coleta;
- V2: 6 vitorias, 8 derrotas e 28 empates tecnicos contra o controle;
- V1: 2 vitorias, 8 derrotas e 32 empates tecnicos;
- decisao historica: `MANTER_EM_SOMBRA`.

Esse teste valida coleta, consentimento e consumo tecnico dos sinais. Ele nao representa 100 experiencias gastronomicas reais.

O teste ainda anterior, sem historico, possuia 50 comparacoes: V1 com 26 concordancias, 24 divergencias e confianca media de `0,35`; V2 com 50 concordancias, confianca e ajuste iguais a zero.

## Baseline longitudinal

| Conjunto | Desacordos controle/V2 | Controle | V1 | V2 | Maior regressao V2/controle | Violacoes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| desenvolvimento | 120 | `7,1055` | `4,4107` | `3,6306` | `1,7788` | 0 |
| validacao | 111 | `6,9761` | `4,1785` | `3,4688` | `1,7789` | 0 |
| reserva | 134 | `7,4095` | `4,4114` | `3,6729` | `1,7666` | 0 |

Os valores dos tres modelos sao arrependimentos medios; menor e melhor dentro da regua sintetica. A maior concentracao observada por conjunto foi:

- desenvolvimento: controle 28, V1 30, V2 30;
- validacao: controle 30, V1 30, V2 30;
- reserva: controle 28, V1 30, V2 30.

Esses resultados sao evidencia offline sintetica, nao eficacia comprovada com clientes.

## Situacao da reserva

O arquivo `reserva.json` ja existia e a documentacao anterior confirma que o conjunto foi executado uma vez antes deste checkpoint. Isso viola a ordem ideal do calendario, que previa abrir a reserva apenas no fechamento da candidata.

Tratamento adotado:

- a reserva nao foi executada novamente em 22/09;
- o estado foi registrado como `OPENED_ONCE`;
- seu hash foi congelado em `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185`;
- seu resultado nao pode orientar recalibracao da V2 ou de uma V2.1;
- qualquer avaliacao futura deve declarar essa contaminacao metodologica;
- nao sera criado um novo conjunto de reserva silenciosamente para substituir o resultado conhecido.

## Reprodutibilidade

O conjunto de desenvolvimento foi gerado duas vezes com os mesmos parametros. As duas execucoes produziram:

- 10 personas;
- 6 semanas;
- 300 decisoes por modelo;
- 120 desacordos controle/V2;
- zero violacoes eliminatorias;
- SHA-256 identico: `b296cf34ccea3ddb00315589472a00ddb5e2ee79ad9b503f0c0f5ada04921dfd`.

Validacao foi gerada novamente e manteve:

- relatorio: `44052c96b7bc6331d15bd0226c19b8b87fe726559c0ccba71097194cbf44ab9f`;
- pacote cego: `cf45bf490bbae41928780d92bd26f7fc4a69a7e74f934f372ffc20fc423e3719`;
- 111 casos cegos pendentes de revisao humana.

O simulador e o avaliador agora recusam protocolo, semente, referencia, duracao, catalogo ou personas incompativeis com o manifesto.

## Criterios congelados

- zero violacoes eliminatorias;
- determinismo em 100% das repeticoes;
- neutralidade sem historico elegivel;
- V2 restrita aos candidatos elegiveis do controle;
- falha da V2 nao bloqueia o planejamento;
- arrependimento da V2 nao pior que V1;
- arrependimento medio da V2 nao pior que controle;
- regressao maxima por persona: `2,0`;
- margem de regressao de preferencia explicita: `0`;
- concentracao nao pior que V1;
- confianca minima interna: `0,25`;
- consentimento ativo obrigatorio;
- fallback para erro, baixa confianca ou ausencia de historico;
- rollout publico: `0`.

## Guardrails e privacidade

Os testes focados confirmaram:

- controle por padrao e diante do kill switch;
- allowlist somente com consentimento;
- bucket de rollout estavel;
- rollout zero nunca ativa V2;
- V2 somente decide com historico, confianca suficiente e modelo saudavel;
- diagnostico administrativo nao revela allowlist nem sal;
- grupo sem historico permanece neutro;
- pacote cego nao revela modelo, utilidade ou confianca.

A busca por nomes de campos sensiveis nos quatro relatorios nao encontrou e-mail, telefone, endereco, coordenada, alergia, JWT, token ou `service_role`.

## Comandos executados

```text
node --test test/routine-experiment-manifest.test.js test/routine-intelligence-simulation.test.js test/routine-intelligence-policy.test.js
npm run simulate:rotina:intelligence --workspace backend -- --dataset=desenvolvimento
npm run simulate:rotina:intelligence --workspace backend -- --dataset=desenvolvimento
npm run evaluate:rotina:intelligence --workspace backend -- --dataset=desenvolvimento
npm run simulate:rotina:intelligence --workspace backend -- --dataset=validacao
npm run evaluate:rotina:intelligence --workspace backend -- --dataset=validacao
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

O avaliador leu o relatorio de reserva existente para inventario, mas o simulador de reserva nao foi executado.

Resultados finais:

- backend: 154 testes aprovados, nenhuma falha;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com 49 rotas;
- `git diff --check`: aprovado; somente avisos preexistentes de futura normalizacao LF/CRLF;
- testes focados de manifesto, simulacao e politica: 13 aprovados no total, nenhuma falha.

## Inconsistencias encontradas

1. O manifesto original nao possuia schema, runtime, hashes, relogios, comandos, criterios completos ou situacao da reserva.
2. O avaliador aceitava relatorios sem conferir sua compatibilidade com o protocolo congelado.
3. A reserva foi aberta antes da data planejada no calendario.
4. O avaliador automatico usa a decisao `IA_PRONTA_EM_HOMOLOGACAO`, mas essa classificacao nao e a decisao deste marco. Em 22/09, a decisao permitida e somente `BASELINE_CONGELADO`.

As duas primeiras lacunas foram corrigidas sem modificar formulas. A terceira foi preservada e documentada. A quarta permanece como saida tecnica do avaliador e nao deve ser confundida com aprovacao final do ciclo.

## Estado operacional

- feature flag ativa por padrao: nao;
- rollout publico: `0`;
- allowlist interna: suportada, sem valores registrados no manifesto;
- kill switch: suportado;
- smoke remoto: nao executado;
- migration remota: nao executada;
- commit, push ou deploy: nao executados.

## Entrada para 23/09

O proximo marco e revisar e validar a modelagem das dez personas coerentes. O trabalho deve partir deste manifesto, sem alterar sementes ou abrir novamente a reserva. Cada persona deve ter utilidade independente, preferencias, aversoes, tolerancia a repeticao, comportamento esperado e casos simples de verificacao.
