import { Router } from "express";
import { consultarCepViaCep } from "../services/validacoes/cep";
import { consultarCnpjReceitaWs } from "../services/validacoes/cnpj";
import { somenteNumeros } from "../services/validacoes/comum";
import { validarCpf } from "../services/validacoes/cpf";

export const rotasValidacoes = Router();

rotasValidacoes.get("/cpf/:cpf", (req, res) => {
  const cpf = somenteNumeros(req.params.cpf);

  if (!validarCpf(cpf)) {
    return res.status(400).json({ error: "CPF invalido." });
  }

  return res.json({ valid: true, cpf });
});

rotasValidacoes.get("/cep/:cep", async (req, res) => {
  try {
    return res.json(await consultarCepViaCep(req.params.cep));
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "CEP invalido.",
    });
  }
});

rotasValidacoes.get("/cnpj/:cnpj", async (req, res) => {
  try {
    return res.json(await consultarCnpjReceitaWs(req.params.cnpj));
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "CNPJ invalido.",
    });
  }
});
