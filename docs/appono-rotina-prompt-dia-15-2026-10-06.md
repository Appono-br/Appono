# Prompt do Dia 15 - Integracao controlada da Appono.AI ao planejamento

Voce e um agente senior de engenharia de software, sistemas de recomendacao, backend, seguranca, privacidade e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Execute integralmente o marco de **6 de outubro de 2026** do calendario da Appono Intelligence V2, apresentada publicamente como **Appono.AI**.

O objetivo de hoje e **integrar a V2 congelada ao planejamento real do backend em modo controlado**, preservando o controle deterministico como fallback, a politica de baixa confianca, os filtros eliminatorios, o consentimento, a idempotencia, o diagnostico seguro e o rollout publico zero.

Este e o primeiro marco que pode conectar a candidata congelada ao fluxo operacional real de planejamento, mas isso nao significa liberar a IA para clientes publicos. A integracao deve permanecer atras de uma allowlist interna ou flag equivalente, desativada por padrao para o publico. Nenhuma alteracao pode modificar a formula congelada, os pesos, os limites, o decaimento, a suavizacao ou os desempates.

Nao entregue apenas analise, pseudocodigo ou uma lista de proximos passos. Inspecione o estado real do repositorio, implemente os contratos necessarios, adicione testes, execute verificacoes locais e produza um checkpoint datado.

Nao faca commit, push, deploy, migration remota, seed remoto, pagamento, e-mail ou operacao em Supabase sem autorizacao explicita.

## Marco do calendario

Data planejada: `06/10/2026`.

Entrega prevista:

> Integrar a IA ao planejamento real: backend seleciona o modelo e persiste diagnostico seguro com fallback.

O marco somente pode ser encerrado quando estiver comprovado que:

- a V2 usada pelo fluxo e exatamente a candidata `FROZEN`;
- a politica seleciona controle ou V2 de forma deterministica;
- o controle continua sendo o fallback operacional;
- baixa confianca, erro, timeout, entrada invalida e kill switch nao quebram o planejamento;
- candidatos inelegiveis sao eliminados antes da personalizacao;
- consentimento, revogacao, atividade e idempotencia sao respeitados;
- nenhum sinal futuro influencia a decisao atual;
- o diagnostico persistido nao contem PII, segredos ou sinais individuais;
- a integracao nao executa simulacao, reserva ou avaliacao comparativa;
- desenvolvimento, testes e homologacao interna podem distinguir a versao que decidiu;
- rollout publico permanece zero;
- a integracao e reversivel por flag ou kill switch.

## Pre-condicoes do Dia 05

Antes de editar, confirme:

- decisao de 05/10 igual a `CANDIDATA_V2_CONGELADA`;
- checkpoint de 05/10 presente e coerente;
- manifesto `final-candidate-freeze-v1.json` em estado `FROZEN`;
- relatorio `final-candidate-freeze-v1.json` presente e canonico;
- hash canonico do manifesto conferido;
- hash canonico do relatorio conferido;
- controle, V1, V2, politica e utilidade com os hashes congelados;
- suite, builds, lint e diff aprovados no Dia 05;
- snapshots, relatorios prospectivos, pacote cego e guardrails intactos;
- reserva historica `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva `SEALED_UNMATERIALIZED`;
- rollout publico igual a `0`;
- nenhuma resposta humana inventada ou usada como configuracao operacional.

Se uma pre-condicao falhar, interrompa a integracao, registre `INTEGRACAO_BLOQUEADA_POR_PRECONDICAO` e preserve a V2 congelada.

## Estado conhecido a confirmar

Trate como hipoteses verificaveis:

- entrada operacional principal em `backend/src/routes/routine.js` ou modulo equivalente;
- politica existente com allowlist, flag, kill switch e fallback;
- planejamento atual continua controlado quando a IA esta desativada;
- testes de modo sombra e allowlist ja existem;
- a V2 nao deve ser chamada fora do ponto de decisao autorizado;
- persistencia de diagnostico pode usar contrato existente ou armazenamento local aprovado;
- nenhuma migration e necessaria neste marco, salvo bloqueador real documentado e autorizacao explicita.

Registre divergencias. Nao altere hashes congelados para acomodar a integracao.

## Leitura obrigatoria

Leia integralmente antes de editar:

- `README.md`;
- `package.json`;
- `backend/package.json`;
- `frontend/package.json`;
- `docs/appono-rotina-calendario-ia-ate-2026-10-10.md`;
- checkpoints de 22/09 a 05/10;
- prompts dos Dias 1 a 14;
- `backend/experiments/routine-intelligence/manifest.json`;
- `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`;
- `backend/reports/routine-intelligence/prospective/final-candidate-freeze-v1.json`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-intelligence-policy.js`;
- `backend/src/domain/routine-intelligence-longitudinal-contract.js`;
- `backend/src/domain/routine-intelligence-guardrails.js`;
- `backend/src/routes/routine.js`;
- servicos e modulos de planejamento real;
- contratos de feedback, consentimento, perfil, agenda, elegibilidade e diagnostico;
- testes de recomendacao, politica, rotas, planejamento, consentimento, fallback, shadow e V2.

Nao execute o simulador historico nem a reserva. Relatorios prospectivos devem ser lidos somente para validar a versao congelada.

## Regras inegociaveis

1. Preserve todas as alteracoes locais.
2. Nao altere controle, V1, V2, utilidade, pesos, limites, decaimento, suavizacao ou desempates.
3. Nao crie V2.1 nem variante comportamental da V2.
4. Nao use resultados de clientes para recalibrar a formula.
5. Nao habilite rollout publico.
6. Mantenha allowlist interna e flag global desativadas por padrao.
7. Nao permita que falha da V2 interrompa o controle.
8. Nao entregue candidato inelegivel a nenhum modelo.
9. Nao use dados medicos, agenda, endereco, coordenada ou restricao como gosto.
10. Nao personalize sem consentimento valido.
11. Nao consuma sinal futuro ou revogado.
12. Nao persista sinal individual, texto livre, PII ou credencial.
13. Nao chame reserva, pagamento, e-mail ou servico remoto a partir do dominio de decisao.
14. Nao execute nova simulacao prospectiva ou avaliacao comparativa.
15. Nao altere snapshots, relatorios, pacote cego ou chave.
16. Nao faca commit, push, deploy ou migration remota sem autorizacao.

## Escopo permitido

Este marco pode:

- integrar a politica existente ao planejamento real;
- criar um adaptador operacional minimo para a V2 congelada;
- preservar o controle como fallback;
- persistir diagnostico tecnico seguro por contrato existente;
- adicionar flags ou configuracoes locais, se ja houver padrao no repositorio;
- adicionar testes de rota, dominio e falha segura;
- corrigir defeitos de contrato que impeçam a integracao;
- preparar allowlist interna sem ativar publico;
- documentar a operacao para homologacao de 08/10.

Este marco nao pode:

- alterar a formula da V2;
- criar nova metrica de qualidade;
- rodar reserva;
- habilitar cliente real fora da allowlist;
- criar migration remota sem autorizacao;
- declarar homologacao ou release.

## Fase 1 - Inventario do fluxo real

Registre antes da primeira edicao:

- branch, `HEAD`, Node.js e npm;
- estado da arvore de trabalho;
- ponto atual de entrada do planejamento;
- caminho atual do controle;
- caminho existente de modo sombra;
- politica de feature flag e allowlist;
- kill switch;
- contratos de sessao e perfil;
- elegibilidade de candidato;
- persistencia de planejamento e diagnostico;
- contratos de consentimento e feedback;
- testes existentes;
- ausencias que realmente bloqueiam a integracao.

Separe codigo operacional, dominio puro, rotas, persistencia e artefatos experimentais. Nao misture relatorios de simulacao ao fluxo real.

## Fase 2 - Contrato de selecao operacional

Formalize ou valide uma funcao pura que receba:

- entrada comum validada;
- candidatos elegiveis;
- estado permitido e isolado;
- consentimento e sinais elegiveis;
- politica atual;
- flag, allowlist e kill switch;
- versao congelada da candidata.

Ela deve retornar:

- escolha efetiva;
- versao que decidiu;
- se houve fallback;
- codigo tecnico de fallback ou sucesso;
- diagnostico allowlist-only;
- campos necessarios para auditoria segura.

Nao retornar:

- PII;
- sinal individual;
- texto livre de feedback;
- snapshots completos;
- pesos privados desnecessarios;
- chave da reserva;
- resultado comparativo ou vencedor experimental.

O controle e a V2 devem receber o mesmo universo elegivel. A politica pode decidir que somente o controle seja executado fora da allowlist.

## Fase 3 - Politica de ativacao controlada

Implemente ou valide a ordem:

1. flag global desligada implica controle;
2. fora da allowlist implica controle;
3. kill switch ativo implica controle;
4. entrada invalida implica controle ou erro seguro;
5. candidato inelegivel nunca e enviado;
6. consentimento ausente ou revogado remove personalizacao;
7. baixa confianca abaixo de `0.25` implica controle;
8. erro ou timeout da V2 implica controle;
9. escolha fora do universo implica controle ou erro seguro;
10. somente depois a V2 pode decidir dentro dos limites congelados.

Nao altere o limiar `0.25`.

## Fase 4 - Adaptacao para o planejamento

Use somente os campos que o planejamento real ja possui. Nao derive informacao inexistente.

Comprove:

- janela alimentar valida;
- horario atual e semana permitida;
- agenda usada apenas para disponibilidade, nunca como gosto;
- orcamento e raio como filtros;
- funcionamento e disponibilidade como filtros;
- seguranca alimentar preservada;
- candidatos ordenados deterministicamente;
- estado longitudinal adequado ao usuario e modelo;
- sinais anteriores, consentidos, ativos e idempotentes;
- grupo sem historico sem personalizacao;
- timestamp real separado do instante virtual experimental.

## Fase 5 - Diagnostico seguro

Persistir ou retornar somente uma estrutura allowlist-only, por exemplo:

- `decision_source`: controle ou V2;
- `model_version` tecnica;
- `policy_version`;
- `fallback_used`;
- `technical_code`;
- `confidence_bucket`, se permitido;
- `effective_samples_bucket`, se permitido;
- `guardrails_applied`;
- `request_id` tecnico sem PII;
- `created_at` operacional.

Rejeitar:

- nome, e-mail, telefone ou endereco;
- coordenada exata;
- agenda completa;
- alergia ou condicao medica;
- texto livre de feedback;
- sinal individual;
- token, senha ou credencial;
- objeto completo de ambiente;
- score privado desnecessario.

Se a persistencia existente nao suportar o contrato sem migration, use um adaptador local seguro ou bloqueie a etapa de persistencia; nao crie migration remota neste marco sem autorizacao.

## Fase 6 - Idempotencia e concorrencia

Garanta:

- mesma solicitacao nao duplica diagnostico;
- request id tecnico e estavel no escopo permitido;
- duas geracoes concorrentes nao corrompem o planejamento;
- fallback nao gera duas decisoes diferentes;
- estado nao e compartilhado entre usuarios;
- reprocessamento detectavel;
- nenhuma escrita de feedback ocorre como efeito colateral da recomendacao.

## Fase 7 - Falha segura e observabilidade

Teste injeção controlada de:

- V2 indisponivel;
- V2 lançando erro;
- timeout;
- confianca baixa;
- campo desconhecido;
- candidato inelegivel;
- consentimento revogado;
- estado ausente;
- kill switch;
- flag desativada;
- allowlist vazia;
- diagnostico com campo proibido.

Cada falha deve:

- preservar o planejamento seguro ou retornar erro explicito;
- manter o controle funcionando;
- registrar codigo tecnico seguro;
- nao atribuir escolha nativa a V2 quando houve fallback;
- nao expor detalhes internos ao cliente;
- nao chamar servico remoto indevido.

## Fase 8 - Testes obrigatorios

Adicione ou confirme testes para:

- controle fora da allowlist;
- V2 somente dentro da allowlist;
- flag global desativada;
- kill switch;
- baixa confianca;
- erro da V2;
- timeout da V2;
- candidato inelegivel;
- filtro de seguranca alimentar;
- funcionamento e disponibilidade;
- orcamento e raio;
- agenda sem virar afinidade;
- consentimento ausente;
- consentimento revogado;
- sinal inativo;
- sinal futuro;
- sinal duplicado;
- grupo sem historico;
- estado isolado;
- diagnostico sem PII;
- idempotencia;
- concorrencia;
- nenhum envio de e-mail, pagamento, reserva ou HTTP pelo dominio puro;
- rollout publico zero;
- versao congelada exigida;
- alteracao do manifesto ou hash bloqueia ativacao.

## Fase 9 - Verificacao da candidata congelada

Antes da primeira chamada operacional da V2, valide:

- estado `FROZEN`;
- hash canonico do manifesto;
- hash canonico do relatorio;
- hashes de formula e politica;
- `formulas_changed: false`;
- `v2_1_implemented: false`;
- reserva selada;
- rollout zero.

Uma divergencia deve impedir o uso da V2 e manter o controle.

## Fase 10 - Verificacao obrigatoria

Descubra os scripts reais e execute:

```text
npm.cmd test --workspace backend
npm.cmd run build --workspace backend
npm.cmd run lint --workspace frontend
npm.cmd run build --workspace frontend
git diff --check
```

Execute tambem os checks de integridade:

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

Rode os testes focados da integracao pelo menos tres vezes. Nao execute reserva, simulacao em `--write`, seed remoto, pagamento, e-mail, deploy ou Supabase remoto.

## Fase 11 - Auditoria estatica

Varra codigo e diagnosticos novos procurando:

- e-mail, telefone, endereco, coordenada ou agenda;
- dados medicos, financeiros ou sinais individuais;
- JWT, access token, refresh token, senha ou credencial;
- importacao indevida de banco, HTTP ou rota em dominio puro;
- chamada ao relogio real onde o contrato exige instante fornecido;
- modelo fora da politica de ativacao;
- fallback creditado como escolha nativa;
- rollout diferente de zero;
- texto que declare superioridade, homologacao ou validacao comercial.

Analise falsos positivos individualmente e nao use exclusoes amplas.

## Fase 12 - Checkpoint do Dia 06

Crie:

`docs/appono-intelligence-v2-checkpoint-2026-10-06.md`

Registre:

1. decisao do marco;
2. data planejada e real;
3. confirmacao de encerramento do Dia 05;
4. `HEAD` e estado inicial do Git;
5. manifesto e hashes da candidata congelada;
6. arquitetura da integracao;
7. politica de ativacao;
8. allowlist e rollout;
9. fallback e kill switch;
10. filtros e universo comum;
11. consentimento, revogacao e idempotencia;
12. diagnostico persistido;
13. privacidade;
14. falhas e codigos tecnicos;
15. testes, builds, lint e diff;
16. comandos e resultados;
17. arquivos criados ou alterados;
18. confirmacao de formulas inalteradas;
19. confirmacao de que nenhuma reserva foi acessada;
20. confirmacao de rollout publico zero;
21. limitacoes;
22. entrada exata para 07/10.

Decisoes permitidas:

- `INTEGRACAO_CONTROLADA_CONCLUIDA`: V2 integrada sob politica, fallback e diagnostico seguro;
- `INTEGRACAO_CONTROLADA_CONCLUIDA_COM_RESSALVAS`: integrada, mas com limitacao nao bloqueante documentada;
- `INTEGRACAO_PARCIAL`: contratos preparados, mas fluxo real ainda nao esta completo;
- `INTEGRACAO_BLOQUEADA`: risco de formula, elegibilidade, privacidade, fallback, persistencia ou rollout.

Nao declare `IA_PRONTA`, homologacao, piloto publico ou release.

## Criterios de encerramento

O marco somente pode ser concluido quando:

- Dia 05 continua aprovado;
- V2 usada pelo fluxo possui estado `FROZEN`;
- politica seleciona controle ou V2 de forma deterministica;
- allowlist e flag publica permanecem desativadas;
- fallback funciona em erro, timeout e baixa confianca;
- filtros eliminatorios continuam antes da personalizacao;
- consentimento, revogacao e idempotencia passam;
- diagnostico nao contem PII ou sinal individual;
- nenhum modelo foi executado sobre reserva;
- suite, builds, lint e diff passam;
- testes focados passam tres vezes;
- rollout publico permanece zero;
- checkpoint esta completo;
- nenhuma operacao remota, commit, push ou deploy ocorreu.

## Aceleracao segura para 07/10

Pode ficar marcado como `PREPARADO`:

- executor de validacao offline separado;
- checklist para desenvolvimento, validacao e reserva;
- auditoria de diagnosticos;
- matriz de falhas por modelo;
- contrato de observabilidade;
- plano de homologacao interna com rollout zero.

Nao pode ficar marcado como concluido:

- execucao da reserva;
- validacao final offline;
- homologacao;
- rollout;
- release.

## Entrega final

Ao terminar, apresente:

1. decisao do marco;
2. confirmacao de que o Dia 05 continua aprovado;
3. arquivos criados ou alterados;
4. hash e estado da candidata;
5. ponto de integracao no planejamento;
6. politica de ativacao;
7. allowlist, flag e kill switch;
8. fallback e isolamento de falhas;
9. filtros e candidatos comuns;
10. consentimento, revogacao e idempotencia;
11. diagnostico e privacidade;
12. testes, builds, lint e diff;
13. confirmacao de formulas inalteradas;
14. confirmacao de que nenhuma reserva foi acessada;
15. confirmacao de rollout publico zero;
16. limitacoes;
17. trabalho preparado para 07/10;
18. entrada exata do proximo marco: executar validacao offline e reserva somente conforme protocolo, sem recalibrar depois dos resultados.

Nao confunda integracao controlada com rollout publico, fallback com vitoria da V2, diagnostico com PII, allowlist com homologacao geral ou candidata congelada com IA validada comercialmente. O objetivo do Dia 06 e colocar a V2 congelada dentro do fluxo real sob limites claros e reversiveis.
