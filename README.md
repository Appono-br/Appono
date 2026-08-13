# Appono

Plataforma gastronômica para descoberta de restaurantes, reserva de mesas, pedidos antecipados, pagamento pelo Mercado Pago e gestão operacional e financeira.

## Estado do projeto

O projeto está em estágio de MVP funcional avançado. Cadastro, autenticação, restaurantes, cardápio, reservas, pedidos, notificações, favoritos, avaliações e fluxo Mercado Pago estão implementados. Chat permanece parcial ou simulado.

## Arquitetura

- Frontend: Next.js 16, React 19 e Tailwind CSS.
- Backend: Node.js e Express 5.
- Dados e autenticação: Supabase/PostgreSQL com Row Level Security.
- Pagamentos: Checkout Pro e marketplace Mercado Pago.
- Estrutura: monorepo npm com workspaces `frontend` e `backend`.

```text
Cliente → reserva → pedido antecipado → Mercado Pago
        → confirmação → preparo → entrega → liberação do repasse
```

## Configuração

Backend (`backend/.env`):

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_PUBLIC_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:3001
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_APP_ID=
MERCADO_PAGO_CLIENT_SECRET=
MERCADO_PAGO_REDIRECT_URI=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_MARKETPLACE_FEE_PERCENTUAL=13
MERCADO_PAGO_MODO_REPASSE=SIMULADO
MERCADO_PAGO_PERMITIR_PRODUCAO=false
APPONO_ADMIN_EMAILS=
```

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
```

Não versionar `.env`. Nunca colocar chaves secretas ou access tokens em variáveis `NEXT_PUBLIC_*`.

## Instalação e execução

```powershell
npm install
npm run dev
```

Frontend: `http://localhost:3000`. Backend: `http://localhost:3001`. Saúde: `GET /api/health`.

Os scripts do backend iniciam o Node com `--use-system-ca`, necessário em redes Windows que inspecionam TLS. Mantenha `SUPABASE_ALLOW_INSECURE_TLS=false`; não desative a validação de certificados.

## Banco e migrations

As migrations ficam em `supabase/migrations`. Para um projeto vinculado pelo Supabase CLI:

```powershell
npx supabase db push
```

A migration `20260813000100_financial_webhook_idempotency.sql` cria o controle de webhooks, amplia a auditoria e torna eventos financeiros imutáveis. Em 13/08/2026, uma verificação somente leitura confirmou que ela já está aplicada no Supabase configurado localmente.

A migration `20260814000100_expire_no_show_reservations.sql` adiciona `NAO_COMPARECEU` e a transição atômica de reservas confirmadas cujo horário final terminou sem check-in. Ela também cancela pedidos pendentes, recusa pagamentos ainda pendentes e registra auditoria. Esta migration precisa ser aplicada antes de executar a versão correspondente do backend.

Aplicar migrations primeiro em testes, depois em homologação e por último em produção. Fazer backup e validar restauração antes de alterações críticas.

## Segurança de pagamentos

A Appono não coleta nem armazena número completo de cartão, validade ou CVV. Esses dados são informados exclusivamente no checkout do Mercado Pago. Dados legados são removidos do navegador ao carregar a aplicação.

O webhook usa assinatura quando o segredo está configurado, controle de idempotência e trilha de processamento. Eventos atrasados não regridem pagamento aprovado; estorno e chargeback prevalecem como estados terminais.

Pedidos pendentes somente podem iniciar ou reutilizar um checkout enquanto a reserva estiver confirmada e antes do horário marcado. Ao vencer o prazo, o pedido e o pagamento pendentes são encerrados e o evento fica registrado na auditoria. Na conciliação, o backend compara `date_approved` do Mercado Pago — ou `date_created` como fallback controlado — com o horário da reserva; o horário de chegada do webhook não interfere na decisão. Uma aprovação efetivamente tardia solicita estorno real com chave idempotente, e webhooks repetidos não solicitam um segundo estorno.

Pagamento aprovado e check-in são estados independentes: o pagamento confirma o pedido, enquanto o check-in registra a presença e só é liberado 15 minutos antes da reserva. O restaurante pode desmarcar uma reserva antes do início; se houver pagamento aprovado, `PATCH /api/reservas/:id/cancelar-restaurante` realiza o estorno real antes de cancelar a reserva e o pedido. Falha no estorno impede o cancelamento.

Quando `MERCADO_PAGO_PERMITIR_PRODUCAO=false`, o backend entrega exclusivamente `sandbox_init_point`; nunca utiliza `init_point`, independentemente do prefixo da credencial. Pagamentos reais legados exigem uma credencial de produção com permissão de pagamentos para serem estornados, ou estorno manual pelo painel Mercado Pago.
Após um estorno manual, uma nova tentativa de cancelamento consulta o gateway, reconhece o estado `refunded` e sincroniza reserva, pedido e pagamento sem solicitar outro estorno.

## Pedidos do cliente

`GET /api/pedidos?page=1&limit=12` retorna uma listagem resumida e paginada no formato `{ items, pagination }`; `GET /api/pedidos/:id` carrega relacionamentos e itens somente para o pedido aberto. A tela de pedidos direciona cada registro para `/cliente/pedidos/:id`, onde ficam pagamento, cancelamento e acesso à avaliação. Rotas estáticas, como `/api/pedidos/historico/restaurante`, são declaradas antes da rota dinâmica por ID.

## Organização e manutenção

O projeto permanece integralmente em JavaScript e Node.js. Regras puras ficam em `backend/src/domain`, configuração e integração financeira em `backend/src/services/pagamentos`, e rotas Express coordenam HTTP, autorização e serviços. No frontend, listagens usam paginação, abortam requisições antigas e carregam detalhes por ID para reduzir consultas, payload e acoplamento entre telas.

## Testes e qualidade

```powershell
npm test
npm run lint
npm run build
```

Cobertura atual:

- Transições de pedidos.
- Comissão e valor do restaurante.
- Eventos financeiros fora de ordem.
- Estorno e chargeback.
- Elegibilidade e vencimento do pagamento conforme a reserva.
- Paginação e limites de listagem.
- Matriz de perfis e propriedade de recursos.
- Conflitos de horários de reservas.
- Sanitização de dados sensíveis em logs.

## Favoritos e avaliações

Endpoints disponíveis:

- `GET /api/restaurantes`: inclui média, quantidade de avaliações, total de favoritos e favorito do cliente autenticado.
- `GET /api/restaurantes/:id`: inclui métricas e avaliações recentes.
- `PATCH /api/restaurantes/:id/favorito`: adiciona ou remove favorito; somente cliente.
- `GET /api/restaurantes/:id/minha-avaliacao`: consulta a avaliação do cliente.
- `POST /api/restaurantes/:id/avaliacoes`: cria ou atualiza avaliação após reserva concluída ou pedido entregue.
- `GET /api/restaurantes/me/avaliacoes`: lista avaliações recebidas pelo restaurante autenticado.

As escritas usam o token do usuário e respeitam RLS; não utilizam `supabaseAdmin` para ignorar autorização.

No frontend, o dashboard persiste favoritos, `/cliente/favoritos` reúne a seleção do cliente, a página pública do restaurante permite avaliar uma experiência elegível e `/restaurante/desempenho` apresenta média, volume e comentários reais.

Testes de concorrência real, RLS entre usuários e webhooks completos precisam de um Supabase exclusivo de testes. Não devem criar dados artificiais no banco com dados reais.

## Prontidão

### Bloqueadores antes de pagamentos reais ou piloto

- Criar Supabase exclusivo para testes automatizados.
- Executar concorrência real de reservas e pedidos.
- Executar matriz RLS autenticada com dois clientes, dois restaurantes e administrador.
- Validar webhook duplicado, pendente → aprovado e aprovado → estornado no sandbox.
- Validar estorno real no sandbox Mercado Pago.
- Implementar conciliação periódica independente das telas.
- Configurar alertas externos e testar backup/restauração.
- Revisar termos e política de privacidade juridicamente.

### Não bloqueia evolução dos módulos

- Chat.
- Melhorias visuais e skeletons.
- Paginação adicional enquanto o volume permanece baixo.
- Refatoração gradual dos arquivos grandes.

É seguro continuar construindo módulos sem dinheiro real enquanto os bloqueadores são tratados. Não é seguro iniciar o piloto financeiro antes deles.

## Documentação

- [Fluxo Mercado Pago](docs/fluxo-pagamento-mercado-pago.md)
- [Melhorias técnicas](docs/melhorias-tecnicas.md)
- [Operação e implantação](docs/operacao-producao.md)
- [LGPD e incidentes](docs/lgpd-e-incidentes.md)
- [Piloto controlado](docs/piloto-controlado.md)
