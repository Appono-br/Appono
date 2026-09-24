# Checkpoint da candidata V2.1 controlada

## Decisao

`V2_1_APROVADA_PARA_AVALIACAO_DE_RESERVA`

A candidata `appono-intelligence-v2-1` passou o desenvolvimento e a validacao congelada. Isso autoriza somente considerar uma nova reserva prospectiva mediante autorizacao explicita separada. Nao autoriza rollout, substituicao automatica da V2 ou release.

## Hipotese geral

`explicit_preference_requires_broader_precedence`.

A hipótese foi escolhida por descrever um mecanismo transversal: quando existe categoria explicitamente preferida e elegivel, a candidata preserva essa preferência antes de comparar pontuações dentro do subconjunto. A regra e geral, nao depende de uma persona ou caso, nao altera pesos, limiar, filtros ou a formula V2 e foi testada com fixture independente.

## Baseline e integridade

- Branch: `main`.
- HEAD inicial: `2386476afd0dd47d694b62c3ce7be9c5298e2b66`.
- Controle: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`.
- V1: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`.
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`.
- Politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`.
- Guardrails: `f205b05666b8607f69f2fe1136dc777d70791d16ca8c9377377c1c02038f9eeb`.
- Contrato: `ea66691754eeaa39625c32682397c46f418e9aa4fd0ff13509210f02e78c649f`.
- `formulas_changed`: `false`.

## Protocolo e candidata

- Protocolo: `db83cb2841a742920d26ff3079921543128315e86bdf7c17ebb676d977099ea8`.
- Implementacao: `538bf23fd110ee71e818edb8eb9a3b4dfc7c5b060ca6af0d26c3233d0f20371a`.
- Avaliador: `87bdd03d6c8ae35dd5cbc47f1738a3b58503ff48a65dcb4b2931f16031686cae`.
- Estado: `FROZEN_FOR_VALIDATION`.
- Manifesto canonico: `e99aaddc70a876269b6b0b087883f23ac01a16a0e60cd6a0b9ff0aa3ac66051d`.

## Resultados separados

| Conjunto | Cenarios | Arrependimento medio | Falhas | Fallbacks | Violacoes eliminatorias |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desenvolvimento | 300 | 2.522448 | 0 | 0 | 0 |
| Validacao | 300 | 2.388391 | 0 | 0 | 0 |

Na validacao, a V2.1 foi comparada nos mesmos 300 cenarios:

| Comparador | Arrependimento medio | Delta V2.1 menos comparador | Resultado |
| --- | ---: | ---: | --- |
| `deterministico-v3` | 5.372953 | -2.984562 | PASS |
| `appono-intelligence-v1` | 4.263973 | -1.875582 | PASS |
| `appono-intelligence-v2` | 4.926099 | -2.537707 | PASS |

Empates e vitorias foram mantidos como categorias separadas; nenhum fallback foi creditado como escolha nativa.

## Guardrails e privacidade

Entradas comuns, universo elegivel, neutralidade sem historico, causalidade, sinais consentidos e idempotencia foram preservados. A candidata nao importa banco, HTTP, reserva, relogio real ou ambiente em modulo puro. Dados reais: `DADOS_REAIS_AUSENTES`. Revisao humana: `REVISAO_HUMANA_PENDENTE`.

## Reserva e rollout

- Reserva historica: preservada como contaminada e nao usada.
- Nova reserva: `SEALED_NOT_AUTHORIZED`, nao acessada.
- Recalibracao apos validacao: `false`.
- Rollout publico: `0`.
- Allowlist: desativada.

## Verificacoes

Testes focados da V2.1 passaram tres vezes (`3/3` em cada execucao). A bateria completa do backend passou (`294/294`), build backend passou, lint e build frontend passaram e `git diff --check` passou. Os checks de reproducibilidade de desenvolvimento e validacao passaram.

## Limitacoes

Os conjuntos sao sinteticos e nao representam clientes reais. A revisao humana permanece pendente. O resultado autoriza apenas avaliar uma nova reserva, com novo protocolo e autorizacao explicita; nao demonstra validacao comercial.

## Entrada exata do proximo marco

`Considerar uma nova reserva prospectiva somente após autorizacao explicita, usando novo protocolo, nova particao e compromisso, sem recalibrar a V2.1 depois da validacao e mantendo rollout publico zero.`
