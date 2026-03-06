import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, me, logout } from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Muitas tentativas, tente novamente mais tarde." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, me);
router.post("/logout", logout);

export default router;
