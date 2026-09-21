# Evolução do Appono Rotina

Atualizado em 15/09/2026. Este documento acompanha a execução do plano dos itens 1 a 9. Os relatórios históricos permanecem válidos para as etapas que descrevem.

## Ciclo de coleta e validacao da Intelligence V2 - 21/09/2026

- Migration `20260921204635_routine_behavioral_consent_and_signals.sql` criada e nao aplicada remotamente.
- Consentimento explicito, reversivel, versionado e desativado por padrao.
- Historico e sinais privados idempotentes com RLS e privilegios minimos.
- Aprovacao, recusa, alternativa, edicao e conversao geram sinais nao bloqueantes.
- Revogacao interrompe sinais operacionais; feedback mantem consentimento individual.
- Painel agregado em `/admin/rotina-intelligence`, sem PII ou promocao automatica.
- Coletor DEMO criado, mas nao executado remotamente neste ciclo.
- Verificacao local: 140 testes backend, builds e lint aprovados.
- Decisao: `MANTER_EM_SOMBRA`; faltam 100 experiencias elegiveis distribuidas.

## Estado das fases

| Fase | Estado | Evidência atual |
| --- | --- | --- |
| 1. Fechamento visual e UX | Implementada; inspeção visual autenticada pendente | Shell unificado, cards responsivos, skeletons, estados vazios, diálogos acessíveis, tratamento de conflito e build |
| 2. Google Agenda e Outlook | Implementação local em validação | Schema incremental, PKCE/state, tokens cifrados, sincronização free/busy, UI e feature flags; falta aplicar migration e validar com credenciais dos provedores |
| 3. Recomendações explicáveis | Implementada localmente | Modelo `deterministico-v3`, pesos centralizados, diversidade, alternativas, explicações curtas e sugestão por janela alimentar |
| 4. Ingredientes e alérgenos | Implementação local em validação | Migration incremental, ficha revisável, auditoria, UI do restaurante e bloqueio conservador na Rotina |
| 5. Conversão completa | Base existente; revalidação ponta a ponta pendente | Conversão transacional atual e Mercado Pago sandbox serão a base |
| 6. E-mail | Implementação local em validação | Outbox, preferências, worker protegido, retry e transporte Resend desativado por padrão |
| 7. Feedback controlado | Implementação local em validação | Feedback privado, consentimento, exclusão lógica e peso limitado no modelo `deterministico-v3` |
| 8. Almoço em grupo | Fundação local em validação | Modelo, criação e ingresso por convite seguro; votação, sugestões e interface ainda não iniciadas |
| 9. Inteligência agregada | Implementação local em validação | Consulta agregada com coorte mínima, feature flag e card no desempenho do restaurante |

## Fase 1: fechamento visual e UX

### Implementação

- O header compartilhado do cliente passou a atender também `/cliente/rotina`; a página deixou de manter uma segunda navegação própria.
- As três telas usam a mesma hierarquia de breadcrumb, hero, conteúdo, ações e largura.
- Cards e linha do tempo usam superfícies brancas, bordas discretas, raio consistente e ações que se reorganizam em telas estreitas.
- `loading.jsx` fornece skeleton imediato do segmento e `error.jsx` oferece recuperação sem exibir detalhes internos.
- Perfil ausente, semana não gerada, semana encerrada, ausência de opções e falha real mantêm mensagens distintas pela função `estadoPlanejamento`.
- Status de sugestão, aprovação, recusa, alteração e conversão usam texto e cor sem depender somente do preenchimento do card.
- Regeneração, conversão, recusa e descarte de edição exigem confirmação.
- O diálogo compartilhado implementa foco inicial, Escape, ciclo de Tab e retorno do foco ao controle de origem.
- O formulário preserva o rascunho de perfil após HTTP 409. O planejamento preserva a edição, recarrega a versão atual e permite retomar a alternativa e o horário para revisão.
- Campos, botões e cards mantêm larguras mínimas seguras e usam o tema claro/escuro centralizado já existente.

### Validações

- `npm run lint --workspace frontend`: aprovado.
- `npm run build --workspace frontend`: aprovado; 48 rotas geradas.
- `npm test --workspace backend`: 85/85 testes aprovados.
- `npm run build --workspace backend`: aprovado.
- `git diff --check`: aprovado; somente avisos de normalização LF/CRLF no Windows.

### Pendência de aceite

Não havia navegador controlável disponível nesta sessão. A inspeção autenticada em 320, 390, 768, 1024 e 1440 px, nos temas claro e escuro, continua pendente. Build e análise estática não substituem essa evidência visual. Nenhuma screenshot foi registrada como se tivesse sido validada.

## Decisões transversais

- Migrations aplicadas não serão reescritas.
- Integrações externas ficarão atrás de feature flags e não manterão transações PostgreSQL abertas.
- Nenhuma credencial será incluída no repositório ou enviada ao navegador.
- Conversão, pagamentos e notificações repetíveis devem usar idempotência antes da liberação para piloto.

## Complemento: endereço e janelas alimentares

### Implementação local

- A migration `20260915205452_routine_meal_windows_and_geocoding.sql` cria `janelas_alimentacao_rotina`, com de uma a oito janelas ativas por perfil, tipo, nome, dias, horários, tempo máximo, orçamento opcional, raio, ordem e versão.
- Perfis existentes recebem uma janela de almoço derivada da configuração anterior. Refeições legadas são vinculadas a ela antes de a unicidade evoluir para planejamento, data e janela.
- A tela de configuração não permite editar latitude ou longitude. O cliente informa o endereço-base; o backend consulta Nominatim com timeout, cache curto e limite de requisições. Quando houver ambiguidade, a interface exibe somente alternativas de endereço e exige escolha explícita.
- A geocodificação ocorre no backend. As coordenadas não retornam como campo editável ao navegador e a API ignora coordenadas enviadas pelo cliente.
- O gerador cria sugestões por janela ativa e preserva uma refeição convertida somente na mesma data e janela. Orçamento semanal, restrições, disponibilidade, agenda e diversidade continuam compartilhados pelo planejamento.
- A mutation `salvar_rotina_com_janelas` mantém perfil, preferências, geocodificação e janelas na mesma transação e participa do versionamento do perfil já existente.

### Validação local

- `npm.cmd test --workspace backend`: 102/102 testes aprovados, incluindo geração para café e almoço no mesmo dia e preservação de conversão apenas na janela correspondente.
- `npm.cmd run lint --workspace frontend`: aprovado.
- `npm.cmd run build --workspace backend`: aprovado.
- `npm.cmd run build --workspace frontend`: aprovado; 48 rotas.
- `git diff --check`: aprovado, com avisos informativos de LF/CRLF no Windows.

### Implantação pendente

- Esta migration não foi aplicada remotamente nesta sessão.
- Cinco migrations anteriores foram aplicadas pelo Dashboard e ainda precisam ser reconciliadas no histórico da Supabase CLI antes de qualquer `db push`: `20260914212206`, `20260914214302`, `20260915200627`, `20260915201021` e `20260915202112`.
- Após conferir o projeto vinculado, marque somente essas versões já existentes como `applied` com `supabase migration repair`, valide `supabase migration list --linked` e aplique a nova migration em ambiente autorizado. Não execute `db push` antes dessa conferência.

## Fase 2: Google Agenda e Outlook

### Implementação local

- A migration `20260914212206_appono_routine_calendar_connections.sql` cria conexões, tentativas OAuth, intervalos ocupados e logs de sincronização com RLS, privilégios exclusivos de backend e vínculos compostos entre cliente e conexão.
- Tentativas OAuth possuem `state` armazenado apenas como hash, expiração de dez minutos, consumo atômico e PKCE S256.
- Access e refresh tokens são cifrados com AES-256-GCM e uma chave exclusiva do backend; nenhum token aparece em resposta da API.
- Google usa consulta `freeBusy`; Outlook usa `getSchedule`. O domínio descarta conteúdo pessoal e persiste somente início, fim e hash dos intervalos unidos.
- A substituição de janelas é transacional e idempotente por sincronização. Falha do provedor preserva a última visão válida e marca a conexão para atenção.
- O planejamento semanal passa a recortar a janela de almoço pelos horários ocupados antes de avaliar restaurante e deslocamento. Reservas e pedidos já convertidos não são alterados.
- A configuração da rotina apresenta conexão, sincronização e desconexão separadas, com confirmação e integrações desligadas por padrão.

### Validações locais

- `npm test --workspace backend`: 89/89 testes aprovados antes da integração das janelas no motor; nova execução pendente após a última alteração.
- Cobertura adicionada para entropia de state/PKCE, cifragem autenticada, adulteração, normalização, união e recorte de intervalos.
- A migration não foi aplicada a nenhum ambiente. Testes PostgreSQL de RLS, consumo concorrente de state e idempotência aguardam banco local ou autorização de ambiente remoto.
- Credenciais reais de Google/Microsoft não foram usadas. Os fluxos externos permanecem desabilitados pelas feature flags.

### Ordem de implantação

1. Aplicar a migration incremental.
2. Configurar a chave de cifragem e as credenciais OAuth somente no backend.
3. Publicar o backend com as flags ainda desativadas.
4. Configurar as redirect URIs exatas nos provedores.
5. Ativar e validar Google; depois ativar e validar Outlook.
6. Publicar o frontend e executar o smoke autenticado.

## Fase 3: recomendações explicáveis

- O modelo `deterministico-v3` centraliza pesos, versão, penalidade gradual de repetição e o impacto limitado de feedback consentido em `backend/src/domain/routine-scoring.js`.
- O modelo local `appono-intelligence-v1` adiciona adequação contextual contínua e aprendizado individual com suavização estatística. Somente feedback consentido participa do aprendizado; alergias, restrições, agenda, disponibilidade e limites financeiros permanecem fora do alcance do ajuste adaptativo.
- Novas sugestões armazenam versão do modelo, confiança, número de amostras e contribuições em `metadados.inteligencia`. A página identifica personalização inicial e aprendizado ativo sem expor detalhes internos ou dados sensíveis.
- Orçamento, raio, funcionamento e agenda continuam sendo limites eliminatórios; eles não viram pontos que possam ser compensados por favoritos.
- Histórico recente influencia diversidade sem banir favoritos. A sugestão guarda até três alternativas com diferenças de preço, distância e aderência.
- A ação “Outra sugestão” altera apenas uma refeição, preserva versões de perfil e planejamento, e exige confirmação do cliente.
- Quando a aplicação não possui dado suficiente, não inventa distância ou pontuação. A tela mantém diagnóstico de ausência de candidatos.

## Fase 4: ingredientes, restrições e alérgenos

- A migration `20260914214302_routine_food_safety.sql` cria catálogo padronizado, ingredientes por produto, risco por alérgeno, ficha de revisão e auditoria.
- A mutação de segurança alimentar trava o produto, valida a versão, substitui ingredientes/alérgenos e registra auditoria em uma única transação.
- A ficha usa `PRESENTE`, `PODE_CONTER` e `CONTAMINACAO_CRUZADA`. Dados incompletos nunca são interpretados como ausência de risco.
- O restaurante informa origem e responsável antes de marcar uma ficha como revisada. O cliente enxerga o estado da informação no cardápio, junto de aviso de que não há garantia absoluta.
- Na Rotina, alergia declarada bloqueia sugestão automática de prato até existir ficha revisada compatível; a reserva sem item permanece como fallback seguro quando aplicável.

### Validações adicionais

- `npm test --workspace backend`: 94/94 testes aprovados.
- `npm run build --workspace backend`: aprovado.
- `npm run lint --workspace frontend`: aprovado.
- `npm run build --workspace frontend`: aprovado; 48 rotas.
- A migration de segurança alimentar ainda não foi aplicada. Testes PostgreSQL reais de RLS, lock e auditoria continuam pendentes de um banco autorizado.

## Fase 6: notificações por e-mail

- A migration `20260915200627_routine_email_outbox.sql` cria preferências por categoria e uma outbox com chave única, tentativas, próximo envio e falha permanente.
- A notificação interna existente enfileira o e-mail somente depois de persistir; o transporte externo nunca participa da transação de reserva, pedido ou pagamento.
- O worker reclama itens com `SKIP LOCKED`, recupera leases abandonados e faz backoff limitado. Horário de silêncio adia sem consumir tentativa.
- Resend é chamado diretamente pelo backend e fica desligado até `APPONO_EMAIL_ENABLED=true`. O endpoint de worker exige `X-Appono-Cron-Secret`.
- O template é responsivo, escapa conteúdo e aceita somente links internos construídos pela origem configurada.

## Fase 7: feedback e aprendizado controlado

- A migration `20260915201021_routine_feedback.sql` cria um feedback privado por refeição planejada, vinculado à reserva e ao pedido sem substituir a avaliação pública do restaurante.
- O banco aceita feedback apenas quando a reserva está concluída ou o pedido entregue. A função controlada identifica o cliente pela sessão, bloqueia acesso cruzado e faz upsert idempotente por refeição.
- O cliente pode editar o retorno e removê-lo da personalização. A remoção é lógica: preserva a trilha mínima de auditoria, mas retira o consentimento e o sinal usado pelo ranking; não altera reserva, pedido ou financeiro.
- O modelo `deterministico-v3` aplica, somente com consentimento, um ajuste limitado de até oito pontos. Preferências explícitas, orçamento, distância, funcionamento, agenda e segurança alimentar continuam prevalecendo.
- A página de planejamento exibe a ação apenas após experiência elegível, preserva o estado de carregamento e exige confirmação antes de remover o feedback.

## Fases 8 e 9: grupos e inteligência agregada

- A migration `20260915202112_routine_groups_and_restaurant_insights.sql` introduz grupos, participantes, convites com token armazenado como hash, opções e voto único por participante. Restrições e alergias de membros ficam em uma tabela separada, que só o próprio membro pode consultar ou alterar.
- `POST /api/rotina/grupos` cria grupo e convite de uso único; `POST /api/rotina/grupos/entrar` aceita o token. O backend gera 256 bits de entropia, armazena somente SHA-256 e as funções do banco validam sessão, janela, capacidade e expiração numa transação. `GET /api/rotina/grupos` lista somente grupos dos quais a pessoa participa.
- A interface, a geração de opções, a votação, saída, confirmação individual e conversão transacional ainda serão implementadas na próxima iteração. Pagamento dividido continua deliberadamente fora do escopo.
- A função de métricas usa apenas refeições planejadas agregadas para o próprio restaurante e suprime grupos com menos de cinco clientes distintos. Não retorna registros individuais, e-mail, endereço, coordenada, agenda, alergia nem histórico pessoal.
- `GET /api/rotina/insights/demanda?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` exige conta de restaurante, janela de até 90 dias e `APPONO_ROTINA_INSIGHTS_ENABLED=true`. A tela de Desempenho comunica com honestidade quando a flag está desligada ou não há coorte suficiente.

## Débitos e riscos

- O repositório ainda não provisiona o schema base completo em um Supabase vazio.
- Agenda, e-mail, grupos e inteligência agregada exigem decisões de retenção, credenciais e validação em ambientes isolados.
- A conversão remota completa com checkout sandbox ainda precisa compor o teste funcional controlado descrito no relatório de integridade.

## Revisão visual e preparação de credenciais - 16/09/2026

- O Appono Rotina continua sob o layout autenticado do cliente; não existe uma rota de Rotina no módulo restaurante. O header compartilhado foi alinhado à altura, superfície sticky, logo, navegação desktop e menu móvel usados nas telas principais.
- O item **Appono Rotina** permanece imediatamente após **Início**, recebe `aria-current="page"` em todas as subrotas e possui foco visível. Rotas que já renderizam header próprio continuam sem duplicação, inclusive mensagens e configurações aninhadas.
- O planejamento ganhou navegação entre semanas, estado do planejamento, resumo da próxima refeição e agrupamento por dia e janela alimentar. Café, almoço, jantar e janelas personalizadas são identificados pelo perfil carregado, sem alterar recomendação, orçamento, conversão ou concorrência.
- Cards agora priorizam horário, janela, restaurante, prato, preço, distância e status; logos válidos usam a imagem do restaurante e os demais casos recebem fallback textual.
- Loading, vazio, conflito 409, rascunho, confirmações, feedback e ações já existentes foram preservados.
- O guia `docs/appono-rotina-credenciais.md` documenta Supabase, Mercado Pago, Resend, Google Agenda, Outlook e Nominatim com links oficiais, variáveis por nome e ordem segura de ativação.

### Validação desta revisão

- `npm test --workspace backend`: 106/106 testes aprovados.
- `npm run build --workspace backend`: aprovado.
- `npm run lint --workspace frontend`: aprovado.
- `npm run build --workspace frontend`: aprovado; 48 rotas geradas.
- `git diff --check`: aprovado; somente avisos informativos de LF/CRLF no Windows.
- Varredura da documentação não encontrou credencial real; somente placeholders e nomes de variáveis.
- A inspeção visual autenticada nos cinco breakpoints continua pendente porque esta sessão não disponibilizou navegador controlável. A responsividade foi revisada estruturalmente e o build não apresentou erro, mas isso não substitui a evidência visual.

## Primeiro teste da inteligência em modo sombra - 20/09/2026

- Dez clientes sintéticos geraram 50 sugestões oficiais para a semana de 21/09/2026, sem falhas HTTP.
- O modelo oficial `deterministico-v3` permaneceu responsável por todas as sugestões exibidas; `appono-intelligence-v1` executou apenas como desafiante privado.
- Foram persistidas 50 comparações: 26 concordâncias e 24 divergências, uma taxa de divergência de 48%.
- A confiança média do desafiante foi 0,35 e nenhuma comparação possuía histórico ou feedback anterior.
- As 24 divergências trocaram o restaurante; nenhuma mudou somente o produto. O perfil sintético “João Variado” divergiu nos cinco dias.
- O resultado valida a infraestrutura de avaliação, não a superioridade do protótipo. A v1 permanece em modo sombra até existir amostra comportamental de aprovação, recusa, troca, conversão e feedback consentido.

## Appono Intelligence V2 - 20/09/2026

- A V1 foi mantida sem alteração de fórmula e ganhou uma V2 isolada em `backend/src/domain/routine-intelligence-v2.js`.
- O planejamento oficial continua sendo decidido por `deterministico-v3`. V1 e V2 recebem o mesmo conjunto já elegível e produzem duas linhas sombra independentes por refeição.
- Sem histórico consentido, a V2 aplica ajuste e confiança zero. Preço e distância não geram bônus estático; limites eliminatórios continuam exclusivamente sob o controle.
- O ajuste comportamental usa suavização, saturação, decaimento de 90 dias, consistência e limite global de oito pontos. A confiança cresce com volume efetivo, permanece abaixo de `0,90` e cai com sinais contraditórios.
- Restaurante, produto, categoria, faixa de preço, faixa de distância e janela podem receber afinidade somente a partir de sinal consentido. Repetição semanal e em dias consecutivos recebe penalidade no estado independente da V2.
- Falhas de qualquer desafiante retornam ajuste zero, geram somente código seguro no log e não interrompem a sugestão oficial.
- A auditoria `auditoria-tecnica-v2` separa V1 e V2, conserva a sequência semanal de cada modelo e classifica escolhas idênticas como empate.
- A tabela `avaliacoes_sombra_rotina` já suportava múltiplos desafiantes por refeição. A migration incremental `20260920220421_routine_intelligence_v2_metrics.sql` adiciona somente volume efetivo, consistência, diagnóstico agregado e falha segura; ela não foi aplicada remotamente.

### Validação local da V2

- `npm test --workspace backend`: 135/135 testes aprovados.
- `npm run build --workspace backend`: aprovado.
- `npm run lint --workspace frontend`: aprovado.
- `npm run build --workspace frontend`: aprovado; 48 rotas.
- O teste remoto comparativo foi executado após autorização: 10/10 clientes, 50 sugestões e nenhuma falha HTTP.
- A V2 concordou nas 50 comparações, com confiança e volume efetivo iguais a zero, nenhuma falha e nenhuma violação detectável de orçamento ou raio.
- A V1 repetiu o resultado histórico: 26 concordâncias, 24 divergências e confiança média de 0,35 sem histórico.
- A auditoria independente classificou a V2 em 50 empates técnicos com o controle. Para a V1, foram 14 vitórias do controle, 2 da V1 e 34 empates.
- O histórico remoto das migrations `20260920191137`, `20260920210706` e `20260920220421` foi reconciliado após confirmar os objetos existentes. O dry-run final não encontrou migrations pendentes.

### Decisão

A recomendação continua sendo manter a V2 em modo sombra. O teste remoto confirmou neutralidade e confiança zero sem histórico, mas ainda não existe amostra comportamental suficiente para afirmar superioridade. O piloto só deve ser considerado após pelo menos 100 experiências elegíveis distribuídas, zero violações eliminatórias e revisão manual dos desacordos.
