# Checkpoint da Appono Intelligence V2 - 25/09/2026

## Decisao do dia

`GERADOR_DETERMINISTICO_CONCLUIDO`

O gerador prospectivo foi implementado sem dependencia dos modelos. Desenvolvimento e validacao possuem 300 cenarios completos cada, com conteudo reproduzivel, hashes congelados e intersecao zero em todas as dimensoes auditadas.

Este marco foi executado antecipadamente em 22/09/2026. Nenhum modelo, ranking, placar ou metrica de qualidade foi executado. A reserva prospectiva permaneceu selada.

## Pre-condicoes

Foram confirmados:

- 22/09: `BASELINE_CONGELADO`;
- 23/09: `PERSONAS_CONGELADAS`;
- 24/09: `CONJUNTOS_SEPARADOS`;
- personas: `personas-sinteticas-v1`;
- hash canonico das personas: `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- particoes: `routine-partitions-v1`;
- hash canonico das particoes: `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`;
- reserva historica preservada;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- material privado ignorado pelo Git;
- rollout publico: `0`.

## Arquitetura

O ciclo foi separado em:

- dominio puro de geracao: `routine-intelligence-scenario-generator.js`;
- CLI de geracao e verificacao: `generate-routine-intelligence-scenarios.js`;
- auditoria somente leitura: `audit-routine-intelligence-scenarios.js`;
- snapshots versionados em `experiments/routine-intelligence/scenarios/`;
- manifesto estrutural separado dos resultados historicos;
- testes focados do gerador.

O gerador recebe explicitamente particao e personas validadas. Ele recusa reserva, hash divergente, particao sem permissao de materializacao e versao desconhecida.

## Versoes e hashes

- gerador: `routine-scenario-generator-v1`;
- schema do snapshot: `1`;
- manifesto: `routine-scenario-snapshots-v1`;
- SHA-256 do gerador: `f797b8c8292df0a7c7b904cfaba651bcf16e2d0c606e976b696daf9af912f4b4`;
- SHA-256 da CLI: `def8338178fec17271c1318e60f4f67c736b28889512983b5779951081c7db16`;
- SHA-256 da auditoria: `508f092ad114785ccd460f4f3d8667f610cc7ea8dfecba353170fb8df3091372`;
- SHA-256 dos testes: `b331374757a6a20b323906d60be83fe3948474ea5156a8c9d6209b7493f25701`;
- SHA-256 do manifesto de snapshots: `e7480a2a6541f8147265ab5cf23f06e3f252cc7406526d9e576a715bb3c47786`.

## Aleatoriedade hierarquica

O gerador usa SHA-256 para derivar valores por:

- semente publica;
- namespace;
- persona;
- semana;
- dia;
- componente;
- indice do item.

Nao existe sequencia global mutavel. Gerar uma persona isoladamente ou inverter a ordem das personas preserva seus cenarios. O codigo nao usa `Math.random()`, `Date.now()` ou relogio do sistema.

## Snapshots

| Conjunto | Cenarios | Personas | Hash dos cenarios | SHA-256 do arquivo |
| --- | ---: | ---: | --- | --- |
| Desenvolvimento | 300 | 10 | `f377be1c9611fc0d1fb07663a134a4e1be4970f7a6a50c6b2cfb81545c3fb975` | `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c` |
| Validacao | 300 | 10 | `0f666561fc093f8adbe074ee630f8047b8f60fad71a3e34763df5a69ee1dadd0` | `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6` |

Cada conjunto possui:

- 30 cenarios por persona;
- 6 semanas por persona;
- 5 cenarios por semana;
- 8 candidatos por cenario;
- 4 candidatos elegiveis por cenario;
- 1.200 candidatos elegiveis;
- 1.200 candidatos inelegiveis;
- janelas `ALMOCO` e `JANTAR`;
- oito categorias sinteticas;
- todos os niveis de historico previstos.

Nenhum snapshot possui timestamp de geracao, caminho absoluto, hostname ou outro campo volatil.

## Cobertura eliminatoria

Por conjunto:

| Motivo | Ocorrencias |
| --- | ---: |
| `FORA_ORCAMENTO` | 300 |
| `FORA_RAIO` | 300 |
| `RESTAURANTE_FECHADO` | 100 |
| `PRODUTO_INDISPONIVEL` | 100 |
| `ANTECEDENCIA_INSUFICIENTE` | 100 |
| `JANELA_INSUFICIENTE` | 150 |
| `SEGURANCA_NAO_VERIFICADA` | 150 |

Os candidatos elegiveis e inelegiveis sao conjuntos disjuntos. O adaptador preparado para a simulacao futura devolve somente candidatos elegiveis.

## Historico sintetico

Foram cobertos:

- `NONE`: 75 cenarios;
- `LOW`: 45;
- `SUFFICIENT`: 45;
- `OLD`: 45;
- `CONTRADICTORY`: 45;
- `GRADUAL_CHANGE`: 45.

Todos os sinais antecedem o cenario, possuem chaves idempotentes unicas e estao marcados como sinteticos e offline. A persona `controle_sem_historico` nunca recebe sinal de aprendizado.

## Reprodutibilidade

Foram comprovados:

- dois objetos gerados em memoria sao profundamente identicos;
- serializacoes sao identicas;
- SHA-256 e identico;
- processo Node separado produz o mesmo hash;
- modo `--check` compara o arquivo byte a byte;
- geracao isolada de persona coincide com o recorte completo;
- ordem inversa das personas nao altera os cenarios;
- mudanca de semente ou componente altera o ramo correspondente;
- duas auditorias em processos separados produziram saida identica.

## Matriz de intersecao

Desenvolvimento versus validacao:

| Dimensao | Intersecao |
| --- | ---: |
| `scenario_id` | 0 |
| chave semantica | 0 |
| snapshot de entrada | 0 |
| sequencia por persona | 0 |
| chave de sinal | 0 |
| snapshot de candidatos | 0 |
| snapshot de historico | 0 |

Cobertura compartilhada esperada:

- personas: 10;
- categorias: 8.

Resultado: `isolated: true`.

## Defeito encontrado e corrigido

A primeira auditoria completa encontrou uma intersecao em historicos `NONE`. Objetos vazios eram semanticamente iguais nos dois conjuntos, apesar de nao conterem dados comportamentais.

Correcao: cada historico passou a possuir `history_instance_id` sintetico derivado da particao, persona e indice. Depois da correcao, a intersecao de historicos caiu para zero e os 24 testes focados passaram.

Nenhuma formula de modelo foi alterada.

## Testes de mutacao

Os testes confirmaram deteccao de:

- cenario copiado entre conjuntos;
- byte adicional no arquivo;
- remocao de candidato elegivel;
- campo pessoal inserido;
- campo de resultado de modelo inserido;
- tentativa de materializar a reserva;
- hash de persona ou particao divergente.

A escrita atomica substitui o arquivo completo e nao deixa arquivo temporario.

## CLI

Comandos adicionados:

```text
npm run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1
npm run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1
npm run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1 --check
npm run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1 --check
npm run audit:rotina:scenarios --workspace backend
```

A CLI retorna somente resumo estrutural. Ela nao imprime sinais, candidatos completos ou material privado.

## Reserva

- reserva historica: nao executada e hash preservado em `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- arquivos prospectivos de reserva: `0`;
- compromisso publico: preservado;
- material privado: ignorado pelo Git;
- importacao de `.private` pelo gerador: inexistente;
- tentativa pela CLI: rejeitada com `PROSPECTIVE_RESERVE_IS_SEALED`.

## Privacidade

Os snapshots foram auditados e nao possuem:

- e-mail, telefone ou nome pessoal;
- endereco ou coordenada;
- agenda;
- alergia ou condicao medica individual;
- JWT, tokens, senha ou `service_role`;
- resultado, vencedor, confianca, ajuste ou utilidade de modelo.

IDs de restaurantes, produtos, candidatos, historicos e sinais usam prefixos sinteticos.

## Verificacao executada

```text
node --test test/routine-intelligence-scenario-generator.test.js
node --test test/routine-intelligence-scenario-generator.test.js test/routine-intelligence-partitions.test.js test/routine-intelligence-personas.test.js test/routine-experiment-manifest.test.js test/routine-intelligence-simulation.test.js
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run generate:rotina:scenarios --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Resultados:

- testes focados do gerador: 24 aprovados;
- testes experimentais combinados: 59 aprovados;
- suite completa do backend: 205 aprovados, nenhuma falha;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com 49 rotas;
- auditoria de snapshots: aprovada;
- `git diff --check`: aprovado, somente avisos de normalizacao LF/CRLF.

## Integridade

- controle, V1 e V2: nao alterados;
- simulador e relatorios historicos: nao alterados;
- particoes e personas congeladas: hashes preservados;
- reserva historica: nao reexecutada;
- reserva prospectiva: nao materializada;
- modelos executados sobre os novos snapshots: nenhum;
- placares ou metricas de qualidade gerados: nenhum;
- rollout publico: `0`;
- operacao remota: nenhuma;
- commit, push ou deploy: nao executados.

## Limitacoes

- Os cenarios sao sinteticos e nao representam distribuicao real de clientes.
- Elegibilidade no snapshot e uma fixture estrutural; o dominio oficial sera novamente verificado durante a simulacao.
- O gerador ainda nao executa controle, V1 ou V2.
- Nao existe evidencia de superioridade da V2 neste marco.
- Os arquivos somam alguns megabytes porque preservam entradas completas e auditaveis.

## Aceleracao preparada

Estado: `PREPARADO`, nao `CONCLUIDO`.

Foram preparados para 28/09:

- leitor validado de snapshots;
- ordem canonica dos cenarios;
- adaptador que fornece somente candidatos elegiveis;
- historicos e sinais normalizados;
- hashes de sequencia por persona;
- contrato comum para que os tres modelos recebam as mesmas entradas.

## Entrada para 28/09

Executar controle, V1 e V2 sobre exatamente os mesmos candidatos elegiveis durante seis semanas por persona. O estado longitudinal deve ser isolado por modelo e persona, os sinais da semana anterior devem alimentar somente a semana seguinte e nenhuma metrica agregada deve esconder violacao eliminatoria. A reserva prospectiva continua fechada.

