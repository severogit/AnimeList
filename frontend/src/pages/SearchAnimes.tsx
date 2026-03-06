import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import type { JikanAnime, JikanGenre } from "../types/anime";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/errors";

interface JikanResponse<T> {
  data: T;
  pagination?: {
    items?: {
      count?: number;
      total?: number;
      per_page?: number;
    };
    current_page?: number;
    last_visible_page?: number;
    has_next_page?: boolean;
  };
}

interface RawJikanAnime {
  mal_id: number;
  title: string;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  url: string;
  score?: number;
  synopsis?: string;
  type?: string;
  status?: string;
  year?: number;
  aired?: {
    prop?: {
      from?: {
        year?: number;
      };
    };
  };
  season_year?: number;
  episodes?: number;
}

const STATIC_GENRES: JikanGenre[] = [
  { mal_id: 1, name: "Action" },
  { mal_id: 2, name: "Adventure" },
  { mal_id: 3, name: "Fantasy" },
  { mal_id: 4, name: "Romance" },
  { mal_id: 5, name: "Comedy" },
  { mal_id: 6, name: "Slice of Life" },
  { mal_id: 7, name: "Drama" },
  { mal_id: 8, name: "Sci-Fi" },
  { mal_id: 9, name: "Sports" },
  { mal_id: 10, name: "Music" },
  { mal_id: 11, name: "Mystery" },
  { mal_id: 12, name: "Horror" },
  { mal_id: 13, name: "Thriller" },
  { mal_id: 14, name: "Supernatural" },
  { mal_id: 15, name: "Isekai" },
];

const mapJikanAnime = (raw: RawJikanAnime): JikanAnime => ({
  mal_id: raw.mal_id,
  title: raw.title,
  images: {
    jpg: {
      image_url:
        raw.images?.jpg?.large_image_url ||
        raw.images?.jpg?.image_url ||
        raw.images?.webp?.large_image_url ||
        raw.images?.webp?.image_url ||
        "",
    },
  },
  url: raw.url,
  score: raw.score,
  synopsis: raw.synopsis,
  type: raw.type,
  status: raw.status,
  year: raw.year ?? raw.aired?.prop?.from?.year ?? raw.season_year ?? undefined,
  episodes: raw.episodes,
});

interface AnimeCardProps {
  anime: JikanAnime;
  onAdd: (anime: JikanAnime) => void;
  onRemove: (anime: JikanAnime) => void;
  isAdding: boolean;
  isRemoving: boolean;
  isAdded: boolean;
}

function AnimeCard({
  anime,
  onAdd,
  onRemove,
  isAdding,
  isRemoving,
  isAdded,
}: AnimeCardProps) {
  const imageSrc =
    anime.images?.jpg?.image_url ||
    "https://via.placeholder.com/225x318?text=Sem+Imagem";

  return (
    <div className="group relative flex flex-col gap-2">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-surface-card/30 bg-surface-muted/40 shadow-md transition-transform duration-200 group-hover:-translate-y-1 sm:h-72">
        <a
          href={anime.url}
          target="_blank"
          rel="noreferrer"
          className="block h-full"
        >
          <img
            src={imageSrc}
            alt={anime.title}
            className="h-full w-full object-cover transition duration-200 group-hover:blur-sm"
          />
        </a>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100" />
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            aria-label={isAdded ? "Anime adicionado" : "Adicionar anime"}
            className={`pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition ${
              isAdded
                ? "bg-brand-secondary text-fg"
                : "bg-brand-primary text-fg hover:bg-brand-hover-primary"
            } ${isAdding ? "opacity-80" : ""}`}
            disabled={isAdded || isAdding}
            onClick={(event) => {
              event.stopPropagation();
              if (!isAdded && !isAdding) {
                onAdd(anime);
              }
            }}
          >
            {isAdded ? (
              <CheckIcon className="h-5 w-5" />
            ) : isAdding ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </button>
          {isAdded && (
            <button
              type="button"
              aria-label="Remover anime da lista"
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-danger text-fg shadow-lg transition hover:bg-danger-hover disabled:opacity-70"
              disabled={isRemoving}
              onClick={(event) => {
                event.stopPropagation();
                if (!isRemoving) {
                  onRemove(anime);
                }
              }}
            >
              {isRemoving ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <TrashIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-fg truncate">
        {anime.title || "Titulo desconhecido"}
      </span>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  );
}

export default function SearchAnimes() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [genres, setGenres] = useState<JikanGenre[]>(STATIC_GENRES);

  const [seasonPopular, setSeasonPopular] = useState<JikanAnime[]>([]);
  const [seasonUpcoming, setSeasonUpcoming] = useState<JikanAnime[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  const [results, setResults] = useState<JikanAnime[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userAnimes, setUserAnimes] = useState<Map<number, string>>(
    () => new Map<number, string>()
  );
  const [addedMalIds, setAddedMalIds] = useState<Set<number>>(
    () => new Set<number>()
  );
  const [addingAnimeId, setAddingAnimeId] = useState<number | null>(null);
  const [removingAnimeId, setRemovingAnimeId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const limit = 1970;
    const options: string[] = [];
    for (let year = currentYear; year >= limit; year -= 1) {
      options.push(String(year));
    }
    return options;
  }, [currentYear]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      400
    );
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserAnimes(new Map<number, string>());
      setAddedMalIds(new Set<number>());
      return;
    }

    let cancelled = false;

    const fetchUserAnimes = async () => {
      try {
        const response = await api.get("/animes", { params: { limit: 0 } });
        const list = Array.isArray(response.data?.animes)
          ? (response.data.animes as Array<{
              _id?: string;
              malId?: number;
            }>)
          : [];

        const map = new Map<number, string>();
        for (const anime of list) {
          if (
            typeof anime?.malId === "number" &&
            typeof anime?._id === "string"
          ) {
            map.set(anime.malId, anime._id);
          }
        }

        if (!cancelled) {
          setUserAnimes(map);
          setAddedMalIds(new Set<number>(Array.from(map.keys())));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Nao foi possivel carregar a lista do usuario.", error);
        }
      }
    };

    fetchUserAnimes();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const filtersActive = Boolean(
    debouncedSearch || selectedGenre || selectedYear
  );

  const loadSearchResults = useCallback(
    async (pageToLoad: number, replace = false) => {
      if (!filtersActive) {
        return;
      }

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearchError(null);
      if (pageToLoad === 1 && replace) {
        setTotalResults(null);
        setIsInitialLoading(true);
        setIsFetchingMore(false);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const params = new URLSearchParams({
          limit: "20",
          page: String(pageToLoad),
          sfw: "true",
          order_by: "score",
          sort: "desc",
        });

        if (debouncedSearch) {
          params.append("q", debouncedSearch);
        }

        if (selectedGenre) {
          params.append("genres", selectedGenre);
        }

        if (selectedYear) {
          params.append("start_date", `${selectedYear}-01-01`);
          params.append("end_date", `${selectedYear}-12-31`);
        }

        const response = await fetch(
          `https://api.jikan.moe/v4/anime?${params.toString()}`,
          { signal: controller.signal }
        );
        const json = (await response.json()) as JikanResponse<RawJikanAnime[]> & {
          pagination: { has_next_page?: boolean };
        };

        if (!response.ok) {
          throw new Error(
            json?.data ? "Erro na busca de animes" : response.statusText
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        const mapped = (json.data ?? []).map(mapJikanAnime);

        setResults((prev) =>
          replace || pageToLoad === 1 ? mapped : [...prev, ...mapped]
        );
        const apiTotal = json.pagination?.items?.total;
        if (typeof apiTotal === "number") {
          setTotalResults(apiTotal);
        } else if (pageToLoad === 1) {
          setTotalResults(mapped.length);
        }
        setHasMore(Boolean(json.pagination?.has_next_page));
        setCurrentPage(pageToLoad);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setSearchError(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao buscar animes."
        );
      } finally {
        if (searchAbortRef.current === controller) {
          setIsInitialLoading(false);
          setIsFetchingMore(false);
          searchAbortRef.current = null;
        }
      }
    },
    [filtersActive, debouncedSearch, selectedGenre, selectedYear]
  );

  const handleLoadMore = useCallback(() => {
    if (!filtersActive || !hasMore || isInitialLoading || isFetchingMore) {
      return;
    }
    loadSearchResults(currentPage + 1);
  }, [
    filtersActive,
    hasMore,
    isInitialLoading,
    isFetchingMore,
    loadSearchResults,
    currentPage,
  ]);

  const handleAddAnime = useCallback(
    async (anime: JikanAnime) => {
      if (addedMalIds.has(anime.mal_id)) {
        setFeedback({
          type: "error",
          message: "Este anime ja esta na sua lista.",
        });
        return;
      }

      if (!isAuthenticated) {
        setFeedback({
          type: "error",
          message: "Faca login para adicionar animes a sua lista.",
        });
        return;
      }

      setAddingAnimeId(anime.mal_id);

      const imageUrl =
        anime.images?.jpg?.image_url ||
        "https://via.placeholder.com/225x318?text=Sem+Imagem";

      try {
        const response = await api.post("/animes", {
          malId: anime.mal_id,
          title: anime.title,
          imageUrl,
          status: "Planejo ver",
          score: typeof anime.score === "number" ? anime.score : undefined,
          year: typeof anime.year === "number" ? anime.year : undefined,
        });

        const created = response.data as { _id?: string; malId?: number } | undefined;

        if (typeof created?._id === "string") {
          setUserAnimes((prev) => {
            const updated = new Map(prev);
            updated.set(anime.mal_id, created._id);
            return updated;
          });
        }

        setAddedMalIds((prev) => {
          const updated = new Set(prev);
          updated.add(anime.mal_id);
          return updated;
        });

        setFeedback({
          type: "success",
          message: `"${anime.title}" adicionado a sua lista.`,
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Nao foi possivel adicionar o anime. Tente novamente."
          ),
        });
      } finally {
        setAddingAnimeId(null);
      }
    },
    [addedMalIds, isAuthenticated]
  );

  const handleRemoveAnime = useCallback(
    async (anime: JikanAnime) => {
      if (!isAuthenticated) {
        setFeedback({
          type: "error",
          message: "Faca login para gerenciar sua lista.",
        });
        return;
      }

      const animeId = userAnimes.get(anime.mal_id);
      if (!animeId) {
        setFeedback({
          type: "error",
          message: "Este anime nao esta na sua lista.",
        });
        return;
      }

      setRemovingAnimeId(anime.mal_id);

      try {
        await api.delete(`/animes/${animeId}`);

        setUserAnimes((prev) => {
          const updated = new Map(prev);
          updated.delete(anime.mal_id);
          return updated;
        });

        setAddedMalIds((prev) => {
          const updated = new Set(prev);
          updated.delete(anime.mal_id);
          return updated;
        });

        setFeedback({
          type: "success",
          message: `"${anime.title}" removido da sua lista.`,
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Nao foi possivel remover o anime. Tente novamente."
          ),
        });
      } finally {
        setRemovingAnimeId(null);
      }
    },
    [userAnimes, isAuthenticated]
  );

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (!node) {
        return;
      }
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      });
      observerRef.current.observe(node);
    },
    [handleLoadMore]
  );

  useEffect(() => {
    if (!filtersActive) {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
      setIsInitialLoading(false);
      setIsFetchingMore(false);
      setSearchError(null);
      setResults([]);
      setHasMore(false);
      setCurrentPage(1);
      setTotalResults(null);
      return;
    }

    loadSearchResults(1, true);
  }, [filtersActive, loadSearchResults]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("https://api.jikan.moe/v4/genres/anime");
        if (!response.ok) {
          throw new Error("Falha ao carregar generos");
        }
        const json = (await response.json()) as JikanResponse<JikanGenre[]>;
        if (Array.isArray(json.data) && json.data.length > 0) {
          setGenres(
            json.data.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
          );
        }
      } catch (error) {
        console.warn("Utilizando lista local de generos.", error);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchSeasonal = async () => {
      setSeasonLoading(true);
      setSeasonError(null);

      try {
        const [popularRes, upcomingRes] = await Promise.all([
          fetch("https://api.jikan.moe/v4/seasons/now?filter=tv&limit=4"),
          fetch("https://api.jikan.moe/v4/seasons/upcoming?filter=tv&limit=4"),
        ]);

        if (!popularRes.ok || !upcomingRes.ok) {
          throw new Error(
            "Nao foi possivel carregar os destaques da temporada."
          );
        }

        const popularJson = (await popularRes.json()) as JikanResponse<
          RawJikanAnime[]
        >;
        const upcomingJson = (await upcomingRes.json()) as JikanResponse<
          RawJikanAnime[]
        >;

        const popularList = (popularJson.data ?? []).map(mapJikanAnime);
        const upcomingList = (upcomingJson.data ?? []).map(mapJikanAnime);

        setSeasonPopular(popularList);
        setSeasonUpcoming(upcomingList);
        setSeasonError(null);
      } catch (error) {
        setSeasonError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar destaques da temporada."
        );
      } finally {
        setSeasonLoading(false);
      }
    };

    fetchSeasonal();
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenre("");
    setSelectedYear("");
    setDebouncedSearch("");
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    setResults([]);
    setHasMore(false);
    setCurrentPage(1);
    setIsInitialLoading(false);
    setIsFetchingMore(false);
    setSearchError(null);
  };

  return (
    <div className="min-h-screen bg-surface-base text-fg px-4 py-6 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {feedback && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
                : "border border-danger/40 bg-danger/10 text-danger"
            }`}
          >
            {feedback.message}
          </div>
        )}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Procurar animes</h1>
          <p className="text-fg-muted">
            Explore os destaques da temporada ou refine a busca por nome, genero
            e ano.
          </p>
        </header>

        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-fg-muted">
                Buscar
              </span>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nome do anime"
                  className="w-full rounded-xl bg-surface-muted border border-surface-muted/70 focus:border-brand-primary focus:ring-0 py-3 pl-11 pr-4 text-sm text-fg placeholder:text-fg-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-fg-muted">
                Genero
              </span>
              <select
                value={selectedGenre}
                onChange={(event) => setSelectedGenre(event.target.value)}
                className="rounded-xl bg-surface-muted border border-surface-muted/70 focus:border-brand-primary focus:ring-0 py-3 px-3 text-sm text-fg"
              >
                <option value="">Qualquer genero</option>
                {genres.map((genre) => (
                  <option key={genre.mal_id} value={genre.mal_id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-fg-muted">
                Ano
              </span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="rounded-xl bg-surface-muted border border-surface-muted/70 focus:border-brand-primary focus:ring-0 py-3 px-3 text-sm text-fg"
              >
                <option value="">Qualquer ano</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedGenre || selectedYear || debouncedSearch) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {selectedGenre && (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-sm text-surface-card">
                  {genres.find(
                    (genre) => String(genre.mal_id) === selectedGenre
                  )?.name ?? "Genero selecionado"}
                  <button
                    type="button"
                    className="text-surface-card/80 hover:text-white"
                    onClick={() => setSelectedGenre("")}
                  >
                    x
                  </button>
                </span>
              )}
              {selectedYear && (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-sm text-surface-card">
                  {selectedYear}
                  <button
                    type="button"
                    className="text-surface-card/80 hover:text-white"
                    onClick={() => setSelectedYear("")}
                  >
                    x
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-sm font-semibold text-brand-secondary hover:text-brand-hover-secondary"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </section>

        {filtersActive ? (
          <section>
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Resultados da busca</h2>
                <p className="text-sm text-fg-muted">
                  Mostrando {results.length} de{" "}
                  {totalResults ?? results.length} animes
                </p>
              </div>
            </header>

            {searchError && (
              <div className="mb-4 rounded-lg bg-danger/10 text-danger px-4 py-3">
                {searchError}
              </div>
            )}

            {isInitialLoading ? (
              <Loader />
            ) : results.length === 0 ? (
              <p className="text-fg-muted">
                Nenhum anime encontrado com os filtros selecionados.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((anime) => (
                    <AnimeCard
                      key={anime.mal_id}
                      anime={anime}
                      onAdd={handleAddAnime}
                      onRemove={handleRemoveAnime}
                      isAdding={addingAnimeId === anime.mal_id}
                      isRemoving={removingAnimeId === anime.mal_id}
                      isAdded={addedMalIds.has(anime.mal_id)}
                    />
                  ))}
                </div>
                {isFetchingMore && <Loader />}
                <div ref={sentinelRef} className="h-6" />
              </>
            )}
          </section>
        ) : (
          <section className="space-y-12">
            <div>
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Populares nesta temporada
                </h2>
              </header>
              {seasonError && seasonPopular.length === 0 && (
                <div className="mb-4 rounded-lg bg-danger/10 text-danger px-4 py-3">
                  {seasonError}
                </div>
              )}
              {seasonLoading ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seasonPopular.map((anime) => (
                    <AnimeCard
                      key={`popular-${anime.mal_id}`}
                      anime={anime}
                      onAdd={handleAddAnime}
                      onRemove={handleRemoveAnime}
                      isAdding={addingAnimeId === anime.mal_id}
                      isRemoving={removingAnimeId === anime.mal_id}
                      isAdded={addedMalIds.has(anime.mal_id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Estreia na proxima temporada
                </h2>
              </header>
              {seasonError && seasonUpcoming.length === 0 && (
                <div className="mb-4 rounded-lg bg-danger/10 text-danger px-4 py-3">
                  {seasonError}
                </div>
              )}
              {seasonLoading ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seasonUpcoming.map((anime) => (
                    <AnimeCard
                      key={`upcoming-${anime.mal_id}`}
                      anime={anime}
                      onAdd={handleAddAnime}
                      onRemove={handleRemoveAnime}
                      isAdding={addingAnimeId === anime.mal_id}
                      isRemoving={removingAnimeId === anime.mal_id}
                      isAdded={addedMalIds.has(anime.mal_id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

