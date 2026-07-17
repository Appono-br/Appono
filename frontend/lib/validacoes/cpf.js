import { somenteNumeros } from "./comum";
export function aplicarMascaraCpf(valor) {
    return somenteNumeros(valor)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function cpfEstaCompleto(valor) {
    return somenteNumeros(valor).length === 11;
}
