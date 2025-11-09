export const statuses = [
  "Assistindo",
  "Finalizado",
  "Dropado",
  "Planejo ver",
] as const;
export type Status = (typeof statuses)[number];

export interface Anime {
  _id?: string;
  malId: number;
  title: string;
  status: Status;
  imageUrl: string;
  url: string;
  score?: number;
  notes?: string;
  year?: number;
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  url: string;
  score?: number;
  synopsis?: string;
  type?: string;
  status?: string;
  year?: number;
  episodes?: number;
}

export interface JikanGenre {
  mal_id: number;
  name: string;
}
