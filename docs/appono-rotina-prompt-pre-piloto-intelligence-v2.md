# Prompt de entrega da Appono Intelligence V2 pronta ate 10/10/2026

Voce e um agente senior de produto, dados, experimentacao, seguranca, Supabase e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Sua missao e entregar a **Appono Intelligence V2 pronta, integrada e funcional ate 10 de outubro de 2026**. A IA deve operar de ponta a ponta em desenvolvimento e homologacao, ser acionavel para contas internas, possuir observabilidade, fallback e documentacao operacional. A ausencia de clientes reais limita a validacao comercial, mas nao pode ser usada como justificativa para entregar apenas um prototipo, relatorio ou simulacao isolada.

Nao entregue somente analise, arquitetura, pseudocodigo ou plano. Inspecione o repositorio, implemente o ciclo completo, preserve o comportamento existente, execute as avaliacoes, corrija regressoes justificadas, integre a versao final ao fluxo real de planejamento, habilite-a somente para contas internas de homologacao e documente evidencias. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Resultado esperado

Ao final, o projeto deve possuir:

1. perfis sinteticos comportamentalmente coerentes e versionados;
2. simulacao longitudinal reproduzivel, com treino, validacao e conjunto de reserva;
3. comparacao justa entre `deterministico-v3`, `appono-intelligence-v1` e a candidata V2;
4. revisao humana cega dos desacordos mais relevantes;
5. uma eventual V2.1 baseada em hipoteses documentadas, nunca ajustada apenas para vencer a propria amostra;
6. feature flags, agrupamento estavel e rollback preparados, com acesso interno ativo e rollout publico desativado;
7. relatorio final que diferencie prontidao tecnica, evidencia sintetica e validacao real ainda inexistente;
8. uma versao final congelada e identificada, mesmo que continue protegida por feature flag em producao;
9. selecao do modelo no backend sem condicionais espalhadas e com fallback automatico ao controle;
10. execucao completa com contas internas, desde a configuracao ate o planejamento gerado pela IA;
11. diagnostico interno que demonstre qual modelo decidiu, por que decidiu e quais guardrails foram aplicados.

A entrega de 10 de outubro deve ser uma **IA deterministica de recomendacao personalizada pronta como software**, integrada ao Appono Rotina e utilizavel em desenvolvimento/homologacao. Ela nao deve ser chamada de IA validada por clientes, modelo de machine learning treinado ou produto comprovadamente superior enquanto essa evidencia nao existir.

## Estado inicial obrigatorio

- Data de inicio do ciclo: 22/09/2026.
- Prazo-alvo: 10/10/2026.
- Modelo oficial: `deterministico-v3`.
- V1: congelada como referencia historica.
- V2: desafiante em modo sombra em `backend/src/domain/routine-intelligence-v2.js`.
- A V2 usa sinais consentidos, decaimento temporal, suavizacao, confianca e protecao contra repeticao.
- Cem sinais sinteticos ja foram gerados: 32 aprovacoes, 34 recusas e 34 alternativas.
- O ultimo teste da V2 produziu 6 vitorias, 8 derrotas e 28 empates tecnicos contra o controle.
- A V2 apresentou menor concentracao e maior diversidade que a V1, mas nao superou o controle.
- Nao existem clientes reais suficientes para um piloto ou experimento online.
- A decisao atual e `MANTER_EM_SOMBRA`.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- `docs/appono-rotina-integridade-transacional.md`;
- `docs/appono-rotina-prompt-intelligence-v2.md`;
- `docs/appono-rotina-prompt-coleta-validacao-v2.md`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/routes/routine.js`;
- `backend/scripts/seed-routine-evaluation.js`;
- `backend/scripts/collect-routine-behavior.js`;
- `backend/scripts/test-routine-shadow.js`;
- `backend/scripts/evaluate-routine-shadow.js`;
- testes de recomendacao, inteligencia, consentimento, rotas e avaliacao sombra;
- migrations de rotina, feedback, consentimento e avaliacao sombra.

Leia tambem as instrucoes locais do repositorio. Para alteracoes Supabase, consulte a documentacao oficial atual, a skill local e o `--help` do CLI. Nao reescreva migrations aplicadas.

## Regras inegociaveis

1. Preserve alteracoes locais e tudo que ja funciona.
2. Nao altere a V1 nem o controle para favorecer a V2.
3. Nao promova a V2 nem altere sugestoes visiveis ao cliente neste ciclo.
4. Nao fabrique pagamento, entrega, presenca, reserva concluida ou feedback elegivel por SQL.
5. Nao apresente sinal sintetico como comportamento real.
6. Nao use alergia, restricao medica, agenda, endereco, coordenada exata, suporte ou ausencia de reclamacao como gosto inferido.
7. Seguranca alimentar, funcionamento, disponibilidade, agenda, orcamento e raio permanecem filtros eliminatorios.
8. Preferencia explicita deve prevalecer sobre inferencia fraca ou contraditoria.
9. Sem historico elegivel, ajuste e confianca devem permanecer zero.
10. Revogacao ou exclusao logica deve retirar o efeito do sinal.
11. A mesma entrada, semente, relogio de referencia e configuracao devem produzir a mesma saida.
12. Separe dados de desenvolvimento, calibracao, validacao e reserva para reduzir sobreajuste.
13. A regua independente nao pode reutilizar a formula da V2.
14. Nenhum script pode imprimir senha, JWT, magic link, token OAuth ou `service_role`.
15. Testes remotos exigem autorizacao explicita e somente contas identificadas como `[DEMO]`.
16. Nao execute pagamento ou e-mail real.
17. Nao faca commit, push, deploy ou migration remota sem autorizacao explicita.

## Fase 1 - Congelar o protocolo experimental

Registre uma linha de base imutavel antes de qualquer ajuste:

- versao do controle, V1, V2 e regua independente;
- commit ou hash do conteudo avaliado, sem criar commit;
- sementes aleatorias, relogio de referencia e catalogo utilizado;
- quantidade de perfis, semanas, janelas e candidatos;
- metricas atuais, incluindo 6 vitorias, 8 derrotas e 28 empates da V2;
- regras eliminatorias e invariantes de seguranca;
- criterios de sucesso definidos antes de observar a nova avaliacao.

Crie um manifesto de experimento legivel por maquina, versionado no repositorio e sem credenciais. O manifesto deve impedir comparacoes entre execucoes que usaram catalogos ou regras diferentes sem indicar a diferenca.

## Fase 2 - Perfis sinteticos coerentes

Substitua a distribuicao aleatoria de acoes por personas com comportamento interno consistente. Crie, no minimo:

- economico consistente;
- explorador com busca de variedade;
- fiel a restaurantes favoritos;
- fiel a pratos favoritos;
- sensivel a distancia;
- avesso a repeticao;
- cliente com preferencias explicitas fortes;
- cliente com sinais contraditorios;
- cliente com mudanca gradual de gosto;
- grupo de controle sem historico.

Cada persona deve declarar:

- preferencias explicitas;
- orcamento e raio;
- janelas alimentares;
- restaurantes, produtos e categorias de afinidade;
- aversoes nao medicas;
- tolerancia a repeticao;
- regra deterministica de aprovar, recusar, trocar ou editar;
- condicao de conversao simulada apenas para avaliacao offline;
- nivel esperado de ruido;
- semente fixa;
- resultado esperado em cenarios simples.

Nao codifique a resposta exata que a V2 deveria escolher. Modele utilidade independente por atributos observaveis para que controle e desafiantes sejam julgados pela mesma referencia externa.

## Fase 3 - Gerador de cenarios e conjuntos separados

Construa um gerador deterministico de cenarios com tres conjuntos:

- `desenvolvimento`: pode orientar depuracao;
- `validacao`: usado para aceitar ou rejeitar mudancas;
- `reserva`: oculto da calibracao e executado somente no fechamento.

Requisitos:

- sementes diferentes por conjunto;
- nenhuma refeicao ou sequencia identica atravessa conjuntos;
- variacao de catalogo, semana, janela, preco, distancia, disponibilidade e preferencias;
- casos de fronteira para pouco historico, historico antigo, contradicao e mudanca de gosto;
- pelo menos seis semanas virtuais por persona;
- relogio virtual somente no dominio e nas fixtures offline;
- chamadas remotas reais nao podem ser retrodatadas nem adulteradas;
- snapshot minimo de entrada suficiente para reproduzir falhas, sem PII.

O conjunto de reserva deve permanecer inacessivel ao codigo de calibracao e ter comando separado.

## Fase 4 - Simulacao longitudinal

Implemente uma simulacao semana a semana:

1. o controle gera candidatos elegiveis;
2. controle, V1 e V2 ordenam exatamente os mesmos candidatos;
3. a persona reage conforme sua funcao de utilidade independente;
4. somente sinais consentidos entram na semana seguinte;
5. decaimento, contradicao, diversidade e confianca sao recalculados;
6. todas as decisoes recebem chave idempotente;
7. o grupo de controle permanece sem personalizacao;
8. resultados sao agregados sem PII.

Meça por semana e por persona:

- utilidade externa media;
- taxa de aprovacao, recusa, alternativa e edicao;
- arrependimento em relacao a melhor opcao elegivel da persona;
- cobertura de preferencias explicitas;
- diversidade de restaurante, produto e categoria;
- repeticao consecutiva;
- concentracao maxima;
- confianca, volume efetivo e consistencia;
- estabilidade entre semanas;
- violacoes eliminatorias;
- regressao maxima por persona, nao apenas media global.

## Fase 5 - Avaliacao humana cega

Crie um pacote de revisao dos principais desacordos sem identificar qual opcao veio do controle ou da V2.

Para cada caso, mostre apenas:

- contexto nao sensivel da persona;
- preferencias explicitas relevantes;
- janela, faixa de preco e distancia aproximada;
- sequencia recente de restaurantes e categorias;
- opcao A e opcao B;
- justificativas neutras;
- campo para escolher A, B ou empate;
- campo de motivo estruturado.

Randomize a ordem A/B com semente registrada. Nao mostre pesos, nome do modelo, confianca ou resultado da regua automatica antes do julgamento. Exporte um arquivo reutilizavel e um resumo agregado. Se somente uma pessoa revisar, documente o risco de vies e nao chame o resultado de consenso.

## Fase 6 - Diagnostico e eventual V2.1

Analise as derrotas da V2 por causa, por exemplo:

- preferencia explicita ignorada;
- afinidade fraca superestimada;
- confianca excessiva;
- repeticao penalizada demais;
- sinal contraditorio mal compensado;
- mudanca de gosto lenta demais;
- empate instavel;
- problema da regua, fixture ou catalogo.

Somente implemente V2.1 quando houver uma hipotese geral sustentada por varios casos. Toda alteracao deve:

- ter teste de regressao;
- preservar o limite de ajuste;
- preservar neutralidade sem historico;
- manter filtros eliminatorios;
- melhorar validacao sem degradar gravemente nenhuma persona;
- ser avaliada no conjunto de reserva apenas depois de congelada.

Nao ajuste pesos caso a unica justificativa seja melhorar o placar da amostra observada. Se nenhuma mudanca generalizavel for encontrada, mantenha a V2 atual e documente a conclusao.

## Fase 7 - Guardas de preferencia e confianca

Valide ou implemente, de forma conservadora:

- inferencia comportamental nao ultrapassa preferencia explicita forte com confianca baixa;
- uma ou duas amostras produzem efeito minimo;
- sinais contraditorios reduzem confianca;
- afinidade nao elimina variedade semanal;
- penalidade de repeticao nao bloqueia favorito com evidencia consistente;
- mudanca recente de gosto nao apaga abruptamente historico consolidado;
- revogacao zera o uso futuro dos sinais;
- explicacao tecnica identifica contribuicoes sem revelar dados privados.

## Fase 8 - Integrar a IA final e preparar o release

Integre a versao final ao fluxo real de planejamento e implemente a infraestrutura de liberacao controlada:

- feature flag global desativada por padrao;
- percentual de rollout padrao igual a zero;
- allowlist opcional de contas internas;
- agrupamento estavel por cliente, sem alternar modelo entre requisicoes;
- exigencia de consentimento ativo;
- retorno automatico ao controle diante de erro, baixa confianca ou ausencia de historico;
- kill switch operacional;
- registro seguro da versao que decidiu cada sugestao;
- painel agregado com modelo, periodo, amostra e guardrails;
- nenhum botao de promocao automatica;
- nenhum acesso da V2 a candidatos eliminados.
- registro da decisao final no planejamento sem expor pesos ou sinais privados;
- rota ou diagnostico administrativo para confirmar o modelo executado;
- execucao habilitada para allowlist interna em desenvolvimento/homologacao;
- demonstracao de configuracao, geracao, decisao da IA, fallback e auditoria;
- manual operacional para ativar, limitar, interromper e diagnosticar a IA.

A flag publica deve permanecer desligada ao final, mas a IA deve estar habilitavel e funcional para contas internas autorizadas em desenvolvimento/homologacao. Inclua testes provando que o comportamento publico padrao continua sendo o controle e que a allowlist interna realmente executa a versao final.

## Fase 9 - Criterios de aceitacao offline

Defina os limites antes de executar o conjunto de reserva. Sugestao inicial:

- zero violacoes eliminatorias;
- neutralidade total sem historico;
- determinismo em 100% das repeticoes;
- melhora de utilidade externa mediana sobre a V1;
- resultado nao inferior ao controle na media global;
- nenhuma persona com regressao grave previamente definida;
- concentracao igual ou menor que a V1;
- cobertura de preferencia explicita nao inferior ao controle por margem relevante;
- confianca crescente com evidencia e reduzida por contradicao;
- falha da V2 nunca bloqueia o planejamento oficial.

Se a V2 nao superar esses criterios, classifique-a como `MANTER_EM_SOMBRA` ou `REJEITAR_AJUSTE_V2_1`. Nao flexibilize limites depois de ver o resultado.

Mesmo que todos os criterios offline sejam atendidos, a conclusao maxima permitida sem clientes reais e `IA_PRONTA_EM_HOMOLOGACAO`, com rollout publico ainda em zero. Esse estado significa software completo e operacional, nao mera proposta ou prototipo.

## Fase 10 - Testes

Adicione testes para:

- reproducibilidade por semente;
- isolamento entre desenvolvimento, validacao e reserva;
- personas com utilidade independente;
- seis ou mais semanas por persona;
- neutralidade do grupo de controle;
- confianca zero sem historico;
- consentimento e revogacao;
- idempotencia dos sinais;
- decaimento e contradicao;
- preferencia explicita versus inferencia fraca;
- mudanca gradual de gosto;
- diversidade e repeticao;
- filtro de alergia, funcionamento, agenda, orcamento e raio;
- falha segura de V1 ou V2;
- agrupamento estavel do piloto;
- rollout zero por padrao;
- kill switch;
- ausencia de PII nos relatorios;
- cegamento A/B da revisao humana;
- impossibilidade de usar o conjunto de reserva durante calibracao.

Execute ao final:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute tambem os comandos especificos da simulacao, avaliacao sombra e conjunto de reserva. Separe claramente testes locais, simulacao offline e qualquer smoke remoto autorizado.

## Fase 11 - Documentacao e evidencia

Atualize:

- `README.md` com o estado correto da inteligencia e flags;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- um relatorio versionado da simulacao longitudinal;
- instrucoes para revisao humana cega;
- ordem de implantacao futura e rollback;
- `.env.example` somente com nomes e valores seguros.

Registre:

- protocolo e sementes;
- personas e suas regras;
- resultados por conjunto e semana;
- mudancas testadas e rejeitadas;
- resultados da revisao humana;
- limitacoes da evidencia sintetica;
- decisao final e justificativa.

## Definicao de pronto para 10/10/2026

O ciclo estara concluido somente quando:

- a linha de base estiver congelada;
- personas coerentes substituirem acoes aleatorias na avaliacao principal;
- simulacao longitudinal for reproduzivel;
- conjuntos de desenvolvimento, validacao e reserva estiverem separados;
- controle, V1, V2 e eventual V2.1 forem comparados justamente;
- principais desacordos tiverem pacote de revisao cega;
- guardrails e preferencias explicitas tiverem testes;
- infraestrutura de piloto existir com rollout zero;
- uma versao final da IA estiver congelada, registrada e selecionavel pelo backend;
- a IA gerar planejamentos de ponta a ponta para contas internas autorizadas;
- fallback, kill switch e diagnostico interno estiverem funcionais;
- houver evidencia executavel de que o fluxo usa a IA, e nao apenas uma simulacao separada;
- suite completa, builds, lint e diff passarem;
- nenhuma credencial estiver no diff;
- nenhuma migration remota, pagamento, e-mail, commit, push ou deploy ocorrer sem autorizacao;
- a documentacao declarar que nao houve validacao com clientes reais.

## Entrega final

Apresente:

1. arquitetura da simulacao e dos conjuntos de dados;
2. personas e regras de comportamento;
3. arquivos, testes e eventuais migrations criados;
4. comparacao controle versus V1 versus V2 e eventual V2.1;
5. resultados por persona e por semana;
6. avaliacao no conjunto de reserva;
7. resultado da revisao humana cega;
8. regressoes encontradas e correcoes aceitas ou rejeitadas;
9. guardrails, privacidade e consentimento;
10. estado das feature flags e do rollback;
11. resultados locais e remotos separados;
12. limitacoes por ausencia de clientes reais;
13. decisao final entre `IA_PRONTA_EM_HOMOLOGACAO`, `MANTER_EM_SOMBRA` ou `REJEITAR_AJUSTE_V2_1`, sem usar o prazo para esconder falhas;
14. ordem segura de implantacao futura;
15. sugestoes de commits separados, sem executa-los.

Nao confunda simulacao com mercado, avaliacao offline com piloto, motor deterministico com machine learning treinado ou data de entrega com evidencia de superioridade. O objetivo ate 10 de outubro e ter a Appono Intelligence implementada, integrada, testada e funcionando em homologacao. A validacao com clientes reais sera uma etapa posterior, nao uma pendencia de codigo para chamar a IA de pronta.
