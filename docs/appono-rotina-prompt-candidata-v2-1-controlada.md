# Prompt - Candidata V2.1 controlada, congelamento e validacao comparativa

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, pesquisa com usuarios, seguranca, privacidade, estatistica aplicada e release controlado trabalhando diretamente no projeto Appono.

Execute integralmente este marco para investigar uma unica candidata geral de `appono-intelligence-v2-1`. O objetivo e escolher uma hipotese sustentada por evidencia, implementar uma candidata isolada, testar primeiro em desenvolvimento, congela-la antes da validacao, avaliar a candidata na validacao congelada e comparar os resultados contra o controle deterministico, a V1 e a V2 atual.

Somente depois de todos esses passos, e somente com autorizacao explicita separada, sera permitido considerar uma nova reserva prospectiva. A reserva nao pode ser usada para descobrir a formula, escolher pesos, corrigir a candidata ou selecionar a hipotese.

Nao entregue apenas analise, opiniao ou plano. Inspecione o estado real do repositorio, implemente os artefatos e testes necessarios, execute as verificacoes permitidas, produza relatorios canonicos e registre uma decisao reproduzivel.

Nao faca commit, push, deploy, migration remota, operacao em Supabase, envio de e-mail, pagamento ou acesso a reserva sem autorizacao explicita para essa operacao especifica.

## Resultado esperado

Ao final, produza exatamente uma decisao:

- `V2_1_APROVADA_PARA_AVALIACAO_DE_RESERVA`: desenvolvimento e validacao passaram; a reserva apenas pode ser considerada mediante autorizacao separada;
- `V2_1_APROVADA_PARA_INVESTIGACAO_INTERNA`: candidata coerente, mas evidencia ainda insuficiente para reserva ou cliente;
- `V2_1_REPROVADA_MANTER_V2`: a candidata nao cumpriu os criterios ou introduziu regressao;
- `V2_1_INSUFFICIENTE_AGUARDAR_EVIDENCIA`: falta evidencia geral, dados humanos validos ou cobertura independente;
- `EVOLUCAO_V2_1_BLOQUEADA`: houve falha de integridade, privacidade, protocolo, guardrail ou isolamento.

Nenhuma decisao autoriza rollout publico, release ou substituicao automatica da V2.

## Baseline obrigatoria

Antes de qualquer edicao:

1. Registre branch, HEAD, Node.js, npm, estado do Git e arquivos locais.
2. Confirme que `appono-intelligence-v2` permanece `FROZEN`.
3. Confirme que `deterministico-v3` permanece controle e fallback.
4. Confirme que `appono-intelligence-v1` permanece comparador.
5. Valide hashes de scoring, controle, V1, V2, politica, guardrails, contrato longitudinal, manifesto e relatorios congelados.
6. Confirme `formulas_changed: false`, `reserve_accessed: false` neste marco e rollout publico `0`.
7. Confirme que nao existe resposta humana inventada ou dado real sem consentimento.
8. Nao altere snapshots, metricas, comparacoes, pacote cego, chave ou relatorios historicos.

Se qualquer hash da V2 divergir, pare e produza `EVOLUCAO_V2_1_BLOQUEADA`. Nao regenere a baseline para esconder a divergencia.

## Fase 1 - Escolha de uma hipotese geral

Leia as hipoteses existentes em:

`backend/experiments/routine-intelligence/technical-hypotheses-v1.json`

Escolha no maximo uma hipotese. A escolha deve ser feita antes de criar a implementacao e deve ser registrada com:

- `hypothesis_id` estavel;
- problema geral observado em mais de um contexto;
- mecanismo tecnico verificavel;
- evidencia automatizada anterior;
- contraevidencia;
- risco de overfitting;
- fixture geral independente;
- teste de sucesso;
- teste de abandono;
- guardrails preservados;
- ausencia de dependencia da reserva;
- ausencia de ajuste escolhido para vencer placar;
- necessidade ou nao de nova versao.

Nao escolha hipotese quando:

- ela depende de um unico caso, persona ou cliente;
- a causa foi inferida apenas pelo nome de uma persona;
- exige remover casos desfavoraveis;
- exige alterar filtro eliminatorio, consentimento, causalidade ou privacidade;
- propoe alterar peso, limiar, decaimento ou desempate apenas para melhorar resultado conhecido;
- nao possui fixture geral independente;
- depende de ler ou abrir a reserva.

Se nenhuma hipotese cumprir esses requisitos, encerre com `V2_1_INSUFFICIENTE_AGUARDAR_EVIDENCIA` e nao crie formula V2.1.

## Fase 2 - Protocolo pre-registrado

Antes de escrever o modulo da V2.1, crie:

`backend/experiments/routine-intelligence/v2-1-candidate-protocol-v1.json`

O protocolo deve conter:

- schema e versao do protocolo;
- data, timezone e executor local;
- hipotese escolhida e mecanismo;
- hashes atuais da V2, V1, controle, politica, guardrails e contrato;
- identificador exato `appono-intelligence-v2-1`;
- criterio principal de qualidade;
- criterios comparativos V2.1 x controle, V2.1 x V1 e V2.1 x V2;
- denominador e unidade de analise;
- regras de empate, indeterminado, fallback e falha;
- limiar de confianca `0.25`, salvo justificativa formal de novo protocolo;
- regras de elegibilidade e filtros eliminatorios;
- requisitos de consentimento, causalidade e idempotencia;
- criterio de sucesso em desenvolvimento;
- criterio de congelamento;
- criterio de aceitacao na validacao;
- criterio de abandono;
- criterio de bloqueio;
- politica de dados reais e revisao humana;
- politica de reserva, inicialmente `SEALED_NOT_AUTHORIZED`;
- rollout publico `0` e flag desligada por padrao.

Inclua o hash canonico do protocolo somente depois de serializar a versao final. Nao altere o protocolo depois de iniciar a avaliacao.

## Fase 3 - Implementacao isolada da V2.1

Crie a V2.1 somente em arquivos novos ou explicitamente versionados:

- `backend/src/domain/routine-intelligence-v2-1.js`;
- `backend/test/routine-intelligence-v2-1.test.js`;
- manifesto da candidata;
- adaptador de comparacao, se necessario;
- scripts somente leitura ou de escrita em destinos novos.

A V2.1 deve:

- receber a mesma entrada comum da V2, V1 e controle;
- receber somente candidatos elegiveis;
- manter filtros de seguranca alimentar, funcionamento, disponibilidade, agenda, orcamento e raio;
- preservar neutralidade sem historico;
- usar apenas sinais consentidos, ativos, anteriores e idempotentes;
- preservar o limiar de confianca e o fallback para `deterministico-v3`;
- isolar falha, timeout, baixa confianca e escolha fora do universo;
- produzir diagnostico allowlist-only;
- ser deterministica e independente de relogio real, rede, banco, reserva e ambiente;
- nao modificar o codigo, pesos, limites ou saidas da V2.

Nao crie excecoes por persona, candidato privilegiado, peso escolhido pelo placar ou regra que use agenda, endereco, restricao ou dado medico como preferencia.

## Fase 4 - Testes de desenvolvimento

Teste primeiro apenas no conjunto de desenvolvimento. Nao abra a validacao antes de congelar a candidata.

Use fixtures independentes para comprovar:

- mecanismo da hipotese escolhida;
- elegibilidade antes da personalizacao;
- filtros eliminatorios soberanos;
- entrada comum igual para os quatro comparadores;
- neutralidade sem historico;
- consentimento ausente, revogado e ativo;
- sinal futuro, inativo, duplicado e sem chave idempotente;
- baixa confianca e ausencia de historico;
- falha e timeout com fallback;
- estado isolado por usuario, persona, conjunto e modelo;
- determinismo e ordem de chaves;
- explicacao sem PII, segredo ou sinal individual;
- escolha nativa separada de fallback.

No desenvolvimento, e permitido ajustar a implementacao da V2.1 dentro da hipotese pre-registrada. Toda alteracao deve gerar novo hash e ser feita antes do congelamento. Nao ajuste para cenarios individuais.

Registre separadamente por modelo:

- utilidade e arrependimento;
- diversidade, repeticao e concentracao;
- confianca e volume efetivo;
- falhas e fallbacks;
- escolhas inelegiveis;
- violacoes eliminatorias;
- cobertura por persona, semana, contexto e modo de historico.

O desenvolvimento deve passar todos os guardrails e o criterio da hipotese antes da candidata ser congelada.

## Fase 5 - Congelamento da candidata

Somente se o desenvolvimento passar:

1. Pare edicoes na V2.1.
2. Gere manifesto novo em destino novo.
3. Registre `candidate_version: appono-intelligence-v2-1`.
4. Registre hashes de codigo, protocolo, fixtures e dependencias.
5. Registre `state: FROZEN_FOR_VALIDATION`.
6. Confirme que V2, V1 e controle continuam com hashes originais.
7. Confirme que nao existe material de reserva no pacote.
8. Confirme que rollout publico e allowlist operacional continuam desligados.
9. Recalcule e confira o hash canonico do manifesto.

Depois desse ponto, qualquer alteracao na V2.1 invalida o congelamento e exige nova candidata, novo manifesto e nova validacao. Nao corrija a candidata durante a validacao.

## Fase 6 - Validacao congelada

Execute a V2.1 congelada uma unica vez no conjunto de validacao autorizado. Nao altere o conjunto, nao exclua cenarios e nao reexecute com parametros alternativos para melhorar o resultado.

Compare obrigatoriamente, com os mesmos cenarios e denominadores:

- `appono-intelligence-v2-1` x `deterministico-v3`;
- `appono-intelligence-v2-1` x `appono-intelligence-v1`;
- `appono-intelligence-v2-1` x `appono-intelligence-v2`.

O relatorio deve mostrar:

- medias e deltas do criterio principal;
- resultados por persona, semana e contexto;
- contagens de empate e indeterminado separadas;
- falhas e fallback sem credito nativo;
- confianca e volume efetivo;
- violacoes eliminatorias;
- escolhas inelegiveis;
- regressao de preferencia explicita;
- neutralidade sem historico;
- integridade causal dos sinais.

Regra de aceitacao:

- V2.1 supera o controle no criterio principal;
- V2.1 nao e pior que a V1;
- V2.1 nao introduz regressao eliminatoria;
- todos os guardrails passam;
- nenhum resultado humano ausente e tratado como empate;
- a candidata permanece deterministica e reproduzivel.

Se qualquer criterio de qualidade falhar, registre `V2_1_REPROVADA_MANTER_V2`. Se faltar evidencia ou houver erro de integridade, use `V2_1_INSUFFICIENTE_AGUARDAR_EVIDENCIA` ou `EVOLUCAO_V2_1_BLOQUEADA`, conforme o caso. Nao ajuste a formula depois de abrir a validacao.

## Fase 7 - Revisao humana auxiliar

Se houver necessidade de revisao humana, gere um novo pacote cego somente depois de congelar a V2.1 e antes de abrir a chave:

- contexto completo;
- escolhas nativas A/B;
- nenhum nome de modelo, score ou peso;
- hash do pacote e compromisso da chave;
- formulario vazio;
- 24 casos ou quantidade pre-registrada;
- local de submissao documentado.

Aceite somente respostas completas, reais, pseudonimizadas, sem PII, sem duplicidade, vinculadas ao hash exato do pacote e sem correcao automatica.

Congele o arquivo por hash antes de abrir a chave. Agregue somente estatisticas descritivas por comparador, contexto e classe. Nao declare consenso com um revisor e nao use revisao humana para substituir a validacao longitudinal.

Se nao houver respostas, registre `REVISAO_HUMANA_PENDENTE` e continue sem qualquer resultado humano.

## Fase 8 - Reserva somente depois da validacao

Nao abra a reserva durante desenvolvimento ou antes da validacao congelada.

Somente considere uma nova reserva se todos forem verdadeiros:

- desenvolvimento passou;
- V2.1 esta `FROZEN_FOR_VALIDATION`;
- validacao passou;
- comparacoes contra controle, V1 e V2 estao completas;
- guardrails passaram;
- relatorios foram canonizados;
- nenhuma recalibracao ocorreu depois da validacao;
- revisao humana, se usada, foi congelada e validada;
- novo protocolo de reserva, particao e compromisso foram criados;
- existe autorizacao explicita do responsavel para abrir e executar uma unica vez.

Sem autorizacao explícita, finalize com `V2_1_APROVADA_PARA_INVESTIGACAO_INTERNA` ou `V2_1_REPROVADA_MANTER_V2`, conforme os resultados, mantendo a reserva selada.

Se autorizada, a reserva deve:

- usar novos IDs e particao sem sobreposicao;
- validar compromisso antes da abertura;
- recusar dataset, quantidade e semente arbitrarios;
- abrir uma unica vez;
- registrar falhas completas;
- manter denominadores separados;
- nao permitir qualquer ajuste posterior;
- nao publicar semente, chave ou material privado.

## Fase 9 - Relatorios obrigatorios

Crie somente em destinos novos:

- protocolo da candidata;
- manifesto da V2.1 congelada;
- relatorio de desenvolvimento;
- relatorio de validacao;
- matriz comparativa V2.1/V2/V1/controle;
- manifesto e agregado de revisao humana, quando aplicavel;
- manifesto e relatorios da reserva, somente se autorizada;
- decisao tecnica;
- checkpoint datado.

Todos os artefatos devem conter schema, versao, hashes, denominadores, guardrails, estado de consentimento, limitações, fallback e rollout.

Nao inclua PII, notas livres, identificadores individuais, pesos privados, snapshots completos, chave, semente ou material da reserva.

## Fase 10 - Verificacao obrigatoria

Descubra os scripts reais e execute:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem, sempre respeitando o modo permitido:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Crie comandos especificos de V2.1 somente se necessarios. Eles devem recusar reserva, caminhos arbitrarios, datasets arbitrarios e escrita sobre artefatos congelados.

Rode os testes focados da candidata e do protocolo pelo menos tres vezes. Nao execute a reserva sem autorizacao explícita. Nao execute simulacao historica, Supabase remoto, seed remoto, pagamento, e-mail ou deploy.

## Falhas bloqueantes

Bloqueie imediatamente se ocorrer:

- V2 alterada;
- V2.1 misturada ao codigo da V2;
- hash ou manifesto divergente;
- criterio alterado depois da observacao;
- candidato inelegivel entregue ao modelo;
- filtro eliminatorio enfraquecido;
- baixa confianca sem fallback;
- sinal futuro, revogado, inativo ou sem consentimento usado;
- estado compartilhado entre modelos ou conjuntos;
- fallback contado como escolha nativa;
- PII ou segredo em relatorio;
- validacao reexecutada com parametros oportunistas;
- reserva acessada antes da autorizacao;
- reserva usada para escolher pesos;
- rollout publico diferente de zero.

## Checkpoint final

Crie:

`docs/appono-intelligence-v2-1-candidate-checkpoint.md`

Registre:

1. decisao final;
2. hipotese escolhida e justificativa;
3. branch, HEAD e estado inicial;
4. hashes preservados da V2, V1, controle e politica;
5. hash do protocolo pre-registrado;
6. hash da V2.1 congelada;
7. resultado de desenvolvimento;
8. resultado de validacao;
9. comparacao V2.1 x controle;
10. comparacao V2.1 x V1;
11. comparacao V2.1 x V2;
12. guardrails e filtros;
13. revisao humana e quantidade de revisores;
14. estado dos dados reais consentidos;
15. reserva aberta ou selada;
16. fallback, kill switch e rollout;
17. testes, builds, lint e diff;
18. defeitos e correcoes;
19. arquivos criados ou alterados;
20. confirmacao de que a V2 nao mudou;
21. confirmacao de que nao houve recalibracao apos validacao;
22. riscos residuais;
23. entrada exata para o proximo marco.

## Entrega final

Apresente de forma objetiva:

- qual hipotese foi escolhida e por que e geral;
- qual modulo implementa a V2.1;
- hash do protocolo e da candidata congelada;
- resultado de desenvolvimento;
- resultado de validacao;
- comparacoes contra controle, V1 e V2;
- guardrails e fallback;
- revisao humana, se existente;
- reserva aberta ou nao, com autorizacao registrada;
- testes e verificacoes;
- decisao final;
- limitacoes;
- confirmacao de que a V2 congelada permaneceu intacta.

Nao declare V2.1 pronta para clientes apenas porque passou em desenvolvimento ou validacao. O proximo passo deve ser sempre uma allowlist controlada ou nova reserva autorizada, nunca rollout publico automatico.
