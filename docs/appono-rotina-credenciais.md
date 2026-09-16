# Credenciais e integrações do Appono Rotina

Este guia descreve como preparar as integrações externas já previstas no código. Use projetos, aplicações e credenciais diferentes em desenvolvimento, homologação e produção. Nunca envie segredos por chat, não os grave no Git e não coloque chaves privadas em variáveis `NEXT_PUBLIC_*`.

Os nomes abaixo correspondem aos arquivos `backend/.env.example` e `frontend/.env.example`. Substitua somente os valores nos arquivos locais ou no cofre de segredos da hospedagem.

## 1. Supabase

Documentação oficial: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations) e [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments).

### Obter URL e chaves

1. Entre no [Dashboard do Supabase](https://supabase.com/dashboard) e abra o projeto correto.
2. Abra **Connect** ou **Project Settings > API Keys**.
3. Copie a URL do projeto para `SUPABASE_URL` no backend e `NEXT_PUBLIC_SUPABASE_URL` no frontend.
4. Copie uma **Publishable key** (`sb_publishable_...`) para `SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Crie ou copie uma **Secret key** (`sb_secret_...`) para `SUPABASE_SECRET_KEY`, exclusivamente no backend.
6. Confira se URL e chaves pertencem ao mesmo projeto antes de iniciar a aplicação.

> `SUPABASE_SECRET_KEY` ignora RLS. Ela nunca pode ser usada no frontend, receber o prefixo `NEXT_PUBLIC_`, aparecer em logs ou ser entregue ao navegador. As chaves legadas `anon` e `service_role` ainda podem existir, mas o projeto deve preferir as chaves publishable e secret atuais.

### Configurar redirecionamentos do Auth

1. No Dashboard, abra **Authentication > URL Configuration**.
2. Em desenvolvimento, use `http://localhost:3000` como Site URL e adicione as URLs necessárias, incluindo `http://localhost:3000/auth/callback` e `http://localhost:3000/recuperar-senha`.
3. Em homologação, cadastre a URL HTTPS exata do frontend de homologação.
4. Em produção, defina a URL oficial como Site URL e use caminhos exatos na lista de redirecionamentos.
5. Evite curingas em produção. Quando previews forem indispensáveis, limite o padrão ao domínio controlado.
6. Mantenha `NEXT_PUBLIC_AUTH_CALLBACK_URL` e `NEXT_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL` coerentes com a lista permitida.

### Criar e aplicar migrations

1. Descubra os comandos disponíveis antes de usá-los:

```powershell
npm run supabase -- --help
npm run supabase -- migration --help
npm run supabase -- db push --help
```

2. Crie migrations incrementais com o CLI; não altere uma migration já aplicada:

```powershell
npm run supabase -- migration new nome_descritivo
```

3. Teste localmente com Docker e valide o histórico:

```powershell
npm run supabase -- start
npm run supabase -- db reset
npm run supabase -- migration list --local
```

4. Antes de homologação, vincule conscientemente o projeto e faça uma simulação:

```powershell
npm run supabase -- link --project-ref SEU_PROJECT_REF
npm run supabase -- migration list --linked
npm run supabase -- db push --dry-run
```

5. Aplique em homologação somente após revisar o `--dry-run`. Produção deve usar uma etapa controlada de CI/CD, backup e janela de implantação.
6. Se migrations anteriores foram executadas pelo SQL Editor, reconcilie o histórico com `migration list` e `migration repair` antes de qualquer `db push`. Não repita SQL já aplicado.

Ambientes recomendados:

- **Local:** Supabase CLI, dados descartáveis e URLs localhost.
- **Homologação:** projeto Supabase separado, credenciais de teste e dados sintéticos.
- **Produção:** projeto isolado, secret key própria, backups, logs e acesso restrito.

## 2. Mercado Pago

Documentação oficial: [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials), [OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation), [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks) e [Testar a integração](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-test).

### Criar a aplicação e obter credenciais de teste

1. Entre em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) com a conta responsável pela plataforma.
2. Crie uma aplicação para o Appono e selecione os produtos usados pelo projeto.
3. Abra **Dados da integração > Testes > Credenciais de teste**.
4. Coloque o Access Token de teste em `MERCADO_PAGO_TEST_ACCESS_TOKEN`, somente no backend.
5. Coloque a Public Key de teste em `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, quando o checkout do frontend exigir essa chave.
6. Mantenha `MERCADO_PAGO_PERMITIR_PRODUCAO=false` e `MERCADO_PAGO_MODO_REPASSE=SIMULADO` durante o desenvolvimento.

O prefixo, sozinho, não prova que uma credencial pertence ao ambiente esperado. Confirme no painel da aplicação e realize pagamentos somente com comprador e dados de teste.

### Configurar OAuth de restaurantes

1. Na aplicação, habilite/configure OAuth para conexão de contas de restaurantes.
2. Copie o identificador da aplicação para `MERCADO_PAGO_APP_ID`.
3. Copie o segredo para `MERCADO_PAGO_CLIENT_SECRET`, somente no backend.
4. Cadastre a URL HTTPS exata do callback e repita-a em `MERCADO_PAGO_REDIRECT_URI`:

```text
https://SEU_BACKEND/api/marketplace/mercado-pago/callback
```

5. Não use o Client Secret nem access tokens no frontend. O backend troca o código OAuth e cifra os tokens do restaurante.

### Configurar webhook e criptografia

1. Em **Webhooks > Configurar notificações**, cadastre:

```text
https://SEU_BACKEND/api/pagamentos/webhook/mercado-pago
```

2. Habilite os eventos de pagamento usados pelo checkout.
3. Revele/copie a assinatura secreta do webhook para `MERCADO_PAGO_WEBHOOK_SECRET`.
4. Configure `MERCADO_PAGO_WEBHOOK_SIGNATURE_REQUIRED=true` em homologação e produção.
5. Gere uma chave aleatória de 32 bytes para `APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY`:

```powershell
[Convert]::ToBase64String([byte[]](1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

6. Armazene a chave no cofre de segredos. Trocar ou perder essa chave torna os tokens OAuth existentes ilegíveis.

Ordem segura de implantação:

1. Aplique `20260915214739_harden_mercado_pago_security.sql` no ambiente autorizado.
2. Configure `APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY` no backend.
3. Execute `npm run security:migrate-mercado-pago-tokens --workspace backend` para tokens legados ou peça que os restaurantes reconectem suas contas.
4. Publique o backend ainda com produção desabilitada.
5. Valide OAuth, checkout, assinatura, idempotência e reenvio de webhook no sandbox.
6. Só avalie produção depois de reconciliar pagamentos e confirmar que nenhum token aparece em logs ou respostas.

**Não habilite pagamentos de produção antes de validar sandbox, webhook assinado e criptografia dos tokens.**

## 3. Resend

Documentação oficial: [API keys](https://resend.com/docs/dashboard/api-keys/introduction), [Domains](https://resend.com/docs/dashboard/domains/introduction) e [Send test emails](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend).

1. Crie uma conta no [Resend](https://resend.com/) e ative a equipe do projeto.
2. Em **Domains**, adicione um domínio ou subdomínio controlado, preferencialmente algo como `updates.seudominio.com`.
3. Publique os registros SPF e DKIM fornecidos e aguarde o status verificado. DMARC é recomendado para produção.
4. Em **API Keys**, clique em **Create API Key**.
5. Dê um nome por ambiente e selecione **Sending access**, restrito ao domínio verificado. Não use Full access apenas para enviar e-mails.
6. Copie a chave, exibida uma única vez, para `RESEND_API_KEY` no backend.
7. Configure um remetente do domínio verificado em `RESEND_FROM_EMAIL`, por exemplo `Appono <notificacoes@updates.seudominio.com>`.
8. Gere um segredo longo e independente para proteger o worker em `APPONO_CRON_SECRET`:

```powershell
[Convert]::ToBase64String([byte[]](1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

9. Mantenha `APPONO_EMAIL_ENABLED=false` enquanto testa a outbox e o transporte fake.
10. No modo de teste do Resend, envie primeiro somente ao e-mail autorizado pela conta. Contas sem domínio verificado não podem enviar livremente para terceiros.
11. Após validar remetente, template, unsubscribe/preferências, retries e o endpoint `POST /api/cron/emails`, defina `APPONO_EMAIL_ENABLED=true` apenas no ambiente desejado.

## 4. Google Agenda

Documentação oficial: [Enable the Calendar API and configure OAuth](https://developers.google.com/workspace/calendar/api/quickstart/nodejs), [OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent) e [Calendar scopes](https://developers.google.com/workspace/calendar/api/auth).

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e crie ou selecione um projeto exclusivo para o ambiente.
2. Em **APIs & Services > Library**, habilite **Google Calendar API**.
3. Em **Google Auth Platform**, preencha **Branding**, **Audience** e **Data Access**.
4. Para testes externos, mantenha o app em modo de teste e adicione explicitamente os usuários de teste.
5. Em **Clients**, crie um **OAuth client ID** do tipo **Web application**.
6. Cadastre a redirect URI exata e repita-a em `GOOGLE_CALENDAR_REDIRECT_URI`:

```text
https://SEU_BACKEND/api/rotina/agenda/google/callback
```

7. Copie Client ID para `GOOGLE_CALENDAR_CLIENT_ID` e Client Secret para `GOOGLE_CALENDAR_CLIENT_SECRET`.
8. Gere outra chave de 32 bytes, exclusiva para `APPONO_CALENDAR_TOKEN_ENCRYPTION_KEY`. Não reutilize a chave do Mercado Pago.
9. O backend já solicita `openid`, `email` e o escopo mínimo `https://www.googleapis.com/auth/calendar.events.freebusy`. Não adicione escopos de escrita ou leitura integral de eventos.
10. Configure as variáveis e só então altere `APPONO_ROTINA_AGENDA_GOOGLE_ENABLED=true` em homologação.
11. Valide conexão, refresh token, sincronização, revogação e desconexão com usuários de teste.
12. Antes de publicar para usuários externos, conclua a publicação/verificação exigida pelo Google para os escopos selecionados.

O Appono deve persistir somente intervalos ocupados. Não importe título, descrição, convidados ou local dos eventos quando `freeBusy` já atende à decisão.

## 5. Outlook e Microsoft Graph

Documentação oficial: [Registrar aplicação](https://learn.microsoft.com/graph/auth-register-app-v2), [Adicionar redirect URI](https://learn.microsoft.com/entra/identity-platform/how-to-add-redirect-uri), [getSchedule](https://learn.microsoft.com/graph/api/calendar-getschedule?view=graph-rest-1.0) e [Permissões do Graph](https://learn.microsoft.com/graph/permissions-reference#calendarsreadbasic).

1. Entre no [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Abra **Entra ID > App registrations > New registration**.
3. Escolha o tipo de conta conforme o piloto:
   - somente o diretório atual para um teste corporativo controlado;
   - qualquer diretório organizacional para SaaS B2B;
   - diretórios organizacionais e contas Microsoft pessoais somente se ambos forem requisito e tiverem sido validados no fluxo real.
4. Em **Authentication**, adicione a plataforma **Web** e a redirect URI exata:

```text
https://SEU_BACKEND/api/rotina/agenda/outlook/callback
```

5. Copie **Application (client) ID** para `MICROSOFT_CALENDAR_CLIENT_ID`.
6. Em **Certificates & secrets**, crie um Client Secret com prazo curto, copie seu **Value** uma única vez e salve em `MICROSOFT_CALENDAR_CLIENT_SECRET`.
7. Configure a mesma URL em `MICROSOFT_CALENDAR_REDIRECT_URI`.
8. Em **API permissions > Microsoft Graph > Delegated permissions**, mantenha os mínimos usados pelo backend: `openid`, `email`, `offline_access`, `User.Read` e `Calendars.ReadBasic`.
9. Conceda consentimento administrativo somente quando a política do tenant exigir e após revisar os escopos.
10. Configure `APPONO_CALENDAR_TOKEN_ENCRYPTION_KEY` e, por último, `APPONO_ROTINA_AGENDA_OUTLOOK_ENABLED=true` em homologação.
11. Teste separadamente uma conta corporativa e uma conta pessoal pretendida. Tenants podem bloquear consentimento do usuário, e a disponibilidade de APIs/permissões pode variar conforme o tipo de conta e a política da organização.

O backend consulta `/me/calendar/getSchedule` e guarda apenas disponibilidade. Não amplie para `Calendars.ReadWrite` nem exponha detalhes dos compromissos.

## 6. Geocodificação com Nominatim

Política oficial: [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/).

O Appono atualmente consulta `nominatim.openstreetmap.org` no backend quando o cliente confirma um endereço. Nesta fase não há API key obrigatória.

Regras que já orientam a implementação:

1. Enviar um `User-Agent` identificável com contato do projeto.
2. Respeitar o máximo absoluto de uma requisição por segundo para a instância pública; o serviço atual mantém intervalo de 1,1 segundo.
3. Manter cache para não repetir endereços; o cache atual em memória dura 24 horas.
4. Não implementar autocomplete do lado do cliente, geocodificação em massa ou consultas sistemáticas.
5. Exibir a atribuição aplicável ao OpenStreetMap e não enviar dados pessoais ou confidenciais desnecessários.
6. Tratar indisponibilidade e ambiguidade sem inventar coordenadas.

A instância pública não oferece SLA para uma aplicação comercial em escala. Antes do crescimento do tráfego, contrate um provedor com SLA ou hospede uma instância compatível. A troca não faz parte desta etapa.

Para um provedor futuro, reserve nomes próprios e somente no backend, por exemplo:

```dotenv
GEOCODING_PROVIDER=provedor_escolhido
GEOCODING_API_URL=https://api.exemplo.com
GEOCODING_API_KEY=segredo-do-backend
GEOCODING_TIMEOUT_MS=6000
GEOCODING_CACHE_TTL_SECONDS=86400
```

Não adicione essas variáveis agora sem escolher o provedor e implementar o adaptador, limites, termos de uso e testes correspondentes.

## Checklist antes de ativar qualquer integração

1. Variáveis configuradas no ambiente correto e ausentes do diff do Git.
2. Redirect URIs idênticas entre provedor e backend.
3. Migrations aplicadas e histórico reconciliado.
4. Chaves de criptografia com backup seguro e acesso restrito.
5. Feature flags ainda desativadas durante o primeiro deploy.
6. Teste com contas e dados sintéticos.
7. Logs revisados para confirmar ausência de tokens, segredos e conteúdo de agenda.
8. Cenários de revogação, retry, webhook duplicado e desconexão validados.
9. Ativação gradual em homologação antes de produção.
