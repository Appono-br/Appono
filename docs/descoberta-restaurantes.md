# Categorias e descoberta de restaurantes

## Investigação

- A categoria do perfil fica em `public.restaurantes.categorias_culinarias` (`text[]`), criada em `20261001000400_restaurant_profile_categories_and_preparation_estimate.sql`, com índice GIN. Um restaurante pode selecionar até oito categorias.
- `frontend/components/auth/register-restaurant-form.jsx` reutiliza o catálogo existente de opções de cadastro. `backend/src/routes/auth.js` valida as escolhas, inclui o array no metadata do cadastro e o salva no perfil do restaurante. `backend/src/routes/me.js` permite atualizar esse mesmo campo nas configurações. Nenhuma dessas rotas foi alterada.
- `GET /api/restaurantes` em `backend/src/routes/restaurants.js` já consultava o array. Agora `categoria` usa `contains` nesse campo, aproveitando o índice existente.
- `public.categorias` contém seções de cardápio. A busca em `/cliente/busca?categoria=...` continua filtrando pratos por essas seções; a nova página `/cliente/restaurantes?categoria=...` filtra pela culinária do restaurante.
- `20260804000100_add_client_favorites_and_restaurant_reviews.sql` criou `public.restaurantes_favoritos` e `public.avaliacoes_restaurante`, com notas entre 1 e 5. `20260815000200_reviews_per_delivered_order.sql` passou a vincular avaliações a pedidos entregues. A descoberta reutiliza esses registros.
- `20260902000400_add_restaurant_geolocation.sql` criou `latitude`, `longitude` e `geocodificado_em`. O serviço `backend/src/services/geolocalizacao.js` já consulta Nominatim com endereço e CEP. As rotas existentes de cadastro/configuração e listagem reaproveitam esse serviço para salvar coordenadas. ViaCEP valida e preenche o endereço; não fornece diretamente as coordenadas usadas pelo filtro.

A consulta de leitura ao Supabase em 05/10/2026 encontrou 14 restaurantes ativos, todos com latitude/longitude, uma avaliação e dois favoritos. Nenhum restaurante ativo tinha `categorias_culinarias` preenchido. Esse retrato não é usado como dado fixo na aplicação: sem escolhas, a home exibe um estado vazio; as categorias aparecem ao serem salvas pelos restaurantes.

## Ativação

Aplique `supabase/migrations/20261005030000_list_restaurant_profile_categories.sql` no projeto de destino antes de publicar o código. Ela cria somente `listar_categorias_restaurantes()`, uma função de leitura com `security invoker`, que respeita as permissões/RLS do chamador. A consulta usa `unnest`, `group by` e `count(distinct id_restaurante)` em restaurantes ativos, excluindo valores vazios. Não cria tabelas, não insere categorias nem altera perfis ou políticas existentes.

Siga o procedimento de revisão de destino e migrations em `docs/preparacao-supabase.md`. Esta tarefa preparou a migration localmente; não a aplicou no banco remoto.

Se a home mostrar “Não foi possível carregar as categorias”, confira a resposta de `GET /api/restaurantes/categorias`. O código `CATEGORIAS_MIGRATION_PENDENTE` identifica a ausência da função no schema cache do Supabase (`PGRST202`); aplique a migration acima no mesmo projeto configurado em `backend/.env`. Ela pode ser executada diretamente no SQL Editor do projeto. Outros erros recebem `CATEGORIAS_CONSULTA_FALHOU`. Uma consulta bem-sucedida sem categorias retorna HTTP 200 com `[]`, exibindo o estado vazio em vez de uma mensagem de erro.

## Comportamento

- A home autenticada em `/cliente/dashboard` inclui uma fileira horizontal de categorias com fotos relacionadas a cada culinária (feijoada para Brasileira, massa para Italiana, sushi para Japonesa e assim por diante). Todas as opções do cadastro têm imagem definida em `frontend/components/cliente/categorias-restaurantes.jsx`. As fotos são arquivos locais WebP de 240 × 240 pixels em `frontend/public/images/categorias`, com fontes e licenças em `CREDITOS.md`. O mapeamento de fotos é apenas visual: os nomes e itens vêm de `GET /api/restaurantes/categorias`, que executa a agregação no banco. Categorias desconhecidas ou fotos que falham recebem um ícone de fallback.
- Cada categoria abre `/cliente/restaurantes?categoria=<nome codificado>`. Restaurantes sem pratos publicados também podem aparecer, desde que tenham a categoria escolhida no perfil.
- A página reutiliza o card extraído da busca, mantendo a apresentação existente e as ações de favorito/detalhes. A busca continua usando o mesmo componente.
- Na listagem por categoria, o usuário escolhe qualquer distância ou raios de 2, 5, 10 e 20 km. A Geolocation API é chamada somente ao ativar um raio, com tratamento de negativa, indisponibilidade e timeout. Não há uma localização presumida quando a permissão é negada.
- Na seção “Perto de Você” da home, o cliente informa um endereço, bairro, cidade ou CEP e envia a busca pelo botão Procurar ou pela tecla Enter. A requisição usa `localizacao`, `raio_km` (omitido em qualquer distância) e `ordenacao=distancia`. A origem é o local digitado, geocodificado pelo serviço existente, sem solicitar a localização do navegador. Endereços não encontrados retornam `LOCALIZACAO_NAO_ENCONTRADA` e uma orientação para corrigir a busca.
- O backend compara a distância em linha reta calculada por Haversine, sem arredondar antes do filtro. Restaurantes sem coordenadas válidas ficam fora do raio quando a geocodificação existente não consegue resolvê-las.
- Categoria e raio podem ser combinados com ordenação por nome, maior nota média ou maior quantidade de favoritos. O ranking lê todas as páginas de avaliações/favoritos; falhas nessas consultas retornam erro em vez de notas/contagens fictícias. A ordenação usa a média exata; o card apresenta uma casa decimal.
- As alterações não abrangem autenticação, pagamento, lógica de reservas ou cadastro/configuração de restaurantes.

## Validação

Passaram 21 testes em `restaurant-discovery.test.js`, `restaurant-dishes.test.js`, `restaurant-availability.test.js` e `geolocalizacao.test.js`. A cobertura inclui filtro pelo perfil (independente de seções do cardápio), restaurante com múltiplas categorias ou sem pratos, filtros combinados, métricas reais das consultas, paginação acima de mil registros, média sem arredondamento, limite de distância, coordenadas inválidas/ausentes, geocodificação, busca por endereço com diferentes origens e raios, endereço não encontrado e erros de consulta.

```powershell
node --test backend/test/restaurant-discovery.test.js backend/test/restaurant-dishes.test.js backend/test/restaurant-availability.test.js backend/test/geolocalizacao.test.js
npm run build --workspace frontend
```

O lint dos componentes/páginas envolvidos e o build de produção também passaram. Uma verificação de leitura executou a rota de listagem contra o Supabase configurado: nome, nota média e favoritos retornaram HTTP 200 com os 14 restaurantes, uma avaliação e dois favoritos; os rankings estavam na ordem esperada. O filtro por categoria retornou vazio, conforme os perfis atuais. A chamada à nova função de categorias ainda depende da migration.

Os testes usam fixtures isoladas em memória; não inserem dados no Supabase. A função SQL nova ainda precisa ser validada no destino após a aplicação da migration. A busca por localização da home foi verificada no Chrome, com respostas isoladas da API, nas larguras de 390, 768 e 1366 px: envio pelo botão e por Enter, troca de raio, qualquer distância, endereço não encontrado, resultados vazios e validação do campo em branco. A verificação não acessou o Supabase nem o serviço externo de geocodificação.

Após aplicar a migration, confira o estado vazio da home com o banco atual. Quando um restaurante selecionar uma categoria pelas configurações existentes, confira a fileira, a navegação e as combinações de raio/ordenação, inclusive com permissão de localização negada.
