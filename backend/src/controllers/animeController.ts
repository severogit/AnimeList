import { Request, Response } from "express";
import Anime from "../models/Anime";

export const addAnime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { malId, title, imageUrl, status } = req.body;

    if (!malId || !title) {
      return res.status(400).json({ msg: "malId e title são obrigatórios" });
    }

    const existing = await Anime.findOne({ userId, malId });
    if (existing) {
      return res.status(409).json({ msg: "Anime já adicionado à lista" });
    }

    const anime = await Anime.create({
      userId,
      malId,
      title,
      imageUrl,
      status: status || "Planejo ver",
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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    const total = await Anime.countDocuments({ userId });

    const animes = await Anime.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      animes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
    const { status } = req.body;

    if (!status) return res.status(400).json({ msg: "Status é obrigatório" });

    const anime = await Anime.findOne({ _id: animeId, userId });
    if (!anime) return res.status(404).json({ msg: "Anime não encontrado" });

    anime.status = status;
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
    if (!anime) return res.status(404).json({ msg: "Anime não encontrado" });

    res.json({ msg: "Anime removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
};
