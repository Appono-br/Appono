# Auditoria para promover a V2.1 — 24/09/2026

A V2.1 apresenta o melhor arrependimento médio nos conjuntos sintéticos de desenvolvimento e validação disponíveis. Isso ainda não comprova superioridade com clientes reais. Para a demonstração acadêmica, ela foi integrada e promovida a titular para todos os usuários.

## Evidência reproduzida

Foram recomputados os 300 cenários de desenvolvimento e os 300 de validação, preservando os hashes de conteúdo registrados. Ambos apresentaram zero falhas e zero violações eliminatórias.

Na validação, menor arrependimento é melhor:

| Modelo | Arrependimento médio |
| --- | ---: |
| V2.1 | 2,388391 |
| V1 | 4,263973 |
| V2 | 4,926099 |
| Controle determinístico | 5,372953 |

Contra a V2, a V2.1 vence em 98 casos, perde em 60 e empata em 142. A vantagem é agregada, não universal. Fontes: `backend/reports/routine-intelligence/prospective/v2-1/validation-metrics.json` e CLI `run-routine-intelligence-v2-1-candidate.js --dataset=validacao_v1 --check`.

## Implementação titular da demonstração

1. `decideV2_1` foi conectado ao fluxo de `routine-recommendation.js` por um adaptador operacional separado, preservando a implementação congelada que foi avaliada.
2. A V2.1 recebe somente candidatos que já passaram pelos limites de orçamento, raio, funcionamento, agenda, antecedência, restrições e alergias.
3. Preferências explícitas podem orientar a decisão mesmo sem histórico. Sinais comportamentais são repassados somente com consentimento ativo.
4. A política `routine-intelligence-v2-1-titular-v1` ativa a V2.1 para todos por padrão na demonstração.
5. Em falha, ausência de candidato ou acionamento do kill switch, a decisão volta para `deterministico-v3`.
6. O planejamento registra `appono-intelligence-v2-1` como modelo executado e o painel administrativo apresenta a V2.1 como titular da demonstração.

`APPONO_ROTINA_V2_1_TITULAR_ENABLED=false` desativa a titular. `APPONO_ROTINA_INTELLIGENCE_KILL_SWITCH=true` aciona imediatamente o fallback determinístico.

## Correção e verificações

O checkout Windows tinha `core.autocrlf=true`, alterando bytes dos arquivos congelados e causando 12 falhas de integridade. Foi adicionado `.gitattributes` para preservar LF nos arquivos JavaScript/JSON do backend e Markdown/CSV dos relatórios. As quebras de linha locais foram normalizadas, sem modificar fórmulas, resultados ou hashes esperados e sem enfraquecer as verificações por byte.

- Backend: 306 testes aprovados, zero falhas.
- Recomposição de desenvolvimento e validação: conteúdo reproduzido; validação por CLI aprovada com comparação exata.
- Demonstração local: `V2_1_LOCAL_TITULAR`, `production_eligible=false`.
- Preparação de reserva: verificação aprovada; nenhuma execução da reserva.
- Build e lint do frontend: aprovados.
- Nenhuma implantação remota foi executada.

Esta promoção vale para a demonstração acadêmica. Não declarar a V2.1 validada comercialmente ou com clientes reais com base apenas nesses resultados.
