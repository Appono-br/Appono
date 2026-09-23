# Checkpoint da Appono.AI - 01/10/2026

## Decisao

`PACOTE_CEGO_CONCLUIDO`

Data planejada: `01/10/2026`. Execucao antecipada: `23/09/2026`, no fuso `America/Sao_Paulo`.

O instrumento de revisao humana foi gerado, auditado e congelado. Nenhum julgamento humano foi preenchido, nenhum modelo foi executado e nenhuma reserva foi acessada.

## Pre-condicoes e estado inicial

- branch: `main`;
- `HEAD` inicial: `d35b8a61ceb497772187085cc1d3991d33b00631`;
- arvore de trabalho inicialmente limpa;
- Dia 30: `GUARDRAILS_CONCLUIDOS`;
- guardrails canonicos: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- auditoria de guardrails canonica: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`;
- 53 regressoes classificadas e 24 candidatos tecnicos preselecionados;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`.

## Protocolo cego

- versao: `routine-blind-review-v1`;
- arquivo SHA-256: `b5aba66abde0be97f2719a8d4431301db868de6dda28bce419d9adfe1770a23f`;
- hash canonico: `6f2753bb307712ae86203085d7e1fb71bee69eb456535e8affd420a1aabfb6ae`;
- estado: `REGISTERED_UNJUDGED`;
- quantidade pre-registrada: 24 casos;
- fonte primaria: validacao, com minimo de 12 casos;
- limite suave: quatro casos por persona, relaxavel somente depois das coberturas obrigatorias;
- reserva: proibida como fonte e como argumento da CLI.

A semente foi derivada por SHA-256 dos componentes publicos congelados `routine-blind-review-v1`, `2026-10-01`, hash canonico da auditoria de guardrails e hash canonico da comparacao. Resultado: `901bc28bcaab1780efd6644414ee201d5836869914587f7217c46b05f36c8927`.

## Amostragem

Foram selecionados 24 cenarios unicos com escolhas nativas, distintas e elegiveis, sem fallback ou erro tecnico:

| Dimensao | Distribuicao interna |
| --- | --- |
| Conjunto | 14 validacao; 10 desenvolvimento |
| Comparador | 21 V1 x V2; 3 controle x V2 |
| Historico | 18 `SHARED_HISTORY`; 6 `TRAJECTORY_OUTCOME` |
| Semanas | todas as seis semanas cobertas |
| Personas | nove personas com divergencia elegivel |

`controle_sem_historico` nao aparece porque nao possui divergencia elegivel nos resultados congelados. Isso e ausencia objetiva de par, nao exclusao por qualidade. As nove personas observadas incluem todos os perfis com desacordos elegiveis; nenhuma excedeu quatro casos.

As classificacoes internas cobertas foram pouca confianca, preferencia explicita perdida, distancia, preco, contradicao e hipoteses para V2.1. Classificacao, prioridade e delta nao aparecem no pacote distribuivel.

## Contexto e trajetorias

As sequencias foram reconstruidas exclusivamente das decisoes anteriores nos relatorios congelados, sem nova execucao. Casos com sequencias equivalentes usam `SHARED_HISTORY`; casos cujas ramificacoes divergiram usam `TRAJECTORY_OUTCOME` e mostram uma sequencia anonimizada para cada lado. Nenhum evento futuro entra no contexto.

Restaurantes e produtos recebem aliases locais ao caso. O pacote exibe somente objetivo sintetico, preferencias, aversoes gastronomicas, janela, momento virtual, faixas de orcamento e distancia, sequencia recente e atributos neutros das duas opcoes elegiveis.

## Randomizacao e balanceamento

A ordem dos casos usa ordenacao por digest SHA-256 derivado da semente. A orientacao A/B e balanceada deterministicamente por conjunto e comparador, com diferenca maxima de uma unidade por estrato.

No agregado interno, a V2 aparece 12 vezes em A e 12 vezes em B. A repeticao da geracao produz os mesmos bytes, independentemente da ordem original dos arrays de entrada.

## Pacote e chave

- conteudo canonico do pacote: `15783281156afc526a2a5c5dbf8361ceba510bf93db7d73384fd30bbbd26b668`;
- arquivo `package.json`: `c869b431b92c3bfb952b7a741a32fd11f3bc0ff844e19cdea33eff464ea751c7`;
- formulario CSV: `c41d83b0211d47567926e02feb5ba37d35a896de5808b16c39031a4e3a6ee551`;
- template de respostas: `80f218c0c4362b45628e64fe544f3c3b88561593c4da63c1a4ccddb60fd08b6e`;
- compromisso canonico da chave: `1313c2dee80fc64028f430bb1c60df17316757e776c9c7d0670c68770e4c325a`;
- arquivo interno da chave: `235f63dfa5f94d7ccc20d33a070fcb522fffdf2b3acb941ec46d9bfbc0727891`.

A chave fica em `prospective/internal`, fora do diretorio distribuivel. O manifesto publico registra somente o compromisso, hashes dos arquivos publicos, modos de comparacao e perfis anonimos. Nao referencia o caminho interno.

## Formulario e cegamento

As respostas aceitas sao `A`, `B`, `EMPATE` e `INDETERMINADO`, com motivos estruturados e confianca humana `BAIXA`, `MEDIA` ou `ALTA`. O template possui 24 respostas vazias e `reviewer_code: null`.

A validacao usa lista permitida de campos e rejeita caso desconhecido ou duplicado, escolha ou motivo fora do enum, nota longa ou privada, pacote divergente e campo inesperado. A auditoria do diretorio distribuivel confirmou ausencia de identificadores dos modelos, scores, ajustes, confianca do modelo, amostras, utilidade, arrependimento, classificacao, prioridade, IDs brutos, PII, credenciais e caminho da chave. `review_confidence` e exclusivamente a confianca futura do avaliador humano.

## Arquivos

Criados:

- `backend/experiments/routine-intelligence/blind-review-protocol-v1.json`;
- `backend/src/domain/routine-intelligence-blind-review.js`;
- `backend/scripts/generate-routine-intelligence-blind-review.js`;
- `backend/test/routine-intelligence-blind-review.test.js`;
- `backend/reports/routine-intelligence/prospective/blind-review-v1/`;
- `backend/reports/routine-intelligence/prospective/internal/blind-review-key-v1.json`;
- este checkpoint.

Alterados:

- `backend/package.json`, para registrar `generate:rotina:blind-review`;
- calendario, somente para concluir 01/10.

## Verificacoes

- testes focados do pacote: 11/11 aprovados em tres execucoes consecutivas;
- geracao `--write`: aprovada uma vez nos destinos novos;
- geracao `--check`: igualdade byte a byte aprovada;
- `--help`: nenhuma escrita;
- tentativa de reserva: recusada;
- 24 pares: escolhas nativas distintas, elegiveis, sem fallback e sem erro;
- respostas humanas preenchidas: zero;
- modelos executados neste marco: zero.

- suite backend: 274/274 testes aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- CLIs anteriores em modo de verificacao e auditoria: aprovadas;
- `git diff --check`: aprovado.

## Integridade e limitacoes

Os hashes dos snapshots, relatorios brutos, formulas, metricas, comparacao e guardrails permaneceram inalterados. Controle, V1, V2 e utilidade das personas nao foram modificados nem recalibrados. Nenhuma operacao remota, banco, Supabase, pagamento, e-mail, migration, deploy, commit ou push ocorreu.

O pacote e uma amostra intencional de desacordos sinteticos. Nao representa populacao, clientes reais, experimento online, consenso ou validacao comercial. Um unico revisor fornecera apenas evidencia auxiliar.

## Preparado para 02/10

`PREPARADO`: validador de respostas, compromisso verificavel da chave, separacao entre pacote e chave, schema de motivos e dados internos para agregacao posterior.

Continua aberto: obter respostas humanas reais, congelar as respostas, verificar o hash do pacote, abrir a chave somente depois desse congelamento e decidir se a evidencia sustenta uma hipotese geral para V2.1 ou a manutencao da V2 sem ajuste.
