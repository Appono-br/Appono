# Preparacao de integracao da Appono.AI para 06/10/2026

Este documento e uma matriz preparatoria. Nao representa integracao concluida, homologacao, rollout ou validacao comercial.

## Entrada operacional

- ponto de entrada: planejamento de rotina existente;
- candidata tecnica: `appono-intelligence-v2`;
- controle e fallback: `deterministico-v3`;
- referencia de comparacao: `appono-intelligence-v1`;
- politica: usar V2 somente quando a politica congelada permitir;
- rollout publico: `0`;
- allowlist interna: desativada ate autorizacao de 06/10.

## Ordem de decisao

1. Validar sessao, perfil, janela, agenda, elegibilidade, funcionamento, disponibilidade, raio e orcamento.
2. Construir o universo elegivel antes da personalizacao.
3. Construir a entrada comum sem PII desnecessaria.
4. Aplicar consentimento, atividade, revogacao e idempotencia aos sinais.
5. Executar a politica congelada para decidir entre controle e V2.
6. Se a V2 estiver permitida, executar somente com estado isolado e entrada validada.
7. Se houver baixa confianca, erro, timeout, campo invalido ou escolha fora do universo, usar o controle.
8. Persistir somente diagnostico tecnico permitido, sem sinais completos ou dados privados.

## Fallback e falhas

| Situacao | Resultado operacional | Registro permitido |
| --- | --- | --- |
| flag desligada | controle | versao da politica e motivo tecnico |
| fora da allowlist | controle | codigo de politica |
| confianca abaixo de 0.25 | controle | `LOW_CONFIDENCE_FALLBACK` |
| entrada invalida | controle ou erro seguro | codigo de validacao |
| falha da V2 | controle | `MODEL_EXECUTION_FAILURE` |
| escolha inelegivel | controle ou erro seguro | `INELIGIBLE_CHOICE` |
| consentimento ausente ou revogado | sem personalizacao | `SIGNAL_NOT_ELIGIBLE` |
| kill switch ativo | controle | `KILL_SWITCH_ACTIVE` |

Nenhum fallback deve ser contabilizado como escolha nativa da V2.

## Persistencia do diagnostico

Pode persistir apenas:

- versao tecnica que decidiu;
- versao da politica;
- codigo de fallback;
- confianca agregada quando permitida;
- ajuste agregado quando permitido;
- identificador tecnico interno sem PII;
- timestamp da operacao real somente no fluxo operacional de 06/10.

Nao persistir:

- sinal individual completo;
- texto livre de feedback;
- endereco ou coordenada exata;
- agenda completa;
- alergia ou condicao medica como afinidade;
- score privado desnecessario;
- credenciais, tokens ou objetos completos de ambiente.

## Testes de 06/10

- flag desligada preserva controle;
- allowlist vazia preserva controle;
- baixa confianca preserva controle;
- consentimento revogado nao personaliza;
- falha V2 nao interrompe planejamento;
- escolha inelegivel nao chega ao cliente;
- estado de uma pessoa nao contamina outra;
- estado de V2 nao contamina controle;
- diagnostico nao contem PII;
- kill switch e idempotencia funcionam;
- rollout publico continua zero;
- nenhuma chamada remota e feita pelo dominio puro.

## Limites deste documento

Esta matriz nao cria rota, migration, persistencia nova, feature flag ativa ou contrato de API. As decisoes de implementacao e os testes de integracao pertencem ao marco de 06/10.
