import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import animeRoutes from "./routes/animeRoutes";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas básicas (temporárias)
app.get("/", (_req, res) => {
  res.send("API do MyAnimeList Clone está rodando! 🚀");
});

app.use("/auth", authRoutes);
app.use("/animes", animeRoutes);

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
