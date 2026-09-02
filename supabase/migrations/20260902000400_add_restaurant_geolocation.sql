alter table public.restaurantes
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists geocodificado_em timestamptz;

create index if not exists restaurantes_latitude_longitude_idx
  on public.restaurantes (latitude, longitude)
  where latitude is not null and longitude is not null;
