# Checkpoint da Appono Intelligence V2 - 23/09/2026

## Decisao do dia

`PERSONAS_CONGELADAS`

Dez personas sinteticas foram declaradas, versionadas e validadas por uma funcao de utilidade independente dos modelos de recomendacao. Os 30 casos esperados passaram e o baseline de 22/09 permaneceu intacto.

Este resultado valida coerencia experimental offline. As personas nao representam clientes reais e nao comprovam eficacia comercial da V2.

## Pre-condicao

O marco iniciou com:

- `BASELINE_CONGELADO` em 22/09;
- protocolo `appono-intelligence-longitudinal-v1` verificavel;
- relatorios congelados com hashes validos;
- reserva marcada como `OPENED_ONCE`;
- rollout publico igual a zero.

A lacuna documental de 22/09 sobre dependencias e migrations foi fechada antes do inicio deste marco. Nenhuma lacuna funcional permaneceu aberta.

## Artefatos

| Artefato | Identificador |
| --- | --- |
| Schema | `1` |
| Versao | `personas-sinteticas-v1` |
| Arquivo | `backend/experiments/routine-intelligence/personas-v1.json` |
| Hash canonico | `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474` |
| SHA-256 do arquivo | `c5d83db56cfb8a6a9ddabf9efddefe52afaf4d38fd93653540f0143a2dff1457` |
| Dominio independente | `routine-intelligence-personas.js` |
| SHA-256 do dominio | `1a8619d2d2a4e3ab4594a9b77e49989975047ff041abc7f4dd4df12d14e2652d` |
| Testes | `routine-intelligence-personas.test.js` |

O hash canonico ignora ordem de chaves em objetos, mas preserva a ordem significativa das listas. Uma alteracao de persona ou de seus casos modifica o hash.

## Personas

| ID | Comportamento central | Janela principal | Consentimento sintetico |
| --- | --- | --- | --- |
| `economico` | Alta sensibilidade a preco sem superar aversoes | Almoco em dias uteis | Sim |
| `explorador` | Novidade de categoria e restaurante | Jantar de quinta a sabado | Sim |
| `fiel_restaurante` | Afinidade persistente por estabelecimento | Almoco alternado | Sim |
| `fiel_prato` | Afinidade especifica por produto | Almoco de terca e quinta | Sim |
| `sensivel_distancia` | Alto custo para deslocamento adicional | Almoco curto em dias uteis | Sim |
| `avesso_repeticao` | Penalidade progressiva por sequencia repetida | Jantar alternado | Sim |
| `preferencia_forte` | Preferencia explicita supera pequenas vantagens concorrentes | Almoco em dias uteis | Sim |
| `contraditorio` | Sinais positivos e negativos compensaveis | Jantar alternado | Sim |
| `mudanca_gradual` | Migracao temporal de Massas para Asiatica | Jantar de quarta a sabado | Sim |
| `controle_sem_historico` | Regua externa sem gerar aprendizado | Almoco em dias uteis | Nao |

Cada persona declara:

- identificador estavel;
- objetivo e descricao sinteticos;
- orcamento e raio;
- dias e janelas alimentares;
- preferencias explicitas;
- afinidades e aversoes nao medicas;
- sensibilidades a preco e distancia;
- novidade e tolerancia a repeticao;
- ruido limitado e semeado;
- politica deterministica de reacao;
- consentimento sintetico;
- mudanca temporal ou contradicao quando aplicavel;
- tres casos esperados.

## Utilidade independente

A funcao externa nao importa nem chama controle, V1, V2, politica de rollout, banco ou HTTP.

A utilidade soma contribuicoes inspecionaveis de:

- preferencia explicita;
- afinidade por categoria;
- afinidade por restaurante;
- afinidade por produto;
- aversao gastronomica;
- custo relativo ao orcamento;
- distancia relativa ao raio;
- variedade e repeticao;
- evolucao temporal;
- sinais comportamentais sinteticos;
- ruido deterministico.

Orcamento e raio sao avaliados antes da utilidade. Um candidato inelegivel retorna motivo e nao recebe pontuacao.

A penalidade de repeticao usa saturacao progressiva. Ela cresce entre recorrencias, mas nao cresce indefinidamente nem faz uma categoria explicitamente evitada vencer apenas por ser nova.

## Reacao sintetica

A politica independente transforma diferenca para a melhor utilidade em:

- `CONVERSAO_SIMULADA`;
- `APROVACAO`;
- `EDICAO`;
- `ALTERNATIVA`;
- `RECUSA`.

Toda reacao possui chave idempotente prefixada por `offline`, e os campos `sintetico: true` e `persistir: false`. Nenhuma funcao acessa pagamento, pedido, reserva ou banco.

O grupo `controle_sem_historico` retorna `null` e nunca produz sinal de personalizacao.

## Casos esperados

Foram executados 30 casos, tres para cada persona:

- economia versus preco, aversao e orcamento;
- exploracao versus novidade, aversao e repeticao;
- fidelidade a restaurante versus equivalencia, raio e repeticao moderada;
- fidelidade a prato versus produto, categoria e orcamento;
- distancia versus opcao equivalente, preferencia forte e raio;
- aversao a repeticao versus recorrencia progressiva e categoria evitada;
- preferencia explicita versus preco, distancia e limite eliminatorio;
- sinais contraditorios compensados, saldo positivo e filtro eliminatorio;
- mudanca gradual no inicio, transicao e final;
- controle sem historico com utilidade externa, preco e raio.

Resultado: `30/30` aprovados.

## Inconsistencia encontrada e corrigida

A primeira execucao apresentou duas falhas na regua externa:

- `explorador_novidade_com_aversao`;
- `avesso_repeticao_novidade_evitada`.

Causa: a penalidade linear de repeticao podia crescer acima da aversao declarada e fazer uma categoria evitada parecer melhor.

Correcao: saturacao exponencial progressiva limitada a uma fracao da forca de aversao. A mudanca pertence apenas a nova regua sintetica e nao alterou controle, V1 ou V2.

Depois da correcao, os 30 casos passaram.

## Validacoes

Os testes focados comprovam:

- dez IDs unicos e estaveis;
- contrato e versao validos;
- nenhum campo desconhecido;
- conflitos entre afinidade e aversao rejeitados;
- limiares contraditorios rejeitados;
- utilidade deterministica e finita;
- soma das contribuicoes consistente;
- filtros de orcamento e raio preservados;
- repeticao progressiva e saturada;
- contradicao reproduzivel;
- mudanca temporal gradual;
- controle sem sinais;
- reacao sintetica idempotente e nao persistivel;
- hash canonico estavel;
- ausencia de PII e referencias aos modelos no artefato;
- dominio sem dependencias de modelos, banco, HTTP ou pagamentos.

Os oito testes existentes de manifesto e simulacao tambem passaram, demonstrando que o baseline de 22/09 permaneceu verificavel.

## Verificacao final

Foram executados localmente:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Resultados:

- backend: `167` testes aprovados e nenhuma falha;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com `49` rotas geradas;
- `git diff --check`: aprovado, com apenas aviso informativo de conversao futura entre LF e CRLF no calendario;
- testes focados das personas: `13` aprovados;
- testes existentes de manifesto e simulacao: `8` aprovados;
- hash canonico das personas reproduzido duas vezes com o mesmo valor;
- hash do relatorio de reserva confirmado sem alteracao.

Nenhum script de simulacao de desenvolvimento, validacao ou reserva foi executado neste marco.

## Integridade do baseline

- `manifest.json` de 22/09: nao alterado neste marco;
- modelos controle, V1 e V2: nao alterados;
- relatorios desenvolvimento e validacao: nao reexecutados;
- reserva: nao reexecutada;
- hash de `reserva.json`: `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185`;
- rollout publico: `0`;
- operacao remota: nenhuma.

## Aceleracao preparada

Estado: `PREPARADO`, nao `CONCLUIDO`.

Os artefatos de hoje antecipam parte da infraestrutura de 24 e 25/09:

- schema declarativo reutilizavel;
- IDs e hash canonico estaveis;
- utilidade e reacao puras;
- semente e relogio recebidos por contexto;
- diagnostico de contribuicoes;
- validacao de candidatos inelegiveis;
- contrato pronto para um gerador versionado.

Nenhum conjunto novo foi gerado e nenhum marco posterior foi marcado como concluido.

## Limitacoes

- As personas sao sinteticas e simplificam comportamento humano.
- Os casos esperados validam coerencia interna, nao qualidade de mercado.
- Conversao e apenas uma metrica offline e nao representa compra real.
- As personas ainda nao estao integradas aos conjuntos separados; esse e o marco seguinte.
- O conjunto de reserva conhecido nao pode orientar ajustes futuros.

## Entrada para 24/09

Separar desenvolvimento, validacao e uma estrategia metodologica de reserva sem sobreposicao. Como a reserva original ja foi aberta, o proximo marco deve preservar essa contaminacao documentada e nao criar silenciosamente um substituto conveniente. As novas personas devem ser distribuidas por cenarios diferentes, com testes de intersecao zero e sem executar a reserva.
