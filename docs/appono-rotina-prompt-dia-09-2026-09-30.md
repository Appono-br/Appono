# Prompt do Dia 9 - Regressoes e guardrails da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **30 de setembro de 2026** do calendario de entrega da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **transformar os resultados comparativos de 29/09 em guardrails executaveis e testes de regressao**, cobrindo preferencia explicita, pouca evidencia, contradicao, mudanca gradual, repeticao, diversidade, consentimento, revogacao, filtros eliminatorios e falha segura.

Nao entregue apenas analise, uma lista de riscos ou pseudocodigo. Inspecione o estado real do repositorio, preserve os artefatos congelados, catalogue as regressoes, implemente os contratos e testes faltantes, execute auditorias locais e produza um checkpoint datado.

Este marco nao autoriza recalibrar a V2, criar V2.1 ou alterar pesos para melhorar o placar observado. Uma falha da V2 contra a V1 e evidencia para diagnostico, nao permissao para ajuste oportunista.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `30/09/2026`.

Entrega prevista:

> Regressao e guardrails: preferencia explicita, pouco historico, contradicao e revogacao cobertos.

O marco somente pode ser encerrado quando estiver comprovado que:

- cada regressao relevante de 29/09 possui classificacao e evidencia reproduzivel;
- preferencias explicitas fortes nao sao superadas por inferencia fraca ou pouco confiavel;
- uma ou duas amostras produzem efeito limitado e nao habilitam decisao interna abaixo da confianca minima;
- sinais contraditorios reduzem confianca e nao removem filtros eliminatorios;
- mudanca recente de gosto nao apaga abruptamente historico consolidado;
- afinidade comportamental nao elimina variedade semanal;
- penalidade de repeticao nao bloqueia favorito com evidencia consistente;
- revogacao, inatividade ou exclusao logica retiram o efeito futuro dos sinais;
- ausencia de historico mantem ajuste e confianca iguais a zero;
- falha, baixa confianca ou ausencia de historico retornam ao controle;
- nenhum candidato inelegivel chega a V1 ou V2;
- explicacoes tecnicas mostram contribuicoes permitidas sem PII ou sinais privados;
- todos os guardrails possuem testes positivos, negativos e de fronteira;
- nenhuma formula foi recalibrada e nenhuma reserva foi acessada.

## Pre-condicao do Dia 29

Antes de editar, confirme:

- decisao de 29/09 igual a `METRICAS_COMPARATIVAS_CONCLUIDAS`;
- checkpoint e relatorio comparativo de 29/09 presentes;
- `HEAD` esperado apos o commit do Dia 29 igual a `4a4d70e` ou seu descendente legitimo;
- arvore de trabalho limpa ou alteracoes locais identificadas e preservadas;
- agregador `routine-longitudinal-metrics-v1`;
- 900 registros por conjunto e 1.800 execucoes totais;
- juncao com snapshots igual a 100%;
- zero falhas, fallbacks, escolhas inelegiveis e violacoes eliminatorias;
- validacao como fonte primaria dos criterios;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- suite backend, builds e lint aprovados no fechamento anterior.

Hashes esperados a conferir, sem regravar os artefatos:

- bruto de desenvolvimento, arquivo: `b8033dc6d5b15e40e4ad2acc15897c65c451828953f1112b105a06f382718467`;
- bruto de desenvolvimento, conteudo: `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`;
- bruto de validacao, arquivo: `1abfe85103adc84baf76735380eeb6eb7443b99519608c49e7dedc133669ecee`;
- bruto de validacao, conteudo: `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`;
- metricas de desenvolvimento, conteudo: `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3`;
- metricas de validacao, conteudo: `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa`;
- comparacao, conteudo: `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a`;
- snapshot de desenvolvimento: `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c`;
- snapshot de validacao: `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6`;
- personas, canonico: `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- particoes, canonico: `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`.

Se uma pre-condicao falhar, interrompa o marco, investigue e documente. Nao regenere relatorios ou snapshots para ocultar divergencia.

## Resultados conhecidos que orientam o diagnostico

Trate estes numeros como observacoes congeladas de validacao, nao como metas de calibracao:

- arrependimento medio do controle: `5.372953`;
- arrependimento medio da V1: `4.263973`;
- arrependimento medio da V2: `4.926099`;
- V2 menos controle: `-0.446854`, favoravel a V2;
- V2 menos V1: `+0.662126`, desfavoravel a V2;
- criterio `v2_regret_not_worse_than_v1`: `FAIL`;
- V2 com confianca maior ou igual a `0.25`: `102/300`;
- cobertura explicita: controle `0.614815`, V1 `0.688889`, V2 `0.629630`;
- repeticao consecutiva de categoria: controle `0.220690`, V1 `0.293103`, V2 `0.241379`;
- zero violacoes eliminatorias.

Regressoes prioritarias:

- `sensivel_distancia`: V2 menos controle `+0.329115`;
- `fiel_restaurante`: V2 menos V1 `+2.277477`;
- `preferencia_forte`: V2 menos V1 `+1.564178`;
- `sensivel_distancia`: V2 menos V1 `+1.508212`;
- `fiel_prato`: V2 menos V1 `+1.076322`;
- `economico`: V2 menos V1 `+0.611856`;
- `contraditorio`: V2 menos V1 `+0.441059`;
- `mudanca_gradual`: V2 menos V1 `+0.332836`;
- o arrependimento semanal da V2 cresceu de `2.681827` na semana 0 para `7.062663` na semana 5.

Nao conclua que cada delta foi causado pelo nome da persona. Inspecione os cenarios, contribuicoes, historico anterior e alternativas elegiveis antes de atribuir causa.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22 a 29/09;
- prompts dos Dias 1 a 8;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-intelligence-v2-comparativo-2026-09-29.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`;
- snapshots de desenvolvimento e validacao;
- relatorios brutos e de metricas prospectivos;
- `backend/src/domain/routine-scoring.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/routes/routine.js`;
- scripts de coleta, simulacao, avaliacao e auditoria;
- testes de recomendacao, V1, V2, politica, consentimento, rotas, simulacao e metricas;
- migrations de consentimento e feedback apenas para verificar contratos existentes, sem altera-las.

Leia tambem as instrucoes locais do repositorio. Este marco nao deve exigir Supabase remoto, banco real, migration, pagamento, e-mail ou frontend funcional.

## Regras inegociaveis

1. Preserve todas as alteracoes locais e os artefatos congelados.
2. Nao altere o controle ou a V1.
3. Nao altere pesos, limites, decaimento, suavizacao ou desempates da V2 neste marco.
4. Nao crie nem nomeie uma V2.1.
5. Nao use validacao ou reserva para ajustar formula.
6. Nao reexecute modelos em modo de escrita.
7. E permitido executar CLIs anteriores somente em `--check`.
8. Nao abra, materialize, leia, reconstrua ou tente inferir a reserva prospectiva.
9. Nao reexecute a reserva historica.
10. Nao altere snapshots, relatorios brutos, metricas ou comparacao de 29/09.
11. Nao exclua casos desfavoraveis, personas, semanas ou empates.
12. Nao transforme alergia, restricao medica, agenda, endereco ou suporte em gosto.
13. Seguranca alimentar, funcionamento, disponibilidade, agenda, orcamento e raio continuam eliminatorios.
14. Preferencia explicita forte deve prevalecer sobre inferencia fraca, mas nunca sobre filtro eliminatorio.
15. Sem historico elegivel, ajuste e confianca permanecem zero.
16. Revogacao e exclusao logica devem retirar o efeito futuro, sem apagar trilha auditavel permitida.
17. Nao registre sinal individual, identidade, endereco, coordenada exata, agenda ou dado medico em relatorio.
18. Nao habilite rollout publico nem altere sugestoes visiveis ao cliente.
19. Nao declare superioridade, homologacao, piloto ou validacao comercial.
20. Nao faca commit, push, deploy, seed remoto, pagamento, e-mail ou migration remota.

## Escopo permitido

Este marco pode:

- classificar as regressoes observadas;
- criar fixtures minimas independentes e reproduziveis;
- formalizar guardrails em modulo puro ou reforcar contratos existentes;
- adicionar testes de fronteira para V2, politica e recomendacao;
- corrigir defeito geral de guardrail que viole uma regra previamente declarada;
- criar auditoria somente leitura sobre os relatorios congelados;
- gerar matriz de guardrails por persona e criterio;
- registrar hipoteses para a decisao de 02/10;
- preparar IDs de desacordos candidatos a revisao cega de 01/10.

Este marco nao pode:

- otimizar pesos para vencer V1;
- alterar a utilidade independente das personas;
- reclassificar uma regressao como empate por conveniencia;
- criar nova reserva;
- executar avaliacao humana;
- revelar nomes de modelos em pacote cego;
- integrar a V2 ao fluxo publico;
- promover modelo.

## Fase 1 - Inventario e integridade

Registre antes da primeira edicao:

- branch, `HEAD` e estado do Git;
- arquivos modificados e nao rastreados;
- versoes de Node.js e npm;
- hashes das formulas, snapshots, brutos, metricas e comparacao;
- criterios congelados de 22/09;
- feature flags e valores padrao;
- estado das reservas;
- testes existentes que ja cobrem cada guardrail;
- lacunas reais de cobertura.

Separe claramente:

- comportamento ja garantido por teste;
- comportamento implementado, mas sem teste suficiente;
- comportamento ausente;
- resultado desfavoravel que nao constitui violacao de guardrail;
- hipotese para eventual V2.1.

Nao duplique testes apenas para aumentar contagem. Adicione cobertura quando houver risco ou contrato ainda nao comprovado.

## Fase 2 - Matriz versionada de guardrails

Crie uma fonte de verdade versionada, por exemplo:

- `backend/experiments/routine-intelligence/guardrails-v1.json`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/test/routine-intelligence-guardrails.test.js`.

Os nomes podem acompanhar uma convencao local melhor. Preserve a separacao entre:

- declaracao do guardrail;
- validacao de schema;
- avaliacao pura;
- fixtures de regressao;
- auditoria de relatorios;
- documentacao.

Cada guardrail deve declarar:

- `id` estavel;
- versao;
- objetivo;
- risco evitado;
- entradas necessarias;
- pre-condicoes;
- regra de aprovacao;
- regra de falha;
- severidade;
- comportamento de fallback;
- evidencia exigida;
- personas e cenarios aplicaveis;
- se atua antes do ranking, durante a personalizacao ou depois da decisao;
- ausencia de PII;
- relacao com criterio congelado.

Rejeite:

- IDs duplicados;
- campos desconhecidos;
- severidade desconhecida;
- regra sem teste;
- limiar novo sem origem documentada;
- referencia a resultado da reserva;
- peso de modelo disfarçado de guardrail;
- regra que favoreca explicitamente um identificador de modelo;
- regra que transforme score interno em utilidade externa.

## Fase 3 - Taxonomia de regressoes

Classifique todos os desacordos prioritarios em categorias mutuamente explicaveis:

- `PREFERENCIA_EXPLICITA_PERDIDA`;
- `INFERENCIA_FRACA_SUPERESTIMADA`;
- `CONFIANCA_INSUFICIENTE`;
- `CONTRADICAO_MAL_COMPENSADA`;
- `REPETICAO_EXCESSIVA`;
- `PENALIDADE_DE_REPETICAO_EXCESSIVA`;
- `MUDANCA_GRADUAL_LENTA`;
- `MUDANCA_GRADUAL_ABRUPTA`;
- `DISTANCIA_MAL_PRIORIZADA`;
- `PRECO_MAL_PRIORIZADO`;
- `FAVORITO_IGNORADO`;
- `DIVERSIDADE_INSUFICIENTE`;
- `EMPATE_TECNICO`;
- `SEM_VIOLACAO_DE_GUARDRAIL`;
- `DEFEITO_DE_FIXTURE`;
- `DEFEITO_DE_AVALIADOR`;
- `HIPOTESE_PARA_V2_1`.

Uma mesma ocorrencia pode possuir causa primaria e fatores secundarios, mas nao atribua causa sem evidencia observavel.

Para cada caso analisado, registre somente:

- conjunto;
- `scenario_id` sintetico;
- persona;
- semana e indice;
- alternativas elegiveis relevantes;
- preferencias explicitas aplicaveis;
- resumo nao sensivel do historico anterior;
- escolha de cada modelo;
- utilidade externa e arrependimento;
- confianca e volume quando existentes;
- guardrail relacionado;
- classificacao;
- justificativa tecnica curta.

Nao copie sinais individuais completos nem diagnosticos privados.

## Fase 4 - Fixtures de regressao independentes

Crie fixtures pequenas para reproduzir propriedades gerais, nao respostas decoradas dos relatorios.

Cada fixture deve:

- usar IDs sinteticos;
- declarar candidato elegivel e inelegivel separadamente;
- declarar preferencia explicita, historico e sinais minimos;
- aceitar relogio de referencia por parametro;
- ser deterministica;
- testar uma propriedade principal;
- possuir uma variante negativa e uma de fronteira;
- nao importar resultado esperado da reserva;
- nao codificar `scenario_id` como vencedor.

Os cenarios reais de desenvolvimento e validacao podem inspirar a fixture, mas a regra deve generalizar para atributos equivalentes.

## Fase 5 - Preferencia explicita contra inferencia fraca

Comprove ou implemente conservadoramente:

- categoria explicitamente preferida vence pequena vantagem inferida de afinidade;
- prato ou restaurante favorito declarado nao e superado por uma ou duas amostras contraditorias;
- preferencia explicita forte nao supera orcamento, raio, seguranca, funcionamento ou disponibilidade;
- preferencia evitada nao e escolhida apenas por novidade, preco ou distancia;
- baixa confianca impede que a personalizacao mude a escolha operacional;
- empate nao depende da ordem acidental do array.

Nao invente um novo bonus numerico. Use contratos existentes ou uma guarda de decisao documentada. Qualquer mudanca comportamental deve ser atribuida a uma regra previamente declarada, nao a um peso ajustado apos o resultado.

## Fase 6 - Pouco historico e confianca

Teste explicitamente:

- zero sinais elegiveis gera ajuste zero e confianca zero;
- uma amostra coerente gera efeito pequeno e confianca abaixo de `0.25`;
- duas amostras nao ultrapassam preferencia explicita forte;
- aumento de evidencia coerente pode elevar confianca gradualmente;
- sinais antigos possuem menor influencia que sinais recentes equivalentes;
- volume efetivo nao e confundido com quantidade bruta;
- confianca nunca sai de `[0, 0.9]`;
- `NaN`, infinito, instante invalido ou tipo desconhecido falham com codigo seguro;
- politica operacional usa controle abaixo de `0.25`;
- fallback nao recebe credito como escolha nativa.

O valor `0.25` ja esta congelado na politica interna. Nao o ajuste com base nos `102/300` casos observados.

## Fase 7 - Contradicao e mudanca gradual

Comprove:

- sinais positivos e negativos equivalentes reduzem consistencia e confianca;
- contradicao nunca desativa filtro eliminatorio;
- um evento recente isolado nao apaga historico consolidado;
- uma sequencia recente coerente consegue alterar gradualmente a afinidade;
- a transicao da persona `mudanca_gradual` possui periodo intermediario mensuravel;
- sinais futuros nao retroagem;
- sinais da decisao atual nao influenciam a propria decisao;
- a ordem dos sinais equivalentes nao muda o resultado canonico.

Registre separadamente comportamento esperado de transicao e instabilidade indevida.

## Fase 8 - Repeticao, diversidade e favoritos

Teste:

- repeticao consecutiva recebe penalidade progressiva e limitada;
- penalidade de repeticao nunca torna candidato inelegivel;
- favorito com evidencia consistente continua selecionavel;
- terceira repeticao pode perder para alternativa compativel;
- primeira repeticao moderada nao e banida;
- diversidade nao escolhe categoria explicitamente evitada;
- afinidade nao colapsa a semana em uma unica categoria;
- restaurante, produto e categoria possuem contadores independentes;
- mudanca de semana nao apaga historico quando o contrato exige continuidade;
- grupo sem historico nao acumula sequencia para personalizacao.

Nao use a alta cardinalidade sintetica de restaurantes e produtos para declarar diversidade real. Priorize categoria e sequencia nas fixtures deste marco.

## Fase 9 - Consentimento, revogacao e exclusao logica

Mapeie o ciclo completo do sinal desde coleta ate consumo pela V2.

Comprove que:

- sinal sem consentimento nunca personaliza;
- consentimento revogado impede uso futuro;
- sinal `active: false` nao personaliza;
- exclusao logica retira o efeito sem apagar evidencia auditavel permitida;
- reativacao nao ressuscita automaticamente sinal previamente revogado quando o contrato nao autorizar;
- chave idempotente duplicada conta uma vez;
- revogacao entre duas decisoes afeta somente a decisao posterior;
- cache ou estado longitudinal nao mantem contribuicao revogada;
- relatorio agregado nao revela o sinal individual;
- grupo sem historico continua sem sinal mesmo quando reage na simulacao.

Se o fluxo real de revogacao depender do banco, teste o contrato de dominio e o adaptador com doubles locais. Nao crie migration nem use Supabase remoto neste marco.

## Fase 10 - Filtros eliminatorios e universo comum

Reconfirme por testes que:

- alergia e seguranca alimentar continuam sob responsabilidade do controle;
- restaurante fechado nao e candidato;
- produto indisponivel nao e candidato;
- agenda ou janela insuficiente elimina a opcao;
- orcamento e raio eliminam antes da personalizacao;
- V1 e V2 recebem exatamente os mesmos candidatos elegiveis;
- nenhum guardrail reintroduz candidato eliminado;
- preferencia ou afinidade nao altera elegibilidade;
- falha do desafiante nunca bloqueia o planejamento oficial.

Nao use alergia, restricao medica, endereco, coordenada, agenda ou suporte como afinidade.

## Fase 11 - Politica operacional e fallback

Valide a politica existente para:

- flag global desativada por padrao;
- rollout publico igual a zero;
- allowlist interna opcional;
- consentimento ativo obrigatorio;
- agrupamento estavel;
- kill switch;
- ausencia de historico;
- confianca abaixo de `0.25`;
- erro da V2;
- escolha fora do conjunto elegivel;
- diagnostico seguro da versao que decidiu.

O resultado esperado fora da allowlist continua sendo `deterministico-v3`. Este marco nao ativa homologacao interna; apenas comprova as guardas que serao usadas depois.

## Fase 12 - Explicacao tecnica segura

Implemente ou valide uma explicacao tecnica agregada que possa registrar:

- versao do modelo;
- score base;
- ajuste total;
- nomes permitidos das contribuicoes;
- confianca;
- amostras e volume efetivos;
- guardrails aplicados;
- motivo de fallback;
- codigo tecnico de erro.

A explicacao nao pode conter:

- sinal individual;
- texto livre de feedback;
- e-mail, nome ou identificador externo;
- endereco ou coordenada exata;
- agenda;
- alergia ou dado medico;
- token ou credencial;
- pesos privados desnecessarios;
- material da reserva.

Campos desconhecidos devem ser rejeitados. Use lista permitida, nao apenas remocao posterior de chaves perigosas.

## Fase 13 - Auditoria dos relatorios congelados

Crie uma auditoria local somente leitura, se ainda nao existir, por exemplo:

`backend/scripts/audit-routine-intelligence-guardrails.js`

Script sugerido:

```text
audit:rotina:guardrails
```

A CLI deve:

- aceitar `desenvolvimento_v1`, `validacao_v1` ou `all`;
- recusar qualquer argumento contendo `reserva`;
- validar hashes de entrada;
- nao executar os modelos;
- nao alterar relatorios de 28 ou 29/09;
- oferecer `--check` sem escrita;
- exigir `--write` para novo relatorio de auditoria;
- usar destinos fixos;
- impedir sobrescrita incompativel;
- escrever atomicamente;
- imprimir apenas resumo agregado seguro;
- retornar codigo diferente de zero em defeito de integridade;
- diferenciar violacao de guardrail de resultado de qualidade desfavoravel.

Resumo permitido:

- conjunto;
- casos avaliados por guardrail;
- aprovados, reprovados e nao aplicaveis;
- regressões por persona;
- casos candidatos a revisao cega;
- hashes das entradas e saidas;
- reserva acessada: falso.

Nao imprima sinais, snapshots completos, scores de todos os candidatos ou material privado.

## Fase 14 - Relatorio de guardrails

Crie, se houver suporte executavel suficiente:

- `backend/reports/routine-intelligence/prospective/guardrails-v1.json`;
- `docs/appono-intelligence-v2-guardrails-2026-09-30.md`.

O JSON deve conter:

- schema e versao;
- hashes das entradas;
- matriz de guardrails;
- cobertura por persona e semana;
- casos aprovados, reprovados e nao aplicaveis;
- classificacao das regressoes;
- hipoteses documentadas;
- itens sem evidencia suficiente;
- candidatos tecnicos para revisao humana;
- limitacoes;
- hash canonico.

O Markdown deve explicar:

- o que e guardrail e o que e metrica de qualidade;
- quais invariantes ja estavam implementados;
- quais testes foram adicionados;
- quais defeitos reais foram corrigidos;
- quais resultados desfavoraveis foram aceitos sem ajuste;
- quais hipoteses ficam para 02/10;
- por que nenhuma V2.1 foi criada hoje.

## Fase 15 - Criterios de correcao

Uma correcao de codigo somente e permitida hoje quando:

- existe violacao reproduzivel de regra previamente declarada;
- a regra vale para casos gerais, nao apenas para um cenario observado;
- ha teste de regressao minimo;
- controle e V1 permanecem inalterados;
- filtros eliminatorios permanecem intactos;
- neutralidade sem historico permanece intacta;
- determinismo permanece intacto;
- a correcao nao depende de placar de validacao;
- a mudanca e documentada como guardrail, nao como recalibracao.

Se a correcao alterar a formula ou o ranking da V2, nao a implemente neste marco. Registre-a como `HIPOTESE_PARA_V2_1` para decisao em 02/10.

## Fase 16 - Preparacao para revisao humana cega

Prepare somente a lista tecnica de casos candidatos para 01/10.

Priorize:

- divergencias V1 versus V2 com grande delta de utilidade;
- divergencias controle versus V2;
- preferencia explicita perdida;
- baixa confianca com mudanca de escolha;
- contradicao;
- repeticao e favorito;
- mudanca gradual;
- pior regressao por persona;
- empates tecnicos representativos.

Registre IDs sinteticos e motivo de inclusao. Nao gere ainda o pacote A/B final, nao randomize A/B, nao revele o modelo e nao marque 01/10 como concluido.

## Fase 17 - Testes obrigatorios

Confirme ou adicione cobertura para:

- schema e hash da matriz de guardrails;
- IDs unicos e campos conhecidos;
- guardrails independentes do nome do modelo;
- preferencia explicita versus inferencia fraca;
- preferencia explicita versus pequena vantagem de preco;
- preferencia explicita versus pequena vantagem de distancia;
- filtros eliminatorios acima de qualquer preferencia;
- zero historico, uma amostra e duas amostras;
- confianca abaixo, igual e acima de `0.25`;
- sinais contraditorios;
- sinal antigo versus recente;
- mudanca gradual;
- repeticao progressiva e limitada;
- favorito consistente nao banido;
- diversidade sem violar aversao;
- consentimento ausente;
- consentimento revogado;
- sinal inativo;
- exclusao logica;
- idempotencia;
- ausencia de vazamento temporal;
- neutralidade sem historico;
- candidato inelegivel nunca chega ao modelo;
- falha e baixa confianca retornam ao controle;
- kill switch e rollout zero;
- explicacao tecnica por lista permitida;
- ausencia de PII e segredos;
- auditoria recusa reserva;
- `--help` e `--check` nao escrevem;
- relatorios anteriores mantem hashes;
- formulas de controle, V1 e V2 mantem hashes.

## Fase 18 - Testes de mutacao e fronteira

Garanta falha explicita para:

- campo desconhecido no guardrail;
- ID duplicado;
- severidade invalida;
- limiar sem origem;
- sinal sem instante;
- sinal futuro;
- sinal duplicado;
- sinal revogado ainda presente no estado;
- confianca `NaN`, infinita, negativa ou acima de 1;
- ajuste V2 fora de `[-8, 8]`;
- candidato inelegivel reintroduzido;
- preferencia medica tratada como gosto;
- explicacao contendo campo privado;
- fallback creditado como decisao nativa;
- conjunto desconhecido;
- tentativa de reserva;
- hash de entrada divergente;
- escrita em relatorio historico;
- tentativa de alterar criterios congelados por argumento.

Mensagens devem usar codigos tecnicos seguros e nao imprimir objetos completos.

## Fase 19 - Ordem de execucao

Siga esta ordem:

1. valide pre-condicoes e hashes;
2. inventarie cobertura existente;
3. congele a matriz de guardrails antes de corrigir codigo;
4. extraia e classifique regressoes sem alterar formula;
5. crie fixtures gerais;
6. execute testes focados e confirme falhas reais;
7. implemente somente guardrails permitidos;
8. execute novamente testes focados;
9. audite desenvolvimento em modo somente leitura;
10. audite validacao sem usar seus resultados para ajustar formula;
11. gere relatorios de guardrail;
12. execute `--check` para provar reproducibilidade;
13. execute suite, builds, lint e diff;
14. produza checkpoint e atualize apenas 30/09 no calendario.

Se uma hipotese exigir mudanca de ranking, pare no registro da hipotese. Nao avance para V2.1.

## Fase 20 - Verificacao obrigatoria

Descubra os comandos reais antes de executar. Rode os equivalentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem:

```text
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run evaluate:rotina:longitudinal --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Quando implementada, execute a auditoria de guardrails em desenvolvimento, validacao e `all`, primeiro sem escrita e depois com escrita explicita somente nos destinos novos. Rode os testes focados ao menos tres vezes.

Nao execute:

- simulacao longitudinal em `--write`;
- simulacao historica;
- reserva historica ou prospectiva;
- scripts sombra remotos;
- Supabase remoto;
- seed, pagamento, e-mail, migration ou deploy.

## Fase 21 - Auditoria estatica

Varra codigo, fixtures e relatorios novos procurando:

- e-mail;
- telefone;
- endereco;
- latitude ou longitude exata;
- JWT;
- access token;
- refresh token;
- `service_role`;
- senha;
- alergia ou condicao medica usada como preferencia;
- conteudo de agenda;
- sinal individual;
- material da reserva;
- importacao de banco, HTTP ou rota no modulo puro;
- identificador de modelo dentro da regra independente;
- peso novo sem origem.

Analise falsos positivos individualmente. Nao esconda resultados por exclusoes amplas.

## Fase 22 - Documentacao do Dia 30

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-30.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e real;
3. confirmacao de encerramento do Dia 29;
4. `HEAD` e estado inicial do Git;
5. hashes preservados;
6. inventario de cobertura anterior;
7. versao e hash da matriz de guardrails;
8. taxonomia de regressoes;
9. casos analisados por persona;
10. guardrails comprovados;
11. lacunas encontradas;
12. correcoes implementadas e justificativa;
13. mudancas rejeitadas por configurarem recalibracao;
14. preferencia explicita e pouca evidencia;
15. contradicao e mudanca gradual;
16. repeticao, diversidade e favoritos;
17. consentimento, revogacao e idempotencia;
18. filtros eliminatorios;
19. politica de fallback e rollout;
20. explicacoes e privacidade;
21. auditoria de desenvolvimento;
22. auditoria de validacao;
23. arquivos criados ou alterados;
24. comandos e resultados;
25. hashes das novas saidas;
26. confirmacao de que formulas nao mudaram;
27. confirmacao de que nenhuma reserva foi acessada;
28. confirmacao de rollout publico zero;
29. limitacoes sinteticas;
30. casos preparados para 01/10;
31. hipoteses reservadas para 02/10;
32. entrada exata do proximo marco.

Atualize o calendario somente depois de cumprir os criterios. Marque apenas 30/09 como concluido. Nao marque revisao humana, V2.1, reserva, homologacao ou release como concluidos.

## Criterios de encerramento de 30/09

O marco esta concluido somente quando:

- Dia 29 continuar aprovado e verificavel;
- hashes dos brutos, snapshots e metricas permanecerem intactos;
- matriz de guardrails estiver versionada e validada;
- regressoes prioritarias estiverem classificadas;
- fixtures gerais reproduzirem as propriedades relevantes;
- preferencia explicita estiver protegida contra inferencia fraca;
- pouca evidencia e confianca minima estiverem cobertas;
- contradicao e mudanca gradual estiverem testadas;
- repeticao, diversidade e favoritos estiverem testados;
- consentimento, revogacao, inatividade e idempotencia estiverem testados;
- grupo sem historico permanecer neutro;
- filtros eliminatorios continuarem soberanos;
- politica de fallback e kill switch estiver coberta;
- explicacao tecnica estiver limitada a campos permitidos;
- auditoria de guardrails for reproduzivel e sem PII;
- nenhuma mudanca configurar recalibracao da V2;
- lista tecnica para revisao cega estiver preparada sem revelar modelos;
- testes focados passarem tres vezes;
- suite, builds, lint e `git diff --check` passarem;
- reserva prospectiva continuar selada;
- rollout publico permanecer zero;
- checkpoint de 30/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `GUARDRAILS_CONCLUIDOS`: invariantes, regressoes e auditoria possuem cobertura executavel;
- `GUARDRAILS_CONCLUIDOS_COM_CORRECOES`: defeitos gerais de guardrail foram corrigidos sem recalibracao;
- `GUARDRAILS_PARCIAIS`: parte das regras possui evidencia, mas faltam revogacao, privacidade, fallback ou reproducibilidade;
- `GUARDRAILS_BLOQUEADOS`: uma violacao de seguranca, consentimento, elegibilidade ou integridade impede continuar.

Um resultado de qualidade desfavoravel sem violacao de guardrail nao bloqueia este marco. Registre-o como hipotese ou limitacao.

Nao declare `IA_PRONTA_EM_HOMOLOGACAO`, nao aprove V2.1 e nao promova a V2.

## Aceleracao segura

Depois de concluir 30/09, pode ficar marcado como `PREPARADO` para 01/10:

- lista balanceada de desacordos;
- contexto nao sensivel;
- alternativas elegiveis A e B;
- motivos estruturados de revisao;
- IDs sinteticos;
- regra de amostragem;
- campos proibidos no pacote cego;
- testes que detectem nome do modelo, score, confianca e ordem nao randomizada.

Nao pode ficar marcado como concluido:

- randomizacao A/B final;
- pacote cego final;
- julgamento humano;
- resultado agregado da revisao;
- V2.1;
- reserva;
- integracao real;
- homologacao ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. confirmacao de que nada ficou pendente no Dia 29;
3. arquivos criados ou alterados;
4. versao e hash dos guardrails;
5. regressões analisadas e classificacoes;
6. guardrails existentes confirmados;
7. guardrails novos ou endurecidos;
8. correcoes aceitas e mudancas rejeitadas;
9. preferencia explicita e pouco historico;
10. contradicao e mudanca gradual;
11. repeticao, diversidade e favoritos;
12. consentimento, revogacao e idempotencia;
13. filtros eliminatorios e universo comum;
14. fallback, kill switch e rollout;
15. explicacao tecnica e privacidade;
16. auditoria de desenvolvimento e validacao;
17. testes, builds, lint e diff;
18. hashes preservados e novos;
19. confirmacao de que controle, V1 e V2 nao foram recalibrados;
20. confirmacao de que nenhuma reserva foi acessada;
21. confirmacao de rollout publico zero;
22. limitacoes por ausencia de clientes reais;
23. casos preparados para revisao cega;
24. hipoteses reservadas para a decisao de 02/10;
25. entrada exata do proximo marco: gerar o pacote A/B cego, randomizado e livre de identificadores de modelo.

Nao confunda guardrail com melhoria de placar, teste de regressao com validacao comercial, confianca com acerto ou uma hipotese com autorizacao para alterar a V2. O objetivo de 30/09 e impedir que comportamentos tecnicamente perigosos avancem, tornar as regressoes reproduziveis e preparar uma revisao humana honesta sem consumir a reserva nem ajustar o modelo contra a propria avaliacao.
