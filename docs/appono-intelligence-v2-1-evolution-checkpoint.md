# Checkpoint da evolucao V2.1 da Appono.AI

## Decisao

`V2_1_INSUFFICIENTE_AGUARDAR_DADOS`

Execucao em `23/09/2026`, fuso `America/Sao_Paulo`, no branch `main`, HEAD inicial `2386476afd0dd47d694b62c3ce7be9c5298e2b66`.

A decisao substantiva e manter `appono-intelligence-v2` sem ajuste. Nenhuma implementacao comportamental de `appono-intelligence-v2-1` foi criada, porque nenhuma hipotese geral satisfaz os gates de mecanismo confirmado, evidencia independente e dados suficientes.

## Integridade preservada

- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- controle deterministico: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- V1: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- guardrails: `f205b05666b8607f69f2fe1136dc777d70791d16ca8c9377377c1c02038f9eeb`;
- contrato longitudinal: `ea66691754eeaa39625c32682397c46f418e9aa4fd0ff13509210f02e78c649f`;
- manifesto FROZEN: `a5512c565b3dcf4802517f85bfab94b59d45af77ac6c5fc78f9c21de60bce12f`;
- relatorio FROZEN: `76d6a6df215c66aee8426aa12609a40932f865ef5a6eea660c2f1dfc448e63aa`;
- decisao tecnica anterior: `b667219faede2f1ca271459c32e993f24e4adb812ac1df46642076d0c2488748`.

Nenhum snapshot, relatorio congelado, pacote cego, chave, formula, peso, limite, decaimento, suavizacao ou desempate foi alterado.

## Protocolo pre-registrado

Arquivo: `backend/experiments/routine-intelligence/v2-1-evolution-protocol-v1.json`

Hash canonico: `00bdf44da2a98996d633039eeebecd18cc3109f09d5d838db39ea8ec2359b68a`

O protocolo exige que a nova candidata supere `deterministico-v3`, nao seja pior que `appono-intelligence-v1`, preserve todos os guardrails e permaneça sem rollout publico por padrao. O criterio foi registrado antes de qualquer implementacao da V2.1 ou abertura de dados humanos.

## Dados reais e revisao humana

- respostas humanas validas: `0`;
- estado: `REVISAO_HUMANA_PENDENTE`;
- arquivo de respostas submetidas: ausente;
- dados reais consentidos: ausentes (`DADOS_REAIS_AUSENTES`);
- clientes reais usados como evidencia ou treinamento: `false`;
- anonimização de dados reais: nao aplicavel;
- reserva historica: nao usada;
- reserva prospectiva: nao aberta neste marco;
- `reserve_accessed`: `false`.

Nenhuma resposta, usuario, evento ou feedback foi inventado. Fixtures sinteticas continuam permitidas apenas para contratos e falhas, nunca como evidencia humana ou uso real.

## Hipoteses avaliadas

Arquivo: `backend/experiments/routine-intelligence/v2-1-evolution-hypotheses-v1.json`

Hash canonico: `c7cf0dc93ff46b7694c16fbc61f34c77964f53ff030c7997c03e40cc7be43f6e`

- `confidence_is_not_quality_calibration`: `INSUFFICIENT_EVIDENCE`;
- `explicit_preference_requires_broader_precedence`: `DEFERRED_HUMAN_REVIEW`;
- `distance_tradeoff_requires_recalibration`: `INSUFFICIENT_EVIDENCE`;
- `gradual_change_transition_requires_new_formula`: `INSUFFICIENT_EVIDENCE`;
- hipoteses aceitas: `0`;
- hipoteses rejeitadas: `0`;
- hipoteses adiadas: `1`;
- hipoteses insuficientes: `3`.

As hipoteses foram mantidas como registros de investigacao. Nenhuma recebeu peso, limiar, desempate ou formula nova.

## Evidencia automatizada

Os artefatos congelados mostram:

- V2 supera o controle: delta de arrependimento `-0.446854`;
- V2 nao atende ao criterio contra V1: delta `+0.662126`;
- violacoes eliminatorias: `0`;
- dados sinteticos e offline: `true`;
- revisao humana auxiliar: pendente;
- recalibracao posterior: `false`.

Guardrails aprovados demonstram seguranca estrutural. Eles nao transformam a V2 em superioridade de qualidade nem autorizam V2.1.

## Decisao e consequencias

Arquivo: `backend/reports/routine-intelligence/prospective/v2-1-evolution-decision-v1.json`

Hash canonico: `fe493d7aae08aa5cf8d887822c9e75e9a295768051eccc8fa9b6b5e8b67c5c82`

Consequencias:

- manter a V2 congelada como baseline;
- manter `deterministico-v3` como controle e fallback;
- nao implementar ou ativar V2.1 neste marco;
- nao abrir nova reserva;
- preparar nova coleta consentida e revisao cega somente com protocolo aprovado;
- manter rollout publico em `0`.

## Verificacao executada

- `npm.cmd test --workspace backend`: `291/291` aprovados;
- build backend: `PASS`;
- lint frontend: `PASS`;
- build frontend: `PASS`;
- `git diff --check`: `PASS`;
- testes focados de politica, operacao, guardrails, decisao e recomendacao: aprovados em `3/3` execucoes;
- decisao tecnica `--check`: `PASS`, sem escrita e sem modelos executados;
- pacote cego `--check`: `PASS`, respostas `0`, sem escrita;
- reserva `--check`: `PASS`, `private_material_read: false`, `reserve_reexecuted: false`;
- auditoria de guardrails: `PASS`, sem escrita;
- auditoria de cenarios: `PASS`, particoes isoladas;
- auditoria de particoes: `PASS`, sem sobreposicao;
- hashes canonicos dos tres novos artefatos: `PASS`.

## Arquivos criados ou alterados

- `backend/experiments/routine-intelligence/v2-1-evolution-protocol-v1.json`;
- `backend/experiments/routine-intelligence/v2-1-evolution-hypotheses-v1.json`;
- `backend/reports/routine-intelligence/prospective/v2-1-evolution-decision-v1.json`;
- `backend/test/routine-intelligence-v2-1-evolution.test.js`;
- `docs/appono-intelligence-v2-1-evolution-checkpoint.md`.

O prompt de evolucao permaneceu preservado. Nenhuma operacao remota, commit, push, deploy ou migration foi executada.

## Proximo marco permitido

Antes de qualquer implementacao comportamental, obter dados reais consentidos ou revisao humana valida, definir uma fixture geral independente e registrar um novo protocolo de experimento. Ate la, a V2 permanece em homologacao controlada e o rollout publico permanece zero.
