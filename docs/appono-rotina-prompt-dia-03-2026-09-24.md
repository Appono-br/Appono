# Prompt do Dia 3 - Separacao dos conjuntos experimentais da Appono Intelligence

Voce e um agente senior de produto, dados, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **24 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e **definir, versionar, selar e validar a separacao entre desenvolvimento, validacao e reserva**, impedindo sobreposicao de cenarios, vazamento de informacao e uso oportunista do conjunto de reserva.

Nao entregue apenas analise, uma lista de sementes ou pseudocodigo. Inspecione o estado real do repositorio, preserve os baselines congelados em 22 e 23/09, implemente os contratos de particao, adicione validadores e testes automatizados e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data: `24/09/2026`.

Entrega prevista:

> Separar conjuntos experimentais: desenvolvimento, validacao e reserva sem sobreposicao.

O dia somente pode ser encerrado quando o repositorio conseguir provar, por validacao executavel, que:

- os tres conjuntos possuem identidades, sementes, periodos e namespaces distintos;
- nenhuma chave de cenario pode pertencer a mais de um conjunto;
- nenhum resultado da reserva entra em calibracao, desenvolvimento ou decisao de V2.1;
- a reserva historica aberta permanece preservada e identificada como contaminada;
- uma estrategia prospectiva de fechamento esta pre-registrada sem executar seus cenarios;
- o gerador futuro recebera a particao como entrada, em vez de escolher conjuntos por convencao informal;
- os artefatos congelados de 22 e 23/09 permanecem verificaveis.

## Pre-condicoes dos dias anteriores

Antes de editar, confirme:

- decisao de 22/09 igual a `BASELINE_CONGELADO`;
- decisao de 23/09 igual a `PERSONAS_CONGELADAS`;
- protocolo historico `appono-intelligence-longitudinal-v1`;
- controle `deterministico-v3`;
- V1 `appono-intelligence-v1`;
- V2 `appono-intelligence-v2`;
- regua historica `persona-utility-v1`;
- personas candidatas `personas-sinteticas-v1`;
- hash canonico das personas igual a `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- reserva historica marcada como `OPENED_ONCE`;
- hash do relatorio historico de reserva igual a `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185`;
- rollout publico igual a zero;
- nenhuma regressao conhecida na suite, builds ou lint.

Se uma pre-condicao falhar, corrija somente a infraestrutura necessaria para restaurar a verificabilidade e documente a divergencia. Nao atualize hashes congelados para esconder mudanca de codigo ou artefato.

## Estado conhecido a tratar

O simulador historico ja declara tres configuracoes compactas em `routine-intelligence-simulation.js`:

- desenvolvimento: semente `22092026`, referencia `2026-01-05T12:00:00Z`;
- validacao: semente `23112026`, referencia `2026-03-02T12:00:00Z`;
- reserva: semente `10102026`, referencia `2026-05-04T12:00:00Z`.

Essas configuracoes produziram os relatorios congelados do baseline e nao devem ser alteradas. Entretanto, sementes e referencias diferentes, isoladamente, nao constituem prova suficiente de ausencia de sobreposicao.

Tambem existe uma limitacao metodologica importante: a reserva historica foi executada antes do fechamento da candidata. Ela deve permanecer disponivel como evidencia historica, mas nao pode ser tratada como uma reserva ainda cega nem orientar calibracao.

O marco de hoje deve criar uma **especificacao prospectiva de particoes**, sem apagar, rebatizar ou sobrescrever o protocolo historico.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-22.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-23.md`;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-rotina-prompt-dia-01-2026-09-22.md`;
- `docs/appono-rotina-prompt-dia-02-2026-09-23.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- todos os relatorios em `backend/reports/routine-intelligence/`;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-experiment-manifest.js`;
- `backend/scripts/simulate-routine-intelligence.js`;
- `backend/scripts/evaluate-routine-intelligence.js`;
- testes de manifesto, personas, simulacao, politica e avaliacao.

Leia tambem as instrucoes locais do repositorio. Este marco nao exige alteracao Supabase, banco remoto, autenticacao ou frontend.

## Regras inegociaveis

1. Preserve o manifesto, os relatorios e os hashes congelados de 22/09.
2. Preserve `personas-v1.json` e seu hash canonico congelado em 23/09.
3. Nao altere a formula do controle, V1, V2 ou da utilidade das personas.
4. Nao execute simulacao de desenvolvimento, validacao ou reserva para observar placares.
5. Nao reexecute a reserva historica em nenhuma circunstancia.
6. Nao use resultados da reserva historica para escolher sementes, faixas, catalogos ou regras da nova especificacao.
7. Nao crie silenciosamente uma nova reserva para substituir um resultado desfavoravel.
8. Qualquer reserva prospectiva deve ser declarada explicitamente como nova, pre-registrada antes de calibracao e permanecer sem resultado.
9. Nao materialize hoje cenarios completos da reserva prospectiva.
10. Codigo de desenvolvimento e calibracao nao pode importar descritores privados ou resultados da reserva.
11. Nao use IDs reais de clientes, e-mails, enderecos, coordenadas exatas, agenda, alergias ou tokens.
12. Nao altere filtros eliminatorios de seguranca, funcionamento, disponibilidade, agenda, orcamento ou raio.
13. Nao habilite rollout publico nem modifique credenciais em `.env`.
14. Nao faca commit, push, deploy, pagamento, e-mail ou migration remota.
15. Toda aleatoriedade futura deve derivar de uma semente explicita, de um namespace do conjunto e de uma chave estavel de cenario.
16. O mesmo identificador canonico de cenario jamais pode existir em dois conjuntos.

## Estrategia de versionamento

O manifesto `manifest.json` e evidencia historica. Nao o transforme no manifesto do novo protocolo e nao substitua seus hashes.

Crie artefatos novos, seguindo as convencoes existentes. Estrutura recomendada:

- `backend/experiments/routine-intelligence/partitions-v1.json`: especificacao declarativa publica dos conjuntos;
- `backend/experiments/routine-intelligence/reserve-commitment-v1.json`: compromisso criptografico e estado da reserva prospectiva, sem resultados;
- `backend/src/domain/routine-intelligence-partitions.js`: validacao, identificacao e verificacao de intersecoes;
- `backend/test/routine-intelligence-partitions.test.js`: contratos e testes de isolamento.

O nome exato pode acompanhar uma convencao local melhor, mas mantenha separadas:

- configuracao declarativa;
- validacao de schema;
- derivacao de IDs;
- auditoria de sobreposicao;
- protecao da reserva;
- testes;
- documentacao.

Registre, no minimo:

- `schema_version`;
- `partitions_version`;
- protocolo prospectivo;
- data e timezone do pre-registro;
- versao e hash canonico das personas;
- nomes e finalidades dos conjuntos;
- namespace estavel de cada conjunto;
- semente ou compromisso criptografico, conforme a politica de reserva;
- periodo virtual permitido;
- quantidade planejada de semanas e cenarios;
- regras de variacao;
- politica de acesso;
- estado do conjunto;
- hash canonico do artefato;
- ausencia de PII;
- referencia explicita ao baseline historico, sem modifica-lo.

## Modelo dos conjuntos

### Desenvolvimento

Finalidade:

- depuracao de fixtures, contratos e gerador;
- observacao detalhada de falhas;
- criacao de testes de regressao;
- investigacao de hipoteses gerais.

Pode ser executado repetidamente nos marcos posteriores. Seus resultados nao podem ser usados como validacao final.

Estado inicial recomendado: `REGISTERED_DEVELOPMENT`.

### Validacao

Finalidade:

- aceitar ou rejeitar mudancas desenvolvidas sem usar os mesmos cenarios;
- comparar versoes congeladas;
- avaliar regressao por persona e guardrails.

Pode ser executado somente pelos comandos de validacao previstos. Nao deve compartilhar chaves, sequencias ou instancias exatas com desenvolvimento.

Estado inicial recomendado: `REGISTERED_VALIDATION`.

### Reserva historica contaminada

Finalidade:

- preservar rastreabilidade do baseline de 22/09;
- registrar que o resultado ja foi observado;
- impedir uso futuro como evidencia cega.

Estado obrigatorio: `OPENED_ONCE_CONTAMINATED` ou equivalente inequivoco.

Ela nao deve ser apagada, regenerada, renomeada como validacao nem usada para calibrar V2 ou V2.1.

### Reserva prospectiva de fechamento

Finalidade:

- fornecer uma avaliacao futura pre-registrada depois que a candidata estiver congelada;
- responder ao problema metodologico da reserva historica sem ocultar sua contaminacao.

Requisitos:

- identificador diferente da reserva historica;
- justificativa registrada;
- criterios e quantidade definidos hoje;
- nenhum relatorio ou placar gerado hoje;
- estado `SEALED_UNMATERIALIZED`;
- comando de abertura separado e bloqueado por confirmacao explicita;
- somente o marco de fechamento pode materializa-la;
- qualquer abertura antecipada muda o estado para `COMPROMISED` e deve falhar no pipeline de aceitacao;
- nao substitui silenciosamente a reserva historica: os dois estados devem aparecer nos relatorios futuros.

## Politica de semente da reserva prospectiva

Nao exponha uma semente de reserva a modulos de calibracao.

Implemente uma das abordagens abaixo, escolhendo a mais simples e auditavel para o repositorio:

1. **Compromisso criptografico**: registre `SHA-256` da semente e de um sal, mantendo os valores reais fora dos modulos de calibracao e fora de logs. No fechamento, a abertura deve comprovar que semente e sal correspondem ao compromisso.
2. **Descritor selado local**: armazene a semente em artefato separado, nunca importado por desenvolvimento ou validacao, e registre no artefato publico apenas seu hash. O teste deve falhar se codigo de calibracao importar o descritor.

Nao coloque segredo em documentacao, saida de teste ou resposta final. Nao dependa de um servico remoto neste marco.

Se o ambiente atual nao permitir guardar material privado com seguranca, registre somente o contrato e o compromisso publico, marque a geracao segura da semente como pendencia operacional antes do fechamento e nao invente um valor previsivel.

## Contrato minimo de particao

Cada conjunto prospectivo deve declarar, de forma validavel:

- `id` estavel em `snake_case`;
- `tipo`: `DESENVOLVIMENTO`, `VALIDACAO` ou `RESERVA`;
- finalidade textual;
- namespace unico;
- versao do protocolo;
- referencia temporal inicial e final em UTC;
- timezone de apresentacao;
- quantidade minima de semanas;
- quantidade planejada de decisoes por persona;
- politica de semente;
- estrategia de catalogo;
- faixas de preco e distancia;
- categorias disponiveis;
- regras de disponibilidade;
- niveis de pouco historico, historico antigo, contradicao e mudanca temporal;
- IDs de personas aplicaveis;
- estado operacional;
- permissoes de uso;
- lista de comandos autorizados;
- campos proibidos;
- versao da funcao que deriva IDs de cenario.

Rejeite:

- IDs, namespaces ou sementes publicas duplicadas;
- periodos virtuais sobrepostos quando a data fizer parte da identidade;
- conjunto sem todas as personas exigidas;
- conjunto com persona desconhecida;
- reserva marcada como executavel por comando de desenvolvimento;
- reserva com resultado, metrica ou placar no descritor;
- faixas invalidas ou vazias;
- quantidade de semanas menor que seis;
- campos desconhecidos;
- referencia a e-mail, endereco, coordenada exata, token ou identidade real;
- importacao de resultado congelado para definir configuracao prospectiva.

## Identidade canonica de cenario

Crie uma funcao pura que derive um identificador estavel sem PII. Estrutura conceitual:

```text
scenario_id = SHA-256(
  partitions_version +
  dataset_namespace +
  persona_version +
  persona_id +
  virtual_week +
  virtual_day +
  meal_window +
  catalog_variant +
  availability_variant +
  scenario_index
)
```

Requisitos:

- mesma entrada produz exatamente o mesmo ID;
- mudanca de conjunto muda o ID mesmo com demais atributos iguais;
- nenhuma entrada contem PII;
- a funcao rejeita campo ausente ou invalido;
- o ID nao revela diretamente semente privada da reserva;
- o formato e versionado;
- a serializacao e canonica e independente da ordem de chaves;
- o gerador de 25/09 podera reutilizar a funcao sem conhecer resultados dos modelos.

Crie tambem uma chave semantica de auditoria, separada do ID criptografico, contendo somente atributos nao sensiveis necessarios para detectar duplicidade acidental.

## Definicao de sobreposicao

Nao limite a verificacao a igualdade de semente.

Considere sobreposicao quando dois conjuntos compartilham qualquer um dos seguintes elementos indevidamente:

- mesmo `scenario_id`;
- mesma chave semantica completa;
- mesma sequencia temporal de candidatos para a mesma persona;
- mesma combinacao de catalogo, disponibilidade, semana, dia e janela;
- mesmo snapshot canonico de entrada;
- mesma chave de reacao sintetica;
- mesmo namespace ou intervalo reservado de IDs.

Compartilhar a definicao da persona e permitido e desejavel: todas as personas devem ser avaliadas nos tres conjuntos. O que nao pode ser compartilhado e a mesma **instancia de cenario**.

Compartilhar categorias ou faixas gerais tambem e permitido. O teste deve distinguir cobertura comparavel de duplicacao literal.

## Plano declarativo de cenarios

Sem executar a simulacao, declare um plano suficiente para o gerador de 25/09 produzir variacao independente.

Cada conjunto deve prever:

- seis ou mais semanas por persona;
- ao menos cinco decisoes virtuais por semana quando aplicavel;
- variacao de preco dentro e proxima dos limites;
- variacao de distancia dentro e proxima dos limites;
- categorias preferidas, neutras e evitadas;
- disponibilidade alternada por janela e dia;
- pouco historico;
- historico suficiente;
- historico antigo;
- sinais contraditorios;
- mudanca gradual de gosto;
- repeticao consecutiva e nao consecutiva;
- grupo sem historico;
- candidatos inelegiveis usados apenas para validar filtros, nunca entregues aos modelos.

Os conjuntos devem ter cobertura comparavel, mas combinacoes concretas distintas. Nao use o mesmo snapshot mudando apenas o nome do conjunto.

## Matriz de independencia

Produza uma funcao ou relatorio local que compare os descritores sem gerar placares.

Para cada par:

- desenvolvimento x validacao;
- desenvolvimento x reserva prospectiva;
- validacao x reserva prospectiva;

registre:

- namespaces iguais: deve ser falso;
- sementes publicas iguais: deve ser falso ou nao aplicavel;
- periodos sobrepostos: deve ser falso;
- IDs de cenario sobrepostos: deve ser zero;
- chaves semanticas sobrepostas: deve ser zero;
- snapshots sobrepostos: deve ser zero quando materializados futuramente;
- personas cobertas em comum: esperado e documentado;
- categorias cobertas em comum: esperado e documentado;
- regras de variacao equivalentes: comparaveis, nao identicas nas instancias.

O resultado deve diferenciar claramente **cobertura compartilhada** de **vazamento de instancias**.

## Guardas contra vazamento

Implemente validacoes para impedir:

- importar modulo ou descritor da reserva em codigo de desenvolvimento;
- executar reserva pelo comando padrao;
- gravar relatorio da reserva sem transicao de estado explicita;
- abrir reserva antes de congelar a versao candidata;
- usar metrica da reserva na escolha de pesos;
- comparar execucoes com versoes de personas ou particoes diferentes como se fossem equivalentes;
- sobrescrever relatorio historico;
- reutilizar ID de cenario entre conjuntos;
- modificar uma particao congelada sem alterar sua versao e hash.

Prefira guardas no dominio e testes, nao apenas comentarios.

O comando futuro de abertura da reserva prospectiva deve exigir, no minimo:

- flag explicita;
- versao candidata congelada;
- hash esperado das particoes;
- confirmacao do compromisso da semente;
- destino novo, nunca o arquivo historico `reserva.json`;
- falha quando o estado nao for `SEALED_UNMATERIALIZED`;
- registro de abertura unica.

Nao implemente a execucao completa da reserva hoje; implemente somente o contrato e, se necessario, a guarda que a mantem fechada.

## Relacao com o gerador de 25/09

Prepare interfaces puras para que o gerador futuro receba:

- descritor validado do conjunto;
- persona validada;
- numero da semana e do dia;
- janela alimentar;
- variante de catalogo;
- variante de disponibilidade;
- fonte de aleatoriedade derivada;
- relogio virtual explicito.

O gerador nao deve escolher automaticamente entre desenvolvimento, validacao e reserva com base em `NODE_ENV`, data real, branch Git ou variavel implicita.

O conjunto deve ser uma entrada obrigatoria e validada.

Hoje e permitido adiantar:

- tipos documentais em JavaScript;
- validadores;
- serializacao canonica;
- derivacao de IDs;
- matriz de independencia;
- protecao de acesso a reserva;
- fixtures minimas usadas apenas para testar intersecoes.

Hoje nao e permitido adiantar:

- placares dos modelos com as novas personas;
- simulacao longitudinal completa;
- avaliacao de validacao;
- materializacao da reserva;
- calibracao de V2.1;
- integracao ao fluxo real de planejamento.

## Testes obrigatorios

Adicione testes para comprovar:

- existem tres particoes prospectivas com IDs e namespaces unicos;
- desenvolvimento, validacao e reserva possuem finalidades distintas;
- todas referenciam exatamente a versao congelada de personas;
- todas cobrem as dez personas sem duplicar instancias;
- periodos virtuais nao se sobrepoem;
- sementes publicas nao se repetem;
- a reserva usa compromisso ou descritor selado;
- a reserva prospectiva inicia `SEALED_UNMATERIALIZED`;
- a reserva historica continua `OPENED_ONCE` no manifesto congelado;
- nenhum resultado ou placar existe no descritor da reserva prospectiva;
- IDs de cenario sao deterministicos;
- mudar namespace muda o ID;
- mudar semana, dia, janela ou variante muda o ID;
- ordem de chaves nao altera o hash canonico;
- chaves incompletas sao rejeitadas;
- intersecao de IDs entre os tres conjuntos e zero;
- intersecao de chaves semanticas entre os tres conjuntos e zero;
- cobertura comum de personas e categorias nao e classificada como vazamento;
- tentativa de importar ou acessar reserva por caminho de desenvolvimento falha;
- comando padrao nao abre reserva;
- abertura antecipada seria recusada;
- mudanca no descritor altera o hash canonico;
- PII e campos sensiveis sao rejeitados;
- manifesto e relatorios historicos mantem seus hashes;
- artefato de personas mantem seu hash canonico;
- rollout publico permanece zero.

Use fixtures pequenas para os testes de identidade e intersecao. Nao execute os modelos nem produza metricas de qualidade.

## Auditoria estatica

Inclua verificacoes simples e explicaveis para procurar nos novos artefatos:

- e-mail;
- telefone;
- endereco;
- latitude ou longitude exata;
- JWT;
- access token;
- refresh token;
- `service_role`;
- alergia ou condicao medica usada como preferencia;
- nomes dos modelos dentro da funcao de identidade do cenario.

Falsos positivos devem ser analisados e documentados, nao simplesmente ignorados com uma lista ampla.

## Documentacao do Dia 24

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-24.md`

O checkpoint deve registrar:

1. decisao do dia;
2. pre-condicoes verificadas;
3. versao e hash canonico das particoes;
4. tabela de desenvolvimento, validacao, reserva historica e reserva prospectiva;
5. finalidade, namespace, periodo e estado de cada conjunto;
6. politica de identidade de cenario;
7. definicao operacional de sobreposicao;
8. matriz de independencia;
9. politica de semente e compromisso da reserva;
10. testes de vazamento e resultados;
11. confirmacao de que nenhum conjunto foi simulado;
12. confirmacao de que a reserva historica nao foi reexecutada;
13. confirmacao de que a reserva prospectiva nao foi materializada;
14. confirmacao de que os baselines de 22 e 23/09 permaneceram intactos;
15. confirmacao de rollout publico zero;
16. limitacoes metodologicas;
17. trabalho marcado como `PREPARADO` para 25/09;
18. entrada exata para o gerador deterministico.

Atualize o calendario somente depois de cumprir todos os criterios. Marque apenas 24/09 como concluido.

## Verificacao obrigatoria

Descubra primeiro os comandos reais no `package.json`. Execute os equivalentes existentes a:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute tambem:

- testes focados das particoes;
- testes das personas;
- testes do manifesto congelado;
- testes existentes da simulacao sem executar os scripts que gravam relatorios;
- calculo repetido do hash canonico das particoes;
- auditoria de intersecao zero;
- auditoria estatica de PII;
- verificacao do hash de `reserva.json`;
- verificacao do hash canonico de `personas-v1.json`;
- verificacao de rollout publico igual a zero.

Nao execute:

- `simulate:rotina:intelligence` para qualquer conjunto;
- `evaluate:rotina:intelligence` para recalibracao;
- seed ou smoke remoto;
- migrations;
- pagamentos;
- e-mails;
- deploy.

## Criterios de encerramento de 24/09

O marco esta concluido somente quando:

- uma especificacao prospectiva de particoes estiver declarada e versionada;
- desenvolvimento, validacao e reserva tiverem namespaces distintos;
- periodos e estrategias de variacao forem independentes;
- identidade canonica de cenario estiver implementada e testada;
- intersecoes de IDs e chaves semanticas forem zero;
- cobertura comparavel nao for confundida com vazamento;
- a reserva historica continuar preservada como `OPENED_ONCE`;
- a contaminacao historica estiver declarada;
- a reserva prospectiva estiver pre-registrada e selada sem resultados;
- o codigo de calibracao nao puder acessar a reserva;
- nenhuma simulacao ou avaliacao de placar tiver sido executada;
- manifesto, relatorios e personas congelados permanecerem verificaveis;
- rollout publico permanecer zero;
- suite, builds, lint e `git diff --check` passarem;
- nenhum segredo ou PII aparecer no diff;
- checkpoint de 24/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `CONJUNTOS_SEPARADOS`: particoes versionadas, intersecao zero comprovada e reserva prospectiva selada;
- `CONJUNTOS_PARCIAIS`: particoes existem, mas falta prova de isolamento, compromisso da reserva ou guarda de acesso;
- `CONJUNTOS_BLOQUEADOS`: nao e possivel separar instancias sem modificar o baseline ou expor a reserva.

Nao declare a IA pronta, nao aprove V2.1 e nao promova modelo neste marco.

## Aceleracao segura

Como o objetivo e antecipar a entrega, prepare o contrato para que o Dia 25 possa se concentrar na geracao deterministica.

Pode ficar marcado como `PREPARADO`:

- interface do gerador;
- derivacao hierarquica de sementes;
- relogio virtual por parametro;
- estrutura do snapshot de entrada;
- verificador de intersecao aplicavel a cenarios materializados;
- protecao para escrita de relatorios por conjunto.

Nao marque 25/09 como concluido sem:

- geracao real de cenarios;
- reproducibilidade byte a byte ou semantica comprovada;
- variacao suficiente de catalogo e disponibilidade;
- testes completos do gerador.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. arquivos criados ou alterados;
3. versao e hash das particoes;
4. matriz de independencia;
5. prova de intersecao zero;
6. tratamento da reserva historica contaminada;
7. estado e compromisso da reserva prospectiva;
8. evidencia de que nenhuma reserva foi executada;
9. evidencia de que nenhum placar foi observado;
10. preservacao dos hashes de 22 e 23/09;
11. testes, builds, lint e diff;
12. confirmacao de rollout publico zero;
13. trabalho preparado antecipadamente para 25/09;
14. entrada exata do proximo marco: gerador deterministico que consome as particoes validadas.

Nao confunda sementes diferentes com isolamento comprovado, cobertura comum com vazamento ou uma reserva ja observada com evidencia cega. O objetivo do dia e tornar a separacao dos conjuntos uma propriedade verificavel do sistema experimental, antes que novos cenarios sejam gerados ou qualquer formula seja calibrada.
