# Calendario da Appono Intelligence ate 10/10/2026

## Meta do prazo

Entregar ate 10 de outubro de 2026 a **Appono Intelligence pronta como software**: motor deterministico personalizado, integrado ao planejamento real, funcionando de ponta a ponta em desenvolvimento/homologacao, habilitado para contas internas, com simulacao longitudinal, avaliacao cega, guardrails, observabilidade e fallback.

O prazo comporta concluir e integrar a IA. Ele nao comporta provar eficacia com clientes reais, pois essa populacao ainda nao existe. Portanto, em 10 de outubro a IA deve estar funcional e pronta para uso controlado, embora ainda nao validada comercialmente.

## Calendario executivo

| Data | Entrega principal | Criterio de saida |
| --- | --- | --- |
| 22/09, terça | Congelar baseline e protocolo | Placar atual, versoes, sementes, catalogo e criterios registrados |
| 23/09, quarta | Modelar personas coerentes | Pelo menos 10 personas com utilidade independente e casos esperados |
| 24/09, quinta | Separar conjuntos experimentais | Desenvolvimento, validacao e reserva sem sobreposicao |
| 25/09, sexta | Implementar gerador deterministico | Mesma semente gera exatamente os mesmos cenarios |
| 26/09, sábado | Reserva tecnica | Correcao de fixtures e testes atrasados; sem nova funcionalidade obrigatoria |
| 27/09, domingo | Reserva tecnica | Descanso ou recuperacao de atraso critico |
| 28/09, segunda | Simulacao longitudinal | Seis ou mais semanas virtuais por persona |
| 29/09, terça | Metricas e relatorio comparativo | Utilidade, arrependimento, diversidade, concentracao e confianca por modelo |
| 30/09, quarta | Regressao e guardrails | Preferencia explicita, pouco historico, contradicao e revogacao cobertos |
| 01/10, quinta | Pacote de revisao humana cega | Casos A/B randomizados, sem nome ou peso dos modelos |
| 02/10, sexta | Primeira decisao tecnica | Hipoteses de V2.1 aceitas ou V2 mantida sem ajuste |
| 03/10, sábado | Reserva tecnica | Ajustes pequenos e estabilizacao; sem recalibracao oportunista |
| 04/10, domingo | Reserva tecnica | Descanso ou recuperacao de atraso critico |
| 05/10, segunda | Fechar e testar a versao final | Formula congelada, identificada e coberta por regressao |
| 06/10, terça | Integrar a IA ao planejamento real | Backend seleciona o modelo e persiste diagnostico seguro com fallback |
| 07/10, quarta | Executar validacao e conjunto de reserva | Resultado final offline sem recalibracao posterior |
| 08/10, quinta | Ativar em homologacao interna | Allowlist interna usa a IA; rollout publico permanece zero |
| 09/10, sexta | Congelamento e verificacao final | Fluxo ponta a ponta, testes, builds, lint, diff e documentacao aprovados |
| 10/10, sábado | IA pronta e demonstracao | Configuracao, planejamento pela IA, explicacao, fallback e kill switch demonstrados |

## Progresso registrado

- [x] `22/09` - Baseline e protocolo congelados. Evidencias e ressalvas: [checkpoint de 22/09](appono-intelligence-v2-checkpoint-2026-09-22.md).
- [x] `23/09` - Personas coerentes versionadas, com 30 casos aprovados. Evidencias: [checkpoint de 23/09](appono-intelligence-v2-checkpoint-2026-09-23.md).
- [x] `24/09` - Conjuntos prospectivos separados, reserva selada e intersecao zero comprovada. Evidencias: [checkpoint de 24/09](appono-intelligence-v2-checkpoint-2026-09-24.md).
- [ ] `25/09` - Implementar gerador deterministico sobre as particoes validadas.

Os demais marcos permanecem abertos. A existencia antecipada de alguns artefatos nao equivale a conclusao das respectivas datas.

## Marcos de controle

### Marco 1 - 25/09

- protocolo congelado;
- personas versionadas;
- conjuntos separados;
- gerador reproduzivel.

Se este marco atrasar mais de um dia, reduza quantidade de personas secundarias, nunca os guardrails.

### Marco 2 - 02/10

- simulacao longitudinal concluida;
- metricas por persona disponiveis;
- revisao cega preparada;
- decisao fundamentada sobre criar ou nao V2.1.

Se nao houver hipotese generalizavel, mantenha a V2 atual. Nao ajuste pesos apenas para cumprir o calendario.

### Marco 3 - 07/10

- candidata congelada;
- conjunto de validacao aprovado ou falhas documentadas;
- conjunto de reserva executado;
- decisao tecnica preliminar pronta.

Se o conjunto de reserva reprovar a candidata, a entrega continua valida como `MANTER_EM_SOMBRA`; nao use os dias finais para recalibrar contra a reserva.

### Marco 4 - 10/10

- suite completa aprovada;
- IA final integrada e funcionando para contas internas em homologacao;
- piloto publico preparado com rollout zero;
- documentacao e demonstracao prontas;
- nenhuma alegacao de validacao real;
- proximo ciclo definido.

## Escopo obrigatorio

- personas sinteticas coerentes;
- simulacao longitudinal;
- separacao desenvolvimento/validacao/reserva;
- avaliacao automatica independente;
- pacote de revisao humana cega;
- testes de privacidade, consentimento e regras eliminatorias;
- integracao da IA ao planejamento real;
- allowlist interna, feature flag publica e rollback;
- diagnostico seguro da versao e da decisao;
- documentacao e relatorio final.

## Escopo que pode ser adiado

- interface sofisticada para a revisao humana, caso CSV ou JSON revisavel seja suficiente;
- novos graficos administrativos nao essenciais;
- machine learning treinado;
- LLM para explicacoes;
- piloto com clientes;
- integracoes externas nao relacionadas ao ranking.

## Riscos do prazo

| Risco | Impacto | Resposta |
| --- | --- | --- |
| Ajustar a V2 aos casos conhecidos | Resultado artificialmente bom | Conjunto de reserva isolado e executado apenas no fechamento |
| Falta de avaliadores humanos | Revisao cega limitada | Registrar avaliador unico e manter resultado como evidencia auxiliar |
| Catalogo sintetico pouco diverso | Metricas otimistas | Variar disponibilidade, faixas de preco, distancia e categorias |
| Atraso na simulacao | Comprime verificacao final | Usar fins de semana como reserva, sem cortar seguranca ou testes |
| V2 continuar inferior ao controle | Nao ha liberacao publica | Entregar a IA funcional em homologacao, manter fallback e rollout publico zero |
| Confundir software pronto com validacao real | Risco de produto e comunicacao | Declarar IA pronta em homologacao e validacao comercial ainda pendente |

## Resposta objetiva sobre a data

E possivel chegar a 10 de outubro com a **Appono Intelligence pronta, integrada e funcionando em desenvolvimento/homologacao**, desde que o foco permaneca no escopo acima.

No dia 10, deve ser possivel executar uma demonstracao real: uma conta interna configura a rotina, gera a semana, o backend seleciona a IA, a IA ordena somente candidatos elegiveis, o planejamento e persistido, o diagnostico interno identifica a versao e o fallback pode ser acionado.

O que nao sera possivel provar nessa data e eficacia para clientes reais sem clientes, experiencias reais e tempo de observacao. Isso limita a validacao comercial, nao a conclusao da implementacao.
