# Prompt do Dia 6 - Prontidao longitudinal da Appono Intelligence

Voce e um agente senior de engenharia de software, experimentacao, qualidade, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **27 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O dia 27 e a segunda **reserva tecnica** do cronograma. Nao existe nova funcionalidade obrigatoria de produto. Como os marcos anteriores foram antecipados, use este dia para comprovar a prontidao estrutural do pipeline longitudinal que sera implementado em 28/09, corrigindo apenas bloqueadores reais e preparando contratos puros que reduzam risco sem executar os modelos ou observar placares.

Nao entregue apenas analise, pseudocodigo ou uma lista de proximos passos. Inspecione o estado real do repositorio, preserve as correcoes do Dia 26, valide os artefatos congelados, implemente somente contratos estruturais necessarios, adicione testes e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data planejada: `27/09/2026`.

Entrega prevista:

> Reserva tecnica: descanso ou recuperacao de atraso critico.

Como nao existe atraso critico conhecido, o uso permitido deste marco e uma **porta de prontidao para a simulacao longitudinal**. Isso nao transforma 27/09 em simulacao, avaliacao de modelos ou calibracao.

O dia somente pode ser encerrado quando estiver comprovado que:

- nenhuma pendencia bloqueante permaneceu no Dia 26;
- snapshots de desenvolvimento e validacao continuam congelados e validos;
- a reserva prospectiva continua selada e inacessivel;
- existe uma ordem longitudinal canonica e reproduzivel por persona;
- existe um contrato comum de entrada que entrega os mesmos candidatos elegiveis aos tres modelos;
- o contrato nao importa, chama ou pontua nenhum modelo;
- o grupo sem historico permanece neutro;
- sinais sem consentimento ou inativos nao entram no estado de aprendizado futuro;
- nao existe vazamento de semana futura para semana anterior;
- um ensaio seco estrutural pode percorrer os cenarios sem produzir escolha, metrica ou placar;
- o Dia 28 possui uma lista objetiva de implementacao e criterios de falha.

## Estado conhecido a confirmar

Trate os itens abaixo como hipoteses que devem ser conferidas no repositorio:

- branch `main`;
- `HEAD` inicial `7ae90fab4b130b8dea99785231cec1f5e92c1d21`;
- Dia 26 decidido como `RESERVA_TECNICA_APROVADA_COM_CORRECOES`;
- suite completa com 207 testes aprovados;
- runtime executado Node.js `v24.14.0` e minimo documentado Node.js 22;
- gerador `routine-scenario-generator-v1`;
- snapshots `routine-scenario-snapshots-v1`;
- desenvolvimento com 300 cenarios;
- validacao com 300 cenarios;
- seis semanas e cinco decisoes por semana para cada uma das dez personas;
- hash de desenvolvimento `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c`;
- hash de validacao `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6`;
- intersecao zero entre os conjuntos;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- nenhuma simulacao prospectiva ou placar produzido;
- alteracoes do Dia 26 ainda podem estar sem commit e devem ser preservadas.

Se qualquer hipotese divergir, registre a diferenca. Nao altere hashes, snapshots ou documentos para esconder uma divergencia.

## Pre-condicao do Dia 26

Antes de editar, confirme:

- checkpoint de 26/09 presente e coerente;
- os tres defeitos documentados estao realmente corrigidos;
- teste de campo desconhecido passa;
- teste de coercao numerica passa;
- teste de candidato duplicado passa;
- `--help` da CLI funciona sem escrita;
- os dois comandos `--check` passam;
- auditorias de cenarios e particoes passam;
- nenhum snapshot ou relatorio aparece modificado no Git;
- `git diff --check` passa;
- nao existe arquivo materializado da reserva prospectiva.

Se uma pre-condicao falhar, corrija primeiro o Dia 26 e documente. Nao avance para contratos longitudinais sobre uma base instavel.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22 a 26/09;
- prompts dos Dias 1 a 5;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/reserve-commitment-v1.json`;
- `backend/experiments/routine-intelligence/scenarios/manifest-v1.json`;
- snapshots de desenvolvimento e validacao;
- relatorios historicos existentes, sem reexecuta-los;
- `backend/src/domain/routine-intelligence-scenario-generator.js`;
- `backend/src/domain/routine-intelligence-partitions.js`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- scripts de geracao, auditoria, simulacao e avaliacao;
- testes de manifesto, personas, particoes, gerador, simulacao, modelos e politica.

O arquivo `routine-intelligence-simulation.js` e seus relatorios atuais pertencem ao protocolo historico. Leia-os para mapear contratos e riscos, mas nao os execute como se fossem a nova simulacao prospectiva e nao os altere para melhorar resultados conhecidos.

Este marco nao exige Supabase, banco remoto, autenticacao, migration ou frontend funcional.

## Regras inegociaveis

1. Preserve todas as alteracoes locais existentes.
2. Nao altere controle, V1, V2, pesos, limites ou desempates.
3. Nao altere a utilidade independente das personas.
4. Nao regenere snapshots sem defeito estrutural comprovado.
5. Nao execute controle, V1 ou V2 sobre os snapshots prospectivos.
6. Nao execute `simulate:rotina:intelligence` nem `evaluate:rotina:intelligence`.
7. Nao calcule vitorias, derrotas, utilidade, arrependimento ou confianca por modelo.
8. Nao abra, materialize, leia ou reconstrua a reserva prospectiva.
9. Nao reexecute a reserva historica.
10. Nao use relatorios historicos ou da reserva para desenhar o contrato em favor da V2.
11. Nao introduza dados pessoais, medicos, financeiros ou credenciais.
12. Nao habilite rollout publico nem altere sugestoes visiveis.
13. Nao crie migration, rota HTTP, tela ou dependencia externa neste marco.
14. Nao faca commit, push, deploy, seed remoto, pagamento ou envio de e-mail.
15. Toda preparacao antecipada deve ser marcada `PREPARADO`, nunca `CONCLUIDO` para 28/09.
16. Se nao houver trabalho tecnico justificavel, produza somente a auditoria e o checkpoint; nao invente complexidade.

## Escopo permitido

Este marco pode:

- auditar e corrigir bloqueadores herdados do Dia 26;
- formalizar contrato puro de entrada longitudinal;
- ordenar cenarios deterministicamente;
- validar igualdade dos candidatos oferecidos aos modelos;
- validar isolamento de estado por conjunto, persona e identificador de modelo;
- definir transicoes de estado sem executar decisao de modelo;
- filtrar sinais elegiveis por consentimento, atividade e instante;
- detectar vazamento temporal;
- implementar ensaio seco estrutural sem ranking;
- documentar a arquitetura e o plano de execucao de 28/09;
- declarar de forma coerente a versao minima do Node.js, se a auditoria justificar.

Este marco nao pode:

- escolher candidato;
- chamar formula de controle, V1 ou V2;
- gerar feedback ou reacao com base em escolha de modelo;
- produzir relatorio comparativo;
- recalibrar qualquer formula;
- integrar a IA ao fluxo real;
- acessar a reserva.

## Fase 1 - Inventario e fechamento do Dia 26

Registre:

- branch, `HEAD` e estado do Git;
- alteracoes rastreadas e nao rastreadas;
- arquivos pertencentes ao Dia 26;
- hashes atuais do gerador, CLI e testes;
- hashes dos snapshots e artefatos congelados;
- versoes de Node.js e npm;
- comandos disponiveis;
- estado das feature flags;
- inexistencia de snapshot prospectivo de reserva.

Separe claramente:

- alteracoes anteriores do usuario, como o `README.md`;
- alteracoes tecnicas do Dia 26;
- eventuais alteracoes novas do Dia 27.

Nao descarte nem reorganize alteracoes anteriores apenas para obter um diff menor.

## Fase 2 - Decisao de runtime

Resolva a pendencia nao bloqueante registrada em 26/09.

1. Confirme o minimo exigido por Next.js, Supabase, ferramentas e codigo local.
2. Verifique se Node.js 22 e realmente a versao minima coerente.
3. Procure APIs acima desse minimo nos arquivos executados em producao e nos scripts experimentais.
4. Confirme comportamento em Windows e caminhos POSIX persistidos.
5. Decida se o requisito deve permanecer apenas no README ou tambem entrar em `engines`.

Adicione `engines` somente se:

- a versao minima estiver comprovada;
- os workspaces puderem declarar a mesma politica sem conflito;
- o lockfile puder ser atualizado mecanicamente e sem alterar dependencias;
- a mudanca ajudar CI, homologacao e reproducibilidade.

Nao fixe a versao exata da maquina local. Prefira uma faixa honesta, como `>=22`, se confirmada. Nao execute instalacao de dependencias apenas para gerar ruido no lockfile. Caso nao seja apropriado alterar manifests, documente a decisao e mantenha a pendencia como nao bloqueante.

## Fase 3 - Auditar o simulador historico

Mapeie o comportamento de `routine-intelligence-simulation.js` sem executa-lo.

Documente:

- quais modelos ele importa;
- como gera candidatos;
- como mantem estado;
- como propaga sinais;
- como trata consentimento;
- como ordena semanas;
- quais metricas calcula;
- quais relatorios escreve;
- quais configuracoes historicas utiliza;
- quais partes podem ser reutilizadas como funcoes puras;
- quais partes nao podem ser reutilizadas por dependerem de cenarios antigos ou resultados observados.

Identifique riscos como:

- todos os modelos compartilharem acidentalmente o mesmo estado mutavel;
- um modelo receber candidatos diferentes;
- sinais da decisao atual influenciarem a propria decisao;
- semana futura alimentar semana anterior;
- ordenacao por `scenario_id` substituir ordem temporal;
- grupo sem historico receber sinal;
- modelo com falha interromper os demais;
- relatorio incluir PII ou objetos completos;
- validacao e desenvolvimento escreverem no mesmo destino;
- reserva ser aceita por argumento generico.

Nao corrija o simulador historico para alterar seus resultados. O pipeline prospectivo deve ser isolado e versionado.

## Fase 4 - Contrato comum de entrada

Se ainda nao existir contrato suficiente, crie um modulo puro e agnostico, por exemplo:

`backend/src/domain/routine-intelligence-longitudinal-contract.js`

O nome pode seguir convencao local melhor. O modulo nao pode importar:

- `routine-recommendation.js`;
- `routine-intelligence.js`;
- `routine-intelligence-v2.js`;
- avaliador sombra;
- rotas, banco ou HTTP.

O contrato deve receber um snapshot ja validado e produzir uma estrutura imutavel ou clonada contendo:

- `partition_id`;
- `scenario_id`;
- `persona_id`;
- `virtual_week`;
- `virtual_day`;
- `scenario_index`;
- `instant_utc`;
- `meal_window`;
- perfil sintetico permitido;
- historico anterior permitido;
- sinais elegiveis anteriores;
- candidatos elegiveis adaptados;
- hash canonico da entrada comum;
- metadados de versao estritamente tecnicos.

Nao inclua:

- nome do modelo destinatario;
- escolha;
- ranking;
- score;
- confianca;
- utilidade;
- vencedor;
- explicacao de modelo;
- candidato inelegivel entre as opcoes oferecidas.

O mesmo cenario deve produzir exatamente o mesmo `common_input_sha256` para qualquer modelo.

## Fase 5 - Candidatos comuns e imutabilidade

Comprove por teste que:

- somente IDs presentes em `eligible_candidate_ids` sao adaptados;
- nenhum ID de `ineligible_candidates` aparece na entrada comum;
- a ordem dos candidatos e deterministica;
- controle, V1 e V2 receberao copias semanticamente identicas;
- mutacao feita por um consumidor nao altera a entrada de outro;
- o snapshot original nao e modificado;
- duplicata ou candidato desconhecido falha antes do ensaio seco;
- o hash da entrada muda quando um candidato elegivel muda;
- o hash nao muda por ordem de chaves de objetos equivalentes.

Nao crie tres adaptadores com regras diferentes. Crie uma entrada comum e deixe a conversao minima por modelo para o Dia 28, quando testes puderem provar equivalencia.

## Fase 6 - Ordem longitudinal canonica

Implemente ou valide uma funcao pura que agrupe e ordene cenarios por:

1. conjunto;
2. persona;
3. semana virtual;
4. dia virtual;
5. indice de cenario como desempate.

Requisitos:

- exatamente dez personas conhecidas;
- exatamente seis semanas por persona;
- exatamente cinco cenarios por semana;
- indices sem lacuna ou duplicidade;
- instantes estritamente crescentes dentro da persona;
- nenhuma mistura entre desenvolvimento e validacao;
- nenhuma reserva aceita;
- ordenacao independente da ordem do array de entrada;
- hash de sequencia estavel por persona;
- erro explicito para semana faltante, repetida ou fora da particao.

O `scenario_id` nao deve ser usado como ordem temporal principal.

## Fase 7 - Estado longitudinal isolado

Defina um contrato de estado vazio sem executar modelos. Estrutura conceitual:

```text
dataset + persona + model_version -> estado isolado
```

O estado pode declarar:

- escolhas anteriores;
- sequencia de restaurante, produto e categoria;
- sinais acumulados elegiveis;
- contadores de repeticao;
- falhas tecnicas;
- decisoes processadas;
- ultimo instante processado.

Neste marco, nao preencha escolhas ou metricas. Apenas prove que:

- cada combinacao recebe um objeto independente;
- mutar V1 nao altera controle ou V2;
- mutar uma persona nao altera outra;
- desenvolvimento nao altera validacao;
- reprocessar a mesma chave pode ser detectado;
- processar instante anterior ao ultimo falha;
- estado nao contem PII;
- estado nao pode ser criado para a reserva.

Use identificadores de modelo somente como chaves opacas. Nao importe as formulas nem valide qualidade.

## Fase 8 - Elegibilidade temporal dos sinais

Crie ou valide uma funcao pura que selecione sinais disponiveis **antes** de um cenario.

Um sinal pode alimentar o estado futuro somente quando:

- `synthetic_offline` e verdadeiro;
- `active` e verdadeiro;
- `consent_valid` e verdadeiro;
- `occurred_at` e valido;
- `occurred_at` e estritamente anterior ao cenario;
- a chave idempotente ainda nao foi processada;
- pertence a mesma persona e contexto sintetico quando o contrato exigir.

Regras:

- sinal sem consentimento permanece auditavel, mas nao personaliza;
- sinal inativo nao personaliza;
- sinal futuro falha ou e excluido com diagnostico;
- duplicata conta uma vez;
- grupo `controle_sem_historico` sempre recebe lista vazia;
- a funcao nao atribui pesos;
- a funcao nao transforma aprovacao, recusa ou alternativa em score;
- o instante real da maquina nao participa.

O Dia 28 decidira como a reacao gerada em uma semana entra na semana seguinte. Hoje apenas feche a barreira temporal e de consentimento.

## Fase 9 - Ensaio seco estrutural

Implemente, se necessario, um comando local somente leitura, por exemplo:

`npm run prepare:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check`

O nome deve seguir os scripts existentes. O ensaio seco deve:

- aceitar apenas desenvolvimento ou validacao;
- recusar qualquer nome contendo reserva;
- validar hashes antes de processar;
- validar a ordem longitudinal;
- construir entradas comuns sem chamar modelos;
- criar estados vazios isolados;
- confirmar candidatos identicos para chaves opacas de controle, V1 e V2;
- confirmar grupo sem historico neutro;
- confirmar ausencia de vazamento temporal;
- imprimir apenas resumo agregado seguro;
- nao gravar relatorio por padrao;
- nao alterar snapshot, manifesto ou checkpoint;
- retornar codigo diferente de zero em falha;
- oferecer `--help` seguro.

Resumo permitido:

- dataset;
- versao do contrato;
- personas;
- semanas;
- cenarios;
- entradas comuns;
- sinais elegiveis e ignorados agregados;
- candidatos elegiveis agregados;
- hashes de sequencia;
- reserva bloqueada;
- modelos executados: `0`;
- placares produzidos: `0`.

Resumo proibido:

- sinais individuais;
- escolhas;
- nomes de vencedores;
- utilidades;
- confiancas;
- pesos;
- dados pessoais;
- material da reserva.

Se o ensaio seco nao for necessario para reduzir risco, nao crie uma CLI apenas por conveniencia. Os mesmos contratos podem ser comprovados por testes.

## Fase 10 - Falhas seguras

Adicione testes de mutacao para garantir falha em:

- hash de snapshot divergente;
- conjunto desconhecido;
- tentativa de reserva;
- persona desconhecida;
- semana ausente;
- semana duplicada;
- cenario fora de ordem temporal;
- candidato inelegivel na entrada comum;
- candidato elegivel ausente;
- sinal futuro;
- sinal duplicado;
- sinal sem consentimento tentando personalizar;
- estado compartilhado entre modelos;
- tentativa de reprocessar o mesmo cenario;
- campo desconhecido no contrato;
- resultado de modelo inserido no ensaio seco.

Mensagens de erro devem usar codigos tecnicos seguros e nao imprimir snapshots completos.

## Fase 11 - Revisao do plano de 28/09

Produza uma especificacao curta e executavel para o proximo marco, contendo:

- modulo prospectivo a ser criado ou completado;
- ordem das seis semanas;
- estado independente por modelo e persona;
- adaptacao minima para controle, V1 e V2;
- tratamento de falha individual por modelo;
- reacao pela utilidade independente;
- atraso de pelo menos uma decisao para novos sinais;
- consentimento e idempotencia;
- metricas brutas a coletar sem interpretar resultado;
- destinos separados para desenvolvimento e validacao;
- formato de relatorio sem PII;
- proibicao de reserva;
- testes de neutralidade e guardrails.

Congele antes da simulacao:

- versao do contrato longitudinal;
- ordem das entradas;
- lista de modelos;
- regra de falha segura;
- regra temporal dos sinais;
- campos permitidos no resultado bruto.

Nao congele pesos novos nem criterios depois de observar placares.

## Testes obrigatorios

Confirme ou adicione cobertura para:

- pre-condicoes do Dia 26;
- hashes dos snapshots preservados;
- ordem longitudinal independente da ordem de entrada;
- seis semanas e cinco decisoes por persona;
- entrada comum deterministica;
- candidatos comuns semanticamente identicos;
- ausencia de inelegiveis na entrada;
- imutabilidade entre consumidores;
- isolamento por conjunto, persona e modelo;
- grupo sem historico neutro;
- consentimento, atividade e instante dos sinais;
- deduplicacao por chave idempotente;
- ausencia de vazamento temporal;
- recusa de reserva;
- ausencia de imports dos modelos no contrato estrutural;
- ausencia de PII e resultados de modelo;
- ajuda segura da eventual CLI;
- nenhum arquivo escrito em modo de verificacao;
- rollout publico igual a zero.

## Verificacao obrigatoria

Descubra os nomes reais dos scripts antes de executar. Rode os equivalentes existentes a:

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
```

Quando implementado, execute o ensaio seco estrutural para desenvolvimento e validacao. Rode os testes focados do contrato pelo menos tres vezes para detectar flakiness.

Nao execute:

- `simulate:rotina:intelligence`;
- `evaluate:rotina:intelligence`;
- scripts sombra remotos;
- modelos sobre os snapshots;
- reserva historica ou prospectiva;
- Supabase remoto;
- seed, pagamento, e-mail ou deploy.

## Documentacao do Dia 27

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-27.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e data real;
3. confirmacao de encerramento do Dia 26;
4. `HEAD` e estado inicial do Git;
5. integridade dos hashes congelados;
6. decisao de runtime e justificativa;
7. auditoria do simulador historico;
8. contrato comum de entrada;
9. ordem longitudinal canonica;
10. isolamento de estado;
11. barreira temporal e de consentimento;
12. resultado do ensaio seco estrutural, se criado;
13. testes de falha segura;
14. arquivos criados ou alterados;
15. comandos e resultados;
16. confirmacao de que nenhum modelo foi executado sobre snapshots;
17. confirmacao de que nenhum placar foi produzido;
18. confirmacao de que nenhuma reserva foi executada;
19. confirmacao de rollout publico zero;
20. itens marcados `PREPARADO` para 28/09;
21. itens que continuam abertos;
22. entrada exata para a simulacao longitudinal.

Atualize o calendario somente depois de cumprir os criterios. Adicione 27/09 como reserva tecnica concluida, sem marcar 28/09 como concluido.

## Criterios de encerramento de 27/09

O marco esta concluido somente quando:

- Dia 26 continuar aprovado e verificavel;
- snapshots e hashes permanecerem intactos;
- reserva prospectiva continuar selada;
- decisao de runtime estiver documentada;
- simulador historico estiver auditado sem reexecucao;
- contrato comum for puro e agnostico aos modelos;
- candidatos comuns forem identicos e somente elegiveis;
- ordem longitudinal for deterministica;
- estado vazio for isolado por conjunto, persona e modelo;
- sinais futuros, inativos, duplicados ou sem consentimento nao personalizarem;
- grupo sem historico permanecer neutro;
- ensaio seco, se existir, produzir zero escolhas e zero placares;
- testes focados passarem tres vezes;
- suite, builds, lint e `git diff --check` passarem;
- nenhum snapshot, relatorio historico ou reserva tiver sido alterado;
- rollout publico permanecer zero;
- checkpoint de 27/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `PRONTIDAO_LONGITUDINAL_APROVADA`: contratos e guardas estao completos para iniciar 28/09;
- `PRONTIDAO_LONGITUDINAL_APROVADA_COM_CORRECOES`: bloqueadores foram corrigidos e verificados;
- `PRONTIDAO_LONGITUDINAL_BLOQUEADA`: existe risco de estado, temporalidade, elegibilidade, runtime ou reserva que impede a simulacao.

Nao declare a IA pronta, nao aprove V2.1 e nao promova qualquer modelo.

## Aceleracao segura

Depois de concluir o marco, pode ficar marcado como `PREPARADO`:

- leitor validado dos snapshots;
- entrada comum aos modelos;
- ordem por persona e semana;
- estado isolado;
- filtro de sinais anteriores e consentidos;
- ensaio seco estrutural;
- formato bruto do resultado longitudinal;
- lista de testes do Dia 28.

Nao pode ficar marcado como concluido:

- execucao de controle, V1 ou V2;
- reacao baseada em escolha;
- propagacao real entre semanas;
- metricas por modelo;
- relatorio comparativo;
- validacao;
- reserva;
- decisao sobre V2.1.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. confirmacao de que nada ficou pendente no Dia 26;
3. arquivos criados ou alterados;
4. decisao de runtime;
5. riscos encontrados no simulador historico;
6. arquitetura do contrato comum;
7. prova de candidatos identicos e elegiveis;
8. prova de ordem longitudinal e isolamento;
9. prova da barreira temporal e de consentimento;
10. resultado do ensaio seco estrutural;
11. testes, builds, lint e diff;
12. hashes preservados;
13. confirmacao de que nenhum modelo, placar ou reserva foi executado;
14. confirmacao de rollout publico zero;
15. trabalho preparado para 28/09;
16. entrada exata do proximo marco.

Nao confunda ensaio seco com simulacao, contrato de estado com aprendizado ou prontidao estrutural com qualidade do modelo. O objetivo de 27/09 e permitir que a simulacao longitudinal comece com fronteiras claras, entradas justas e falhas detectaveis, sem consumir antecipadamente a evidencia que ela devera produzir.
