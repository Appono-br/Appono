# Checkpoint da Appono.AI - 10/10/2026

## Decisao

`DEMONSTRACAO_INTERNA_CONCLUIDA_COM_RESSALVAS`

Execucao antecipada em `23/09/2026`, fuso `America/Sao_Paulo`. A demonstracao local foi concluida com fixture sintetica, candidata `appono-intelligence-v2` em estado `FROZEN`, allowlist interna, fallback deterministico, kill switch, diagnostico seguro e rollout publico zero.

Esta decisao significa que existe software de recomendacao com IA demonstravel em homologacao interna controlada. Nao significa validacao comercial, superioridade da V2, piloto publico, release, `IA_PRONTA` para clientes ou `V2_1_IMPLEMENTADA`.

## Pre-condicoes preservadas

- Dia 09: `VERIFICACAO_FINAL_CONCLUIDA_COM_RESSALVAS`;
- candidata: `appono-intelligence-v2`, estado `FROZEN`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- controle: `deterministico-v3`;
- revisao humana: `REVISAO_HUMANA_PENDENTE`, respostas validas `0`;
- ressalva herdada do Dia 08: o `--check` da reserva foi corrigido e validado sem leitura de material privado;
- reserva historica: `OPENED_ONCE_CONTAMINATED`, nao usada neste marco;
- reserva prospectiva: executada uma unica vez no Dia 07, nao reaberta nem reexecutada neste marco;
- `public_rollout_percent`: `0`;
- nenhuma operacao remota, migration, deploy, pagamento ou e-mail foi executada.

## Demonstracao reproduzivel

Foi criada a CLI local `demo:rotina:intelligence`. Ela usa somente uma fixture sintetica em memoria, nao persiste dados, nao acessa banco, HTTP, reserva ou relatorios congelados e imprime apenas um resumo agregado seguro.

Comando:

```text
npm.cmd run demo:rotina:intelligence --workspace backend
```

Resultado observado:

- `allowlisted_v2`: `V2`, `appono-intelligence-v2`, `V2_SELECIONADA`, sem fallback;
- `outside_allowlist_control`: `CONTROLE`, `deterministico-v3`, `FEATURE_DESATIVADA`, com fallback;
- `kill_switch_control`: `CONTROLE`, `deterministico-v3`, `KILL_SWITCH`, com fallback;
- `low_confidence_fallback`: `CONTROLE`, `deterministico-v3`, `V2_CONFIANCA_INSUFICIENTE`, com fallback;
- todas as quatro execucoes produziram uma sugestao sintetica;
- replay da mesma entrada produziu o mesmo resultado;
- hash do resumo da demonstracao: `4ae889badaa80d6977300604ee548ee709aec59b768ef44d298e3765a0456fcd`.

## Contratos demonstrados

- a V2 somente foi selecionada para a identidade interna presente na allowlist;
- fora da allowlist, o controle permaneceu efetivo;
- o kill switch prevaleceu sobre a allowlist;
- baixa confianca abaixo do limiar congelado produziu fallback;
- o gate local exigiu manifesto e relatorio `FROZEN` coerentes;
- o planejamento usou candidatos elegiveis antes da personalizacao;
- consentimento e sinais elegiveis permaneceram requisitos do caminho V2;
- diagnostico foi allowlist-only, sem score, ranking completo, PII, agenda, coordenada, token ou sinal individual;
- nenhum fallback foi creditado como escolha nativa da V2;
- a fixture nao usou clientes reais, respostas humanas ou dados reais.

## Verificacao executada

- testes focados de politica, operacao, guardrails e recomendacao: `52/52`, tres execucoes;
- suite backend: `290/290`;
- build backend: `PASS`;
- lint frontend: `PASS`;
- build frontend: `PASS`;
- `git diff --check`: `PASS`;
- decisao tecnica `--check`: `PASS`, `written: false`, `reserve_accessed: false`, rollout `0`;
- pacote cego `--check`: `PASS`, 24 casos, respostas `0`, sem escrita;
- reserva `--check`: `PASS`, `private_material_read: false`, `reserve_reexecuted: false`;
- guardrails `--check`: `PASS`, 53 regressoes, 24 candidatos, sem escrita;
- auditoria de cenarios: `PASS`, conjuntos isolados;
- auditoria de particoes: `PASS`, sem sobreposicao;
- demonstracao CLI: `PASS`, replay deterministico.

## Arquivos criados ou alterados

- `backend/scripts/demo-routine-intelligence-internal.js`;
- `backend/package.json` com o comando local `demo:rotina:intelligence`;
- este checkpoint;
- calendario atualizado somente para 10/10;
- prompt do Dia 10 preservado.

Nenhuma formula, peso, limite, limiar, decaimento, suavizacao, desempate, snapshot, metrica, comparacao, guardrail, pacote cego ou chave foi alterado.

## Integridade e limites

- manifesto congelado: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- relatorio de congelamento: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- guardrails: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- rollout publico: `0`;
- formulas alteradas: `false`;
- modelos executados sobre a reserva neste marco: `0`;
- nova simulacao ou novo placar comparativo: `0`.

Ressalvas: a demonstracao foi local e sintetica; nao houve conta interna real, persistencia operacional real, cliente real, resposta humana ou observacao comercial. A ressalva do verificador da reserva permanece documentada nos checkpoints dos Dias 08 e 09.

## Entrada exata para encerramento

O ciclo de 10/10 pode ser apresentado como uma demonstracao tecnica interna da Appono.AI, com configuracao de rotina, planejamento pela V2 sob allowlist, explicacao segura, fallback deterministico e kill switch. A comunicacao deve declarar explicitamente que a validacao comercial e o rollout publico continuam pendentes.
