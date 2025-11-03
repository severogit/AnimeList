import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { Anime, JikanAnime } from "../types/anime";

interface Typeaheadprops {
  onSelect: (anime: Anime) => void;
}

export default function Typeahead({ onSelect }: Typeaheadprops) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);

  const mapJikanToAnime = (jikanAnime: JikanAnime): Anime => ({
    malId: jikanAnime.mal_id,
    title: jikanAnime.title,
    status: "Planejo ver",
    imageUrl: jikanAnime.images.jpg.image_url,
    url: jikanAnime.url,
  });

  const fetchSuggestions = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=5`
      );
      const data = await res.json();
      if (data.data) {
        const results: Anime[] = data.data.map(mapJikanToAnime);
        setSuggestions(results);
      }
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  return (
    <Combobox
      onChange={(anime: Anime | null) => {
        if (!anime) return;
        onSelect(anime);
        setQuery(anime.title);
        setSuggestions([]);
      }}
    >
      <div className="relative w-full">
        <ComboboxInput
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
          placeholder="Nome do anime"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.length > 0 && value.length % 3 === 0) {
              fetchSuggestions(value);
            }
          }}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </ComboboxButton>

        <ComboboxOptions className="absolute z-10 mt-1 w-full bg-surface-card border border-fg-muted rounded-md shadow-lg max-h-40 overflow-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">
              Nenhum anime encontrado
            </div>
          ) : (
            suggestions.map((anime) => (
              <ComboboxOption key={anime.malId} value={anime}>
                {() => (
                  <div className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-fg-muted">
                    <img
                      src={anime.imageUrl}
                      alt={anime.title}
                      className="w-8 h-10 object-cover rounded-md"
                    />
                    <span className="truncate">{anime.title}</span>
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
