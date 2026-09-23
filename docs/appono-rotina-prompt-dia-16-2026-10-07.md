# Prompt do Dia 16 - Validacao offline e conjunto de reserva da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **7 de outubro de 2026** da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **executar a validacao offline congelada e abrir, executar e auditar o conjunto de reserva prospectiva**, somente conforme os protocolos ja registrados. O resultado deve informar se a candidata V2 permanece tecnicamente utilizavel em desenvolvimento e homologacao interna, sem recalibrar pesos, ajustar limiares, excluir casos desfavoraveis ou modificar a formula depois de observar os resultados.

Nao entregue apenas analise, opiniao ou plano. Inspecione o repositorio, valide as pre-condicoes, execute somente as CLIs autorizadas, preserve todos os artefatos anteriores, produza relatorios canonicos e crie um checkpoint datado.

Este marco **nao autoriza** implementar V2.1, recalibrar a V2, alterar o controle, mudar guardrails, reabrir a decisao tecnica, usar respostas humanas inexistentes, integrar novos fluxos, ativar rollout publico ou declarar validacao comercial.

Nao faca commit, push, deploy, migration remota, seed remoto, pagamento, e-mail ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `07/10/2026`.

Entrega prevista:

> Validacao offline e conjunto de reserva executados conforme protocolo, sem recalibracao posterior.

O marco somente pode ser encerrado quando estiver comprovado que:

- o Dia 06 continua aprovado e reproduzivel;
- a candidata usada e exatamente `appono-intelligence-v2` em estado `FROZEN`;
- validacao e reserva usam entradas, contratos e candidatos elegiveis definidos antes da execucao;
- a reserva prospectiva foi aberta somente com autorizacao local explicita, compromisso conferido e protocolo valido;
- a reserva historica contaminada nao foi usada;
- nenhum resultado da reserva foi usado para alterar a formula, pesos, limiares, desempates ou filtros;
- os denominadores de desenvolvimento, validacao e reserva permanecem separados;
- falhas, fallbacks, escolhas inelegiveis e violacoes eliminatorias sao reportados sem ocultacao;
- resultados negativos nao sao convertidos em ajuste oportunista;
- nenhuma resposta humana e inventada ou inferida;
- nenhum dado real de cliente e usado como evidencia offline;
- nenhum modelo e executado fora do conjunto autorizado;
- rollout publico permanece zero;
- existe decisao tecnica pos-validacao limitada ao protocolo;
- existe entrada objetiva para 08/10.

## Decisoes permitidas

Use somente uma decisao de marco:

- `VALIDACAO_RESERVA_CONCLUIDA`: execucao integra e sem bloqueador, com candidata preservada;
- `VALIDACAO_RESERVA_CONCLUIDA_COM_RESSALVAS`: execucao integra, mas existe limitacao nao eliminatoria documentada;
- `VALIDACAO_RESERVA_REPROVADA_MANTER_EM_SOMBRA`: houve falha de qualidade ou cobertura sem violacao de integridade, portanto a V2 permanece somente em sombra/controle;
- `VALIDACAO_RESERVA_BLOQUEADA`: hash, protocolo, isolamento, privacidade, guardrail, reserva ou execucao invalida impedem conclusao confiavel.

Nao use resultado de qualidade para declarar `V2_1`, `IA_PRONTA`, homologacao geral, piloto publico, superioridade comercial ou release.

## Pre-condicoes do Dia 06

Antes de editar, abrir a reserva ou executar qualquer modelo, confirme no repositorio:

- checkpoint de 06/10 presente e coerente;
- decisao de 06/10 igual a `INTEGRACAO_CONTROLADA_CONCLUIDA` ou ressalva nao bloqueante documentada;
- candidata congelada em estado `FROZEN`;
- hash canonico do manifesto e do relatorio de congelamento conferido;
- controle, V1, V2, politica, contrato longitudinal e guardrails com hashes preservados;
- validacao `validacao_v1` existente, integra e nao alterada;
- snapshots e relatorios anteriores preservados;
- desenvolvimento e validacao com denominadores separados;
- reserva historica igual a `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva igual a `SEALED_UNMATERIALIZED` antes da abertura;
- compromisso publico da reserva presente e valido;
- rollout publico igual a `0`;
- respostas humanas validas igual a `0`, salvo submissao externa real e explicitamente documentada;
- nenhuma V2.1 implementada;
- arvore de trabalho limpa ou alteracoes locais identificadas e preservadas;
- suite, builds, lint e diff aprovados no Dia 06.

Se qualquer pre-condicao de integridade falhar, nao abra a reserva. Crie checkpoint com `VALIDACAO_RESERVA_BLOQUEADA` e preserve os artefatos existentes.

## Leitura obrigatoria

Leia integralmente:

- `README.md`;
- `package.json`, `backend/package.json` e `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 06/10;
- prompts dos Dias 1 a 15;
- manifesto e relatorio de congelamento final;
- protocolo longitudinal;
- protocolo de guardrails;
- protocolo de decisao tecnica;
- protocolo de revisao cega;
- particoes e manifesto de reserva;
- snapshots de desenvolvimento e validacao;
- contrato longitudinal, simulador, metricas, guardrails e auditores;
- politica, controle, V1 e V2 somente para validar hashes e contratos;
- modulo de integracao operacional e testes do Dia 06;
- scripts reais de simulacao, avaliacao, abertura e auditoria da reserva.

Nao leia sementes, resultados ou material privado da reserva antes da etapa formal de abertura autorizada. Nao execute simulador historico.

## Regras inegociaveis

1. Preserve todas as alteracoes locais e artefatos congelados.
2. Nao altere formula, pesos, limites, decaimento, suavizacao, desempates, filtros ou limiar `0.25`.
3. Nao implemente V2.1 e nao crie variante comportamental.
4. Nao execute a reserva historica contaminada.
5. Nao use cliente real, PII, feedback real ou evento real como dado de reserva.
6. Nao abra a reserva sem confirmar manifesto, compromisso, candidata `FROZEN` e comando explicito permitido.
7. Nao reexecute ou sobrescreva desenvolvimento, validacao, comparacao, guardrails ou pacote cego.
8. Nao remova casos por serem desfavoraveis.
9. Nao ajuste o modelo depois de observar qualquer resultado.
10. Nao misture denominadores entre desenvolvimento, validacao e reserva.
11. Nao declare vencedor final, significancia comercial ou consenso humano.
12. Nao invente respostas humanas.
13. Nao habilite rollout publico, allowlist nova ou fluxo operacional adicional.
14. Nao persista material privado da reserva em artefato publico.
15. Nao grave resultados em relatorios historicos ou congelados.
16. Nao faca commit, push, deploy, migration remota ou operacao Supabase.

## Fase 1 - Inventario e linha de base

Registre antes da execucao:

- branch, `HEAD`, Node.js e npm;
- estado da arvore de trabalho e arquivos nao rastreados;
- hashes do manifesto, relatorio, scoring, controle, V1, V2, politica e guardrails;
- hashes de snapshots, brutos, metricas, comparacao e pacote cego;
- estado da decisao tecnica e da integracao controlada;
- estado das respostas humanas;
- estado das reservas antes da abertura;
- flags, allowlist, kill switch e rollout;
- comandos disponiveis e destinos novos permitidos;
- quantidade esperada de cenarios e execucoes por conjunto.

Separe claramente artefatos congelados, relatorio de validacao, relatorio de reserva, manifesto de abertura, resultado tecnico e checkpoint.

## Fase 2 - Protocolo de abertura da reserva

Antes de abrir a reserva, valide:

- candidata em `FROZEN`;
- manifesto e relatorio com hashes canonicos correspondentes;
- compromisso da reserva igual ao valor registrado nas particoes;
- particao de reserva distinta de desenvolvimento e validacao;
- ausencia de intersecao de IDs, chaves semanticas, snapshots, sequencias e sinais;
- semente ou material privado somente acessivel pelo script autorizado;
- comando recusando dataset, caminho, quantidade ou semente arbitrarios;
- registro de hora declarada apenas no manifesto local, sem usar relogio para aleatoriedade;
- `reserve_accessed` inicialmente `false` e alterado somente no novo manifesto de execucao.

A abertura deve ser atomica, auditavel e irreversivel para fins de validade experimental. Se a ferramenta nao oferecer abertura verificavel, bloqueie o marco e nao reconstrua a reserva manualmente.

Registre no manifesto de abertura apenas:

- versao do protocolo;
- candidata e hashes;
- particao autorizada;
- compromisso conferido;
- operador local;
- data planejada e data de execucao;
- quantidade esperada;
- `reserve_accessed: true` depois da abertura;
- ausencia de cliente real;
- ausencia de recalibracao.

Nao publique semente, sal, catalogo privado ou resultados brutos da reserva em diretorio distribuivel.

## Fase 3 - Validacao offline congelada

Execute primeiro a validacao existente em modo somente leitura ou no modo formal autorizado pelo protocolo, sem alterar seus artefatos de origem.

Confirme:

- quantidade de personas, semanas, cenarios e execucoes;
- candidatos comuns e elegibilidade antes da personalizacao;
- zero sobreposicao com desenvolvimento e reserva;
- falhas por modelo;
- fallbacks por modelo;
- escolhas inelegiveis;
- violacoes de filtros eliminatorios;
- confianca e volume efetivo por faixa;
- neutralidade sem historico;
- consentimento, revogacao e sinais futuros;
- isolamento de estado;
- determinismo e hash do relatorio;
- ausencia de vencedor final fora dos criterios pre-registrados.

Nao substitua o relatorio congelado por uma nova saida. Se a ferramenta gerar uma copia de verificacao, escreva somente em destino novo.

## Fase 4 - Execucao da reserva prospectiva

Use somente o script e os argumentos fixos descobertos no repositorio. A execucao deve:

- usar a particao prospectiva selada;
- usar a candidata congelada e os comparadores registrados;
- aplicar o mesmo contrato de entrada comum;
- executar todas as personas, semanas e cenarios planejados;
- preservar candidatos inelegiveis fora da entrada dos modelos;
- manter o controle, V1 e V2 em estados isolados;
- registrar falhas sem tentar novamente com parametros diferentes;
- registrar fallback sem conta-lo como escolha nativa da V2;
- manter eventos futuros fora do historico causal;
- manter consentimento e idempotencia;
- produzir hash canonico e relatorio bruto separado.

Nao interrompa ou reduza a reserva para melhorar tempo ou resultado. Em caso de erro parcial, preserve o resultado parcial, marque a execucao invalida se o protocolo exigir e nao complete linhas ausentes.

## Fase 5 - Metricas e comparacoes permitidas

Calcule somente metricas previstas nos contratos existentes:

- utilidade;
- arrependimento;
- diversidade e repeticao;
- concentracao;
- confianca;
- volume efetivo;
- falhas e fallbacks;
- violacoes eliminatorias;
- cobertura por persona, semana, conjunto e modelo;
- comparacoes pareadas com denominadores explicitos.

Separe sempre:

- desenvolvimento;
- validacao;
- reserva;
- controle;
- V1;
- V2.

Nao crie nova metrica, novo limiar ou nova regra de desempate. Nao faça teste estatistico que sugira validade comercial com amostra sintetica intencional.

## Fase 6 - Regras de interpretacao

Interprete os resultados assim:

- seguranca estrutural e qualidade sao dimensoes diferentes;
- zero violacoes nao prova superioridade;
- resultado negativo na reserva nao autoriza recalibracao;
- resultado positivo na reserva nao prova clientes reais;
- empate e indeterminado permanecem categorias distintas;
- fallback demonstra resiliência, nao vitoria da V2;
- divergencia entre V2 e controle deve permanecer visivel;
- uma reserva serve para estimar generalizacao do protocolo, nao para escolher pesos depois;
- resultados sinteticos nao substituem observacao comercial;
- revisao humana pendente nao vira consenso.

Produza uma decisao conservadora quando a candidata falhar no criterio pre-registrado. Mantenha a V2 em sombra se a integridade estiver preservada, mesmo que o resultado de qualidade seja desfavoravel.

## Fase 7 - Falhas que bloqueiam

Classifique como `VALIDACAO_RESERVA_BLOQUEADA` quando houver:

- hash divergente antes ou depois da execucao;
- compromisso de reserva invalido;
- particao sobreposta;
- candidato ou formula diferente da V2 `FROZEN`;
- material da reserva exposto antes da abertura;
- uso da reserva historica;
- dados reais ou PII;
- escrita sobre artefato congelado;
- quantidade ou semente alterada por argumento;
- execucao parcial tratada como completa;
- falha de isolamento entre conjuntos ou modelos;
- fallback contado como escolha nativa;
- violacao eliminatoria sem registro;
- ajuste posterior ao resultado;
- rollout publico diferente de zero;
- resposta humana fabricada.

Resultado de qualidade desfavoravel, sem falha de integridade, deve ser registrado como resultado tecnico e nao como bloqueio de auditoria.

## Fase 8 - Testes obrigatorios

Adicione ou execute testes para comprovar:

- pre-condicoes recusam candidata nao congelada;
- compromisso invalido bloqueia abertura;
- reserva historica e recusada;
- particoes sobrepostas sao recusadas;
- argumentos arbitrarios de dataset, quantidade e semente falham;
- abertura ocorre uma unica vez;
- relatorio parcial nao vira relatorio completo;
- entradas comuns permanecem iguais entre modelos;
- candidatos inelegiveis nao chegam aos modelos;
- sinais futuros, revogados, sem consentimento ou duplicados nao produzem efeito;
- estado de uma persona, conjunto ou modelo nao contamina outro;
- fallback nao recebe credito de V2;
- falha do controle invalida o conjunto sem inventar escolha;
- hashes sao deterministas;
- relatorios anteriores nao mudam;
- reserva nao gera rollout;
- nenhum modelo remoto, banco ou HTTP e chamado pelo dominio puro;
- nenhuma saida contem PII, segredo ou semente privada;
- ausencia humana permanece ausencia humana.

Use fixtures artificiais somente para contratos e falhas. Nunca as classifique como resultado da reserva ou resposta de pessoa.

## Fase 9 - Verificacao obrigatoria

Descubra os comandos reais e execute, sem modo de escrita em artefatos congelados:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run evaluate:rotina:longitudinal --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Depois de validar os comandos reais de abertura, execute a reserva somente uma vez no destino novo autorizado. Rode os testes focados pelo menos tres vezes. Nao execute simulacao historica, seed remoto, Supabase remoto, pagamento, e-mail, deploy ou migration.

## Fase 10 - Auditoria estatica

Varra relatorios, manifestos e codigo novo procurando:

- PII, coordenadas, agenda, dado medico ou financeiro;
- tokens, credenciais, JWT, senha ou segredo;
- semente, sal, catalogo ou material privado da reserva em arquivo publico;
- nomes indevidos de clientes;
- peso, limiar ou desempate novo;
- resultado de reserva usado como configuracao;
- fallback apresentado como V2;
- alegacao de validacao comercial, vencedor ou release;
- escrita em snapshot, relatorio ou pacote congelado;
- rollout diferente de zero.

Analise falsos positivos individualmente. Nao use exclusoes amplas para fazer a auditoria passar.

## Fase 11 - Relatorios novos

Crie apenas em destinos novos:

- manifesto de abertura da reserva;
- relatorio bruto da reserva;
- relatorio de metricas da reserva;
- comparacao tecnica entre conjuntos, se prevista pelo contrato;
- resumo seguro sem semente ou material privado;
- registro de decisao pos-validacao;
- checkpoint de 07/10.

Os relatorios devem conter schema, versao, candidata, hashes, denominadores, falhas, fallbacks, violacoes, limitacoes e `reserve_accessed: true` somente nos artefatos internos autorizados.

O resumo distribuivel nao deve conter semente, sal, IDs privados, catalogo interno, PII, notas humanas, pesos ou material que permita reconstruir a reserva.

## Fase 12 - Checkpoint do Dia 07

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-07.md`

Registre:

1. decisao do marco;
2. data planejada e real;
3. confirmacao de encerramento do Dia 06;
4. branch, HEAD e estado inicial da arvore;
5. candidata, estado `FROZEN` e hashes;
6. protocolo e compromisso da reserva;
7. estado antes e depois da abertura;
8. quantidade de cenarios e execucoes por conjunto;
9. denominadores por modelo;
10. falhas, fallbacks e violacoes eliminatorias;
11. metricas permitidas e resultados separados;
12. comparacao com desenvolvimento e validacao;
13. resultado da reserva sem recalibracao;
14. limitações sinteticas e humanas;
15. arquivos criados ou alterados;
16. comandos e resultados;
17. hashes dos novos artefatos;
18. confirmacao de que formulas e pesos nao mudaram;
19. confirmacao de que nenhum artefato anterior foi sobrescrito;
20. confirmacao de que a reserva historica nao foi usada;
21. confirmacao de que nenhum cliente real foi usado;
22. confirmacao de rollout publico zero;
23. riscos residuais;
24. trabalho preparado para 08/10;
25. entrada exata do proximo marco.

Nao atualize o calendario para concluido antes de o checkpoint, os hashes e todos os criterios estarem verificados. Marque somente 07/10.

## Criterios de encerramento

O Dia 07 somente pode ser concluido quando:

- Dia 06 continua aprovado;
- candidata, controle, politica e guardrails mantem hashes;
- validacao e reserva foram executadas conforme protocolo;
- reserva foi aberta uma unica vez e de forma auditavel;
- denominadores e particoes permanecem separados;
- falhas e fallbacks estao completos;
- nenhuma violacao eliminatoria foi omitida;
- nenhum resultado foi usado para recalibrar;
- nenhum cliente real, PII ou resposta humana foi usado;
- relatorios novos sao canonicos e seguros;
- suite, builds, lint, diff e testes focados passam;
- reserva historica continua contaminada e intocada;
- rollout publico permanece zero;
- checkpoint esta completo;
- nenhuma operacao remota, commit, push ou deploy ocorreu.

## Aceleracao segura para 08/10

Pode ficar marcado como `PREPARADO`:

- relatorio de validacao offline;
- matriz de discrepancias por persona e conjunto;
- checklist de homologacao interna;
- testes de smoke do fluxo operacional;
- auditoria de diagnosticos;
- plano de allowlist interna;
- criterios para manter V2 em sombra.

Nao pode ficar marcado como concluido:

- homologacao geral;
- piloto publico;
- rollout;
- release;
- validacao comercial;
- V2.1;
- nova recalibracao.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. resultado da validacao offline;
3. resultado do conjunto de reserva;
4. confirmacao de que o Dia 06 continua aprovado;
5. identificador e hashes da candidata;
6. compromisso e estado da reserva;
7. cobertura, cenarios e execucoes;
8. falhas, fallbacks e violacoes;
9. metricas separadas por conjunto e modelo;
10. confirmacao de que nao houve recalibracao;
11. arquivos criados ou alterados;
12. testes, builds, lint e diff;
13. confirmacao de que formulas e artefatos anteriores permaneceram intactos;
14. confirmacao de que a reserva historica nao foi usada;
15. confirmacao de que nenhum cliente real foi usado;
16. confirmacao de rollout publico zero;
17. limitacoes metodologicas;
18. trabalho preparado para 08/10;
19. entrada exata do proximo marco: ativar somente a homologacao interna autorizada, com allowlist, diagnostico seguro, fallback e rollout publico zero.

Nao confunda reserva com cliente real, resultado positivo com validacao comercial, falha de qualidade com autorizacao para recalibrar, abertura com publicacao de segredo, fallback com vitoria da V2 ou validacao offline com release. O objetivo do Dia 07 e medir a candidata congelada uma vez, de forma honesta e irreversivel, preservando a possibilidade de manter a V2 em sombra.
