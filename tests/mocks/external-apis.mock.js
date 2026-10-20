"use strict";

const { http, HttpResponse } = require("msw");
const { setupServer } = require("msw/node");

const MERCADO_PAGO_BASE = "https://api.mercadopago.com";
const VIACEP_BASE = "https://viacep.com.br";
const BRASILAPI_BASE = "https://brasilapi.com.br";
const RECEITAWS_BASE = "https://receitaws.com.br";

const mercadoPagoHandlers = [
    http.post(`${MERCADO_PAGO_BASE}/checkout/preferences`, () => {
        return HttpResponse.json({
            id: "mock-preference-id",
            init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock",
            sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mock",
        });
    }),
    http.get(`${MERCADO_PAGO_BASE}/v1/payments/:id`, ({ params }) => {
        return HttpResponse.json({
            id: Number(params.id),
            status: "approved",
            status_detail: "accredited",
            transaction_amount: 50.0,
            date_approved: new Date().toISOString(),
            date_created: new Date().toISOString(),
            live_mode: false,
            payer: { email: "test@test.com" },
        });
    }),
    http.post(`${MERCADO_PAGO_BASE}/v1/payments/:id/refunds`, ({ params }) => {
        return HttpResponse.json({
            id: 900000 + Number(params.id),
            payment_id: Number(params.id),
            amount: 50.0,
            status: "approved",
            date_created: new Date().toISOString(),
        });
    }),
    http.post(`${MERCADO_PAGO_BASE}/oauth/token`, () => {
        return HttpResponse.json({
            access_token: "mock-access-token",
            token_type: "bearer",
            expires_in: 21600,
            scope: "read write",
            user_id: 123456789,
            refresh_token: "mock-refresh-token",
            live_mode: false,
        });
    }),
];

const viaCepHandlers = [
    http.get(`${VIACEP_BASE}/ws/:cep/json`, ({ params }) => {
        const cep = String(params.cep).replace(/\D/g, "");
        if (cep === "00000000" || cep.length !== 8) {
            return HttpResponse.json({ erro: true });
        }
        return HttpResponse.json({
            cep: cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
            logradouro: "Rua de Teste",
            complemento: "",
            bairro: "Centro",
            localidade: "São Paulo",
            uf: "SP",
            ibge: "3550308",
        });
    }),
];

const brasilApiHandlers = [
    http.get(`${BRASILAPI_BASE}/api/cpf/v1/:cpf`, ({ params }) => {
        const cpf = String(params.cpf).replace(/\D/g, "");
        if (cpf === "00000000000" || cpf.length !== 11) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json({ cpf, nome: "Pessoa Teste", situacao: "Regular" });
    }),
];

const receitaWsHandlers = [
    http.get(`${RECEITAWS_BASE}/v1/cnpj/:cnpj`, ({ params }) => {
        const cnpj = String(params.cnpj).replace(/\D/g, "");
        if (cnpj === "00000000000000" || cnpj.length !== 14) {
            return HttpResponse.json({ status: "ERROR", message: "CNPJ inválido" });
        }
        return HttpResponse.json({
            cnpj,
            nome: "Restaurante Teste LTDA",
            fantasia: "Restaurante Teste",
            situacao: "ATIVA",
            tipo: "MATRIZ",
        });
    }),
];

const allHandlers = [
    ...mercadoPagoHandlers,
    ...viaCepHandlers,
    ...brasilApiHandlers,
    ...receitaWsHandlers,
];

const mockServer = setupServer(...allHandlers);

module.exports = {
    mockServer,
    allHandlers,
    mercadoPagoHandlers,
    viaCepHandlers,
    brasilApiHandlers,
    receitaWsHandlers,
    MERCADO_PAGO_BASE,
};
