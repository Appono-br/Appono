"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { authRouter } = require("./routes/auth");
const { meRouter } = require("./routes/me");
const { ordersRouter } = require("./routes/orders");
const { reservationsRouter } = require("./routes/reservations");
const { restaurantsRouter } = require("./routes/restaurants");
const { rotasValidacoes } = require("./routes/validacoes");
const { menuRouter } = require("./routes/menu");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
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
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/restaurantes", restaurantsRouter);
app.use("/api/reservas", reservationsRouter);
app.use("/api/pedidos", ordersRouter);
app.use("/api/validacoes", rotasValidacoes);
app.use("/api/cardapio", menuRouter);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
