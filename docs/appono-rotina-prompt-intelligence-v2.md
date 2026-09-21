# Prompt de desenvolvimento da Appono Intelligence V2

Você é um agente sênior de produto, dados, segurança e desenvolvimento full-stack trabalhando diretamente no projeto Appono. Sua missão é implementar, integrar, testar e documentar a segunda versão do motor de personalização do Appono Rotina, denominada **`appono-intelligence-v2`**.

Não entregue apenas análise, arquitetura, pseudocódigo ou plano. Inspecione o repositório, preserve o comportamento existente, implemente a V2 de forma incremental, execute os testes e produza evidências. Não faça commit, push, deploy nem aplique migrations remotas sem autorização explícita.

## Objetivo central

Criar uma V2 determinística, explicável, segura e mensurável que personalize sugestões com base em sinais comportamentais legítimos, sem duplicar regras já contempladas pelo ranking oficial e sem assumir o controle das sugestões antes de demonstrar superioridade.

A V2 deverá funcionar inicialmente apenas em **modo sombra**. O cliente continuará recebendo exclusivamente a decisão do modelo oficial `deterministico-v3`. A V1 `appono-intelligence-v1` deve permanecer congelada como referência histórica. Para cada refeição elegível, o sistema deverá conseguir comparar:

1. controle: `deterministico-v3`;
2. desafiante anterior: `appono-intelligence-v1`;
3. novo desafiante: `appono-intelligence-v2`.

## Contexto obrigatório

- Frontend: Next.js/React em JavaScript.
- Backend: Node.js/Express em JavaScript.
- Banco, autenticação e RLS: Supabase/PostgreSQL.
- O ranking oficial já considera orçamento, distância, preferências explícitas, favoritos, funcionamento, agenda, segurança alimentar, score operacional, repetição e variedade.
- A V1 duplicou parte dos pesos de orçamento e distância e apresentou repetição excessiva de `Café Estação / Tapioca caprese`.
- O primeiro teste sombra gerou 50 comparações: 26 concordâncias e 24 divergências.
- Uma auditoria independente classificou as 24 divergências em 14 vitórias do controle, 2 da V1 e 8 empates técnicos.
- A confiança média da V1 foi 0,35 mesmo sem histórico, o que não representa evidência suficiente.
- A tabela privada `avaliacoes_sombra_rotina` já existe, aceita múltiplos modelos desafiantes por refeição e não é acessível por `anon` ou `authenticated`.
- A V2 não pode alterar filtros eliminatórios, segurança alimentar, reservas, pedidos, pagamentos ou experiência visível do cliente.

Antes de editar, leia integralmente:

- `README.md`;
- `docs/appono-rotina-evolucao.md`;
- `docs/appono-rotina-populacao-avaliacao.md`;
- `docs/appono-rotina-integridade-transacional.md`;
- `backend/src/domain/routine-recommendation.js`;
- `backend/src/domain/routine-intelligence.js`;
- `backend/src/domain/routine-shadow-evaluation.js`;
- `backend/src/routes/routine.js`;
- `backend/scripts/test-routine-shadow.js`;
- `backend/scripts/evaluate-routine-shadow.js`;
- testes de recomendação, inteligência, rotas e avaliação sombra;
- migrations relacionadas ao Appono Rotina, feedback e avaliação sombra.

Para qualquer alteração Supabase, siga as instruções locais da skill Supabase e consulte a documentação atual. Não edite migrations já aplicadas; crie migrations incrementais pelo Supabase CLI após consultar `--help`.

## Regras inegociáveis

1. Preserve alterações locais e tudo que já funciona.
2. Não use IA generativa ou APIs externas para decidir o ranking.
3. A V2 deve ser determinística: a mesma entrada produz exatamente a mesma saída.
4. A V2 não pode tornar elegível um candidato eliminado pelo controle.
5. Orçamento, raio, agenda, funcionamento, disponibilidade, antecedência e segurança alimentar continuam sendo limites eliminatórios.
6. Preferências explícitas e alergias nunca podem ser anuladas por comportamento inferido.
7. Sem histórico comportamental elegível, a V2 deve produzir ajuste zero ou praticamente nulo e manter o ranking do controle.
8. Não atribua confiança positiva fixa sem amostras. Com zero amostras, a confiança deve ser zero.
9. Sinais comportamentais só podem personalizar quando houver base legítima e consentimento aplicável. Respeite `consentiu_personalizacao` e não transforme telemetria operacional em personalização silenciosa.
10. Não exponha avaliações sombra, pesos internos, preferências privadas ou histórico no frontend.
11. Não registre endereço, coordenada exata, agenda, alergia, token ou conteúdo pessoal na tabela de avaliação.
12. Nenhum teste pode efetuar pagamento real, enviar e-mail real ou criar reserva real fora do sandbox autorizado.
13. Não altere o modelo oficial para melhorar artificialmente o resultado da V2.
14. A V1 deve permanecer congelada; correções e novos pesos pertencem à V2.

## Fase 1 — Congelar a V1 e estruturar versões

- Preserve o comportamento atual de `appono-intelligence-v1` para manter comparabilidade histórica.
- Separe configuração, pesos e função de pontuação por versão.
- Implemente `appono-intelligence-v2` em módulo próprio ou em estrutura versionada claramente isolada.
- Evite condicionais espalhadas por rotas. O domínio deve selecionar e executar desafiantes configurados.
- Faça o gerador produzir avaliações sombra para V1 e V2 sem misturar seus ajustes.
- Grave uma linha por `id_refeicao_planejada` e `modelo_desafiante`, usando a unicidade já existente.
- Garanta que falha de qualquer desafiante seja observável, mas nunca impeça a geração oficial.

## Fase 2 — Corrigir a função de pontuação

A V2 não deve recompensar novamente orçamento e distância como sinais positivos genéricos, pois o controle já os considera. Use orçamento, raio e segurança apenas como contexto ou filtros herdados do conjunto elegível.

Implemente:

- ajuste base igual a zero sem evidência comportamental;
- limite global conservador, inicialmente entre `-8` e `+8` pontos;
- pesos centralizados, versionados e documentados;
- normalização para impedir que quantidade de eventos aumente pontuação indefinidamente;
- suavização bayesiana ou equivalente simples e determinística;
- saturação progressiva: o quarto evento semelhante deve acrescentar menos que o primeiro;
- desempate estável pelo padrão já utilizado no recomendador;
- ausência de coerção silenciosa ou valores `NaN`;
- metadados técnicos mínimos com versão, ajuste, confiança, amostras e contribuições agregadas.

Não inclua na V2 bônus estático de “mais barato” ou “mais perto”. Esses fatores podem aparecer na explicação do controle, mas não como aprendizado comportamental sem evidência.

## Fase 3 — Diversidade semanal e repetição

- Preserve a penalidade de diversidade do controle e garanta que ela também seja aplicada antes da seleção da V2.
- Adicione proteção específica contra colapso do desafiante em um único restaurante ou prato.
- Penalize progressivamente repetição de restaurante, produto e categoria.
- Aplique penalidade adicional para repetição em dias consecutivos.
- Não proíba favoritos; permita repetição quando houver evidência positiva recorrente e consentida.
- O bônus de afinidade nunca pode superar sozinho a penalidade de repetição severa.
- Registre contribuições separadas para restaurante, produto, categoria e sequência semanal.
- Teste explicitamente o caso que levou a V1 a repetir `Café Estação / Tapioca caprese`.

## Fase 4 — Sinais comportamentais e consentimento

Modele uma entrada normalizada de sinais, sem acoplar o domínio diretamente às tabelas ou rotas. Considere:

- aprovação da sugestão;
- recusa;
- solicitação de alternativa;
- edição manual;
- conversão em reserva;
- conversão em pedido;
- feedback positivo ou negativo;
- intenção de repetir;
- tags estruturadas e consentidas;
- recência do evento.

Regras:

- conversão e feedback consentido devem ter mais valor que uma simples aprovação;
- recusa, troca e feedback negativo devem reduzir afinidade;
- edição manual deve ensinar somente os atributos efetivamente escolhidos;
- feedback sem consentimento pode compor métricas agregadas do experimento, mas não personalização futura;
- poucos eventos não podem dominar preferências explícitas;
- eventos conflitantes devem se compensar de forma explicável;
- sinais antigos devem sofrer decaimento temporal determinístico;
- exclusão lógica do feedback deve retirar seu efeito da personalização;
- não use reclamações de suporte como sinal de gosto gastronômico;
- não use ausência de reclamação como feedback positivo.

Se o schema existente não conseguir representar a origem, consentimento e instante necessários, crie migration incremental mínima. Audite dados legados, habilite RLS, revogue privilégios e conceda somente o necessário. Não aplique remotamente sem autorização.

## Fase 5 — Confiança calibrada

Substitua a confiança fixa da V1 por cálculo baseado em evidência:

- zero amostras elegíveis: confiança `0`;
- uma ou duas amostras: confiança muito baixa e ajuste fortemente suavizado;
- crescimento gradual conforme volume, diversidade e consistência dos sinais;
- sinais contraditórios reduzem confiança;
- limite máximo abaixo de `1`, inicialmente `0,90`;
- confiança não deve alterar filtros eliminatórios nem ser apresentada ao cliente;
- registre separadamente volume bruto, volume efetivo após decaimento e consistência.

Crie testes de fronteira para zero, uma, três, sete e muitas amostras, além de histórico contraditório.

## Fase 6 — Explicabilidade segura

Produza explicações técnicas e explicações voltadas ao cliente separadamente.

Explicação técnica privada:

- versão do modelo;
- sinais agregados utilizados;
- contribuições limitadas;
- confiança e quantidade de amostras;
- penalidades de repetição;
- motivo de empate ou troca de posição.

Explicação futura para o cliente, ainda não exibida nesta fase:

- “você aprovou pratos semelhantes recentemente”;
- “traz mais variedade para sua semana”;
- “evita repetir o restaurante de ontem”.

Não revele pesos, inferências médicas, alergias, conteúdo de agenda ou frases absolutas como “melhor opção”. Não adicione a explicação da V2 ao frontend enquanto ela permanecer em modo sombra.

## Fase 7 — Testes automatizados

Amplie os testes unitários e de integração para cobrir:

- ausência de histórico mantém ranking e produz confiança zero;
- V1 permanece com o mesmo resultado anterior;
- V2 não duplica bônus de orçamento e distância;
- repetição excessiva perde posição;
- favorito pode repetir quando há evidência suficiente;
- feedback positivo consentido aumenta afinidade;
- feedback negativo reduz afinidade;
- feedback sem consentimento não altera ranking;
- remoção de consentimento elimina o efeito;
- conversão pesa mais que aprovação;
- recusa e alternativa geram sinais negativos distintos;
- decaimento temporal reduz sinais antigos;
- sinais contraditórios reduzem confiança;
- ajuste nunca ultrapassa o limite;
- alergia, restrição, orçamento, raio e agenda continuam eliminatórios;
- desempate permanece estável;
- o modelo é determinístico;
- falha da V2 não quebra o planejamento oficial;
- V1 e V2 são persistidas em linhas separadas;
- ações posteriores atualizam a telemetria dos dois desafiantes da refeição;
- acesso via `anon` e `authenticated` à telemetria continua bloqueado.

Adicione regressão específica para os 50 casos sintéticos e para a repetição observada da Tapioca.

## Fase 8 — Segundo teste sombra comparativo

Evolua os scripts de teste para produzir um relatório comparando controle, V1 e V2 sobre exatamente as mesmas entradas.

O relatório deve trazer:

- total de comparações por modelo;
- concordância e divergência;
- confiança média e distribuição por faixa;
- comparações com e sem histórico;
- repetição de restaurante, prato e categoria;
- diversidade semanal média;
- distância e preço médios, sem declarar que menor é sempre melhor;
- cobertura de preferências explícitas;
- violações eliminatórias, que devem ser zero;
- vitórias do controle, V1, V2 e empates segundo a régua independente;
- detalhamento somente dos desacordos;
- resultado por perfil sintético;
- exemplos explicáveis de melhora e regressão.

Versione também a régua independente usada por `evaluate-routine-shadow.js`. Não use os próprios pesos da V2 para declarar a V2 vencedora. Escolhas idênticas devem ser sempre empate. Diferenças pequenas devem permanecer inconclusivas.

Critérios mínimos esperados antes da coleta comportamental:

- sem histórico, V2 diverge pouco ou nada do controle;
- confiança média sem histórico igual a zero;
- nenhuma concentração anormal em um restaurante ou prato;
- nenhuma violação de regras eliminatórias;
- resultado da régua independente não inferior ao da V1.

## Fase 9 — Coleta comportamental controlada

Crie um procedimento repetível para produzir sinais somente nas contas `[DEMO]`, usando as rotas reais e respeitando todas as regras de elegibilidade.

- Não escreva aprovações, reservas, pedidos ou feedbacks diretamente por SQL.
- Não marque pedido como entregue ou reserva como concluída burlando o fluxo.
- Não execute pagamento real; use apenas sandbox autorizado.
- Identifique claramente qualquer resultado simulado.
- Faça limpeza exata somente quando necessária e nunca em produção.
- Gere perfis comportamentais diferentes: econômico, explorador, fiel a favoritos, sensível à distância e avesso à repetição.
- Mantenha parte dos clientes sem histórico como grupo de controle.
- Gere uma semana posterior e execute novamente controle, V1 e V2.

Se conversões completas não puderem ser produzidas com legitimidade, conclua aprovações, recusas e alternativas, documente a limitação e não fabrique feedback elegível.

## Critérios de promoção

A V2 não deve sair do modo sombra apenas porque passou nos testes. Exija:

- pelo menos 100 experiências elegíveis, preferencialmente mais;
- volume distribuído entre clientes e contextos, não concentrado em um perfil;
- zero violações de segurança alimentar, orçamento, raio, agenda e funcionamento;
- desempenho comportamental superior ao controle com margem definida;
- melhora de diversidade sem prejudicar excessivamente preferência explícita;
- confiança calibrada e estabilidade entre semanas;
- revisão manual dos principais desacordos;
- ativação por feature flag e rollout gradual;
- mecanismo imediato de retorno ao controle;
- monitoramento de regressões após ativação.

Não implemente promoção automática nesta tarefa. Entregue apenas a recomendação e os dados necessários para uma decisão humana.

## Arquitetura e qualidade

- Separe domínio, carregamento de sinais, persistência e transporte HTTP.
- Rotas Express não devem conter a fórmula do modelo.
- Centralize pesos e versões.
- Evite N+1 ao carregar histórico.
- Limite o volume histórico por janela temporal e agregue quando possível.
- Datas de eventos devem ser tratadas como instantes UTC; apresentação permanece em `America/Sao_Paulo`.
- Não registre PII, tokens ou conteúdo pessoal em logs.
- Use códigos de erro seguros e mantenha telemetria sombra não bloqueante.
- Não adicione dependência externa sem necessidade clara.
- Preserve compatibilidade com os dados já persistidos da V1.

## Verificação obrigatória

Execute ao final:

```text
npm test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
git diff --check
```

Execute também:

```text
npm run test:rotina:shadow --workspace backend
npm run evaluate:rotina:shadow --workspace backend
```

O teste remoto exige confirmação explícita, ambiente de desenvolvimento e credenciais fictícias. Não exponha senhas no código, documentação ou saída final.

## Documentação

Atualize:

- `README.md` com o estado real da V2 e a feature flag;
- `docs/appono-rotina-evolucao.md` com implementação, testes e riscos;
- `docs/appono-rotina-populacao-avaliacao.md` com resultados comparativos;
- `.env.example` somente com nomes e valores seguros de exemplo;
- documentação de eventual migration incremental e ordem de implantação.

Não apague os resultados históricos da V1.

## Definição de pronto

O trabalho estará concluído somente quando:

- V1 estiver preservada e V2 isolada;
- controle, V1 e V2 puderem rodar sobre as mesmas entradas;
- V2 produzir ajuste e confiança zero sem histórico elegível;
- duplicação de orçamento e distância tiver sido removida;
- diversidade e repetição estiverem protegidas;
- consentimento, decaimento e sinais contraditórios estiverem testados;
- telemetria registrar ambos os desafiantes sem afetar o cliente;
- a auditoria independente comparar os três modelos;
- testes automatizados, builds, lint e diff passarem;
- qualquer teste remoto for claramente separado dos testes locais;
- nenhuma credencial estiver no diff;
- nenhuma migration remota, commit, push ou deploy tiver sido realizado sem autorização.

## Entrega final

Apresente:

1. resumo da arquitetura da V2;
2. arquivos e migrations alterados;
3. fórmula, limites, confiança e sinais utilizados;
4. proteção de consentimento e privacidade;
5. comparação controle versus V1 versus V2;
6. resultados locais e remotos separados;
7. regressões encontradas e corrigidas;
8. limitações e volume de dados ainda necessário;
9. recomendação objetiva: manter em sombra, iniciar piloto ou rejeitar a V2;
10. sugestão de commits separados, sem executá-los.

Não confunda divergência com qualidade, correlação com aprendizado ou dados sintéticos com validação real. O objetivo da V2 é aprender com evidência suficiente sem sacrificar previsibilidade, segurança e variedade.
