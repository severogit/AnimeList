import { useEffect, useRef, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { Anime, JikanAnime } from "../types/anime";

interface TypeaheadProps {
  onSelect: (anime: Anime) => void;
}

const MIN_QUERY_LENGTH = 3;

const mapJikanToAnime = (jikanAnime: JikanAnime): Anime => {
  const derivedYear =
    jikanAnime.year ??
    jikanAnime.aired?.prop?.from?.year ??
    jikanAnime.season_year;

  const imageUrl =
    jikanAnime.images?.jpg?.image_url ??
    jikanAnime.images?.jpg?.large_image_url ??
    jikanAnime.images?.webp?.image_url ??
    jikanAnime.images?.webp?.large_image_url ??
    "https://via.placeholder.com/225x318?text=Sem+Imagem";

  return {
    malId: jikanAnime.mal_id,
    title: jikanAnime.title,
    status: "Planejo ver",
    imageUrl,
    url: jikanAnime.url,
    year:
      typeof derivedYear === "number" && Number.isFinite(derivedYear)
        ? derivedYear
        : undefined,
  };
};

export default function Typeahead({ onSelect }: TypeaheadProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      controllerRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
            term
          )}&limit=5&sfw=true`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar sugestoes");
        }

        const data = await response.json();
        const results: Anime[] = Array.isArray(data?.data)
          ? data.data.map(mapJikanToAnime)
          : [];
        setSuggestions(results);
        setError(results.length === 0 ? "Nenhum anime encontrado" : null);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Erro ao buscar sugestoes", err);
        setError("Nao foi possivel carregar sugestoes");
        setSuggestions([]);
      } finally {
        if (controllerRef.current === controller) {
          setLoading(false);
          controllerRef.current = null;
        }
      }
    };

    void fetchSuggestions();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const helperMessage =
    query.trim().length < MIN_QUERY_LENGTH
      ? `Digite pelo menos ${MIN_QUERY_LENGTH} caracteres`
      : error;

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
          onChange={(e) => setQuery(e.target.value)}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </ComboboxButton>

        {(loading || suggestions.length > 0 || helperMessage) && (
          <ComboboxOptions className="absolute z-10 mt-1 w-full bg-surface-card border border-fg-muted rounded-md shadow-lg max-h-48 overflow-auto">
            {loading ? (
              <div className="px-4 py-2 text-gray-500">Buscando...</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">
                {helperMessage ?? "Nenhum anime encontrado"}
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
        )}
      </div>
    </Combobox>
  );
}
