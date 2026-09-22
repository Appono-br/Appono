# Relatorio tecnico da Appono Intelligence V2

Data: 22/09/2026.

## Estado da entrega

A Appono Intelligence V2 esta integrada ao gerador real de planejamento e pode decidir sugestoes para contas internas autorizadas. O comportamento publico permanece no `deterministico-v3`, com rollout igual a zero por padrao.

Classificacao offline: `IA_PRONTA_EM_HOMOLOGACAO`.

Essa classificacao significa software implementado, testado e habilitavel de forma controlada. Nao significa validacao comercial nem superioridade comprovada com clientes reais.

## Integracao operacional

- Selecao centralizada em `routine-intelligence-policy.js`.
- Allowlist aceita UUID de autenticacao, e-mail ou ID interno do cliente.
- Consentimento ativo e obrigatorio.
- Confianca minima padrao: `0,25`.
- Rollout publico padrao: `0%`.
- Kill switch retorna imediatamente ao controle.
- Falha, ausencia de historico ou baixa confianca retornam ao `deterministico-v3`.
- A V2 recebe somente candidatos que ja passaram pelos filtros eliminatorios.
- Modelo, segmento, motivo do fallback, confianca e amostras sao persistidos nos metadados do planejamento.
- O painel administrativo mostra somente diagnostico agregado e nao revela allowlist, sal ou sinais.

## Protocolo longitudinal

O protocolo `appono-intelligence-longitudinal-v1` usa dez personas e seis semanas por persona. Cada conjunto produz 300 decisoes por modelo.

Conjuntos:

- desenvolvimento, semente `22092026`;
- validacao, semente `23112026`;
- reserva, semente `10102026`.

As personas representam comportamento economico, explorador, fidelidade a restaurante, fidelidade a prato, sensibilidade a distancia, aversao a repeticao, preferencia explicita forte, sinais contraditorios, mudanca gradual e controle sem historico.

A funcao de utilidade externa nao reutiliza os pesos da V2. Cada modelo e avaliado contra sua propria sequencia de escolhas. Os candidatos, o ruido e as condicoes eliminatorias permanecem comuns.

## Resultados

| Conjunto | Controle: arrependimento | V1: arrependimento | V2: arrependimento | Desacordos controle/V2 | Violacoes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desenvolvimento | 7,1055 | 4,4107 | 3,6306 | 120 | 0 |
| Validacao | 6,9761 | 4,1785 | 3,4688 | 111 | 0 |
| Reserva | 7,4095 | 4,4114 | 3,6729 | 134 | 0 |

No conjunto de reserva, todos os criterios congelados antes da execucao foram aprovados:

- zero violacoes eliminatorias;
- V2 com arrependimento menor que V1;
- V2 nao inferior ao controle;
- nenhuma regressao por persona acima de `2,0` pontos;
- neutralidade no grupo sem historico;
- concentracao maxima nao pior que a V1;
- determinismo confirmado pelos testes.

## Revisao humana cega

O arquivo `backend/reports/routine-intelligence/blind-review.json` contem os desacordos da validacao em ordem A/B deterministica e cegada. Ele nao contem nome do modelo, utilidade, confianca ou pesos.

A revisao ainda nao foi preenchida. Portanto, nao existe consenso humano e o resultado cego nao foi usado para aprovar a classificacao tecnica.

## Comandos

```text
npm run simulate:rotina:intelligence --workspace backend -- --dataset=desenvolvimento --weeks=6
npm run simulate:rotina:intelligence --workspace backend -- --dataset=validacao --weeks=6
npm run evaluate:rotina:intelligence --workspace backend -- --dataset=validacao
npm run simulate:rotina:intelligence --workspace backend -- --dataset=reserva --weeks=6 --confirm-reserve
npm run evaluate:rotina:intelligence --workspace backend -- --dataset=reserva
```

## Configuracao de homologacao

Variaveis, sem valores reais:

- `APPONO_ROTINA_INTELLIGENCE_ENABLED`;
- `APPONO_ROTINA_INTELLIGENCE_INTERNAL_ALLOWLIST`;
- `APPONO_ROTINA_INTELLIGENCE_ROLLOUT_PERCENT`;
- `APPONO_ROTINA_INTELLIGENCE_ROLLOUT_SALT`;
- `APPONO_ROTINA_INTELLIGENCE_MIN_CONFIDENCE`;
- `APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH`.

Para homologacao interna, mantenha o rollout publico em zero, inclua somente contas consentidas na allowlist e valide o planejamento de ponta a ponta. Nenhuma configuracao remota foi alterada neste ciclo.

## Limitacoes

- As personas e interacoes sao sinteticas.
- Nao existem metricas de aceitacao, conversao ou retencao de clientes reais.
- O pacote cego aguarda avaliacao humana.
- A classificacao nao autoriza rollout publico automatico.
- O conjunto de reserva nao deve ser reutilizado para calibracao.
