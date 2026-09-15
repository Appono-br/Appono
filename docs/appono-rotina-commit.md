# Commit preparado

Título: **Appono Rotina - Integridade transacional da primeira versão**

## Problema

Múltiplas escritas REST podiam deixar perfil/seleções ou sugestões parcialmente alterados. Abas concorrentes não possuíam controle de versão comum à geração, edição e conversão.

## Comportamento final

- Operações atômicas com auditoria obrigatória, rollback e versões.
- Lock comum por cliente, preservação de refeições convertidas e validação de saldo.
- PATCH correto, HTTP 409 e recuperação explícita do rascunho.
- RLS e propriedade preservadas; conversão reutiliza regras existentes, sem alterar o fluxo do Mercado Pago.
- Migration incremental com diagnóstico de dados legados e validações alinhadas.

## Migration necessária

`20260913220856_routine_transaction_integrity.sql`, após a inicial `20260912000200_create_appono_routine.sql`.

Atualizar migration, API e frontend de forma coordenada. Não publicar a API nova antes da migration. Planos antigos precisam ser regenerados para registrar a versão de origem; vínculos convertidos permanecem.

## Evidências e limitações

80 testes da aplicação, 17 testes PostgreSQL isolados e o smoke integrado com dois JWTs reais passaram; lint e builds passaram. Consulte `docs/appono-rotina-integridade-transacional.md` para metodologia e cenários.

Migrations aplicadas pelo usuário e estrutura confirmada pelo smoke. Permanecem a inspeção visual do conflito no navegador e uma conversão/checkout sandbox controlados; não foram criadas reservas nem iniciados pagamentos neste último teste. Sem commit/push executados. Revisar também os arquivos novos ainda não rastreados: git diff sozinho não mostra seu conteúdo. Nenhum .env ou credencial deve entrar no staging; `.codex-analysis/` contém apenas ferramentas/artefatos locais ignorados.
