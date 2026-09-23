# Prompt do Dia 11 - Primeira decisao tecnica da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, pesquisa com usuarios, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **2 de outubro de 2026** do calendario de entrega da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **tomar e registrar a primeira decisao tecnica sobre a candidata**, escolhendo de forma reproduzivel entre aceitar hipoteses gerais para uma futura V2.1 ou manter a V2 atual sem ajuste. A decisao deve combinar as evidencias automatizadas congeladas, os guardrails e, somente quando existirem respostas realmente fornecidas por pessoas, a revisao humana cega.

Nao entregue apenas analise, opiniao ou plano. Inspecione o repositorio, valide as pre-condicoes, implemente os contratos de ingestao e decisao que faltarem, processe respostas humanas reais quando existirem, produza um artefato versionado de decisao e crie um checkpoint datado.

Este marco **nao autoriza o agente a responder ao formulario**, inventar revisores, completar lacunas humanas, ajustar pesos, implementar V2.1, reexecutar modelos, abrir reserva ou promover a V2. Uma hipotese aceita hoje e autorizacao para investigacao controlada nos proximos marcos, nao aprovacao antecipada de uma nova formula.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `02/10/2026`.

Entrega prevista:

> Primeira decisao tecnica: hipoteses de V2.1 aceitas ou V2 mantida sem ajuste.

O marco somente pode ser encerrado quando estiver comprovado que:

- todas as evidencias usadas pertencem aos artefatos congelados de 22/09 a 01/10;
- a integridade do pacote cego e da chave interna foi confirmada;
- respostas humanas somente foram usadas se realmente fornecidas e completas;
- respostas foram congeladas antes de qualquer abertura ou agregacao da chave;
- ausencia de respostas nao foi convertida em empate, abstencao, preferencia ou consenso;
- resultados humanos, quando existentes, foram descritos como evidencia auxiliar;
- regressoes automatizadas foram separadas de violacoes de guardrail;
- cada hipotese aceita possui mecanismo geral, evidencia reproduzivel, risco e teste futuro;
- nenhuma hipotese foi aceita apenas para melhorar um placar conhecido;
- a decisao nao altera controle, V1, V2, utilidade, pesos, limites ou desempates;
- a reserva prospectiva permaneceu selada;
- rollout publico permaneceu zero;
- existe entrada objetiva para os dias 03, 04 e 05/10.

## Dependencia humana obrigatoria

Antes de executar, procure por um arquivo de respostas submetidas em local explicitamente documentado, por exemplo:

`backend/reports/routine-intelligence/prospective/blind-review-v1/responses-submitted.json`

Existem dois fluxos validos:

### Fluxo A - Respostas humanas reais presentes

Use este fluxo somente quando o arquivo:

- tiver sido preenchido por uma pessoa identificada por pseudonimo local;
- declarar o hash exato do pacote revisado;
- contiver as 24 respostas completas;
- passar pelo validador sem correcao automatica;
- nao tiver sido criado ou preenchido pelo agente;
- nao contiver PII, segredo ou alteracao do contexto e das opcoes.

Nesse fluxo, congele o arquivo por hash antes de consultar a chave interna. Depois valide o compromisso da chave, agregue as respostas e registre as limitacoes da amostra e da quantidade de revisores.

### Fluxo B - Respostas humanas ausentes ou incompletas

Nao bloqueie automaticamente toda a decisao tecnica. Registre o estado como `REVISAO_HUMANA_PENDENTE` ou `REVISAO_HUMANA_INCOMPLETA` e tome a decisao somente a partir das evidencias automatizadas e criterios ja congelados.

Nesse fluxo:

- nao preencha respostas;
- nao transforme campos vazios em `EMPATE` ou `INDETERMINADO`;
- nao use a chave interna para produzir preferencia humana;
- nao declare resultado, maioria, consenso ou taxa de preferencia humana;
- nao adie uma decisao conservadora quando a evidencia automatizada for suficiente para manter a V2 sem ajuste;
- nao aceite hipotese como se tivesse sido corroborada por pessoas;
- mantenha aberta a revisao humana como evidencia auxiliar posterior.

A revisao humana e auxiliar. Sua ausencia impede conclusoes humanas, mas nao obriga criar V2.1 nem impede a decisao conservadora `MANTER_V2_SEM_AJUSTE`.

## Pre-condicao do Dia 01

Antes de editar, confirme:

- decisao de 01/10 igual a `PACOTE_CEGO_CONCLUIDO`;
- checkpoint de 01/10 presente e coerente;
- `HEAD` igual a `4d8600b` ou descendente legitimo;
- arvore de trabalho limpa ou alteracoes locais identificadas e preservadas;
- protocolo cego `routine-blind-review-v1` valido;
- hash canonico do protocolo igual a `6f2753bb307712ae86203085d7e1fb71bee69eb456535e8affd420a1aabfb6ae`;
- 24 casos unicos no pacote;
- pacote com hash de conteudo `15783281156afc526a2a5c5dbf8361ceba510bf93db7d73384fd30bbbd26b668`;
- compromisso da chave igual a `1313c2dee80fc64028f430bb1c60df17316757e776c9c7d0670c68770e4c325a`;
- formulario original com zero respostas preenchidas;
- chave interna fora do diretorio distribuivel;
- 14 casos de validacao e 10 de desenvolvimento;
- 18 casos `SHARED_HISTORY` e 6 `TRAJECTORY_OUTCOME`;
- orientacao da V2 equilibrada, 12 vezes em A e 12 em B;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a zero;
- suite backend com 274 testes aprovados no fechamento anterior;
- builds e lint aprovados.

Se uma pre-condicao falhar, interrompa a decisao, investigue e documente. Nao regenere o pacote, a chave, os relatorios ou os hashes para esconder divergencia.

## Evidencias congeladas a confirmar

Trate os valores abaixo como hipoteses verificaveis, nao como texto para copiar sem conferencia:

- controle: `deterministico-v3`;
- referencia: `appono-intelligence-v1`;
- desafiante: `appono-intelligence-v2`;
- utilidade externa: `persona-utility-v1`;
- metricas: `routine-longitudinal-metrics-v1`;
- guardrails: `routine-intelligence-guardrails-v1`;
- protocolo cego: `routine-blind-review-v1`;
- 300 cenarios e 900 execucoes por conjunto;
- 1.800 execucoes prospectivas totais;
- zero falhas, fallbacks, escolhas inelegiveis e violacoes eliminatorias;
- arrependimento medio de validacao do controle: `5.372953`;
- arrependimento medio de validacao da V1: `4.263973`;
- arrependimento medio de validacao da V2: `4.926099`;
- V2 menos controle: `-0.446854`, favoravel a V2;
- V2 menos V1: `+0.662126`, desfavoravel a V2;
- criterio `v2_regret_not_worse_than_v1`: `FAIL`;
- V2 com confianca maior ou igual a `0.25`: `102/300`;
- 53 regressoes classificadas;
- 24 casos candidatos a revisao cega;
- zero respostas humanas no encerramento de 01/10.

Hashes esperados:

- guardrails canonicos: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- auditoria de guardrails: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`;
- comparacao: `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a`;
- metricas de desenvolvimento: `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3`;
- metricas de validacao: `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa`;
- relatorio bruto de desenvolvimento: `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`;
- relatorio bruto de validacao: `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`;
- snapshot de desenvolvimento: `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69c`;
- snapshot de validacao: `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6`;
- personas: `dea25c57dd68942582dcf9de062fbb93c6208ec9b5245a73aed8a7ceb6290474`;
- particoes: `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`.

## Leitura obrigatoria

Antes de editar, leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 01/10;
- prompts dos Dias 1 a 10;
- `docs/appono-intelligence-v2-comparativo-2026-09-29.md`;
- `docs/appono-intelligence-v2-guardrails-2026-09-30.md`;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/personas-v1.json`;
- `backend/experiments/routine-intelligence/partitions-v1.json`;
- `backend/experiments/routine-intelligence/longitudinal-protocol-v1.json`;
- `backend/experiments/routine-intelligence/guardrails-v1.json`;
- `backend/experiments/routine-intelligence/blind-review-protocol-v1.json`;
- relatorios brutos, metricas, comparacao e guardrails prospectivos;
- todos os arquivos do pacote distribuivel de revisao;
- chave interna, somente depois de determinar o estado das respostas e conforme o fluxo permitido;
- `backend/src/domain/routine-intelligence-blind-review.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/domain/routine-intelligence-longitudinal-metrics.js`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- controle, V1 e V2 apenas para verificar hashes e contratos;
- scripts e testes de geracao cega, guardrails, metricas e simulacao.

Este marco nao exige Supabase, banco, autenticacao, migration, pagamento, e-mail, frontend funcional ou servico remoto.

## Regras inegociaveis

1. Preserve todas as alteracoes locais e todos os artefatos congelados.
2. Nao altere controle, V1, V2, utilidade das personas, pesos, limites, decaimento, suavizacao ou desempates.
3. Nao implemente V2.1 hoje.
4. Nao execute modelos nem simulacao em modo de escrita.
5. Nao regenere pacote, chave, snapshots, relatorios brutos, metricas, comparacao ou guardrails.
6. E permitido usar CLIs anteriores apenas em `--check`.
7. Nao abra ou use respostas antes de congelar seu hash.
8. Nao use a chave interna para inferir respostas ausentes.
9. Nao aceite resposta produzida pelo agente, por fixture ou por avaliacao automatica como resposta humana.
10. Nao use reserva historica ou prospectiva.
11. Nao consulte resultados de reserva nem tente reconstruir sua semente.
12. Nao exclua casos desfavoraveis ou reclassifique respostas.
13. Nao transforme um unico revisor em consenso.
14. Nao trate revisao cega como validacao comercial.
15. Nao aceite hipotese que altere filtro eliminatorio, consentimento, privacidade ou causalidade.
16. Nao ajuste limiar `0.25` com base nos resultados observados.
17. Nao mude criterio de aceitacao depois de abrir respostas.
18. Nao habilite rollout publico nem sugestoes visiveis ao cliente.
19. Nao declare IA pronta, candidata congelada, homologacao ou release.
20. Nao faca commit, push, deploy, seed remoto, pagamento, e-mail ou migration remota.

## Escopo permitido

Este marco pode:

- validar e congelar respostas humanas reais;
- comprovar o compromisso da chave;
- agregar respostas cegas de forma descritiva;
- registrar quantidade de revisores e limitacoes;
- consolidar evidencias automatizadas e humanas sem misturar denominadores;
- definir criterios executaveis para aceitar ou rejeitar hipoteses;
- criar registro versionado de hipoteses;
- decidir manter a V2 sem ajuste;
- aceitar hipoteses gerais para futura V2.1, sem implementa-las;
- preparar fixtures e plano de verificacao para os dias 03 a 05/10;
- produzir relatorio e checkpoint da decisao.

Este marco nao pode:

- inventar respostas;
- editar resposta humana para faze-la passar;
- implementar nova formula;
- executar nova simulacao de qualidade;
- promover V2 ou V2.1;
- abrir reserva;
- integrar modelo ao fluxo real;
- ativar homologacao ou rollout.

## Fase 1 - Inventario e integridade

Registre antes da primeira edicao:

- branch, `HEAD` e estado do Git;
- arquivos modificados e nao rastreados;
- versoes de Node.js e npm;
- hashes de formulas, protocolos, snapshots, relatorios, pacote e chave;
- estado do formulario original;
- existencia ou ausencia de respostas submetidas;
- quantidade de revisores declarados;
- estado das reservas;
- estado das feature flags e rollout.

Separe claramente:

- evidencia automatizada congelada;
- pacote cego distribuido;
- resposta humana submetida;
- chave interna;
- decisao tecnica derivada;
- trabalho futuro ainda nao autorizado.

## Fase 2 - Protocolo de decisao pre-registrado

Antes de abrir respostas humanas, crie um artefato declarativo, por exemplo:

`backend/experiments/routine-intelligence/technical-decision-protocol-v1.json`

Registre:

- `schema_version`;
- `decision_protocol_version`;
- data planejada e timezone;
- hashes de todas as entradas permitidas;
- estados validos da revisao humana;
- ordem de avaliacao das evidencias;
- criterios de aceitacao de hipotese;
- criterios de rejeicao;
- politica para ausencia de respostas;
- politica para revisor unico;
- politica para conflitos entre evidencia automatizada e humana;
- decisoes finais permitidas;
- proibicao de alterar formula;
- proibicao de reserva;
- rollout publico zero;
- ausencia de PII.

O protocolo nao deve conter resultado humano, hipotese aceita, decisao final ou identificador que revele respostas antes de seu congelamento.

## Fase 3 - Ingestao de respostas humanas

Se `responses-submitted.json` existir:

1. leia-o sem modificar;
2. calcule o SHA-256 do arquivo bruto;
3. valide o hash do pacote referenciado;
4. valide `reviewer_code` pseudonimo;
5. valide os 24 IDs, sem duplicidade;
6. valide escolha, motivos, confianca e nota;
7. confirme que contexto e opcoes nao foram copiados ou alterados no arquivo de resposta;
8. confirme ausencia de PII e segredos;
9. confirme que nao ha chave, modelo, score ou resultado automatico;
10. grave somente um manifesto de recebimento com o hash congelado.

Nao corrija resposta invalida. Produza erro seguro e solicite nova submissao humana fora deste marco.

Estrutura recomendada para o manifesto:

`backend/reports/routine-intelligence/prospective/internal/blind-review-responses-manifest-v1.json`

Ele pode conter:

- hash do arquivo recebido;
- hash do pacote;
- pseudonimo do revisor;
- quantidade de respostas;
- estado `FROZEN_COMPLETE` ou `REJECTED`;
- data declarada no arquivo, se existir;
- resultado da auditoria de privacidade;
- ausencia de resposta automatica.

Nao copie notas livres para o manifesto.

## Fase 4 - Abertura verificavel da chave

Somente no Fluxo A, depois de congelar respostas:

- recalcule o hash canonico da chave;
- compare-o com o compromisso publicado;
- confirme correspondencia de todos os `blind_case_id`;
- confirme correspondencia entre hash do caso publico e chave;
- confirme orientacao A/B de cada caso;
- confirme que A e B eram escolhas nativas elegiveis;
- registre `KEY_COMMITMENT_VERIFIED`;
- mantenha a chave fora de qualquer relatorio distribuivel.

Se o compromisso divergir, classifique o marco como bloqueado. Nao tente reconstruir ou corrigir a chave.

No Fluxo B, valide apenas que o compromisso e a separacao fisica continuam presentes. Nao produza agregacao humana.

## Fase 5 - Agregador humano puro

Implemente ou complete uma funcao pura, por exemplo em:

`backend/src/domain/routine-intelligence-technical-decision.js`

O agregador deve receber pacote, respostas congeladas e chave verificada e retornar somente estatisticas descritivas:

- total de revisores;
- respostas `A`, `B`, `EMPATE` e `INDETERMINADO`;
- preferencias por origem tecnica depois da abertura;
- resultado por comparador;
- resultado por persona;
- resultado por classificacao interna;
- resultado por `SHARED_HISTORY` e `TRAJECTORY_OUTCOME`;
- motivos estruturados;
- confianca humana declarada;
- casos sem determinacao;
- limitacao de revisor unico.

Regras:

- nao trate `EMPATE` como meia vitoria sem declarar a convencao;
- nao trate `INDETERMINADO` como empate;
- nao use confianca humana como peso principal por padrao;
- nao misture resultados de controle x V2 com V1 x V2;
- nao misture trajetorias divergentes com historico compartilhado sem estratificar;
- nao calcule significancia estatistica enganosa com amostra intencional pequena;
- nao exponha notas livres no relatorio agregado;
- nao declare consenso com um revisor;
- preserve contagens e denominadores explicitos.

Teste o agregador com fixtures artificiais mesmo quando nao houver respostas reais. Nao gere resultado humano real no Fluxo B.

## Fase 6 - Evidencia automatizada

Construa uma matriz de decisao somente leitura contendo:

- criterios de aceitacao congelados e seus estados;
- resultado de desenvolvimento e validacao;
- deltas V2 x controle e V2 x V1;
- regressoes por persona e semana;
- guardrails aprovados, reprovados e nao aplicaveis;
- confianca e volume efetivo;
- diferenca entre escolha nativa e politica operacional com fallback;
- hipoteses registradas em 30/09;
- casos preparados para revisao humana;
- limitacoes sinteticas.

Nao reexecute modelos. Leia os relatorios congelados e valide seus hashes antes da matriz.

Registre explicitamente:

- V2 supera o controle em arrependimento medio de validacao;
- V2 nao atende ao criterio congelado contra a V1;
- baixa confianca afeta grande parte dos cenarios;
- zero violacoes eliminatorias significa seguranca estrutural, nao superioridade de qualidade;
- fallback operacional pode reduzir risco, mas nao transforma escolha nativa ruim em vitoria da V2;
- resultados sinteticos nao provam comportamento de clientes reais.

## Fase 7 - Registro de hipoteses

Crie um registro versionado, por exemplo:

`backend/experiments/routine-intelligence/technical-hypotheses-v1.json`

Cada hipotese candidata deve declarar:

- `id` estavel;
- status `ACCEPTED_FOR_INVESTIGATION`, `REJECTED`, `INSUFFICIENT_EVIDENCE` ou `DEFERRED_HUMAN_REVIEW`;
- problema geral;
- mecanismo tecnico suspeito;
- evidencia automatizada;
- evidencia humana, quando existir;
- contraevidencia;
- personas e classes afetadas;
- risco de overfitting;
- invariantes que nao podem mudar;
- mudanca conceitual permitida;
- mudancas proibidas;
- fixture futura;
- criterio de sucesso em desenvolvimento;
- criterio de aceitacao em validacao;
- criterio de abandono;
- necessidade de nova versao de modelo;
- ausencia de uso da reserva.

Nao inclua peso numerico proposto, resultado desejado por cenario ou candidato que deve vencer.

## Fase 8 - Criterios para aceitar uma hipotese de V2.1

Uma hipotese somente pode receber `ACCEPTED_FOR_INVESTIGATION` quando todos os itens forem verdadeiros:

- descreve mecanismo geral, nao uma persona ou cenario isolado;
- possui evidencia reproduzivel em validacao;
- possui pelo menos uma fixture geral independente do relatorio;
- e coerente com guardrail ou criterio registrado antes da decisao;
- nao exige alterar filtro eliminatorio;
- nao enfraquece consentimento, revogacao, idempotencia ou causalidade;
- preserva neutralidade sem historico;
- preserva limite de ajuste e confianca existentes, salvo novo protocolo futuro explicito;
- nao usa reserva;
- nao depende de remover casos desfavoraveis;
- possui criterio objetivo de rejeicao;
- seu beneficio esperado pode ser avaliado sem saber candidatos especificos da reserva.

Evidencia humana, quando existir, pode corroborar a hipotese, mas nao substitui esses requisitos.

Rejeite ou marque evidencia insuficiente quando:

- o problema ocorre apenas em um caso;
- a causa e apenas inferida pelo nome da persona;
- a proposta e aumentar ou reduzir peso ate vencer o placar;
- o resultado humano e dividido, indeterminado ou de um unico caso;
- a hipotese conflita com preferencia explicita ou filtro eliminatorio;
- nao existe teste geral possivel;
- a mudanca so melhora validacao conhecida;
- a proposta depende da reserva.

## Fase 9 - Regra de decisao

Use exatamente uma destas decisoes tecnicas:

### `MANTER_V2_SEM_AJUSTE`

Use quando nenhuma hipotese geral satisfizer todos os criterios de aceitacao. Isso inclui o caso em que respostas humanas estao ausentes e a evidencia automatizada nao justifica uma nova formula.

Consequencias:

- a V2 atual permanece a candidata tecnica;
- o criterio desfavoravel contra a V1 permanece documentado;
- rollout publico continua zero;
- politica de baixa confianca continua usando o controle;
- Dia 05 congela e testa a V2 atual, salvo nova evidencia legitima anterior ao congelamento;
- revisao humana pode continuar pendente como evidencia auxiliar, sem reabrir esta decisao silenciosamente.

### `HIPOTESES_V2_1_ACEITAS`

Use quando uma ou mais hipoteses gerais satisfizerem todos os criterios. A decisao deve listar IDs aceitos e rejeitados.

Consequencias:

- nenhuma formula muda hoje;
- Dias 03 e 04 podem preparar e testar fixtures ou prototipo isolado;
- qualquer V2.1 deve receber novo identificador, manifesto e hashes;
- desenvolvimento pode orientar implementacao;
- validacao somente pode decidir aceitacao depois de a candidata estar congelada;
- reserva continua proibida;
- a V2 atual permanece referencia ate nova candidata ser aprovada.

### `DECISAO_TECNICA_BLOQUEADA`

Use somente quando houver divergencia de hash, pacote adulterado, respostas invalidas usadas como evidencia, compromisso de chave invalido, violacao de guardrail ou impossibilidade de vincular a decisao aos artefatos congelados.

Ausencia de respostas humanas, isoladamente, nao e bloqueio.

## Fase 10 - Conflito entre evidencias

Quando houver respostas humanas:

- se automatizado e humano apontarem na mesma direcao, registre corroboracao auxiliar;
- se divergirem, nao escolha a evidencia mais conveniente;
- preserve ambos os resultados e denominadores;
- priorize guardrails para seguranca;
- priorize validacao automatizada para criterios quantitativos pre-registrados;
- use humano para diagnostico de preferencia e legibilidade, nao como substituto da avaliacao longitudinal;
- marque a hipotese como `INSUFFICIENT_EVIDENCE` quando o conflito impedir mecanismo geral;
- nunca use opiniao humana para flexibilizar filtro eliminatorio.

## Fase 11 - Artefato de decisao

Crie:

`backend/reports/routine-intelligence/prospective/technical-decision-v1.json`

O relatorio deve conter:

- schema e versao;
- decisao final;
- hashes das entradas;
- estado da revisao humana;
- hash das respostas, quando existirem;
- compromisso da chave e estado de verificacao;
- resumo automatizado;
- resumo humano somente quando valido;
- criterios avaliados;
- hipoteses aceitas, rejeitadas, insuficientes e adiadas;
- justificativa tecnica;
- consequencias para os proximos marcos;
- riscos e limitacoes;
- reserva acessada: falso;
- formulas alteradas: falso;
- rollout publico: zero;
- hash canonico do proprio relatorio.

O relatorio nao deve conter:

- notas humanas livres;
- PII;
- chave completa;
- sinais individuais;
- snapshots completos;
- material da reserva;
- pesos propostos;
- conclusao de validacao comercial.

## Fase 12 - CLI de decisao

Crie um comando local, por exemplo:

`decide:rotina:intelligence`

A CLI deve:

- aceitar `--check` ou `--write`, exatamente um;
- aceitar `--responses=<caminho fixo permitido>` somente para o arquivo submetido esperado;
- detectar ausencia de respostas sem inventar arquivo;
- recusar qualquer argumento contendo `reserva`;
- validar todos os hashes antes de decidir;
- pre-registrar ou validar o protocolo de decisao;
- validar e congelar respostas antes da chave;
- gerar resultado humano somente no Fluxo A;
- gerar decisao automatizada conservadora no Fluxo B;
- usar destinos fixos;
- impedir sobrescrita incompativel;
- escrever atomicamente;
- oferecer `--help` sem escrita;
- imprimir somente resumo agregado seguro;
- retornar codigo diferente de zero em falha;
- nao ler `.env`;
- nao executar modelos;
- nao acessar reserva.

Resumo permitido:

- versao do protocolo;
- estado da revisao humana;
- quantidade de revisores;
- respostas validas, empates e indeterminados, quando existirem;
- quantidade de hipoteses por status;
- decisao final;
- hash do relatorio;
- formulas alteradas: falso;
- reserva acessada: falso;
- rollout publico: zero.

## Fase 13 - Testes obrigatorios

Adicione testes para comprovar:

- protocolo de decisao possui schema estrito e hashes corretos;
- decisoes permitidas formam enum fechado;
- pacote e chave mantem seus hashes;
- resposta ausente produz `REVISAO_HUMANA_PENDENTE`, nunca resposta sintetica;
- resposta incompleta nao e agregada;
- resposta completa e valida e congelada antes da chave;
- caso desconhecido ou duplicado falha;
- escolha, motivo e confianca invalidos falham;
- nota com PII ou segredo falha;
- hash de pacote divergente falha;
- compromisso da chave divergente falha;
- orientacao A/B e mapeada corretamente;
- `EMPATE` e `INDETERMINADO` usam denominadores separados;
- resultado e separado por comparador e modo de trajetoria;
- revisor unico e explicitamente limitado;
- ausencia humana nao cria consenso;
- matriz automatizada reproduz valores congelados;
- criterio desfavoravel V2 x V1 permanece visivel;
- zero violacoes eliminatorias nao e interpretado como superioridade;
- hipotese isolada e rejeitada;
- hipotese geral sem fixture e rejeitada;
- hipotese dependente da reserva e rejeitada;
- hipotese com alteracao de filtro eliminatorio e rejeitada;
- hipotese aceita possui mecanismo, fixture, risco e criterio de abandono;
- decisao `MANTER_V2_SEM_AJUSTE` nao altera formula;
- decisao `HIPOTESES_V2_1_ACEITAS` nao cria V2.1 automaticamente;
- relatorio nao contem PII, nota livre, chave ou material de reserva;
- serializacao e hash sao deterministicos;
- ordem de chaves nao altera a decisao;
- `--help` e `--check` nao escrevem;
- tentativa de reserva falha;
- formulas e artefatos anteriores preservam hashes;
- rollout publico permanece zero.

Use fixtures artificiais para testar o Fluxo A se respostas reais nao existirem. Nunca versiona-las como respostas humanas.

## Fase 14 - Testes de mutacao e falha segura

Garanta falha explicita para:

- campo desconhecido no protocolo;
- criterio alterado depois das respostas;
- pacote adulterado;
- chave adulterada;
- resposta preenchida pelo agente ou marcada como fixture;
- pseudonimo com e-mail;
- resposta duplicada;
- resposta para caso inexistente;
- formulario incompleto tratado como completo;
- abertura da chave antes do congelamento;
- contagem que mistura comparadores;
- `INDETERMINADO` contado como empate;
- revisor unico declarado como consenso;
- hipotese sem evidencia de validacao;
- hipotese com peso numerico escolhido pelo placar;
- hipotese que remove caso desfavoravel;
- tentativa de importar reserva;
- tentativa de alterar V2;
- destino historico ou caminho arbitrario;
- tentativa de sobrescrita incompativel.

Mensagens devem usar codigos tecnicos seguros e nao imprimir respostas completas, chave, notas, snapshots ou caminhos sensiveis.

## Fase 15 - Ordem de execucao

Siga esta ordem:

1. valide pre-condicoes e hashes;
2. inventarie respostas sem abrir a chave;
3. congele o protocolo de decisao;
4. determine Fluxo A ou Fluxo B;
5. no Fluxo A, valide e congele respostas;
6. no Fluxo A, verifique compromisso e agregue;
7. no Fluxo B, registre revisao pendente sem resultado humano;
8. construa a matriz automatizada somente leitura;
9. avalie hipoteses pelos criterios pre-registrados;
10. produza exatamente uma decisao permitida;
11. gere registro de hipoteses e relatorio tecnico;
12. execute testes focados tres vezes;
13. execute CLI em `--write` somente nos destinos novos;
14. execute CLI em `--check` e confirme igualdade;
15. execute suite, builds, lint e `git diff --check`;
16. produza checkpoint e atualize somente 02/10 no calendario.

Nao leia respostas apos decidir primeiro qual resultado deseja. Nao implemente hipotese aceita neste marco.

## Fase 16 - Verificacao obrigatoria

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
npm.cmd run generate:rotina:blind-review --workspace backend -- --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=desenvolvimento_v1 --check
npm.cmd run simulate:rotina:longitudinal --workspace backend -- --dataset=validacao_v1 --check
npm.cmd run evaluate:rotina:longitudinal --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:guardrails --workspace backend -- --dataset=all --check
npm.cmd run audit:rotina:scenarios --workspace backend
npm.cmd run audit:rotina:partitions --workspace backend
```

Depois de implementar a CLI, execute os equivalentes reais a:

```text
npm.cmd run decide:rotina:intelligence --workspace backend -- --write
npm.cmd run decide:rotina:intelligence --workspace backend -- --check
```

Quando respostas humanas reais existirem, use somente o argumento fixo documentado para elas. Rode testes focados do decisor pelo menos tres vezes.

Nao execute:

- simulacao longitudinal em `--write`;
- simulacao historica;
- geracao cega em `--write`;
- reserva historica ou prospectiva;
- scripts remotos;
- Supabase remoto;
- seed, pagamento, e-mail, migration ou deploy.

## Fase 17 - Auditoria estatica

Varra codigo e novos relatorios procurando:

- e-mail, telefone, endereco e coordenada exata;
- JWT, access token, refresh token, `service_role` e senha;
- alergia ou condicao medica usada como preferencia;
- conteudo de agenda;
- nota humana livre em relatorio agregado;
- chave interna em artefato publico;
- sinal individual;
- material da reserva;
- peso novo;
- importacao de modelos no agregador puro;
- chamada de banco, HTTP ou relogio real;
- resposta automatica apresentada como humana;
- linguagem de consenso com revisor unico;
- alegacao de validacao comercial.

Analise falsos positivos individualmente. Nao use exclusoes amplas para fazer a auditoria passar.

## Fase 18 - Documentacao do Dia 02/10

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-02.md`

O checkpoint deve registrar:

1. decisao do dia;
2. data planejada e real;
3. confirmacao de encerramento do Dia 01;
4. `HEAD` e estado inicial do Git;
5. hashes preservados;
6. versao e hash do protocolo de decisao;
7. estado da revisao humana;
8. existencia ou ausencia de respostas reais;
9. hash e quantidade de respostas, quando aplicavel;
10. quantidade de revisores e limitacoes;
11. verificacao do compromisso da chave;
12. resultado humano agregado, somente quando aplicavel;
13. matriz de evidencia automatizada;
14. criterios de aceitacao de hipoteses;
15. hipoteses aceitas;
16. hipoteses rejeitadas ou insuficientes;
17. conflitos entre evidencias;
18. decisao `MANTER_V2_SEM_AJUSTE` ou `HIPOTESES_V2_1_ACEITAS`;
19. justificativa e consequencias;
20. arquivos criados ou alterados;
21. comandos e resultados;
22. hashes das novas saidas;
23. confirmacao de que nenhuma formula mudou;
24. confirmacao de que nenhum modelo foi executado;
25. confirmacao de que nenhuma reserva foi acessada;
26. confirmacao de rollout publico zero;
27. limitacoes sinteticas e humanas;
28. trabalho preparado para 03 e 04/10;
29. entrada exata para 05/10.

Atualize o calendario somente depois de cumprir os criterios. Marque apenas 02/10 como concluido. Nao marque V2.1, versao final, integracao, reserva, homologacao ou release como concluidos.

## Criterios de encerramento de 02/10

O marco esta concluido somente quando:

- Dia 01 continuar aprovado e verificavel;
- protocolo de decisao estiver registrado antes da agregacao humana;
- estado das respostas estiver determinado honestamente;
- nenhuma resposta tiver sido inventada ou corrigida pelo agente;
- respostas reais, quando existentes, estiverem validadas e congeladas;
- chave somente tiver sido agregada depois do congelamento;
- ausencia de respostas nao tiver gerado resultado humano;
- evidencia automatizada estiver vinculada aos hashes congelados;
- hipoteses estiverem classificadas por criterios gerais;
- exatamente uma decisao tecnica permitida estiver registrada;
- nenhuma formula ou peso tiver sido alterado;
- relatorio de decisao for canonico, reproduzivel e sem PII;
- testes focados passarem tres vezes;
- suite, builds, lint e `git diff --check` passarem;
- artefatos anteriores permanecerem intactos;
- reserva prospectiva continuar selada;
- rollout publico permanecer zero;
- checkpoint estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Decisoes permitidas hoje

Use uma destas decisoes de marco:

- `DECISAO_TECNICA_CONCLUIDA_MANTER_V2`: nenhuma hipotese geral foi aceita e a V2 permanece sem ajuste;
- `DECISAO_TECNICA_CONCLUIDA_HIPOTESES_V2_1`: uma ou mais hipoteses gerais foram aceitas para investigacao, sem implementacao;
- `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE`: decisao conservadora concluida com base automatizada, mantendo explicitamente a revisao humana pendente;
- `DECISAO_TECNICA_BLOQUEADA`: integridade, compromisso, respostas ou guardrails impedem uma decisao confiavel.

Use `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE` somente quando a decisao substantiva for manter a V2 sem ajuste e nao houver resposta humana valida. Nao use esse estado para aceitar hipoteses como se fossem corroboradas por pessoas.

Nao declare `V2_1_IMPLEMENTADA`, `CANDIDATA_FINAL_CONGELADA`, `IA_PRONTA_EM_HOMOLOGACAO` ou equivalente.

## Aceleracao segura

Depois de concluir 02/10, pode ficar marcado como `PREPARADO` para 03 e 04/10:

- fixtures gerais das hipoteses aceitas;
- contrato de nova versao, se necessario;
- plano de implementacao isolada;
- criterios de abandono;
- comparador entre candidata e versoes congeladas;
- testes de preservacao dos guardrails;
- checklist de congelamento de 05/10.

Se a decisao for manter V2, pode ficar preparado:

- manifesto de congelamento da V2 atual;
- auditoria final das formulas;
- matriz de regressao para 05/10;
- plano de integracao com fallback para 06/10.

Nao pode ficar marcado como concluido:

- V2.1;
- nova simulacao de qualidade;
- versao final;
- reserva;
- integracao real;
- homologacao;
- rollout ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. decisao tecnica substantiva;
3. confirmacao de que nada ficou pendente no Dia 01;
4. arquivos criados ou alterados;
5. versao e hash do protocolo de decisao;
6. estado das respostas humanas;
7. quantidade de revisores e respostas validas;
8. resultado humano agregado, quando existir;
9. matriz de evidencia automatizada;
10. hipoteses avaliadas;
11. hipoteses aceitas, rejeitadas e adiadas;
12. justificativa para V2.1 ou manutencao da V2;
13. conflitos e limitacoes;
14. testes, builds, lint e diff;
15. hashes preservados e novos;
16. confirmacao de que formulas e pesos nao mudaram;
17. confirmacao de que nenhum modelo foi executado;
18. confirmacao de que nenhuma reserva foi acessada;
19. confirmacao de rollout publico zero;
20. trabalho preparado para 03 e 04/10;
21. entrada exata de 05/10: implementar somente hipotese aprovada e congelar nova candidata, ou congelar e testar a V2 atual sem ajuste.

Nao confunda ausencia de resposta com empate, pacote cego com revisao concluida, hipotese aceita com V2.1 implementada, guardrail aprovado com superioridade de qualidade ou decisao tecnica com validacao comercial. O objetivo de 02/10 e escolher com disciplina se existe fundamento geral para investigar uma nova versao, mantendo intactas as evidencias que permitirao avaliar essa escolha depois.
