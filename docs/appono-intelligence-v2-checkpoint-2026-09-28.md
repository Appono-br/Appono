# Checkpoint da Appono Intelligence V2 - 28/09/2026

## Decisao do dia

`SIMULACAO_LONGITUDINAL_CONCLUIDA`

Desenvolvimento e validacao foram executados sobre os snapshots prospectivos congelados. Controle, V1 e V2 processaram os mesmos candidatos elegiveis, em estados isolados, com propagacao temporal de sinais e utilidade externa independente.

Este marco estava planejado para 28/09/2026 e foi executado antecipadamente em 22/09/2026.

O resultado comprova a execucao tecnica do protocolo. Ele ainda nao declara vencedor, nao aprova V2.1 e nao representa validacao com clientes reais.

## Pre-condicoes

O Dia 27 permanece decidido como `PRONTIDAO_LONGITUDINAL_APROVADA`.

Foram reconfirmados:

- contrato `routine-longitudinal-contract-v1`;
- ensaio seco aprovado em desenvolvimento e validacao;
- 300 cenarios por conjunto;
- dez personas, seis semanas e cinco decisoes por semana;
- intersecao zero entre os conjuntos;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- nenhum snapshot ou relatorio historico modificado.

## Estado inicial

- branch: `main`;
- `HEAD`: `7ae90fab4b130b8dea99785231cec1f5e92c1d21`;
- Node.js: `v24.14.0`;
- requisito do projeto: Node.js `>=22`;
- arvore com alteracoes dos marcos anteriores ainda sem commit;
- nenhuma operacao remota executada.

## Protocolo congelado

Foi criado:

`backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`

Identificadores:

- protocolo: `appono-intelligence-longitudinal-prospective-v1`;
- executor: `routine-longitudinal-simulation-v1`;
- contrato: `routine-longitudinal-contract-v1`;
- relatorio: `routine-longitudinal-raw-report-v1`;
- controle: `deterministico-v3`;
- referencia: `appono-intelligence-v1`;
- desafiante: `appono-intelligence-v2`;
- regua externa: `persona-utility-v1`.

Hash SHA-256 do protocolo:

`c256f587f9a9b60b0904e186d260b39e1f1e14dc4289ec40b9bd7b41a8c79f74`

O protocolo foi gravado antes da abertura da validacao e declara calibracao desativada, reserva inacessivel e ausencia de vencedor final.

## Integridade das entradas

| Artefato | SHA-256 | Estado |
| --- | --- | --- |
| Desenvolvimento | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` | `OK` |
| Validacao | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` | `OK` |
| Personas, canonico | `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474` | `OK` |
| Particoes, canonico | `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7` | `OK` |

As formulas permaneceram identificadas pelos hashes congelados:

- controle: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- V1: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- utilidade: `1a8619d2d2a4e3ab4594a9b77e49989975047ff041abc7f4dd4df12d14e2652d`.

## Executor longitudinal

Foi criado `routine-intelligence-longitudinal-simulation.js`.

Hash congelado antes da validacao:

`fd944210e032ff9dfdeb5212f3773e8305e1cbea076d81c6f69bde7c0f21084b`

O executor:

- valida protocolo, snapshots, personas e particoes;
- percorre cenarios na ordem persona, semana, dia e indice;
- cria uma copia da mesma entrada comum para cada modelo;
- entrega somente candidatos elegiveis;
- mantem estado por conjunto, persona e modelo;
- calcula utilidade externa sem consultar scores dos modelos;
- gera reacao sintetica por ramificacao;
- disponibiliza o sinal somente para decisoes posteriores;
- registra falha nativa e fallback separadamente;
- produz relatorio canonico sem consultar relogio real.

## Adaptacao dos modelos

### Controle

O adaptador usa `pontuarCandidato`, `penalidadeRepeticao` e o desempate existente. Orcamento, distancia, avaliacao, preferencia explicita, score operacional e historico entram apenas pelos campos congelados.

### V1

A V1 recebe o mesmo score base do controle e sinais anteriores adaptados ao contrato historico de feedback. A formula de `pontuarInteligenciaRotina` nao foi modificada.

### V2

A V2 recebe o mesmo score base, sinais consentidos anteriores, instante virtual e sequencia exclusiva da ramificacao. A formula de `pontuarInteligenciaRotinaV2` nao foi modificada.

Os IDs sinteticos textuais de restaurante e produto sao convertidos em numeros deterministas por SHA-256. A mesma conversao e aplicada ao candidato e aos sinais; ela adapta tipo, nao cria afinidade.

`CONVERSAO_SIMULADA` permanece identificada assim no relatorio. Para a entrada comportamental da V2 ela e reduzida a `APROVACAO`, evitando apresentar uma simulacao como pedido ou reserva real. `EDICAO` nao ensina atributos quando a fixture nao declara qual atributo foi alterado.

## Candidatos comuns

Cada cenario registrou:

- `common_input_sha256`;
- `candidate_set_sha256`;
- estado anterior e posterior por modelo;
- escolha nativa e escolha efetiva;
- score base, ajuste e score total separados.

As 1.800 execucoes receberam conjuntos elegiveis identicos dentro de cada cenario. Nenhum adaptador adicionou ou removeu candidato.

## Isolamento e causalidade

O estado usa a chave:

```text
dataset + persona + model_version
```

Uma escolha altera somente a ramificacao do modelo que a produziu. O sinal gerado em um cenario possui o instante desse cenario e so fica disponivel quando o proximo instante e estritamente posterior.

Depois da primeira divergencia, os historicos dos modelos tambem podem divergir. Portanto, as semanas posteriores avaliam trajetorias completas de politicas, nao um teste A/B com historico identico.

O grupo `controle_sem_historico` permaneceu com:

- zero sinais de aprendizado;
- ajuste V2 igual a zero;
- confianca V2 igual a zero;
- zero amostras efetivas;
- escolha V2 igual ao controle em todas as 30 decisoes de cada conjunto.

## Falha segura

Falhas dos desafiantes sao registradas com escolha nativa nula. O fallback do controle fica em campo separado e nao recebe credito de utilidade, reacao ou sinal para o modelo que falhou.

Falha do controle invalida tecnicamente o conjunto e nao fabrica escolha oficial. Testes com injecao de falha comprovaram ambos os comportamentos.

Nas execucoes reais deste marco houve:

- zero falhas do controle;
- zero falhas da V1;
- zero falhas da V2;
- zero fallbacks;
- zero violacoes eliminatorias.

## Desenvolvimento

- personas: 10;
- semanas por persona: 6;
- cenarios: 300;
- execucoes de modelo: 900;
- divergencias de escolhas dos desafiantes contra o controle: 30;
- falhas: 0;
- fallbacks: 0;
- violacoes eliminatorias: 0;
- neutralidade sem historico: aprovada;
- conteudo SHA-256: `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`;
- arquivo SHA-256: `b8033dc6d5b15e40e4ad2acc15897c65c451828953f1112b105a06f382718467`.

Reacoes sinteticas agregadas:

- `CONVERSAO_SIMULADA`: 283;
- `APROVACAO`: 74;
- `EDICAO`: 41;
- `ALTERNATIVA`: 30;
- `RECUSA`: 382.

## Validacao

- personas: 10;
- semanas por persona: 6;
- cenarios: 300;
- execucoes de modelo: 900;
- divergencias de escolhas dos desafiantes contra o controle: 47;
- falhas: 0;
- fallbacks: 0;
- violacoes eliminatorias: 0;
- neutralidade sem historico: aprovada;
- conteudo SHA-256: `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`;
- arquivo SHA-256: `1abfe85103adc84baf76735380eeb6eb7443b99519608c49e7dedc133669ecee`.

Reacoes sinteticas agregadas:

- `CONVERSAO_SIMULADA`: 325;
- `APROVACAO`: 50;
- `EDICAO`: 36;
- `ALTERNATIVA`: 19;
- `RECUSA`: 380.

As divergencias sao contagem tecnica. Nao indicam, por si so, melhora ou piora.

## Relatorios prospectivos

Foram criados:

- `backend/reports/routine-intelligence/prospective/desenvolvimento-v1.json`;
- `backend/reports/routine-intelligence/prospective/validacao-v1.json`;
- `backend/reports/routine-intelligence/prospective/manifest-v1.json`.

Hash do manifesto de relatorios:

`7223109f3f804805b6362ad7ef07b270808bd20f4e26d2622bdabc67fae36288`

Os relatorios nao contem vencedor final, PII, credenciais, reserva ou dados reais.

## Reprodutibilidade

Cada conjunto foi gravado com `--write` e imediatamente recalculado com `--check`.

Resultados:

- desenvolvimento recomposto byte a byte;
- validacao recomposta byte a byte;
- hashes de conteudo identicos;
- nenhuma dependencia do relogio real;
- nenhuma alteracao de snapshot;
- nenhuma sobrescrita de relatorio historico.

## Testes e verificacoes

Foram executados:

```text
node --test backend/test/routine-intelligence-longitudinal-simulation.test.js
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --write
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --write
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Resultados finais:

- testes focados: 13 aprovados em tres execucoes consecutivas;
- suite completa do backend: 233 testes aprovados;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com 49 rotas;
- auditorias de cenarios e particoes: aprovadas;
- reserva prospectiva: selada;
- rollout publico: zero.

## Arquivos criados

- `backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/scripts/simulate-routine-intelligence-longitudinal.js`;
- `backend/test/routine-intelligence-longitudinal-simulation.test.js`;
- `backend/reports/routine-intelligence/prospective/desenvolvimento-v1.json`;
- `backend/reports/routine-intelligence/prospective/validacao-v1.json`;
- `backend/reports/routine-intelligence/prospective/manifest-v1.json`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-28.md`.

## Arquivos alterados

- `backend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`.

Alteracoes locais anteriores foram preservadas.

## Garantias

- controle, V1 e V2 foram executados sem modificar suas formulas;
- nenhuma calibracao foi feita depois de observar desenvolvimento ou validacao;
- nenhum modelo recebeu candidato inelegivel;
- nenhuma reserva foi acessada;
- nenhum banco, HTTP, pagamento ou e-mail foi chamado;
- rollout publico permanece zero;
- nenhum commit, push, deploy ou migration remota ocorreu.

## Limitacoes

- toda evidencia e sintetica e offline;
- nao existem clientes reais suficientes para validar eficacia comercial;
- trajetorias posteriores a divergencias possuem historicos diferentes;
- os snapshots fornecem historias exogenas por cenario, complementadas pelas reacoes da propria ramificacao;
- divergencia nao significa qualidade;
- as metricas comparativas ainda precisam ser agregadas e analisadas no Dia 29.

## Estado preparado para 29/09

Marcado como `PREPARADO`, nao `CONCLUIDO`:

- dois relatorios brutos validados;
- schema canonico por decisao;
- utilidade escolhida e melhor utilidade;
- arrependimento bruto;
- confianca, amostras e consistencia;
- escolhas e reacoes por semana e persona;
- hashes de entrada e estado;
- matriz de falhas e guardrails.

## Entrada para 29/09

Agregar os relatorios prospectivos por conjunto, semana, persona e modelo. Calcular utilidade, arrependimento, aprovacao, recusa, alternativa, edicao, diversidade, repeticao, concentracao, confianca e regressao maxima sem alterar formulas ou flexibilizar os criterios congelados. Separar desenvolvimento de validacao e nao acessar a reserva.
