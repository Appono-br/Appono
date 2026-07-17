import { somenteNumeros } from "./comum";
export function aplicarMascaraCodigoBanco(valor) {
    return somenteNumeros(valor).slice(0, 3);
}
export function aplicarMascaraAgencia(valor) {
    return somenteNumeros(valor).slice(0, 5);
}
export function aplicarMascaraConta(valor) {
    const valorLimpo = valor.replace(/[^\dXx-]/g, "");
    const [numeroConta = "", ...partesDigito] = valorLimpo.split("-");
    const conta = somenteNumeros(numeroConta).slice(0, 20);
    const digito = partesDigito
        .join("")
        .replace(/[^\dXx]/g, "")
        .slice(0, 1)
        .toUpperCase();
    return valorLimpo.includes("-") ? `${conta}-${digito}` : conta;
}
