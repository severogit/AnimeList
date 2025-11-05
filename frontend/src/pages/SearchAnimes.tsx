import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import type { JikanAnime, JikanGenre } from "../types/anime";

interface JikanResponse<T> {
  data: T;
  pagination?: {
    has_next_page?: boolean;
  };
}

const SKELETON_BATCH = 12;

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

const mapJikanAnime = (raw: any): JikanAnime => ({
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

function AnimeCard({ anime }: { anime: JikanAnime }) {
  const imageSrc =
    anime.images?.jpg?.image_url ||
    "https://via.placeholder.com/225x318?text=Sem+Imagem";

  return (
    <a
      href={anime.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-surface-card/30 bg-surface-muted/40 shadow-md transition-transform duration-200 group-hover:-translate-y-1">
        <img
          src={imageSrc}
          alt={anime.title}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="text-sm font-semibold text-fg truncate">
        {anime.title || "Titulo desconhecido"}
      </span>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="animate-pulse rounded-2xl bg-surface-muted/50 aspect-[2/3] w-full" />
      <div className="animate-pulse h-4 w-2/3 rounded-full bg-surface-muted/40" />
    </div>
  );
}

export default function SearchAnimes() {
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
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

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

  const filtersActive = Boolean(
    debouncedSearch || selectedGenre || selectedYear
  );

  const loadSearchResults = useCallback(
    async (pageToLoad: number, replace = false) => {
      if (!filtersActive) {
        return;
      }

      setSearchError(null);
      if (pageToLoad === 1 && replace) {
        setIsInitialLoading(true);
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
          `https://api.jikan.moe/v4/anime?${params.toString()}`
        );
        const json = (await response.json()) as JikanResponse<any[]> & {
          pagination: { has_next_page?: boolean };
        };

        if (!response.ok) {
          throw new Error(
            json?.data ? "Erro na busca de animes" : response.statusText
          );
        }

        const mapped = (json.data ?? []).map(mapJikanAnime);

        setResults((prev) =>
          replace || pageToLoad === 1 ? mapped : [...prev, ...mapped]
        );
        setHasMore(Boolean(json.pagination?.has_next_page));
        setCurrentPage(pageToLoad);
      } catch (error) {
        setSearchError(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao buscar animes."
        );
      } finally {
        setIsInitialLoading(false);
        setIsFetchingMore(false);
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
      setResults([]);
      setHasMore(false);
      setCurrentPage(1);
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

        const popularJson = (await popularRes.json()) as JikanResponse<any[]>;
        const upcomingJson = (await upcomingRes.json()) as JikanResponse<any[]>;

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
  };

  return (
    <div className="min-h-screen bg-surface-base text-fg px-4 py-6 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
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
                <span
                  onClick={() => setSelectedGenre("")}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-surface-card"
                >
                  {genres.find(
                    (genre) => String(genre.mal_id) === selectedGenre
                  )?.name ?? "Genero selecionado"}
                </span>
              )}
              {selectedYear && (
                <span
                  onClick={() => setSelectedYear("")}
                  className="inline-flex items-center gap-2 rounded-full  bg-brand-secondary px-3 py-1 text-surface-card"
                >
                  {selectedYear}
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
                  {results.length} animes encontrados
                </p>
              </div>
            </header>

            {searchError && (
              <div className="mb-4 rounded-lg bg-danger/10 text-danger px-4 py-3">
                {searchError}
              </div>
            )}

            {isInitialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: SKELETON_BATCH }).map((_, index) => (
                  <SkeletonCard key={`initial-skeleton-${index}`} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="text-fg-muted">
                Nenhum anime encontrado com os filtros selecionados.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((anime) => (
                    <AnimeCard key={anime.mal_id} anime={anime} />
                  ))}
                  {isFetchingMore &&
                    Array.from({ length: Math.min(SKELETON_BATCH, 8) }).map(
                      (_, index) => (
                        <SkeletonCard key={`fetching-skeleton-${index}`} />
                      )
                    )}
                </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: SKELETON_BATCH }).map((_, index) => (
                    <SkeletonCard key={`popular-skeleton-${index}`} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seasonPopular.map((anime) => (
                    <AnimeCard key={`popular-${anime.mal_id}`} anime={anime} />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: SKELETON_BATCH }).map((_, index) => (
                    <SkeletonCard key={`upcoming-skeleton-${index}`} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seasonUpcoming.map((anime) => (
                    <AnimeCard key={`upcoming-${anime.mal_id}`} anime={anime} />
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
