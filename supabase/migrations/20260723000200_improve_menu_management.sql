alter table public.categorias
  add column if not exists arquivado boolean not null default false,
  add column if not exists ordem_exibicao integer not null default 0;

alter table public.produtos
  add column if not exists arquivado boolean not null default false,
  add column if not exists ordem_exibicao integer not null default 0;

create index if not exists idx_categorias_cardapio_ordem
  on public.categorias (id_cardapio, arquivado, ordem_exibicao, nome);

create index if not exists idx_produtos_restaurante_categoria_ordem
  on public.produtos (id_restaurante, id_categoria, arquivado, ordem_exibicao, nome);
