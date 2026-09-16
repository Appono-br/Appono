"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { authRouter } = require("./routes/auth");
const { meRouter } = require("./routes/me");
const { ordersRouter } = require("./routes/orders");
const { reservationsRouter } = require("./routes/reservations");
const { restaurantsRouter } = require("./routes/restaurants");
const { rotasValidacoes } = require("./routes/validacoes");
const { menuRouter } = require("./routes/menu");
const { paymentsRouter } = require("./routes/payments");
const { marketplaceRouter } = require("./routes/marketplace");
const { adminRouter } = require("./routes/admin");
const { notificationsRouter } = require("./routes/notifications");
const { restaurantDashboardRouter } = require("./routes/restaurant-dashboard");
const { refundsRouter } = require("./routes/refunds");
const { messagesRouter } = require("./routes/messages");
const { supportRouter } = require("./routes/support");
const { rotinaRouter } = require("./routes/routine");
const { agendaRotinaRouter } = require("./routes/routine-calendar");
const { rotinaInsightsRouter } = require("./routes/routine-insights");
const { rotinaGroupsRouter } = require("./routes/routine-groups");
const { requestContext } = require("./middleware/observability");
const { criarRateLimiter } = require("./middleware/rate-limit");
const crypto = require("node:crypto");
const { processarEmailsOutbox } = require("./services/email-outbox");

const app = express();
const PORT = process.env.PORT || 3001;
const emProducao = String(process.env.NODE_ENV ?? "development").toLowerCase() === "production";
const confiarNoProxy = String(process.env.APPONO_TRUST_PROXY ?? "false").trim().toLowerCase() === "true";
app.set("trust proxy", confiarNoProxy);

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const allowedOrigins = FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowVercelPreviews = String(process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "false").trim().toLowerCase() === "true";
const vercelPreviewProjectHint = String(process.env.CORS_VERCEL_PROJECT_HINT ?? "appono").toLowerCase();

function isVercelPreviewOrigin(origin) {
  if (!allowVercelPreviews || !origin) {
    return false;
  }

  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host.endsWith(".vercel.app") && host.includes(vercelPreviewProjectHint);
  }
  catch {
    return false;
  }
}

function isLocalDevelopmentOrigin(origin) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const portaDev = url.protocol === "http:" && url.port === "3000";
    const hostLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

    return portaDev && hostLocal;
  }
  catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        (!emProducao && allowedOrigins.includes("*")) ||
        allowedOrigins.includes(origin) ||
        (!emProducao && isLocalDevelopmentOrigin(origin)) ||
        isVercelPreviewOrigin(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origem não autorizada pelo CORS."));
    },
  })
);

app.use(express.json());
app.use(requestContext);

app.get("/", (req, res) => {
  res.json({
    status: "API APPONO online",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/api/health/config", (req, res) => {
  const adminEmails = String(process.env.APPONO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  res.json({
    status: "Config check",
    supabase: {
      url: Boolean(process.env.SUPABASE_URL),
      publishableKey: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
      secretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
    },
    mercadoPago: {
      accessToken: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      testAccessToken: Boolean(process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN),
      tokenEfetivo: String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true"
        ? "producao"
        : (process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN ? "teste" : "fallback"),
      publicReturnUrl: Boolean(process.env.FRONTEND_PUBLIC_URL),
      backendPublicUrl: Boolean(process.env.BACKEND_PUBLIC_URL),
      webhookSecret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
      webhookSignatureRequired: String(process.env.MERCADO_PAGO_WEBHOOK_SIGNATURE_REQUIRED ?? "false").toLowerCase() === "true",
      tokenEncryptionKey: Boolean(process.env.APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY),
      modoRepasse: process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO",
      producaoPermitida: String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true",
    },
    admin: {
      configurado: adminEmails.length > 0,
      quantidadeEmails: adminEmails.length,
    },
  });
});

const limitarAutenticacao = criarRateLimiter({ janelaMs: 15 * 60_000, limite: 20 });
const limitarOperacoesAdministrativas = criarRateLimiter({ janelaMs: 60_000, limite: 30 });
const limitarMarketplace = criarRateLimiter({ janelaMs: 60_000, limite: 30 });
const limitarSuporte = criarRateLimiter({ janelaMs: 60_000, limite: 30 });
const limitarCron = criarRateLimiter({ janelaMs: 60_000, limite: 10 });

app.post("/api/cron/emails", limitarCron, async (req, res) => {
  const esperado = String(process.env.APPONO_CRON_SECRET ?? "");
  const recebido = String(req.headers["x-appono-cron-secret"] ?? "");
  const autorizado = esperado.length > 0 && recebido.length === esperado.length && crypto.timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado));
  if (!autorizado) return res.status(401).json({ error: "Não autorizado." });
  try {
    return res.json(await processarEmailsOutbox({ limite: Number(req.query.limite ?? 20) }));
  }
  catch (error) {
    return res.status(503).json({ error: "Não foi possível processar os e-mails agora." });
  }
});

app.use("/api/auth", limitarAutenticacao, authRouter);
app.use("/api/me", meRouter);
app.use("/api/restaurantes", restaurantsRouter);
app.use("/api/reservas", reservationsRouter);
app.use("/api/pedidos", ordersRouter);
app.use("/api/validacoes", rotasValidacoes);
app.use("/api/cardapio", menuRouter);
app.use("/api/pagamentos", paymentsRouter);
app.use("/api/marketplace", limitarMarketplace, marketplaceRouter);
app.use("/api/admin", limitarOperacoesAdministrativas, adminRouter);
app.use("/api/notificacoes", notificationsRouter);
app.use("/api/restaurante", restaurantDashboardRouter);
app.use("/api/reembolsos", limitarOperacoesAdministrativas, refundsRouter);
app.use("/api/mensagens", messagesRouter);
app.use("/api/suporte", limitarSuporte, supportRouter);
app.use("/api/rotina/agenda", agendaRotinaRouter);
app.use("/api/rotina/insights", rotinaInsightsRouter);
app.use("/api/rotina/grupos", rotinaGroupsRouter);
app.use("/api/rotina", rotinaRouter);

app.use((error, _req, res, _next) => {
  const mensagem = String(error?.message ?? "");
  const erroDeConexao = /fetch failed|unable to verify|certificate|econnreset|enotfound/i.test(mensagem);
  if (erroDeConexao) {
    return res.status(503).json({
      error: "Não foi possível acessar um serviço externo. Verifique a conexão e tente novamente.",
    });
  }
  console.error("Erro não tratado na API:", mensagem || error);
  return res.status(500).json({ error: "Não foi possível concluir a operação agora." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
