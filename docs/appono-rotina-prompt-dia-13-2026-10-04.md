# Prompt do Dia 13 - Auditoria final de prontidao da Appono.AI

Voce e um agente senior de engenharia de software, sistemas de recomendacao, experimentacao, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **4 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e usar a segunda reserva tecnica para realizar uma **auditoria final de prontidao antes do congelamento de 05/10**. O trabalho deve confirmar que a V2 atual, mantida sem ajuste pela decisao de 02/10, pode ser congelada e testada sem alterar formulas, pesos, resultados prospectivos ou criterios de avaliacao.

Este marco nao e uma nova simulacao, nao e uma nova avaliacao, nao e implementacao de V2.1 e nao e integracao ao planejamento real. Como os marcos anteriores foram antecipados, priorize qualidade da evidencia, consistencia dos contratos e reducao de risco. Se nao houver defeito real, produza somente a auditoria e o checkpoint; nao invente complexidade.

Nao entregue apenas analise, pseudocodigo ou uma lista de proximos passos. Inspecione o estado real do repositorio, valide os artefatos, preserve as alteracoes dos Dias 02 e 03, corrija apenas bloqueadores gerais e produza um checkpoint datado.

Nao faca commit, push, deploy, migration remota ou operacao em Supabase durante a execucao deste prompt sem autorizacao explicita.

## Marco do calendario

Data planejada: `04/10/2026`.

Entrega prevista:

> Reserva tecnica: descanso ou recuperacao de atraso critico.

Uso autorizado neste projeto:

> Auditoria final de prontidao, sem recalibracao oportunista, preparando o congelamento de 05/10.

O marco somente pode ser encerrado quando estiver comprovado que:

- o Dia 03 continua aprovado e reproduzivel;
- a decisao `MANTER_V2_SEM_AJUSTE` continua vinculada aos hashes corretos;
- o manifesto de congelamento esta consistente e ainda nao foi declarado final;
- a V2 nao sofreu alteracao funcional;
- os guardrails essenciais possuem cobertura executavel;
- o fallback permanece seguro e o rollout publico continua zero;
- a revisao humana continua pendente sem respostas inventadas;
- nenhum artefato historico, prospectivo ou de reserva foi alterado;
- nao existe risco bloqueante conhecido para 05/10;
- existe uma lista objetiva de verificacoes finais para o congelamento.

## Estado aprovado a preservar

Confirme no repositorio, sem copiar hipoteses sem validacao:

- Dia 02: `DECISAO_TECNICA_CONCLUIDA_COM_REVISAO_PENDENTE`;
- decisao substantiva: `MANTER_V2_SEM_AJUSTE`;
- Dia 03: `RESERVA_TECNICA_CONCLUIDA_COM_CORRECOES`;
- respostas humanas validas: `0`, salvo evidencia externa explicitamente submetida;
- candidatos: `appono-intelligence-v2`, controle `deterministico-v3`, referencia `appono-intelligence-v1`;
- snapshots e relatorios prospectivos preservados;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`.

Se qualquer estado divergir, pare o trabalho de prontidao, registre `AUDITORIA_DIVERGENTE` e nao regenere artefatos para esconder a diferenca.

## Pre-condicoes obrigatorias

Antes de editar ou gerar qualquer saida, confirme:

- branch, `HEAD` e arvore de trabalho;
- checkpoint dos Dias 02 e 03 presentes;
- prompt e artefatos dos Dias 02 e 03 preservados;
- manifesto `final-candidate-freeze-v1.json` presente com estado `PREPARED_FOR_FREEZE`;
- matriz de integracao de 06/10 presente;
- formulas e politica sem alteracao inesperada;
- hashes de snapshots, brutos, metricas, comparacao, guardrails, pacote cego e decisao intactos;
- feature flags, kill switch e rollout publico coerentes;
- nenhum arquivo de resposta humana fabricado;
- nenhum arquivo de reserva materializado ou acessado;
- suite, builds, lint e `git diff --check` aprovados no Dia 03.

Nao marque o Dia 04 como concluido antes de cumprir todos os criterios.

## Leitura obrigatoria

Leia integralmente:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 03/10;
- prompts dos Dias 1 a 12;
- `backend/experiments/routine-intelligence/manifest.json`;
- protocolos longitudinal, guardrails, revisao cega e decisao tecnica;
- `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/domain/routine-intelligence-technical-decision.js`;
- matriz de integracao de 06/10;
- testes de formula, politica, consentimento, guardrails, decisao e rotas.

Leia relatorios congelados somente para validar hashes e contratos. Nao os regenere.

## Regras inegociaveis

1. Preserve todas as alteracoes locais.
2. Nao altere controle, V1, V2, utilidade, pesos, limites, decaimento, suavizacao ou desempates.
3. Nao implemente V2.1.
4. Nao crie novo placar ou nova metrica comparativa.
5. Nao execute modelos em modo de escrita.
6. Nao regenere snapshots, simulacoes, metricas, comparacoes, guardrails ou pacote cego.
7. Nao abra, leia, materialize ou reconstrua a reserva prospectiva.
8. Nao reexecute a reserva historica.
9. Nao invente respostas humanas nem consulte a chave para inferir julgamentos.
10. Nao altere criterios depois de observar resultados.
11. Nao inclua PII, dados medicos, financeiros, agenda, credenciais ou sinais individuais.
12. Nao habilite rollout publico nem altere sugestoes visiveis.
13. Nao crie migration, rota, dependencia externa ou integracao remota.
14. Nao marque 05/10 ou 06/10 como concluido.
15. Nao faca commit, push, deploy, seed remoto, pagamento ou e-mail durante o marco.

## Escopo permitido

Este marco pode:

- auditar hashes e estados;
- revisar a matriz de riscos para 05/10;
- corrigir defeito geral de teste, contrato ou verificacao;
- adicionar testes de falha segura quando houver lacuna real;
- validar o manifesto de congelamento sem muda-lo para acomodar resultados;
- validar a matriz de integracao de 06/10;
- preparar checklist de congelamento;
- documentar riscos residuais e criterios de bloqueio;
- produzir um ensaio seco somente leitura, se realmente necessario.

Este marco nao pode:

- alterar o ranking da V2;
- aceitar hipotese V2.1;
- executar nova simulacao de qualidade;
- usar a revisao humana pendente como evidencia;
- consumir a reserva;
- integrar a IA ao fluxo real;
- ativar homologacao ou rollout.

## Fase 1 - Inventario antes da auditoria

Registre:

- branch, `HEAD`, Node.js e npm;
- arquivos modificados e nao rastreados;
- hashes das formulas e contratos;
- estado de cada checkpoint;
- estado dos protocolos e manifestos;
- estado das respostas humanas;
- estado das reservas;
- estado das flags e do kill switch;
- comandos disponiveis;
- quantidade esperada de testes.

Separe alteracoes preexistentes, trabalho do Dia 02, trabalho do Dia 03 e trabalho novo do Dia 04. Nao reverta, compacte ou reorganize mudancas de outros marcos.

## Fase 2 - Auditoria de integridade

Valide somente por leitura:

- hash do manifesto de congelamento e seus arquivos de origem;
- hash do relatorio de decisao tecnica;
- hashes de controle, V1, V2 e politica;
- hashes dos snapshots e relatorios prospectivos;
- hash do pacote cego e compromisso da chave;
- estado `PREPARED_FOR_FREEZE`, nunca `FROZEN`;
- ausência de respostas humanas preenchidas pelo agente;
- `reserve_accessed: false` em todos os artefatos recentes;
- `public_rollout_percent: 0`.

Se um hash divergir, classifique como bloqueador. Nao regenere o artefato divergente.

## Fase 3 - Matriz de riscos para 05/10

Crie ou valide uma matriz com riscos e evidencias para:

- alteracao acidental de formula;
- campo desconhecido na entrada;
- candidato inelegivel;
- baixa confianca sem fallback;
- falha isolada de V2;
- consentimento ausente ou revogado;
- estado compartilhado;
- explicacao com PII;
- resultado humano inventado;
- acesso indevido a reserva;
- rollout ativado por padrao;
- relatorio historico sobrescrito;
- divergencia entre manifesto e codigo.

Cada risco deve possuir:

- identificador;
- severidade;
- contrato relacionado;
- teste ou comando de evidencia;
- resultado `PASS`, `OPEN` ou `BLOCKED`;
- criterio objetivo para fechamento.

Nao use a matriz para criar novos pesos, limiares ou preferencias.

## Fase 4 - Checklist de congelamento

Prepare um checklist para 05/10 contendo:

- congelar identificador e versao da V2;
- recalcular hashes finais sem alterar arquivos;
- confirmar formula, politica e guardrails;
- confirmar fallback por baixa confianca, erro e kill switch;
- confirmar filtros eliminatorios e universo comum;
- confirmar consentimento, revogacao e idempotencia;
- confirmar explicacao allowlist-only;
- confirmar suite, builds, lint e diff;
- confirmar rollout zero;
- confirmar reserva ainda selada;
- registrar `FROZEN` somente no Dia 05, depois dos testes;
- gerar entrada exata para integracao do Dia 06.

O checklist nao deve declarar a V2 congelada antes do Dia 05.

## Fase 5 - Testes de falha segura

Adicione cobertura somente se faltar prova para:

- hash de origem divergente;
- manifesto com campo desconhecido;
- tentativa de mudar candidato por argumento;
- tentativa de importar reserva;
- tentativa de usar resposta humana ausente;
- tentativa de creditar fallback como escolha nativa;
- baixa confianca sem controle;
- consentimento revogado mantendo efeito;
- estado de V2 contaminando controle;
- candidato inelegivel reintroduzido;
- explicacao com campo privado;
- rollout diferente de zero;
- escrita em relatorio historico.

Mensagens devem ser tecnicas, seguras e sem objetos completos.

## Fase 6 - Ensaio seco opcional

Nao crie uma nova CLI se os testes e manifestos existentes forem suficientes. Se houver risco real nao coberto, implemente um comando somente leitura, por exemplo:

`npm run prepare:rotina:freeze --workspace backend -- --check`

Ele deve:

- validar hashes;
- validar manifestos;
- confirmar guardrails;
- confirmar fallback;
- confirmar respostas humanas pendentes;
- confirmar reserva selada;
- confirmar rollout zero;
- nao executar modelos;
- nao escrever arquivos por padrao;
- oferecer `--help` seguro.

## Fase 7 - Verificacao obrigatoria

Descubra os nomes reais dos scripts e execute:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute em modo de verificacao:

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

Rode testes focados novos ou alterados tres vezes. Nao execute `--write` em simulacao, avaliacao, guardrails ou reserva.

## Fase 8 - Auditoria estatica

Varra artefatos novos procurando:

- PII, tokens, credenciais e dados sensiveis;
- material ou semente da reserva;
- pesos, limiares ou desempates novos;
- importacoes indevidas de modelo;
- chamadas de banco, HTTP ou relogio real;
- resposta humana fabricada;
- alegacao de V2.1, homologacao ou validacao comercial;
- rollout diferente de zero;
- sobrescrita de artefatos congelados.

Analise falsos positivos individualmente e nao use exclusoes amplas.

## Fase 9 - Checkpoint do Dia 04

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-04.md`

Registre:

1. decisao do marco;
2. data planejada e real;
3. confirmacao de encerramento do Dia 03;
4. `HEAD` e estado inicial do Git;
5. hashes auditados;
6. estado da decisao tecnica;
7. estado da revisao humana;
8. matriz de riscos;
9. checklist de congelamento;
10. defeitos encontrados e classificacao;
11. correcoes implementadas, se houver;
12. testes, builds, lint e diff;
13. comandos e resultados;
14. confirmacao de que nenhuma formula mudou;
15. confirmacao de que nenhum modelo foi executado em escrita;
16. confirmacao de que nenhum placar novo foi produzido;
17. confirmacao de que nenhuma reserva foi acessada;
18. confirmacao de rollout publico zero;
19. riscos residuais para 05/10;
20. itens `PREPARADO`;
21. itens abertos;
22. entrada exata de 05/10.

Decisoes permitidas:

- `RESERVA_TECNICA_CONCLUIDA`: auditoria aprovada sem defeito geral;
- `RESERVA_TECNICA_CONCLUIDA_COM_CORRECOES`: defeitos gerais corrigidos e verificados;
- `RESERVA_TECNICA_PARCIAL`: preparacao util, mas lacuna nao bloqueante permanece;
- `RESERVA_TECNICA_BLOQUEADA`: integridade, formula, privacidade, elegibilidade ou reserva em risco.

## Criterios de encerramento

O Dia 04 somente pode ser marcado como concluido quando:

- Dia 03 continuar aprovado;
- hashes e estados estiverem consistentes;
- V2 permanecer sem alteracao funcional;
- nenhuma V2.1 tiver sido implementada;
- riscos bloqueantes estiverem ausentes ou explicitamente tratados;
- checklist de 05/10 estiver pronto;
- fallback, guardrails, consentimento e privacidade estiverem cobertos;
- revisao humana permanecer pendente sem fabricacao;
- suite, builds, lint e diff passarem;
- reserva continuar selada;
- rollout permanecer zero;
- checkpoint estiver completo;
- nenhuma operacao remota, commit, push ou deploy tiver ocorrido.

## Aceleracao segura para 05/10

Pode ficar marcado como `PREPARADO`:

- matriz de riscos;
- checklist de congelamento;
- auditoria final de hashes;
- testes de falha segura;
- plano de integracao para 06/10;
- criterios objetivos para bloquear o congelamento.

Nao pode ficar marcado como concluido:

- congelamento final;
- nova simulacao;
- V2.1;
- reserva;
- integracao real;
- homologacao;
- rollout ou release.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. confirmacao de que nada ficou pendente do Dia 03;
3. arquivos criados ou alterados;
4. hashes auditados;
5. riscos avaliados;
6. checklist de congelamento;
7. defeitos encontrados e correcoes;
8. guardrails e fallback confirmados;
9. estado da revisao humana;
10. testes, builds, lint e diff;
11. confirmacao de que formulas nao mudaram;
12. confirmacao de que nenhum modelo ou placar novo foi produzido;
13. confirmacao de que nenhuma reserva foi acessada;
14. confirmacao de rollout publico zero;
15. riscos residuais;
16. trabalho preparado para 05/10;
17. entrada exata do proximo marco: congelar formalmente a V2 atual, executar a bateria final de regressao e registrar os hashes finais sem recalibrar.

Nao confunda auditoria com congelamento, checklist com candidata final, reserva tecnica com folga para ajustar placar ou preparacao de integracao com integracao realizada. O objetivo do Dia 04 e deixar a V2 atual pronta para um congelamento honesto no Dia 05.
