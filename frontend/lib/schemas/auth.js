import { z } from "zod";
import { validarCpf, validarCnpj, validarTelefone, validarCep } from "./validacoes-base";
import { senhaValida } from "@/lib/politica-senha";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail.")
    .email("Informe um endereço de e-mail válido."),
  password: z
    .string()
    .min(1, "Informe sua senha."),
});

export const registerClientSchema = z
  .object({
    name: z
      .string()
      .min(1, "O nome completo é obrigatório.")
      .min(3, "O nome deve ter pelo menos 3 caracteres."),
    birthDate: z
      .string()
      .min(1, "Informe sua data de nascimento."),
    cpf: z
      .string()
      .min(1, "O CPF é obrigatório.")
      .refine(validarCpf, "Informe um CPF válido com 11 dígitos."),
    email: z
      .string()
      .min(1, "O e-mail é obrigatório.")
      .email("Informe um e-mail válido."),
    phone: z
      .string()
      .min(1, "O telefone/celular é obrigatório.")
      .refine(validarTelefone, "Informe um telefone válido com DDD (10 ou 11 dígitos)."),
    password: z
      .string()
      .min(1, "A senha é obrigatória.")
      .refine(senhaValida, "A senha deve ter pelo menos 6 caracteres, com letra maiúscula, minúscula, número e caractere especial."),
    confirmPassword: z
      .string()
      .min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const registerRestaurantSchema = z
  .object({
    storeName: z
      .string()
      .min(1, "O nome fantasia é obrigatório.")
      .min(2, "O nome fantasia deve ter no mínimo 2 caracteres."),
    legalName: z
      .string()
      .min(1, "A razão social é obrigatória.")
      .min(2, "A razão social deve ter no mínimo 2 caracteres."),
    cnpj: z
      .string()
      .min(1, "O CNPJ é obrigatório.")
      .refine(validarCnpj, "Informe um CNPJ válido com 14 dígitos."),
    email: z
      .string()
      .min(1, "O e-mail comercial é obrigatório.")
      .email("Informe um e-mail válido."),
    phone: z
      .string()
      .min(1, "O telefone comercial é obrigatório.")
      .refine(validarTelefone, "Informe um telefone comercial válido com DDD."),
    cep: z
      .string()
      .min(1, "O CEP é obrigatório.")
      .refine(validarCep, "Informe um CEP válido com 8 dígitos."),
    address: z
      .string()
      .min(1, "O logradouro/rua é obrigatório."),
    number: z
      .string()
      .min(1, "O número é obrigatório."),
    neighborhood: z
      .string()
      .min(1, "O bairro é obrigatório."),
    city: z
      .string()
      .min(1, "A cidade é obrigatória."),
    uf: z
      .string()
      .min(1, "O estado (UF) é obrigatório.")
      .length(2, "Selecione uma UF válida."),
    complement: z
      .string()
      .optional()
      .default(""),
    tables: z
      .coerce
      .number({ invalid_type_error: "Informe um número válido de mesas." })
      .int("A quantidade de mesas deve ser um número inteiro.")
      .min(1, "O restaurante deve ter pelo menos 1 mesa."),
    categorias_culinarias: z
      .array(z.string())
      .min(1, "Selecione pelo menos uma especialidade culinária."),
    plano: z
      .enum(["INICIAL", "PRO", "ENTERPRISE"])
      .default("INICIAL"),
    password: z
      .string()
      .optional()
      .default(""),
    confirmPassword: z
      .string()
      .optional()
      .default(""),
  });

export const recuperarSenhaEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail cadastrado.")
    .email("Informe um e-mail válido."),
});

export const redefinirSenhaSchema = z
  .object({
    password: z
      .string()
      .min(1, "A nova senha é obrigatória.")
      .refine(senhaValida, "A senha deve ter pelo menos 6 caracteres, com letra maiúscula, minúscula, número e caractere especial."),
    confirmPassword: z
      .string()
      .min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
