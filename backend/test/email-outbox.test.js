"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { categoriaEmail, horarioSilencio, renderizarEmail } = require("../src/services/email-outbox");

test("mapeia somente eventos operacionais para categorias de e-mail", () => {
    assert.equal(categoriaEmail("PAGAMENTO_APROVADO"), "PAGAMENTO");
    assert.equal(categoriaEmail("PLANEJAMENTO_GERADO"), "ROTINA");
    assert.equal(categoriaEmail("EVENTO_DESCONHECIDO"), null);
});

test("horário de silêncio adia envio sem descartar o evento", () => {
    const ate = horarioSilencio({ horario_silencio_inicio: "08:00", horario_silencio_fim: "10:00" }, new Date("2026-09-15T11:30:00Z"));
    assert.equal(ate, "2026-09-15T13:00:00.000Z");
    assert.equal(horarioSilencio({ horario_silencio_inicio: "08:00", horario_silencio_fim: "10:00" }, new Date("2026-09-15T14:30:00Z")), null);
});

test("template escapa conteúdo e permite somente link interno", () => {
    const email = renderizarEmail({ titulo: "<script>", mensagem: "Olá & até", link_destino: "/cliente/rotina" });
    assert.match(email.html, /&lt;script&gt;/);
    assert.match(email.html, /Ol&aacute; &amp; at&eacute;|Olá &amp; até/);
    assert.match(email.html, /\/cliente\/rotina/);
    assert.doesNotMatch(renderizarEmail({ titulo: "x", mensagem: "y", link_destino: "https://malicioso.example" }).html, /malicioso/);
});
