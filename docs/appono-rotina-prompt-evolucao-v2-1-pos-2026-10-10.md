# Prompt - Evolucao controlada da Appono Intelligence V2.1

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, pesquisa com usuarios, seguranca, privacidade, observabilidade e release controlado trabalhando diretamente no projeto Appono.

Execute integralmente este marco de evolucao da Appono Intelligence, apresentada publicamente como Appono.AI. O objetivo e investigar, implementar e avaliar uma nova candidata tecnica identificada exclusivamente como `appono-intelligence-v2-1`, sem alterar a V2 congelada, o controle deterministico ou os artefatos historicos.

O resultado deve responder, de forma reproduzivel, se a V2.1 pode substituir a V2 como candidata tecnica para uma etapa posterior. A V2.1 somente pode avancar se superar o controle e nao for pior que a V1 no criterio principal pre-registrado, sem violar qualquer guardrail.

Nao entregue apenas opiniao, analise ou plano. Inspecione o repositorio, valide as pre-condicoes, implemente os contratos permitidos, colete ou ingira somente dados reais consentidos quando existirem, execute os testes autorizados, produza artefatos canonicos e documente uma decisao.

Nao faca commit, push, deploy, migration remota, operacao em Supabase, envio de e-mail, pagamento ou rollout publico sem autorizacao explicita separada.

## Limites fundamentais

1. Preserve integralmente `appono-intelligence-v2` como baseline congelada.
2. Preserve `deterministico-v3` como controle e fallback.
3. Nao ajuste pesos, limiares ou desempates para vencer um placar conhecido.
4. Nao use a reserva para descobrir ou corrigir a formula.
5. Nao transforme dados de clientes em treinamento antes de anonimizar, auditar e autorizar.
6. Nao use dados medicos, agenda, endereco, coordenadas, restricoes ou filtros eliminatorios como preferencia.
7. Nao trate uma revisao humana, um cliente ou um caso isolado como consenso.
8. Nao declare validacao comercial, IA pronta, superioridade ou release antes dos gates formais.

## Decisoes permitidas

Use somente uma decisao final:

- `V2_1_APROVADA_PARA_ALLOWLIST`: todos os gates passaram e a candidata pode iniciar allowlist controlada;
- `V2_1_APROVADA_PARA_INVESTIGACAO_INTERNA`: evidencia suficiente para continuar testes internos, mas insuficiente para clientes;
- `V2_1_REPROVADA_MANTER_V2`: a V2.1 nao superou os criterios ou apresentou risco, mantendo a V2;
- `V2_1_INSUFICIENTE_AGUARDAR_DADOS`: falta evidencia consentida, humana ou longitudinal sem violacao de integridade;
- `EVOLUCAO_V2_1_BLOQUEADA`: houve divergencia de hash, violacao de privacidade, guardrail, causalidade, reserva ou protocolo.

Nenhuma dessas decisoes autoriza rollout publico automatico.

## Gate 1 - Criterio de sucesso pre-registrado

Antes de abrir dados humanos ou executar a candidata, crie:

`backend/experiments/routine-intelligence/v2-1-evolution-protocol-v1.json`

O protocolo deve registrar:

- identificador e versao da V2.1;
- hashes da V2, V1, controle, politica, utilidade, guardrails e contrato longitudinal;
- criterio principal de qualidade;
- criterio de comparacao V2.1 x controle;
- criterio de comparacao V2.1 x V1;
- denominadores e unidades de analise;
- limites de confiança e volume efetivo;
- filtros eliminatorios e regras de elegibilidade;
- guardrails obrigatorios;
- regras para empate, indeterminado, fallback e falha tecnica;
- criterio de abandono;
- criterio de promocao para allowlist;
- criterio de bloqueio imediato;
- politica de revisao humana;
- politica de dados reais consentidos;
- politica de reserva prospectiva;
- rollout inicial permitido e rollout publico padrao zero.

O criterio nao pode ser alterado depois de observar os resultados.

Critério minimo obrigatório:

- V2.1 deve superar `deterministico-v3` no criterio principal;
- V2.1 nao pode ser pior que `appono-intelligence-v1` no criterio principal;
- nenhum filtro eliminatorio pode piorar;
- consentimento, privacidade, causalidade, idempotencia e fallback devem passar;
- resultado humano pode corroborar ou diagnosticar, mas nao substitui a avaliacao longitudinal.

## Gate 2 - Integridade da linha de base

Antes de editar:

- registre branch, HEAD, Node.js, npm e estado do Git;
- valide que a V2 continua `FROZEN`;
- valide hashes de scoring, V1, V2, controle, politica, guardrails e relatorios;
- confirme `formulas_changed: false` na V2;
- confirme rollout publico zero;
- confirme fallback para o controle;
- confirme reservas historica e prospectiva e seus estados;
- confirme ausencia de respostas humanas inventadas;
- confirme que nenhum artefato congelado sera sobrescrito.

Se qualquer hash da V2 divergir, bloqueie o trabalho e nao regenere o artefato para acomodar a divergencia.

Crie a V2.1 em novos arquivos, com novo identificador e novos hashes. Nao edite a implementacao da V2.

## Gate 3 - Observacao de uso real consentido

Quando existirem dados de clientes reais, use-os somente se todos os requisitos forem satisfeitos:

- consentimento explicito, atual, revogavel e rastreavel;
- finalidade documentada e limitada a avaliacao da rotina;
- separacao entre identificadores operacionais e dados analiticos;
- pseudonimizacao antes da analise;
- remocao de nome, e-mail, telefone, endereco, coordenada, agenda e texto livre;
- remocao ou generalizacao de dados medicos, financeiros e restricoes sensiveis;
- janela temporal e causalidade verificadas;
- sinais ativos, anteriores ao evento e com chave idempotente;
- auditoria de acesso e de transformacao;
- manifesto com hash do conjunto anonimizado;
- nenhum cliente individual exposto em relatorios.

Se nao houver dados reais consentidos, registre `DADOS_REAIS_AUSENTES`. Nao invente usuarios, feedbacks ou eventos. Fixtures sinteticas podem testar contratos, mas nunca podem ser apresentadas como uso real.

Dados reais nao podem entrar no treinamento, ajuste de pesos ou selecao de hiperparametros antes de anonimização, auditoria e autorizacao formal.

## Gate 4 - Diagnostico de falhas gerais

Construa uma matriz de falhas somente com evidencias reproduziveis. Cada padrao deve conter:

- `hypothesis_id` estavel;
- contexto geral afetado;
- mecanismo tecnico suspeito;
- evidencia em desenvolvimento;
- contraevidencia;
- personas, classes ou contextos afetados sem expor identidade;
- risco de overfitting;
- fixture independente;
- teste de sucesso;
- teste de abandono;
- impacto esperado no controle, V1 e V2;
- guardrails que nao podem mudar.

Rejeite como hipotese geral:

- um unico caso;
- uma unica pessoa;
- inferencia baseada apenas no nome de uma persona;
- ajuste escolhido para melhorar um placar observado;
- remocao de casos desfavoraveis;
- alteracao de filtro eliminatorio;
- mudanca que use agenda, restricao ou dado medico como gosto;
- mudanca sem teste independente;
- proposta dependente da reserva.

## Gate 5 - Implementacao isolada da V2.1

Implemente somente em modulos novos ou explicitamente versionados, por exemplo:

- `backend/src/domain/routine-intelligence-v2-1.js`;
- `backend/test/routine-intelligence-v2-1.test.js`;
- manifesto e protocolo novos;
- adaptador de comparacao isolado.

A V2.1 deve:

- receber a mesma entrada comum que controle, V1 e V2;
- receber somente candidatos elegiveis;
- preservar filtros de seguranca alimentar, funcionamento, disponibilidade, agenda, orcamento e raio;
- manter grupo sem historico neutro;
- usar sinais somente consentidos, ativos, anteriores e idempotentes;
- manter limiar de confiança `0.25`, salvo novo protocolo explícito;
- manter fallback para `deterministico-v3`;
- isolar falha, timeout e escolha fora do universo;
- produzir diagnostico allowlist-only;
- nao importar banco, HTTP, reserva, relogio real ou ambiente em modulo puro;
- nao alterar qualquer saida da V2.

Nao inclua pesos numericos escolhidos para vencer o placar, candidatos especiais ou excecoes por persona.

## Gate 6 - Testes em conjuntos separados

Organize os conjuntos sem mistura de denominadores:

### Desenvolvimento

Pode orientar a implementacao da V2.1. Permite testar hipoteses, fixtures, limites e falhas.

### Validacao

Deve permanecer intocada depois de aberta. Decide se a V2.1 atende ao protocolo.

### Reserva prospectiva

Deve ter novos IDs, particao, compromisso e protocolo antes da abertura. Deve ser aberta uma unica vez, somente com autorizacao explicita. Nenhum resultado da reserva pode alterar a V2.1.

Para cada conjunto, registre separadamente:

- cenarios;
- execucoes por modelo;
- falhas;
- fallbacks;
- escolhas inelegiveis;
- violacoes eliminatorias;
- arrependimento e utilidade;
- diversidade e repeticao;
- confiança e volume efetivo;
- cobertura por contexto;
- comparacoes V2.1 x controle e V2.1 x V1.

Nao crie metricas novas depois de observar os resultados.

## Gate 7 - Revisao humana cega real

Prepare um novo pacote cego com:

- casos completos e randomizados;
- contexto e opcoes nativas;
- nenhum nome de modelo;
- nenhum score, peso ou resultado automatico;
- hash do pacote e compromisso da chave;
- formulario original vazio;
- local de submissao documentado.

Aceite respostas somente quando:

- fornecidas por pessoa real e identificada por pseudonimo local;
- completas e sem duplicidade;
- vinculadas ao hash exato do pacote;
- validadas sem correcao automatica;
- livres de PII, segredo, chave, score ou resultado automatico.

Congele o arquivo por SHA-256 antes de abrir a chave. Agregue apenas estatisticas descritivas, separando A, B, empate e indeterminado, por comparador, contexto e classe. Nao declare consenso com um revisor e nao use confianca humana como peso principal.

Ausencia ou incompletude deve resultar em `REVISAO_HUMANA_PENDENTE` ou `REVISAO_HUMANA_INCOMPLETA`, nunca em empate ou preferencia sintetica.

## Gate 8 - Allowlist e rollout gradual

A promocao deve seguir esta ordem:

1. testes locais sinteticos;
2. ambiente interno sem cliente publico;
3. allowlist pequena de identidades consentidas;
4. modo sombra ou comparacao sem alterar a decisao efetiva;
5. allowlist operacional limitada, com controle como fallback;
6. expansao somente após critérios pré-registrados e monitoramento aprovado;
7. rollout publico somente em marco posterior e autorizacao separada.

O rollout inicial e publico deve permanecer `0` ate decisao explicita. A flag global deve estar desligada por padrao. O kill switch deve ser prioritario e restaurar o controle sem migration.

Monitore, sem coletar PII:

- percentual de fallback;
- baixa confiança;
- erros e timeouts;
- escolhas inelegiveis;
- violacoes eliminatorias;
- diversidade e repeticao;
- reclamações categorizadas sem texto livre;
- estabilidade por contexto;
- latencia e idempotencia;
- diferença entre V2.1, V2 e controle.

Defina limites objetivos de pausa e rollback antes de ativar a allowlist.

## Gate 9 - Decisao e relatorios

Crie, em destinos novos:

- protocolo de evolucao;
- registro de hipoteses;
- manifesto da V2.1;
- relatorio de desenvolvimento;
- relatorio de validacao;
- manifesto e relatorio da reserva, se autorizada;
- manifesto de respostas humanas;
- relatorio agregado humano;
- matriz de rollout;
- decisao tecnica;
- checkpoint datado.

Cada relatorio deve conter hashes, denominadores, estado de consentimento, limitacoes e flags de seguranca. Nao inclua PII, notas livres, sinais individuais, pesos privados, chave, semente, material de reserva ou snapshots completos.

O relatorio final deve declarar explicitamente:

- se V2.1 superou o controle;
- se V2.1 nao foi pior que V1;
- se todos os guardrails passaram;
- se a revisao humana foi valida, pendente ou incompleta;
- se dados reais foram usados e sob qual contrato;
- se a reserva foi acessada uma unica vez ou permaneceu selada;
- se houve recalibracao posterior;
- qual rollout esta autorizado;
- qual fallback permanece ativo.

## Verificacao obrigatoria

Descubra os scripts reais e execute os equivalentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute testes focados da V2.1, protocolo, anonimização, revisão humana, reserva, fallback, privacidade e rollout pelo menos tres vezes.

Use somente modos `--check` para artefatos congelados. Nao reexecute a reserva sem autorizacao explicita. Nao use modo de escrita em simuladores ou avaliadores sobre desenvolvimento, validacao ou reserva sem protocolo aprovado.

## Falhas que bloqueiam

Bloqueie a evolucao quando houver:

- hash da V2 alterado;
- V2.1 confundida com V2;
- criterio alterado depois dos resultados;
- dados reais sem consentimento ou anonimização;
- PII em dados, diagnosticos ou relatorios;
- sinal futuro, revogado, inativo ou duplicado usado;
- candidato inelegivel entregue a modelo;
- fallback ausente ou creditado como escolha nativa;
- conjunto de validacao ou reserva sobreposto;
- resposta humana inventada ou corrigida pelo agente;
- chave aberta antes do congelamento das respostas;
- peso escolhido para vencer placar;
- acesso nao autorizado a reserva;
- rollout publico ativado por padrao;
- ausencia de rollback ou kill switch.

Resultado de qualidade desfavoravel sem violacao de integridade deve produzir `V2_1_REPROVADA_MANTER_V2` ou `V2_1_INSUFICIENTE_AGUARDAR_DADOS`, nunca recalibracao oportunista.

## Checkpoint final

Crie:

`docs/appono-intelligence-v2-1-evolution-checkpoint.md`

Registre:

1. decisao final;
2. data planejada e real;
3. HEAD, branch e estado inicial;
4. hashes da V2 preservada;
5. identificador e hashes da V2.1;
6. criterio principal e gates;
7. dados reais consentidos ou ausencia deles;
8. anonimização e auditoria;
9. hipoteses gerais e testes independentes;
10. resultados separados de desenvolvimento, validacao e reserva;
11. revisao humana e quantidade de revisores;
12. fallback, guardrails e privacidade;
13. allowlist, kill switch e rollout;
14. defeitos e correcoes;
15. testes, builds, lint e diff;
16. arquivos criados ou alterados;
17. formulas da V2 inalteradas;
18. recalibracao posterior: `false`;
19. material de reserva protegido;
20. limitacoes metodologicas;
21. entrada exata para o proximo marco.

Nao marque a V2.1 como pronta para clientes somente porque passou em desenvolvimento, reserva ou revisao humana. A promocao exige todos os gates e autorizacao operacional separada.

## Resultado esperado

Ao terminar, entregue um sistema capaz de responder honestamente:

> A V2.1 funciona melhor que o controle, nao e pior que a V1, preserva seguranca e privacidade, foi testada em dados separados, recebeu revisao humana quando possivel e pode ser liberada gradualmente sob fallback?

Se a resposta for sim, a V2.1 pode avancar somente para a etapa de allowlist autorizada. Se a resposta for nao ou ainda nao houver evidencia, mantenha a V2 ou a V2.1 em investigacao interna, sem rollout publico e sem alterar a baseline congelada.
