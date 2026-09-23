# Checkpoint da Appono.AI - 30/09/2026

## 1. Decisao

`GUARDRAILS_CONCLUIDOS`

Data planejada: `30/09/2026`. Execucao antecipada em `22/09/2026`.

## 2. Pre-condicoes e estado inicial

- Dia 29: `METRICAS_COMPARATIVAS_CONCLUIDAS`.
- Branch: `main`.
- `HEAD`: `4a4d70efdf8d0800c0b5c2c3522d141f1b82e86a`.
- Estado inicial: somente o prompt do Dia 30 estava nao rastreado; foi preservado.
- Runtime: Node.js `v24.14.0`, npm `11.9.0`; minimo declarado Node.js 22.
- Reserva historica: `OPENED_ONCE_CONTAMINATED`.
- Reserva prospectiva: `SEALED_UNMATERIALIZED`.
- Rollout publico: `0%`.

## 3. Integridade preservada

| Artefato | SHA-256 do arquivo |
| --- | --- |
| Snapshot de desenvolvimento | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` |
| Snapshot de validacao | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` |
| Bruto de desenvolvimento | `b8033dc6d5b15e40e4ad2acc15897c65c451828953f1112b105a06f382718467` |
| Bruto de validacao | `1abfe85103adc84baf76735380eeb6eb7443b99519608c49e7dedc133669ecee` |
| Metricas de desenvolvimento, conteudo | `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3` |
| Metricas de validacao, conteudo | `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa` |
| Comparacao, conteudo | `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a` |

Hashes das formulas congeladas:

- controle: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- V1: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`.

## 4. Cobertura anterior e lacunas

Ja existiam testes para neutralidade sem historico, decaimento, contradicao, limites da V2, repeticao, filtros eliminatorios, consentimento na rota, fallback, kill switch e rollout zero. Faltavam uma matriz versionada, contrato explicito de revogacao/reativacao, lista permitida para explicacao e auditoria consolidada dos relatorios congelados.

## 5. Guardrails versionados

- Versao: `routine-intelligence-guardrails-v1`.
- Hash canonico: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`.
- Hash do arquivo: `460d478e8a94f07f7dbdf995f6ea66f2460d3704bec939ff5a938582dff84743`.
- Dez regras com severidade, fallback, evidencia e criterio congelado.
- Limiar de confianca `0.25`, ajuste `[-8, 8]` e rollout `0` preservados.

## 6. Correcoes implementadas

Nao houve correcao de formula ou ranking. Foram adicionados contratos de infraestrutura:

- validacao estrita da matriz;
- filtro de sinais por consentimento, atividade, exclusao, instante, persona e idempotencia;
- revogacao com efeito futuro e reativacao sem ressurreicao de sinais antigos;
- explicacao tecnica por lista permitida;
- auditoria somente leitura com classificacao baseada em evidencia;
- recusa explicita de reserva e escrita apenas em destino novo.

Mudancas de pesos, limites, decaimento, suavizacao e desempate foram rejeitadas por configurarem recalibracao. Sete casos permaneceram `HIPOTESE_PARA_V2_1`.

## 7. Regressao e diagnostico

A auditoria classificou 53 divergencias com maior arrependimento da V2: 24 por confianca insuficiente, 11 por preferencia explicita observavelmente perdida, oito por distancia, duas por preco, uma por contradicao e sete sem causa suficiente, mantidas como hipotese.

O modulo nao atribui causa apenas pelo nome da persona. Para classificacoes causais, compara atributos das alternativas elegiveis, preferencias explicitas e sinais opostos do snapshot.

## 8. Guardrails comprovados

- 1.800 escolhas auditadas pertencem ao universo elegivel comum.
- 1.800 registros preservam barreira temporal.
- 60 decisoes da V2 para o grupo sem historico mantem ajuste, confianca e volume em zero.
- Inferencia com duas amostras e confianca `0.249` retorna ao controle.
- Confianca `0.25` e aceita apenas quando a politica interna ja estiver explicitamente ativa.
- Revogacao e inatividade removem o efeito futuro; duplicata conta uma vez.
- Explicacao rejeita campo desconhecido, privado, `NaN`, infinito e ajuste fora do limite.
- Kill switch e ausencia de consentimento prevalecem sobre allowlist.

## 9. Auditoria e novas saidas

- Relatorio: `routine-intelligence-guardrail-audit-v1`.
- Hash canonico: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`.
- Hash do arquivo: `886b66c25338563917af3434583d3a8104d9edd3f5c507e7c856a6df4467a5ab`.
- Casos para revisao cega: 24 cenarios unicos.
- Modelos executados pela auditoria: zero.
- Reserva acessada: falso.

## 10. Arquivos criados ou alterados

- `backend/experiments/routine-intelligence/guardrails-v1.json`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/test/routine-intelligence-guardrails.test.js`;
- `backend/scripts/audit-routine-intelligence-guardrails.js`;
- `backend/reports/routine-intelligence/prospective/guardrails-v1.json`;
- `backend/package.json`;
- `docs/appono-intelligence-v2-guardrails-2026-09-30.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-30.md`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`.

O prompt nao rastreado do Dia 30 foi mantido como artefato do usuario.

## 11. Comandos e resultados

- `node --test test/routine-intelligence-guardrails.test.js`: aprovado em execucao inicial.
- `npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=desenvolvimento_v1 --check`: aprovado, 22 regressoes classificadas na primeira auditoria isolada.
- `npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=validacao_v1 --check`: aprovado, 31 regressoes classificadas na primeira auditoria isolada.
- `npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --write`: aprovado no destino novo.
- `npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check`: conteudo e hash reproduzidos.
- teste focado repetido tres vezes: 14/14 aprovados em cada execucao, sem flakiness;
- `npm.cmd test --workspace backend`: 263/263 aprovados;
- `npm.cmd run build --workspace backend`: aprovado;
- `npm.cmd run lint --workspace frontend`: aprovado;
- `npm.cmd run build --workspace frontend`: aprovado, 49 paginas geradas;
- simulacao longitudinal de desenvolvimento e validacao em `--check`: hashes preservados e nenhuma escrita;
- avaliacao longitudinal em `--check`: metricas e comparacao preservadas;
- auditorias de cenarios e particoes: intersecao zero e reserva selada;
- auditoria estatica: zero chave de PII ou segredo no relatorio e zero import proibido no modulo puro;
- `git diff --check`: aprovado, somente avisos informativos de conversao LF/CRLF do Git.

## 12. Privacidade e reservas

Nenhum dado real foi introduzido. Relatorios novos usam IDs sinteticos e resumos agregados. A auditoria rejeita nomes de conjunto contendo `reserva`, nao le material selado e nao executa modelos. Nenhuma operacao remota, migration, commit, push ou deploy foi realizada.

## 13. Limitacoes

- Guardrails impedem comportamentos perigosos, mas nao tornam a V2 superior a V1.
- As reacoes e preferencias continuam sinteticas.
- Confianca interna nao e probabilidade calibrada de satisfacao.
- A lista de 24 casos ainda precisa de randomizacao A/B e revisao humana.

## 14. Preparado para 01/10

`PREPARADO`: IDs sinteticos, contexto nao sensivel, classificacao, prioridade e delta externo de 24 cenarios unicos.

Ainda nao concluido: randomizacao A/B, ocultacao final, pacote cego, julgamento humano e agregacao da revisao.

## 15. Entrada exata do proximo marco

Gerar o pacote A/B cego, randomizado e livre de identificadores de modelo, score, confianca e ordem reveladora; validar a ocultacao antes de qualquer julgamento humano.
