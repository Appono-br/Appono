import {
  ItemCache,
  obterDoCache,
  salvarNoCache,
  somenteNumeros,
  TEMPO_LIMITE_REQUISICAO_MS,
} from "./comum";

export type ResultadoConsultaCep = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const cacheCep = new Map<string, ItemCache<ResultadoConsultaCep>>();

export async function consultarCepViaCep(valor?: string) {
  const cep = somenteNumeros(valor);

  if (cep.length !== 8) {
    throw new Error("Informe um CEP valido com 8 digitos.");
  }

  const resultadoEmCache = obterDoCache(cacheCep, cep);

  if (resultadoEmCache) {
    return resultadoEmCache;
  }

  try {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    const resposta = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TEMPO_LIMITE_REQUISICAO_MS),
    });

    if (!resposta.ok) {
      throw new Error("O ViaCEP nao respondeu corretamente.");
    }

    const dados = (await resposta.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (dados.erro) {
      throw new Error("CEP nao encontrado.");
    }

    return salvarNoCache(cacheCep, cep, {
      cep,
      rua: dados.logradouro ?? "",
      bairro: dados.bairro ?? "",
      cidade: dados.localidade ?? "",
      estado: dados.uf ?? "",
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message === "CEP nao encontrado.") {
      throw erro;
    }

    throw new Error("Nao foi possivel validar o CEP no ViaCEP agora.");
  }
}
