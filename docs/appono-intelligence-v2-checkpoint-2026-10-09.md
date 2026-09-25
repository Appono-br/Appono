# Checkpoint da Appono.AI - 09/10/2026

## Decisao

`VERIFICACAO_FINAL_CONCLUIDA_COM_RESSALVAS`

Execucao antecipada em `23/09/2026`, fuso `America/Sao_Paulo`. A verificacao ponta a ponta local foi concluida com a V2 congelada, allowlist interna, fallback deterministico, consentimento, kill switch, diagnostico seguro e rollout publico zero.

A ressalva herdada do Dia 08 permanece documentada: uma versao anterior do `--check` da reserva lia material privado e reconstruia a reserva em memoria; o verificador foi corrigido, nao houve nova execucao da reserva e o `--check` atual e somente leitura dos artefatos existentes.

Esta decisao nao significa validacao comercial, piloto publico, release, superioridade da V2 ou `V2_1_IMPLEMENTADA`.

## Integridade e pre-condicoes

- HEAD inicial: `f57a064`;
- branch: `main`;
- candidata: `appono-intelligence-v2`, estado `FROZEN`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- Dia 08: `HOMOLOGACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`;
- respostas humanas validas: `0`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: executada uma unica vez no Dia 07, sem novo acesso neste marco;
- rollout publico: `0`;
- nenhum snapshot, metrica, pacote cego, relatorio congelado ou formula foi alterado.

Hashes preservados:

- manifesto congelado: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- relatorio de congelamento: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- guardrails: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`.

## Matriz de ativacao verificada

- manifesto ausente, divergente ou nao `FROZEN`: controle;
- flag publica desligada: controle fora da allowlist;
- identidade fora da allowlist: controle;
- kill switch: controle;
- consentimento ausente ou revogado: controle sem personalizacao;
- sinal futuro, inativo ou duplicado: ignorado;
- confianca abaixo de `0.25`: controle;
- erro ou timeout da V2: fallback para controle;
- candidato inelegivel: eliminado antes da personalizacao;
- escolha fora do universo: controle ou erro seguro;
- identidade interna autorizada e candidata valida: V2 congelada pode decidir.

O controle e a V2 recebem o mesmo universo elegivel. O estado permanece isolado por usuario, persona e versao.

## Smoke tests e privacidade

Foram executados fixtures locais para controle, allowlist, flag, kill switch, candidata congelada, fallback, baixa confianca, ausencia de historico, consentimento, sinais temporais, elegibilidade, diagnostico, idempotencia e fluxo de recomendacao.

O diagnostico permanece limitado a fonte, versao, politica, fallback, codigo tecnico, buckets, guardrails e request id. Nao contem score, ajuste, ranking, utilidade, PII, agenda, coordenada, token, segredo ou sinal individual.

## Auditoria da reserva

O comando `execute:rotina:reserve --check` atual reportou:

- `private_material_read: false`;
- `reserve_reexecuted: false`;
- `historical_reserve_used: false`;
- `recalibration: false`;
- `public_rollout_percent: 0`.

Ele somente validou `opening-manifest.json`, `snapshot.json`, `raw-report.json`, `metrics.json` e `summary.json` ja existentes. Nenhuma nova abertura ou execucao ocorreu.

## Verificacao executada

- testes focados: `38/38`, tres execucoes;
- suite backend: `290/290`;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- `git diff --check`: aprovado;
- decisao tecnica `--check`: aprovada, revisao pendente, rollout `0`;
- pacote cego `--check`: 24 casos, respostas `0`;
- guardrails: 53 regressoes e 24 candidatos;
- cenarios: 300 desenvolvimento, 300 validacao, intersecao zero;
- particoes: isoladas, hashes preservados.

## Arquivos e correcoes

- `backend/scripts/run-routine-intelligence-reserve.js`: `--check` nao le material privado;
- `backend/src/domain/routine-intelligence-reserve.js`: validador somente leitura dos artefatos existentes;
- este checkpoint;
- calendario atualizado somente para 09/10.

Nenhuma formula, politica congelada, peso, limiar ou desempate foi alterado.

## Limitacoes e proximo marco

Nao houve conta interna real, acesso remoto, cliente real, resposta humana ou validacao comercial. A demonstracao do Dia 10 deve usar somente fixtures ou ambiente interno autorizado, mantendo allowlist, fallback, kill switch, diagnostico seguro e rollout publico zero.

Entrada exata do proximo marco: `demonstrar a Appono.AI em homologacao interna, com limites, fallback, diagnostico seguro, kill switch e rollout publico zero, sem declarar validacao comercial ou release`.
