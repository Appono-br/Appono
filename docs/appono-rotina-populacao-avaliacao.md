# População de avaliação do Appono Rotina

O script `backend/scripts/seed-routine-evaluation.js` cria uma população sintética e idempotente para avaliar o recomendador em desenvolvimento ou homologação. Nenhuma pessoa é real e nenhum restaurante é apresentado como parceiro da Appono.

## Conteúdo

- 8 restaurantes casuais marcados com `[DEMO]`;
- 24 produtos distribuídos entre comida brasileira, massas, grelhados, bowls, culinária oriental, árabe e café;
- ingredientes, alérgenos e ficha de segurança alimentar revisada para cada produto;
- horários operacionais, coordenadas aproximadas, consumo mínimo e mesas;
- 10 clientes fictícios com orçamento, raio, preferência e janela alimentar distintos;
- usuários autenticáveis com e-mails no padrão `demo.rotina.*@example.com`.

O seed não cria pagamentos, reservas, pedidos ou feedbacks falsamente elegíveis. Essas interações devem ser produzidas pelos fluxos normais da aplicação para preservar as regras operacionais e gerar evidência confiável para a IA.

## Prévia segura

```powershell
npm.cmd run seed:rotina:preview --workspace backend
```

A prévia não acessa nem altera o Supabase.

## Aplicação

1. Confirme que `SUPABASE_URL` aponta exclusivamente para desenvolvimento ou homologação.
2. Confirme que todas as migrations do Appono Rotina e de segurança alimentar já foram aplicadas.
3. Configure uma senha temporária forte e a confirmação explícita somente na sessão atual do terminal.
4. Execute o seed.
5. Remova as variáveis temporárias da sessão.

```powershell
$env:APPONO_DEMO_SEED = "confirmado"
$env:APPONO_DEMO_TARGET_HOST = "seu-project-ref.supabase.co"
$env:APPONO_DEMO_PASSWORD = "defina-uma-senha-temporaria-forte"
npm.cmd run seed:rotina --workspace backend
Remove-Item Env:APPONO_DEMO_SEED
Remove-Item Env:APPONO_DEMO_TARGET_HOST
Remove-Item Env:APPONO_DEMO_PASSWORD
```

O processo pode ser repetido: usuários existentes são reutilizados e cardápios, produtos, ingredientes, alérgenos, perfis e preferências são atualizados sem duplicação intencional.

Confirme as quantidades persistidas com uma auditoria somente de leitura:

```powershell
npm.cmd run seed:rotina:verify --workspace backend
```

## Limpeza exata

A limpeza procura somente usuários com o prefixo `demo.rotina.` e o domínio `example.com`, remove seus perfis e depois remove as contas de autenticação correspondentes.

```powershell
$env:APPONO_DEMO_SEED = "confirmado"
$env:APPONO_DEMO_TARGET_HOST = "seu-project-ref.supabase.co"
npm.cmd run seed:rotina:cleanup --workspace backend
Remove-Item Env:APPONO_DEMO_SEED
Remove-Item Env:APPONO_DEMO_TARGET_HOST
```

Não execute seed ou limpeza em produção. `SUPABASE_SECRET_KEY` permanece exclusivamente no backend e nunca deve ser colocada em variáveis `NEXT_PUBLIC_*`.

## Próxima coleta

Depois da população, os avaliadores devem entrar com clientes distintos, gerar planejamentos e concluir experiências pelos fluxos normais. Aprovação, recusa, troca, conversão e feedback consentido passam a formar a amostra utilizada pela avaliação em modo sombra. Dados gerados diretamente por SQL não devem ser usados como evidência de conversão real.

## Avaliação sombra

Os recomendadores `appono-intelligence-v1` e `appono-intelligence-v2` devem ser avaliados sem alterar a sugestão entregue ao cliente. Ative `APPONO_ROTINA_SHADOW_ENABLED=true` somente no backend do ambiente de desenvolvimento e execute:

```powershell
$env:APPONO_REMOTE_SMOKE = "confirmado"
$env:APPONO_DEMO_PASSWORD = "<senha-temporaria-da-populacao>"
npm run test:rotina:shadow
```

O teste autentica os dez clientes fictícios, gera a semana pela API real e registra, para as mesmas refeições, as comparações de `deterministico-v3` contra V1 e V2 em `avaliacoes_sombra_rotina`. A senha é lida apenas do ambiente e não é persistida pelo script. As métricas são agrupadas por `modelo_desafiante`, evitando misturar os resultados.

Em 20/09/2026, após a aplicação da migration `20260920210706_routine_intelligence_shadow_evaluation.sql`, o teste remoto concluiu com:

- 10 de 10 clientes autenticados e sem falhas;
- 50 sugestões oficiais geradas para a semana de 21/09/2026;
- 50 comparações sombra persistidas;
- 26 concordâncias e 24 divergências, totalizando 48% de divergência;
- confiança média do desafiante de 0,35;
- nenhuma comparação com histórico ou feedback anterior.

Todas as divergências alteraram o restaurante; nenhuma alterou somente o produto. O resultado confirma que a infraestrutura sombra funciona, mas não demonstra superioridade da inteligência. Sem histórico e com confiança baixa, `appono-intelligence-v1` deve permanecer como desafiante. O próximo ciclo precisa coletar aprovações, recusas, trocas, conversões e feedback consentido antes de calibrar pesos ou promover o modelo.

### Auditoria técnica das sugestões

O comando `npm run evaluate:rotina:shadow --workspace backend` aplica uma régua independente e reproduzível a cada sugestão. A régua considera preferência explícita, distância, folga no orçamento e variedade semanal. Diferenças inferiores a 1,5 ponto são classificadas como empate técnico, pois não sustentam uma escolha objetiva sem feedback humano.

Resultado das 50 comparações:

- 34 empates técnicos, incluindo as 26 escolhas idênticas;
- 14 vitórias do modelo oficial;
- 2 vitórias do desafiante;
- entre as 24 divergências reais: 14 vitórias do controle, 2 do desafiante e 8 inconclusivas.

As duas vitórias do desafiante ocorreram por maior folga no orçamento. A maior parte das vitórias do controle ocorreu por menor distância e melhor variedade semanal. O desafiante concentrou repetidamente suas escolhas em `Café Estação / Tapioca caprese` nos últimos dias, mostrando que a v1 recompensa preço e proximidade sem penalizar repetição com força suficiente. Portanto, a recomendação técnica é não promover a v1 e corrigir diversidade e duplicação de pesos antes de iniciar uma v2.

## Coleta comportamental consentida

A migration `20260921204635_routine_behavioral_consent_and_signals.sql` prepara consentimento global desativado por padrao, historico de concessao e revogacao e sinais privados. O feedback continua obedecendo ao consentimento individual. Interacoes operacionais somente personalizam depois de uma concessao ativa.

O coletor `collect-routine-behavior.js` separa as duas primeiras contas DEMO como controle e distribui aprovacao, recusa e alternativa entre as demais. Ele usa rotas HTTP reais, limita-se ao prefixo `demo.rotina.cliente.` e nao fabrica conversao ou feedback elegivel.

```powershell
$env:APPONO_REMOTE_SMOKE = "confirmado"
$env:APPONO_DEMO_PASSWORD = "<senha-temporaria-opcional>"
npm.cmd run collect:rotina:behavior --workspace backend
```

A execucao remota exige desenvolvimento ou homologacao, migration aplicada e autorizacao explicita. Reclamacoes de suporte, agenda, alergias, endereco e ausencia de reclamacao nao sao sinais de gosto.

## Appono Intelligence V2

A V2 foi implementada como desafiante isolado e determinístico. A V1 permanece congelada para preservar a comparação histórica. A V2 parte da pontuação oficial, não adiciona bônus estático de preço ou distância e limita o ajuste comportamental ao intervalo de `-8` a `+8`.

Sem histórico elegível, a V2 gera ajuste `0`, confiança `0` e a mesma escolha do controle. Feedback ativo e consentido usa decaimento temporal, suavização, consistência dos sinais e penalidade de repetição. Sinais sem consentimento, excluídos ou sem instante válido não personalizam.

O teste remoto agora registra V1 e V2 para as mesmas refeições e agrupa as métricas por `modelo_desafiante`. O comando de auditoria usa a régua versionada `auditoria-tecnica-v2`, mantém usos semanais separados por cliente e modelo e informa resultados por desafiante.

Resultados locais de 20/09/2026:

- 135 testes do backend aprovados;
- build do backend aprovado;
- lint e build do frontend aprovados, com 48 rotas;
- V1 preservada pelos testes anteriores;
- migration incremental `20260920220421_routine_intelligence_v2_metrics.sql` confirmada no remoto e reconciliada no histórico do CLI;
- teste remoto executado somente com contas `[DEMO]`; nenhum pagamento, reserva, e-mail, commit, push ou deploy foi executado.

O teste remoto da V2 foi executado em 20/09/2026, após confirmação explícita. Como a senha temporária não estava carregada, o executor usou `generateLink` administrativo e `verifyOtp` exclusivamente para as dez contas `[DEMO]`; nenhum token foi impresso, nenhum e-mail foi enviado e nenhuma senha foi alterada.

Resultado sobre as mesmas 50 refeições sem histórico comportamental:

- 10 de 10 clientes autenticados, sem falhas HTTP;
- 50 sugestões oficiais geradas para a semana de 21/09/2026;
- V1: 26 concordâncias, 24 divergências, confiança média `0,35` e 48% de divergência;
- V2: 50 concordâncias, nenhuma divergência e confiança média `0`;
- V2: 50 comparações sem histórico, volume efetivo médio `0` e nenhuma falha do modelo;
- V2: 7 restaurantes, 19 produtos e 7 categorias nas escolhas;
- V2: maior concentração da mesma opção igual a 10, contra 23 na V1;
- V2: preço médio de R$ 35,34, distância média de 0,47 km e cobertura de preferência explícita de 44%;
- zero violações detectáveis de orçamento ou raio em ambos os modelos.

Pela régua `auditoria-tecnica-v2`, as 50 escolhas da V2 foram empates técnicos com o controle, como esperado sem histórico. Na V1, permaneceram 14 vitórias do controle, 2 do desafiante e 34 empates técnicos. Isso valida o comportamento neutro da V2, mas ainda não mede aprendizado.

Aprovações, recusas e alternativas continuam disponíveis como telemetria do experimento, mas somente feedback elegível com consentimento explícito alimenta atualmente a personalização futura. Conversões e feedback não devem ser fabricados por SQL.

A promoção exige ao menos 100 experiências elegíveis distribuídas, revisão humana e rollout por flag. Não existe promoção automática; até atingir essa evidência, a recomendação é manter a V2 em modo sombra.

## Coleta comportamental sintética - 21/09/2026

O coletor DEMO foi ampliado para aceitar uma meta exata e várias semanas, mantendo as chamadas nas rotas reais. A execução autorizada usou `--target=100 --weeks=3`, sem criar pagamento, pedido, reserva concluída, feedback ou envio de e-mail artificial.

Resultado da coleta:

- 100 sinais novos e 100 sinais totais no recorte;
- 32 aprovações, 34 recusas e 34 solicitações de alternativa;
- 8 clientes consentidos com 12 a 14 sinais cada;
- 2 clientes de controle sem consentimento comportamental e sem sinais;
- todas as ações observadas responderam HTTP 200;
- nenhuma credencial ou token foi impresso.

O segundo teste sombra produziu 42 comparações para cada desafiante:

- V1: 24 concordâncias, 18 divergências e confiança média `0,35`;
- V2: 19 concordâncias, 23 divergências e confiança média `0,3515`;
- V2: 34 comparações com histórico e 8 sem histórico;
- o grupo sem histórico permaneceu com confiança zero;
- nenhum modelo apresentou falha ou violação detectável de orçamento ou raio.

Pela régua independente `auditoria-tecnica-v2`:

- V1: 2 vitórias, 8 derrotas e 32 empates técnicos contra o controle;
- V2: 6 vitórias, 8 derrotas e 28 empates técnicos contra o controle;
- a maior concentração da mesma opção foi 17 na V1 e 6 na V2;
- a V2 cobriu 7 restaurantes, 20 produtos e 7 categorias;
- a cobertura de preferências explícitas foi `52,38%` nos dois desafiantes.

Conclusão: a V2 apresentou melhora sobre a V1 em diversidade, concentração e número de vitórias, mas ainda perdeu mais casos do que ganhou contra o controle. As ações sintéticas foram distribuídas para exercitar a arquitetura e não representam gosto gastronômico real. Portanto, elas validam consentimento, persistência, carregamento de sinais, confiança e avaliação, mas não satisfazem o critério de 100 experiências elegíveis reais para promoção.

Decisão: `MANTER_EM_SOMBRA`. O próximo ciclo deve coletar experiências reais concluídas, conversões e feedback consentido, preservar um grupo de controle e repetir a avaliação longitudinal antes de qualquer piloto.

## Simulacao longitudinal controlada - 22/09/2026

Foi criado o protocolo `appono-intelligence-longitudinal-v1`, com dez personas coerentes, seis semanas por persona e conjuntos separados de desenvolvimento, validacao e reserva. A utilidade externa nao reutiliza os pesos da V2 e cada modelo e avaliado contra sua propria sequencia.

No conjunto de reserva, executado uma unica vez apos o congelamento dos criterios:

- 300 decisoes por modelo;
- 134 desacordos entre controle e V2;
- arrependimento medio do controle: `7,4095`;
- arrependimento medio da V1: `4,4114`;
- arrependimento medio da V2: `3,6729`;
- zero violacoes eliminatorias;
- neutralidade preservada no grupo sem historico;
- nenhuma regressao por persona acima do limite predefinido de `2,0`.

A evidencia sintetica aprova a V2 como software para homologacao interna, nao como produto validado por clientes. A revisao cega foi preparada em `backend/reports/routine-intelligence/blind-review.json` e ainda requer preenchimento humano.

As migrations `20260920191137`, `20260920210706` e `20260920220421` já existiam fisicamente no banco por aplicação manual, mas não constavam no histórico do CLI. O histórico foi reconciliado como `applied` após consultas confirmarem tabelas e colunas; o `supabase db push --linked --dry-run` terminou com o banco atualizado e nenhuma migration pendente.
