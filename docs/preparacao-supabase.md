# Preparação do Supabase

[Voltar ao README](../README.md)

Este guia distingue a configuração da aplicação local das operações que alteram um projeto Supabase remoto. Use um projeto de desenvolvimento separado dos dados reais.

## Limitação do provisionamento inicial

A pasta [migrations](../supabase/migrations) contém alterações incrementais. O primeiro arquivo, [20260607020459_harden_core_database.sql](../supabase/migrations/20260607020459_harden_core_database.sql), cria índices e altera constraints em tabelas como `clientes`, `restaurantes`, `mesas`, `reservas` e `pedidos`. Ele pressupõe que essas tabelas e seus relacionamentos já existam.

Não foi localizado no repositório um script completo de criação desse schema base, um seed ou um `supabase/config.toml`. Portanto, criar um projeto vazio e aplicar as migrations disponíveis não é suficiente para instalar o Appono do zero.

Para começar, obtenha dos responsáveis um schema base compatível e o histórico de migrations correspondente, ou acesso a um projeto de desenvolvimento já preparado. O histórico deve refletir alterações efetivamente aplicadas; não marque migrations como executadas apenas para contornar erros. A disponibilização de um bootstrap reproduzível permanece pendente.

## Configuração da aplicação local

1. Use a URL e a chave pública do mesmo projeto em `backend/.env` e `frontend/.env.local`.
2. Configure a chave secreta administrativa apenas em `backend/.env`, como `SUPABASE_SECRET_KEY`. Os fluxos administrativos e parte dos cadastros dependem dela.
3. Mantenha `FRONTEND_ORIGIN=http://localhost:3000` e `NEXT_PUBLIC_API_URL=http://localhost:3001/api`, ou ajuste ambos para as portas escolhidas.
4. Reinicie backend e frontend depois de alterar a configuração.

Essas etapas apenas configuram arquivos locais. As próximas seções descrevem ajustes no serviço externo.

## Auth e redirecionamentos

No projeto Supabase de desenvolvimento, habilite os cadastros por e-mail e configure as URLs de retorno utilizadas pelo frontend:

| Finalidade | URL local padrão |
| --- | --- |
| Origem da aplicação | `http://localhost:3000` |
| Callback de autenticação | `http://localhost:3000/auth/callback` |
| Recuperação de senha | `http://localhost:3000/recuperar-senha` |

Cadastre as URLs de callback na lista de redirecionamentos permitidos. Se mudar a porta, atualize também essa lista e as variáveis locais. Veja a documentação de [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls).

O acesso com Google exige ativar o provedor e configurar as credenciais e o callback do Supabase no Google. O callback do provedor no Supabase e a URL de retorno para `/auth/callback` do Appono têm funções diferentes; siga o [guia oficial de login com Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

A recuperação de senha depende do envio de e-mails pelo Supabase. O fluxo de cadastro atual chama `signUp` e, quando não recebe sessão e possui cliente administrativo, tenta confirmar o e-mail via `updateUserById` e autenticar o usuário. Assim, a configuração de confirmação no painel, sozinha, não garante que o Appono exija a confirmação manual. Essa política precisa de revisão antes de um piloto.

Os perfis da aplicação são vinculados ao usuário de Auth por `id_auth`. A migration [create_profile_from_auth_user](../supabase/migrations/20260607224332_create_profile_from_auth_user.sql) cria perfis a partir dos dados de cadastro. O backend também possui recuperação de perfis a partir desses metadados quando a chave administrativa está disponível.

`APPONO_ADMIN_EMAILS` identifica contas com acesso administrativo; ela não cadastra usuários nem define senhas. Não há contas de demonstração fornecidas por seed.

## Storage

A migration [add_restaurant_public_profile](../supabase/migrations/20260611005859_add_restaurant_public_profile.sql) configura o bucket público `imagens-restaurantes` e políticas de escrita por usuário autenticado.

O [upload do frontend](../frontend/lib/imagem-restaurante.js) aceita JPG, PNG e WebP de até 5 MB. Ele grava o arquivo no caminho do usuário autenticado e atualiza `logo_url` em `restaurantes`. Confirme a presença do bucket e das políticas quando investigar falhas de upload.

## Aplicação incremental em projeto remoto

**Este procedimento altera o projeto vinculado. Não o use para tentar inicializar um banco vazio.** O schema base e o histórico precisam estar alinhados antes do primeiro push. Revise os arquivos SQL e prepare backup/restauração conforme o ambiente.

A CLI não é uma dependência dos workspaces. O uso via `npx` pode baixar a ferramenta; consulte a [instalação oficial da Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

Na raiz `Appono`, inicialize a configuração local da CLI apenas se ainda não houver `supabase/config.toml`:

```powershell
npx supabase init
```

Em seguida, autentique a CLI, substitua o placeholder pelo identificador do projeto de desenvolvimento e revise as migrations pendentes:

```powershell
npx supabase login
npx supabase link --project-ref "seu-project-ref"
npx supabase migration list
npx supabase db push --dry-run
```

O `--dry-run` lista as migrations previstas sem aplicá-las. Ele não comprova que o SQL executará com sucesso. Somente depois de revisar o destino e as alterações, aplique:

```powershell
npx supabase db push
```

A CLI registra as migrations executadas e pula as já presentes no histórico. Consulte a [referência de `db push`](https://supabase.com/docs/reference/cli/supabase-db-push) para o comportamento do comando. A publicação da aplicação não substitui a aplicação das migrations.

## Migrations e fluxos associados

A tabela destaca dependências operacionais; não substitui a sequência completa da pasta de migrations.

| Migration | Efeito |
| --- | --- |
| [financial_webhook_idempotency](../supabase/migrations/20260813000100_financial_webhook_idempotency.sql) | Controle de webhooks e auditoria financeira |
| [expire_no_show_reservations](../supabase/migrations/20260814000100_expire_no_show_reservations.sql) | Estado `NAO_COMPARECEU`, cancelamento de pedidos pendentes e eventos de expiração |
| [create_simulated_refunds](../supabase/migrations/20260815000100_create_simulated_refunds.sql) | Solicitações de reembolso, RLS e conclusão transacional |
| [add_client_attendance_confirmation](../supabase/migrations/20260825000100_add_client_attendance_confirmation.sql) | Confirmação de presença até uma hora antes, ausência e cálculo de reembolso parcial |
| [remove_preparation_time_from_orders](../supabase/migrations/20260901000100_remove_preparation_time_from_orders.sql) | Atualização das funções de pedidos após a mudança para fila operacional |
| [add_restaurant_geolocation](../supabase/migrations/20260902000400_add_restaurant_geolocation.sql) | Coordenadas e registro da geocodificação do restaurante |
| [create_secure_chat](../supabase/migrations/20260908000100_create_secure_chat.sql) | Conversas, mensagens e RLS por participante |
| [create_support_complaints](../supabase/migrations/20260912000100_create_support_complaints.sql) | Chamados, mensagens de suporte e controle de acesso |

O README anterior registrava uma verificação de aplicação da migration de idempotência em 13/08/2026. Esse registro histórico não comprova o estado de outro projeto nem o estado atual do banco. Confira o histórico do destino antes de qualquer aplicação.

## Desenvolvimento, homologação e produção

Use bancos e credenciais distintos. Testes de concorrência, RLS e webhooks devem ocorrer em um Supabase exclusivo de testes, sem dados pessoais reais. Migrations devem ser validadas em testes e homologação antes de produção, com backup e restauração verificados conforme o [guia de operação](operacao-producao.md).

O provisionamento de um banco novo continua dependente da disponibilização do schema base e de um histórico de migrations compatível.
