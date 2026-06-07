import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { ordersRouter } from "./routes/orders";
import { reservationsRouter } from "./routes/reservations";
import { restaurantsRouter } from "./routes/restaurants";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  }),
);
app.use(express.json());

// Rotas
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/restaurantes", restaurantsRouter);
app.use("/api/reservas", reservationsRouter);
app.use("/api/pedidos", ordersRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
