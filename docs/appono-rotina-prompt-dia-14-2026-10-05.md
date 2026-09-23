# Prompt do Dia 14 - Congelamento e regressao final da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **5 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **congelar formalmente a V2 atual, mantida sem ajuste pela decisao tecnica de 02/10, e executar a bateria final de regressao**. O congelamento deve transformar o manifesto `PREPARED_FOR_FREEZE` em um artefato `FROZEN` somente depois de validar formulas, contratos, guardrails, fallback, privacidade, consentimento, determinismo e integridade dos artefatos.

Este marco nao autoriza implementar V2.1, recalibrar pesos, executar a reserva, integrar a IA ao planejamento real ou habilitar homologacao. A candidata de hoje e a V2 existente. Se algum criterio falhar, bloqueie o congelamento e documente a causa; nao corrija o resultado ajustando o modelo contra os dados observados.

Nao entregue apenas analise, pseudocodigo ou uma lista de proximos passos. Inspecione o estado real do repositorio, valide as pre-condicoes, execute os testes permitidos, congele somente se todos os criterios forem aprovados e produza um checkpoint datado.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `05/10/2026`.

Entrega prevista:

> Fechar e testar a versao final: formula congelada, identificada e coberta por regressao.

O marco somente pode ser encerrado com `CANDIDATA_V2_CONGELADA` quando estiver comprovado que:

- a decisao de 02/10 continua sendo `MANTER_V2_SEM_AJUSTE`;
- a V2 congelada e exatamente a candidata auditada nos Dias 02 a 04;
- controle, V1, V2, politica e utilidade mantem os hashes registrados;
- o manifesto final possui estado `FROZEN` e hash verificavel;
- a bateria de regressao passa sem falha eliminatoria;
- filtros eliminatorios continuam soberanos;
- baixa confianca, erro, consentimento e revogacao continuam seguros;
- fallback nao e contado como escolha nativa da V2;
- a revisao humana continua pendente sem respostas inventadas;
- os snapshots, relatorios e pacote cego permanecem intactos;
- a reserva prospectiva continua selada;
- rollout publico permanece zero;
- a integracao de 06/10 possui entrada clara e nenhum comportamento foi ativado antecipadamente.

## Pre-condicoes do Dia 04

Antes de editar ou congelar, confirme:

- decisao de 04/10 igual a `RESERVA_TECNICA_CONCLUIDA`;
- checkpoint de 04/10 presente e coerente;
- auditoria de prontidao com `13/13` riscos em `PASS`;
- manifesto `final-candidate-freeze-v1.json` presente em `PREPARED_FOR_FREEZE`;
- checkpoint de 03/10 presente;
- commit ou descendente legitimo contendo os Dias 02 a 04;
- arvore limpa ou alteracoes locais identificadas e preservadas;
- decisao tecnica `MANTER_V2_SEM_AJUSTE`;
- revisao humana `REVISAO_HUMANA_PENDENTE`, salvo submissao real validada fora deste marco;
- snapshots, brutos, metricas, comparacao, guardrails e pacote cego intactos;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a `0`.

Se uma pre-condicao falhar, nao congele a candidata. Produza `CONGELAMENTO_BLOQUEADO`, documente a divergencia e preserve os artefatos existentes.

## Estado conhecido a confirmar

Trate como hipoteses verificaveis:

- candidata `appono-intelligence-v2`;
- controle `deterministico-v3`;
- referencia `appono-intelligence-v1`;
- utilidade `persona-utility-v1`;
- contrato longitudinal `routine-longitudinal-contract-v1`;
- simulacao prospectiva com 300 cenarios por conjunto e 900 execucoes por conjunto;
- zero falhas, fallbacks e violacoes eliminatorias nos relatorios congelados;
- V2 melhor que o controle no criterio congelado, mas pior que a V1;
- nenhuma V2.1 implementada;
- nenhum cliente real ou dado real usado;
- nenhuma resposta humana submetida.

Registre divergencias reais. Nao atualize hashes para fazer o estado conhecido coincidir com o repositorio.

## Leitura obrigatoria

Leia integralmente antes de editar:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 04/10;
- prompts dos Dias 1 a 13;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`;
- protocolos longitudinal, guardrails, revisao cega e decisao tecnica;
- snapshots e relatorios prospectivos, somente para validar integridade;
- `backend/src/domain/routine-scoring.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-longitudinal-simulation.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/domain/routine-intelligence-technical-decision.js`;
- matriz de riscos e checklist de congelamento do Dia 04;
- testes de formula, recomendacao, politica, consentimento, simulacao, metricas, guardrails, decisao e rotas.

O simulador historico pode ser lido para contexto, mas nao deve ser executado nem alterado para melhorar resultados.

## Regras inegociaveis

1. Preserve todas as alteracoes locais.
2. Nao altere controle, V1, V2, utilidade, pesos, limites, decaimento, suavizacao ou desempates.
3. Nao implemente V2.1.
4. Nao use os resultados congelados para recalibrar a V2.
5. Nao exclua cenarios, personas, semanas, empates ou casos desfavoraveis.
6. Nao regenere snapshots ou relatorios prospectivos.
7. Nao execute a reserva historica ou prospectiva.
8. Nao execute modelos sobre a reserva.
9. Nao invente respostas humanas.
10. Nao altere o pacote cego ou sua chave.
11. Nao introduza PII, dados medicos, financeiros, agenda, credenciais ou sinais individuais.
12. Nao habilite rollout publico, allowlist ou sugestoes visiveis.
13. Nao crie migration, rota publica, dependencia externa ou integracao operacional.
14. Nao grave resultados nos relatorios historicos ou prospectivos congelados.
15. Nao marque 06/10 ou marcos posteriores como concluido.
16. Nao faca commit, push, deploy, seed remoto, pagamento ou e-mail sem autorizacao.

## Escopo permitido

Este marco pode:

- validar hashes e contratos;
- executar testes de regressao locais;
- corrigir defeitos gerais de teste ou verificacao, desde que nao alterem a formula;
- atualizar o manifesto de congelamento para `FROZEN` quando todos os criterios passarem;
- criar um relatorio de congelamento e um checkpoint;
- preparar fixtures de integracao sem executar o fluxo real;
- confirmar o fallback e o kill switch;
- documentar limitacoes e riscos residuais.

Este marco nao pode:

- melhorar o placar da V2;
- mudar ranking, peso, limiar, decaimento ou desempate;
- aceitar hipoteses V2.1;
- executar a reserva;
- integrar ao planejamento real;
- ativar homologacao ou rollout.

## Fase 1 - Inventario e congelamento da linha de base

Registre antes do primeiro teste:

- branch, `HEAD`, Node.js e npm;
- estado da arvore de trabalho;
- hashes dos Dias 02 a 04;
- hashes de scoring, controle, V1, V2, politica e guardrails;
- hashes de snapshots, brutos, metricas, comparacao, pacote cego e decisao;
- estado de respostas humanas;
- flags, kill switch e rollout;
- estados das reservas;
- quantidade esperada de testes;
- destino do relatorio de congelamento.

Separe a linha de base congelavel das alteracoes que surgirem durante a execucao. Nao inclua modificacoes alheias.

## Fase 2 - Validacao do contrato final

Comprove que a candidata continua obedecendo:

- entradas com schema estrito;
- candidatos elegiveis definidos antes da personalizacao;
- filtros de seguranca alimentar, funcionamento, disponibilidade, agenda, orcamento e raio;
- entrada comum equivalente para controle, V1 e V2;
- estado isolado por conjunto, persona e modelo;
- sinais somente sinteticos, ativos, consentidos, idempotentes e anteriores;
- grupo sem historico neutro;
- confianca em faixa valida;
- ajuste da V2 dentro dos limites congelados;
- fallback por baixa confianca e falha;
- explicacao com lista permitida;
- nenhum campo desconhecido silenciosamente aceito.

Se alguma garantia falhar, bloqueie o congelamento. Nao corrija alterando a formula da V2.

## Fase 3 - Bateria final de regressao

Execute ou confirme cobertura para:

- recomendacao deterministica e desempate estavel;
- candidato inelegivel nunca ranqueado;
- preferencia explicita nao superar filtro eliminatorio;
- ausencia de historico com ajuste e confianca zero;
- uma ou duas amostras sem salto indevido de confianca;
- contradicao sem perda de filtro eliminatorio;
- mudanca gradual sem apagamento abrupto;
- repeticao limitada sem banir favorito elegivel;
- diversidade sem escolher aversao explicita;
- consentimento ausente, revogado e sinal inativo;
- deduplicacao por chave idempotente;
- sinal futuro sem retroacao;
- falha V2 isolada do controle;
- fallback nao creditado como escolha nativa;
- estado sem contaminacao entre modelos, personas ou conjuntos;
- explicacao sem PII, segredo ou sinal individual;
- kill switch e rollout zero;
- relatorios historicos e prospectivos protegidos contra escrita indevida.

Fixtures devem ser gerais e independentes dos placares observados. Se ja houver cobertura suficiente, nao duplique testes apenas para aumentar contagem.

## Fase 4 - Validacao de reprodutibilidade

Comprove:

- duas leituras do mesmo conjunto produzem os mesmos hashes;
- ordem de chaves nao altera hashes canonicos;
- o resultado nao depende do relogio real, timezone local ou ordem do sistema de arquivos;
- `--check` nao escreve arquivos;
- `--help` nao escreve arquivos;
- o manifesto identifica as mesmas fontes do codigo;
- o estado `FROZEN` somente aparece depois da validacao final;
- relatorios anteriores continuam com os mesmos hashes.

Se for necessario um novo artefato, escreva apenas em destino novo e registre seu hash no checkpoint.

## Fase 5 - Transicao do manifesto

Somente depois de todos os testes aprovados:

1. leia o manifesto `PREPARED_FOR_FREEZE`;
2. valide todos os hashes de origem;
3. valide a decisao `MANTER_V2_SEM_AJUSTE`;
4. valide os guardrails e o fallback;
5. confirme respostas humanas `0` ou estado externo validado sem agregar julgamentos;
6. confirme reserva selada e rollout zero;
7. produza uma copia canonica com estado `FROZEN`;
8. inclua data planejada, data de execucao, executor e hashes finais;
9. recalcule o hash canonico do manifesto final;
10. recuse qualquer escrita em snapshots, relatorios de qualidade ou pacote cego.

O estado `FROZEN` significa somente que a candidata esta congelada para os proximos testes e integracao controlada. Nao significa superioridade, validacao comercial ou release.

## Fase 6 - Relatorio de congelamento

Crie, se seguir a convencao local:

`backend/reports/routine-intelligence/prospective/final-candidate-freeze-v1.json`

O relatorio deve conter:

- schema e versao;
- candidata, controle, referencia e utilidade;
- hashes finais;
- estado `FROZEN`;
- testes executados e resultados agregados;
- zero modelos executados em modo de escrita neste marco;
- zero novos placares;
- zero falhas eliminatorias;
- politica de fallback;
- estado da revisao humana;
- estado das reservas;
- rollout publico zero;
- formulas alteradas: `false`;
- V2.1 implementada: `false`;
- hash canonico do relatorio.

Nao inclua snapshots completos, notas humanas, PII, sinais individuais, pesos privados ou material da reserva.

## Fase 7 - Integracao futura de 06/10

Prepare somente a entrada tecnica para o proximo marco:

- ponto de entrada do planejamento real;
- selecao condicionada pela politica e allowlist;
- fallback deterministico para o controle;
- diagnostico seguro;
- comportamento em erro, timeout, baixa confianca e kill switch;
- idempotencia;
- testes de rota e dominio;
- nenhuma ativacao antecipada.

Nao implemente a integracao hoje.

## Fase 8 - Falhas que bloqueiam o congelamento

Bloqueie com codigo tecnico seguro quando houver:

- hash divergente;
- formula modificada sem novo protocolo;
- manifesto inconsistente;
- candidato inelegivel entregue a modelo;
- filtro eliminatorio enfraquecido;
- confianca ou ajuste fora do contrato;
- sinal futuro, revogado ou sem consentimento personalizando;
- estado compartilhado;
- fallback ausente ou creditado como escolha nativa;
- PII em explicacao ou relatorio;
- resposta humana inventada;
- acesso ou material de reserva;
- escrita sobre artefato congelado;
- rollout diferente de zero.

Resultado de qualidade desfavoravel, por si so, nao e defeito de infraestrutura e nao autoriza recalibracao.

## Fase 9 - Verificacao obrigatoria

Descubra os nomes reais dos scripts e execute:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute em verificacao:

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

Rode os testes focados tres vezes. Nao execute simulacao em `--write`, reserva, seed remoto, Supabase, pagamento, e-mail ou deploy.

## Fase 10 - Auditoria estatica e privacidade

Varra todos os artefatos novos procurando:

- e-mail, telefone, endereco ou coordenada;
- dado medico, agenda ou sinal individual;
- JWT, token, senha ou credencial;
- semente ou material da reserva;
- peso ou limiar novo;
- chamada HTTP, banco, rota ou relogio real em modulo puro;
- resposta humana inventada;
- linguagem de vencedor, validacao comercial ou release;
- rollout diferente de zero.

Analise falsos positivos individualmente e nao esconda achados por exclusoes amplas.

## Fase 11 - Checkpoint do Dia 05

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-05.md`

Registre:

1. decisao do marco;
2. data planejada e real;
3. confirmacao de encerramento do Dia 04;
4. `HEAD` e estado inicial do Git;
5. identificador e estado final da candidata;
6. hashes de codigo e artefatos;
7. testes de regressao;
8. reprodutibilidade;
9. politica de fallback;
10. consentimento e privacidade;
11. estado da revisao humana;
12. estado das reservas;
13. rollout publico;
14. arquivos criados ou alterados;
15. comandos e resultados;
16. confirmacao de formulas inalteradas;
17. confirmacao de que nenhum modelo foi executado em escrita;
18. confirmacao de que nenhum novo placar foi produzido;
19. riscos residuais;
20. entrada exata para 06/10.

Decisoes permitidas:

- `CANDIDATA_V2_CONGELADA`: todos os criterios passaram e o manifesto esta `FROZEN`;
- `CANDIDATA_V2_CONGELADA_COM_RESSALVAS`: congelamento seguro, com limitacao documentada nao bloqueante;
- `CONGELAMENTO_PARCIAL`: preparacao valida, mas algum criterio nao eliminatorio permanece aberto;
- `CONGELAMENTO_BLOQUEADO`: existe divergencia, falha de guardrail, risco de privacidade, formula ou integridade.

Nao declare `IA_PRONTA`, `V2_1_IMPLEMENTADA`, homologacao, piloto ou release.

## Criterios de encerramento

O marco esta concluido somente quando:

- Dia 04 continua aprovado;
- pre-condicoes conferidas;
- V2 permanece sem recalibracao;
- manifesto final esta `FROZEN`, se e somente se todos os testes passarem;
- hashes finais estao registrados;
- regressao final passa;
- fallback, consentimento, idempotencia, privacidade e filtros eliminatorios passam;
- revisao humana permanece honesta;
- snapshots, relatorios, pacote cego e reservas permanecem intactos;
- rollout publico continua zero;
- testes focados passam tres vezes;
- suite, builds, lint e diff passam;
- checkpoint esta completo;
- nenhuma operacao remota, commit, push ou deploy ocorreu.

## Aceleracao segura para 06/10

Pode ficar marcado como `PREPARADO`:

- leitor do manifesto `FROZEN`;
- contrato de selecao operacional;
- testes de fallback de integracao;
- diagnostico seguro;
- checklist de rota e persistencia;
- plano de allowlist interna com rollout publico zero.

Nao pode ficar marcado como concluido:

- integracao ao planejamento;
- persistencia operacional nova;
- homologacao;
- reserva;
- rollout;
- release.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. identificador e estado da candidata;
3. confirmacao de que nada ficou pendente do Dia 04;
4. arquivos criados ou alterados;
5. hashes finais;
6. bateria de regressao;
7. prova de determinismo;
8. fallback, consentimento e privacidade;
9. estado da revisao humana;
10. testes, builds, lint e diff;
11. confirmacao de formulas inalteradas;
12. confirmacao de que nenhum modelo foi executado em escrita;
13. confirmacao de que nenhum novo placar foi produzido;
14. confirmacao de que nenhuma reserva foi acessada;
15. confirmacao de rollout publico zero;
16. riscos residuais;
17. trabalho preparado para 06/10;
18. entrada exata do proximo marco: integrar a V2 congelada ao planejamento real com fallback seguro, diagnostico permitido e rollout publico zero.

Nao confunda congelamento com superioridade, regressao com validacao comercial, estado `FROZEN` com release ou preparacao de integracao com integracao realizada. O objetivo do Dia 05 e fixar uma candidata tecnicamente auditada para que o Dia 06 possa conecta-la ao fluxo real sob controle.
