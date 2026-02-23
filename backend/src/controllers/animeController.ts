import https from "node:https";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Anime, { IAnime } from "../models/Anime";

const VALID_STATUSES: ReadonlyArray<IAnime["status"]> = [
  "Planejo ver",
  "Assistindo",
  "Finalizado",
  "Dropado",
];
const DEFAULT_STATUS: IAnime["status"] = "Planejo ver";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const unwrapQueryValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const deriveYearFromJikanPayload = (payload: any): number | undefined => {
  const candidate =
    payload?.year ??
    payload?.aired?.prop?.from?.year ??
    payload?.aired?.from?.year ??
    payload?.season_year;

  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : undefined;
};

const fetchAnimeYear = (malId: number): Promise<number | undefined> =>
  new Promise((resolve) => {
    const url = `https://api.jikan.moe/v4/anime/${malId}`;

    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "AnimeList/1.0 (github.com)",
            Accept: "application/json",
          },
        },
        (response) => {
          if ((response.statusCode ?? 500) >= 400) {
            response.resume();
            resolve(undefined);
            return;
          }

          let rawData = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            rawData += chunk;
          });
          response.on("end", () => {
            try {
              const parsed = JSON.parse(rawData);
              resolve(deriveYearFromJikanPayload(parsed?.data));
            } catch (error) {
              console.error("Erro ao analisar resposta da Jikan", error);
              resolve(undefined);
            }
          });
          response.on("error", (error) => {
            console.error("Erro na resposta da Jikan", error);
            resolve(undefined);
          });
        }
      )
      .on("error", (error) => {
        console.error("Erro ao consultar Jikan", error);
        resolve(undefined);
      });
  });

const ensureUserId = (req: Request): string => {
  const userId = (req as any)?.user?.id;
  if (!userId) {
    throw new Error("Usuario nao encontrado no contexto");
  }
  return userId;
};

const clampScore = (value: unknown): number | undefined => {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : undefined;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return undefined;
  }

  return Math.min(10, Math.max(0, numericValue));
};

const coerceStatus = (value: unknown): IAnime["status"] | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (VALID_STATUSES.includes(trimmed as IAnime["status"])) {
      return trimmed as IAnime["status"];
    }
  }
  return undefined;
};

const toFiniteYear = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const parsePositiveInteger = (
  value: unknown,
  fallback: number
): number | undefined => {
  const unwrapped = unwrapQueryValue(value);
  if (
    typeof unwrapped === "number" &&
    Number.isInteger(unwrapped) &&
    unwrapped > 0
  ) {
    return unwrapped;
  }
  if (typeof unwrapped === "string") {
    const parsed = Number(unwrapped);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (fallback > 0) {
    return fallback;
  }
  return undefined;
};

const normalizeLimit = (rawLimit: unknown): number => {
  const unwrapped = unwrapQueryValue(rawLimit);
  const normalizedString =
    typeof unwrapped === "string" ? unwrapped.trim().toLowerCase() : undefined;
  if (normalizedString === "0" || normalizedString === "all") {
    return 0;
  }
  if (typeof unwrapped === "number" && unwrapped === 0) {
    return 0;
  }
  const parsed =
    parsePositiveInteger(unwrapped, DEFAULT_LIMIT) ?? DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

export const addAnime = async (req: Request, res: Response) => {
  try {
    const userId = ensureUserId(req);
    const { malId, title, imageUrl, status, score, notes, year } = req.body;

    if (typeof malId !== "number" || !Number.isInteger(malId)) {
      return res.status(400).json({ msg: "malId invalido" });
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ msg: "title e obrigatorio" });
    }

    const payload: Partial<IAnime> = {
      userId,
      malId,
      title: title.trim(),
      imageUrl: typeof imageUrl === "string" ? imageUrl : "",
      status: coerceStatus(status) ?? DEFAULT_STATUS,
      score: clampScore(score) ?? 0,
      notes: typeof notes === "string" ? notes : "",
    };

    let resolvedYear = toFiniteYear(year);
    if (typeof resolvedYear !== "number") {
      resolvedYear = await fetchAnimeYear(malId);
    }
    if (typeof resolvedYear === "number") {
      payload.year = resolvedYear;
    }

    try {
      const anime = await Anime.create(payload);
      return res.status(201).json(anime);
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(409).json({ msg: "Anime ja adicionado a lista" });
      }
      throw error;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const getAnimes = async (req: Request, res: Response) => {
  try {
    const userId = ensureUserId(req);
    const baseQuery = { userId };
    const sort = { createdAt: -1 };
    const limit = normalizeLimit(req.query.limit);

    if (limit === 0) {
      const list = await Anime.find(baseQuery).sort(sort);
      return res.json({
        animes: list,
        pagination: {
          total: list.length,
          page: 1,
          limit: list.length,
          totalPages: 1,
        },
      });
    }

    const total = await Anime.countDocuments(baseQuery);
    const requestedPage =
      parsePositiveInteger(req.query.page, 1) ?? 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const animes = await Anime.find(baseQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      animes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const updateAnime = async (req: Request, res: Response) => {
  try {
    const userId = ensureUserId(req);
    const { animeId } = req.params;
    if (!animeId || !isValidObjectId(animeId)) {
      return res.status(400).json({ msg: "animeId invalido" });
    }

    const { status, score, notes } = req.body ?? {};
    const updates: Partial<IAnime> = {};

    const normalizedStatus = coerceStatus(status);
    if (normalizedStatus) {
      updates.status = normalizedStatus;
    }

    const normalizedScore = clampScore(score);
    if (typeof normalizedScore === "number") {
      updates.score = normalizedScore;
    }

    if (typeof notes === "string") {
      updates.notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ msg: "Forneca ao menos um campo valido para atualizar" });
    }

    const updated = await Anime.findOneAndUpdate(
      { _id: animeId, userId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Anime nao encontrado" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const deleteAnime = async (req: Request, res: Response) => {
  try {
    const userId = ensureUserId(req);
    const { animeId } = req.params;

    if (!animeId || !isValidObjectId(animeId)) {
      return res.status(400).json({ msg: "animeId invalido" });
    }

    const anime = await Anime.findOneAndDelete({ _id: animeId, userId });
    if (!anime) {
      return res.status(404).json({ msg: "Anime nao encontrado" });
    }

    res.json({ msg: "Anime removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};
