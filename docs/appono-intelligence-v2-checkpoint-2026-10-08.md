# Checkpoint da Appono.AI - 08/10/2026

## Decisao

`HOMOLOGACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`

Execucao antecipada em `23/09/2026`, fuso `America/Sao_Paulo`. A integracao controlada existente foi verificada para homologacao interna local, com allowlist, candidata congelada, fallback deterministico, consentimento, kill switch e rollout publico zero.

Esta conclusao nao representa piloto publico, validacao comercial, superioridade da V2, release ou `V2_1_IMPLEMENTADA`.

## Pre-condicoes e escopo

- Dia 07: `VALIDACAO_RESERVA_CONCLUIDA`;
- candidata: `appono-intelligence-v2`, estado `FROZEN`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: executada uma unica vez no Dia 07, sem nova abertura neste marco;
- respostas humanas: `0`;
- rollout publico: `0`;
- nenhuma operacao remota foi executada;
- nenhuma formula, peso, limiar ou desempate foi alterado.

## Arquitetura verificada

O fluxo de planejamento usa a politica existente e o gate `candidataCongeladaDisponivel()`. A V2 somente pode ser selecionada quando o manifesto e o relatorio locais estao `FROZEN`, os hashes correspondem e o rollout do manifesto permanece zero. Fora da allowlist interna, com flag desativada, sem consentimento, com kill switch ou com baixa confianca, o controle `deterministico-v3` permanece efetivo.

O diagnostico operacional usa somente campos allowlist-only: fonte da decisao, versao tecnica, politica, fallback, codigo tecnico, buckets, guardrails e request id tecnico. Scores, ajustes, sinais individuais e PII nao sao retornados.

## Verificacoes de seguranca

- allowlist interna: suportada e limitada;
- flag publica: desligada por padrao;
- `public_rollout_percent`: `0`;
- kill switch: prioritario sobre a ativacao;
- baixa confianca abaixo de `0.25`: fallback para controle;
- erro da V2: fallback isolado;
- manifesto divergente ou nao `FROZEN`: controle;
- filtros de elegibilidade: anteriores a personalizacao;
- consentimento e revogacao: exigidos;
- sinais futuros, inativos e duplicados: rejeitados ou ignorados;
- estado longitudinal: isolado por usuario, persona e versao;
- idempotencia e concorrencia: cobertas pelas rotas e dominio existentes;
- dominio puro: sem banco, HTTP, reserva, pagamento ou e-mail.

## Ressalva registrada

Uma execucao anterior do comando `execute:rotina:reserve --check` ainda reconstruia a reserva em memoria e leu o material privado, sem escrever ou alterar artefatos. Isso foi identificado como defeito do verificador, nao como ativacao operacional. O comando foi corrigido para validar somente os cinco artefatos ja existentes, sem ler material privado e sem reexecutar a reserva. Nenhuma nova execucao da reserva foi feita depois da correcao.

Por essa razao, a decisao usa `COM_RESSALVAS`. A homologacao remota ou de conta interna real permanece fora do escopo e requer autorizacao separada.

## Testes e comandos

- testes focados de politica, operacao e recomendacao: `38/38` aprovados;
- testes focados anteriores do fluxo: aprovados tres vezes;
- backend: `290/290` aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- `git diff --check`: aprovado;
- decisao tecnica `--check`: aprovada, respostas `0`, reserva `false`, rollout `0`;
- pacote cego `--check`: 24 casos, respostas `0`, reserva `false`;
- reserva `--check` corrigido: `private_material_read: false`, `reserve_reexecuted: false`;
- guardrails: 53 regressoes e 24 candidatos, hashes preservados;
- cenarios e particoes: isolados, sem sobreposicao, hashes preservados.

## Integridade preservada

- manifesto congelado canonico: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- relatorio de congelamento canonico: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- guardrails: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`.

## Arquivos criados ou alterados

- `backend/src/domain/routine-intelligence-reserve.js`;
- `backend/scripts/run-routine-intelligence-reserve.js`;
- este checkpoint;
- nenhuma formula ou artefato congelado foi alterado.

## Proximo marco

Preparado para 09 e 10/10: smoke test interno, monitoramento de fallback e demonstracao sem dados reais. Entrada exata: `executar smoke test e monitoramento interno, mantendo allowlist, fallback, kill switch e rollout publico zero`.
