# Checkpoint da Appono.AI - 07/10/2026

## Decisao

`VALIDACAO_RESERVA_CONCLUIDA`

Execucao antecipada em `23/09/2026`, fuso `America/Sao_Paulo`. A validacao offline congelada foi conferida e a reserva prospectiva foi aberta e executada uma unica vez pela CLI versionada `routine-reserve-opening-v1`, mediante autorizacao explicita registrada na sessao. A reserva historica nao foi usada.

Esta decisao mede a candidata congelada sob o protocolo sintetico. Nao declara superioridade comercial, homologacao, release ou V2.1.

## Pre-condicoes

- Dia 06: `INTEGRACAO_CONTROLADA_CONCLUIDA`;
- candidata: `appono-intelligence-v2`, estado `FROZEN`;
- decisao tecnica: `MANTER_V2_SEM_AJUSTE`;
- revisao humana: `REVISAO_HUMANA_PENDENTE`, respostas validas `0`;
- reserva historica: `OPENED_ONCE_CONTAMINATED`, intocada;
- rollout publico: `0`;
- nenhum cliente real, PII ou resposta humana foi usado;
- nenhum artefato congelado anterior foi sobrescrito.

## Abertura e isolamento

O protocolo novo `routine-reserve-opening-v1` exigiu candidata `FROZEN`, hash das particoes, compromisso SHA-256, confirmacao `OPEN_PROSPECTIVE_RESERVE`, destino novo e execucao unica. O arquivo privado local foi usado somente para conferir o compromisso; semente e salt nao foram registrados em relatorios ou no resumo.

Particao: `reserva_prospectiva_v1`.
Compromisso: `40d76edee52a621e1413ee5cb2f1f1fc7cb19deac9ec163d9229b14d45b38b77`.
SHA-256 do arquivo publico de compromisso: `0090784fb4dfd54603aef5581f14a2d4fc6950d9ba965ab2b34083aa8c908300`.
Particoes canonicas: `40f7bc5b657e77ce334cd3fb9d71c856f191f23392e66f3ceab076f20c710ab7`.
Estado antes: `SEALED_UNMATERIALIZED`. Estado apos: abertura unica auditada, sem reexecucao.

## Execucao

- reserva: `300` cenarios e `900` execucoes, igualmente distribuídas entre controle, V1 e V2;
- falhas: `0` por modelo;
- fallbacks: `0`;
- violacoes eliminatorias: `0`;
- recalibracao: `false`;
- reserva historica usada: `false`;
- dados reais usados: `false`;
- rollout publico: `0`.

Validacao preservada: desenvolvimento `300/900`, validacao `300/900`, sem falhas, fallbacks ou violacoes eliminatorias. Denominadores nao foram misturados.

## Artefatos novos e hashes

- protocolo: `backend/experiments/routine-intelligence/reserve-opening-protocol-v1.json`;
- CLI: `backend/scripts/run-routine-intelligence-reserve.js`;
- dominio: `backend/src/domain/routine-intelligence-reserve.js`;
- saidas internas: `backend/reports/routine-intelligence/prospective/internal/reserve-v1/`;
- opening manifest: `d042b27c965e78b8fab0a641f3e2da6b78c12e6ae10973bec0dafe828ba5942b`;
- snapshot: `reserva_prospectiva_v1`, `300` cenarios;
- relatorio bruto: `e802a706c1416ea2a4b785bfbb9e6717f7380dc7f1f4e7557c7265034d2bc700`;
- metricas: `d86f203fe79c51f8e7004ab90719a653b43a148c937a9714f379d7360de9e725`;
- resumo: `b1895dee210d3014f929562a85b658c0eca50774d0ba553756b8053dd0e79a5c`.

O snapshot interno contém somente o seed numérico derivado exigido pelo schema do gerador; auditoria por comparação confirmou que os valores privados `seed` e `salt` do arquivo local nao aparecem nos artefatos. Nenhum material privado foi colocado em diretorio distribuivel.

## Integridade preservada

- scoring: `0e276cd125b533dd5df381cdb95732804e3002ae31eb34efbdffe51694e31a18`;
- controle: `41dfae64aaae0b53ec81cc70bdd74ae0807f6b83a30348ff0f663dbfcea0831b`;
- V2: `f21157716c2c1c396dfc45bf89e66744c693bb98414906b893d7d82038335bc4`;
- politica: `a8523294dd8487bcbbcf47e0713a51230cb4565ca1131341b2682daace61dd69`;
- contrato longitudinal: `f4194266319ad080648b7bb82e4a03b57ee0edbae0833837c6ecc1a4a4d18e1a`;
- guardrails: `f205b05666b8607f69f2fe1136dc777d70791d16ca8c9377377c1c02038f9eeb`;
- manifesto congelado canonico: `b1910fc3d0b5b64333be8b08ebac3b661947ea9863b4249f5ae98bd9db26712b`;
- relatorio de congelamento canonico: `9a15814d7c33e34f3dd8a793c6b5f0bcb2565c8a5b4efaa48dcc465394367b54`.

Formula, pesos, limites, limiar, desempates, snapshots anteriores, pacote cego e chave permaneceram inalterados. Nenhum modelo foi executado fora da particao autorizada.

## Verificacao

- CLI de reserva `--write`: executada uma vez com sucesso;
- CLI de reserva `--check`: passou byte a byte;
- backend: `290/290` testes aprovados;
- build backend: aprovado;
- lint frontend: aprovado;
- build frontend: aprovado;
- `git diff --check`: aprovado;
- checks de decisao, pacote cego, simulacoes, metricas, guardrails, cenarios e particoes: aprovados;
- auditoria de privacidade: sem PII, segredo, salt, semente privada, cliente real ou material historico.

## Limitacoes e proximo marco

Os resultados sao sinteticos e nao substituem clientes reais. A ausencia de respostas humanas permanece ausencia, nao empate nem consenso. A reserva foi executada uma vez e nao pode orientar recalibracao posterior.

Preparado para 08/10: homologacao interna limitada, diagnostico seguro, fallback e rollout publico zero. Entrada exata: `ativar somente a homologacao interna autorizada, com allowlist, diagnostico seguro, fallback e rollout publico zero`.
