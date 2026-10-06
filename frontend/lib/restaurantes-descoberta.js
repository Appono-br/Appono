export function mapearRestaurante(restaurant) {
  return {
    id: String(restaurant.id_restaurante),
    name: restaurant.nome,
    neighborhood: restaurant.endereco ?? undefined,
    imageUrl: restaurant.logo_url ?? undefined,
    openingHours: restaurant.horario_funcionamento ?? undefined,
    rating: restaurant.avaliacao_media,
    reviewCount: restaurant.total_avaliacoes ?? 0,
    favoriteCount: restaurant.total_favoritos ?? 0,
    isFavorite: Boolean(restaurant.favorito_cliente),
    matchedProducts: restaurant.produtos_encontrados ?? [],
    publishedDishes: restaurant.pratos_publicados ?? [],
    matchedCategories: restaurant.categorias_encontradas ?? [],
    matchedMenus: restaurant.cardapios_encontrados ?? [],
    publishedCategories: restaurant.categorias_publicadas ?? [],
    culinaryCategories: restaurant.categorias_culinarias ?? [],
    menuItemsCount: restaurant.total_itens_cardapio ?? 0,
    hasMenu: Boolean(restaurant.tem_cardapio_publicado),
    acceptsReservation: Boolean(restaurant.aceita_reserva),
    distanceKm: restaurant.distancia_km,
    resolvedLocation: restaurant.localizacao_resolvida,
  };
}

export function formatarDistancia(valor) {
  if (valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor))) return "Distância indisponível";
  const distancia = Number(valor);
  if (distancia < 1) return `${Math.max(100, Math.round(distancia * 10) * 100)} m`;
  return `${distancia.toFixed(distancia < 10 ? 1 : 0).replace(".", ",")} km`;
}
