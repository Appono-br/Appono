# Prompt para revisão e fechamento do Appono Rotina

Você é um agente full-stack no projeto Appono. Inspecione o repositório e leia `docs/appono-rotina-relatorio-prints.md` e a seção Appono Rotina do README antes de editar. Trabalhe com Next.js/React, Express/JavaScript e Supabase/PostgreSQL; preserve os fluxos existentes e alterações locais. Não faça commit, push, migração remota ou cobrança real sem autorização correspondente.

## Objetivo

Concluir a primeira versão utilizável do Appono Rotina, validando os ajustes dos três prints e fechando as pendências técnicas comprovadas. Parte das correções já foi implementada; revise o estado atual e complete somente o que faltar. Não recrie telas nem substitua regras de negócio por suposições.

## Print 1: janela de almoço

Janela 12:00–13:30 e limite de saída de 60 minutos são compatíveis: o cliente dispõe de uma janela de 90 minutos e quer gastar no máximo 60, incluindo ida, refeição e volta. Não torne obrigatória a igualdade dos dois valores.

Garanta validação consistente de início/fim, dias, limite de 30–240 minutos e limite menor ou igual à janela. Raio 1–100 km não substitui o limite temporal. Não ajuste valores inválidos silenciosamente. Mostre resumo curto e campos responsivos, acessíveis por teclado. Explique que a estimativa de deslocamento é aproximada e não envolve tempo de preparo de pratos.

## Print 2: prioridades

Valide os checkboxes, busca, contagens, persistência e remoção das seleções. Não use `select multiple` dependente de Ctrl/Cmd. Priorizar restaurante não exclui os demais; prato preferido pode pertencer a outro restaurante. Mostre origem de cada prato e apenas produtos publicados e disponíveis, com categoria/cardápio elegíveis. Não invente pratos para preencher a lista. Identifique favoritos existentes sem duplicar peso indevidamente.

Separe o aviso de alergia das preferências gerais e mostre-o somente quando aplicável. Dados textuais não certificam ingredientes: preserve a restrição de sugestão apenas de mesa para alergias até existir modelagem confiável. Não prometa segurança alimentar ou ausência de contaminação cruzada.

## Print 3: resumo

Distinga perfil ausente, perfil salvo sem semana gerada, semana sem opções compatíveis, semana encerrada, refeições recusadas/passadas e falha de carregamento. Inclua geração direta e estado de processamento. Não mostre refeição passada hoje como próxima; use America/Sao_Paulo. Explique filtros impeditivos a partir do diagnóstico real do motor, não de um texto genérico.

Mantenha cards compactos, resumo de orçamento diário/semanal, dias, janela e limite de saída. Regerar precisa confirmar substituição e preservar reservas/pedidos convertidos.

## Navegação

Todas as páginas e subpáginas do módulo cliente devem apresentar “Início”, seguido imediatamente de “Appono Rotina”, com link `/cliente/rotina`. Verifique menus desktop/mobile, favoritos, pedidos, reservas, detalhes, pagamentos, configurações, chat, suporte e notificações. Não duplique headers que já possuem navegação. Preserve retorno contextual, notificações, tema e autorização. Inspecione overflow em tela pequena.

## Fechamento técnico obrigatório

1. Verifique a migration instalada e o código atual. `CREATE TABLE IF NOT EXISTS` não modifica constraints existentes. Prepare migrations incrementais, sem apagar dados ou ocultar erros.
2. Faça salvamento de perfil/preferências/restrições e regeneração do planejamento em transações, com rollback completo e controle de concorrência por cliente/semana. Preserve refeições convertidas mesmo com geração e conversão concorrentes. Não deixe uma falha após DELETE apagar as sugestões anteriores.
3. Verifique propriedade em todas as operações, RLS e negação de escrita direta em vínculos/histórico. Use identidade validada, nunca `user_metadata` editável. Não libere `service_role` no frontend nem conceda acesso amplo ao schema privado para contornar um erro.
4. Teste conversão com JWT de cliente real, duas identidades e dois pedidos simultâneos. Ela deve reutilizar as funções existentes de reserva/pedido, sem duplicar regras financeiras. Falhas devem desfazer criação e vínculo; notificações não devem gerar duplicação em retentativas.
5. Revalide indisponibilidade, consumo mínimo, preço, funcionamento e critérios da rotina após alteração do perfil/cardápio. Reserva com pedido continua pendente até confirmação do gateway. Use sandbox identificado para pagamentos; não execute pagamento real.
6. Faça testes automatizados e testes no navegador em desktop/mobile e claro/escuro. Rode `npm test --workspace backend`, `npm run build --workspace backend`, `npm run lint --workspace frontend` e `npm run build --workspace frontend`. Teste RLS/transações no PostgreSQL; mocks não provam comportamento do banco.
7. Atualize README e relatório com mudanças, testes, evidências, limitações e pendências. Diferencie claramente teste real, simulado e não executado. Se faltar sessão/banco de homologação, conclua o trabalho independente e registre o bloqueio exato.

## Entrega

Código revisável e testes, migrations necessárias, resultados por cenário e checklist honesto de aceite da V1. Não declare a versão concluída apenas porque build/lint passaram. Agenda Google/Outlook, almoço em grupo, recompensas e demanda prevista ficam fora deste fechamento.
