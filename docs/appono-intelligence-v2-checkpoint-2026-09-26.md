# Checkpoint da Appono Intelligence V2 - 26/09/2026

## Decisao do dia

`RESERVA_TECNICA_APROVADA_COM_CORRECOES`

A infraestrutura experimental foi auditada e estabilizada antes da simulacao longitudinal. Tres defeitos de contrato foram corrigidos: coercao numerica permissiva, schema de snapshot aberto e ausencia de ajuda segura na CLI. Nenhum snapshot foi regenerado e os hashes congelados de desenvolvimento e validacao permaneceram intactos.

Este marco estava planejado para 26/09/2026 e foi executado antecipadamente em 22/09/2026.

## Estado inicial

- branch: `main`;
- `HEAD`: `7ae90fab4b130b8dea99785231cec1f5e92c1d21`;
- commit: `7ae90fa Adicionando o gerador deterministico de cenarios`;
- Node.js observado: `v24.14.0`;
- npm observado: `11.9.0`;
- PowerShell bloqueia `npm.ps1`; os comandos foram executados com `npm.cmd`;
- alteracoes preexistentes preservadas: reorganizacao do `README.md` e prompt do Dia 26 ainda nao rastreado;
- nenhuma alteracao remota, commit, push ou deploy foi realizada.

O projeto documenta Node.js 22 ou superior no `README.md`. Nao existe `engines` nos manifests nem `.nvmrc` versionado. As APIs usadas pelo gerador sao compativeis com esse requisito; a dependencia direta de `Set.prototype.intersection` foi retirada do validador de producao em favor de uma verificacao local simples. Os testes ainda podem usar a API porque a suite requer o runtime documentado.

## Pre-condicoes

Foram confirmadas:

- 22/09: `BASELINE_CONGELADO`;
- 23/09: `PERSONAS_CONGELADAS`;
- 24/09: `CONJUNTOS_SEPARADOS`;
- 25/09: `GERADOR_DETERMINISTICO_CONCLUIDO`;
- protocolo prospectivo: `appono-intelligence-prospective-v1`;
- gerador: `routine-scenario-generator-v1`;
- snapshots: `routine-scenario-snapshots-v1`;
- personas: `personas-sinteticas-v1`;
- particoes: `routine-partitions-v1`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`.

## Integridade dos artefatos

| Artefato | Hash esperado | Hash observado | Estado |
| --- | --- | --- | --- |
| Personas, canonico | `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474` | Mesmo valor | `OK` |
| Particoes, canonico | `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7` | Mesmo valor | `OK` |
| Desenvolvimento, arquivo | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` | Mesmo valor | `OK` |
| Desenvolvimento, cenarios | `f377be1c9611fc0d1fb07663a134a4e1be4970f7a6a50c6b2cfb81545c3fb975` | Mesmo valor | `OK` |
| Validacao, arquivo | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` | Mesmo valor | `OK` |
| Validacao, cenarios | `0f666561fc093f8adbe074ee630f8047b8f60fad71a3e34763df5a69ee1dadd0` | Mesmo valor | `OK` |
| Reserva historica, relatorio | `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185` | Mesmo valor | `OK` |
| Compromisso da reserva prospectiva | `40d76edee52a621e1413ee5cb2f1f1fc7cb19deac9ec163d9229b14d45b38b77` | Mesmo valor | `OK` |

Os hashes citados no prompt do Dia 26 eram hipoteses resumidas e nao coincidiam integralmente com os valores congelados. O manifesto e o checkpoint de 25/09 foram usados como fontes de verdade; nenhum artefato foi alterado para acomodar os valores do prompt.

## Correcoes realizadas

### Numeros sem coercao silenciosa

O helper `finite` convertia valores com `Number(value)`. Isso permitia que `null` ou string vazia fossem interpretados como zero durante a validacao.

Correcao:

- somente valores cujo tipo e `number` e que sejam finitos sao aceitos;
- perfil, candidatos e sinais receberam validacao numerica explicita;
- teste de regressao comprova que `price: null` e rejeitado.

Classificacao: `DEFEITO_CONTRATO`.

### Schema fechado dos snapshots

O validador confirmava hashes e invariantes, mas nao recusava campos desconhecidos e nao verificava integralmente duplicatas e cobertura das listas de elegibilidade.

Correcao:

- chaves exatas no snapshot, particao resumida, cenario, perfil, historico, escolhas recentes, sinais, candidatos e motivos de inelegibilidade;
- rejeicao de candidatos duplicados no catalogo e nas listas;
- verificacao de que candidatos elegiveis nao possuem motivo eliminatorio;
- verificacao de que candidatos inelegiveis possuem os mesmos motivos no catalogo e na lista resumida;
- verificacao de que as listas cobrem exatamente o catalogo;
- validacao de datas, flags e valores dos sinais.

Testes de regressao cobrem campo desconhecido, coercao numerica e candidato duplicado.

Classificacao: `DEFEITO_CONTRATO`.

### Ajuda segura da CLI

A CLI exigia um conjunto mesmo quando o operador precisava apenas conhecer sua sintaxe.

Correcao:

- `--help` e `-h` mostram uso e opcoes;
- a ajuda termina com codigo zero;
- nao le configuracao, nao gera snapshot e nao grava arquivo;
- o comando comum continua recusando a reserva prospectiva.

Classificacao: `DEFEITO_REPRODUTIBILIDADE`.

## Arquivos tecnicos alterados

- `backend/src/domain/routine-intelligence-scenario-generator.js`;
- `backend/scripts/generate-routine-intelligence-scenarios.js`;
- `backend/test/routine-intelligence-scenario-generator.test.js`.

Hashes apos as correcoes:

- dominio do gerador: `2f27bfaec6b989b275cc425f291dd1414cd1cb210e186254f1224993ab071914`;
- CLI: `051be81378265ce511787b2172618ba85f0234e5a6f622404790400b4b35ff88`;
- testes do gerador: `60d649a9ce164b0067219d81c05307afb860fa21300ee8485302516c29a5305f`.

Os hashes de codigo registrados no checkpoint de 25/09 permanecem como evidencia historica daquele fechamento. Os novos hashes identificam a revisao estabilizada do Dia 26.

## Auditoria estrutural

Cada conjunto continua contendo:

- 300 cenarios;
- 10 personas;
- 30 cenarios por persona;
- 6 semanas por persona;
- 5 decisoes por semana;
- 8 candidatos por cenario;
- 1.200 candidatos elegiveis;
- 1.200 candidatos inelegiveis;
- todos os seis niveis de historico previstos;
- cobertura dos sete motivos eliminatorios.

Desenvolvimento e validacao continuam com intersecao zero para:

- `scenario_id`;
- chave semantica;
- snapshot de entrada;
- sequencia por persona;
- chave idempotente de sinal;
- snapshot de candidatos;
- snapshot de historico.

Compartilhamento esperado:

- 10 personas;
- 8 categorias.

Resultado da auditoria: `isolated: true`.

## Reprodutibilidade

Os testes focados foram executados tres vezes em processos separados.

Resultado por repeticao:

- 57 testes aprovados;
- nenhuma falha;
- nenhum teste ignorado;
- hashes identicos entre execucoes.

Os dois comandos `--check` confirmaram igualdade byte a byte com os snapshots versionados. Nenhum arquivo de cenario ou manifesto foi regravado.

## Runtime e portabilidade

- runtime executado: Node.js `v24.14.0`;
- minimo documentado: Node.js 22;
- npm executado: `11.9.0`;
- caminhos Windows foram exercitados pela suite;
- caminhos persistidos no manifesto usam `/`;
- serializacao permanece UTF-8 e termina com LF;
- IDs e hashes nao dependem de locale, hostname ou ordem do sistema de arquivos;
- o relogio real nao participa da geracao;
- nao foram adicionadas dependencias.

Pendencia nao bloqueante: a versao minima de Node permanece documentada somente no `README.md`; os manifests ainda nao possuem `engines`.

## Tamanho e custo local

| Artefato | Tamanho |
| --- | ---: |
| Desenvolvimento | 2.925.374 bytes |
| Validacao | 2.836.270 bytes |
| Manifesto dos snapshots | 4.198 bytes |
| Total | 5.765.842 bytes |

Leitura, parse e validacao dos dois conjuntos levaram aproximadamente `321,77 ms` nesta maquina. O volume atual e adequado para artefatos versionados e auditaveis. Nao houve evidencia para introduzir Git LFS, compactacao, banco local ou dependencia adicional.

## Privacidade e reserva

A varredura dos snapshots nao encontrou:

- e-mail, telefone ou identidade pessoal;
- endereco ou coordenada exata;
- JWT, access token, refresh token, senha ou `service_role`;
- agenda, alergia ou condicao medica individual;
- vencedor, confianca, ajuste, utilidade ou versao de resultado de modelo.

Estado confirmado:

- reserva historica nao foi reexecutada neste marco;
- reserva prospectiva nao possui snapshot materializado;
- reserva prospectiva continua `SEALED_UNMATERIALIZED`;
- nenhum material `.private` foi importado;
- nenhum placar foi produzido;
- rollout publico continua `0`.

## Contrato preparado para 28/09

O adaptador estrutural existente continua entregando somente os candidatos presentes em `eligible_candidate_ids`. O contrato disponivel inclui:

- identificador de particao e cenario;
- persona, semana, dia e janela;
- instante virtual UTC;
- perfil sintetico e consentimento;
- historico e sinais sinteticos;
- candidatos elegiveis comuns;
- candidatos eliminados preservados apenas para auditoria.

O grupo `controle_sem_historico` permanece com nivel `NONE` e lista de sinais vazia.

O Dia 28 ainda devera implementar e testar:

- loop longitudinal de seis semanas;
- estado isolado por modelo e persona;
- mesma entrada elegivel para controle, V1 e V2;
- reacao sintetica depois de cada decisao;
- propagacao somente de sinais consentidos para a semana seguinte;
- metricas por semana e persona;
- falha segura sem bloquear o controle.

Nenhum desses itens foi marcado como concluido neste marco.

## Verificacao executada

```text
node --test backend/test/routine-intelligence-scenario-generator.test.js backend/test/routine-intelligence-partitions.test.js backend/test/routine-intelligence-personas.test.js backend/test/routine-experiment-manifest.test.js
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

- testes focados: 57 aprovados em cada uma de tres repeticoes;
- suite completa do backend: 207 aprovados;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com 49 rotas;
- auditoria dos cenarios: aprovada;
- auditoria das particoes: aprovada;
- `git diff --check`: aprovado, com apenas avisos de normalizacao LF/CRLF.

A suite completa executa testes unitarios dos dominios de recomendacao. Controle, V1 e V2 nao foram executados sobre os snapshots prospectivos, e os scripts de simulacao ou avaliacao nao foram chamados.

## Itens nao alterados

- formulas do controle, V1 e V2;
- pesos, limites e confianca;
- personas e particoes congeladas;
- snapshots e manifesto de snapshots;
- relatorios historicos;
- feature flags;
- banco, migrations, API e frontend funcional;
- reserva historica e prospectiva.

## Entrada para 28/09

Implementar a simulacao longitudinal consumindo os snapshots validados. Controle, V1 e V2 devem receber exatamente os mesmos candidatos elegiveis, com estado isolado por modelo e persona. Cada uma das seis semanas deve produzir reacao pela utilidade independente e alimentar a semana seguinte somente com sinais consentidos. A reserva prospectiva deve continuar fechada.

