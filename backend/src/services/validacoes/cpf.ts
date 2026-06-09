import { somenteNumeros } from "./comum";

function possuiDigitosRepetidos(valor: string) {
  return /^(\d)\1+$/.test(valor);
}

function calcularDigitoVerificador(base: string, pesos: number[]) {
  const soma = pesos.reduce(
    (total, peso, indice) => total + Number(base[indice]) * peso,
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(valor?: string) {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11 || possuiDigitosRepetidos(cpf)) {
    return false;
  }

  const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9), [
    10, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10), [
    11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  return cpf.endsWith(`${primeiroDigito}${segundoDigito}`);
}
