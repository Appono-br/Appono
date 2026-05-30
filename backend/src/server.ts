import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
