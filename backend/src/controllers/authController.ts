import "dotenv/config";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7);
const REFRESH_COOKIE_MAX_AGE = REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("⚠️ Configure JWT_ACCESS_SECRET e JWT_REFRESH_SECRET no ambiente.");
}

const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/auth/refresh",
};

function buildUserPayload(user: any) {
  return { id: user._id, name: user.name, email: user.email };
}

function signAccessToken(user: any) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

function signRefreshToken(user: any) {
  return jwt.sign({ id: user._id }, JWT_REFRESH_SECRET!, {
    expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d`,
  });
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    ...cookieBaseOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

async function issueSession(res: Response, user: any) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return { accessToken, user: buildUserPayload(user) };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: "Preencha todos os campos" });
    const strongEnough = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
    if (!strongEnough) {
      return res
        .status(400)
        .json({ msg: "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula e 1 número." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ msg: "Email já cadastrado" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hashed });

    const session = await issueSession(res, user);
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Preencha email e senha" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Credenciais inválidas" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Credenciais inválidas" });

    const session = await issueSession(res, user);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ msg: "Refresh token ausente" });

    const payload = jwt.verify(token, JWT_REFRESH_SECRET!) as { id: string };
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ msg: "Usuário não encontrado" });

    const session = await issueSession(res, user);
    return res.json(session);
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: "Refresh token inválido ou expirado" });
  }
};

export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ msg: "Não autenticado" });
  return res.json({ user: buildUserPayload(user) });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", { ...cookieBaseOptions, maxAge: 0 });
  return res.status(204).send();
};
