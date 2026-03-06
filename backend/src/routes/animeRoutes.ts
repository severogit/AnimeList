import { Router } from "express";
import { addAnime, getAnimes, updateAnime, deleteAnime } from "../controllers/animeController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getAnimes);
router.post("/", addAnime);
router.put("/:animeId", updateAnime);
router.delete("/:animeId", deleteAnime);

export default router;
