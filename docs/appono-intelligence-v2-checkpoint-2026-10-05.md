# Checkpoint da Appono.AI - 05/10/2026

## Decisao

Decisao do marco: `CANDIDATA_V2_CONGELADA`

Data planejada: `05/10/2026`. Execucao antecipada: `23/09/2026`, no fuso `America/Sao_Paulo`.

A V2 atual foi congelada formalmente depois da bateria final de regressao. O congelamento nao representa superioridade contra a V1, validacao comercial, homologacao ou release.

## Pre-condicoes

- Dia 04: `RESERVA_TECNICA_CONCLUIDA`;
- riscos do Dia 04: `13/13 PASS`, `0 OPEN`, `0 BLOCKED`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- revisao humana: `REVISAO_HUMANA_PENDENTE`;
- respostas humanas validas: `0`;
- manifesto inicial: `PREPARED_FOR_FREEZE`;
- manifesto final: `FROZEN`;
- branch: `main`;
- `HEAD` inicial: `fadfcdb` (`Conclui auditoria de prontidao da Appono.AI`);
- arvore inicial: limpa;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`.

## Candidata congelada

- candidata: `appono-intelligence-v2`;
- controle: `deterministico-v3`;
- referencia: `appono-intelligence-v1`;
- utilidade: `persona-utility-v1`;
- estado: `FROZEN`;
- manifesto: `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`;
- manifesto hash canonico: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- manifesto SHA-256 do arquivo: `a5512c565b3dcf4802517f85bfab94b59d45af77ac6c5fc78f9c21de60bce12f`;
- relatorio: `backend/reports/routine-intelligence/prospective/final-candidate-freeze-v1.json`;
- relatorio hash canonico: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`;
- relatorio SHA-256 do arquivo: `bfcaf71f4ef7a2c6bec4b86b60606e77a959984baf6f4f0887017f79d02e4641`.

O manifesto identifica a mesma candidata auditada nos Dias 02 a 04. Nenhum peso, limite, decaimento, suavizacao, desempate ou filtro foi alterado.

## Hashes preservados

- scoring: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- controle: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- contrato longitudinal: `f4194266319ad080648b7bb82e4a03b57ee0edbae0833837c6ecc1a4a4d18e1a`;
- guardrails de codigo: `f205b05666b8607f69f2fe1136dc777d70791d16ca8c9377377c1c02038f9eeb`;
- snapshot de desenvolvimento: `2bfb0164ad2c886b1ce9f8231568c5ca5158e18a27791943728cc8e1d92cd69`;
- snapshot de validacao: `92c91f5d1ebc33cad1ea60d1bc192e3a7e6967f8716b9fbe06a8c4eb0021a0a6`;
- bruto de desenvolvimento: `e71c128fa04d567182497d621c32c9eb22fd8783f9e3560300662d6926f02b57`;
- bruto de validacao: `3a6cdb5121f28a337a9448e14382de91a6b0506933be5dd126002edd1328c7fc`;
- metricas de desenvolvimento: `44cbbde4fafc9414f90d46487c1daf91e12d66ebb7ecca1814425be6cb4197e3`;
- metricas de validacao: `27592b75a9f4888af8ec1f43fe5cb98117e530de79292ebc2857f7a83d8c35fa`;
- comparacao: `26bdeba2d2cc4ca42d2f4c4ce3fbf2fa9d4dc646182d85d5200c17270bdecf2a`;
- guardrails: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- auditoria de guardrails: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`;
- pacote cego: `15783281156afc526a2a5c5dbf8361ceba510bf93db7d73384fd30bbbd26b668`;
- compromisso da chave: `1313c2dee80fc64028f430bb1c60df17316757e776c9c7d0670c68770e4c325a`.

## Bateria final

- suite backend: `286/286` aprovados;
- testes focados do decisor: `12/12` em tres execucoes;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- decisor `--check`: aprovado;
- pacote cego `--check`: aprovado;
- simulacao de desenvolvimento `--check`: 300 cenarios, 900 execucoes, hash preservado;
- simulacao de validacao `--check`: 300 cenarios, 900 execucoes, hash preservado;
- avaliacao longitudinal `--check`: aprovada, hashes preservados;
- auditoria de guardrails: 53 regressoes, 24 candidatos, aprovada;
- auditoria de cenarios: intersecao zero, aprovada;
- auditoria de particoes: isolamento aprovado;
- `git diff --check`: aprovado.

Nao foram executados modelos em modo de escrita. Nenhum novo placar foi produzido.

## Guardrails e operacao

Foram confirmados:

- candidatos elegiveis antes da personalizacao;
- filtros eliminatorios intactos;
- grupo sem historico neutro;
- baixa confianca com fallback para o controle;
- falha da V2 isolada;
- consentimento, revogacao, atividade e idempotencia;
- estado isolado por modelo, persona e conjunto;
- explicacao por lista permitida;
- kill switch disponivel;
- rollout publico zero.

## Limitacoes

- resultados sinteticos e offline;
- ausencia de clientes reais;
- revisao humana pendente;
- V2 permanece pior que a V1 no criterio congelado de arrependimento;
- congelamento tecnico nao equivale a validacao comercial;
- integracao operacional ainda nao foi realizada.

## Arquivos criados ou alterados

- `backend/experiments/routine-intelligence/final-candidate-freeze-v1.json`;
- `backend/reports/routine-intelligence/prospective/final-candidate-freeze-v1.json`;
- este checkpoint;
- calendario, marcando somente 05/10 como concluido.

## Garantias negativas

- nenhuma V2.1 foi implementada;
- nenhuma formula foi recalibrada;
- nenhum snapshot ou relatorio prospectivo anterior foi regenerado;
- nenhuma reserva foi acessada;
- nenhuma resposta humana foi inventada;
- nenhum rollout publico foi ativado;
- nenhuma operacao remota ocorreu;
- nenhum commit ou push ocorreu neste marco.

## Entrada exata do proximo marco

Em 06/10, integrar a V2 congelada ao planejamento real somente sob politica, allowlist interna e fallback deterministico, persistindo apenas diagnosticos seguros. O rollout publico deve permanecer em `0`.
