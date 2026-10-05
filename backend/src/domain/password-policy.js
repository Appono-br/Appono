"use strict";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;

function senhaValida(senha) {
  return typeof senha === "string" && PASSWORD_PATTERN.test(senha);
}

function mensagemSenhaInvalida() {
  return "A senha deve ter pelo menos 6 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial.";
}

module.exports = { PASSWORD_PATTERN, senhaValida, mensagemSenhaInvalida };
