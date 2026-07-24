alter table public.produtos
  add column if not exists destaque boolean not null default false;

create index if not exists idx_produtos_destaque_restaurante
  on public.produtos (id_restaurante, destaque)
  where destaque = true;
