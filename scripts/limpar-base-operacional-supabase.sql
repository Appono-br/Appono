-- Use apenas em ambiente de teste/desenvolvimento.
-- Limpa dados operacionais sem apagar clientes, restaurantes, mesas,
-- cardapios, categorias, produtos ou conexoes Mercado Pago.

begin;

alter table public.eventos_financeiros
  disable trigger eventos_financeiros_append_only;

truncate table
  public.notificacoes,
  public.solicitacoes_reembolso,
  public.eventos_financeiros,
  public.avaliacoes_restaurante,
  public.restaurantes_favoritos,
  public.item_adicional,
  public.itens_pedido,
  public.pagamentos,
  public.pedidos,
  public.reservas
restart identity cascade;

alter table public.eventos_financeiros
  enable trigger eventos_financeiros_append_only;

commit;
