import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  throw new Error("⚠️ Configure JWT_ACCESS_SECRET no ambiente.");
}

interface JwtPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: "Token ausente" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Token inválido" });

    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ msg: "Usuário não encontrado" });

    (req as any).user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: "Token inválido ou expirado" });
  }
}
