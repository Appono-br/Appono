# Prompt do Dia 12 - Estabilizacao tecnica da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **3 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e usar a reserva tecnica para **estabilizar, auditar e preparar o fechamento da V2 atual**, depois da decisao de 02/10 `MANTER_V2_SEM_AJUSTE`. Este marco nao e uma nova rodada de calibracao, nao e implementacao de V2.1 e nao e integracao ao fluxo real. A entrega de hoje deve reduzir risco para 05/10 e deixar a candidata atual pronta para ser congelada formalmente.

Nao entregue apenas analise, pseudocodigo ou uma lista de proximos passos. Inspecione o estado real do repositorio, confirme as pre-condicoes, preserve todos os artefatos congelados, corrija apenas defeitos gerais de infraestrutura ou contratos, adicione testes quando houver lacunas reais e produza um checkpoint datado.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `03/10/2026`.

Entrega prevista:

> Reserva tecnica: ajustes pequenos e estabilizacao; sem recalibracao oportunista.

O marco somente pode ser encerrado quando estiver comprovado que:

- a decisao de 02/10 permanece integra e vinculada aos artefatos congelados;
- a V2 atual continua inalterada em formula, pesos, limites, decaimento, suavizacao e desempates;
- nenhuma hipotese de V2.1 foi implementada ou aceita implicitamente;
- nao existe defeito geral bloqueando o congelamento de 05/10;
- contratos de entrada, estado, consentimento, fallback e explicacao continuam executaveis;
- os guardrails continuam protegidos por testes de regressao;
- os artefatos prospectivos e historicos permanecem intactos;
- a reserva prospectiva continua selada e inacessivel;
- existe um manifesto objetivo do que sera congelado em 05/10;
- a integracao de 06/10 pode comecar sem alterar a evidencia experimental;
- rollout publico permanece zero.

## Decisao do Dia 02 a preservar

Use como fato congelado, depois de conferir no repositorio:

- decisao do marco: `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE`;
- decisao substantiva: `MANTER_V2_SEM_AJUSTE`;
- revisao humana: `REVISAO_HUMANA_PENDENTE`;
- respostas humanas validas: `0`;
- hipoteses V2.1 aceitas: `0`;
- nenhuma resposta humana pode ser inventada, preenchida ou inferida;
- nenhuma nova decisao de qualidade deve ser tomada hoje.

Se esses fatos divergirem do checkpoint de 02/10, interrompa a execucao e registre `DIA_02_INTEGRAÇÃO_DIVERGENTE`. Nao reescreva o checkpoint nem altere seus hashes para esconder a divergencia.

## Pre-condicoes obrigatorias

Antes de editar, confirme:

- branch e `HEAD` atuais;
- estado limpo ou inventario completo das alteracoes locais;
- checkpoint de 02/10 presente e coerente;
- protocolo de decisao `routine-technical-decision-v1` valido;
- relatorio `technical-decision-v1.json` presente e canonico;
- decisao substantiva `MANTER_V2_SEM_AJUSTE`;
- estado humano `REVISAO_HUMANA_PENDENTE` ou uma divergencia humana explicitamente documentada;
- snapshots, relatorios brutos, metricas, comparacao, guardrails e pacote cego com hashes preservados;
- controle, V1, V2 e utilidade externa sem alteracao local inesperada;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a `0`;
- testes, builds, lint e `git diff --check` aprovados no fechamento do Dia 02.

Registre toda divergencia. Nao regenere snapshots, simulacoes, metricas, comparacoes, guardrails, pacote cego ou relatorio de decisao para obter um resultado mais conveniente.

## Leitura obrigatoria

Leia integralmente antes de editar:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 02/10;
- prompts dos Dias 1 a 11;
- `docs/appono-intelligence-v2-comparativo-2026-09-29.md`;
- `docs/appono-intelligence-v2-guardrails-2026-09-30.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- protocolos de longitudinal, guardrails, revisao cega e decisao tecnica;
- snapshots e relatorios prospectivos, somente para validar integridade;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/domain/routine-intelligence-technical-decision.js`;
- rotas e adaptadores que serao usados em 06/10, sem integrar hoje;
- testes de formula, contrato, politica, consentimento, simulacao, metricas, guardrails e decisao.

Nao execute simulacao em modo de escrita, avaliacao comparativa, reserva ou qualquer operacao remota.

## Regras inegociaveis

1. Preserve todas as alteracoes locais existentes.
2. Nao altere controle, V1, V2 ou a utilidade das personas.
3. Nao altere pesos, limites, decaimento, suavizacao, desempates ou limiar de confianca.
4. Nao implemente V2.1.
5. Nao transforme uma hipotese `DEFERRED_HUMAN_REVIEW` em autorizacao de codigo.
6. Nao use placares conhecidos para escolher ou ajustar comportamento.
7. Nao execute modelos sobre snapshots em modo de escrita.
8. Nao regenere relatorios de 28/09, 29/09 ou 30/09.
9. Nao crie ou leia material da reserva prospectiva.
10. Nao reexecute a reserva historica.
11. Nao invente respostas humanas nem altere o pacote cego.
12. Nao introduza PII, dados medicos, financeiros, agenda, credenciais ou dados reais.
13. Nao habilite rollout publico ou sugestoes visiveis ao cliente.
14. Nao crie migration, rota publica, dependencia externa ou integracao remota.
15. Nao marque 05/10, 06/10 ou qualquer marco futuro como concluido.
16. Nao faca commit, push, deploy, seed remoto, pagamento ou envio de e-mail.

## Escopo permitido

Este marco pode:

- auditar a integridade da decisao de 02/10;
- corrigir defeitos gerais de infraestrutura que bloqueiem testes ou congelamento;
- reforcar contratos de imutabilidade, hash, estado, consentimento, fallback e explicacao;
- adicionar testes de regressao sem mudar o comportamento funcional da V2;
- preparar manifesto de congelamento da V2 atual;
- preparar matriz de integracao para 06/10 sem conectar o fluxo real;
- validar que a politica de baixa confianca continua usando o controle;
- preparar fixtures gerais para as hipoteses, sem implementar nenhuma;
- auditar que nenhuma resposta humana foi fabricada;
- produzir um ensaio seco de congelamento, somente leitura e sem modelos;
- documentar riscos residuais para 05/10.

Este marco nao pode:

- alterar ranking ou formula;
- criar uma variante V2.1, mesmo que apenas com outro nome;
- executar nova simulacao de qualidade;
- interpretar a revisao humana pendente;
- acessar a reserva;
- integrar a IA ao planejamento real;
- ativar allowlist, homologacao ou rollout.

## Fase 1 - Inventario e linha de base

Registre antes da primeira edicao:

- branch, `HEAD`, Node.js e npm;
- arquivos modificados e nao rastreados;
- hashes de controle, V1, V2 e utilidade;
- hashes dos snapshots, relatorios, protocolos e checkpoints;
- feature flags, kill switch e rollout;
- scripts disponiveis;
- quantidade de testes atual;
- arquivos que pertencem ao Dia 02 e devem ser preservados;
- ausencia de respostas humanas submetidas;
- estado das duas reservas.

Separe explicitamente alteracoes do Dia 02 de qualquer trabalho novo do Dia 03. Nao reorganize o diff apenas para deixa-lo menor.

## Fase 2 - Auditoria da decisao tecnica

Valide sem reexecutar modelos:

- o protocolo de decisao foi registrado antes de qualquer resposta humana;
- a ausencia de respostas nao gerou agregacao humana;
- nao existe maioria, empate, consenso ou preferencia humana no relatorio;
- o criterio V2 contra controle permanece visivel;
- o criterio V2 contra V1 permanece reprovado;
- zero violacoes eliminatorias nao foi interpretado como superioridade;
- nenhuma hipotese aceita foi criada;
- nenhuma mudanca de formula resultou da decisao;
- a decisao continua reproduzivel por `--check`.

Se uma resposta humana real aparecer durante o marco, nao a consuma nem a agregue. Registre sua existencia como entrada futura e preserve o fluxo definido no Dia 02.

## Fase 3 - Auditoria de imutabilidade da V2

Crie ou complete testes que provem:

- hashes de arquivos de formula permanecem iguais;
- entradas equivalentes produzem a mesma saida;
- ordem de chaves nao altera hashes canonicos;
- valores `NaN`, infinitos ou campos desconhecidos falham;
- filtros eliminatorios continuam antes da personalizacao;
- candidatos inelegiveis nunca chegam ao ranking;
- confianca abaixo de `0.25` usa o controle pela politica existente;
- ausencia de historico mantem ajuste e confianca em zero;
- consentimento revogado, sinal inativo e sinal futuro nao personalizam;
- fallback nao e contado como escolha nativa da V2;
- explicacao tecnica permanece limitada a campos permitidos;
- nenhum estado mutavel e compartilhado entre modelos ou personas.

Nao altere a implementacao para fazer os testes passarem. Se um teste revelar mudanca comportamental real na V2, classifique como bloqueador para 05/10 e nao corrija por recalibracao.

## Fase 4 - Contratos para o congelamento de 05/10

Prepare, se necessario, um manifesto tecnico de congelamento, por exemplo:

`backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`

O manifesto deve registrar somente contratos e hashes, sem resultados novos:

- identificador da candidata: `appono-intelligence-v2`;
- versao do controle e da politica de fallback;
- hashes de controle, V1, V2, utilidade, guardrails e contratos;
- campos permitidos na entrada;
- campos permitidos na saida;
- regra de elegibilidade;
- regra de baixa confianca;
- regra de falha segura;
- regra de consentimento e idempotencia;
- regra de explicacao tecnica;
- feature flags e rollout inicial;
- proibicao da reserva neste marco;
- ausencia de PII;
- testes obrigatorios para o congelamento;
- estado inicial `PREPARED_FOR_FREEZE`.

O manifesto nao pode conter placar novo, vencedor, peso proposto, resposta humana ou conclusao comercial. Nao marque o manifesto como congelado antes de 05/10.

## Fase 5 - Fixtures das hipoteses sem implementacao

Se houver lacunas reais, prepare fixtures gerais para:

- preferencia explicita contra inferencia fraca;
- confianca baixa e pouco historico;
- contradicao;
- mudanca gradual;
- repeticao e diversidade;
- revogacao e exclusao logica.

As fixtures devem:

- usar IDs sinteticos;
- ser independentes dos relatorios observados;
- aceitar instante virtual por parametro;
- declarar candidatos elegiveis e inelegiveis;
- testar invariantes, nao respostas decoradas;
- possuir variantes positiva, negativa e de fronteira;
- nao propor peso, limiar ou ranking novo;
- nao importar a reserva;
- nao ser apresentadas como evidencia de que V2.1 foi aceita.

Caso nao exista lacuna real, registre a auditoria e nao crie complexidade artificial.

## Fase 6 - Ensaio seco de congelamento

Implemente apenas se reduzir risco um comando local de verificacao, seguindo convencoes existentes, por exemplo:

`npm run prepare:rotina:freeze --workspace backend -- --check`

O comando deve:

- aceitar somente o candidato V2 atual;
- validar todos os hashes;
- verificar os contratos e guardrails;
- confirmar rollout zero;
- confirmar reserva selada;
- confirmar ausencia de resposta humana agregada;
- confirmar que o manifesto nao contém pesos novos;
- imprimir somente resumo seguro;
- nao executar modelos;
- nao escrever por padrao;
- oferecer `--help` sem escrita;
- retornar codigo diferente de zero em falha.

Resumo permitido:

- candidata e versao;
- contratos validados;
- testes cobertos;
- feature flags;
- fallback;
- reserva bloqueada;
- modelos executados: `0`;
- placares produzidos: `0`.

Se os testes e manifestos existentes ja cobrirem esse risco, nao crie uma CLI somente por conveniencia. Um ensaio seco inutil nao e entrega.

## Fase 7 - Matriz de integracao de 06/10

Prepare uma especificacao tecnica, sem executar integracao, contendo:

- ponto de entrada do planejamento real;
- adaptador que seleciona a V2 somente quando a politica permitir;
- fallback deterministico para o controle;
- persistencia de diagnostico seguro, sem PII ou sinais completos;
- comportamento para erro, timeout, entrada invalida e baixa confianca;
- kill switch e rollout zero por padrao;
- contrato de idempotencia;
- testes de rota e dominio necessarios;
- ausencia de banco remoto neste marco;
- separacao entre simulacao prospectiva e fluxo operacional.

Nao crie rota, migration ou altere sugestoes visiveis hoje. O objetivo e deixar os limites claros para 06/10.

## Fase 8 - Falhas seguras

Adicione ou valide testes para:

- hash divergente;
- protocolo divergente;
- candidato desconhecido ou inelegivel;
- campo desconhecido;
- estado compartilhado;
- sinal futuro, inativo, revogado ou duplicado;
- confianca invalida;
- fallback creditado indevidamente;
- explicacao com campo privado;
- tentativa de usar resposta humana ausente;
- tentativa de alterar peso por argumento;
- tentativa de acessar reserva;
- tentativa de escrever relatorio historico;
- tentativa de habilitar rollout publico.

Mensagens de erro devem usar codigos tecnicos seguros e nao imprimir snapshots, notas, chaves ou objetos completos.

## Fase 9 - Verificacao obrigatoria

Descubra os nomes reais dos scripts antes de executar. Rode os equivalentes existentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem em modo somente leitura:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run evaluate:rotina:longitudinal --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Rode os testes focados novos ou alterados pelo menos tres vezes. Nao execute simulacao em `--write`, geracao de relatorios, avaliacao comparativa nova ou reserva.

## Fase 10 - Auditoria estatica

Varra codigo e artefatos novos procurando:

- PII, credenciais, tokens, dados medicos, agenda ou enderecos;
- material da reserva;
- pesos ou limiares novos;
- importacao de modelo em contrato puro indevido;
- chamada de banco, HTTP ou relogio real;
- resposta humana fabricada;
- linguagem de V2.1 implementada ou aprovada;
- rollout diferente de zero;
- escrita sobre snapshot ou relatorio congelado.

Analise falsos positivos individualmente. Nao use exclusoes amplas para fazer a auditoria passar.

## Fase 11 - Checkpoint do Dia 03

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-03.md`

Registre:

1. decisao do dia;
2. data planejada e data real;
3. confirmacao de encerramento do Dia 02;
4. estado humano pendente, sem respostas inventadas;
5. `HEAD` e estado inicial do Git;
6. hashes preservados;
7. inventario de auditoria;
8. defeitos encontrados e classificacao;
9. correcoes gerais implementadas, se houver;
10. confirmacao de que nenhuma formula foi alterada;
11. manifesto de congelamento preparado, se criado;
12. fixtures preparadas, se criadas;
13. matriz de integracao de 06/10;
14. testes, builds, lint e diff;
15. comandos e resultados;
16. confirmacao de que nenhum modelo foi executado em escrita;
17. confirmacao de que nenhum placar novo foi produzido;
18. confirmacao de que nenhuma reserva foi acessada;
19. confirmacao de rollout publico zero;
20. riscos residuais para 05/10;
21. itens marcados `PREPARADO`;
22. itens que continuam abertos;
23. entrada exata para 05/10.

Use uma decisao do marco:

- `RESERVA_TECNICA_CONCLUIDA`: auditoria e estabilizacao concluida sem bloqueador;
- `RESERVA_TECNICA_CONCLUIDA_COM_CORRECOES`: defeitos gerais corrigidos e verificados;
- `RESERVA_TECNICA_PARCIAL`: preparacao util, mas ainda falta contrato ou teste nao bloqueante;
- `RESERVA_TECNICA_BLOQUEADA`: existe risco de integridade, formula, elegibilidade, privacidade ou reserva.

Nao declare `V2_CONGELADA`, `V2_1_IMPLEMENTADA`, `IA_PRONTA`, homologacao ou release.

## Criterios de encerramento

O marco esta concluido somente quando:

- Dia 02 continua aprovado e reproduzivel;
- a V2 permanece byte a byte ou semanticamente inalterada conforme os hashes aplicaveis;
- nenhuma hipotese V2.1 foi implementada;
- contratos e guardrails continuam cobertos;
- fixtures, quando criadas, sao gerais e independentes;
- fallback, baixa confianca, consentimento e filtros eliminatorios continuam protegidos;
- manifesto de congelamento, se criado, esta apenas `PREPARED_FOR_FREEZE`;
- plano de integracao de 06/10 esta documentado sem integracao real;
- testes focados passam tres vezes;
- suite, builds, lint e `git diff --check` passam;
- snapshots, relatorios e checkpoints anteriores permanecem intactos;
- reserva prospectiva continua `SEALED_UNMATERIALIZED`;
- rollout publico permanece zero;
- checkpoint do Dia 03 esta completo;
- nenhuma operacao remota, commit, push ou deploy ocorreu.

## Aceleracao segura para 05/10

Pode ficar marcado como `PREPARADO`:

- manifesto da V2 atual para congelamento;
- auditoria final de hashes;
- matriz de regressao;
- fixtures das hipoteses sem alteracao de formula;
- checklist de congelamento;
- matriz de integracao e fallback para 06/10.

Nao pode ficar marcado como concluido:

- congelamento final da candidata;
- V2.1;
- nova simulacao de qualidade;
- execucao da reserva;
- integracao ao fluxo real;
- homologacao;
- rollout ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. confirmacao de que nada bloqueante ficou pendente no Dia 02;
3. arquivos criados ou alterados;
4. estado da revisao humana;
5. hashes preservados;
6. auditorias e defeitos encontrados;
7. correcoes gerais aceitas e mudancas recusadas;
8. prova de que formulas e pesos nao mudaram;
9. guardrails e falhas seguras confirmados;
10. manifesto de congelamento preparado;
11. fixtures preparadas;
12. matriz de integracao de 06/10;
13. testes, builds, lint e diff;
14. confirmacao de que nenhum modelo foi executado em escrita;
15. confirmacao de que nenhuma reserva foi acessada;
16. confirmacao de rollout publico zero;
17. riscos residuais;
18. trabalho preparado para 05/10;
19. entrada exata do proximo marco: congelar e testar formalmente a V2 atual sem ajuste, preservando fallback, guardrails e rollout zero.

Nao confunda estabilizacao com recalibracao, fixture com evidencia de qualidade, decisao de 02/10 com congelamento final ou preparacao de integracao com integracao real. O objetivo do Dia 03 e deixar a V2 atual auditada e pronta para ser congelada com disciplina.
