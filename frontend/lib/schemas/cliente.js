import { z } from "zod";

export const avaliacaoPedidoSchema = z.object({
  nota: z
    .number({ required_error: "Selecione uma nota de 1 a 5 estrelas." })
    .min(1, "A nota mínima é 1 estrela.")
    .max(5, "A nota máxima é 5 estrelas."),
  comentario: z
    .string()
    .max(1000, "O comentário pode ter no máximo 1000 caracteres.")
    .optional()
    .default(""),
});

export const rotinaConfigSchema = z.object({
  preferenciasAlimentares: z
    .array(z.string())
    .optional()
    .default([]),
  restricoesAlimentares: z
    .array(z.string())
    .optional()
    .default([]),
  enderecoReferencia: z
    .string()
    .min(1, "Informe seu endereço ou CEP de referência."),
  raioMaximoKm: z
    .coerce
    .number()
    .min(1, "O raio mínimo é de 1 km.")
    .max(50, "O raio máximo é de 50 km.")
    .default(10),
  orcamentoMedio: z
    .coerce
    .number()
    .min(0, "O valor não pode ser negativo.")
    .optional()
    .default(0),
});
