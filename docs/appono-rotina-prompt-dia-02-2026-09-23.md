# Prompt do Dia 2 - Personas coerentes da Appono Intelligence

Voce e um agente senior de produto, dados, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **23 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e **modelar, versionar e validar pelo menos dez personas sinteticas comportamentalmente coerentes**, com uma funcao de utilidade independente dos modelos avaliados e casos esperados executaveis.

Nao entregue apenas analise, lista de personas ou pseudocodigo. Inspecione o estado real do repositorio, preserve o baseline congelado em 22/09, implemente os artefatos de personas, adicione validacao e testes e produza um checkpoint datado. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data: `23/09/2026`.

Entrega prevista:

> Modelar personas coerentes: pelo menos dez personas com utilidade independente e casos esperados.

O dia somente pode ser encerrado quando cada persona possuir uma identidade comportamental verificavel, produzir preferencias relativas coerentes em casos simples e nao codificar a resposta que controle, V1 ou V2 deveriam escolher.

## Pre-condicao do Dia 1

Antes de editar, confirme:

- decisao de 22/09 igual a `BASELINE_CONGELADO`;
- protocolo congelado `appono-intelligence-longitudinal-v1`;
- controle `deterministico-v3`;
- V1 `appono-intelligence-v1`;
- V2 `appono-intelligence-v2`;
- regua independente `persona-utility-v1`;
- rollout publico igual a zero;
- conjunto de reserva marcado como `OPENED_ONCE`;
- hashes do manifesto e dos relatorios ainda validos;
- suite do backend, builds e lint sem regressao conhecida.

Se qualquer item estiver quebrado, corrija somente a infraestrutura do baseline e documente antes de iniciar as personas. Nao atualize hashes congelados para esconder uma divergencia.

## Estado conhecido das personas

O repositorio ja contem dez definicoes compactas em `routine-intelligence-simulation.js`:

1. `economico`;
2. `explorador`;
3. `fiel_restaurante`;
4. `fiel_prato`;
5. `sensivel_distancia`;
6. `avesso_repeticao`;
7. `preferencia_forte`;
8. `contraditorio`;
9. `mudanca_gradual`;
10. `controle_sem_historico`.

Essas definicoes sao um ponto de partida, nao a entrega do dia. Atualmente elas concentram configuracao e comportamento em poucos campos, sem contrato formal, descricao, janelas, aversoes, politica de decisao ou casos esperados por persona.

Nao remova nem altere silenciosamente as definicoes que produziram o baseline de 22/09. Modele a proxima versao em artefatos novos e versionados. A integracao com os tres conjuntos pertence aos marcos seguintes.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-22.md`;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-rotina-prompt-intelligence-v2.md`;
- `docs/appono-rotina-prompt-coleta-validacao-v2.md`;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/src/domain/routine-scoring.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-simulation.js`;
- `backend/src/domain/routine-experiment-manifest.js`;
- `backend/test/routine-intelligence-simulation.test.js`;
- `backend/test/routine-experiment-manifest.test.js`;
- relatorios congelados de desenvolvimento, validacao e reserva.

Leia tambem as instrucoes locais do repositorio. Este marco nao exige alteracao Supabase.

## Regras inegociaveis

1. Preserve o baseline e os relatorios congelados de 22/09.
2. Nao execute desenvolvimento, validacao ou reserva para recalibrar personas hoje.
3. Nao reexecute a reserva em nenhuma circunstancia.
4. Nao altere a formula do controle, V1 ou V2.
5. Nao use os pesos da V2 dentro da utilidade das personas.
6. Nao codifique qual modelo ou identificador de candidato deve vencer.
7. Nao use resultados conhecidos da reserva para ajustar comportamentos.
8. Nao represente alergia, restricao medica ou seguranca alimentar como gosto.
9. Nao use endereco, coordenada exata, agenda, suporte ou dados pessoais nas personas.
10. Nao gere nomes, e-mails ou identidades que parecam clientes reais.
11. Sinais sinteticos devem permanecer claramente identificados como simulacao offline.
12. Toda aleatoriedade deve possuir semente e ser reproduzivel.
13. O grupo sem historico nao pode gerar sinais de personalizacao.
14. Nao habilite rollout publico nem altere `.env` com credenciais.
15. Nao faca commit, push, deploy, pagamento, e-mail ou migration remota.

## Estrategia de versionamento

O manifesto de 22/09 e evidencia historica e nao deve ser reescrito para apontar aos novos artefatos.

Implemente as personas em arquivos novos, por exemplo:

- `backend/experiments/routine-intelligence/personas-v1.json` para os dados versionados;
- `backend/src/domain/routine-intelligence-personas.js` para validacao e utilidade independente;
- `backend/test/routine-intelligence-personas.test.js` para os contratos e casos esperados.

O nome exato pode seguir uma convencao melhor ja existente, mas preserve estas separacoes:

- definicao declarativa;
- validacao de schema;
- calculo de utilidade;
- politica de reacao;
- testes;
- documentacao.

Nao altere hoje os arquivos de modelo listados em `source_files` no manifesto congelado. Se uma integracao exigir isso, adie-a para o gerador versionado dos dias seguintes. O objetivo do Dia 23 e criar a fonte de verdade candidata sem apagar a referencia anterior.

Registre para o novo artefato:

- `schema_version`;
- `personas_version`;
- data de criacao;
- finalidade sintetica;
- hash SHA-256 canonico;
- lista de IDs estaveis;
- ausencia de PII;
- aviso de que nao representa clientes reais.

## Contrato minimo de persona

Cada persona deve declarar, de forma validavel:

- `id` estavel em `snake_case`;
- nome tecnico curto;
- objetivo comportamental;
- descricao sem PII;
- semente ou deslocamento de semente proprio;
- orcamento por refeicao;
- raio maximo;
- uma ou mais janelas alimentares;
- dias da semana aplicaveis;
- preferencias explicitas por categoria;
- afinidades latentes por categoria, restaurante ou produto;
- aversoes gastronomicas nao medicas;
- sensibilidade a preco;
- sensibilidade a distancia;
- preferencia por novidade;
- tolerancia a repeticao;
- intensidade de ruido controlado;
- limiares deterministas para aprovar, recusar, pedir alternativa ou editar;
- criterio de conversao estritamente offline;
- consentimento sintetico esperado;
- regra de evolucao temporal, quando aplicavel;
- pelo menos tres casos esperados simples.

Os valores devem possuir limites claros. Rejeite:

- IDs duplicados;
- listas vazias onde a persona exige preferencia;
- orcamento ou raio nao positivos;
- janelas invalidas;
- pesos `NaN` ou infinitos;
- categorias, produtos ou restaurantes simultaneamente em afinidade e aversao;
- limiares de decisao contraditorios;
- campos desconhecidos que possam esconder erro de digitacao;
- referencias a modelos avaliados.

## Funcao de utilidade independente

Implemente uma funcao pura e deterministica que estime a utilidade da opcao para a persona sem importar ou chamar:

- `routine-scoring.js`;
- `routine-intelligence.js`;
- `routine-intelligence-v2.js`;
- politica de rollout;
- avaliador sombra.

A utilidade pode considerar:

- aderencia a preferencia explicita;
- afinidade por categoria, restaurante e produto;
- aversao gastronomica nao medica;
- custo relativo ao orcamento;
- distancia relativa ao raio;
- novidade ou repeticao recente;
- sequencia semanal;
- mudanca temporal declarada;
- ruido deterministico limitado.

Requisitos:

- mesma entrada produz exatamente a mesma saida;
- cada contribuicao deve poder ser inspecionada separadamente;
- resultado deve ser finito;
- candidatos inelegiveis devem ser rejeitados antes da utilidade ou marcados explicitamente, nunca premiados;
- os pesos da utilidade pertencem a persona, nao a V2;
- a funcao nao conhece qual modelo escolheu o candidato;
- a funcao nao conhece os resultados de desenvolvimento, validacao ou reserva;
- empate intencional deve ser declarado no caso esperado.

Retorne um diagnostico sintetico minimo, como:

- utilidade total;
- contribuicao de preferencia;
- afinidade;
- aversao;
- custo;
- distancia;
- variedade;
- mudanca temporal;
- ruido aplicado.

Nao inclua PII nem explicacao voltada ao cliente nesse diagnostico.

## Politica de reacao sintetica

Implemente uma funcao pura que transforme utilidade relativa em uma reacao offline:

- `APROVACAO`;
- `RECUSA`;
- `ALTERNATIVA`;
- `EDICAO`;
- `CONVERSAO_SIMULADA` somente como metrica offline.

Regras:

- limiares pertencem a persona e devem ser ordenados coerentemente;
- uma conversao simulada nunca deve ser gravada como pedido, reserva ou pagamento;
- o grupo de controle nao produz sinal de personalizacao;
- consentimento sintetico desativado produz sinal neutro ou nenhum sinal;
- chaves sinteticas devem ser idempotentes;
- a reacao nao pode consultar nome do modelo;
- ruido nao pode transformar continuamente uma persona em comportamento aleatorio sem identidade.

## Personas obrigatorias

### 1. Economico consistente

Deve preferir opcoes elegiveis com maior folga no orcamento quando os demais atributos forem semelhantes. Preco baixo nao pode superar aversao declarada ou preferencia explicita forte.

Casos minimos:

- opcao equivalente mais barata vence;
- opcao barata de categoria evitada perde;
- opcao acima do orcamento e inelegivel.

### 2. Explorador

Deve valorizar categorias e restaurantes ainda nao usados, mantendo preferencias explicitas e limites eliminatorios.

Casos minimos:

- nova categoria vence repeticao equivalente;
- novidade nao vence preferencia explicitamente evitada;
- depois de varias opcoes novas, a penalidade de repeticao continua finita.

### 3. Fiel a restaurante

Deve demonstrar afinidade estavel por um restaurante especifico, sem ignorar custo, raio ou aversoes.

Casos minimos:

- restaurante favorito vence alternativa equivalente;
- favorito fora do raio e inelegivel;
- repeticao moderada ainda e aceitavel, mas nao infinita.

### 4. Fiel a prato

Deve priorizar um produto especifico mais do que apenas o restaurante.

Casos minimos:

- prato favorito vence outro prato do mesmo restaurante;
- outro restaurante com o prato ou categoria correta pode superar uma opcao irrelevante;
- produto acima do orcamento permanece inelegivel.

### 5. Sensivel a distancia

Deve diferenciar claramente deslocamentos dentro do raio permitido.

Casos minimos:

- opcao proxima vence uma equivalente distante;
- pequena vantagem de distancia nao anula preferencia explicita forte;
- fora do raio e inelegivel.

### 6. Avesso a repeticao

Deve penalizar progressivamente restaurante, produto e categoria repetidos, especialmente em sequencia.

Casos minimos:

- terceira repeticao perde para alternativa compativel;
- primeira repeticao moderada nao e banida;
- aversao a repeticao nao escolhe categoria explicitamente evitada.

### 7. Preferencia explicita forte

Deve demonstrar que uma preferencia declarada prevalece sobre pequenas vantagens de preco ou distancia.

Casos minimos:

- categoria preferida vence opcao apenas um pouco mais barata;
- categoria preferida vence opcao apenas um pouco mais proxima;
- limite eliminatorio continua prevalecendo sobre a preferencia.

### 8. Sinais contraditorios

Deve produzir comportamento misto, mas deterministico e explicavel, reduzindo consistencia sem virar sorteio livre.

Casos minimos:

- sinais positivos e negativos da mesma categoria se compensam;
- mesma semente reproduz a mesma sequencia;
- contradicao reduz confianca esperada, nao filtros eliminatorios.

### 9. Mudanca gradual de gosto

Deve migrar de uma afinidade inicial para outra ao longo das semanas, sem trocar abruptamente em um unico evento.

Casos minimos:

- categoria inicial vence nas primeiras semanas;
- existe periodo de transicao mensuravel;
- categoria nova vence apenas depois do ponto temporal declarado.

### 10. Controle sem historico

Deve possuir contexto elegivel, mas nunca gerar historico comportamental ou ajuste de personalizacao.

Casos minimos:

- utilidade externa ainda pode avaliar opcoes para a regua;
- politica de reacao nao produz sinal de aprendizado;
- confianca esperada da V2 permanece zero quando usado no experimento.

## Casos esperados

Cada caso esperado deve ser declarativo e independente de modelo. Estrutura sugerida:

```json
{
  "id": "economico_preco_equivalente",
  "contexto": {
    "semana": 0,
    "historico": []
  },
  "opcao_a": {
    "categoria": "Brasileira",
    "preco": 25,
    "distancia": 2
  },
  "opcao_b": {
    "categoria": "Brasileira",
    "preco": 35,
    "distancia": 2
  },
  "esperado": "A_MAIOR_QUE_B",
  "motivo": "preco"
}
```

Nao use IDs reais do catalogo para forcar o vencedor quando atributos sinteticos bastarem. Quando restaurante ou produto forem o proprio objeto do teste, use IDs sinteticos claramente documentados.

Exija pelo menos 30 casos no total, tres por persona. Casos adicionais de fronteira sao recomendados.

## Testes obrigatorios

Adicione testes para comprovar:

- existem exatamente ou pelo menos dez personas requeridas;
- IDs sao unicos e estaveis;
- schema e versao estao presentes;
- todas possuem orcamento, raio, janelas, dias e politica de decisao validos;
- nenhuma persona contem PII ou referencia a controle, V1 ou V2;
- todas possuem tres ou mais casos esperados;
- todos os casos esperados passam;
- utilidade e deterministica;
- contribuicoes somam a utilidade total dentro da tolerancia numerica;
- candidatos fora de orcamento ou raio nao sao avaliados como vencedores;
- preferencia forte supera pequenas vantagens de preco e distancia;
- economia nao supera aversao declarada;
- exploracao aumenta variedade;
- fidelidade nao anula filtros;
- repeticao recebe penalidade progressiva;
- contradicao e reproduzivel;
- mudanca de gosto e gradual;
- controle sem historico nao produz sinal;
- conversao simulada nao chama banco, HTTP, pagamento ou reservas;
- serializacao canonica produz hash estavel;
- alteracao de uma persona altera o hash candidato;
- baseline congelado de 22/09 continua passando sem mudanca.

## Documentacao do Dia 23

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-09-23.md`

O checkpoint deve registrar:

1. decisao do dia;
2. versao e hash do artefato de personas;
3. tabela resumida das dez personas;
4. comportamento central de cada uma;
5. quantidade de casos esperados;
6. formula geral da utilidade independente, sem confundi-la com a V2;
7. politica de reacao sintetica;
8. testes executados;
9. inconsistencias encontradas nas definicoes antigas;
10. mudancas aceitas e rejeitadas;
11. confirmacao de que o baseline de 22/09 permaneceu intacto;
12. confirmacao de que a reserva nao foi executada;
13. confirmacao de rollout publico zero;
14. limitacoes por serem personas sinteticas;
15. entrada exata para 24/09.

Atualize o calendario somente depois de cumprir todos os criterios. Marque apenas 23/09 como concluido.

## Aceleracao segura

Como o objetivo e tentar antecipar a entrega, estruture os artefatos de hoje para facilitar 24 e 25/09:

- schema reutilizavel pelos tres conjuntos;
- IDs e hashes estaveis;
- funcoes puras sem acesso a banco;
- separacao entre definicao, utilidade, reacao e geracao;
- contrato que aceite semente e relogio por parametro;
- exportacoes adequadas para um gerador futuro.

Depois de concluir o Dia 23, voce pode adiantar somente testes ou interfaces claramente compartilhados com os dias 24 e 25. Nao deve:

- marcar 24 ou 25 como concluidos;
- executar validacao ou reserva;
- alterar os hashes do baseline antigo;
- calibrar V2 com os novos casos;
- integrar a candidata ao fluxo real antes dos guardrails previstos.

Registre qualquer antecipacao separadamente como `PREPARADO`, nunca como `CONCLUIDO`.

## Verificacao obrigatoria

Execute ao final:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute tambem:

- testes focados das personas;
- testes do manifesto congelado;
- testes existentes da simulacao;
- calculo repetido do hash canonico das personas;
- varredura de PII nos novos artefatos;
- verificacao de que `reserva.json` manteve o mesmo hash;
- verificacao de rollout publico igual a zero.

Nao execute os scripts de simulacao dos conjuntos para ajustar resultados neste dia.

## Criterios de encerramento de 23/09

O marco esta concluido somente quando:

- pelo menos dez personas estiverem declaradas e versionadas;
- cada persona possuir identidade comportamental distinta;
- todas tiverem utilidade independente de controle, V1 e V2;
- todas tiverem tres ou mais casos esperados aprovados;
- utilidade, ruido e reacao forem deterministicos;
- janelas, dias, orcamento e raio forem validos;
- aversoes forem gastronomicas e nao medicas;
- o grupo de controle nao produzir sinal;
- mudanca gradual e contradicao tiverem testes especificos;
- hash canonico estiver registrado e reproduzivel;
- baseline de 22/09 permanecer verificavel;
- reserva nao tiver sido reexecutada;
- rollout publico permanecer zero;
- suite, builds, lint e `git diff --check` passarem;
- nenhum segredo ou PII estiver no diff;
- checkpoint de 23/09 estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `PERSONAS_CONGELADAS`: as dez personas e seus casos estao completos, coerentes e reproduziveis;
- `PERSONAS_PARCIAIS`: existem definicoes utilizaveis, mas faltam casos, validacao ou independencia;
- `PERSONAS_BLOQUEADAS`: a utilidade nao pode ser separada dos modelos ou os comportamentos nao sao coerentes.

Nao declare a IA pronta, nao aprove V2.1 e nao promova modelo neste marco.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. pendencias herdadas de 22/09 e como foram tratadas;
3. arquivos criados ou alterados;
4. versao e hash das personas;
5. resumo das dez personas;
6. total de casos esperados e resultados;
7. evidencia de independencia da utilidade;
8. evidencia de determinismo;
9. testes, builds, lint e diff;
10. confirmacao de reserva inalterada;
11. confirmacao de rollout zero;
12. trabalho preparado antecipadamente para 24 e 25/09;
13. entrada exata do proximo marco: separar conjuntos sem sobreposicao.

Nao confunda uma persona coerente com um cliente real, nem uma funcao de utilidade sintetica com a formula da IA. O objetivo de hoje e construir uma regua comportamental independente, reproduzivel e suficientemente clara para revelar qualidades e defeitos dos modelos nos proximos marcos.
