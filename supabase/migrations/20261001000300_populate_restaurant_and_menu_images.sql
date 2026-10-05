begin;

-- Imagens de apresentação para registros que ainda não receberam uma foto própria.
-- Fotos enviadas pelos restaurantes nunca são substituídas por esta migração.
with imagens_restaurante(ordem, url) as (
  values
    (1, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=85'),
    (2, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=85'),
    (3, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85'),
    (4, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=85'),
    (5, 'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?auto=format&fit=crop&w=800&q=85'),
    (6, 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=800&q=85')
), restaurantes_sem_imagem as (
  select id_restaurante, row_number() over (order by id_restaurante) as posicao
  from public.restaurantes
  where nullif(trim(logo_url), '') is null
)
update public.restaurantes restaurante
set logo_url = imagem.url
from restaurantes_sem_imagem pendente
join imagens_restaurante imagem on imagem.ordem = ((pendente.posicao - 1) % 6) + 1
where restaurante.id_restaurante = pendente.id_restaurante;

with imagens_prato(ordem, url) as (
  values
    (1, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85'),
    (2, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85'),
    (3, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85'),
    (4, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85'),
    (5, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=1000&q=85'),
    (6, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85'),
    (7, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1000&q=85'),
    (8, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1000&q=85')
), produtos_sem_imagem as (
  select id_produto, row_number() over (order by id_produto) as posicao
  from public.produtos
  where nullif(trim(imagem_url), '') is null
)
update public.produtos produto
set imagem_url = imagem.url
from produtos_sem_imagem pendente
join imagens_prato imagem on imagem.ordem = ((pendente.posicao - 1) % 8) + 1
where produto.id_produto = pendente.id_produto;

-- Remove o marcador técnico usado pelos primeiros dados de demonstração.
update public.restaurantes
set nome = regexp_replace(nome, '^\\s*\\[DEMO\\]\\s*', '', 'i'),
    razao_social = case
      when razao_social is null then null
      else regexp_replace(razao_social, '^\\s*\\[DEMO\\]\\s*', '', 'i')
    end
where nome ~* '^\\s*\\[DEMO\\]'
   or razao_social ~* '^\\s*\\[DEMO\\]';

update public.clientes
set nome = regexp_replace(nome, '^\\s*\\[DEMO\\]\\s*', '', 'i')
where nome ~* '^\\s*\\[DEMO\\]';

update public.perfis_rotina_cliente
set nome = regexp_replace(nome, '^\\s*\\[DEMO\\]\\s*', '', 'i')
where nome ~* '^\\s*\\[DEMO\\]';

commit;
