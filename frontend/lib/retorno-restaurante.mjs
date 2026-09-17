export const chaveRetornoRestaurante = "appono:restaurant-login-redirect";

export function obterRetornoRestaurante(destino, tipo = "cliente") {
  return tipo === "cliente" && typeof destino === "string" && /^\/cliente\/restaurantes\/[1-9]\d*$/.test(destino) ? destino : null;
}
