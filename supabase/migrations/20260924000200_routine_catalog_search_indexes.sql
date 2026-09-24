-- Índices aditivos para a busca paginada do catálogo da Appono Rotina.
create extension if not exists pg_trgm;

create index if not exists restaurantes_ativos_coordenadas_idx
  on public.restaurantes (latitude, longitude)
  where ativo = true and latitude is not null and longitude is not null;

create index if not exists restaurantes_nome_busca_trgm_idx
  on public.restaurantes using gin (lower(nome) gin_trgm_ops)
  where ativo = true;

create index if not exists produtos_nome_busca_trgm_idx
  on public.produtos using gin (lower(nome) gin_trgm_ops)
  where disponivel = true and arquivado = false;

create index if not exists produtos_restaurante_publicados_idx
  on public.produtos (id_restaurante, id_produto)
  where disponivel = true and arquivado = false;
