import mongoose, { Document, Schema } from "mongoose";

export interface IAnime extends Document {
  userId: string; // ID do usuario dono da lista
  malId: number; // ID do anime na Jikan API
  title: string;
  imageUrl: string;
  status: "Planejo ver" | "Assistindo" | "Finalizado" | "Dropado";
  score?: number;
  notes?: string;
  year?: number;
  createdAt: Date;
  updatedAt: Date;
}

const animeSchema = new Schema<IAnime>(
  {
    userId: { type: String, required: true, index: true },
    malId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Planejo ver", "Assistindo", "Finalizado", "Dropado"],
      default: "Planejo ver",
    },
    score: { type: Number, min: 0, max: 10, default: 0 },
    notes: { type: String, default: "" },
    year: { type: Number },
  },
  {
    timestamps: true,
  }
);

animeSchema.index({ userId: 1, malId: 1 }, { unique: true });

const Anime = mongoose.model<IAnime>("Anime", animeSchema);
export default Anime;
