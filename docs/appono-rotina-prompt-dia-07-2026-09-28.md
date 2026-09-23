# Prompt do Dia 7 - Simulacao longitudinal prospectiva da Appono Intelligence

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **28 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e **implementar e executar a simulacao longitudinal prospectiva**, percorrendo seis semanas virtuais para cada persona e comparando `deterministico-v3`, `appono-intelligence-v1` e `appono-intelligence-v2` sobre os mesmos candidatos elegiveis.

Este e o primeiro marco que pode executar os modelos sobre os snapshots prospectivos de desenvolvimento e validacao. A execucao deve preservar isolamento por modelo, causalidade temporal, consentimento, idempotencia, neutralidade sem historico e falha segura. A reserva prospectiva continua proibida.

Nao entregue apenas analise, pseudocodigo ou plano. Inspecione o estado real do repositorio, confirme as pre-condicoes, implemente o executor longitudinal, adicione testes, execute desenvolvimento e validacao, gere relatorios brutos reproduziveis e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data planejada: `28/09/2026`.

Entrega prevista:

> Simulacao longitudinal: seis ou mais semanas virtuais por persona.

O dia somente pode ser encerrado quando estiver comprovado que:

- as dez personas foram processadas por seis semanas;
- cada persona possui cinco decisoes por semana;
- controle, V1 e V2 receberam os mesmos candidatos elegiveis em cada cenario;
- cada modelo manteve estado longitudinal independente;
- uma reacao somente influenciou decisoes posteriores;
- somente sinais sinteticos, ativos, consentidos e anteriores foram elegiveis;
- o grupo sem historico permaneceu sem personalizacao;
- falha de V1 ou V2 nao interrompeu o controle nem os outros modelos;
- desenvolvimento e validacao produziram relatorios separados;
- os relatorios sao deterministas, versionados e livres de PII;
- nenhuma reserva foi aberta, lida, reconstruida ou materializada;
- nenhuma formula foi recalibrada depois da observacao dos resultados.

## Pre-condicao do Dia 27

Antes de editar ou executar modelos, confirme:

- decisao de 27/09 igual a `PRONTIDAO_LONGITUDINAL_APROVADA` ou `PRONTIDAO_LONGITUDINAL_APROVADA_COM_CORRECOES`;
- checkpoint de 27/09 presente e coerente;
- contrato longitudinal `routine-longitudinal-contract-v1` presente;
- ensaio seco estrutural aprovado para desenvolvimento e validacao;
- testes focados do contrato aprovados em tres execucoes;
- desenvolvimento com 300 cenarios;
- validacao com 300 cenarios;
- dez personas, seis semanas e cinco decisoes por semana;
- hash do snapshot de desenvolvimento igual a `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c`;
- hash do snapshot de validacao igual a `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6`;
- intersecao zero entre desenvolvimento e validacao;
- reserva historica marcada como `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva marcada como `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- nenhum snapshot ou relatorio congelado modificado no Git;
- suite, builds, lint e `git diff --check` sem regressao conhecida.

Se uma pre-condicao falhar, interrompa a simulacao, corrija apenas a infraestrutura necessaria e documente a divergencia. Nao atualize hashes, snapshots ou checkpoints para esconder alteracoes.

## Estado conhecido a confirmar

Trate os itens abaixo como hipoteses a serem verificadas no repositorio:

- controle oficial `deterministico-v3`;
- referencia historica `appono-intelligence-v1`;
- desafiante `appono-intelligence-v2`;
- regua independente `persona-utility-v1`;
- personas `personas-sinteticas-v1`;
- gerador `routine-scenario-generator-v1`;
- snapshots `routine-scenario-snapshots-v1`;
- contrato longitudinal `routine-longitudinal-contract-v1`;
- runtime minimo Node.js 22;
- 220 testes do backend aprovados ao final do Dia 27;
- nenhuma simulacao prospectiva executada ate o inicio deste marco;
- nenhuma metrica comparativa prospectiva produzida;
- alteracoes dos Dias 26 e 27 ainda podem estar sem commit e devem ser preservadas.

Registre qualquer divergencia real. Nao copie estes valores para o checkpoint sem conferencia.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22 a 27/09;
- prompts dos Dias 1 a 6;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/reserve-commitment-v1.json`;
- `backend/experiments/routine-intelligence/scenarios/manifest-v1.json`;
- snapshots de desenvolvimento e validacao;
- relatorios historicos existentes, sem reexecuta-los;
- `backend/src/domain/routine-scoring.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-partitions.js`;
- `backend/src/domain/routine-intelligence-scenario-generator.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- scripts de preparacao, geracao, auditoria, simulacao e avaliacao;
- testes de manifesto, personas, particoes, gerador, contrato longitudinal, controle, V1, V2, simulacao historica e politica.

Leia o simulador historico apenas como referencia tecnica. Nao o modifique para alterar resultados antigos e nao grave resultados prospectivos nos arquivos historicos.

Este marco nao exige Supabase, banco remoto, autenticacao, migration, rota HTTP ou frontend funcional.

## Regras inegociaveis

1. Preserve todas as alteracoes locais e os artefatos congelados.
2. Nao altere formulas, pesos, limites, desempates ou identificadores do controle, V1 ou V2.
3. Nao altere a funcao de utilidade nem a politica de reacao das personas.
4. Nao regenere snapshots sem defeito estrutural comprovado e documentado.
5. Nao use resultados de desenvolvimento ou validacao para recalibrar qualquer modelo neste marco.
6. Nao abra, leia, materialize, reconstrua ou tente inferir a reserva prospectiva.
7. Nao reexecute a reserva historica.
8. Nao misture relatorios prospectivos com relatorios historicos.
9. Nao entregue candidatos inelegiveis a nenhum modelo.
10. Nao permita que um sinal da decisao atual influencie essa mesma decisao.
11. Nao compartilhe estado mutavel entre modelos, personas ou conjuntos.
12. Nao credite a um modelo uma escolha produzida pelo fallback.
13. Nao trate conversao simulada como pedido, reserva, pagamento ou comportamento real.
14. Nao grave resultados em banco nem chame HTTP, pagamento, e-mail ou servico remoto.
15. Nao introduza PII, dados medicos, financeiros, credenciais ou conteudo de agenda.
16. Nao habilite rollout publico nem altere sugestoes visiveis ao cliente.
17. Nao declare superioridade, piloto aprovado ou IA pronta neste marco.
18. Nao faca commit, push, deploy, seed remoto ou migration remota.
19. Toda saida deve ser reproduzivel a partir dos artefatos congelados.
20. Qualquer falha deve ser explicita, segura e atribuida ao modelo correto.

## Escopo permitido

Este marco pode:

- implementar um executor longitudinal prospectivo isolado;
- criar adaptadores minimos para controle, V1 e V2;
- executar os tres modelos em desenvolvimento e validacao;
- calcular utilidade externa de cada candidato pela regua independente;
- gerar reacoes sinteticas por ramificacao de modelo;
- propagar sinais consentidos somente para decisoes futuras;
- registrar escolhas nativas, fallback, erros e diagnosticos tecnicos;
- gerar relatorios brutos e agregados tecnicos sem conclusao de qualidade;
- provar determinismo por repeticao;
- corrigir defeitos gerais do executor ou adaptadores;
- documentar riscos e preparar a avaliacao comparativa de 29/09.

Este marco nao pode:

- alterar o ranking para melhorar o placar;
- escolher uma V2.1;
- flexibilizar criterios congelados;
- executar reserva;
- integrar V2 ao fluxo real do cliente;
- promover modelo;
- interpretar validacao como evidencia de mercado;
- produzir alegacao de validacao por clientes reais.

## Fase 1 - Inventario e congelamento da execucao

Registre antes da primeira simulacao:

- branch, `HEAD` e estado do Git;
- hash do diff rastreado e dos arquivos novos relevantes;
- versoes de Node.js e npm;
- hashes de personas, particoes, snapshots e contrato longitudinal;
- identificadores exatos dos tres modelos;
- versao da regua independente;
- versao proposta do executor longitudinal;
- quantidade esperada de personas, semanas, cenarios e decisoes;
- campos permitidos no relatorio bruto;
- regras de desempate existentes;
- regra de falha segura;
- regra temporal dos sinais;
- destinos de desenvolvimento e validacao;
- estado da reserva;
- estado das feature flags.

Crie, se necessario, um manifesto prospectivo separado, por exemplo:

`backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`

O manifesto deve ser criado antes da observacao dos placares e registrar:

- `schema_version`;
- `protocol_version`;
- `executor_version`;
- modelos e suas versoes;
- versao da utilidade externa;
- hash das personas;
- hash das particoes;
- hashes dos snapshots autorizados;
- versao do contrato comum;
- ordem longitudinal;
- politica de estado;
- politica de sinais;
- politica de fallback;
- schema do relatorio;
- comandos autorizados;
- proibicao da reserva;
- ausencia de PII;
- criterios de reproducibilidade.

Nao inclua resultados, vencedores ou metricas observadas nesse manifesto.

## Fase 2 - Arquitetura do executor prospectivo

Crie um modulo novo e versionado, por exemplo:

`backend/src/domain/routine-intelligence-longitudinal-simulation.js`

O modulo deve ser separado do simulador historico. Ele pode importar:

- contrato longitudinal aprovado no Dia 27;
- scoring oficial do controle;
- V1 congelada;
- V2 congelada;
- utilidade e reacao das personas;
- serializacao e hash canonicos existentes.

Ele nao pode importar:

- rotas HTTP;
- Supabase ou banco;
- autenticacao;
- politica de rollout real;
- relatorios historicos como entrada;
- reserva prospectiva;
- qualquer modulo que recalibre pesos.

Exporte funcoes puras ou com efeitos explicitamente isolados para:

- validar protocolo;
- adaptar entrada comum para cada modelo;
- executar um modelo com falha isolada;
- avaliar utilidade externa;
- gerar reacao sintetica;
- criar sinal futuro idempotente;
- aplicar transicao de estado;
- processar uma persona em ordem temporal;
- processar um conjunto completo;
- construir relatorio canonico;
- calcular hash do relatorio.

Nenhuma funcao de dominio deve escrever arquivo ou consultar o relogio real.

## Fase 3 - Entrada justa para os modelos

Para cada cenario:

1. valide o snapshot e seu hash;
2. construa a entrada comum pelo contrato do Dia 27;
3. selecione somente sinais anteriores elegiveis;
4. derive o estado anterior especifico da persona e do modelo;
5. clone a entrada para cada consumidor;
6. adapte somente nomes e formatos exigidos pela API congelada do modelo;
7. execute todos sobre a mesma lista ordenada de candidatos elegiveis;
8. registre o hash da entrada comum e da lista de candidatos.

Comprove que:

- o conjunto de IDs de candidatos e identico nos tres modelos;
- a ordem inicial e identica;
- nenhum candidato inelegivel aparece;
- um adaptador nao remove candidato silenciosamente;
- um adaptador nao adiciona preferencia inexistente;
- mutacao interna de um modelo nao altera outro;
- o snapshot original permanece imutavel;
- o hash comum independe do nome do modelo;
- campos ausentes ou desconhecidos falham antes do ranking.

Os modelos podem produzir ordenacoes diferentes. Eles nao podem receber universos diferentes.

## Fase 4 - Adaptador do controle

Implemente o adaptador do `deterministico-v3` usando exclusivamente as funcoes oficiais existentes, incluindo `pontuarCandidato`, `penalidadeRepeticao` e o desempate oficial aplicavel.

O adaptador deve:

- mapear os atributos sinteticos para o contrato oficial sem inventar informacao;
- usar somente candidatos previamente elegiveis;
- considerar a sequencia anterior do proprio controle;
- preservar os limites e desempates existentes;
- produzir score base por candidato;
- escolher deterministicamente;
- registrar a versao `deterministico-v3`;
- falhar quando o snapshot nao puder representar uma entrada obrigatoria.

Nao derive favorito, preferencia explicita ou disponibilidade a partir do resultado esperado. Use somente os campos declarados pela persona e pelo snapshot.

## Fase 5 - Adaptador da V1

Implemente o adaptador da `appono-intelligence-v1` sem alterar sua formula.

O adaptador deve:

- partir do mesmo score de controle calculado para o candidato;
- mapear somente sinais elegiveis anteriores para o formato aceito pela V1;
- passar orcamento, raio, janela e contexto permitidos quando exigidos;
- manter o estado longitudinal exclusivo da V1;
- somar o ajuste da V1 conforme o contrato congelado;
- preservar limites e desempates;
- registrar amostras e confianca quando a API os fornecer;
- registrar erro tecnico sem interromper controle ou V2.

Nao altere a V1 para acomodar o simulador. O adaptador deve acomodar o contrato da V1.

## Fase 6 - Adaptador da V2

Implemente o adaptador da `appono-intelligence-v2` sem alterar sua formula.

O adaptador deve:

- partir do mesmo score de controle do candidato;
- mapear sinais normalizados, consentidos e anteriores;
- usar o instante virtual do cenario como referencia temporal explicita;
- fornecer a sequencia anterior exclusiva da V2;
- preservar ajuste entre `-8` e `+8`;
- preservar suavizacao, decaimento, consistencia e protecao contra repeticao;
- registrar ajuste, confianca, volume efetivo e diagnosticos tecnicos permitidos;
- manter ajuste e confianca zero sem historico elegivel;
- registrar erro tecnico sem bloquear controle ou V1.

Nao use o relogio real. Nao injete sinais da decisao corrente antes do ranking.

## Fase 7 - Ordenacao e desempate

Use uma ordenacao unica e documentada para os resultados dos modelos:

1. score total descendente;
2. criterio oficial de desempate existente;
3. identificador sintetico estavel como ultimo desempate tecnico.

Requisitos:

- mesma entrada e estado produzem a mesma escolha;
- empates nao dependem da ordem acidental do array;
- `Array.sort` nao recebe comparador inconsistente;
- valores `NaN`, infinitos ou ausentes falham;
- o score base do controle e identico quando reutilizado por V1 e V2;
- ajustes sao registrados separadamente do score base;
- o relatorio diferencia score nativo, ajuste e score total.

Nao use utilidade da persona para desempatar o ranking. Ela e a regua externa, nao parte dos modelos.

## Fase 8 - Utilidade externa e melhor opcao

Antes de observar a escolha do modelo, avalie todos os candidatos elegiveis pela funcao independente `avaliarUtilidadePersona`.

Para cada cenario, registre:

- utilidade externa de cada candidato, em estrutura interna temporaria;
- maior utilidade elegivel;
- IDs empatados na maior utilidade, se houver;
- utilidade da escolha nativa do modelo;
- arrependimento igual a melhor utilidade menos utilidade escolhida;
- contribuicoes permitidas para auditoria tecnica.

Requisitos:

- a funcao de utilidade nao recebe nome do modelo;
- scores dos modelos nao entram na utilidade;
- o melhor candidato nao altera a escolha do modelo;
- arrependimento nunca e negativo alem de tolerancia numerica;
- empate intencional e preservado;
- candidato inelegivel nunca participa da melhor utilidade;
- ruido sintetico usa somente a semente congelada;
- mesma entrada produz a mesma utilidade.

O relatorio bruto pode conter utilidade da escolha e melhor utilidade. Evite incluir detalhes excessivos de todos os candidatos quando nao forem necessarios para o Dia 29.

## Fase 9 - Ramificacoes longitudinais por modelo

Cada modelo deve possuir sua propria trajetoria contrafactual.

Estrutura conceitual:

```text
dataset + persona + model_version -> estado longitudinal exclusivo
```

Para cada escolha nativa:

1. avalie a utilidade da opcao escolhida;
2. gere a reacao da persona pela politica independente;
3. registre a escolha na sequencia daquele modelo;
4. crie, quando permitido, um sinal sintetico futuro;
5. marque o instante e a chave idempotente;
6. disponibilize o sinal somente para cenarios posteriores;
7. atualize contadores de repeticao apenas naquela ramificacao.

Consequencia metodologica obrigatoria:

- no primeiro cenario, os modelos compartilham entrada exogena equivalente;
- depois, escolhas diferentes podem gerar historicos diferentes;
- a comparacao longitudinal mede politicas completas e suas trajetorias;
- nao descreva semanas posteriores como A/B com historico identico;
- registre separadamente o hash da entrada exogena e o hash do estado do modelo.

## Fase 10 - Reacoes e sinais sinteticos

Use `reagirPersona` para transformar utilidade relativa em reacao offline.

Reacoes permitidas:

- `APROVACAO`;
- `RECUSA`;
- `ALTERNATIVA`;
- `EDICAO`;
- `CONVERSAO_SIMULADA`, apenas como indicador offline.

Cada sinal futuro deve conter somente campos sinteticos necessarios, como:

- `synthetic_offline: true`;
- `active`;
- `consent_valid`;
- `occurred_at`;
- `persona_id`;
- `scenario_id` de origem;
- `model_version` da ramificacao;
- `event_type`;
- referencias sinteticas de categoria, restaurante ou produto;
- chave idempotente estavel.

A chave idempotente deve incluir, no minimo:

```text
dataset + persona + model_version + scenario_id + event_type
```

Requisitos:

- duplicata nao aumenta amostras;
- sinal da decisao atual nao entra na mesma decisao;
- sinal futuro nao retroage;
- sinal sem consentimento permanece auditavel, mas nao personaliza;
- sinal inativo nao personaliza;
- `controle_sem_historico` nunca acumula sinal de aprendizado;
- conversao simulada nunca chama reserva, pedido, pagamento ou banco;
- edicao ensina somente atributos realmente alterados;
- aprovacao, recusa e alternativa permanecem eventos distintos.

## Fase 11 - Grupo sem historico

Para `controle_sem_historico`, comprove em todas as semanas e modelos:

- entrada exogena valida;
- lista de sinais de personalizacao vazia;
- nenhuma reacao convertida em sinal de aprendizado;
- ajuste da V2 igual a zero;
- confianca da V2 igual a zero;
- escolha da V2 igual a escolha do controle quando ambos executam com sucesso;
- estado sem preferencias inferidas;
- nenhuma amostra efetiva acumulada.

A utilidade externa ainda pode avaliar a qualidade da opcao para fins da regua. Isso nao cria historico para o modelo.

## Fase 12 - Falha segura por modelo

Isole toda execucao de modelo.

Quando V1 ou V2 falhar:

- registre `native_choice: null`;
- registre codigo tecnico seguro;
- mantenha os outros modelos em execucao;
- registre a escolha do controle como `effective_choice` somente para demonstrar fallback operacional;
- marque `fallback_used: true`;
- nao atribua utilidade nativa ou vitoria ao modelo que falhou;
- nao gere sinal como se o modelo tivesse escolhido nativamente;
- continue a trajetoria com regra explicitamente congelada e documentada.

Quando o controle falhar:

- registre falha eliminatoria da infraestrutura experimental;
- nao invente escolha oficial;
- nao use V1 ou V2 como substituto silencioso;
- nao gere reacao daquele cenario;
- continue a coleta de erros quando seguro;
- classifique o conjunto como invalido para aceitacao ate a correcao.

Falhas esperadas de teste devem poder ser injetadas sem editar formulas.

## Fase 13 - Relatorio bruto prospectivo

Crie um schema de relatorio novo, por exemplo:

`routine-longitudinal-raw-report-v1`

Destinos recomendados:

- `backend/reports/routine-intelligence/prospective/desenvolvimento-v1.json`;
- `backend/reports/routine-intelligence/prospective/validacao-v1.json`;
- `backend/reports/routine-intelligence/prospective/manifest-v1.json`.

Nao sobrescreva:

- relatorios historicos;
- snapshots;
- manifesto de 22/09;
- reserva historica;
- qualquer artefato de reserva prospectiva.

Metadados minimos:

- schema e versao do executor;
- protocolo;
- dataset;
- hashes de entrada;
- hashes das personas e particoes;
- versoes dos modelos e da regua;
- total de personas, semanas, cenarios e execucoes;
- regra temporal;
- regra de fallback;
- estado da reserva;
- indicacao explicita de dados sinteticos.

Registro minimo por decisao e modelo:

- `dataset_id`;
- `persona_id`;
- `virtual_week`;
- `virtual_day`;
- `scenario_index`;
- `scenario_id`;
- `instant_utc`;
- `common_input_sha256`;
- `candidate_set_sha256`;
- `state_before_sha256`;
- `state_after_sha256`;
- `model_version`;
- `native_choice_candidate_id`;
- `effective_choice_candidate_id`;
- `fallback_used`;
- `base_score` da escolha;
- `adjustment` quando aplicavel;
- `total_score`;
- `confidence` quando aplicavel;
- `effective_samples` quando aplicavel;
- `best_external_utility`;
- `chosen_external_utility`;
- `regret`;
- `reaction_type`;
- `signal_created`;
- `technical_error_code`;
- guardrails tecnicos.

O relatorio nao deve conter:

- nome ou e-mail de pessoa;
- endereco ou coordenada exata;
- alergia ou dado medico;
- token ou credencial;
- conteudo de agenda;
- senha;
- objeto completo de ambiente;
- semente privada da reserva;
- stack trace com caminhos sensiveis;
- conclusao de vencedor final.

Use serializacao canonica. Evite `generated_at` baseado no relogio real; use uma referencia congelada ou omita campos volateis.

## Fase 14 - Resumos tecnicos permitidos

O Dia 28 pode gerar resumos tecnicos para verificar completude, sem realizar a avaliacao comparativa final do Dia 29.

Resumo permitido:

- total de cenarios;
- total de execucoes por modelo;
- total de falhas por modelo;
- total de fallbacks;
- total de sinais elegiveis e ignorados;
- cobertura por persona e semana;
- quantidade de reacoes por tipo;
- quantidade de divergencias entre escolhas;
- zero ou quantidade de violacoes eliminatorias;
- hashes dos relatorios;
- verificacoes de determinismo.

Resumo adiado para 29/09:

- declaracao de vencedor;
- comparacao consolidada de utilidade;
- comparacao consolidada de arrependimento;
- regressao maxima por persona;
- concentracao e diversidade comparativas;
- recomendacao de V2.1;
- decisao de promocao.

Se metricas brutas forem necessarias para validar o schema, registre-as sem interpretar o resultado.

## Fase 15 - CLI de simulacao

Crie um comando local explicito, por exemplo:

`backend/scripts/simulate-routine-intelligence-longitudinal.js`

Script sugerido no `backend/package.json`:

```text
simulate:rotina:longitudinal
```

A CLI deve:

- aceitar somente `desenvolvimento_v1` ou `validacao_v1`;
- recusar qualquer argumento contendo `reserva`;
- validar hashes antes de executar;
- exigir `--write` para gravar relatorio;
- usar modo `--check` para recomputar e comparar sem escrita;
- oferecer `--help` sem escrita;
- escolher destino pelo descritor validado, nao por caminho arbitrario;
- recusar sobrescrita de relatorio incompatível;
- escrever de forma atomica quando permitido;
- imprimir apenas resumo agregado seguro;
- retornar codigo diferente de zero em falha;
- nunca ler `.env` para executar a simulacao.

Argumentos proibidos:

- caminho livre para reserva;
- semente arbitraria;
- peso de modelo;
- limiar de confianca diferente do congelado;
- alteracao de persona;
- exclusao de casos desfavoraveis;
- selecao de vencedor.

## Fase 16 - Ordem de execucao

Siga esta ordem:

1. audite e congele o protocolo;
2. implemente executor, adaptadores e testes;
3. execute testes focados sem gerar relatorio;
4. execute desenvolvimento em modo de verificacao;
5. execute desenvolvimento com escrita explicita;
6. repita desenvolvimento em `--check` e confirme igualdade;
7. corrija somente defeitos gerais de infraestrutura ou contrato;
8. congele o codigo candidato para validacao por hash local;
9. execute validacao com escrita explicita;
10. repita validacao em `--check` e confirme igualdade;
11. nao altere pesos ou formulas depois de observar validacao;
12. execute suite completa, builds, lint e diff;
13. produza checkpoint e atualize apenas o marco de 28/09.

Se a validacao revelar defeito estrutural, corrija-o de forma geral, invalide explicitamente a execucao anterior e regenere o relatorio com trilha documentada. Nao trate resultado de qualidade desfavoravel como defeito estrutural.

## Fase 17 - Testes obrigatorios

Adicione testes para comprovar:

- protocolo prospectivo possui schema e hashes corretos;
- reserva nao aparece entre datasets executaveis;
- exatamente dez personas sao processadas;
- exatamente seis semanas por persona sao processadas;
- exatamente cinco decisoes por semana sao processadas;
- existem 300 cenarios por conjunto;
- existem 900 execucoes de modelo por conjunto;
- os tres modelos recebem IDs e ordem de candidatos identicos;
- nenhum candidato inelegivel e entregue;
- entrada comum e snapshot permanecem imutaveis;
- controle usa somente formula oficial;
- V1 permanece congelada;
- V2 permanece dentro do limite de ajuste;
- score base e identico para controle, V1 e V2 no mesmo candidato;
- ordenacao e desempate sao deterministicos;
- utilidade externa nao importa nem recebe nome do modelo;
- melhor utilidade nao influencia escolha;
- arrependimento e calculado corretamente;
- estado e isolado por conjunto, persona e modelo;
- uma ramificacao nao altera outra;
- sinal atual somente entra em cenario posterior;
- sinal futuro nunca retroage;
- consentimento invalido impede personalizacao;
- sinal inativo impede personalizacao;
- chave idempotente duplicada conta uma vez;
- grupo sem historico nao acumula sinal;
- V2 permanece neutra sem historico;
- falha de V1 nao interrompe controle ou V2;
- falha de V2 nao interrompe controle ou V1;
- fallback nao e contado como escolha nativa;
- falha do controle invalida o cenario sem fabricar escolha;
- conversao simulada nao chama banco, HTTP, pedido, reserva ou pagamento;
- desenvolvimento e validacao possuem destinos distintos;
- relatorio e canonico e reproduzivel;
- mudanca de entrada altera o hash do relatorio;
- ordem de chaves equivalente nao altera o hash;
- `--help` nao escreve arquivos;
- `--check` nao escreve arquivos;
- tentativa de reserva falha;
- relatorios nao contem PII ou segredos;
- artefatos historicos continuam com os mesmos hashes;
- rollout publico permanece zero.

## Fase 18 - Testes de mutacao e falha segura

Inclua fixtures ou injecao controlada para falhar em:

- hash de snapshot divergente;
- protocolo divergente;
- dataset desconhecido;
- tentativa de reserva;
- modelo desconhecido;
- persona desconhecida;
- semana ausente ou duplicada;
- cenario processado fora de ordem;
- candidato elegivel ausente;
- candidato inelegivel presente;
- candidato duplicado;
- score `NaN` ou infinito;
- escolha fora do conjunto elegivel;
- sinal sem consentimento;
- sinal futuro;
- sinal duplicado;
- estado compartilhado;
- reprocessamento da mesma decisao;
- relatorio com campo desconhecido;
- destino de escrita historico;
- tentativa de sobrescrita incompatível.

As mensagens devem usar codigos tecnicos seguros e nao imprimir snapshots completos, sinais individuais ou caminhos com informacao sensivel.

## Fase 19 - Reprodutibilidade

Comprove para cada conjunto:

- duas execucoes com os mesmos artefatos produzem o mesmo conteudo canonico;
- os hashes dos relatorios sao identicos;
- totais por persona, semana e modelo sao identicos;
- escolhas, reacoes, sinais e erros sao identicos;
- nenhum campo depende de data atual, timezone local ou ordem do sistema de arquivos;
- a execucao funciona em caminhos Windows sem persistir separadores dependentes da plataforma;
- o resultado nao depende da ordem original dos cenarios no array;
- a execucao nao altera snapshots, manifestos ou checkpoints anteriores.

Se existir campo volatil inevitavel, mantenha-o fora do conteudo canonico e documente exatamente sua finalidade.

## Fase 20 - Verificacao obrigatoria

Descubra primeiro os nomes reais dos scripts. Execute os equivalentes existentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem:

```text
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
```

Depois de implementar a CLI, execute os comandos reais equivalentes a:

```text
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --write
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --write
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
```

Rode os testes focados do executor ao menos tres vezes para detectar flakiness.

Nao execute:

- simulador historico para sobrescrever resultados;
- avaliador comparativo final do Dia 29;
- reserva historica ou prospectiva;
- scripts sombra remotos;
- Supabase remoto;
- seed, pagamento, e-mail ou deploy.

## Fase 21 - Auditoria estatica

Varra codigo e relatorios novos procurando:

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
- semente ou sal da reserva;
- importacao de rota, banco ou HTTP no executor;
- nome de modelo dentro da utilidade da persona;
- resultado de validacao dentro do protocolo congelado.

Analise falsos positivos individualmente. Nao esconda achados com exclusoes amplas.

## Fase 22 - Documentacao do Dia 28

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-28.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e data real;
3. pre-condicoes verificadas;
4. `HEAD` e estado inicial do Git;
5. protocolo e executor congelados;
6. hashes de personas, particoes e snapshots;
7. arquitetura do executor;
8. adaptacao de controle, V1 e V2;
9. prova de candidatos comuns;
10. politica de ordenacao e desempate;
11. politica de estado por ramificacao;
12. barreira temporal, consentimento e idempotencia;
13. politica de falha e fallback;
14. schema dos relatorios;
15. totais de desenvolvimento;
16. totais de validacao;
17. falhas e violacoes tecnicas;
18. hashes dos relatorios prospectivos;
19. evidencia de reproducibilidade;
20. testes, builds, lint e diff;
21. arquivos criados ou alterados;
22. confirmacao de que formulas nao foram alteradas;
23. confirmacao de que nenhuma reserva foi acessada;
24. confirmacao de rollout publico zero;
25. limitacoes da simulacao sintetica;
26. itens marcados `PREPARADO` para 29/09;
27. entrada exata para a avaliacao comparativa.

Atualize o calendario somente depois de cumprir os criterios. Marque apenas 28/09 como concluido. Nao marque 29/09, V2.1, homologacao ou release como concluidos.

## Criterios de encerramento de 28/09

O marco esta concluido somente quando:

- Dia 27 continuar aprovado e verificavel;
- protocolo prospectivo estiver congelado antes dos resultados;
- executor longitudinal estiver isolado do simulador historico;
- controle, V1 e V2 tiverem adaptadores testados;
- formulas dos tres modelos permanecerem inalteradas;
- desenvolvimento e validacao tiverem 300 cenarios cada;
- cada conjunto tiver 900 execucoes de modelo esperadas, salvo falhas explicitamente registradas;
- dez personas e seis semanas estiverem completas;
- candidatos comuns e elegiveis estiverem comprovados;
- estados por modelo e persona estiverem isolados;
- sinais respeitarem atraso temporal, consentimento e idempotencia;
- grupo sem historico permanecer neutro;
- falhas de desafiante nao interromperem o controle;
- fallback nao for creditado como decisao nativa;
- relatorios brutos estiverem separados, canonicos e sem PII;
- duas execucoes produzirem hashes identicos;
- zero violacoes eliminatorias forem observadas ou o marco for bloqueado;
- suite, builds, lint e `git diff --check` passarem;
- snapshots e artefatos historicos permanecerem intactos;
- reserva prospectiva continuar `SEALED_UNMATERIALIZED`;
- rollout publico permanecer zero;
- checkpoint de 28/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `SIMULACAO_LONGITUDINAL_CONCLUIDA`: desenvolvimento e validacao foram executados de forma completa, justa, reproduzivel e sem violacao eliminatoria;
- `SIMULACAO_LONGITUDINAL_PARCIAL`: o executor funciona, mas um conjunto, modelo ou requisito de reproducibilidade ainda esta incompleto;
- `SIMULACAO_LONGITUDINAL_BLOQUEADA`: existe violacao de elegibilidade, estado, temporalidade, determinismo, seguranca ou integridade que invalida a execucao.

Nao declare `IA_PRONTA_EM_HOMOLOGACAO`, nao aprove V2.1 e nao promova a V2 neste marco.

## Aceleracao segura

Depois de concluir o marco, pode ficar marcado como `PREPARADO` para 29/09:

- leitor validado dos relatorios brutos;
- schema de agregacao por semana e persona;
- calculos puros de taxa de aprovacao, recusa, alternativa e edicao;
- calculos puros de utilidade e arrependimento;
- calculos puros de diversidade, repeticao e concentracao;
- matriz de falhas e guardrails;
- comparador de relatorios com hashes compativeis;
- testes de agregacao com fixtures pequenas.

Nao pode ficar marcado como concluido:

- avaliacao comparativa final;
- diagnostico de derrotas;
- decisao sobre V2.1;
- revisao humana cega;
- reserva;
- integracao ao fluxo real;
- homologacao ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. confirmacao de que nada ficou pendente no Dia 27;
3. arquivos criados ou alterados;
4. versoes e hashes do protocolo e executor;
5. arquitetura da simulacao longitudinal;
6. mapeamento de controle, V1 e V2;
7. prova de candidatos comuns e elegiveis;
8. prova de isolamento das ramificacoes;
9. prova de causalidade temporal, consentimento e idempotencia;
10. resultados tecnicos de desenvolvimento;
11. resultados tecnicos de validacao;
12. falhas, fallbacks e violacoes;
13. evidencia de reproducibilidade;
14. hashes dos relatorios;
15. testes, builds, lint e diff;
16. confirmacao de que formulas e pesos nao mudaram;
17. confirmacao de que nenhuma reserva foi acessada;
18. confirmacao de rollout publico zero;
19. limitacoes por ausencia de clientes reais;
20. trabalho preparado para 29/09;
21. entrada exata do proximo marco: agregar e comparar resultados por semana, persona e modelo sem flexibilizar os criterios congelados.

Nao confunda execucao longitudinal com validacao comercial, reacao sintetica com comportamento real, fallback com acerto do modelo ou divergencia com qualidade. O objetivo de 28/09 e produzir uma base prospectiva justa, causal e reproduzivel para que a avaliacao do dia seguinte consiga medir os modelos sem alterar as regras depois de observar os resultados.
