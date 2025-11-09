import https from "node:https";
import { Request, Response } from "express";
import Anime from "../models/Anime";

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

export const addAnime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { malId, title, imageUrl, status, score, notes, year } = req.body;

    if (!malId || !title) {
      return res.status(400).json({ msg: "malId e title sao obrigatorios" });
    }

    const existing = await Anime.findOne({ userId, malId });
    if (existing) {
      return res.status(409).json({ msg: "Anime ja adicionado a lista" });
    }

    const anime = await Anime.create({
      userId,
      malId,
      title,
      imageUrl,
      status: status || "Planejo ver",
      score: typeof score === "number" ? Math.max(0, Math.min(10, score)) : 0,
      notes: typeof notes === "string" ? notes : "",
      year: typeof year === "number" ? year : undefined,
    });

    res.status(201).json(anime);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const getAnimes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const animes = await Anime.find({ userId });

    await Promise.all(
      animes.map(async (anime) => {
        let updated = false;

        if (typeof anime.year !== "number") {
          const derivedYear = await fetchAnimeYear(anime.malId);
          if (typeof derivedYear === "number") {
            anime.set("year", derivedYear);
            updated = true;
          }
        }

        if (updated) {
          await anime.save();
        }
      })
    );

    res.json({
      animes,
      pagination: {
        total: animes.length,
        page: 1,
        limit: animes.length,
        totalPages: 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const updateAnime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { animeId } = req.params;
    const { status, score, notes } = req.body as {
      status?: string;
      score?: unknown;
      notes?: unknown;
    };

    const anime = await Anime.findOne({ _id: animeId, userId });
    if (!anime) {
      return res.status(404).json({ msg: "Anime nao encontrado" });
    }

    if (typeof status === "string" && status.trim().length > 0) {
      anime.set("status", status);
    }
    if (typeof score === "number") {
      const clamped = Math.max(0, Math.min(10, score));
      anime.set("score", clamped);
    }
    if (typeof notes === "string") {
      anime.set("notes", notes);
    }
    await anime.save();

    res.json(anime);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};

export const deleteAnime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { animeId } = req.params;

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
