import { somenteNumeros } from "./comum";
export function aplicarMascaraCep(valor) {
    return somenteNumeros(valor).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
export function cepEstaCompleto(valor) {
    return somenteNumeros(valor).length === 8;
}
