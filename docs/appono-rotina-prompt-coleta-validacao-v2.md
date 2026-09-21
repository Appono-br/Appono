# Prompt de coleta comportamental e validação da Appono Intelligence V2

Você é um agente sênior de produto, dados, segurança, Supabase e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Sua missão é preparar, implementar, testar e documentar o próximo ciclo da **Appono Intelligence V2**: coleta comportamental consentida, avaliação longitudinal em modo sombra e um painel interno de acompanhamento.

Não entregue somente análise, arquitetura, pseudocódigo ou um plano. Inspecione o repositório, implemente o que puder ser concluído com segurança, escreva migrations incrementais quando realmente necessárias, atualize backend e frontend, amplie os testes e produza evidências. Não faça commit, push, deploy, cobrança, envio de e-mail real nem aplique migrations remotamente sem autorização explícita.

## Objetivo central

Transformar a V2 atual, que já é um recomendador comportamental determinístico em modo sombra, em um experimento mensurável com sinais legítimos e consentidos.

O ciclo deve permitir:

1. coletar interações reais do cliente sem confundi-las com feedback gastronômico;
2. usar na personalização somente sinais que tenham base jurídica e consentimento aplicável;
3. manter clientes sem histórico como grupo de controle;
4. comparar `deterministico-v3`, `appono-intelligence-v1` e `appono-intelligence-v2` sobre as mesmas entradas;
5. acompanhar aceitação, conversão, diversidade, confiança e regressões em um painel administrativo privado;
6. decidir, com critérios objetivos e revisão humana, se a V2 deve continuar em sombra, iniciar piloto limitado ou ser rejeitada.

Esta tarefa não deve promover automaticamente a V2 e não deve implementar IA generativa. O modelo oficial continua sendo `deterministico-v3`.

## Estado atual obrigatório

- Frontend: Next.js/React em JavaScript.
- Backend: Node.js/Express em JavaScript.
- Banco, autenticação e RLS: Supabase/PostgreSQL.
- A V1 permanece congelada como referência histórica.
- A V2 está isolada em `backend/src/domain/routine-intelligence-v2.js`.
- A V2 usa ajuste entre `-8` e `+8`, confiança calibrada, decaimento temporal, suavização e proteção contra repetição.
- Sem histórico elegível, a V2 produz ajuste `0`, confiança `0` e mantém a escolha do controle.
- A tabela privada `avaliacoes_sombra_rotina` aceita múltiplos desafiantes por refeição.
- A migration `20260920220421_routine_intelligence_v2_metrics.sql` adiciona volume efetivo, consistência, diagnóstico agregado e falha segura.
- O teste remoto de 20/09/2026 gerou 50 comparações por modelo.
- A V2 concordou com o controle nas 50 refeições sem histórico, com confiança média zero e nenhuma violação detectável.
- A V1 manteve 26 concordâncias, 24 divergências e confiança média de 0,35 sem histórico.
- Atualmente, somente feedback elegível, ativo e consentido alimenta a personalização futura da V2.
- Aprovação, recusa, edição e solicitação de alternativa são telemetria experimental, mas não devem virar personalização silenciosa.

## Leitura obrigatória

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- `docs/appono-rotina-integridade-transacional.md`;
- `docs/appono-rotina-prompt-intelligence-v2.md`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-intelligence-v2.js`;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/routes/routine.js`;
- `backend/scripts/test-routine-shadow.js`;
- `backend/scripts/evaluate-routine-shadow.js`;
- `backend/scripts/seed-routine-evaluation.js`;
- migrations de rotina, feedback e avaliação sombra;
- testes de recomendação, rotas, feedback, conversão e avaliação sombra;
- fluxo atual de reservas, pedidos, pagamento sandbox, presença e avaliação.

Leia também as instruções locais do repositório. Para qualquer alteração Supabase, leia a skill Supabase, consulte o changelog e a documentação oficial atual e descubra a sintaxe do CLI com `--help`.

## Regras inegociáveis

1. Preserve alterações locais e tudo que já funciona.
2. Não altere a fórmula da V1.
3. Não altere o modelo oficial para favorecer a V2.
4. Não exponha telemetria, pesos, sinais privados ou avaliações sombra ao cliente.
5. Não use endereço, coordenada exata, conteúdo de agenda, alergia, token ou reclamação de suporte como dado de aprendizado.
6. Não use ausência de reclamação como feedback positivo.
7. Não use aprovação, clique, recusa ou conversão na personalização sem consentimento válido e verificável.
8. Feedback sem consentimento pode participar de métricas agregadas, mas não do ranking futuro.
9. Remoção de consentimento ou exclusão lógica deve retirar o efeito do sinal em novas recomendações.
10. Não insira feedback, reserva concluída, pedido entregue ou pagamento aprovado diretamente por SQL.
11. Não marque experiências como concluídas burlando o fluxo operacional.
12. Não execute pagamento real. Use apenas sandbox quando houver autorização específica.
13. Operações de coleta e avaliação devem ser idempotentes e limitadas às contas `[DEMO]`.
14. Nenhum script pode imprimir senha, access token, refresh token, magic link, token hash ou `service_role`.
15. A falha da coleta ou de qualquer desafiante nunca pode impedir a geração oficial.
16. A V2 permanece em modo sombra durante toda esta tarefa.
17. Não faça promoção automática, rollout real ou alteração visível das sugestões.
18. Não faça commit, push, deploy ou migration remota sem autorização explícita.

## Fase 1 — Auditoria dos sinais existentes

Mapeie todos os eventos atualmente produzidos pela rotina:

- sugestão gerada;
- sugestão aprovada;
- sugestão recusada;
- solicitação de alternativa;
- edição manual de restaurante, prato ou horário;
- conversão em reserva;
- conversão em pedido;
- pagamento aprovado, rejeitado ou expirado;
- presença confirmada;
- reserva concluída;
- pedido entregue;
- feedback positivo ou negativo;
- intenção de repetir;
- tags estruturadas;
- remoção do feedback ou revogação do consentimento.

Para cada evento, documente:

- tabela ou origem atual;
- instante confiável do evento;
- identidade e propriedade;
- elegibilidade para métricas;
- elegibilidade para personalização;
- necessidade de consentimento;
- política de retenção;
- risco de duplicidade;
- chave de idempotência.

Não trate telemetria operacional como consentimento. Caso o schema não consiga representar origem, consentimento, versão do consentimento, instante, revogação e idempotência, crie uma migration incremental mínima.

## Fase 2 — Consentimento comportamental explícito

Projete um consentimento claro e reversível para o uso de interações da Rotina na personalização.

Requisitos:

- consentimento desativado por padrão;
- finalidade curta e compreensível;
- registro da versão do texto aceito;
- instante de concessão e revogação;
- origem da alteração;
- possibilidade de revogar sem perder reservas, pedidos ou registros financeiros;
- revogação interrompe imediatamente o uso dos sinais em novas sugestões;
- histórico anterior à concessão não deve ser usado retroativamente sem regra explícita;
- feedback individual continua respeitando seu próprio `consentiu_personalizacao`;
- não criar consentimento implícito por uso do aplicativo.

Se for criada uma tabela de consentimento:

- habilite RLS;
- permita ao cliente consultar e alterar somente o próprio consentimento;
- impeça reatribuição de propriedade;
- mantenha auditoria mínima;
- revogue privilégios padrão;
- use função controlada para alterações sensíveis;
- não exponha outros clientes pela Data API.

Implemente a configuração na área apropriada do cliente, com acessibilidade, confirmação e explicação objetiva do efeito da revogação.

## Fase 3 — Entrada normalizada de sinais

Separe carregamento, normalização e pontuação. A V2 não deve consultar tabelas diretamente.

Crie um contrato interno normalizado contendo, quando aplicável:

- `id_sinal`;
- `tipo_evento`;
- `id_cliente` apenas na camada de persistência, nunca no diagnóstico do modelo;
- instante UTC;
- origem;
- consentimento válido;
- restaurante, produto, categoria e janela relacionados;
- atributos efetivamente escolhidos em uma edição;
- valor positivo, negativo ou neutro;
- chave de idempotência;
- versão do modelo que consumiu o sinal.

Regras de valor:

- feedback consentido e conversão elegível têm mais peso que aprovação;
- aprovação isolada deve ter peso baixo;
- recusa, alternativa e feedback negativo são sinais negativos distintos;
- edição ensina somente os atributos escolhidos pelo cliente;
- sinais contraditórios se compensam e reduzem confiança;
- sinais antigos sofrem decaimento;
- eventos repetidos com a mesma chave contam uma única vez;
- poucos eventos não podem dominar preferências explícitas;
- sinal sem consentimento válido recebe ajuste zero;
- eventos posteriores à revogação não personalizam;
- eventos excluídos logicamente não personalizam.

Evite N+1. Carregue ou agregue sinais em lote, com janela temporal limitada e índices coerentes com as consultas.

## Fase 4 — Coleta controlada nas contas DEMO

Crie um procedimento repetível e seguro para as dez contas `[DEMO]`.

Divida os perfis em grupos:

- controle sem histórico;
- econômico;
- explorador;
- fiel a favoritos;
- sensível à distância;
- avesso à repetição;
- feedback contraditório para testar confiança.

Automatização permitida:

- autenticação efêmera das contas `[DEMO]` sem imprimir tokens;
- geração da semana pela API real;
- aprovação, recusa e solicitação de alternativa pelas rotas reais;
- edição pelas rotas reais;
- repetição idempotente do experimento;
- relatório das ações concluídas e bloqueadas.

Automatização proibida:

- criar pagamento aprovado por SQL;
- marcar pedido como entregue por SQL;
- marcar reserva como concluída por SQL;
- inserir feedback diretamente na tabela;
- contornar elegibilidade de feedback;
- usar contas não identificadas como `[DEMO]`;
- executar qualquer ação financeira fora do sandbox.

Quando conversão completa não estiver autorizada ou disponível, colete somente aprovações, recusas, alternativas e edições legítimas. Documente que esses sinais servem à telemetria, mas não à personalização enquanto não houver consentimento comportamental válido.

Para feedback elegível, use o fluxo real:

```text
sugestão
→ confirmação do cliente
→ reserva ou pedido válido
→ pagamento sandbox quando necessário
→ conclusão operacional legítima
→ feedback pela rota real
→ consentimento explícito
```

## Fase 5 — Painel administrativo privado

Implemente um painel interno de avaliação acessível somente a administradores já autorizados pelo padrão do projeto.

O painel deve mostrar dados agregados, nunca sinais privados brutos:

- período avaliado;
- versão do controle e dos desafiantes;
- total de comparações;
- concordâncias e divergências;
- comparações com e sem histórico;
- distribuição de confiança;
- volume bruto e efetivo;
- consistência média;
- falhas por modelo;
- aprovação, recusa, alternativa, edição e conversão agregadas;
- feedback positivo e negativo elegível;
- diversidade de restaurante, produto e categoria;
- maior concentração da mesma opção;
- preço e distância médios, sem declarar que menor é sempre melhor;
- cobertura de preferências explícitas;
- violações eliminatórias, que devem permanecer zero;
- resultados da régua independente;
- comparação por perfil sintético;
- evolução por semana.

Segurança:

- não retornar endereço, coordenada, agenda, alergia, e-mail ou token;
- não expor tabela sombra diretamente ao navegador;
- agregar no backend ou banco;
- aplicar rate limit e autorização administrativa;
- evitar segmentos pequenos que permitam inferência individual;
- registrar acesso ao painel sem registrar conteúdo sensível;
- não incluir botão de promoção automática.

Crie estados de loading, vazio, erro e ausência de amostra. Diferencie claramente “sem dados”, “sem histórico” e “modelo sem confiança”.

## Fase 6 — Avaliação longitudinal

Evolua os scripts de teste e auditoria para comparar as mesmas entradas em várias semanas.

O relatório deve apresentar, por modelo:

- total de comparações;
- concordância e divergência;
- confiança média e distribuição;
- volume bruto, volume efetivo e consistência;
- resultados com e sem histórico;
- aprovação, recusa e conversão posteriores;
- feedback elegível;
- diversidade semanal;
- concentração por restaurante, prato e categoria;
- estabilidade entre semanas;
- violações eliminatórias;
- vitórias, derrotas e empates segundo a régua independente;
- exemplos de melhora e regressão;
- resultado por perfil comportamental.

Regras da auditoria:

- a régua deve ter versão explícita;
- não pode reutilizar os pesos da V2 para declarar a V2 vencedora;
- escolhas idênticas são empate;
- diferenças pequenas são inconclusivas;
- divergência não significa melhora;
- dados sintéticos não equivalem a validação real;
- resultado agregado não pode esconder regressão grave de segurança ou preferência explícita.

## Fase 7 — Testes obrigatórios

Amplie os testes para cobrir:

- consentimento desativado por padrão;
- concessão, atualização e revogação;
- acesso cruzado bloqueado;
- sinal antes do consentimento não usado indevidamente;
- revogação remove o efeito em nova recomendação;
- feedback individual sem consentimento não personaliza;
- exclusão lógica remove o efeito;
- duplicidade de evento não aumenta amostras;
- aprovação tem peso menor que conversão;
- recusa, alternativa e feedback negativo são distintos;
- edição ensina somente os atributos alterados;
- sinais contraditórios reduzem confiança;
- grupo sem histórico mantém ajuste e confiança zero;
- grupo de controle permanece estável;
- repetição excessiva perde posição;
- favorito pode repetir com evidência suficiente;
- limites de orçamento, raio, agenda, funcionamento e segurança permanecem eliminatórios;
- falha da coleta ou da V2 não quebra o planejamento;
- painel não retorna PII ou sinais brutos;
- somente administrador acessa métricas;
- scripts aceitam apenas contas `[DEMO]`;
- reexecução é idempotente;
- nenhum fluxo chama pagamento ou e-mail real.

Execute ao final:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute também os testes específicos de rotina, PostgreSQL e RLS quando o ambiente estiver disponível. Testes remotos exigem autorização explícita, ambiente de desenvolvimento e identificação exata dos dados temporários.

## Fase 8 — Critérios de decisão

Não promova a V2 nesta tarefa. Produza uma recomendação humana baseada nos seguintes critérios mínimos:

- pelo menos 100 experiências elegíveis;
- experiências distribuídas entre clientes, semanas, restaurantes e contextos;
- grupo de controle preservado;
- zero violações de segurança alimentar, orçamento, raio, agenda e funcionamento;
- confiança calibrada;
- estabilidade entre semanas;
- melhora de aceitação ou conversão com margem previamente definida;
- diversidade igual ou melhor sem prejudicar preferências explícitas;
- nenhuma concentração anormal;
- revisão manual dos principais desacordos;
- mecanismo de rollback para o controle;
- rollout futuro por feature flag e percentual pequeno.

Classifique a decisão final somente como:

- `MANTER_EM_SOMBRA`;
- `INICIAR_PILOTO_LIMITADO`;
- `REJEITAR_V2`.

Explique objetivamente a decisão e a evidência ausente.

## Futuro machine learning

Não implemente modelo treinado ou IA generativa neste ciclo. Ao final, avalie apenas a viabilidade futura.

Um modelo estatístico ou de machine learning só deve ser considerado quando houver:

- amostra legítima e suficiente;
- definição clara do alvo;
- divisão temporal entre treino e avaliação;
- prevenção de vazamento de dados;
- baseline determinístico forte;
- métricas offline e online;
- explicabilidade;
- proteção de dados;
- rollback imediato;
- revisão de viés e concentração.

Não use LLM para decidir ranking, segurança alimentar, orçamento ou elegibilidade. Uma IA generativa futura pode auxiliar na redação de explicações, desde que nunca altere a decisão e não receba dados sensíveis desnecessários.

## Documentação contínua

Atualize:

- `README.md` com consentimento, feature flags, scripts e painel;
- `docs/appono-rotina-evolucao.md` com implementação e riscos;
- `docs/appono-rotina-populacao-avaliacao.md` com procedimento e resultados;
- `.env.example` apenas com nomes e valores seguros;
- documentação de migrations e ordem de implantação.

Não apague resultados históricos da V1 ou do primeiro teste da V2.

## Definição de pronto

O trabalho estará concluído somente quando:

- sinais existentes estiverem auditados;
- consentimento comportamental estiver explícito e reversível, se necessário para novos sinais;
- entrada de sinais estiver normalizada e testada;
- coleta `[DEMO]` for repetível e idempotente;
- experiências não forem fabricadas por SQL;
- painel administrativo privado estiver funcional;
- controle, V1 e V2 forem comparáveis por semana;
- grupo sem histórico permanecer neutro;
- métricas de confiança, diversidade, concentração e resultado estiverem disponíveis;
- RLS e propriedade tiverem evidência;
- testes, builds, lint e diff passarem;
- nenhuma credencial estiver no diff;
- nenhum pagamento, e-mail, deploy, commit, push ou migration remota ocorrer sem autorização;
- a V2 continuar em modo sombra;
- a decisão humana estiver documentada.

## Entrega final

Apresente:

1. arquitetura da coleta e do consentimento;
2. migrations, rotas, domínio, scripts e telas alterados;
3. sinais disponíveis e quais realmente personalizam;
4. proteção de privacidade e revogação;
5. cenários `[DEMO]` executados e limitações;
6. resultados locais, PostgreSQL e remotos separados;
7. comparação controle versus V1 versus V2 por semana;
8. evidências do painel administrativo;
9. falhas e regressões encontradas;
10. volume ainda necessário;
11. decisão entre `MANTER_EM_SOMBRA`, `INICIAR_PILOTO_LIMITADO` ou `REJEITAR_V2`;
12. ordem segura de implantação;
13. sugestões de commits separados, sem executá-los;
14. avaliação objetiva sobre quando um modelo de machine learning passará a fazer sentido.

Não confunda automação com aprendizado, telemetria com consentimento, divergência com qualidade ou dados sintéticos com validação real. O objetivo é construir evidência confiável antes de entregar decisões personalizadas da V2 aos clientes.
