begin;

-- O Mercado Pago passa a ser a unica fonte de verdade para conexao financeira
-- e repasses dos restaurantes. Esta tabela legada nao armazena mais dados
-- bancarios desde 20260718000100 e seu status duplicava a conexao OAuth.
drop table if exists public.dados_bancarios_restaurante;

commit;
