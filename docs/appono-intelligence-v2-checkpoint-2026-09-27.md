# Checkpoint da Appono Intelligence V2 - 27/09/2026

## Decisao do dia

`PRONTIDAO_LONGITUDINAL_APROVADA`

O pipeline prospectivo possui agora um contrato estrutural puro, ordem temporal canonica, entradas comuns, estados isolados e barreira de consentimento. Desenvolvimento e validacao foram percorridos em ensaio seco sem executar modelos, produzir escolhas, scores ou placares.

Este marco estava planejado para 27/09/2026 e foi executado antecipadamente em 22/09/2026.

## Fechamento do Dia 26

O Dia 26 permanece decidido como `RESERVA_TECNICA_APROVADA_COM_CORRECOES`.

Foram reconfirmados:

- schema fechado dos snapshots;
- rejeicao de coercao numerica;
- rejeicao de candidatos duplicados;
- ajuda segura da CLI do gerador;
- dois snapshots byte a byte compativeis;
- auditorias de particoes e cenarios aprovadas;
- nenhum snapshot ou relatorio modificado;
- reserva prospectiva sem materializacao;
- `git diff --check` aprovado.

Nao existe pendencia bloqueante herdada de 26/09.

## Estado inicial

- branch: `main`;
- `HEAD`: `7ae90fab4b130b8dea99785231cec1f5e92c1d21`;
- Node.js: `v24.14.0`;
- npm: `11.9.0`;
- arvore com alteracoes dos Dias 26 e 27 ainda sem commit;
- alteracao anterior do `README.md` preservada;
- nenhuma operacao remota realizada.

## Integridade preservada

| Artefato | SHA-256 observado | Estado |
| --- | --- | --- |
| Desenvolvimento | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` | `OK` |
| Validacao | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` | `OK` |
| Reserva historica | `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185` | `OK` |
| Personas, canonico | `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474` | `OK` |
| Particoes, canonico | `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7` | `OK` |

Desenvolvimento e validacao continuam com 300 cenarios cada e intersecao zero. A reserva historica permanece `OPENED_ONCE_CONTAMINATED`; a reserva prospectiva permanece `SEALED_UNMATERIALIZED`.

## Decisao de runtime

Node.js `>=22` passou a ser declarado em:

- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- entradas correspondentes de `package-lock.json`.

A faixa formaliza o requisito que ja estava documentado no README, sem fixar a versao local `24.14.0`. Nenhuma dependencia foi adicionada ou atualizada.

Uma tentativa de executar `npm.cmd install --package-lock-only --ignore-scripts --offline` falhou com `ENOTCACHED`, pois o cache local nao continha `js-tokens`. O comando nao alterou dependencias. A coerencia foi validada diretamente:

- os quatro arquivos JSON sao validos;
- raiz, backend e frontend declaram `>=22`;
- as tres entradas do lockfile declaram `>=22`;
- suite, builds e lint passaram com o lockfile resultante.

## Auditoria do simulador historico

O modulo `routine-intelligence-simulation.js` foi lido, mas nao executado neste marco.

Ele:

- importa diretamente controle, V1, V2 e avaliador sombra;
- usa personas e catalogo compactos definidos no proprio codigo;
- gera candidatos diferentes dos snapshots prospectivos;
- calcula utilidade, arrependimento, confianca e concentracao;
- mantem estado separado por modelo;
- gera uma reacao baseada na escolha do controle;
- compartilha essa lista de sinais entre os tres modelos;
- permite o conjunto historico de reserva com confirmacao especifica;
- alimenta relatorios historicos ja observados.

Riscos para reutilizacao direta:

- catalogo e personas nao correspondem aos artefatos prospectivos congelados;
- sinais derivados do controle podem favorecer ou limitar desafiantes de forma assimetrica;
- resultados historicos ja foram observados;
- simulacao, avaliacao e escrita de relatorios estao acopladas;
- o protocolo historico possui uma reserva contaminada.

Decisao: o simulador historico foi preservado como evidencia. O pipeline prospectivo sera implementado separadamente sobre os snapshots validados.

## Contrato prospectivo

Foi criado `routine-intelligence-longitudinal-contract.js`, versao:

`routine-longitudinal-contract-v1`

O modulo nao importa:

- controle;
- V1;
- V2;
- avaliador sombra;
- banco, HTTP ou Supabase.

Ele oferece:

- validacao de conjunto permitido;
- ordem longitudinal canonica;
- selecao temporal de sinais consentidos;
- entrada comum imutavel;
- copia independente por consumidor;
- registro de estado isolado;
- transicao estrutural idempotente;
- ensaio seco agregado.

Hashes dos novos arquivos:

- contrato: `f4194266319ad080648b7bb82e4a03b57ee0edbae0833837c6ecc1a4a4d18e1a`;
- CLI: `3b5a32e054281f0817acac216fe96c15239960fe4b468c0462a120ce920442c5`;
- testes: `599f3142870f6f7494264489e08e5572b456e58c45e69b180ede325bbe63886e`.

## Entrada comum

Cada cenario produz uma entrada com:

- versao do contrato;
- particao e cenario;
- persona, semana, dia e indice;
- instante UTC e janela;
- perfil sintetico permitido;
- escolhas recentes;
- sinais anteriores elegiveis;
- candidatos elegiveis;
- hash canonico.

A entrada nao possui nome do modelo, escolha, ranking, score, confianca, utilidade ou vencedor.

Para cada cenario, as tres chaves opacas de modelo recebem copias semanticamente identicas. A mutacao de uma copia nao altera outra nem o snapshot original.

## Ordem longitudinal

A ordem canonica utiliza:

1. persona;
2. semana virtual;
3. dia virtual;
4. indice do cenario.

Foram comprovados:

- dez personas;
- seis semanas por persona;
- cinco cenarios por semana;
- indices de `0` a `29` sem lacuna;
- instantes estritamente crescentes;
- independencia da ordem original do array;
- hashes de sequencia diferentes entre desenvolvimento e validacao;
- recusa de semana ausente, indice duplicado e regressao temporal.

O `scenario_id` nao e usado como ordem temporal principal.

## Estado isolado

O registro estrutural usa a chave:

```text
dataset + persona + model_version
```

Cada conjunto cria 30 estados independentes: dez personas por tres identificadores opacos de modelo.

O estado registra apenas:

- cenarios processados;
- sinais processados;
- ultimo instante;
- colecoes vazias para escolhas e falhas futuras.

Nenhuma escolha ou metrica foi preenchida. Os testes comprovam que mutar um estado nao altera outro e que cenario repetido ou instante anterior falha.

## Consentimento e temporalidade

Um sinal estrutural e elegivel somente quando:

- e sintetico e offline;
- esta ativo;
- possui consentimento valido;
- ocorreu antes do cenario;
- sua chave ainda nao foi processada.

O grupo `controle_sem_historico` sempre recebe lista vazia. Sinal futuro falha; duplicata, inativo e sem consentimento nao personalizam.

O contrato nao atribui peso e nao converte evento em score.

## Ensaio seco

Foi criado o comando:

```text
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=<conjunto> --check
```

### Desenvolvimento

- personas: 10;
- semanas por persona: 6;
- cenarios: 300;
- entradas comuns: 300;
- copias para consumidores: 900;
- estados isolados: 30;
- candidatos elegiveis: 1.200;
- sinais elegiveis: 855;
- sinais inativos ignorados: 45;
- sinais sem consentimento ignorados: 45;
- modelos executados: 0;
- decisoes produzidas: 0;
- scores produzidos: 0;
- reserva acessada: nao.

### Validacao

Apresentou as mesmas contagens estruturais e hashes de sequencia distintos. Nenhum arquivo foi gravado.

A CLI:

- exige `--check`;
- aceita apenas desenvolvimento e validacao;
- verifica o hash do snapshot;
- recusa qualquer conjunto de reserva;
- oferece `--help` seguro;
- imprime somente resumo agregado.

## Testes de falha segura

Foram cobertos:

- reserva recusada;
- cenario ausente;
- indice duplicado;
- regressao temporal;
- cenario reprocessado;
- sinal futuro;
- sinal duplicado;
- sinal inativo;
- sinal sem consentimento;
- campo desconhecido na entrada comum;
- hash da entrada alterado;
- estado compartilhado entre modelos;
- importacao indevida de modelo, relogio, rede ou banco;
- execucao da CLI sem decisao ou score.

## Arquivos criados

- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/scripts/prepare-routine-intelligence-longitudinal.js`;
- `backend/test/routine-intelligence-longitudinal-contract.test.js`;
- `docs/appono-intelligence-v2-checkpoint-2026-09-27.md`.

## Arquivos alterados no Dia 27

- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `package-lock.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`.

As alteracoes anteriores do README e do Dia 26 foram preservadas.

## Verificacao executada

```text
node --test backend/test/routine-intelligence-longitudinal-contract.test.js
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run prepare:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Resultados:

- testes focados: 13 aprovados em tres execucoes;
- suite completa do backend: 220 aprovados;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com 49 rotas;
- geracao em modo `--check`: aprovada nos dois conjuntos;
- auditorias de cenarios e particoes: aprovadas;
- `git diff --check`: aprovado, com avisos de normalizacao LF/CRLF.

## Garantias do marco

- controle, V1 e V2 nao foram executados sobre os snapshots;
- nenhum script de simulacao ou avaliacao foi executado;
- nenhum placar ou metrica de qualidade foi produzido;
- nenhum snapshot ou relatorio foi escrito;
- reserva historica nao foi reexecutada;
- reserva prospectiva nao foi acessada ou materializada;
- rollout publico permanece zero;
- nenhuma migration, operacao remota, commit, push ou deploy ocorreu.

## Estado preparado para 28/09

Marcado como `PREPARADO`, nao `CONCLUIDO`:

- leitor e validador dos snapshots;
- contrato comum de entrada;
- candidatos elegiveis identicos;
- ordem longitudinal;
- estados isolados;
- filtro temporal e de consentimento;
- ensaio seco;
- lista congelada de modelos no adaptador operacional futuro;
- guardas contra reserva.

Continuam abertos para 28/09:

- adaptacao minima para cada formula;
- execucao de controle, V1 e V2;
- reacao independente para cada escolha;
- propagacao de sinais para a decisao seguinte;
- isolamento de falha por modelo;
- resultados brutos por semana e persona;
- testes de neutralidade durante execucao real;
- relatorio longitudinal prospectivo.

## Entrada para 28/09

Implementar um executor prospectivo sobre `routine-longitudinal-contract-v1`. Cada modelo deve receber uma copia da mesma entrada comum, e sua falha nao pode impedir o controle ou os demais desafiantes. A reacao da persona deve ser calculada pela utilidade independente e entrar apenas em decisoes posteriores, nunca na propria escolha. Resultados devem ser separados por conjunto, persona, semana e modelo. A reserva prospectiva continua fechada.

