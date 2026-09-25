# Prontidao controlada da Appono Intelligence V2.1

Este documento prepara as etapas posteriores da V2.1 sem declarar rollout, release ou validacao comercial.

## Estado atual

- Candidata: `appono-intelligence-v2-1`.
- Estado tecnico: `FROZEN_FOR_VALIDATION`.
- Decisao atual: `V2_1_APROVADA_PARA_AVALIACAO_DE_RESERVA`.
- Rollout publico: `0`.
- Flag global: desligada por padrao.
- Reserva V2.1: `SEALED_NOT_AUTHORIZED`.
- Dados reais: `DADOS_REAIS_AUSENTES`.
- Revisao humana: `REVISAO_HUMANA_PENDENTE`.

## 1. Nova reserva prospectiva

O protocolo esta em `backend/experiments/routine-intelligence/v2-1-reserve-protocol-v1.json`. A CLI `prepare:rotina:v2-1:reserve` faz somente verificacao. A abertura e execucao continuam bloqueadas até existir autorizacao formal, novo compromisso, nova particao sem sobreposicao e confirmacao de execucao unica. Nenhum material privado foi lido nesta etapa.

## 2. Revisao humana real

O pacote cego especifico da V2.1 foi preparado em `backend/reports/routine-intelligence/prospective/v2-1-blind-review-v1/`, com 24 casos e hash `fc278cd729af1bb7c83141a5f78acf8aa5d37a6921a60d8093153449de5ecc65`. Para produzir evidencia humana real, revisores independentes devem avaliar casos anonimizados, sem nome de modelo, score ou chave. Respostas sinteticas, inventadas ou corrigidas pelo agente nao sao aceitas. Sem submissao valida, o estado permanece `REVISAO_HUMANA_PENDENTE`.

## 3. Dados reais consentidos

`routine-intelligence-consented-observations.js` cria uma fronteira de ingestao que exige consentimento ativo, causalidade temporal, chave idempotente e remove identificadores pessoais. E-mails, telefones, enderecos, coordenadas, agenda, dados medicos, credenciais e texto livre sao rejeitados. O conjunto resultante e apenas anonimizado para analise; treinamento continua desautorizado por padrao.

## 4. Allowlist interna

`routine-intelligence-v2-1-rollout.js` exige simultaneamente estado operacional aprovado, hash correto, flag interna, consentimento ativo, identidade na allowlist, kill switch desligado e rollout publico igual a zero. Qualquer falha retorna o controle deterministico.

## 5. Uso real monitorado

`routine-intelligence-v2-1-monitoring.js` registra somente contadores tecnicos: decisoes, fallbacks, baixa confianca, erros, timeouts, escolhas inelegiveis, violacoes e conflitos de idempotencia. Nao armazena PII. Os limites de pausa devem ser aprovados antes de qualquer allowlist operacional.

## 6. Aprovacao operacional

`backend/experiments/routine-intelligence/v2-1-operational-approval-v1.json` permanece `PENDING`. Produto, engenharia, privacidade, seguranca e operacoes precisam registrar aprovacao independente antes de qualquer ativacao. Mesmo com todas as aprovacoes, o rollout publico deve continuar em zero até autorizacao posterior separada.

## Gatilho exato para a proxima etapa

`Autorizar formalmente a abertura unica da reserva prospectiva V2.1, após conferir protocolo, compromisso, particao e hashes, mantendo a V2 intacta, sem recalibracao posterior, sem dados pessoais e com rollout publico zero.`
