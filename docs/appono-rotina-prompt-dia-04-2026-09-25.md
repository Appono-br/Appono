# Prompt do Dia 4 - Gerador deterministico da Appono Intelligence

Voce e um agente senior de produto, dados, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **25 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e **implementar, versionar e validar um gerador deterministico de cenarios completos** que consuma obrigatoriamente as personas e particoes congeladas, produza snapshots reproduziveis para desenvolvimento e validacao e mantenha a reserva prospectiva completamente selada.

Nao entregue apenas analise, arquitetura ou pseudocodigo. Inspecione o estado real do repositorio, preserve os marcos de 22, 23 e 24/09, implemente o gerador, gere somente os conjuntos autorizados, prove reproducibilidade byte a byte ou canonica, adicione testes e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data: `25/09/2026`.

Entrega prevista:

> Implementar gerador deterministico: a mesma entrada e a mesma semente geram exatamente os mesmos cenarios.

O marco somente pode ser encerrado quando outra pessoa conseguir:

- carregar uma particao validada;
- carregar as personas congeladas;
- executar o gerador duas vezes;
- obter o mesmo conteudo canonico e o mesmo SHA-256;
- confirmar 300 cenarios por conjunto autorizado;
- verificar diversidade minima de catalogo, disponibilidade e historico;
- comprovar intersecao zero de cenarios, snapshots e sequencias entre desenvolvimento e validacao;
- confirmar que nenhum modelo foi executado;
- confirmar que a reserva prospectiva continua sem materializacao.

## Pre-condicoes

Antes de editar, confirme:

- 22/09: `BASELINE_CONGELADO`;
- 23/09: `PERSONAS_CONGELADAS`;
- 24/09: `CONJUNTOS_SEPARADOS`;
- repositorio sem divergencia nao explicada em relacao aos checkpoints;
- personas `personas-sinteticas-v1` com hash canonico `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- particoes `routine-partitions-v1` com hash canonico `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`;
- protocolo prospectivo `appono-intelligence-prospective-v1`;
- identidade de cenario `routine-scenario-id-v1`;
- reserva historica preservada como `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva em `SEALED_UNMATERIALIZED`;
- compromisso publico da reserva inalterado;
- material privado da reserva ignorado pelo Git;
- rollout publico igual a zero;
- suite, builds e lint sem regressao conhecida.

Se uma pre-condicao falhar, corrija apenas a infraestrutura necessaria para recuperar a verificabilidade. Nao atualize hashes congelados para acomodar mudancas silenciosas.

## Estado conhecido

O repositorio possui:

- dez personas declarativas e uma funcao de utilidade independente;
- tres particoes prospectivas com namespaces e periodos distintos;
- 300 identificadores planejados por particao;
- auditoria de intersecao zero entre identificadores e chaves semanticas;
- sementes publicas para desenvolvimento e validacao;
- uma semente privada comprometida criptograficamente para a reserva;
- um simulador historico anterior que ainda concentra personas, catalogo e geracao em um unico modulo.

O simulador historico e evidencia do baseline. Nao o reescreva para fingir que os novos snapshots produziram os resultados anteriores. O gerador de hoje deve ser um modulo prospectivo novo, independente dos modelos e consumivel pela simulacao longitudinal futura.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-22.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-23.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-24.md`;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-rotina-prompt-dia-02-2026-09-23.md`;
- `docs/appono-rotina-prompt-dia-03-2026-09-24.md`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/reserve-commitment-v1.json`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-partitions.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-experiment-manifest.js`;
- `backend/scripts/audit-routine-intelligence-partitions.js`;
- `backend/scripts/simulate-routine-intelligence.js`;
- testes de personas, particoes, manifesto e simulacao;
- `backend/package.json` e scripts disponiveis.

Leia tambem as instrucoes locais do repositorio. Este marco nao exige Supabase, banco, autenticacao, frontend ou qualquer servico externo.

## Regras inegociaveis

1. Preserve os hashes e relatorios congelados dos dias anteriores.
2. Nao altere controle, V1, V2, utilidade das personas ou politica de rollout.
3. Nao importe ou chame `routine-scoring.js`, `routine-intelligence.js`, `routine-intelligence-v2.js` ou o avaliador sombra no gerador.
4. Nao execute modelos, rankings ou metricas de qualidade hoje.
5. Nao use `Math.random()`, `Date.now()`, data atual, ordem de iteracao externa ou estado global mutavel.
6. Toda variacao deve derivar da semente da particao e de uma chave hierarquica estavel.
7. A ordem de geracao de uma persona nao pode alterar os cenarios de outra.
8. Desenvolvimento e validacao podem ser materializados; reserva prospectiva nao pode.
9. Nao leia o arquivo privado da reserva no gerador normal.
10. Nao reexecute nem sobrescreva a reserva historica.
11. Nao produza arquivo com resultado, placar, vencedor, confianca ou ajuste de modelo.
12. Nao inclua PII, endereco, coordenada exata, agenda, alergia, token ou dados que parecam de clientes reais.
13. Restricoes medicas e seguranca alimentar nao podem ser simuladas como preferencias.
14. Candidatos inelegiveis podem existir no snapshot apenas para testar filtros e devem estar explicitamente separados dos elegiveis.
15. O gerador nao pode promover candidato inelegivel nem decidir recomendacao.
16. Nao habilite rollout publico nem modifique credenciais.
17. Nao faca commit, push, deploy, pagamento, e-mail ou migration remota.

## Estrategia de arquivos

Implemente novos artefatos sem reescrever o simulador historico. Estrutura recomendada:

- `backend/src/domain/routine-intelligence-scenario-generator.js`: PRNG hierarquico, catalogo, disponibilidade, historico e snapshots;
- `backend/scripts/generate-routine-intelligence-scenarios.js`: CLI seguro para conjuntos autorizados;
- `backend/test/routine-intelligence-scenario-generator.test.js`: testes unitarios e de reproducibilidade;
- `backend/experiments/routine-intelligence/scenarios/desenvolvimento-v1.json`: snapshot canonico de desenvolvimento;
- `backend/experiments/routine-intelligence/scenarios/validacao-v1.json`: snapshot canonico de validacao;
- `backend/experiments/routine-intelligence/scenarios/manifest-v1.json`: hashes e metadados dos snapshots, sem metricas de modelo.

O nome exato pode seguir uma convencao local melhor, mas mantenha separadas:

- configuracao declarativa;
- geracao pura;
- serializacao canonica;
- CLI e escrita em disco;
- validacao do snapshot;
- auditoria de cobertura;
- auditoria de sobreposicao;
- testes;
- documentacao.

Nao crie qualquer arquivo de cenario para `reserva_prospectiva_v1`.

## Contrato do gerador

Implemente uma funcao pura com contrato equivalente a:

```text
gerarCenarios({
  artefatoParticoes,
  particao,
  artefatoPersonas,
  versaoGerador
}) -> snapshot
```

Entradas obrigatorias:

- artefato de particoes validado;
- particao explicitamente selecionada;
- artefato de personas validado;
- versao fixa do gerador;
- semente publica da particao;
- periodo e timezone da particao.

O gerador deve rejeitar:

- conjunto ausente ou desconhecido;
- reserva prospectiva;
- particao sem permissao de materializacao;
- hash de personas diferente do congelado;
- hash de particoes diferente do esperado;
- semente ausente, invalida ou privada;
- versao desconhecida;
- quantidade de semanas inferior a seis;
- configuracao com periodo insuficiente;
- campos extras nao reconhecidos quando puderem alterar comportamento.

## Aleatoriedade deterministica hierarquica

Implemente uma fonte de numeros pseudoaleatorios derivada de SHA-256 ou algoritmo simples, documentado e estavel.

Nao use uma unica sequencia global consumida em ordem. Derive subsementes independentes, por exemplo:

```text
root_seed
  -> dataset_namespace
  -> persona_id
  -> virtual_week
  -> virtual_day
  -> meal_window
  -> component_name
  -> item_index
```

Componentes recomendados:

- `catalog`;
- `price`;
- `distance`;
- `availability`;
- `operational_score`;
- `history`;
- `signals`;
- `candidate_order`;
- `noise_fixture`.

Requisitos:

- mesma chave produz o mesmo valor;
- chaves diferentes nao compartilham estado;
- gerar somente uma persona produz os mesmos cenarios dela que gerar todas;
- inverter a ordem das personas nao muda nenhum snapshot individual;
- adicionar um novo componente nao altera componentes existentes;
- nenhuma sub-semente e impressa como segredo;
- desenvolvimento e validacao usam somente suas sementes publicas.

## Relogio virtual

Todo instante deve derivar do periodo da particao.

Requisitos:

- seis semanas completas;
- cinco dias virtuais por semana, conforme o plano atual;
- instante UTC valido e estavel;
- timezone de apresentacao registrado separadamente;
- nenhuma chamada a relogio real;
- nenhum cenario fora do periodo da particao;
- datas de desenvolvimento e validacao sem intersecao;
- identificador e instante coerentes com semana e dia virtuais.

## Snapshot do conjunto

Cada arquivo deve declarar:

- `schema_version`;
- `generator_version`;
- `protocol`;
- `partitions_version`;
- hash canonico das particoes;
- `personas_version`;
- hash canonico das personas;
- ID, tipo e namespace da particao;
- semente publica utilizada;
- periodo e timezone;
- quantidade de semanas;
- total de personas;
- total de cenarios;
- hash canonico do conteudo de cenarios;
- cenarios em ordem canonica;
- ausencia de resultados de modelo.

Nao inclua `generated_at`, duracao de execucao, caminho absoluto, hostname, usuario do sistema ou qualquer campo volatil no conteudo canonico.

Metadados operacionais volateis, se realmente necessarios, devem ficar fora do arquivo comparado ou ser explicitamente excluidos da prova byte a byte.

## Contrato do cenario

Cada cenario deve conter apenas dados sinteticos e suficientes para reproducao:

- `scenario_id` já derivado pelo dominio de particoes;
- chave semantica ou seu hash;
- ID da particao;
- ID e versao da persona;
- semana, dia, indice e instante virtual;
- janela alimentar;
- nivel de historico;
- contexto de orcamento e raio da persona;
- preferencias explicitas sinteticas relevantes;
- historico sintetico anterior;
- sinais sinteticos consentidos quando aplicavel;
- catalogo instanciado;
- candidatos elegiveis;
- candidatos inelegiveis com motivos estruturados;
- variante de catalogo;
- variante de disponibilidade;
- disponibilidade por candidato;
- hash canonico do snapshot de entrada.

Nao inclua:

- nome de modelo;
- pontuacao ou ajuste;
- vencedor esperado;
- utilidade calculada;
- confianca;
- placar;
- endereco ou coordenadas;
- alergia ou condicao medica;
- e-mail, nome pessoal ou token.

## Catalogo sintetico

Crie catalogos deterministas e variados a partir das estrategias das particoes.

Cada cenario deve possuir candidatos suficientes para permitir escolha real, preferencialmente entre 6 e 12 itens antes dos filtros.

Cada candidato sintetico deve declarar:

- ID estavel e claramente sintetico de restaurante;
- ID estavel e claramente sintetico de produto;
- categoria;
- preco;
- distancia aproximada em quilometros, sem coordenada;
- avaliacao sintetica;
- score operacional sintetico limitado;
- disponibilidade na janela;
- funcionamento na janela;
- antecedencia minima satisfeita ou nao;
- ficha de seguranca marcada apenas como verificada ou nao verificada, sem alergia individual;
- variante de catalogo.

Regras:

- preco respeita a faixa da particao;
- distancia respeita a faixa da particao;
- valores possuem arredondamento estavel;
- IDs nao se parecem com IDs reais da base;
- categorias cobrem preferidas, neutras e evitadas;
- existem opcoes proximas aos limites de orcamento e raio;
- nenhuma categoria e sempre a mais barata, mais proxima ou mais disponivel;
- desenvolvimento e validacao nao compartilham snapshots identicos;
- o catalogo nao codifica qual modelo deveria vencer.

## Disponibilidade e elegibilidade

Varie deterministicamente:

- restaurante aberto ou fechado;
- produto disponivel ou indisponivel;
- antecedencia atendida ou insuficiente;
- janela com tempo suficiente ou insuficiente;
- preco dentro ou fora do orcamento;
- distancia dentro ou fora do raio;
- ficha de seguranca verificada ou ausente.

Classifique candidatos com motivos estruturados, por exemplo:

- `FORA_ORCAMENTO`;
- `FORA_RAIO`;
- `RESTAURANTE_FECHADO`;
- `PRODUTO_INDISPONIVEL`;
- `ANTECEDENCIA_INSUFICIENTE`;
- `JANELA_INSUFICIENTE`;
- `SEGURANCA_NAO_VERIFICADA`.

O gerador apenas prepara e classifica fixtures. A regra oficial continua pertencendo ao dominio de recomendacao e sera validada em marcos posteriores.

Requisitos de cobertura:

- todo cenario possui pelo menos dois candidatos elegiveis;
- parte dos cenarios possui candidatos inelegiveis para cada motivo obrigatorio;
- nenhum candidato aparece simultaneamente em elegiveis e inelegiveis;
- todos os candidatos entregues futuramente aos modelos pertencem ao conjunto elegivel;
- nenhum cenario fica sem explicacao quando um candidato e eliminado.

## Historico sintetico

Gere historico coerente com `history_levels`:

- `NONE`: nenhum sinal;
- `LOW`: uma ou duas amostras recentes;
- `SUFFICIENT`: volume moderado, distribuido e consistente;
- `OLD`: sinais antigos dentro da janela permitida;
- `CONTRADICTORY`: sinais positivos e negativos sobre atributos relacionados;
- `GRADUAL_CHANGE`: mudanca temporal coerente com a persona.

Regras:

- grupo `controle_sem_historico` sempre permanece em `NONE`;
- sinais possuem IDs e chaves idempotentes sinteticas;
- todos os instantes antecedem o cenario;
- sinais consentidos e nao consentidos podem existir como fixtures distintas, mas somente os consentidos serao elegiveis futuramente;
- sinais excluidos podem existir apenas como teste e devem ser marcados inativos;
- nenhum sinal representa pagamento, entrega ou reserva real;
- conversao simulada deve permanecer explicitamente offline;
- a geracao nao acessa banco ou HTTP.

## Cobertura das personas

Para cada conjunto autorizado, comprove:

- 10 personas;
- 30 cenarios por persona;
- 6 semanas por persona;
- 5 cenarios por semana;
- pelo menos duas janelas alimentares no conjunto agregado;
- todos os niveis de historico previstos;
- casos proximos aos limites de preco e distancia;
- repeticao consecutiva e nao consecutiva;
- novidade de categoria e restaurante;
- mudanca gradual distribuida no tempo;
- contradicao reproduzivel;
- controle sem historico sem sinais de aprendizado.

O objetivo e cobertura equilibrada, nao distribuicao aleatoria irrestrita.

## Serializacao canonica

Implemente uma serializacao estavel.

Requisitos:

- ordem de chaves deterministica;
- ordem dos cenarios por `scenario_id` ou chave declarada e estavel;
- ordem de candidatos documentada e estavel;
- numeros normalizados sem variacao de ponto flutuante entre execucoes;
- fim de linha unico;
- codificacao UTF-8;
- newline final consistente;
- hash calculado sobre o mesmo conteudo gravado;
- escrita atomica para evitar arquivo parcial;
- reexecucao sem mudanca produz arquivo byte a byte identico.

Nao use timestamps volateis no arquivo.

## CLI de geracao

Crie um comando seguro, por exemplo:

```text
npm run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1
npm run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1
```

Requisitos:

- `--dataset` obrigatorio;
- aceita somente desenvolvimento e validacao;
- rejeita `reserva_prospectiva_v1` antes de ler material privado;
- valida hashes de personas e particoes;
- grava somente no diretorio de snapshots prospectivos;
- nao toca em `backend/reports/routine-intelligence/`;
- nao sobrescreve relatorios historicos;
- usa escrita atomica;
- retorna resumo estrutural sem listar sinais ou candidatos completos;
- nao imprime semente privada, sal, tokens ou dados sensiveis;
- possui modo `--check` que gera em memoria e compara com o arquivo existente sem grava-lo;
- possui modo `--stdout` somente para resumo seguro, nao para despejar todo o snapshot.

O comando de reserva nao deve existir neste marco.

## Manifesto dos snapshots

Crie um manifesto prospectivo separado contendo:

- versao do schema;
- versao do gerador;
- versao e hash das particoes;
- versao e hash das personas;
- caminho relativo de cada snapshot autorizado;
- SHA-256 bruto de cada arquivo;
- hash canonico dos cenarios;
- quantidade de cenarios;
- quantidade por persona;
- cobertura estrutural resumida;
- estado `GENERATED` ou equivalente;
- reserva prospectiva registrada apenas como `SEALED_UNMATERIALIZED`, sem caminho de snapshot;
- referencia a reserva historica contaminada;
- ausencia de resultados de modelo.

O manifesto nao deve transformar os snapshots em resultados experimentais. Ele identifica apenas entradas geradas.

## Auditoria de reproducibilidade

Execute, no minimo:

1. gere desenvolvimento em memoria duas vezes;
2. compare os objetos profundamente;
3. compare a serializacao canonica;
4. compare SHA-256;
5. grave desenvolvimento;
6. execute `--check` e confirme igualdade byte a byte;
7. repita para validacao;
8. gere uma persona isoladamente e compare com o recorte da geracao completa;
9. gere com ordem inversa de personas e confirme snapshots individuais identicos;
10. altere uma semente em fixture de teste e confirme mudanca de hash;
11. altere uma dimensao de cenario e confirme mudanca somente no ramo correspondente;
12. execute a auditoria novamente em um novo processo Node.

Se qualquer campo volatil impedir igualdade, remova-o do snapshot. Nao normalize diferencas reais como se fossem irrelevantes.

## Auditoria de sobreposicao

Amplie a prova do Dia 24 para os cenarios completos.

Compare desenvolvimento e validacao por:

- `scenario_id`;
- chave semantica;
- hash do snapshot de entrada;
- hash da sequencia por persona;
- ID sintetico de reacao;
- combinacao completa de instante, catalogo e disponibilidade;
- snapshot de candidatos;
- historico sintetico completo.

Resultados obrigatorios:

- sobreposicao de `scenario_id`: `0`;
- sobreposicao de chave semantica: `0`;
- sobreposicao de snapshot completo: `0`;
- sobreposicao de sequencia por persona: `0`;
- cobertura compartilhada de personas: `10`, esperada;
- cobertura compartilhada de categorias: esperada e documentada.

Nao considere o simples uso da mesma categoria ou persona como vazamento.

## Guardas da reserva

Confirme por teste e execucao segura:

- o CLI rejeita `reserva_prospectiva_v1`;
- nenhum arquivo de reserva prospectiva existe no diretorio de cenarios;
- o compromisso publico permanece inalterado;
- o arquivo privado continua ignorado;
- nenhum novo codigo de geracao importa `.private` ou `reserve-reveal-v1`;
- nenhum teste le o material privado;
- nenhuma semente da reserva aparece em logs, snapshots ou manifesto;
- o estado continua `SEALED_UNMATERIALIZED`;
- a reserva historica continua com hash inalterado.

## Privacidade e seguranca

Os snapshots devem ser seguros para versionamento.

Audite:

- e-mail;
- telefone;
- nome pessoal;
- endereco;
- latitude ou longitude;
- conteudo de agenda;
- alergia ou condicao medica individual;
- JWT;
- access token;
- refresh token;
- `service_role`;
- senha;
- IDs reais de autenticacao ou clientes.

IDs sinteticos devem possuir prefixos inequivocos, como `syn-rest-` e `syn-prod-`.

Nao inclua conteudo completo do material privado da reserva nem mesmo em fixtures de teste versionadas.

## Testes obrigatorios

Adicione testes para comprovar:

- gerador exige particao valida;
- desenvolvimento e validacao sao aceitos;
- reserva prospectiva e rejeitada;
- hash incorreto de personas e rejeitado;
- hash incorreto de particoes e rejeitado;
- mesma entrada produz objeto identico;
- mesma entrada produz bytes identicos;
- mesma entrada produz SHA-256 identico;
- execucoes em processos separados sao identicas;
- ordem das personas nao altera cenarios individuais;
- geracao isolada de persona coincide com recorte completo;
- semente diferente altera cenarios;
- componentes hierarquicos nao interferem entre si;
- nenhum uso de `Math.random()` ou `Date.now()` existe no gerador;
- todos os instantes pertencem ao periodo;
- existem 300 cenarios por conjunto;
- existem 30 cenarios por persona;
- existem 6 semanas e 5 dias por semana;
- IDs de cenario permanecem coerentes com o Dia 24;
- candidatos sinteticos possuem IDs seguros;
- preco e distancia respeitam as faixas;
- valores sao finitos e arredondados;
- todo cenario possui pelo menos dois elegiveis;
- inelegiveis possuem motivos estruturados;
- candidato nao aparece em ambas as listas;
- todos os niveis de historico aparecem;
- sinais sempre antecedem o cenario;
- controle sem historico nao possui sinais;
- chaves idempotentes sao unicas;
- desenvolvimento e validacao nao compartilham snapshots ou sequencias;
- snapshot nao contem nome ou resultado de modelo;
- snapshot nao contem PII ou segredo;
- manifesto possui hashes corretos;
- `--check` detecta arquivo adulterado;
- escrita atomica nao deixa arquivo parcial;
- reserva continua sem snapshot;
- baselines historicos permanecem intactos;
- rollout publico permanece zero.

## Testes de mutacao controlada

Inclua testes simples que demonstrem que a prova detecta defeitos reais:

- force em memoria o mesmo namespace e confirme colisao;
- copie um cenario de desenvolvimento para validacao e confirme falha;
- altere um byte do snapshot e confirme falha do `--check`;
- remova um candidato elegivel e confirme mudanca de hash;
- insira campo sensivel e confirme rejeicao;
- tente autorizar reserva e confirme bloqueio.

Nao deixe arquivos adulterados no repositorio depois dos testes.

## Documentacao do Dia 25

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-25.md`

O checkpoint deve registrar:

1. decisao do dia;
2. pre-condicoes verificadas;
3. arquitetura do gerador;
4. versao e hash do gerador;
5. versao e hash do manifesto de snapshots;
6. hashes de desenvolvimento e validacao;
7. total de cenarios por conjunto e persona;
8. cobertura de semanas, janelas, historico e eliminacoes;
9. prova de reproducibilidade em memoria, em disco e entre processos;
10. matriz de intersecao dos cenarios completos;
11. resultado dos testes de mutacao;
12. confirmacao de que nenhum modelo ou placar foi executado;
13. confirmacao de que a reserva prospectiva nao foi materializada;
14. confirmacao de que a reserva historica nao foi reexecutada;
15. preservacao dos hashes de 22, 23 e 24/09;
16. confirmacao de rollout publico zero;
17. limitacoes dos dados sinteticos;
18. trabalho marcado como `PREPARADO` para 28/09;
19. entrada exata para a simulacao longitudinal.

Atualize o calendario somente quando todos os criterios forem cumpridos. Marque apenas 25/09 como concluido. Os dias 26 e 27 sao reserva tecnica e nao precisam receber funcionalidade artificial se nao houver atraso.

## Verificacao obrigatoria

Descubra os comandos reais no `package.json` e execute os equivalentes existentes a:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

No Windows, use `npm.cmd` caso a politica local bloqueie `npm.ps1`.

Execute tambem:

- testes focados do gerador;
- testes de personas e particoes;
- auditoria de particoes;
- geracao de desenvolvimento duas vezes;
- `--check` de desenvolvimento;
- geracao de validacao duas vezes;
- `--check` de validacao;
- auditoria de snapshots e sequencias;
- auditoria de PII e segredos;
- verificacao dos hashes historicos;
- verificacao de rollout publico zero.

Nao execute:

- simulacao dos modelos sobre os novos snapshots;
- avaliacao de qualidade;
- reserva prospectiva;
- reserva historica;
- seed remoto;
- smoke remoto;
- migrations;
- pagamentos;
- e-mails;
- deploy.

## Criterios de encerramento de 25/09

O marco esta concluido somente quando:

- o gerador estiver isolado dos modelos;
- desenvolvimento e validacao forem materializados com 300 cenarios cada;
- a mesma entrada produzir o mesmo objeto, bytes e hash;
- a reexecucao em novo processo for identica;
- a ordem das personas nao alterar resultados;
- catalogo, disponibilidade e historico tiverem cobertura adequada;
- todos os cenarios possuirem pelo menos dois candidatos elegiveis;
- candidatos inelegiveis tiverem motivos estruturados;
- intersecao de cenarios, snapshots e sequencias for zero;
- manifesto dos snapshots estiver versionado e verificavel;
- CLI possuir modo seguro de geracao e `--check`;
- reserva prospectiva permanecer sem snapshot;
- reserva historica permanecer inalterada;
- nenhum resultado de modelo existir nos artefatos;
- hashes anteriores permanecerem validos;
- rollout publico permanecer zero;
- suite, builds, lint e `git diff --check` passarem;
- nenhum segredo ou PII aparecer no diff;
- checkpoint de 25/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `GERADOR_DETERMINISTICO_CONCLUIDO`: snapshots completos, reproduziveis, isolados e seguros;
- `GERADOR_PARCIAL`: geracao funciona, mas falta prova de reproducibilidade, cobertura ou isolamento;
- `GERADOR_BLOQUEADO`: nao e possivel gerar cenarios sem violar particoes ou abrir a reserva.

Nao declare a IA pronta, nao avalie V2.1 e nao promova modelo neste marco.

## Aceleracao segura

Como o objetivo e antecipar a entrega, prepare interfaces para a simulacao longitudinal de 28/09:

- leitor validado de snapshots;
- iterador canonico de cenarios;
- adaptador puro de candidato sintetico para o dominio de recomendacao;
- estado longitudinal isolado por modelo e persona;
- contrato de saida estrutural sem metricas implementadas hoje;
- verificacao de que todos os modelos receberao os mesmos candidatos elegiveis.

Pode marcar essas interfaces como `PREPARADO`, nunca como `CONCLUIDO`.

Nao execute controle, V1 ou V2 sobre os snapshots neste marco. Nao antecipe metricas de 29/09 nem revisao cega.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. arquivos criados ou alterados;
3. versao e hash do gerador;
4. hashes dos snapshots e manifesto;
5. quantidade e cobertura dos cenarios;
6. evidencia byte a byte de reproducibilidade;
7. matriz de intersecao completa;
8. cobertura de candidatos elegiveis e inelegiveis;
9. cobertura de historico por persona;
10. testes de mutacao e falhas detectadas;
11. testes, builds, lint e diff;
12. confirmacao de que nenhum modelo ou placar foi executado;
13. confirmacao de que a reserva continua selada;
14. confirmacao de rollout publico zero;
15. trabalho preparado para 28/09;
16. entrada exata do proximo marco: simulacao longitudinal de seis semanas sobre snapshots congelados.

Nao confunda reproducibilidade do gerador com qualidade da IA, variedade sintetica com representatividade de mercado ou snapshot de entrada com resultado experimental. O objetivo do dia e construir uma fonte de cenarios completa, deterministica e auditavel para que a comparacao entre os modelos dos proximos marcos seja justa.
