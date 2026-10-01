export const REQUISITOS_SENHA = [
  ["length", "Pelo menos 6 caracteres", (senha) => senha.length >= 6],
  ["upper", "Uma letra maiúscula", (senha) => /[A-Z]/.test(senha)],
  ["lower", "Uma letra minúscula", (senha) => /[a-z]/.test(senha)],
  ["number", "Um número", (senha) => /\d/.test(senha)],
  ["special", "Um caractere especial", (senha) => /[^A-Za-z\d]/.test(senha)],
];

export function senhaValida(senha) {
  return REQUISITOS_SENHA.every(([, , validar]) => validar(String(senha ?? "")));
}
