begin;

alter table public.avaliacoes_sombra_rotina
  add column volume_efetivo_desafiante numeric(10,4),
  add column consistencia_desafiante numeric(4,3),
  add column metadados_desafiante jsonb not null default '{}'::jsonb,
  add column falhou boolean not null default false,
  add column erro_codigo_desafiante text,
  add constraint avaliacoes_sombra_volume_efetivo_check check (
    volume_efetivo_desafiante is null or volume_efetivo_desafiante between 0 and 100000
  ),
  add constraint avaliacoes_sombra_consistencia_check check (
    consistencia_desafiante is null or consistencia_desafiante between 0 and 1
  ),
  add constraint avaliacoes_sombra_metadados_check check (
    jsonb_typeof(metadados_desafiante) = 'object'
  ),
  add constraint avaliacoes_sombra_erro_v2_check check (
    erro_codigo_desafiante is null or char_length(erro_codigo_desafiante) between 2 and 80
  );

comment on column public.avaliacoes_sombra_rotina.metadados_desafiante is
  'Diagnostico agregado e privado do desafiante; nao deve conter PII, agenda, endereco, coordenadas ou alergias.';

notify pgrst, 'reload schema';

commit;
