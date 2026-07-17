import { somenteNumeros } from "./comum";
export function aplicarMascaraCnpj(valor) {
    return somenteNumeros(valor)
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
export function cnpjEstaCompleto(valor) {
    return somenteNumeros(valor).length === 14;
}
