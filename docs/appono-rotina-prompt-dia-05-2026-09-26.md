# Prompt do Dia 5 - Reserva tecnica da Appono Intelligence

Voce e um agente senior de engenharia de software, qualidade, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **26 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e usar a primeira **reserva tecnica** do cronograma para auditar, estabilizar e comprovar a qualidade dos artefatos produzidos entre 22 e 25/09. Este marco nao possui nova funcionalidade obrigatoria. Seu resultado esperado e reduzir risco antes da simulacao longitudinal prevista para 28/09.

Nao entregue apenas uma revisao superficial ou uma lista de recomendacoes. Inspecione o repositorio, reproduza as verificacoes, investigue qualquer falha, corrija defeitos objetivos de infraestrutura experimental, amplie testes quando houver lacuna comprovada e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data planejada: `26/09/2026`.

Entrega prevista:

> Reserva tecnica: correcao de fixtures e testes atrasados, sem nova funcionalidade obrigatoria.

Como o cronograma esta sendo adiantado, registre no checkpoint a data real da execucao e mantenha `26/09/2026` como identificador do marco planejado.

O dia somente pode ser encerrado quando o repositorio conseguir demonstrar que:

- os baselines de 22, 23 e 24/09 permanecem verificaveis;
- o gerador deterministico de 25/09 continua reproduzivel;
- desenvolvimento e validacao continuam sem sobreposicao;
- a reserva prospectiva continua selada e nao materializada;
- fixtures, schemas e manifestos rejeitam entradas invalidas de forma previsivel;
- os scripts possuem codigos de saida confiaveis e nao alteram artefatos em modo de verificacao;
- a versao de Node.js suportada pelo projeto e compativel com as APIs usadas;
- os snapshots podem alimentar o proximo adaptador sem expor PII ou resultados de modelos;
- nenhuma nova funcionalidade de produto, calibracao ou promocao da V2 foi introduzida.

## Estado conhecido a confirmar

Trate os itens abaixo como hipoteses a serem verificadas no repositorio, e nao como fatos a copiar sem auditoria:

- arvore de trabalho inicialmente limpa;
- `HEAD` inicial no commit `7ae90fa`, com a mensagem `Adicionando o gerador deterministico de cenarios`;
- Dia 22 decidido como `BASELINE_CONGELADO`;
- Dia 23 decidido como `PERSONAS_CONGELADAS`;
- Dia 24 decidido como `CONJUNTOS_SEPARADOS`;
- Dia 25 decidido como `GERADOR_DETERMINISTICO_CONCLUIDO`;
- 300 snapshots de desenvolvimento e 300 de validacao;
- 600 IDs de cenario unicos;
- intersecao zero entre desenvolvimento e validacao;
- gerador `routine-scenario-generator-v1`;
- snapshots `routine-scenario-snapshot-v1`;
- manifestos dos cenarios `routine-scenario-manifest-v1`;
- hash bruto de desenvolvimento `2bfb2505df03f15f05190209310652c0ef3a9758699c200403830da97cbd30c6`;
- hash canonico dos cenarios de desenvolvimento `f377fa3f58c2e144c81f2fcc7d653a9f075c306a2d5f8f777df4b4dccf0cad46`;
- hash bruto de validacao `92c97c9d9c21dc340555184c6c2eafad9d2ea596be90111bb1b57d7268da7da4`;
- hash canonico dos cenarios de validacao `0f666065ff1ec899befbec3adbc97d68bd723a86081d1a7b042da9a03b0589f4`;
- reserva prospectiva no estado `SEALED_UNMATERIALIZED`;
- suite do backend com 205 testes aprovados no fechamento de 25/09;
- builds e lint aprovados;
- rollout publico igual a zero.

Se qualquer hipotese divergir do estado real, registre a divergencia antes de corrigi-la. Nao atualize hashes ou documentos apenas para fazer os numeros coincidirem.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-22.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-23.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-24.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-25.md`;
- `docs/appono-rotina-prompt-dia-01-2026-09-22.md`;
- `docs/appono-rotina-prompt-dia-02-2026-09-23.md`;
- `docs/appono-rotina-prompt-dia-03-2026-09-24.md`;
- `docs/appono-rotina-prompt-dia-04-2026-09-25.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/reserve-commitment-v1.json`;
- `backend/experiments/routine-intelligence/scenarios/manifest-v1.json`;
- snapshots materializados de desenvolvimento e validacao;
- todos os relatorios congelados em `backend/reports/routine-intelligence/`;
- `backend/src/domain/routine-experiment-manifest.js`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-partitions.js`;
- `backend/src/domain/routine-intelligence-scenario-generator.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`, se existir;
- scripts de auditoria, geracao e avaliacao da Intelligence;
- todos os testes relacionados a manifesto, personas, particoes, gerador, simulacao, politica e avaliacao sombra.

Leia tambem as instrucoes locais do repositorio. Este marco nao exige Supabase, banco remoto, autenticacao, frontend funcional ou alteracao de schema.

## Regras inegociaveis

1. Preserve alteracoes locais e nao reverta trabalho que nao foi feito por voce.
2. Nao altere as formulas do controle, V1, V2 ou utilidade das personas.
3. Nao altere pesos, limites ou criterios para melhorar placares.
4. Nao execute controle, V1 ou V2 sobre os novos snapshots.
5. Nao produza metricas de qualidade dos modelos neste marco.
6. Nao execute simulacao longitudinal de desenvolvimento ou validacao.
7. Nao materialize, abra, leia ou tente reconstruir a reserva prospectiva.
8. Nao reexecute a reserva historica.
9. Nao gere uma nova reserva para substituir a existente.
10. Nao altere snapshots ou hashes congelados sem defeito objetivo, teste de regressao e justificativa registrada.
11. Nao use PII, credenciais, tokens, `.env`, endereco, coordenada exata, agenda ou alergia nos artefatos.
12. Nao habilite rollout publico nem altere a experiencia visivel do cliente.
13. Nao adicione dependencia externa sem necessidade tecnica comprovada.
14. Nao faca commit, push, deploy, pagamento, e-mail, seed remoto ou migration remota.
15. Toda correcao deve ser pequena, explicavel e coberta por teste.
16. Se nenhuma correcao for necessaria, documente isso; nao invente trabalho para preencher o dia.

## Escopo permitido

Este marco pode:

- corrigir validadores, fixtures, scripts e testes do protocolo experimental;
- melhorar mensagens de erro e codigos de saida;
- remover dependencia acidental de APIs nao suportadas pelo runtime declarado;
- reforcar serializacao canonica, leitura e verificacao de hashes;
- corrigir comportamento nao deterministico da infraestrutura;
- adicionar testes de regressao para defeitos objetivos;
- criar um adaptador de validacao estrutural, sem executar os modelos;
- documentar contratos necessarios ao Dia 28;
- medir custo local de leitura e validacao para detectar gargalos evidentes.

Este marco nao pode:

- mudar ranking ou pontuacao;
- criar V2.1;
- calibrar pesos;
- comparar vencedor entre modelos;
- integrar a V2 ao planejamento visivel;
- alterar banco, API remota ou frontend de produto;
- abrir a reserva;
- declarar a IA pronta.

## Fase 1 - Auditoria pos-commit

Registre antes de qualquer edicao:

- branch e `HEAD`;
- estado do Git;
- arquivos modificados e nao rastreados;
- versoes de Node.js e npm;
- sistema operacional relevante para caminhos e quebras de linha;
- scripts disponiveis nos `package.json`;
- arquivos e hashes congelados de 22 a 25/09;
- tamanho dos snapshots e manifestos;
- estado das flags de rollout, sem exibir valores secretos;
- estado da reserva historica e prospectiva.

Confirme que o commit de 25/09 contem apenas os artefatos esperados. Nao reescreva o commit. Caso existam arquivos locais de infraestrutura, como `.codex-analysis`, confirme que permanecem ignorados e nao entram nos artefatos experimentais.

Produza uma tabela de integridade contendo:

- artefato;
- versao;
- hash esperado;
- hash observado;
- estado `OK`, `DIVERGENTE` ou `NAO_APLICAVEL`;
- origem do hash esperado.

## Fase 2 - Compatibilidade de runtime

Audite o runtime realmente suportado pelo projeto.

1. Verifique se existe campo `engines`, `.nvmrc`, configuracao de CI, Dockerfile ou documentacao de versao do Node.js.
2. Liste APIs JavaScript recentes usadas nos artefatos dos Dias 23 a 25.
3. Identifique especialmente usos como `Set.prototype.intersection`, metodos novos de arrays, APIs experimentais ou comportamento dependente de Node.js muito recente.
4. Compare as APIs encontradas com a versao minima declarada ou praticada pelo projeto.
5. Se nao houver versao minima declarada, escolha uma estrategia conservadora compativel com o restante do repositorio e documente a lacuna.
6. Quando uma API recente puder ser substituida por uma implementacao simples e local sem mudar comportamento, faca a correcao e adicione teste.
7. Nao aumente silenciosamente a versao minima do Node.js apenas para evitar uma correcao pequena.

Valide tambem:

- caminhos Windows e POSIX;
- CRLF e LF na serializacao;
- ordenacao independente de locale;
- uso consistente de UTF-8;
- ausencia de timezone local implicito na identidade dos cenarios;
- ausencia de dependencias em ordem de leitura do sistema de arquivos.

## Fase 3 - Reprodutibilidade reforcada

Sem alterar os snapshots, execute os comandos de verificacao do gerador para desenvolvimento e validacao.

Comprove:

- modo `--check` nao grava arquivos;
- execucoes repetidas retornam os mesmos hashes;
- dois processos separados produzem a mesma representacao canonica;
- a ordem das chaves dos objetos nao altera IDs ou hashes;
- a ordem de leitura dos arquivos nao altera o resultado;
- o relogio real nao aparece em campos determinantes;
- IDs permanecem unicos dentro de cada conjunto;
- intersecao entre conjuntos continua zero;
- snapshots inelegiveis continuam separados dos candidatos entregues aos modelos;
- nenhuma metrica, escolha ou nome de vencedor foi introduzido.

Execute os testes focados de determinismo pelo menos tres vezes. Se houver flakiness, isole a causa antes de ampliar o escopo.

Nao regenere arquivos congelados apenas para atualizar formatacao, timestamp ou ordem de propriedades.

## Fase 4 - Auditoria de schemas e validadores

Revise os contratos de:

- personas;
- particoes;
- identidade de cenario;
- snapshot;
- manifesto de snapshots;
- compromisso da reserva.

Confirme que cada validador:

- rejeita campos obrigatorios ausentes;
- rejeita tipos incorretos;
- rejeita `NaN`, infinito e numeros fora das faixas;
- rejeita datas invalidas ou sem timezone;
- rejeita IDs e namespaces vazios;
- rejeita campos desconhecidos quando isso evita erro silencioso;
- rejeita candidatos duplicados;
- rejeita candidato marcado simultaneamente como elegivel e com motivo eliminatorio;
- rejeita snapshot sem ao menos um candidato elegivel quando o contrato o exigir;
- rejeita hash, versao ou quantidade incompatível com o manifesto;
- produz erro seguro sem incluir conteudo sensivel;
- nao modifica o objeto recebido.

Adicione testes negativos pequenos para lacunas reais. Nao transforme o validador em uma segunda implementacao do modelo de recomendacao.

## Fase 5 - Auditoria das fixtures

Inspecione as fixtures e os 600 snapshots sem avaliar os modelos.

Meça e registre:

- quantidade total por conjunto;
- quantidade por persona;
- quantidade por semana, dia e janela;
- candidatos elegiveis e inelegiveis;
- distribuicao de variantes de catalogo e disponibilidade;
- presenca dos casos de pouco historico, historico suficiente, historico antigo, contradicao, mudanca gradual e grupo sem historico;
- casos de fronteira de preco, distancia, repeticao e disponibilidade;
- duplicatas literais, semanticas e de ID;
- campos ausentes, nulos inesperados ou valores fora de faixa.

Esta auditoria avalia cobertura estrutural, nao qualidade de ranking. Nao calcule vitorias, derrotas, utilidade por modelo ou arrependimento.

Se uma lacuna de cobertura contrariar o contrato congelado do Dia 25:

1. prove o defeito com teste;
2. determine se a correcao muda snapshots ou apenas validacao;
3. prefira corrigir o validador ou a fixture minima;
4. se snapshots precisarem mudar, versione o gerador ou registre explicitamente a revisao;
5. recalcule todos os hashes afetados;
6. preserve os hashes anteriores no checkpoint;
7. nunca use resultado de modelo para orientar a correcao.

## Fase 6 - Seguranca e privacidade

Faça uma auditoria estatica dos novos artefatos e relatorios procurando:

- e-mail;
- telefone;
- nome de cliente real;
- endereco;
- latitude ou longitude exata;
- JWT;
- access token;
- refresh token;
- magic link;
- `service_role`;
- senha;
- valor de `.env`;
- conteudo de agenda;
- alergia ou condicao medica usada como preferencia;
- resultado da reserva prospectiva;
- nome do modelo em campos que deveriam ser agnosticos.

Confirme tambem que:

- scripts nao imprimem segredos;
- erros nao serializam objetos de ambiente;
- snapshots nao contem PII indireta;
- a reserva prospectiva nao e importada por codigo de desenvolvimento ou validacao;
- o compromisso publico nao permite reconstruir a semente privada;
- relatorios versionados nao contem caminhos pessoais da maquina.

Analise falsos positivos individualmente. Nao crie uma lista ampla de excecoes para fazer a verificacao passar.

## Fase 7 - Scripts e operacao segura

Audite os scripts de geracao e verificacao.

Cada comando deve:

- mostrar ajuda compreensivel;
- rejeitar conjunto desconhecido;
- rejeitar tentativa de reserva por comando comum;
- usar codigo de saida diferente de zero em falha;
- nao sobrescrever arquivo congelado em modo `--check`;
- escrever de forma atomica quando houver modo de geracao;
- limpar arquivo temporario apos sucesso ou falha;
- criar diretorio apenas dentro do local esperado;
- rejeitar caminho de destino fora da raiz permitida;
- nao depender de shell especifico;
- nao imprimir segredo ou objeto completo de configuracao;
- relatar hash, quantidade e versao sem produzir placar.

Adicione testes para os caminhos de falha importantes. Nao use comandos destrutivos para testar seguranca de caminho.

## Fase 8 - Custo e versionabilidade dos artefatos

Meça localmente, sem benchmark artificial excessivo:

- tamanho total e individual dos snapshots;
- tempo aproximado para ler, parsear e validar desenvolvimento;
- tempo aproximado para ler, parsear e validar validacao;
- memoria aproximada quando facilmente observavel;
- tempo dos testes focados;
- impacto dos arquivos no `git status` e `git diff`.

Nao estabeleca meta de desempenho depois de observar os numeros. O objetivo e detectar problemas obvios, como arquivo desnecessariamente gigante, leitura quadratica ou validacao que demora de forma desproporcional.

Nao introduza Git LFS, compactacao, banco local ou dependencia nova sem evidencia concreta. Se o volume atual for aceitavel, registre essa conclusao.

## Fase 9 - Preparacao estrutural para 28/09

O proximo marco funcional e a simulacao longitudinal. Prepare apenas o contrato de entrada, sem executar os modelos.

Mapeie para cada snapshot:

- identificador do conjunto;
- `scenario_id`;
- persona e semana virtual;
- janela alimentar;
- relogio virtual;
- candidatos elegiveis comuns;
- historico comportamental sintetico disponivel;
- consentimento sintetico;
- estado esperado do grupo sem historico;
- dados permitidos para diagnostico.

Defina ou valide uma interface pura para um futuro adaptador que entregue exatamente o mesmo conjunto de candidatos elegiveis para:

- `deterministico-v3`;
- `appono-intelligence-v1`;
- `appono-intelligence-v2`.

Requisitos do contrato:

- o adaptador nao pode escolher vencedor;
- o adaptador nao pode recalcular elegibilidade de forma divergente;
- candidatos inelegiveis nunca chegam aos desafiantes;
- a ordem original e preservada ou normalizada de forma documentada;
- todos os modelos recebem o mesmo snapshot base;
- historico consentido e separado de telemetria nao elegivel;
- grupo sem historico recebe lista de sinais vazia;
- relogio virtual entra por parametro;
- nenhuma funcao usa `Date.now()` para decidir o cenario;
- nenhum dado da reserva e aceito neste marco;
- nenhuma metrica de qualidade e calculada.

E permitido criar:

- tipos documentais em JavaScript;
- validador de entrada do adaptador;
- fixture minima de contrato;
- teste que prova igualdade dos candidatos entregues;
- comando de `dry-run` estrutural que nao importa nem chama os modelos.

Nao e permitido criar:

- loop longitudinal completo;
- reacao semanal;
- acumulacao de sinais;
- placar entre modelos;
- relatorio de utilidade;
- V2.1;
- leitura da reserva.

Registre as lacunas concretas que o Dia 28 ainda precisara implementar.

## Fase 10 - Correcao de defeitos

Classifique cada problema encontrado como:

- `BLOQUEADOR_DIA_28`;
- `DEFEITO_REPRODUTIBILIDADE`;
- `DEFEITO_SEGURANCA`;
- `DEFEITO_CONTRATO`;
- `MELHORIA_NAO_NECESSARIA`;
- `FALSO_POSITIVO`.

Corrija neste marco somente os quatro primeiros tipos. Para cada correcao:

1. registre a evidencia anterior;
2. adicione teste que falha antes da correcao;
3. aplique a menor mudanca suficiente;
4. execute os testes focados;
5. execute a verificacao completa;
6. confirme que nenhum modelo ou resultado foi alterado;
7. registre hashes novos somente quando inevitavel.

Nao faca refatoracao cosmetica ampla, renomeacao em massa ou formatacao de arquivos congelados.

## Testes obrigatorios

Confirme ou adicione cobertura para:

- compatibilidade com a versao minima suportada do Node.js;
- independencia de `Set.prototype.intersection` ou outra API nao suportada, quando aplicavel;
- caminhos Windows e POSIX;
- serializacao canonica com ordem de chaves diferente;
- determinismo entre processos;
- modo `--check` sem escrita;
- escrita atomica em modo de geracao;
- limpeza de temporarios;
- rejeicao de destino fora da raiz permitida;
- schema estrito de snapshots e manifestos;
- rejeicao de `NaN`, infinito e datas invalidas;
- rejeicao de candidato duplicado;
- rejeicao de inconsistencias de elegibilidade;
- hashes e contagens coerentes;
- zero intersecao entre desenvolvimento e validacao;
- ausencia de PII e segredos;
- reserva prospectiva inacessivel;
- reserva historica nao reexecutada;
- rollout publico igual a zero;
- adaptador estrutural entrega candidatos identicos, caso ele seja necessario;
- grupo sem historico permanece sem sinais;
- nenhum teste chama banco, HTTP, pagamento, e-mail ou modelo externo.

## Verificacao obrigatoria

Descubra primeiro os comandos reais nos `package.json`. Execute os equivalentes existentes a:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute tambem, conforme os nomes reais encontrados:

```text
npm run generate:rotina:intelligence:scenarios --workspace backend -- --dataset desenvolvimento --check
npm run generate:rotina:intelligence:scenarios --workspace backend -- --dataset validacao --check
npm run audit:rotina:intelligence:scenarios --workspace backend
npm run audit:rotina:intelligence:partitions --workspace backend
```

Execute ainda:

- testes focados de manifesto;
- testes focados de personas;
- testes focados de particoes;
- testes focados do gerador;
- cada teste de determinismo em tres repeticoes;
- auditoria estatica de PII e segredos;
- verificacao dos hashes de desenvolvimento e validacao;
- verificacao dos hashes historicos e da reserva historica;
- verificacao de que a reserva prospectiva continua sem arquivo de cenarios;
- verificacao de rollout publico zero.

Nao execute:

- modelos sobre snapshots;
- simulacao longitudinal;
- avaliacao de qualidade;
- scripts da reserva;
- smoke ou seed remoto;
- migration;
- pagamento;
- e-mail;
- deploy.

Se algum teste completo falhar por problema preexistente e fora do escopo, prove que a falha ja existia, registre comando e mensagem e nao a masque. Se a falha estiver nos artefatos dos Dias 22 a 25, trate-a como parte deste marco.

## Documentacao do Dia 26

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-26.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e data real da execucao;
3. `HEAD` e estado inicial do Git;
4. pre-condicoes verificadas;
5. tabela de integridade dos artefatos e hashes;
6. runtime suportado e APIs auditadas;
7. verificacoes de determinismo;
8. auditoria de schemas e fixtures;
9. auditoria de privacidade e reserva;
10. tamanho e custo aproximado dos artefatos;
11. defeitos encontrados e classificacao;
12. correcoes realizadas, com testes de regressao;
13. itens analisados e deliberadamente nao alterados;
14. comandos executados e resultados;
15. confirmacao de que nenhum modelo foi executado;
16. confirmacao de que nenhum placar foi produzido;
17. confirmacao de que a reserva historica nao foi reexecutada;
18. confirmacao de que a reserva prospectiva nao foi aberta ou materializada;
19. confirmacao de rollout publico zero;
20. estado do contrato estrutural para o Dia 28;
21. pendencias objetivas, se existirem;
22. entrada exata para a simulacao longitudinal.

Atualize o calendario apenas depois de concluir todas as verificacoes. Como 26/09 e uma reserva tecnica, registre uma linha propria na secao de progresso sem apagar a indicacao de que 28/09 e o proximo marco funcional.

## Criterios de encerramento de 26/09

O marco esta concluido somente quando:

- os checkpoints de 22 a 25/09 estiverem presentes e coerentes;
- hashes congelados estiverem verificados;
- runtime suportado e APIs usadas estiverem compativeis;
- desenvolvimento e validacao permanecerem deterministicos;
- intersecao entre conjuntos continuar zero;
- schemas e validadores tiverem testes positivos e negativos suficientes;
- scripts de verificacao nao escreverem arquivos;
- fixtures tiverem cobertura estrutural auditada;
- nenhum dado sensivel aparecer em artefatos ou relatorios;
- reserva historica nao tiver sido reexecutada;
- reserva prospectiva continuar `SEALED_UNMATERIALIZED`;
- nenhum modelo ou placar tiver sido executado;
- rollout publico permanecer zero;
- suite, builds, lint e `git diff --check` passarem;
- checkpoint de 26/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `RESERVA_TECNICA_APROVADA`: nenhuma falha relevante permanece e o Dia 28 pode comecar;
- `RESERVA_TECNICA_APROVADA_COM_CORRECOES`: defeitos objetivos foram corrigidos e verificados;
- `RESERVA_TECNICA_BLOQUEADA`: existe falha de integridade, determinismo, seguranca ou contrato que impede a simulacao longitudinal.

Nao declare `IA_PRONTA_EM_HOMOLOGACAO`, nao aprove V2.1 e nao promova nenhum modelo neste marco.

## Aceleracao segura

Como o objetivo e antecipar a entrega, depois de concluir a estabilizacao voce pode deixar marcado como `PREPARADO`:

- contrato de entrada comum aos tres modelos;
- validador do adaptador de snapshot;
- fixture minima para igualdade de candidatos;
- inventario dos sinais que deverao evoluir entre semanas;
- formato proposto do relatorio longitudinal;
- lista de metricas ja congeladas no protocolo;
- comando futuro de simulacao limitado a desenvolvimento e validacao.

Nao marque 28/09 como concluido e nao execute a simulacao sem:

- loop de seis semanas por persona;
- reacao sintetica independente;
- propagacao consentida dos sinais;
- comparacao justa dos tres modelos;
- metricas por semana e persona;
- testes de neutralidade, guardrails e falha segura.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. arquivos criados ou alterados;
3. estado dos hashes e artefatos congelados;
4. runtime suportado e incompatibilidades encontradas;
5. defeitos corrigidos e testes adicionados;
6. evidencia de determinismo e intersecao zero;
7. resumo da auditoria estrutural das fixtures;
8. resultado da auditoria de PII, segredos e reserva;
9. tamanho e custo dos artefatos;
10. testes, builds, lint e diff;
11. confirmacao de que nenhum modelo, placar ou reserva foi executado;
12. confirmacao de rollout publico zero;
13. trabalho preparado antecipadamente para 28/09;
14. entrada exata do proximo marco: simulacao longitudinal de seis semanas consumindo os snapshots validados.

Nao confunda estabilizacao com nova funcionalidade, cobertura estrutural com qualidade de recomendacao ou reserva tecnica com um dia vazio. O objetivo de 26/09 e chegar ao marco longitudinal com uma infraestrutura previsivel, portavel, segura e suficientemente testada para que qualquer resultado futuro seja atribuivel aos modelos, e nao a defeitos das fixtures ou do gerador.
