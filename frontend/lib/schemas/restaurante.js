import { z } from "zod";
import { validarCep, validarTelefone } from "./validacoes-base";

export const enderecoRestauranteSchema = z.object({
  cep: z
    .string()
    .min(1, "O CEP é obrigatório.")
    .refine(validarCep, "Informe um CEP válido com 8 dígitos."),
  logradouro: z
    .string()
    .min(1, "O logradouro é obrigatório."),
  numero: z
    .string()
    .min(1, "O número é obrigatório."),
  bairro: z
    .string()
    .min(1, "O bairro é obrigatório."),
  cidade: z
    .string()
    .min(1, "A cidade é obrigatória."),
  estado: z
    .string()
    .min(1, "O estado é obrigatório.")
    .length(2, "Selecione o estado com 2 letras."),
  complemento: z
    .string()
    .optional()
    .default(""),
});

export const dadosBancariosSchema = z.object({
  tipoChavePix: z
    .enum(["CNPJ", "CPF", "EMAIL", "TELEFONE", "ALEATORIA"])
    .default("CNPJ"),
  chavePix: z
    .string()
    .min(1, "A chave PIX é obrigatória."),
  banco: z
    .string()
    .min(1, "Informe o código ou nome do banco."),
  agencia: z
    .string()
    .min(1, "A agência é obrigatória."),
  conta: z
    .string()
    .min(1, "O número da conta é obrigatório."),
  digito: z
    .string()
    .min(1, "O dígito verificador é obrigatório."),
});

export const operacaoRestauranteSchema = z.object({
  tempoTolerancia: z
    .coerce
    .number()
    .min(0, "A tolerância não pode ser negativa.")
    .max(120, "Tolerância máxima de 120 minutos."),
  mesasDisponiveis: z
    .coerce
    .number()
    .min(1, "O restaurante deve ter pelo menos 1 mesa."),
  horarioAbertura: z
    .string()
    .min(1, "Informe o horário de abertura."),
  horarioFechamento: z
    .string()
    .min(1, "Informe o horário de fechamento."),
});
