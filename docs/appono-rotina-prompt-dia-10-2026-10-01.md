# Prompt do Dia 10 - Pacote de revisao humana cega da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, pesquisa com usuarios, seguranca e privacidade trabalhando diretamente no projeto Appono. Execute integralmente o marco de **1 de outubro de 2026** do calendario de entrega da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **gerar, validar e congelar um pacote A/B de revisao humana cega**, com casos relevantes, ordem randomizada de forma deterministica, opcoes anonimizadas e formulario reutilizavel, sem revelar modelo, score, confianca, utilidade automatica ou classificacao antes do julgamento.

Nao entregue apenas um plano, uma lista de casos ou pseudocodigo. Inspecione o estado real do repositorio, preserve todos os artefatos congelados, implemente o gerador e os validadores do pacote, produza a chave interna separada, execute testes e crie um checkpoint datado.

Este marco cria o instrumento de revisao. Ele **nao autoriza o agente a preencher julgamentos humanos**, inventar avaliadores, fabricar consenso, interpretar respostas inexistentes, recalibrar a V2 ou executar a reserva.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `01/10/2026`.

Entrega prevista:

> Pacote de revisao humana cega: casos A/B randomizados, sem nome ou peso dos modelos.

O marco somente pode ser encerrado quando estiver comprovado que:

- os casos vieram exclusivamente dos relatorios prospectivos congelados;
- a selecao e reproduzivel e possui criterios pre-registrados;
- a ordem dos casos e a orientacao A/B sao deterministicamente randomizadas;
- a distribuicao A/B nao favorece sistematicamente nenhum modelo;
- o pacote entregue ao revisor nao revela modelo, versao, score, ajuste, confianca, utilidade, arrependimento, classificacao ou prioridade;
- cada alternativa corresponde exatamente a uma escolha nativa elegivel registrada;
- o contexto e suficiente, nao sensivel e metodologicamente honesto sobre trajetorias divergentes;
- existe formulario vazio para `A`, `B`, `EMPATE` ou `INDETERMINADO` e motivo estruturado;
- existe chave interna separada e verificavel por compromisso criptografico;
- a chave interna nao e incluida no diretorio ou arquivo distribuido ao revisor;
- nenhuma resposta humana e preenchida pelo agente;
- nenhuma reserva e acessada e nenhuma formula e alterada;
- rollout publico permanece zero.

## Pre-condicao do Dia 30

Antes de editar, confirme:

- decisao de 30/09 igual a `GUARDRAILS_CONCLUIDOS`;
- checkpoint de 30/09 presente e coerente;
- matriz `routine-intelligence-guardrails-v1` valida;
- hash canonico dos guardrails igual a `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- relatorio `routine-intelligence-guardrail-audit-v1` presente;
- hash canonico do relatorio de guardrails igual a `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`;
- 53 regressoes classificadas;
- 24 casos tecnicos candidatos preparados;
- 1.800 execucoes auditadas;
- zero violacoes eliminatorias;
- controle, V1 e V2 continuam com os hashes congelados;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- suite, builds e lint aprovados no fechamento anterior.

O `HEAD` pode ser o commit que encerrou 30/09 ou um descendente legitimo. Nao atualize hashes ou relatorios para esconder divergencia. Se o Dia 30 ainda nao estiver versionado, preserve integralmente suas alteracoes e identifique o estado sujo antes de prosseguir.

## Estado conhecido a confirmar

Trate os itens abaixo como hipoteses verificaveis:

- branch `main`;
- controle `deterministico-v3`;
- referencia `appono-intelligence-v1`;
- desafiante `appono-intelligence-v2`;
- utilidade externa `persona-utility-v1`;
- guardrails `routine-intelligence-guardrails-v1`;
- desenvolvimento e validacao com 300 cenarios e 900 execucoes cada;
- 24 candidatos tecnicos no relatorio de guardrails;
- maior parte dos casos prioritarios associada a baixa confianca, preferencia explicita, distancia, preco ou contradicao;
- nenhuma resposta humana existente;
- nenhum pacote cego prospectivo final existente;
- alteracoes do Dia 30 podem ainda estar sem commit.

Registre divergencias reais. Nao copie estes valores para o checkpoint sem conferencia.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22 a 30/09;
- prompts dos Dias 1 a 9;
- `docs/appono-rotina-prompt-pre-piloto-intelligence-v2.md`;
- `docs/appono-intelligence-v2-comparativo-2026-09-29.md`;
- `docs/appono-intelligence-v2-guardrails-2026-09-30.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`;
- `backend/experiments/routine-intelligence/guardrails-v1.json`;
- snapshots de desenvolvimento e validacao;
- relatorios brutos, metricas, comparacao e guardrails prospectivos;
- `backend/src/domain/routine-intelligence-personas.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/domain/routine-intelligence-simulation.js`, apenas como referencia historica;
- scripts e testes de simulacao, metricas, guardrails e pacote cego historico.

Este marco nao exige Supabase, banco, autenticacao, migration, pagamento, e-mail, frontend funcional ou servico remoto.

## Regras inegociaveis

1. Preserve todas as alteracoes locais e artefatos congelados.
2. Nao altere controle, V1, V2, utilidade das personas, pesos, limites, decaimento, suavizacao ou desempates.
3. Nao execute simulacao em `--write` nem regenere relatorios de 28, 29 ou 30/09.
4. Nao abra, leia, materialize, reconstrua ou tente inferir a reserva prospectiva.
5. Nao reexecute a reserva historica.
6. Nao use resultados da reserva na selecao de casos.
7. Nao exclua caso apenas porque a V2 perdeu.
8. Nao selecione somente casos favoraveis a um modelo.
9. Nao use `Math.random`, relogio real, ordem do sistema de arquivos ou semente ambiente.
10. Nao mostre nomes ou identificadores de modelos no pacote do revisor.
11. Nao mostre score, ajuste, confianca, amostras, utilidade, arrependimento, delta, guardrail, causa diagnosticada ou prioridade antes da resposta.
12. Nao mostre IDs brutos de candidatos, cenarios, datasets ou relatorios no pacote distribuivel.
13. Nao inclua a chave interna no pacote distribuivel.
14. Nao apresente trajetorias divergentes como se fossem um experimento online com historico identico.
15. Nao use PII, endereco, coordenada exata, agenda, alergia, dado medico, financeiro, credencial ou sinal individual livre.
16. Nao transforme conversao simulada em pedido, reserva, pagamento ou evidencia real.
17. Nao preencha `A`, `B`, `EMPATE`, motivo ou confianca do revisor em nome de uma pessoa.
18. Nao declare consenso quando houver somente um avaliador.
19. Nao habilite rollout publico nem altere sugestoes visiveis ao cliente.
20. Nao faca commit, push, deploy, seed remoto, pagamento, e-mail ou migration remota.

## Escopo permitido

Este marco pode:

- pre-registrar protocolo de amostragem e randomizacao;
- selecionar casos a partir das 53 regressoes e dos 24 candidatos tecnicos;
- ampliar ou rebalancear a lista quando isso seguir regra declarada antes de observar julgamentos;
- reconstruir sequencias anteriores usando somente escolhas ja congeladas nos relatorios brutos;
- distinguir contexto comum de trajetoria contrafactual divergente;
- gerar aliases sinteticos locais para restaurante e produto;
- criar pacote JSON canonico e planilha CSV simples para revisao;
- criar formulario de respostas vazio;
- criar chave interna separada e compromisso SHA-256;
- validar respostas humanas fornecidas posteriormente, sem inventa-las;
- documentar instrucoes para um ou mais revisores;
- preparar agregador puro para o Dia 2/10, sem produzir resultado sem respostas.

Este marco nao pode:

- realizar o julgamento humano;
- usar a propria avaliacao automatica como resposta humana;
- revelar a chave antes do congelamento das respostas;
- diagnosticar V2.1 a partir de respostas inexistentes;
- recalibrar modelo;
- executar reserva;
- integrar V2 ao fluxo real;
- promover modelo ou declarar homologacao.

## Fase 1 - Inventario e integridade

Registre antes da primeira edicao:

- branch, `HEAD` e estado do Git;
- arquivos modificados e nao rastreados;
- versoes de Node.js e npm;
- hashes de formulas, snapshots, brutos, metricas, comparacao e guardrails;
- quantidade de regressoes por conjunto, persona, comparador e classificacao;
- quantidade de candidatos tecnicos unicos;
- existencia de pacote, chave ou respostas anteriores;
- estado das reservas e do rollout.

Separe claramente:

- alteracoes do Dia 30 ainda nao versionadas;
- novo trabalho do Dia 01/10;
- qualquer arquivo preexistente de revisao historica, que nao deve ser sobrescrito.

## Fase 2 - Protocolo pre-registrado

Crie um artefato declarativo novo, por exemplo:

`backend/experiments/routine-intelligence/blind-review-protocol-v1.json`

O protocolo deve ser criado e validado antes de gerar a orientacao A/B final. Registre:

- `schema_version`;
- `protocol_version`;
- data planejada e timezone;
- finalidade sintetica e auxiliar;
- hashes de todas as entradas;
- quantidade alvo de casos;
- regras de inclusao e exclusao;
- regra de estratificacao;
- regra de desempate da selecao;
- metodo de derivacao da semente;
- algoritmo de embaralhamento;
- politica de balanceamento A/B;
- schema do pacote do revisor;
- schema da chave interna;
- schema de respostas;
- motivos estruturados permitidos;
- campos proibidos;
- politica para trajetorias divergentes;
- politica de compromisso da chave;
- ausencia de PII;
- proibicao de reserva;
- estado inicial `REGISTERED_UNJUDGED`.

A semente nao deve ser escolhida manualmente depois de observar a orientacao. Derive-a de material publico e congelado, por exemplo:

```text
SHA-256(
  blind-review-protocol-v1 +
  2026-10-01 +
  guardrails_report_canonical_sha256 +
  comparison_canonical_sha256
)
```

Registre o hash completo usado. A derivacao deve ser independente de resultado humano e da reserva.

## Fase 3 - Estrategia de amostragem

Produza exatamente 24 casos, salvo impossibilidade objetiva demonstrada pelos dados. A selecao deve seguir regras declaradas e deterministicamente ordenadas.

Requisitos:

- somente divergencias com escolhas nativas distintas e alternativas elegiveis;
- nenhuma escolha de fallback;
- nenhum erro tecnico;
- nenhum cenario duplicado no pacote principal;
- validacao deve ser a fonte primaria e possuir pelo menos metade dos casos;
- desenvolvimento pode complementar cobertura e casos de fronteira;
- incluir a maior regressao elegivel de cada classificacao com ocorrencia;
- incluir controle versus V2 e V1 versus V2 quando disponiveis;
- limitar concentracao por persona quando existirem alternativas equivalentes;
- cobrir o maior numero possivel de personas e semanas;
- representar baixa confianca, preferencia explicita, distancia, preco, contradicao e hipoteses sem causa fechada;
- registrar casos excluidos e o motivo tecnico, sem usar qualidade favoravel como criterio.

Se os 24 candidatos preselecionados de 30/09 nao satisfizerem a matriz, e permitido selecionar outros entre as 53 regressoes, desde que a regra seja geral, registrada e testada. Nao altere o relatorio de guardrails.

O pacote nao precisa ser estatisticamente representativo da populacao. Documente que e uma amostra intencional de desacordos para diagnostico.

## Fase 4 - Trajetorias e contexto justo

A simulacao prospectiva possui ramificacoes por modelo. Depois da primeira divergencia, as sequencias anteriores podem ser diferentes.

Para cada caso, determine um destes modos:

- `SHARED_HISTORY`: as escolhas anteriores relevantes das duas ramificacoes sao equivalentes;
- `TRAJECTORY_OUTCOME`: as ramificacoes possuem historicos diferentes e o revisor compara dois resultados de trajetoria, nao duas opcoes sob historico identico.

Reconstrua sequencias usando apenas decisoes anteriores congeladas, ordenadas por persona, semana e indice. Nao execute modelos novamente.

No pacote do revisor:

- contexto comum deve aparecer uma vez;
- historico compartilhado pode aparecer como sequencia recente unica;
- em `TRAJECTORY_OUTCOME`, cada lado deve receber sua propria sequencia recente anonima;
- nao revele que lado pertence a qual modelo;
- deixe claro nas instrucoes que alguns pares representam trajetorias completas;
- nao descreva o pacote como teste A/B online randomizado.

## Fase 5 - Conteudo permitido do caso

Cada caso do pacote distribuivel pode conter somente:

- `blind_case_id` novo e estavel;
- numero de exibicao embaralhado;
- modo de comparacao;
- perfil comportamental sintetico, sem usar ID interno da persona;
- objetivo comportamental resumido;
- preferencias explicitas relevantes;
- aversoes gastronomicas nao medicas relevantes;
- janela alimentar e dia virtual;
- faixa de orcamento;
- faixa aproximada de distancia;
- sequencia recente anonimizada, quando aplicavel;
- `option_a` e `option_b`;
- justificativas neutras derivadas dos mesmos campos para ambos os lados;
- campos vazios de resposta.

Cada opcao pode conter:

- alias local de restaurante, como `Restaurante A1`;
- alias local de produto, como `Opcao A1`;
- categoria;
- faixa de preco ou preco sintetico arredondado;
- distancia aproximada em faixa;
- disponibilidade e funcionamento apenas como confirmacao de elegibilidade;
- relacao neutra com preferencia explicita;
- indicacao neutra de novidade ou repeticao na sequencia mostrada.

Nao inclua avaliacao automatica da opcao.

## Fase 6 - Campos proibidos no pacote do revisor

Rejeite qualquer pacote distribuivel que contenha, em chave ou valor:

- `deterministico-v3`;
- `appono-intelligence-v1`;
- `appono-intelligence-v2`;
- `controle`, `V1`, `V2`, `modelo` ou `challenger` usados para identificar origem;
- score base, ajuste ou score total;
- confianca, amostras, volume efetivo ou consistencia do modelo;
- utilidade, melhor utilidade, arrependimento ou delta;
- classificacao da regressao, guardrail ou prioridade;
- ID bruto de candidato, cenario, dataset ou estado;
- hash de entrada que permita cruzamento simples com relatorios;
- nome real, e-mail, telefone, endereco, coordenada, agenda, dado medico ou financeiro;
- sinal individual completo;
- semente ou material da reserva;
- chave de resposta ou compromisso aberto.

Use lista permitida de campos. Nao dependa somente de remover chaves conhecidas ao final.

## Fase 7 - Randomizacao e balanceamento A/B

Implemente randomizacao deterministica e auditavel.

Requisitos:

- embaralhe a ordem dos 24 casos com PRNG derivado da semente registrada;
- randomize qual alternativa aparece como A ou B;
- mantenha diferenca maxima de uma unidade entre o numero de aparicoes de cada origem em A quando o total do estrato for impar;
- equilibre dentro de comparador e conjunto quando houver casos suficientes;
- nao use alternancia simples previsivel;
- orientacao nao pode depender de vencedor, utilidade ou prioridade;
- repetir a geracao produz exatamente os mesmos bytes;
- mudar a semente muda ordem ou orientacao;
- ordem de entrada dos relatorios nao muda o pacote;
- A e B devem ser semanticamente distintos;
- aliases nao podem revelar a orientacao original.

O pacote pode registrar apenas a versao do algoritmo de randomizacao e o compromisso da chave. A semente publica pertence ao protocolo, nao ao formulario entregue ao avaliador se isso facilitar inferencia manual da chave.

## Fase 8 - Chave interna e compromisso

Crie uma chave interna separada, por exemplo:

`backend/reports/routine-intelligence/prospective/internal/blind-review-key-v1.json`

A chave pode conter:

- `blind_case_id`;
- origem tecnica de A e B;
- IDs sinteticos internos das escolhas;
- conjunto e cenario de origem;
- comparador usado;
- classificacao e delta congelados;
- hash do contexto e das opcoes;
- hash da entrada original;
- versoes e hashes das fontes.

Crie compromisso SHA-256 canonico da chave e registre-o no protocolo e no pacote. A chave nao deve conter resposta humana.

O artefato distribuivel deve ficar em diretorio separado, por exemplo:

`backend/reports/routine-intelligence/prospective/blind-review-v1/`

Esse diretorio deve conter somente arquivos seguros para o revisor. Adicione teste que falhe se a chave interna aparecer nele ou se o manifesto distribuivel referenciar seu caminho.

## Fase 9 - Formulario reutilizavel

Gere:

- JSON canonico de revisao;
- CSV UTF-8 simples para preenchimento manual;
- template de respostas JSON vazio;
- instrucoes Markdown para o revisor.

Campos de resposta permitidos:

- `blind_case_id`;
- `reviewer_code`, pseudonimo local sem e-mail;
- `choice`: `A`, `B`, `EMPATE` ou `INDETERMINADO`;
- `reason_codes`: lista de motivos permitidos;
- `review_confidence`: `BAIXA`, `MEDIA` ou `ALTA`, referente ao julgamento humano;
- `optional_note`: opcional, limitada e sanitizada.

Motivos estruturados sugeridos:

- `PREFERENCIA_EXPLICITA`;
- `PRECO`;
- `DISTANCIA`;
- `FAVORITO`;
- `VARIEDADE`;
- `REPETICAO`;
- `NOVIDADE`;
- `COERENCIA_COM_SEQUENCIA`;
- `AMBAS_ACEITAVEIS`;
- `NENHUMA_ACEITAVEL`;
- `CONTEXTO_INSUFICIENTE`;
- `OUTRO`.

O template deve iniciar com respostas vazias. Nao use o agente como `reviewer_code` e nao escolha respostas automaticamente.

## Fase 10 - Instrucoes ao revisor

As instrucoes devem explicar:

- objetivo auxiliar e sintetico da revisao;
- que A e B foram randomizados;
- que nao existe opcao considerada correta no formulario;
- diferenca entre `EMPATE` e `INDETERMINADO`;
- como considerar preferencia, preco, distancia, variedade e repeticao;
- que filtros eliminatorios ja foram aplicados;
- que alguns casos comparam trajetorias com sequencias anteriores diferentes;
- que o revisor nao deve procurar a chave interna ou os relatorios tecnicos;
- que notas nao devem conter dados pessoais;
- que um unico revisor gera evidencia auxiliar, nao consenso;
- que o julgamento nao valida clientes reais.

Nao mencione qual modelo e controle, referencia ou desafiante nas instrucoes distribuiveis.

## Fase 11 - Validador de respostas

Implemente um validador puro que possa ser usado quando uma pessoa devolver respostas.

Ele deve rejeitar:

- caso desconhecido ou duplicado;
- resposta ausente fora de rascunho;
- escolha fora do enum;
- motivo desconhecido;
- nota acima do limite;
- nota com e-mail, telefone, endereco, token ou dado medico;
- chave interna misturada ao formulario;
- resposta para opcao inexistente;
- alteracao do contexto ou das opcoes;
- hash de pacote diferente;
- mais de uma resposta do mesmo revisor para o mesmo caso.

Ele pode calcular completude e distribuicao de respostas, mas nao deve abrir a chave ou declarar vencedor neste marco.

## Fase 12 - Agregador preparado, nao executado

Prepare, se util, uma funcao pura para o Dia 02/10 que, somente depois de respostas congeladas e abertura explicita da chave, calcule:

- preferencias por origem tecnica;
- empates e indeterminados;
- resultado por persona, classificacao e modo de trajetoria;
- consistencia por revisor quando houver casos repetidos;
- intervalos ou contagens descritivas simples;
- quantidade de revisores;
- limitacao de revisor unico.

Hoje essa funcao deve permanecer sem resultado real. Teste-a apenas com fixtures pequenas e claramente artificiais.

## Fase 13 - Modulos e arquivos recomendados

Siga convencoes locais. Estrutura recomendada:

- `backend/experiments/routine-intelligence/blind-review-protocol-v1.json`;
- `backend/src/domain/routine-intelligence-blind-review.js`;
- `backend/scripts/generate-routine-intelligence-blind-review.js`;
- `backend/test/routine-intelligence-blind-review.test.js`;
- `backend/reports/routine-intelligence/prospective/blind-review-v1/package.json`;
- `backend/reports/routine-intelligence/prospective/blind-review-v1/review-form.csv`;
- `backend/reports/routine-intelligence/prospective/blind-review-v1/responses-template.json`;
- `backend/reports/routine-intelligence/prospective/blind-review-v1/README.md`;
- `backend/reports/routine-intelligence/prospective/internal/blind-review-key-v1.json`;
- `docs/appono-intelligence-v2-checkpoint-2026-10-01.md`.

O nome exato pode seguir convencao melhor, mas mantenha separacao entre protocolo, dominio puro, pacote distribuivel, respostas e chave interna.

## Fase 14 - CLI de geracao

Crie um comando local, por exemplo:

`generate:rotina:blind-review`

A CLI deve:

- aceitar `--check` ou `--write`, exatamente um;
- recusar qualquer argumento contendo `reserva`;
- validar hashes antes de gerar;
- usar apenas caminhos fixos;
- oferecer `--help` sem escrita;
- gerar pacote, CSV, template, instrucoes e chave de forma atomica;
- impedir sobrescrita incompativel;
- comparar bytes em `--check`;
- imprimir somente resumo agregado seguro;
- retornar codigo diferente de zero em falha;
- nao ler `.env`;
- nao executar modelos;
- nao abrir chave para o revisor.

Resumo permitido:

- versao do protocolo;
- casos selecionados;
- distribuicao por conjunto, modo de comparacao e perfil anonimo;
- contagem A/B agregada sem revelar casos;
- hashes do pacote e compromisso da chave;
- respostas preenchidas: zero;
- reserva acessada: falso;
- modelos executados: zero.

## Fase 15 - Testes obrigatorios

Adicione testes para comprovar:

- protocolo possui schema estrito e hashes corretos;
- exatamente 24 casos sao selecionados, salvo bloqueio documentado;
- casos sao unicos e pertencem as entradas congeladas;
- validacao possui ao menos metade da amostra;
- criterios de estratificacao sao cumpridos;
- selecao independe da ordem de entrada;
- cada par possui duas escolhas nativas distintas e elegiveis;
- nenhum fallback ou erro entra no pacote;
- ordem dos casos e deterministica;
- orientacao A/B e deterministica e balanceada;
- mudanca de semente altera ordem ou orientacao;
- pacote e reproduzivel byte a byte;
- aliases sao locais ao caso e nao revelam IDs internos;
- contexto e derivado sem alterar fatos sinteticos;
- trajetorias divergentes recebem modo correto;
- sequencias usam somente decisoes anteriores;
- nenhum evento futuro aparece no contexto;
- pacote distribuivel nao contem nome ou versao de modelo;
- pacote distribuivel nao contem score, ajuste, confianca, utilidade, arrependimento, delta, classificacao ou prioridade;
- pacote distribuivel nao contem IDs brutos nem chave interna;
- pacote distribuivel nao contem PII, segredo, dado medico, agenda ou material de reserva;
- justificativas sao simetricas e neutras;
- template de respostas inicia vazio;
- escolhas e motivos aceitos possuem enum fechado;
- resposta invalida, duplicada ou alterada e rejeitada;
- compromisso da chave corresponde ao artefato interno;
- alterar uma orientacao muda o compromisso;
- diretorio distribuivel possui somente arquivos permitidos;
- `--help` e `--check` nao escrevem;
- tentativa de reserva falha;
- nenhum modelo e importado ou executado;
- formulas, snapshots, brutos, metricas e guardrails preservam hashes;
- rollout publico permanece zero.

## Fase 16 - Testes de mutacao e cegamento

Garanta falha explicita quando:

- um nome de modelo aparece em chave ou valor distribuivel;
- um campo proibido aparece com grafia alternativa;
- A ou B usa candidato inelegivel;
- A e B apontam para a mesma escolha;
- caso aparece duas vezes;
- orientacao nao corresponde a chave;
- ordem nao corresponde a semente;
- balanceamento excede a margem declarada;
- contexto mistura futuro ou outra persona;
- modo `SHARED_HISTORY` e usado com sequencias diferentes;
- modo `TRAJECTORY_OUTCOME` omite sequencia lateral necessaria;
- alias permite recuperar diretamente o ID original;
- pacote contem classificacao, delta ou motivo de inclusao;
- formulario ja vem preenchido;
- chave aparece no manifesto distribuivel;
- compromisso nao confere;
- hash de entrada diverge;
- destino aponta para relatorio historico;
- argumento tenta alterar quantidade, semente ou criterio congelado;
- tentativa de acessar reserva ocorre.

Mensagens devem usar codigos tecnicos seguros e nao imprimir chave, relatorio completo ou material sensivel.

## Fase 17 - Auditoria estatica

Varra todos os artefatos distribuiveis procurando:

- nomes e identificadores dos modelos;
- `model`, `modelo`, `control`, `controle`, `challenger`, `V1` ou `V2` em contexto revelador;
- score, adjustment, confidence, samples, volume, consistency;
- utility, regret, delta, winner, classification, guardrail, priority;
- scenario ID, dataset ID, candidate ID, state hash;
- e-mail, telefone, endereco, coordenada exata, JWT, access token, refresh token, `service_role`, senha;
- alergia, condicao medica ou agenda;
- sinais individuais completos;
- seed ou sal da reserva;
- caminho da chave interna.

Analise falsos positivos individualmente. Nao use exclusao ampla para fazer a auditoria passar.

## Fase 18 - Ordem de execucao

Siga esta ordem:

1. valide pre-condicoes e hashes;
2. inventarie os 53 casos e os 24 candidatos tecnicos;
3. congele o protocolo e a derivacao de semente;
4. implemente selecao e estratificacao;
5. reconstrua sequencias anteriores sem executar modelos;
6. implemente randomizacao e balanceamento;
7. gere chave interna e compromisso;
8. gere pacote distribuivel e templates;
9. execute auditoria de cegamento antes de qualquer exposicao;
10. execute testes focados pelo menos tres vezes;
11. execute CLI em `--write` uma unica vez nos destinos novos;
12. execute CLI em `--check` e confirme igualdade byte a byte;
13. execute suite, builds, lint e `git diff --check`;
14. produza checkpoint e atualize somente 01/10 no calendario.

Nao solicite julgamento humano antes de o pacote passar integralmente pela auditoria de cegamento.

## Fase 19 - Verificacao obrigatoria

Descubra os comandos reais antes de executar. Rode os equivalentes a:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem:

```text
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run evaluate:rotina:longitudinal --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Depois de implementar a CLI, execute os equivalentes reais a:

```text
npm.cmd run generate:rotina:blind-review --workspace backend -- --write
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
```

Rode os testes focados do pacote pelo menos tres vezes para detectar flakiness.

Nao execute:

- simulacao longitudinal em `--write`;
- simulacao historica;
- reserva historica ou prospectiva;
- avaliacao comparativa com alteracao de saida;
- script remoto;
- Supabase remoto;
- seed, pagamento, e-mail, migration ou deploy.

## Fase 20 - Documentacao do Dia 01/10

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-01.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e real;
3. confirmacao de encerramento do Dia 30;
4. `HEAD` e estado inicial do Git;
5. hashes preservados;
6. versao e hash do protocolo cego;
7. derivacao da semente;
8. criterios de amostragem;
9. distribuicao por conjunto, persona, semana, classificacao interna e comparador;
10. tratamento de trajetorias divergentes;
11. algoritmo de ordem e orientacao A/B;
12. prova de balanceamento;
13. schema do pacote do revisor;
14. campos proibidos e auditoria de cegamento;
15. hash do pacote;
16. compromisso da chave interna;
17. formato do formulario e motivos estruturados;
18. instrucoes ao revisor;
19. confirmacao de respostas humanas igual a zero;
20. arquivos criados ou alterados;
21. comandos e resultados;
22. confirmacao de que formulas nao mudaram;
23. confirmacao de que nenhuma reserva foi acessada;
24. confirmacao de rollout publico zero;
25. limitacoes, principalmente vies de amostra intencional e eventual revisor unico;
26. itens preparados para 02/10;
27. entrada exata do proximo marco.

Atualize o calendario somente depois de cumprir todos os criterios. Marque apenas 01/10 como concluido. Nao marque julgamento humano, V2.1, reserva, homologacao ou release como concluidos.

## Criterios de encerramento de 01/10

O marco esta concluido somente quando:

- Dia 30 continuar aprovado e verificavel;
- protocolo de revisao estiver pre-registrado;
- pacote possuir 24 casos unicos ou bloqueio objetivo documentado;
- amostra cobrir conjuntos, personas, semanas e causas sem concentracao evitavel;
- alternativas forem escolhas nativas elegiveis e distintas;
- contexto temporal estiver correto;
- trajetorias divergentes estiverem identificadas sem revelar modelos;
- ordem e orientacao A/B forem deterministicamente randomizadas;
- orientacao estiver balanceada;
- pacote distribuivel passar por lista permitida e auditoria estatica;
- nenhum identificador de modelo, score, confianca, utilidade ou resultado automatico aparecer antes do julgamento;
- chave interna estiver separada e comprometida por hash;
- pacote JSON e CSV forem reproduziveis;
- template de respostas estiver vazio;
- validador de respostas estiver testado;
- nenhuma resposta humana for inventada;
- testes focados passarem tres vezes;
- suite, builds, lint e `git diff --check` passarem;
- artefatos anteriores e formulas permanecerem intactos;
- reserva prospectiva continuar selada;
- rollout publico permanecer zero;
- checkpoint estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisao permitida hoje

Use uma destas decisoes:

- `PACOTE_CEGO_CONCLUIDO`: protocolo, randomizacao, cegamento, chave e formulario estao completos e reproduziveis;
- `PACOTE_CEGO_CONCLUIDO_COM_RESSALVAS`: pacote utilizavel, mas cobertura ou disponibilidade de revisores possui limitacao documentada;
- `PACOTE_CEGO_PARCIAL`: pacote existe, mas falta cegamento, balanceamento, chave, formulario ou reproducibilidade;
- `PACOTE_CEGO_BLOQUEADO`: nao e possivel formar pares honestos ou ocultar a origem sem violar integridade.

Nao use `REVISAO_HUMANA_CONCLUIDA` sem respostas realmente fornecidas por uma pessoa. Nao declare `IA_PRONTA_EM_HOMOLOGACAO`, nao aprove V2.1 e nao promova a V2.

## Aceleracao segura

Depois de concluir 01/10, pode ficar marcado como `PREPARADO` para 02/10:

- validador de respostas;
- abertura verificavel da chave;
- agregador puro;
- tabelas por persona e causa;
- regra para revisor unico;
- criterios para aceitar ou rejeitar hipotese de V2.1;
- template da decisao tecnica.

Nao pode ficar marcado como concluido:

- respostas humanas;
- preferencia agregada real;
- diagnostico final;
- V2.1;
- congelamento de candidata;
- reserva;
- integracao real;
- homologacao ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do dia;
2. confirmacao de que nada ficou pendente no Dia 30;
3. arquivos criados ou alterados;
4. versao e hash do protocolo cego;
5. regra de amostragem e distribuicao dos 24 casos;
6. tratamento de contexto comum e trajetorias divergentes;
7. derivacao da semente;
8. prova de randomizacao e balanceamento A/B;
9. campos presentes e proibidos no pacote;
10. hash do pacote distribuivel;
11. compromisso e separacao da chave interna;
12. formatos JSON, CSV e template de respostas;
13. resultado da auditoria de cegamento;
14. confirmacao de que respostas humanas permanecem vazias;
15. testes, builds, lint e diff;
16. hashes anteriores preservados;
17. confirmacao de que nenhum modelo foi executado ou recalibrado;
18. confirmacao de que nenhuma reserva foi acessada;
19. confirmacao de rollout publico zero;
20. limitacoes metodologicas;
21. instrucoes objetivas para entregar o pacote ao revisor;
22. trabalho preparado para 02/10;
23. entrada exata do proximo marco: validar respostas humanas reais, abrir a chave somente depois do congelamento e decidir se existe hipotese geral suficiente para V2.1.

Nao confunda randomizacao de apresentacao com experimento online, pacote cego com resultado humano, opiniao de um revisor com consenso ou preferencia humana sintetica com validacao comercial. O objetivo de 01/10 e permitir uma avaliacao honesta sem deixar que nomes, scores ou resultados automaticos influenciem o julgamento.
