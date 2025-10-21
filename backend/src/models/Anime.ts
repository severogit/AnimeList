import mongoose, { Document, Schema } from "mongoose";

export interface IAnime extends Document {
  userId: string;       // ID do usuário dono da lista
  malId: number;        // ID do anime na Jikan API
  title: string;
  imageUrl: string;
  status: "Planejo ver" | "Assistindo" | "Concluído" | "Dropado";
  createdAt: Date;
}

const animeSchema = new Schema<IAnime>({
  userId: { type: String, required: true },
  malId: { type: Number, required: true },
  title: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ["Planejo ver","Assistindo","Concluído","Dropado"], default: "Planejo ver" },
  createdAt: { type: Date, default: Date.now },
});

const Anime = mongoose.model<IAnime>("Anime", animeSchema);
export default Anime;
