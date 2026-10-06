import { somenteNumeros } from "@/lib/validacoes/comum";

/**
 * Validação do algoritmo de CPF (módulo 11)
 */
export function validarCpf(cpf) {
  const limpo = somenteNumeros(cpf);
  if (!limpo || limpo.length !== 11) return false;
  
  // Rejeita números com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação do algoritmo de CNPJ (módulo 11)
 */
export function validarCnpj(cnpj) {
  const limpo = somenteNumeros(cnpj);
  if (!limpo || limpo.length !== 14) return false;

  // Rejeita sequências com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  const digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}

/**
 * Validação de telefone brasileiro (DDD + 8 ou 9 dígitos)
 */
export function validarTelefone(telefone) {
  const limpo = somenteNumeros(telefone);
  if (!limpo) return false;
  return limpo.length === 10 || limpo.length === 11;
}

/**
 * Validação de CEP (8 dígitos numéricos)
 */
export function validarCep(cep) {
  const limpo = somenteNumeros(cep);
  return Boolean(limpo && limpo.length === 8);
}
