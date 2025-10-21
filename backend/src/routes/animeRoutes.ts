import { Router } from "express";
import { addAnime, getAnimes, updateAnime, deleteAnime } from "../controllers/animeController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Todas as rotas abaixo são protegidas pelo JWT
router.use(authMiddleware);

// Rotas usadas para a listagem
router.get("/", getAnimes);

router.post("/", addAnime);

router.put("/:animeId", updateAnime);

router.delete("/:animeId", deleteAnime);

export default router;
