export const TEMPO_LIMITE_REQUISICAO_MS = 7000;
export const DURACAO_CACHE_CONSULTA_MS = 10 * 60 * 1000;

export type ItemCache<T> = {
  valor: T;
  expiraEm: number;
};

export function somenteNumeros(valor?: string) {
  return (valor ?? "").replace(/\D/g, "");
}

export function obterDoCache<T>(cache: Map<string, ItemCache<T>>, chave: string) {
  const item = cache.get(chave);

  if (!item) {
    return null;
  }

  if (item.expiraEm <= Date.now()) {
    cache.delete(chave);
    return null;
  }

  return item.valor;
}

export function salvarNoCache<T>(
  cache: Map<string, ItemCache<T>>,
  chave: string,
  valor: T,
) {
  cache.set(chave, {
    valor,
    expiraEm: Date.now() + DURACAO_CACHE_CONSULTA_MS,
  });

  return valor;
}
