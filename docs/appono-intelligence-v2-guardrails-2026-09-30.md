# Guardrails da Appono.AI - 30/09/2026

## Escopo

Este marco transforma invariantes de seguranca e as regressoes observadas em 29/09 em contratos executaveis. Guardrail impede comportamento tecnicamente invalido; metrica de qualidade mede desempenho. Um resultado pior da V2 sem quebra de contrato nao foi corrigido nem reclassificado.

Todos os dados auditados sao sinteticos e offline. Nenhum cliente real, pedido, reserva, pagamento ou dado pessoal participou.

## Fonte de verdade

- Versao: `routine-intelligence-guardrails-v1`.
- Hash canonico: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`.
- Hash do arquivo: `460d478e8a94f07f7dbdf995f6ea66f2460d3704bec939ff5a938582dff84743`.
- Limiar de confianca preservado: `0.25`.
- Limite de ajuste da V2 preservado: `[-8, 8]`.
- Rollout publico preservado: `0%`.

## Matriz

| Guardrail | Severidade | Evidencia |
| --- | --- | --- |
| Somente candidatos elegiveis | Bloqueante | 1.800 execucoes auditadas, zero violacao |
| Neutralidade sem historico | Bloqueante | 60 decisoes da V2 auditadas, ajuste e confianca zero |
| Consentimento ativo e revogacao | Bloqueante | Testes de contrato para inatividade, exclusao, revogacao e reativacao |
| Fallback por baixa confianca | Alta | Testes abaixo, no limite e acima de `0.25` |
| Preferencia explicita contra inferencia fraca | Alta | Duas amostras e confianca `0.249` preservam a escolha de controle |
| Contradicao reduz confianca | Alta | Testes congelados da V2 e fixture de auditoria |
| Causalidade temporal | Bloqueante | 1.800 execucoes auditadas; sinal atual ou futuro e recusado |
| Repeticao e diversidade limitadas | Media | Testes de recomendacao, V2 e personas |
| Explicacao tecnica segura | Bloqueante | Lista permitida e rejeicao de campo desconhecido ou privado |
| Rollout publico zero | Bloqueante | Politica, kill switch, consentimento e allowlist testados |

Filtros eliminatorios continuam antes da personalizacao. Preferencia explicita, afinidade, novidade e diversidade nao podem reintroduzir opcao eliminada.

## Regressoes

A auditoria somente leitura classificou 53 divergencias em que a V2 teve maior arrependimento que ao menos um comparador:

| Classificacao | Casos |
| --- | ---: |
| Confianca insuficiente | 24 |
| Preferencia explicita perdida | 11 |
| Distancia mal priorizada | 8 |
| Preco mal priorizado | 2 |
| Contradicao mal compensada | 1 |
| Hipotese para V2.1 | 7 |

As classificacoes de preferencia, distancia, preco e contradicao exigiram evidencia nos candidatos ou sinais sinteticos do cenario. O nome da persona, sozinho, nao foi usado como causa. Casos sem evidencia causal suficiente ficaram como `HIPOTESE_PARA_V2_1`.

O resultado desfavoravel contra a V1 permanece inalterado. Nenhum peso, decaimento, suavizacao, desempate ou formula foi modificado.

## Consentimento e revogacao

O filtro puro aceita somente sinal sintetico, ativo, consentido, nao excluido, da mesma persona e estritamente anterior ao cenario. Revogacao retira todo efeito futuro. Uma concessao posterior aceita apenas sinais ocorridos depois do novo consentimento, portanto nao ressuscita historico antigo. Chaves idempotentes duplicadas contam uma vez.

## Explicacao e privacidade

A explicacao tecnica usa lista permitida para versao, score base, ajuste, contribuicoes agregadas, confianca, volume efetivo, guardrails, fallback e codigo de erro. Campos desconhecidos, sinais individuais, PII, agenda, dados medicos, credenciais e material de reserva sao rejeitados.

## Auditoria congelada

- Relatorio: `routine-intelligence-guardrail-audit-v1`.
- Hash canonico: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`.
- Hash do arquivo: `886b66c25338563917af3434583d3a8104d9edd3f5c507e7c856a6df4467a5ab`.
- Desenvolvimento: 900 execucoes, zero violacao eliminatoria.
- Validacao: 900 execucoes, zero violacao eliminatoria.
- Modelos executados pela auditoria: zero.
- Reserva acessada: falso.

## Revisao cega

Foram selecionados 24 cenarios unicos por maior perda de utilidade e variedade de classificacao. A lista contem apenas IDs sinteticos, persona, semana, indice, motivo e delta externo. Ela nao e o pacote A/B: nao houve randomizacao final, rotulagem A/B ou julgamento humano.

## Decisao

`GUARDRAILS_CONCLUIDOS`

Os contratos e testes de seguranca estao executaveis. As perdas de qualidade continuam abertas para revisao humana e decisao tecnica, sem autorizacao para criar V2.1 neste marco.

## Entrada para 01/10

Gerar um pacote A/B cego e randomizado a partir da lista tecnica, removendo nomes de modelo, scores, confianca e qualquer ordem que revele a origem das alternativas.
