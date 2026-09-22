# Checkpoint da Appono Intelligence V2 - 24/09/2026

## Decisao do dia

`CONJUNTOS_SEPARADOS`

Desenvolvimento, validacao e reserva prospectiva foram pre-registrados em particoes versionadas, com periodos e namespaces distintos. A auditoria de 900 identificadores planejados comprovou intersecao zero entre os tres conjuntos.

Este marco foi executado antecipadamente em 22/09/2026 para adiantar o calendario. Ele nao executou simulacao, nao observou placares e nao materializou a reserva prospectiva.

## Pre-condicoes

Foram confirmados:

- 22/09: `BASELINE_CONGELADO`;
- 23/09: `PERSONAS_CONGELADAS`;
- protocolo historico: `appono-intelligence-longitudinal-v1`;
- controle, V1 e V2 preservados;
- personas: `personas-sinteticas-v1`;
- hash canonico das personas: `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- reserva historica: `OPENED_ONCE` no manifesto e `OPENED_ONCE_CONTAMINATED` na nova especificacao;
- hash do relatorio historico de reserva: `47c32c146271830879c545dee7e1cc397972b845329a30434920477630b6a185`;
- rollout publico: `0`.

## Artefatos

| Artefato | SHA-256 do arquivo |
| --- | --- |
| `partitions-v1.json` | `a43db39001da425f418e9b7f7b18914314ad6c0c657cd6e0bf43577f2988f834` |
| `reserve-commitment-v1.json` | `0090784fb4dfd54603aef5581f14a2d4fc6950d9ba965ab2b34083aa8c908300` |
| `routine-intelligence-partitions.js` | `ae50d66e229b682431bcce9631d18c00ab5c06452c09d301b997fe407736aeb9` |
| `initialize-routine-reserve-commitment.js` | `8a993dee966d965aaf56309353934200ab098d484f4e68f71ea96134aebc97c6` |
| `audit-routine-intelligence-partitions.js` | `b8612c7ce58486653874382f577ae056da7c1c48a56b68ed09e9e57469aa8f77` |
| `routine-intelligence-partitions.test.js` | `cf6daa3b78d2452d0fb8d89e1610eb67c615ff7a65f928866baa71499bce962c` |

Identificadores principais:

- schema: `1`;
- versao: `routine-partitions-v1`;
- protocolo prospectivo: `appono-intelligence-prospective-v1`;
- identidade de cenario: `routine-scenario-id-v1`;
- hash canonico das particoes: `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`.

## Particoes

| Conjunto | Namespace | Periodo virtual | Estado | Uso |
| --- | --- | --- | --- | --- |
| Desenvolvimento | `app:intelligence:dev:v1` | 04/01 a 14/02/2027 | `REGISTERED_DEVELOPMENT` | Depuracao e calibracao controlada |
| Validacao | `app:intelligence:validation:v1` | 05/04 a 16/05/2027 | `REGISTERED_VALIDATION` | Aceitacao ou rejeicao de mudancas congeladas |
| Reserva historica | Baseline anterior | Referencia historica | `OPENED_ONCE_CONTAMINATED` | Auditoria, nunca calibracao |
| Reserva prospectiva | `app:intelligence:reserve:v1` | 05/07 a 15/08/2027 | `SEALED_UNMATERIALIZED` | Fechamento unico depois de congelar a candidata |

Todas as particoes prospectivas cobrem:

- 10 personas;
- 6 semanas por persona;
- 30 decisoes planejadas por persona;
- 300 identificadores planejados por conjunto;
- os mesmos seis niveis de historico;
- cobertura comparavel das oito categorias sinteticas.

Compartilhar cobertura nao significa compartilhar instancias.

## Identidade de cenario

O identificador SHA-256 usa serializacao canonica dos seguintes campos:

- versao da identidade;
- versao das particoes;
- namespace do conjunto;
- versao e ID da persona;
- semana e dia virtuais;
- janela alimentar;
- variante de catalogo;
- variante de disponibilidade;
- indice do cenario.

Uma chave semantica separada usa instante virtual, familias e variantes para detectar duplicacao acidental sem depender somente do namespace.

A funcao rejeita campos ausentes, persona desconhecida, semana fora do periodo e indices invalidos. Ela nao conhece modelo, placar, resultado ou material privado da reserva.

## Definicao de sobreposicao

Uma intersecao e registrada quando dois conjuntos compartilham:

- `scenario_id`;
- chave semantica completa;
- periodo virtual;
- namespace.

O gerador de 25/09 devera estender a mesma auditoria a snapshots e sequencias materializados. Personas e categorias em comum sao cobertura esperada e aparecem separadamente na matriz.

## Matriz de independencia

| Par | Mesmo namespace | Periodo sobreposto | IDs sobrepostos | Chaves semanticas sobrepostas | Personas comuns | Categorias comuns |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desenvolvimento x validacao | Nao | Nao | 0 | 0 | 10 | 8 |
| Desenvolvimento x reserva prospectiva | Nao | Nao | 0 | 0 | 10 | 8 |
| Validacao x reserva prospectiva | Nao | Nao | 0 | 0 | 10 | 8 |

Resultado da auditoria: `isolated: true`.

## Reserva historica

A reserva original continua preservada com hash inalterado e estado `OPENED_ONCE` no manifesto historico.

A nova especificacao a classifica explicitamente como `OPENED_ONCE_CONTAMINATED` e proibe seu uso em calibracao. Ela nao foi apagada, rebatizada, regenerada ou substituida silenciosamente.

## Reserva prospectiva

A reserva de fechamento usa compromisso `SHA-256`:

- compromisso publico: `40d76edee52a621e1413ee5cb2f1f1fc7cb19deac9ec163d9229b14d45b38b77`;
- estado: `SEALED_UNMATERIALIZED`;
- resultados presentes: nao;
- material privado: arquivo local ignorado pelo Git;
- semente e sal: nao impressos, nao versionados e nao importados pela calibracao.

O `.gitignore` foi validado com `git check-ignore`. O inicializador recusa sobrescrever um compromisso existente.

A abertura futura exige simultaneamente:

- candidata congelada e identificada;
- hash das particoes igual ao congelado;
- confirmacao explicita `OPEN_PROSPECTIVE_RESERVE`;
- revelacao correspondente ao compromisso;
- destino diferente do relatorio historico.

Os comandos normais de desenvolvimento e calibracao nao estao autorizados para a reserva.

## Guardas e privacidade

Os validadores rejeitam:

- campos desconhecidos em objetos principais e internos;
- IDs, namespaces ou sementes publicas duplicadas;
- periodos sobrepostos;
- persona desconhecida ou cobertura incompleta;
- reserva com permissao de calibracao ou materializacao;
- comando de geracao ou abertura no descritor reservado;
- resultado, semente ou sal no compromisso publico;
- campos pessoais e sensiveis.

Uma auditoria estatica confirmou que os modulos de simulacao, avaliacao e calibracao nao importam `.private` nem `reserve-reveal-v1`.

## Comandos executados

```text
node scripts/initialize-routine-reserve-commitment.js
node --test test/routine-intelligence-partitions.test.js
node --test test/routine-intelligence-partitions.test.js test/routine-intelligence-personas.test.js test/routine-experiment-manifest.test.js test/routine-intelligence-simulation.test.js
npm.cmd run audit:rotina:partitions --workspace backend
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

O primeiro uso de `npm` encontrou o bloqueio local de `npm.ps1`; a verificacao foi repetida pelo executavel Windows `npm.cmd` sem alterar o escopo.

## Resultados

- testes focados das particoes: `14` aprovados;
- testes focados combinados de manifesto, personas, particoes e simulacao em memoria: `35` aprovados;
- suite completa do backend: `181` testes aprovados, nenhuma falha;
- build do backend: aprovado;
- lint do frontend: aprovado;
- build do frontend: aprovado, com `49` rotas;
- auditoria de particoes: aprovada, `isolated: true`;
- `git diff --check`: aprovado, apenas avisos de futura normalizacao LF/CRLF.

Os testes existentes da simulacao executaram somente funcoes puras em memoria. Nenhum script de simulacao ou avaliacao foi executado, e nenhum relatorio foi gravado ou sobrescrito.

## Integridade dos baselines

- `manifest.json`: preservado;
- controle, V1 e V2: preservados;
- `personas-v1.json`: hash canonico preservado;
- relatorios de desenvolvimento e validacao: nao reexecutados;
- `reserva.json`: nao reexecutado e hash preservado;
- reserva prospectiva: nao materializada;
- placares prospectivos: inexistentes;
- rollout publico: `0`;
- operacao remota: nenhuma;
- commit, push ou deploy: nao executados.

## Limitacoes

- Os 900 registros auditados sao identificadores planejados, nao cenarios completos.
- A prova de snapshots e sequencias sem sobreposicao depende do gerador de 25/09.
- A reserva historica permanece metodologicamente contaminada e deve continuar aparecendo nos relatorios futuros.
- O material privado da reserva prospectiva existe somente neste ambiente local ignorado pelo Git; sua guarda e backup seguro sao responsabilidade operacional antes do fechamento.
- Nenhuma evidencia sintetica representa validacao com clientes reais.

## Aceleracao preparada

Estado: `PREPARADO`, nao `CONCLUIDO`.

O Dia 25 ja pode consumir:

- descritores validados de particao;
- IDs e namespaces estaveis;
- sementes publicas de desenvolvimento e validacao;
- compromisso selado da reserva;
- relogios virtuais declarados;
- estrategia de catalogo e disponibilidade;
- identidade canonica e chave semantica;
- auditoria de intersecao reutilizavel;
- comando de auditoria somente leitura.

## Entrada para 25/09

Implementar o gerador deterministico que recebe obrigatoriamente uma particao validada e produz snapshots completos de desenvolvimento e validacao. A mesma entrada deve gerar bytes ou conteudo canonico identico. O gerador deve provar intersecao zero de snapshots e sequencias, variar catalogo e disponibilidade e manter a reserva prospectiva sem materializacao.

