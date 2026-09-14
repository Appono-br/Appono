# Appono Rotina: diagnóstico dos prints e fechamento da V1

Data: 13/09/2026. Escopo: três prints enviados, código local e consultas de leitura ao Supabase. Alterações locais na branch `main`, sem commit/push.

## Print 1: janela de almoço

### R01. Janela e duração têm significados diferentes, mas a interface não explica

Evidência: início 12:00, fim 13:30 e tempo total 60 minutos. Esses valores NÃO são, por si só, um erro de cálculo. A janela oferece 90 minutos para encaixar uma saída de até 60 minutos. Falta esclarecer que a saída inclui ida, refeição e volta.

Impacto: cliente pode interpretar o campo como tempo de permanência ou achar que a plataforma calculou a janela incorretamente.

Correção implementada: campo renomeado para “Limite da saída (min)”, resumo dinâmico da janela e explicação breve da ida e volta. A distância máxima é um limite adicional; estar dentro de 5 km não garante caber no tempo disponível.

### R02. Validação temporal incompleta

Evidência no código anterior: tempo e raio eram ajustados silenciosamente com `Math.min/Math.max`; não existia validação de tempo máximo versus duração da janela. A estimativa usa 30 minutos de refeição, mas o formulário aceitava 20 minutos.

Correção implementada: limites explícitos de 30 a 240 minutos, raio de 1 a 100 km, dias obrigatórios e duração máxima menor ou igual à janela, no frontend e na API. Valores inválidos não são corrigidos silenciosamente. A geração revalida perfis salvos anteriormente.

Aceite automatizado: 12:00–13:30 com 60 minutos é válido; com 120 é rejeitado; janela invertida, dias vazios e limites inválidos devem ser rejeitados.

Limitação: o banco original ainda tem `tempo_maximo_minutos between 20 and 240`. A API aplica a regra nova; alinhar o CHECK em migration incremental antes do fechamento definitivo, verificando perfis legados. Reexecutar `CREATE TABLE IF NOT EXISTS` não altera constraints existentes.

### R03. Seleção e distribuição dos campos

Evidência: dias quebram de linha; campos ocupam grande altura no print. Quebra de linha em tela estreita é comportamento responsivo, não falha lógica. Entretanto, os dias não tinham estado acessível de seleção.

Correção implementada: `aria-pressed` nos dias, feedback quando nenhum dia está selecionado, campos numéricos e distribuição em duas colunas a partir de telas médias. A conferência visual em celular e modo escuro continua pendente.

## Print 2: restaurantes e pratos preferidos

### R04. Seleção múltipla nativa confusa

Evidência: lista com realce cinza e seleção múltipla dependente do comportamento do navegador/teclado. Não fica claro quais opções estão marcadas nem como removê-las.

Correção implementada: checkboxes com área clicável, busca por restaurante/prato, contagem de selecionados e estados de busca sem resultados. Selecionar um item não remove os outros.

### R05. Catálogo de pratos aparenta estar incompleto

Evidência: quatro restaurantes, mas somente um prato do Outback no print. Isso não prova defeito de carregamento: o catálogo considera produtos disponíveis, não arquivados e categorias/cardápios ativos.

Correção implementada: explicar que somente pratos publicados aparecem; identificar o restaurante em cada prato; indicar quando não há pratos encontrados. Preferência é prioridade, não filtro exclusivo. Pratos de restaurantes que não foram priorizados podem aparecer intencionalmente.

Validação necessária: comparar os pratos apresentados com o catálogo publicado de cada restaurante, sem preencher artificialmente restaurantes que não têm pratos elegíveis.

### R06. Aviso de alergia aparece mesmo sem alergia cadastrada

Evidência: o texto sobre alergias era fixo junto dos favoritos, misturando duas decisões diferentes.

Correção implementada: aviso de alergia condicionado ao campo preenchido; explicar que pratos preferidos continuam salvos, mas não serão recomendados enquanto houver alergia. Favoritos existentes são identificados e priorizados automaticamente.

Limitação mantida: não há ingredientes/alérgenos estruturados. Texto livre não certifica segurança alimentar, e a rotina não garante ausência de contaminação cruzada.

## Print 3: resumo e “Planejamento vazio”

### R07. Falta ação direta de geração

Evidência: o perfil está salvo e o card recomenda gerar, mas oferece apenas “Ver planejamento” e “Preferências”. Consulta somente de leitura ao Supabase encontrou 1 perfil, 0 planejamentos e 0 refeições planejadas naquele momento.

Conclusão: neste estado não foi comprovada perda de sugestões; a semana ainda não havia sido criada.

Correção implementada: ação “Gerar planejamento da semana” diretamente no resumo, com processamento e atualização da tela após a resposta.

### R08. Estado vazio genérico e próxima refeição incorreta

Evidência no código: ausência de próxima refeição recebia sempre o mesmo título. A comparação considerava apenas a data e podia mostrar como próxima uma refeição de hoje que já passou.

Correção implementada: estados distintos para perfil ausente, semana não gerada, semana encerrada, ausência de opções compatíveis e ausência de refeições futuras; comparação por data e hora em São Paulo. Falha de carregamento não é apresentada como novo perfil vazio.

### R09. Resumo incompleto e espaço desproporcional

Evidência: card de próxima sugestão vazio esticado até a altura do card de perfil; perfil apresenta apenas orçamento diário e raio.

Correção implementada: cards alinhados pelo topo; orçamento semanal, janela, dias e limite da saída no resumo. As coordenadas não são divulgadas a restaurantes. Nome/endereço-base continua editável pelo cliente.

## Ajustes transversais implementados

- “Appono Rotina” imediatamente após “Início” nos seis menus existentes do cliente; header de navegação nas demais rotas através do layout cliente, incluindo subpáginas, pagamentos, favoritos, suporte e notificações.
- Geração segue o fuso de São Paulo e avança para a próxima semana quando a última janela selecionada acabou. Dias anteriores à data atual não viram novas sugestões.
- Ausência de sugestões informa os filtros que eliminaram opções, ou incompatibilidade de funcionamento/tempo/antecedência, ou saldo semanal insuficiente. Não inventa uma causa a partir de um print.
- Regeração pede confirmação; reservas e pedidos convertidos são preservados. Botões evitam ações simultâneas na mesma tela.
- Falha no carregamento do perfil impede salvá-lo com valores iniciais e sobrescrever dados existentes.

## Validação e limites da evidência

- 76 testes automatizados passaram: domínio, estados da interface, autorização das rotas e contrato de conversão com transporte Supabase simulado.
- Validação final: builds de frontend e backend passaram, lint sem erros e `git diff --check` sem erros de whitespace.
- Leitura real: tabelas existem; havia 1 perfil e nenhuma semana/refeição gerada na consulta.
- Consulta anônima ao perfil foi negada com HTTP 401 / PostgreSQL 42501 (`permission denied for table`). Isso valida essa negativa, não todas as políticas RLS.
- Tentativa de conversão com `service_role`, sem identidade de cliente e ID inexistente, foi negada no schema privado. Esse resultado não reproduz o fluxo autenticado do cliente e não deve motivar liberar o schema indiscriminadamente.
- Nenhum navegador está disponível nas ferramentas da sessão. Responsividade e modo escuro não foram inspecionados visualmente. Não foi executado pagamento real, nem criada reserva na base compartilhada.

## Pendências registradas antes da etapa transacional

Atualização de 14/09/2026: os itens 4 e 5 abaixo foram implementados e validados localmente; o usuário informou aprovação dos testes funcionais anteriores. O registro histórico abaixo não descreve mais o estado atual dessas escritas. Resultados atuais: 80 testes da aplicação, 17 testes PostgreSQL, lint e builds aprovados. Consulte [integridade transacional e homologação restante](appono-rotina-integridade-transacional.md) e [descrição preparada do commit](appono-rotina-commit.md).

1. Testar na interface autenticada: salvar/reabrir perfil, marcar/desmarcar preferidos, gerar semana, alterar, aprovar e recusar. Cobrir desktop, 390 px e modo escuro.
2. Testar com dois clientes reais de homologação: leitura/escrita cruzada negada, acesso de restaurante negado, conversão com JWT correto permitida e repetição simultânea criando uma única reserva.
3. Validar reserva simples confirmada e reserva com pedido pendente, checkout de teste e confirmação somente após pagamento. Testar preço alterado, prato indisponível, mesa ocupada e restaurante fechado.
4. Tornar salvamento de perfil/preferências e substituição das sugestões transacionais: hoje há múltiplas chamadas REST, e falha intermediária ou abas concorrentes ainda podem deixar alterações parciais. Não considerar o lock da conversão como proteção suficiente para todas as operações.
5. Alinhar constraints temporais em migration incremental, tratar dados legados e executar testes SQL de RLS/rollback. A migration inicial já foi aplicada; não pressupor que editar o arquivo reaplica mudanças.
6. Documentar resultado de cada etapa e só então marcar a V1 como fechada. Agenda externa, grupos, recompensas e demanda agregada continuam posteriores à V1.

Arquivos principais: `backend/src/domain/routine-recommendation.js`, `backend/src/routes/routine.js`, `frontend/lib/routine-view.mjs`, `frontend/app/cliente/rotina/`, `frontend/components/cliente/cliente-header.jsx` e `frontend/app/cliente/layout.jsx`.
