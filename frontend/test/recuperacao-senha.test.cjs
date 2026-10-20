const assert = require("node:assert/strict");
const test = require("node:test");
const { loadFrontend } = require("./support/load-frontend.cjs");

async function recovery({ redirect, origin = "https://app.example.com", result = { error: null } } = {}) {
  const requests = [];
  const { solicitarRecuperacaoSenha } = await loadFrontend("lib/recuperacao-senha.js", {
    globals: { window: { location: { origin } }, process: { env: { NEXT_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL: redirect } } },
    mocks: { "./supabase": { supabase: { auth: {
      resetPasswordForEmail: async (email, options) => {
        requests.push({ email, redirectTo: options.redirectTo });
        if (result instanceof Error) throw result;
        return result;
      },
    } } } },
  });
  return { solicitarRecuperacaoSenha, requests };
}

test("Password recovery normalizes the account email and uses the existing recovery page", async () => {
  const { solicitarRecuperacaoSenha, requests } = await recovery();
  await solicitarRecuperacaoSenha("  Restaurante@Example.COM  ");
  assert.deepEqual(requests, [{ email: "restaurante@example.com", redirectTo: "https://app.example.com/recuperar-senha" }]);
});

test("Password recovery respects the configured redirect used by login", async () => {
  const { solicitarRecuperacaoSenha, requests } = await recovery({ redirect: "  https://accounts.example.com/reset  " });
  await solicitarRecuperacaoSenha("contato@example.com");
  assert.equal(requests[0].redirectTo, "https://accounts.example.com/reset");
});

test("An empty configured redirect falls back to the current origin", async () => {
  const { solicitarRecuperacaoSenha, requests } = await recovery({ redirect: "   ", origin: "http://localhost:3000" });
  await solicitarRecuperacaoSenha("contato@example.com");
  assert.equal(requests[0].redirectTo, "http://localhost:3000/recuperar-senha");
});

test("Recovery service errors remain failures so the form can show an error and allow retry", async () => {
  const error = new Error("Recovery unavailable");
  for (const result of [{ error }, error]) {
    const { solicitarRecuperacaoSenha, requests } = await recovery({ result });
    await assert.rejects(solicitarRecuperacaoSenha("contato@example.com"), (caught) => caught === error);
    assert.equal(requests.length, 1);
  }
});
