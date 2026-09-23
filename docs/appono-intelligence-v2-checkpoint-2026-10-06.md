# Checkpoint da Appono.AI - 06/10/2026

## Decisao

Decisao do marco: `INTEGRACAO_CONTROLADA_CONCLUIDA`

Data planejada: `06/10/2026`. Execucao antecipada: `23/09/2026`, no fuso `America/Sao_Paulo`.

A V2 congelada foi conectada ao planejamento de rotina existente sob politica deterministica, allowlist interna, fallback para o controle e diagnostico operacional seguro. Nenhum rollout publico, homologacao geral, reserva ou validacao comercial foi realizado.

## Pre-condicoes

- Dia 05: `CANDIDATA_V2_CONGELADA`;
- manifesto da candidata: `FROZEN`;
- candidata: `appono-intelligence-v2`;
- controle/fallback: `deterministico-v3`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- revisao humana: `REVISAO_HUMANA_PENDENTE`, respostas validas `0`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`;
- reserva prospectiva: `SEALED_UNMATERIALIZED`;
- rollout publico: `0`;
- branch: `main`;
- HEAD inicial: `ec79d848d6336b2c1ade8a7731d7f7f7404a324f`;
- arvore inicial: limpa, exceto o prompt do Dia 06 nao rastreado.

## Integracao

O ponto de entrada permanece `POST /api/rotina/planejamento/gerar`, que usa `gerarPlanejamentoRotina` e a politica congelada. A ordem operacional e:

1. validar sessao, perfil, janela, agenda, funcionamento, disponibilidade, raio, orcamento e elegibilidade;
2. construir o universo comum antes da personalizacao;
3. aplicar consentimento e sinais elegiveis;
4. exigir o gate local da candidata `FROZEN`;
5. usar V2 somente quando flag e allowlist interna permitirem;
6. manter controle em flag desligada, fora da allowlist, kill switch, baixa confianca, erro ou candidato ausente.

O gate verifica estado `FROZEN`, candidata, hash canonico do relatorio, reserva nao acessada e rollout zero. Qualquer divergencia desativa V2 e retorna ao controle.

## Diagnostico seguro

Foi criado `routine-intelligence-operational.js`. Cada refeicao decidida recebe `diagnostico_inteligencia` com lista fechada de origem `V2` ou `CONTROLE`, versao tecnica, versao da politica, candidata congelada, `fallback_used`, codigo tecnico, faixas de confianca e amostras, guardrails aplicados e identificador tecnico deterministico da solicitacao.

O diagnostico nao inclui score, ajuste, sinal individual, texto livre, PII, agenda, credencial ou objeto de ambiente. O RPC existente ja persiste `metadados` como JSONB; nenhuma migration foi criada ou executada.

## Fallback, consentimento e idempotencia

- baixa confianca preserva o limiar congelado de `0.25`;
- falha da V2 nao interrompe o planejamento;
- fallback nunca e marcado como decisao nativa da V2;
- consentimento continua obrigatorio para personalizacao;
- revogacao remove efeito futuro dos sinais;
- sinais permanecem ativos, anteriores e idempotentes conforme contratos existentes;
- o RPC atomico de geracao preserva a idempotencia de planejamento e conversoes;
- nenhum feedback e escrito como efeito colateral da recomendacao.

## Hashes preservados

- manifesto canonico: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- manifesto SHA-256 do arquivo: `a5512c565b3dcf4802517f85bfab94b59d45af77ac6c5fc78f9c21de60bce12f`;
- relatorio canonico: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`;
- relatorio SHA-256 do arquivo: `76d6a6df215c66aee8426aa12609a40932f865ef5a6eea660c2f1dfc448e63aa`;
- scoring: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- controle: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- guardrails: `185705b2e9dc74296db23cea68b14bd1c7f2415288b718058b19bba33e8ae38c`;
- auditoria de guardrails: `27480414de60dbd0e9c4b009ee1b715f4c8497738a97a95b653a1b9b57e06121`;
- pacote cego: `15783281156afc526a2a5c5dbf8361ceba510bf93db7d73384fd30bbbd26b668`;
- compromisso da chave: `1313c2dee80fc64028f430bb1c60df17316757e776c9c7d0670c68770e4c325a`.

## Arquivos

Criados ou alterados neste marco:

- `backend/src/domain/routine-intelligence-operational.js`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/routes/routine.js`;
- `backend/test/routine-intelligence-operational.test.js`;
- este checkpoint;
- calendario, marcando somente 06/10 como concluido.

## Verificacao

- suite backend: `290/290` aprovados;
- testes focados de integracao operacional: `46/46` aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- `git diff --check`: aprovado;
- decisor, pacote cego, simulacoes, metricas, guardrails, cenarios e particoes: `--check` aprovados;
- desenvolvimento e validacao: `300` cenarios e `900` execucoes cada, hashes preservados;
- reserve acessada: `false`;
- modelos executados em escrita: `0`;
- novos placares produzidos: `0`.

## Garantias negativas

- formulas, pesos, limites, desempates e V2 nao foram alterados;
- nenhuma V2.1 foi implementada;
- nenhum snapshot, relatorio, pacote cego ou chave foi regenerado;
- nenhuma migration, operacao remota, pagamento, e-mail, reserva ou Supabase remoto foi executado;
- nenhuma resposta humana foi inventada;
- rollout publico permanece `0`;
- homologacao e release permanecem abertos para marcos posteriores.

## Limitacoes e proximo marco

A integracao foi validada por testes locais e contratos existentes; o banco remoto e o fluxo de homologacao nao foram executados. O diagnostico operacional e seguro, mas a eficacia para clientes reais continua nao demonstrada.

Para 07/10: executar validacao offline e a reserva somente conforme protocolo, sem recalibrar depois dos resultados.
