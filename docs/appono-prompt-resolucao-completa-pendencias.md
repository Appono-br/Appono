# Prompt para resolução completa das pendências da Appono

Copie todo o conteúdo abaixo e use-o como uma única solicitação no repositório da Appono.

---

Você está trabalhando no repositório **Appono**, um monorepo com frontend Next.js/React, backend Express/Node.js e Supabase/PostgreSQL. Sua tarefa é investigar e resolver, de ponta a ponta, todas as pendências descritas neste prompt. Não entregue somente uma análise, um plano ou exemplos isolados: implemente as alterações necessárias, crie migrations aditivas, ajuste frontend e backend, valide os fluxos e deixe o resultado pronto para revisão.

## Objetivo

Melhorar a experiência da Appono Rotina, autenticação, validações cadastrais, módulo do restaurante, descoberta de restaurantes pelo cliente e tratamento de mensagens. A aplicação é uma demonstração acadêmica e não será comercializada neste momento, mas deve se comportar e se apresentar como um produto consistente, sem dados inventados, telas enganosas, erros técnicos expostos ao usuário ou atalhos que prejudiquem a segurança.

## Forma de trabalho obrigatória

1. Leia primeiro o `README.md`, o `frontend/AGENTS.md`, os manifests, as migrations relacionadas e os arquivos dos fluxos afetados.
2. Inspecione a implementação atual antes de alterar qualquer comportamento. Reaproveite componentes, serviços, rotas, regras de autorização e padrões visuais existentes.
3. Mapeie dependências entre frontend, API, Supabase, OAuth do Google, Mercado Pago e serviços externos.
4. Faça escolhas razoáveis de implementação sem interromper o trabalho para pedir confirmação sobre decisões rotineiras.
5. Se uma integração depender de uma credencial externa ausente, implemente o contrato, o adaptador, a configuração por variável de ambiente, o tratamento de indisponibilidade e os testes. Não fabrique respostas de produção e não afirme que um dado foi validado quando o provedor não respondeu.
6. Não remova regras de autenticação, propriedade, RLS, orçamento, disponibilidade, segurança alimentar ou pagamento para facilitar a demonstração.
7. Não exponha chaves, tokens, CPF completo, e-mail privado, respostas integrais de provedores ou dados pessoais em logs.
8. Preserve compatibilidade com os dados existentes. Toda mudança de banco deve usar uma nova migration idempotente e revisável.
9. Não use textos inteiros em maiúsculas nos botões e títulos. Use português claro e consistente.
10. Não deixe código morto, mocks ativados em produção, números ilustrativos apresentados como reais, links que levam à tela errada ou TODOs no caminho principal.
11. Execute os testes adequados, lint e builds. Corrija regressões encontradas durante o trabalho.

## 1. Appono Rotina: seleção escalável de restaurantes

Substitua a listagem de restaurantes e pratos baseada em muitos checkboxes por uma experiência de pesquisa escalável. O objetivo é continuar funcional mesmo que existam milhares de restaurantes e produtos.

### Comportamento esperado

- A configuração da rotina não deve carregar nem renderizar todo o catálogo.
- Exiba uma barra de pesquisa com comportamento de combobox/autocomplete acessível.
- A pesquisa só deve começar depois que houver um endereço ativo geocodificado e um raio válido.
- O backend deve filtrar primeiro por localização e raio em quilômetros. Somente depois deve aplicar o texto pesquisado.
- Permita pesquisar por nome do restaurante, categoria culinária e nome do prato, desde que esses campos existam e estejam publicados.
- Use debounce, paginação ou cursor e limite de resultados. Não envie milhares de registros ao navegador.
- Cada resultado deve mostrar nome, distância, categoria ou pratos correspondentes e um estado claro de seleção.
- Restaurantes selecionados devem aparecer como itens compactos removíveis abaixo da busca. Não recrie a lista inteira em checkboxes.
- Não mostre restaurantes inativos, fora do raio, sem coordenadas válidas ou sem catálogo publicado quando o fluxo exigir prato.
- Ao trocar o endereço ou reduzir o raio, revalide as seleções. Informe de forma simples quais seleções deixaram de ser compatíveis e remova apenas após confirmação quando houver risco de perda inesperada.
- Favoritos gerais e restaurantes preferidos da rotina devem continuar sendo conceitos distintos caso o modelo atual já faça essa separação.
- A busca deve funcionar por teclado, possuir rótulo, foco visível, `aria-expanded`, `aria-controls` e estados de carregamento, vazio e erro.

### API e desempenho

- Crie ou adapte um endpoint autenticado específico para busca do catálogo da rotina.
- Receba texto, latitude, longitude, raio e cursor/página com validação e limites máximos.
- Calcule distância no servidor. Prefira consulta geoespacial eficiente quando a estrutura do banco permitir; caso contrário, faça pré-filtro por caixa geográfica e cálculo final de Haversine sem carregar o catálogo completo.
- Garanta autorização por perfil e não aceite coordenadas ou identidade de outro usuário como fonte confiável quando já existir uma localização persistida para a rotina.
- Adicione índices necessários por nome normalizado, publicação, restaurante e coordenadas, justificando-os na migration.
- Retorne somente os campos necessários à interface.

### Critérios de aceite

- Nenhuma tela renderiza uma checkbox para cada restaurante ou prato do catálogo.
- Uma base com 1.000 restaurantes continua com resposta paginada e interface utilizável.
- Alterar endereço ou raio altera os resultados da busca.
- Restaurante fora do raio nunca pode ser selecionado pela rotina.
- Seleções persistidas continuam aparecendo após recarregar a página.

## 2. Login por e-mail e senha ou Google

Mantenha os dois fluxos de autenticação do Supabase Auth funcionando: e-mail e senha ou Conta Google.

### Requisitos

- Mantenha login e cadastro por e-mail e senha, recuperação de senha e a ação **“Continuar com Google”**.
- Normalize o e-mail e use mensagens que não permitam descobrir se determinada conta está cadastrada.
- Preserve o retorno seguro do OAuth, o parâmetro de estado, PKCE quando aplicável e a validação de URLs de redirecionamento.
- Depois do primeiro login, encaminhe o usuário para completar os dados obrigatórios do perfil que o Google não fornece.
- Defina de forma explícita como contas existentes serão reconciliadas pelo identificador do Supabase e e-mail verificado, sem criar perfis duplicados.
- Valide no backend o login e o cadastro por senha e mantenha o rate limit das rotas de autenticação.
- Trate cancelamento do popup, provedor indisponível, conta sem e-mail verificado, callback inválido e perfil incompleto com mensagens simples.
- Atualize navegação, textos, documentação e testes que ainda pressupõem senha.

### Critérios de aceite

- Um visitante consegue entrar com e-mail e senha ou Google.
- Cadastro e recuperação de senha funcionam sem exigir uma sessão anterior.
- O callback cria ou encontra exatamente um perfil Appono.
- Um usuário autenticado não volta à tela de login.
- Erros OAuth não exibem query strings, tokens nem mensagens internas do Supabase.

## 3. Validação de CPF

Implemente a validação em duas camadas e não confunda formato matemático com situação cadastral.

### Camada local obrigatória

- Normalize o CPF, aceite entrada com ou sem máscara e valide quantidade de dígitos, sequências repetidas e dígitos verificadores.
- Armazene apenas no formato já adotado pelo projeto. Na interface e em logs, masque o CPF quando não for indispensável mostrá-lo completo.
- Retorne um código técnico estável para CPF com formato inválido.

### Situação cadastral

- Pesquise documentação atual e oficial de um provedor autorizado capaz de consultar situação cadastral de CPF. Use apenas documentação primária do provedor.
- Não faça scraping do site da Receita Federal, não contorne CAPTCHA e não use serviços obscuros que violem privacidade ou termos de uso.
- Crie uma interface de provedor desacoplada, timeout, tratamento de rate limit e variáveis de ambiente documentadas.
- Modele estados distintos: `FORMATO_INVALIDO`, `REGULAR`, `IRREGULAR`, `NAO_ENCONTRADO`, `INDETERMINADO` e `SERVICO_INDISPONIVEL`, adaptando os nomes ao padrão do projeto.
- Sem credencial configurada, valide o formato localmente e informe que a situação cadastral não pôde ser consultada. Nunca marque como “CPF ativo” apenas porque os dígitos são válidos.
- Evite persistir a resposta bruta do provedor. Se for necessário guardar evidência, registre somente status normalizado, provedor, instante e identificador técnico não sensível.
- Proteja o endpoint com autenticação, autorização, rate limit e auditoria mínima.

### Critérios de aceite

- CPFs inválidos são rejeitados sem chamar serviço externo.
- Resposta do provedor é normalizada e não vaza dados adicionais do titular.
- Timeout ou ausência de credencial não gera falso positivo.
- Testes cobrem dígitos verificadores, sequências inválidas, sucesso, irregularidade, timeout e rate limit.

## 4. Validação de Gmail

Não implemente enumeração de contas por SMTP nem prometa descobrir se um endereço Gmail existe por uma API pública, pois esse resultado não é confiável e pode violar privacidade.

No fluxo Google, use o próprio OAuth como prova de que a pessoa controla uma Conta Google e recebeu um e-mail verificado do provedor. No fluxo por senha, use a confirmação de e-mail do Supabase Auth antes de concluir o acesso.

### Requisitos

- Valide sintaxe e normalize o e-mail recebido do provedor.
- Se o requisito for estritamente Gmail, aceite apenas domínio `gmail.com` de forma case-insensitive. Antes de impor essa limitação, verifique se a Appono precisa aceitar Google Workspace; se contas Workspace forem úteis, trate “Conta Google verificada” como regra correta e documente a decisão.
- Não crie endpoint que revele a terceiros se determinado Gmail está cadastrado na Appono.
- Mensagens de autenticação não devem permitir enumeração de usuários.
- Registre a origem da verificação como Google OAuth, sem armazenar tokens além do necessário ao fluxo de sessão.

### Critérios de aceite

- Nenhum e-mail é tratado como confirmado antes do OAuth Google ou da confirmação de e-mail do Supabase.
- `email_verified=false` bloqueia a conclusão do cadastro Google e e-mail não confirmado bloqueia o login por senha.
- Não existe consulta SMTP ou resposta pública “este Gmail existe”.

## 5. Módulo do restaurante: desempenho com dados reais

Preencha a tela de desempenho usando somente dados operacionais pertencentes ao restaurante autenticado.

### Métricas mínimas

- Reservas criadas, confirmadas, concluídas, canceladas e não comparecimentos.
- Taxa de conclusão e taxa de cancelamento com denominadores explícitos.
- Pedidos criados, pagos ou confirmados, em preparo, entregues e cancelados.
- Faturamento bruto, estornos, taxas conhecidas e valor líquido quando esses dados existirem.
- Ticket médio apenas sobre transações válidas, com regra documentada.
- Avaliação média e quantidade de avaliações elegíveis.
- Evolução diária ou semanal no período selecionado.

### Regras

- Adicione filtros de período com padrão útil, por exemplo últimos 30 dias.
- Use o fuso `America/Sao_Paulo` nas fronteiras de data.
- Não use arrays fixos, números aleatórios ou valores de demonstração na tela real.
- Se não houver dados, apresente estado vazio com orientação clara.
- Cada métrica deve ter definição única no backend ou em consulta versionada, evitando cálculos divergentes entre cartões.
- Todas as consultas devem restringir pelo restaurante autenticado, inclusive agregações e comparações.
- Evite consultas N+1 e adicione índices quando comprovadamente necessários.

### Critérios de aceite

- Os totais conferem com reservas, pedidos, pagamentos e avaliações persistidos.
- Trocar o período recalcula todos os componentes relacionados.
- Restaurante A nunca recebe métricas do restaurante B.
- Estado vazio não apresenta zero como se fosse desempenho histórico quando não há amostra.

## 6. Módulo financeiro mais fácil de entender

Redesenhe a apresentação das transações mantendo precisão contábil e rastreabilidade.

### Interface

- Mostre cartões resumidos para: vendas brutas, taxas, estornos, valor líquido, valores pendentes e valores disponíveis, somente quando a fonte permitir calcular cada item.
- Inclua explicações curtas em linguagem comum para cada conceito.
- Crie uma tabela responsiva de transações com data, origem, pedido ou reserva, valor bruto, taxa, valor líquido, status e ação para detalhes.
- Traduza status técnicos para textos claros, mantendo o código técnico disponível em detalhes ou suporte.
- Adicione filtros por período, status e tipo de movimentação.
- Use valores monetários em centavos ou `numeric`, sem `float` para cálculos financeiros.
- Diferencie pagamento, repasse, reembolso, estorno e chargeback.
- Não apresente estimativa como valor liquidado.

### Critérios de aceite

- A soma apresentada pode ser reconciliada com as linhas filtradas ou possui explicação quando vier de saldo externo.
- Estornos e taxas não aparecem como receita.
- Status pendente não aparece como dinheiro disponível.
- O usuário consegue entender por que o líquido é diferente do bruto.

## 7. Tela correta para conexão do Mercado Pago

Crie uma tela própria em **Configurações do restaurante** para gerenciar a conexão Mercado Pago. A opção de configuração não deve redirecionar ao relatório financeiro.

### Conteúdo da tela

- Estado atual: não conectado, conexão pendente, conectado, expirado, erro ou desconectado.
- Conta conectada com dados mínimos e não sensíveis permitidos pelo provedor.
- Botão para conectar, reconectar ou desconectar conforme o estado.
- Explicação simples de por que a conexão é necessária e o que a Appono pode fazer.
- Indicação clara de ambiente de teste ou produção, sem expor tokens.
- Data da última verificação e mensagem de erro compreensível quando necessário.

### Integração

- Reaproveite o OAuth Mercado Pago existente, validando `state`, propriedade do restaurante, callback e armazenamento cifrado.
- Não coloque segredo ou token no frontend, URL, log ou mensagem.
- A desconexão deve exigir confirmação e revogar ou inutilizar credenciais conforme a capacidade do provedor.
- Atualize o item de navegação de Configurações para a nova rota.
- O relatório financeiro pode exibir um atalho para conectar quando necessário, mas não deve ser a tela de configuração.

### Critérios de aceite

- Clicar em “Mercado Pago” nas configurações abre a nova tela.
- O estado exibido vem da conexão real persistida.
- Callback inválido ou pertencente a outro restaurante é bloqueado.
- Nenhuma credencial aparece na resposta da API.

## 8. Novas formas de descobrir restaurantes

Crie uma experiência de exploração que complemente busca textual, favoritos e proximidade.

### Proposta mínima

- Uma página ou seção **Explorar** com coleções por tipo de cozinha, ocasião, faixa de preço e características disponíveis no catálogo.
- Seções como “Bem avaliados”, “Novidades”, “Para almoço”, “Para jantar” e “Experimente algo diferente”, desde que cada uma tenha uma regra real e documentada.
- Recomendações personalizadas podem usar preferências e feedback consentido, mas devem respeitar restrições, raio, funcionamento e disponibilidade.
- Quando não houver consentimento ou histórico, use critérios editoriais determinísticos e transparentes.
- Não chame de “mais curtidos” uma lista baseada em avaliação, nem de “perto” algo que não usa distância.
- Evite criar uma bolha: inclua variedade e limite repetições.
- Cada coleção deve ser paginada ou ter uma quantidade pequena com ação “ver mais”.

### Critérios de aceite

- O cliente consegue abrir um restaurante sem digitar uma busca.
- As coleções não usam dados fictícios e explicam implicitamente seu critério pelo título.
- Itens indisponíveis ou fora das regras da coleção não aparecem.
- A descoberta funciona sem histórico pessoal.

## 9. Mensagens e alertas com aparência de produção

Faça um inventário das faixas de alerta, banners de desenvolvimento, textos de sandbox, mensagens técnicas, `alert()` do navegador, placeholders e avisos permanentes presentes na interface.

### Regras

- Remova avisos internos ou de desenvolvimento que não ajudam o usuário final.
- Preserve mensagens necessárias para segurança, pagamento, indisponibilidade, perda de dados, consentimento ou ação bloqueada.
- Substitua `window.alert` por componentes consistentes quando houver ocorrências.
- Toda mensagem visível deve dizer o que aconteceu e, quando possível, qual ação o usuário pode tomar.
- Nunca mostre stack trace, nome de tabela, SQLSTATE, texto cru do gateway, token, UUID interno ou detalhes de infraestrutura.
- Mantenha um código técnico estável na resposta da API e nos logs estruturados para diagnóstico.
- Erros inesperados devem ter identificador de correlação, mensagem simples e log técnico sanitizado no backend.
- Não esconda falhas reais fingindo sucesso.

### Tabela obrigatória de mensagens

Crie um documento em `docs/` com uma tabela contendo ao menos estas colunas:

| Fluxo | Situação | Mensagem comum exibida | Código técnico | Causa provável | Ação recomendada | Onde consultar |
| --- | --- | --- | --- | --- | --- | --- |

Inclua autenticação Google, CPF, geocodificação, rotina sem opções, conflito de versão, reserva, pedido, pagamento, Mercado Pago, cardápio, permissão, rede e erro inesperado. A mensagem comum deve ser compreensível por pessoa leiga; a coluna técnica deve ajudar manutenção sem expor detalhes ao usuário.

## Requisitos transversais

### Segurança e privacidade

- Mantenha autenticação e autorização no backend.
- Valide propriedade de restaurante, cliente, pedido, reserva e transação.
- Preserve RLS e funções transacionais existentes.
- Aplique rate limit em validações cadastrais, buscas públicas custosas e callbacks sensíveis.
- Normalize entradas e limite tamanhos, paginação e filtros.
- Respeite LGPD: finalidade, minimização, mascaramento, retenção e ausência de dados pessoais em logs.

### Dados e migrations

- Use migrations novas e ordenadas; não edite migrations já aplicadas para mudar produção.
- Backfills devem ser idempotentes, restritos e seguros para reexecução.
- Índices devem corresponder às consultas novas.
- Funções e triggers devem possuir `search_path` seguro, privilégios mínimos e tratamento de concorrência.
- Não dependa de exclusão manual de dados antigos para os novos fluxos funcionarem.

### UX e acessibilidade

- Preserve o sistema visual da Appono.
- Evite caixa alta em botões e frases.
- Garanta navegação por teclado, rótulos, foco, contraste e estados de carregamento.
- Use estados vazios, skeletons e feedback de ação sem travar a página inteira.
- Layouts devem funcionar em celular e desktop.

### Observabilidade

- Use logs estruturados e sanitizados no backend.
- Separe mensagem do usuário de código técnico.
- Registre falhas de integrações externas com provedor, operação, código, duração e identificador de correlação, sem payload sensível.
- Não use o console do navegador como única fonte de diagnóstico.

## Ordem recomendada de execução

Implemente todas as áreas, preferencialmente nesta ordem para reduzir retrabalho:

1. Auditoria do estado atual, rotas, schema, telas e integrações.
2. Contrato comum de erros e documento de mensagens.
3. Login Google e verificação de e-mail via OAuth.
4. Validação local de CPF e adaptador de situação cadastral.
5. Busca escalável de restaurantes da rotina.
6. Exploração de restaurantes para clientes.
7. Métricas reais de desempenho do restaurante.
8. Reorganização do financeiro.
9. Tela de conexão Mercado Pago.
10. Remoção ou reescrita dos alertas restantes.
11. Migrations, backfills, testes integrados, lint, builds e revisão final.

Essa ordem não autoriza deixar etapas posteriores incompletas. Continue até concluir toda a lista ou até existir um bloqueio externo real, como ausência de credencial de um provedor pago. Nesse caso, termine toda a implementação independente da credencial e documente exatamente o único passo externo restante.

## Validação obrigatória

- Testes unitários das regras puras e normalizadores.
- Testes de autorização e isolamento entre clientes e restaurantes.
- Testes das APIs novas: sucesso, vazio, entrada inválida, paginação, indisponibilidade externa e rate limit.
- Testes dos fluxos OAuth Google e Mercado Pago nos limites que o ambiente permitir.
- Testes de cálculo de métricas e valores financeiros com casos de cancelamento, estorno e arredondamento.
- Testes de regressão da Appono Rotina e da seleção por raio.
- `npm test` no backend.
- `npm run lint` e `npm run build` no frontend.
- Build do backend e `git diff --check`.
- Verificação manual das páginas alteradas em largura móvel e desktop quando o navegador local estiver disponível.

Não crie testes que apenas repitam a implementação. Priorize regras de negócio, autorização, cálculos, contratos e regressões observáveis.

## Entrega final

Ao terminar, apresente:

1. O comportamento final de cada item da lista.
2. Arquivos e migrations principais alterados.
3. APIs, variáveis de ambiente e provedores adicionados.
4. Resultado dos testes, lint e builds.
5. Migrações aplicadas e migrações apenas preparadas.
6. Limitações reais restantes, sem classificar trabalho não realizado como concluído.
7. Link para a tabela de mensagens comuns e códigos técnicos.

Não encerre com uma lista genérica de recomendações. Entregue código funcional, dados reais quando disponíveis, estados honestos quando não houver dados e evidências suficientes para revisar cada resultado.

---
