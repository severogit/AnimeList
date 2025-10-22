export const statuses = ["Assistindo", "Concluído", "Dropado", "Planejo ver"] as const;
export type Status = (typeof statuses)[number];

export interface Anime {
  _id?: string;
  malId: number;
  title: string;
  status: Status;
  imageUrl: string;
  url: string;
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
}
