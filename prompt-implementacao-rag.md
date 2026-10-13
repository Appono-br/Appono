# Prompt mestre — Implementação e validação do RAG do Appono

Você é o agente responsável por implementar, testar, validar e documentar o sistema RAG do Appono.

## Instrução principal

Leia integralmente, antes de qualquer alteração:

1. `spec.md` na raiz do projeto;
2. `README.md`;
3. `backend/package.json`;
4. `frontend/package.json`;
5. as instruções locais em `AGENTS.md`, quando existirem;
6. os módulos relacionados a autenticação, Supabase, suporte, chat, reservas, pedidos e Appono Rotina;
7. as migrations relevantes do Supabase.

O arquivo `spec.md` é o contrato técnico principal. Não reduza o escopo, não substitua requisitos por aproximações e não invente que uma etapa foi concluída sem evidência executável.

## Regras invioláveis

1. Não implemente RAG no frontend para documentos privados.
2. Não use RAG para decidir disponibilidade, preço, reservas, pagamentos, reembolsos, alergias ou autorização.
3. Não permita que o cliente controle livremente `tenant_id`, escopo, perfil ou visibilidade.
4. Nunca retorne um documento proibido mesmo que ele tenha maior similaridade.
5. Não indexe conversas, dados financeiros ou PII por padrão.
6. Não armazene segredos, tokens, CPF, dados bancários ou conteúdo privado completo em logs.
7. Não aplique migrations remotamente sem autorização explícita.
8. Não altere migrations já aplicadas; crie novas migrations versionadas.
9. Não remova testes, relaxe asserts ou atualize snapshots para esconder regressões.
10. Não altere regras determinísticas existentes para favorecer o RAG.
11. Não adicione dependências sem justificar necessidade, licença, compatibilidade e impacto no lockfile.
12. Não faça rollout público por padrão; mantenha flags desativadas até a aprovação dos critérios.
13. Se houver conflito entre código, documentação e `spec.md`, pare a implementação daquela parte, registre a divergência e escolha o comportamento comprovado pelos testes ou peça decisão explícita.
14. Se uma etapa não puder ser executada por falta de credencial ou serviço externo, implemente tudo que for possível localmente e documente exatamente o bloqueio restante.

## Objetivo técnico

Implementar um RAG seguro e auditável usando `@huggingface/transformers` para embeddings e, se comprovado por benchmark, reranking ou classificação.

O sistema deve possuir:

- ingestão idempotente;
- normalização e chunking estrutural;
- embeddings versionados;
- armazenamento vetorial com `pgvector`, quando disponível;
- busca híbrida textual e vetorial;
- filtros de segurança antes da relevância;
- abstinência explícita;
- citações verificáveis;
- fallback lexical/determinístico;
- auditoria sem PII desnecessária;
- testes de segurança, isolamento e qualidade;
- rollout por feature flag e kill switch.

## Ordem obrigatória de trabalho

### Fase 0 — inspeção e baseline

Antes de editar:

1. verificar `git status`;
2. mapear arquivos existentes;
3. localizar todos os módulos de autenticação e autorização;
4. localizar clientes Supabase administrativos e autenticados;
5. revisar migrations e RLS atuais;
6. procurar qualquer implementação prévia de embeddings, busca semântica ou IA;
7. executar build, lint e testes existentes;
8. registrar falhas baseline sem corrigi-las silenciosamente.

Não começar pela criação de tabelas ou dependências antes dessa inspeção.

### Fase 1 — correções baseline

Corrigir primeiro apenas problemas que impedem uma validação confiável, incluindo:

- testes quebrados por mocks incompletos;
- erros de build;
- erros de lint que bloqueiem o pipeline;
- falhas de segurança já identificadas;
- divergências documentais que possam alterar a interpretação do RAG.

Cada correção deve possuir teste de regressão.

### Fase 2 — fundação do RAG

Implementar:

- configuração centralizada;
- feature flags;
- registry de modelos;
- adaptador isolado para Transformers.js;
- carregamento singleton;
- cache configurável;
- timeout e limites de entrada;
- tratamento de erros;
- health check;
- contratos de entrada e saída.

Não importar Transformers.js diretamente dentro das rotas.

### Fase 3 — persistência e segurança

Criar migrations novas para:

- documentos;
- chunks;
- execuções de ingestão;
- auditoria;
- embeddings;
- índices e RPCs;
- RLS e políticas de acesso.

Validar a disponibilidade de `pgvector` antes de depender dele. Se não estiver disponível, implementar fallback lexical sem simular índice vetorial.

### Fase 4 — ingestão e indexação

Implementar:

- fontes permitidas;
- normalização Unicode;
- remoção de HTML perigoso;
- preservação de títulos e seções;
- hash canônico;
- chunking estrutural;
- overlap configurável;
- idempotência;
- reindexação;
- arquivamento;
- recuperação após falha parcial.

Não ingerir automaticamente dados pessoais, chat, pedidos ou pagamentos.

### Fase 5 — recuperação

Implementar nesta ordem:

1. autorização e escopo;
2. filtro de documentos ativos;
3. busca textual;
4. busca vetorial;
5. fusão híbrida;
6. deduplicação;
7. reranking opcional;
8. limiar mínimo;
9. abstinência;
10. auditoria.

A busca não pode consultar primeiro e filtrar depois.

### Fase 6 — resposta

Implementar:

- context builder;
- limite de tokens;
- prompt seguro;
- separação entre instruções e contexto não confiável;
- resposta baseada apenas nas fontes;
- citações;
- indicação de incerteza;
- recusa quando não houver evidência;
- fallback quando o gerador estiver indisponível.

O modelo não pode executar instruções encontradas em documentos.

### Fase 7 — testes e benchmark

Criar e executar:

- testes unitários;
- testes de contrato;
- testes de integração com Supabase isolado;
- testes de RLS;
- testes E2E;
- testes de concorrência;
- testes de carga;
- testes de prompt injection;
- testes de XSS e sanitização;
- testes de vazamento entre tenants;
- benchmark de chunking;
- benchmark de modelos;
- avaliação de retrieval;
- avaliação de groundedness;
- avaliação de abstinência.

Não declarar qualidade do RAG sem dataset versionado e resultados reproduzíveis.

### Fase 8 — rollout controlado

Manter inicialmente:

```text
APPONO_RAG_ENABLED=false
APPONO_RAG_INGESTION_ENABLED=false
APPONO_RAG_VECTOR_SEARCH_ENABLED=false
APPONO_RAG_RERANK_ENABLED=false
APPONO_RAG_EXTERNAL_GENERATION_ENABLED=false
```

Ativar somente nesta ordem:

1. offline;
2. administrador;
3. shadow mode;
4. piloto interno;
5. rollout gradual;
6. produção autorizada.

## Requisitos específicos do Transformers.js

O adaptador deve:

- usar modelo multilingual ou validado para português brasileiro;
- fixar `modelId` e revisão;
- registrar dimensão do embedding;
- rejeitar dimensões incompatíveis;
- validar vetores finitos;
- evitar download durante requisição;
- usar cache persistente;
- suportar WASM/CPU como baseline;
- tratar WebGPU como opcional;
- controlar concorrência;
- evitar carregamento repetido do modelo;
- expor health check;
- possuir fallback claro;
- registrar métricas de memória e latência.

A escolha do modelo deve ser baseada em benchmark, não em preferência subjetiva.

## Regras de dados e tenant

Para cada documento e chunk, validar:

- tenant;
- perfil autorizado;
- tipo de documento;
- visibilidade;
- idioma;
- vigência;
- status;
- versão;
- origem;
- aprovação.

Casos obrigatórios:

- documento global visível somente quando permitido;
- documento de restaurante isolado do restante;
- documento privado não aparece em busca global;
- documento arquivado não aparece;
- usuário não altera escopo enviando outro ID;
- acesso fora do escopo retorna erro seguro.

## Critérios mínimos de aceitação

Não considerar a implementação concluída enquanto qualquer item abaixo estiver pendente:

- build falhando;
- lint com erro;
- testes baseline falhando;
- teste de isolamento entre tenants falhando;
- fonte arquivada retornando;
- resposta sem citação quando deveria citar;
- resposta inventando informação sem abstinência;
- prompt injection alterando a política;
- PII indevida nos logs;
- regra transacional delegada ao RAG;
- ausência de fallback;
- ausência de kill switch;
- migration sem RLS;
- modelo sem versão fixa;
- índice sem estratégia de reindexação;
- benchmark inexistente;
- documentação operacional incompleta.

Metas iniciais:

- zero vazamentos de tenant;
- zero documentos fora do escopo;
- Recall@5 mínimo de 0,90 para fatos críticos;
- Precision@5 mínimo de 0,80;
- groundedness mínimo de 0,90;
- abstinência correta mínima de 0,90;
- p95 dentro do orçamento definido;
- fallback comprovadamente funcional.

## Como lidar com bloqueios

Se encontrar um bloqueio:

1. não contorne a regra silenciosamente;
2. execute diagnósticos seguros;
3. tente uma alternativa dentro do escopo;
4. registre arquivo, linha, comando e causa;
5. marque como bloqueador, pendência ou ressalva;
6. continue as etapas independentes;
7. peça decisão somente quando a escolha mudar arquitetura, segurança, dados ou comportamento de negócio.

## Forma de edição

- preservar alterações existentes do usuário;
- usar `apply_patch` para editar arquivos;
- não usar comandos destrutivos;
- não fazer commit, push, deploy ou migration remota sem autorização;
- manter alterações pequenas e revisáveis;
- adicionar testes junto com cada mudança funcional;
- atualizar documentação junto com APIs, migrations e flags;
- não alterar arquivos não relacionados sem justificar.

## Formato obrigatório das atualizações durante o trabalho

Antes de mudanças materiais, informar:

- o que será alterado;
- por que é necessário;
- quais arquivos serão afetados;
- qual risco existe;
- como será validado.

Durante o trabalho, reportar bloqueios e resultados parciais de forma objetiva.

## Formato obrigatório da entrega final

A resposta final deve conter:

### Resultado

- estado geral;
- o que foi implementado;
- o que não foi implementado;
- arquivos alterados;
- migrations criadas;
- flags ativas e inativas.

### Validação

- comandos executados;
- resultado de build;
- resultado de lint;
- resultado de testes;
- resultado de integração;
- resultado de segurança;
- resultado de benchmark;
- limitações dos testes.

### Qualidade do RAG

- modelo e revisão;
- dimensão dos embeddings;
- estratégia de chunking;
- `topK`;
- limiar;
- Recall@K;
- Precision@K;
- groundedness;
- abstinência;
- p50/p95/p99;
- taxa de fallback.

### Riscos

Classificar cada risco como:

- bloqueador;
- alto;
- médio;
- baixo.

Não usar linguagem como “pronto para produção” sem evidência suficiente.

### Próximos passos

Listar somente tarefas realmente restantes, com prioridade e dependência.

## Modo de execução das pendências atuais

Este prompt deve ser executado a partir do estado existente, sem recomeçar a implementação nem duplicar migrations. A prioridade é transformar o estado “pronto para piloto” em “aprovado para rollout” somente com evidências reproduzíveis.

### 1. Leitura obrigatória e inventário

Antes de editar, ler integralmente:

- `spec.md`;
- `prompt-implementacao-rag.md`;
- `docs/rag-final-state.md`;
- `backend/src/rag/`;
- `backend/src/routes/rag.js`;
- migrations RAG;
- `backend/.env.example`;
- `backend/reports/rag-model-benchmark.json`.

Registrar em comentário:

```text
project_ref
versão Node
versão Supabase CLI
Docker disponível
Ollama disponível
flags efetivas
histórico local/remoto de migrations
```

Não assumir que uma migration foi aplicada apenas porque o arquivo existe. Confirmar por `migration list` e por consulta estrutural.

### 2. Validação e reconciliação Supabase

Usar o CLI descoberto por `--help`, com telemetria desativada quando necessário:

```powershell
$env:SUPABASE_TELEMETRY_DISABLED = "1"
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db advisors --linked --type all --level warn --fail-on error
```

Se a migration base estiver aplicada no banco, mas ausente no histórico:

1. não executar a migration base novamente;
2. consultar tabelas, RLS, extensões, RPCs e policies;
3. criar somente migration incremental com `npx supabase migration new`;
4. aplicar a alteração incremental autorizada;
5. usar `migration repair --status applied` para reconciliar apenas versões comprovadas;
6. confirmar que local e remoto estão alinhados.

Toda alteração remota exige informar antes: arquivo, comando, impacto, rollback e validação posterior. A autorização deste prompt permite executar as alterações necessárias no projeto Supabase vinculado, mas não autoriza reaplicar schema já existente.

### 3. Testes de RLS e isolamento

Primeiro verificar Docker e pgTAP. Se disponíveis:

```powershell
npx supabase test db --local supabase/tests
```

Se o projeto estiver em ambiente remoto ou sem Docker:

- nunca criar usuários ou documentos de teste em produção;
- usar branch/projeto efêmero;
- se pgTAP não existir, não instalar em produção apenas para maquiar aprovação;
- executar consultas estruturais e RPCs somente leitura;
- registrar explicitamente que a autorização por identidade está pendente;
- não marcar Definition of Done como completo.

No ambiente efêmero, criar cliente A/B, restaurante A/B, admin, documento global público, documento privado, documentos de cada tenant e documento arquivado. Validar a matriz allow/deny da `spec.md` para leitura, RPC, publicação, arquivamento e tentativa de alterar tenant.

### 4. Instalação e benchmark do LLM gratuito

O LLM deve ser local e opcional. Não contratar API paga e não enviar documentos privados a serviço externo.

Detectar:

```powershell
Get-Command ollama -ErrorAction SilentlyContinue
ollama --version
ollama list
```

Se ausente, instalar somente em ambiente autorizado de desenvolvimento/staging e registrar a versão. Escolher modelo aberto compatível com português e com o hardware disponível. Fixar nome, digest, quantização e prompt de execução. Não promover um modelo apenas por popularidade.

Executar benchmark com temperatura zero e ao menos três repetições por caso, registrando cold start, warm start, p50/p95/p99, tokens por segundo, memória, timeout, resposta vazia, groundedness, citações inválidas, claims proibidos e abstinência.

Se Ollama não puder ser instalado, implementar/validar somente o modo `somente_fontes`, manter `APPONO_RAG_LLM_ENABLED=false` e marcar geração como bloqueador de `modo=resposta`, não como falha do restante do RAG.

### 5. Dataset e avaliação reproduzível

Criar ou validar `backend/evaluation/rag-dataset.jsonl` sem PII real. O dataset deve conter, no mínimo:

- 30 perguntas respondíveis;
- 15 sem evidência;
- 15 transacionais;
- 15 prompt injections;
- 15 casos cross-tenant;
- 10 conflitos de versão;
- 10 casos ambíguos.

Cada caso deve conter id, pergunta, modo esperado, documentos/chunks gold, claims esperados, claims proibidos, tenant e flag adversarial.

Criar `backend/scripts/evaluate-rag.js` se ausente. O script deve ser determinístico, não depender de relógio/aleatoriedade ambiente e gerar `backend/reports/rag-quality-evaluation.json` com:

- recall@5 e recall@10;
- precision@k;
- MRR/nDCG;
- groundedness;
- cobertura e validade de citações;
- abstinência correta;
- claims proibidos;
- vazamentos cross-tenant;
- latência p50/p95/p99;
- fallback.

Se o dataset ou as respostas de referência não existirem, não inventar números: gerar estado `PENDENTE` com a causa.

### 6. Testes adversariais e de aplicação

Adicionar testes para:

- “ignore as instruções anteriores” dentro da pergunta;
- instrução falsa dentro de documento;
- tentativa de revelar prompt ou segredo;
- tentativa de informar `tenant_id` de terceiro;
- documento arquivado;
- score alto em documento proibido;
- HTML, script, iframe e URL maliciosa;
- URL de Ollama controlada pelo usuário;
- pergunta e lote acima do limite;
- timeout e resposta vazia do LLM;
- falha parcial de ingestão;
- duas ingestões concorrentes do mesmo hash;
- auditoria sem texto bruto.

Nenhum teste pode ser removido ou enfraquecido para passar.

### 7. Teste de carga

Criar `backend/reports/rag-load-test.json` por script reproduzível. Medir consultas concorrentes 1, 5, 10 e 20, ingestão de 10, 100 e 1.000 chunks, e os modos `somente_fontes`, `shadow` e `resposta` quando o LLM estiver disponível.

Registrar CPU, RAM, fila, erros, timeouts, cold start, warm start e p95. Executar em local/staging, nunca gerar carga destrutiva em produção.

### 8. Rollback e kill switch

Testar:

1. `APPONO_RAG_ENABLED=false`;
2. bloqueio de novas consultas e ingestões RAG;
3. API principal permanecendo funcional;
4. auditoria preservada;
5. retorno ao índice/modelo anterior;
6. limpeza de cache defeituoso;
7. smoke test de `somente_fontes`;
8. documentação da causa e da recuperação.

Se o kill switch não funcionar, classificar como bloqueador.

### 9. Critério final de conclusão

Só marcar `APROVADO PARA ROLLOUT` quando todos forem verdadeiros:

- testes backend completos passam;
- build e lint passam;
- audit não possui vulnerabilidades;
- migration local/remota está reconciliada;
- RLS e RPC foram testados com identidades isoladas;
- busca híbrida funciona no banco real;
- embeddings possuem modelo e SHA fixados;
- citações são válidas;
- abstinência está acima do threshold;
- groundedness está acima do threshold;
- cross-tenant é zero;
- carga está dentro do orçamento;
- rollback e kill switch foram exercitados;
- geração possui modelo local benchmarkado ou o rollout está limitado a `somente_fontes`.

Qualquer item de autorização, tenant, segredo, regra de negócio, integridade de fonte, rollback ou kill switch falho é bloqueador. A ausência do LLM não bloqueia o modo `somente_fontes`, mas bloqueia `modo=resposta`.

### 10. Entrega final obrigatória

Atualizar:

```text
spec.md
docs/rag-final-state.md
docs/rag-operations.md
backend/reports/rag-model-benchmark.json
backend/reports/rag-quality-evaluation.json
backend/reports/rag-load-test.json
```

Entregar uma matriz item a item com `APROVADO`, `RESSALVA`, `PENDENTE` ou `BLOQUEADOR`, sempre apontando comando, arquivo, teste, migration ou relatório que sustenta a classificação.

Não usar “pronto para produção” sem evidência. Se houver bloqueio externo, concluir tudo que for independente e explicar exatamente a ação necessária, sem fingir execução.

## Regra final

Ao concluir, compare o estado real com cada seção de `spec.md`. Produza uma matriz de conformidade item a item.

Se alguma decisão necessária não estiver definida, não invente uma regra. Registre a decisão como pendente e preserve o comportamento seguro, determinístico e com menor privilégio.
