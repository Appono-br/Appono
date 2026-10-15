# Cobertura de rotas

64 entradas, incluindo rotas dinâmicas com ID fictício e redirecionamentos. As cinco larguras de base foram 320, 390, 768, 1024 e 1440 px. Ver README.md para método e limites.

| Área | Rota de entrada | Destino observado | Observação |
| --- | --- | --- | --- |
| Administração | `/admin/financeiro` | `/admin/financeiro` | Estado inicial inspecionado |
| Administração | `/admin/notificacoes` | `/admin/notificacoes` | Estado inicial inspecionado |
| Administração | `/admin` | `/admin/financeiro` | Redirecionamento; destino inspecionado |
| Administração | `/admin/reembolsos` | `/admin/reembolsos` | Estado inicial inspecionado |
| Administração | `/admin/rotina-intelligence` | `/admin/rotina-intelligence` | Estado inicial inspecionado |
| Administração | `/admin/suporte` | `/admin/suporte` | Estado inicial inspecionado |
| Público | `/auth/callback` | `/auth/callback` | Estado sem callback OAuth; fluxo real não executado |
| Público | `/cadastro/cliente` | `/cadastro/cliente` | Estado inicial inspecionado |
| Público | `/cadastro/restaurante` | `/cadastro/restaurante` | Estado inicial inspecionado |
| Cliente | `/cliente/agenda` | `/cliente/agenda` | Estado inicial inspecionado |
| Cliente | `/cliente/busca` | `/cliente/busca` | Estado inicial inspecionado |
| Cliente | `/cliente/configuracoes/conta` | `/cliente/configuracoes/conta` | Estado inicial inspecionado |
| Cliente | `/cliente/configuracoes/pagamentos` | `/cliente/configuracoes` | Redirecionamento; destino inspecionado |
| Cliente | `/cliente/configuracoes` | `/cliente/configuracoes` | Estado inicial inspecionado |
| Cliente | `/cliente/dashboard` | `/cliente/dashboard` | Estado inicial inspecionado |
| Cliente | `/cliente/detalhes-pedido` | `/cliente/agenda?visao=pedidos` | Redirecionamento; destino inspecionado |
| Cliente | `/cliente/favoritos` | `/cliente/favoritos` | Estado inicial inspecionado |
| Cliente | `/cliente/mensagens` | `/cliente/mensagens` | Estado inicial inspecionado |
| Cliente | `/cliente/mensagens/1` | `/cliente/mensagens/1` | Estado inicial inspecionado |
| Cliente | `/cliente/notificacoes` | `/cliente/notificacoes` | Estado inicial inspecionado |
| Cliente | `/cliente/ofertas` | `/cliente/dashboard` | Redirecionamento; destino inspecionado |
| Cliente | `/cliente/pagamentos/pedido/1` | `/cliente/pagamentos/pedido/1` | Estrutura/estado local; checkout externo não executado |
| Cliente | `/cliente/pagamentos/reserva/1` | `/cliente/pagamentos/reserva/1` | Estrutura/estado local; checkout externo não executado |
| Cliente | `/cliente/pagamentos/retorno` | `/cliente/pagamentos/retorno` | Estrutura/estado local; checkout externo não executado |
| Cliente | `/cliente/pedidos/1/avaliar` | `/cliente/pedidos/1/avaliar` | Estado inicial inspecionado |
| Cliente | `/cliente/pedidos/1` | `/cliente/pedidos/1` | Estado inicial inspecionado |
| Cliente | `/cliente/reservas` | `/cliente/reservas` | Estado inicial inspecionado |
| Cliente | `/cliente/reservas/1/pedido` | `/cliente/reservas/1/pedido` | Estado inicial inspecionado |
| Cliente | `/cliente/restaurantes` | `/cliente/restaurantes` | Estado inicial inspecionado |
| Cliente | `/cliente/restaurantes/1` | `/cliente/restaurantes/1` | Estado inicial inspecionado |
| Cliente | `/cliente/rotina/configurar` | `/cliente/rotina/configurar` | Estado inicial inspecionado |
| Cliente | `/cliente/rotina` | `/cliente/rotina` | Estado inicial inspecionado |
| Cliente | `/cliente/rotina/planejamento` | `/cliente/rotina/planejamento` | Estado inicial inspecionado |
| Cliente | `/cliente/suporte` | `/cliente/configuracoes?painel=suporte` | Redirecionamento; destino inspecionado |
| Público | `/completar-perfil` | `/completar-perfil` | Estado inicial inspecionado |
| Público | `/login` | `/login` | Estado inicial inspecionado |
| Público | `/` | `/` | Estado inicial inspecionado |
| Público | `/recuperar-senha` | `/recuperar-senha` | Estado inicial inspecionado |
| Restaurante | `/restaurante/campanhas` | `/restaurante/campanhas` | Estado inicial inspecionado |
| Restaurante | `/restaurante/campanhas/publicadas` | `/restaurante/campanhas/publicadas` | Estado inicial inspecionado |
| Restaurante | `/restaurante/campanhas/1` | `/restaurante/campanhas/1` | Estado inicial inspecionado |
| Restaurante | `/restaurante/cardapio/editar` | `/restaurante/cardapio/editar` | Estado inicial inspecionado |
| Restaurante | `/restaurante/cardapio` | `/restaurante/cardapio` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/dados-bancarios` | `/restaurante/financeiro` | Redirecionamento; destino inspecionado |
| Restaurante | `/restaurante/configuracoes/endereco` | `/restaurante/configuracoes/endereco` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/mercado-pago` | `/restaurante/configuracoes/mercado-pago` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/notificacoes` | `/restaurante/configuracoes/notificacoes` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/operacao` | `/restaurante/configuracoes/operacao` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes` | `/restaurante/configuracoes` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/planos` | `/restaurante/configuracoes/planos` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/seguranca` | `/restaurante/configuracoes/seguranca` | Estado inicial inspecionado |
| Restaurante | `/restaurante/configuracoes/suporte` | `/restaurante/configuracoes/suporte` | Estado inicial inspecionado |
| Restaurante | `/restaurante/dashboard` | `/restaurante/dashboard` | Estado inicial inspecionado |
| Restaurante | `/restaurante/desempenho` | `/restaurante/desempenho` | Estado inicial inspecionado |
| Restaurante | `/restaurante/financeiro` | `/restaurante/financeiro` | Estado inicial inspecionado |
| Restaurante | `/restaurante/historico-pedidos` | `/restaurante/historico-pedidos` | Estado inicial inspecionado |
| Restaurante | `/restaurante/mensagens` | `/restaurante/mensagens` | Estado inicial inspecionado |
| Restaurante | `/restaurante/mensagens/1` | `/restaurante/mensagens/1` | ReferenceError: dataHoraUI is not defined |
| Restaurante | `/restaurante/notificacoes` | `/restaurante/notificacoes` | Estado inicial inspecionado |
| Restaurante | `/restaurante/pedidos` | `/restaurante/pedidos` | Estado inicial inspecionado |
| Restaurante | `/restaurante/plano` | `/restaurante/configuracoes/planos` | Redirecionamento; destino inspecionado |
| Restaurante | `/restaurante/reembolsos` | `/restaurante/reembolsos` | Estado inicial inspecionado |
| Restaurante | `/restaurante/reservas` | `/restaurante/reservas` | Estado inicial inspecionado |
| Restaurante | `/restaurante/suporte` | `/restaurante/configuracoes/suporte` | Redirecionamento; destino inspecionado |
