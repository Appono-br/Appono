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

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowVercelPreviews = String(process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "true").toLowerCase() !== "false";
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

app.use(cors({
    origin(origin, callback) {
        if (!origin ||
            allowedOrigins.includes("*") ||
            allowedOrigins.includes(origin) ||
            isLocalDevelopmentOrigin(origin) ||
            isVercelPreviewOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origem nao autorizada pelo CORS."));
    },
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "API APPONO online",
        health: "/api/health",
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
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
            publicReturnUrl: Boolean(process.env.FRONTEND_PUBLIC_URL),
            backendPublicUrl: Boolean(process.env.BACKEND_PUBLIC_URL),
            webhookSecret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
            modoRepasse: process.env.MERCADO_PAGO_MODO_REPASSE ?? "SIMULADO",
            producaoPermitida: String(process.env.MERCADO_PAGO_PERMITIR_PRODUCAO ?? "false").toLowerCase() === "true",
        },
        admin: {
            configurado: adminEmails.length > 0,
            quantidadeEmails: adminEmails.length,
        },
    });
});
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/restaurantes", restaurantsRouter);
app.use("/api/reservas", reservationsRouter);
app.use("/api/pedidos", ordersRouter);
app.use("/api/validacoes", rotasValidacoes);
app.use("/api/cardapio", menuRouter);
app.use("/api/pagamentos", paymentsRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notificacoes", notificationsRouter);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
