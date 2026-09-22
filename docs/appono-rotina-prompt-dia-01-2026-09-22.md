# Prompt do Dia 1 - Baseline e protocolo da Appono Intelligence

Voce e um agente senior de produto, dados, experimentacao, seguranca e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **22 de setembro de 2026** do calendario de entrega da Appono Intelligence V2.

O objetivo de hoje e **congelar, auditar e tornar reproduzivel o baseline e o protocolo experimental** que sustentarao todo o trabalho ate 10 de outubro de 2026. Hoje nao e dia de recalibrar pesos, criar V2.1, promover a V2 ou interpretar simulacao como validacao real.

Nao entregue apenas um plano. Inspecione o repositorio, valide o que ja existe, complete os artefatos faltantes, execute as verificacoes permitidas e documente evidencias. Preserve todas as alteracoes locais. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Marco do calendario

Data: `22/09/2026`.

Entrega prevista:

> Congelar baseline e protocolo: placar atual, versoes, sementes, catalogo e criterios registrados.

O dia somente pode ser encerrado quando outra pessoa conseguir identificar exatamente:

- qual codigo foi avaliado;
- quais modelos e regras foram usados;
- quais dados sinteticos e catalogos participaram;
- quais sementes e relogios de referencia foram usados;
- quais comandos geraram cada resultado;
- quais criterios futuros ja estavam definidos antes de qualquer ajuste;
- quais resultados pertencem ao teste sombra anterior e quais pertencem a simulacao longitudinal atual.

## Estado conhecido a confirmar

Trate os itens abaixo como hipoteses que devem ser conferidas no repositorio e nos relatorios, nao como fatos a serem copiados sem verificacao:

- controle oficial: `deterministico-v3`;
- referencia historica congelada: `appono-intelligence-v1`;
- desafiante atual: `appono-intelligence-v2`;
- regua independente da simulacao: `persona-utility-v1`;
- protocolo longitudinal: `appono-intelligence-longitudinal-v1`;
- seis semanas virtuais por persona;
- sementes atuais:
  - desenvolvimento: `22092026`;
  - validacao: `23112026`;
  - reserva: `10102026`;
- baseline sombra anterior: 100 sinais sinteticos, com 6 vitorias da V2, 8 vitorias do controle e 28 empates tecnicos nas divergencias avaliadas;
- rollout publico esperado: zero;
- decisao publica continua sob o controle, salvo allowlist interna explicitamente configurada;
- o conjunto de reserva ja pode ter sido executado uma vez e, se isso for confirmado, nao deve ser executado novamente hoje.

O repositorio pode conter trabalho mais avancado do que o calendario previa para este dia. Nao o remova. Registre-o como estado encontrado e limite o trabalho de hoje ao fechamento formal do baseline.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-rotina-prompt-intelligence-v2.md`;
- `docs/appono-rotina-prompt-coleta-validacao-v2.md`;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- `docs/appono-rotina-integridade-transacional.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- todos os arquivos versionados em `backend/experiments/routine-intelligence/`;
- todos os relatorios existentes em `backend/reports/routine-intelligence/`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`, se existir;
- `backend/src/domain/routine-intelligence-simulation.js`, se existir;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/routes/routine.js`;
- scripts de seed, coleta, simulacao, teste sombra e avaliacao;
- testes relacionados a recomendacao, inteligencia, simulacao, consentimento, politica de rollout e avaliacao sombra;
- migrations de rotina, feedback, consentimento e avaliacao sombra.

Leia tambem as instrucoes locais do repositorio. Caso seja realmente necessario alterar Supabase, consulte a skill Supabase e a documentacao oficial atual. Nao reescreva migrations aplicadas e nao aplique nada remotamente neste marco.

## Regras inegociaveis

1. Preserve a arvore de trabalho e nao reverta alteracoes que nao foram feitas por voce.
2. Nao altere a formula do controle, da V1 ou da V2 hoje.
3. Nao ajuste pesos depois de observar desenvolvimento, validacao ou reserva.
4. Nao execute novamente o conjunto de reserva se houver evidencia de que ele ja foi aberto.
5. Nao transforme resultado sintetico em alegacao de validacao por clientes.
6. Nao habilite rollout publico.
7. Nao use nem exponha senha, JWT, token OAuth, magic link, `service_role` ou conteudo de `.env`.
8. Nao fabrique pagamento, reserva concluida, entrega, presenca ou feedback por SQL.
9. Nao altere filtros de seguranca alimentar, funcionamento, agenda, disponibilidade, orcamento ou raio.
10. Nao faca commit, push, deploy, cobranca, envio de e-mail ou migration remota.
11. Nao apague nem sobrescreva os resultados historicos da V1 ou do primeiro teste da V2.
12. Registre claramente qualquer divergencia entre documentacao, manifesto, codigo e relatorios.

## Fase 1 - Inventario do estado atual

Comece registrando:

- estado do Git, incluindo arquivos modificados e nao rastreados;
- branch atual e `HEAD`, se disponiveis;
- versoes de Node.js, npm e dependencias relevantes;
- scripts disponiveis no `package.json` raiz e no backend;
- modelos encontrados no codigo e seus identificadores exatos;
- feature flags e valores padrao;
- relatorios ja gerados;
- data e finalidade de cada migration relacionada;
- existencia de resultados de desenvolvimento, validacao, reserva e revisao cega.

Nao inclua valores de ambiente. Registre apenas nomes de variaveis necessarias e se estao configuradas, nunca seus valores.

Se a arvore estiver suja, produza um identificador reproduzivel do estado sem criar commit. Use, por exemplo:

- hash do `HEAD`;
- hash SHA-256 do diff rastreado;
- hash SHA-256 da lista e do conteudo dos arquivos novos relevantes;
- lista explicita de arquivos usados no experimento.

O objetivo e permitir distinguir este baseline de outro executado sobre um codigo diferente.

## Fase 2 - Auditar o manifesto

Revise `backend/experiments/routine-intelligence/manifest.json` e confirme se ele registra, no minimo:

- versao do schema do manifesto;
- identificador do protocolo;
- data e timezone do congelamento;
- controle, V1, V2 e regua independente;
- quantidade de semanas por persona;
- sementes de desenvolvimento, validacao e reserva;
- identificador ou hash do catalogo por conjunto;
- identificador ou hash das personas;
- relogio de referencia quando aplicavel;
- versoes de runtime relevantes;
- comandos exatos de geracao e avaliacao;
- baseline sombra anterior;
- criterios de aceitacao congelados;
- estado das feature flags;
- situacao do conjunto de reserva: fechado ou ja executado;
- hashes dos relatorios existentes;
- identificador do estado do codigo avaliado.

Se algum campo faltar, evolua o manifesto de forma retrocompativel e ajuste seus testes. Nao invente hash ou resultado: calcule a partir dos artefatos reais.

O manifesto deve falhar de forma clara quando alguem tentar comparar execucoes com protocolo, catalogo, personas, sementes ou regras diferentes sem declarar essa diferenca.

## Fase 3 - Separar os baselines

Documente dois blocos independentes.

### Baseline sombra anterior

Registre somente resultados realmente comprovados pelos relatorios historicos:

- quantidade de comparacoes por modelo;
- concordancias e divergencias;
- vitorias do controle, da V1 e da V2;
- empates tecnicos;
- confianca media;
- quantidade e natureza dos sinais sinteticos;
- limitacoes do teste.

### Baseline longitudinal atual

Registre separadamente, por conjunto:

- quantidade de personas;
- quantidade de semanas;
- quantidade de decisoes;
- utilidade externa media por modelo;
- arrependimento medio por modelo;
- divergencias;
- concentracao e diversidade;
- violacoes eliminatorias;
- regressao maxima por persona;
- hashes de catalogo e personas;
- classificacao automatica, se existir.

Nao misture os placares. O teste sombra anterior e a simulacao longitudinal respondem perguntas diferentes e podem usar amostras e reguas diferentes.

## Fase 4 - Congelar criterios antes de ajustes

Registre criterios objetivos que serao usados ate o fechamento de 10 de outubro. Eles devem ser definidos hoje e nao flexibilizados depois de observar novos resultados.

Inclua, no minimo:

- zero violacoes eliminatorias;
- determinismo em 100% das repeticoes;
- ajuste e confianca iguais a zero sem historico elegivel;
- V2 nunca recebe candidato eliminado pelo controle;
- falha da V2 nunca bloqueia o planejamento oficial;
- rollout publico igual a zero enquanto nao houver decisao humana;
- utilidade ou arrependimento da V2 nao inferior a V1 no conjunto de validacao;
- resultado global da V2 nao inferior ao controle alem da margem previamente declarada;
- regressao maxima permitida por persona declarada numericamente;
- cobertura de preferencia explicita dentro da margem declarada;
- concentracao nao pior que a V1;
- confianca minima para a V2 decidir em homologacao interna;
- exigencia de consentimento ativo;
- fallback ao controle para erro, baixa confianca ou ausencia de historico.

Se o projeto ja possuir limites como regressao severa de `2,0` pontos ou confianca minima de `0,25`, confirme sua origem no codigo e nos documentos antes de registrá-los. Se houver conflito, nao escolha silenciosamente: documente a divergencia e use o comportamento efetivamente testado como baseline tecnico.

## Fase 5 - Provar reprodutibilidade

Execute somente operacoes locais e offline.

1. Gere o conjunto de desenvolvimento duas vezes com os mesmos parametros.
2. Compare os relatorios semanticamente e, quando o formato for canonico, byte a byte.
3. Confirme que sementes, hashes, totais e metricas sao identicos.
4. Execute a avaliacao do conjunto de desenvolvimento.
5. Execute ou reavalie o conjunto de validacao com a semente congelada.
6. Compare o resultado com o relatorio versionado existente.
7. Nao execute o conjunto de reserva novamente se ele ja tiver sido aberto.
8. Caso a reserva ainda esteja fechada, mantenha-a fechada hoje.

Se timestamps de geracao impedirem igualdade byte a byte, compare o conteudo sem os campos volateis e documente precisamente quais campos foram excluidos. Nao esconda outras diferencas sob essa excecao.

Qualquer falha de determinismo deve ser investigada e corrigida apenas se for um defeito de infraestrutura experimental. Nao altere a logica de ranking para melhorar placar.

## Fase 6 - Validar invariantes

Confirme por teste automatizado ou evidencia executavel:

- a mesma entrada gera a mesma saida;
- o grupo sem historico permanece neutro;
- a V1 continua congelada;
- V1 e V2 recebem os mesmos candidatos elegiveis;
- filtros eliminatorios continuam sob responsabilidade do controle;
- sinais sem consentimento nao personalizam;
- revogacao remove o efeito futuro;
- feature flag publica inicia desligada;
- rollout publico inicia em zero;
- allowlist interna nao afeta usuarios fora dela;
- baixa confianca e erro retornam ao controle;
- relatorios nao incluem PII, enderecos, coordenadas, alergias, tokens ou conteudo de agenda.

Se algum desses testes ainda nao existir, adicione o teste minimo necessario. Nao expanda o escopo para recalibracao da V2.

## Fase 7 - Produzir o checkpoint do dia

Crie ou atualize um checkpoint datado, preferencialmente:

`docs/appono-intelligence-v2-checkpoint-2026-09-22.md`

O checkpoint deve conter:

1. objetivo do marco;
2. estado do codigo avaliado;
3. versoes dos modelos e da regua;
4. sementes, catalogos, personas e relogio;
5. comandos executados;
6. baseline sombra anterior;
7. baseline longitudinal por conjunto;
8. criterios de aceitacao congelados;
9. prova de determinismo;
10. verificacoes de guardrails;
11. inconsistencias encontradas e resolucao adotada;
12. limitacoes, principalmente ausencia de clientes reais;
13. situacao da reserva;
14. estado das flags e rollout;
15. decisao do dia;
16. passagem objetiva para o trabalho de 23/09.

Atualize o calendario apenas para marcar o marco de hoje como concluido quando todos os criterios estiverem atendidos. Nao antecipe como concluidos os dias seguintes, mesmo que parte da infraestrutura ja exista.

## Testes e verificacoes

Descubra primeiro os comandos reais no `package.json`. Execute os equivalentes existentes a:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute tambem:

- testes focados do manifesto e da simulacao;
- simulacao de desenvolvimento em duplicidade;
- avaliacao de desenvolvimento;
- simulacao ou avaliacao de validacao;
- verificacao de ausencia de PII nos relatorios;
- verificacao de rollout zero e fallback.

Nao execute smoke remoto, seed remoto, pagamento, envio de e-mail, migracao ou o conjunto de reserva como parte deste dia.

Se um comando nao existir, nao finja que foi executado. Registre a ausencia e, quando fizer sentido, adicione um script seguro e documentado.

## Criterios de encerramento de 22/09

O marco de hoje esta concluido somente quando:

- o estado de codigo estiver identificavel sem criar commit;
- modelos, regua e protocolo estiverem versionados;
- sementes estiverem congeladas;
- catalogos e personas tiverem hashes verificaveis;
- resultados historicos e longitudinais estiverem separados;
- criterios de aceitacao estiverem registrados antes de novos ajustes;
- desenvolvimento for reproduzivel em duas execucoes;
- validacao for reproduzivel ou sua divergencia estiver explicada;
- a reserva permanecer sem nova execucao;
- invariantes e guardrails tiverem evidencia;
- feature flag publica e rollout permanecerem desligados;
- suite, builds, lint e `git diff --check` passarem, ou falhas preexistentes estiverem identificadas com precisao;
- nenhum segredo aparecer no diff ou nos relatorios;
- o checkpoint datado estiver completo;
- nenhuma alteracao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

A decisao do marco deve ser uma destas:

- `BASELINE_CONGELADO`: protocolo completo, reproduzivel e pronto para orientar os proximos dias;
- `BASELINE_PARCIAL`: artefatos existem, mas ha lacunas objetivas de reproducibilidade ou identificacao;
- `BASELINE_BLOQUEADO`: os resultados nao podem ser reproduzidos ou vinculados ao codigo utilizado.

Nao declare `IA_PRONTA_EM_HOMOLOGACAO` como resultado deste marco. Essa e uma conclusao do ciclo completo, prevista para 10 de outubro, e depende dos marcos posteriores.

## Entrega final

Ao terminar, apresente de forma objetiva:

1. decisao do dia;
2. arquivos criados ou alterados;
3. identificadores do codigo, modelos, protocolo e regua;
4. sementes e hashes congelados;
5. baseline sombra anterior;
6. baseline longitudinal atual;
7. evidencia de reproducibilidade;
8. testes executados e resultados;
9. inconsistencias e riscos encontrados;
10. confirmacao de que a reserva nao foi reexecutada;
11. confirmacao de rollout publico igual a zero;
12. entrada exata para o marco de 23/09: modelagem e validacao das personas coerentes.

Nao confunda congelar o baseline com aprovar a V2. O resultado esperado de hoje e uma fundacao experimental auditavel, que impeça alteracoes oportunistas e permita saber, em 10 de outubro, se a IA entregue realmente melhorou ou apenas mudou.
