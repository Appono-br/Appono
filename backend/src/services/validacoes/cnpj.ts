import {
  ItemCache,
  obterDoCache,
  salvarNoCache,
  somenteNumeros,
  TEMPO_LIMITE_REQUISICAO_MS,
} from "./comum";

export type ResultadoConsultaCnpj = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
};

const cacheCnpj = new Map<string, ItemCache<ResultadoConsultaCnpj>>();

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

export function validarCnpj(valor?: string) {
  const cnpj = somenteNumeros(valor);

  if (cnpj.length !== 14 || possuiDigitosRepetidos(cnpj)) {
    return false;
  }

  const primeiroDigito = calcularDigitoVerificador(cnpj.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  const segundoDigito = calcularDigitoVerificador(cnpj.slice(0, 13), [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`);
}

export async function consultarCnpjReceitaWs(valor?: string) {
  const cnpj = somenteNumeros(valor);

  if (!validarCnpj(cnpj)) {
    throw new Error("Informe um CNPJ valido.");
  }

  const resultadoEmCache = obterDoCache(cacheCnpj, cnpj);

  if (resultadoEmCache) {
    return resultadoEmCache;
  }

  try {
    const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;
    const resposta = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TEMPO_LIMITE_REQUISICAO_MS),
    });

    if (!resposta.ok) {
      throw new Error("A ReceitaWS nao respondeu corretamente.");
    }

    const dados = (await resposta.json()) as {
      status?: string;
      message?: string;
      nome?: string;
      fantasia?: string;
      situacao?: string;
    };

    if (dados.status?.toUpperCase() === "ERROR") {
      throw new Error(dados.message ?? "CNPJ nao encontrado.");
    }

    return salvarNoCache(cacheCnpj, cnpj, {
      cnpj,
      razaoSocial: dados.nome ?? "",
      nomeFantasia: dados.fantasia ?? "",
      situacao: dados.situacao ?? "",
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("CNPJ")) {
      throw erro;
    }

    throw new Error("Nao foi possivel validar o CNPJ na ReceitaWS agora.");
  }
}
