import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Anime, Status } from "../types/anime";
import { statuses } from "../types/anime";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Dialog,
  Transition,
} from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import { useAuth } from "../context/AuthContext";

const finalStatus = (
  statuses.find((status) => status === "Finalizado") ?? statuses[1]
) as Status;

const statusColors: Record<Status, string> = {
  Assistindo: "bg-status-watching",
  Dropado: "bg-status-dropped",
  "Planejo ver": "bg-status-plan",
  [finalStatus]: "bg-status-completed",
};

function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  );
}

type StatusFilter = "Todos" | Status;

const statusOptions: StatusFilter[] = ["Todos", ...statuses];

export default function MyListView() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("Todos");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Planejo ver");
  const [editScore, setEditScore] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");

  const fetchAnimes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/animes", { params: { limit: 0 } });
      setAnimes(Array.isArray(res.data?.animes) ? res.data.animes : []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar animes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAnimes([]);
      navigate("/login", { replace: true });
      return;
    }
    fetchAnimes();
  }, [isAuthenticated, fetchAnimes, navigate]);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    animes.forEach((anime) => {
      if (typeof anime.year === "number") {
        yearSet.add(String(anime.year));
      }
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [animes]);

  const handleDeleteAnime = async (animeId: string) => {
    if (!animeId) return;
    const shouldDelete = confirm("Deseja remover este anime da lista?");
    if (!shouldDelete) return;

    try {
      await api.delete(`/animes/${animeId}`);
      setAnimes((prev) => prev.filter((anime) => anime._id !== animeId));
      setEditingAnime(null);
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover o anime");
    }
  };

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filtered = animes.filter((anime) => {
    const matchesStatus =
      selectedStatus === "Todos" || anime.status === selectedStatus;
    const matchesYear =
      selectedYear === "" ||
      (typeof anime.year === "number" && String(anime.year) === selectedYear);
    const matchesQuery =
      normalizedQuery === "" ||
      anime.title.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesYear && matchesQuery;
  });

  const sortedAnimes = [...filtered].sort((a, b) => {
    const scoreA = a.score ?? Number.NEGATIVE_INFINITY;
    const scoreB = b.score ?? Number.NEGATIVE_INFINITY;

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
  });

  const trimmedSearch = searchTerm.trim();
  const hasActiveFilters =
    trimmedSearch !== "" ||
    selectedStatus !== "Todos" ||
    selectedYear !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("Todos");
    setSelectedYear("");
  };

  const totalAnimes = animes.length;
  const hasResults = sortedAnimes.length > 0;

  return (
    <div className="min-h-screen bg-surface-base text-fg px-4 py-6 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha lista</h1>
          <p className="text-fg-muted">
            Revise, filtre e organize os animes que fazem parte da sua coleção.
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
                Status
              </span>
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as StatusFilter)
                }
                className="rounded-xl bg-surface-muted border border-surface-muted/70 focus:border-brand-primary focus:ring-0 py-3 px-3 text-sm text-fg"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
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

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {trimmedSearch !== "" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-sm text-surface-card">
                  {trimmedSearch}
                  <button
                    type="button"
                    className="text-surface-card/80 hover:text-white"
                    onClick={() => setSearchTerm("")}
                  >
                    x
                  </button>
                </span>
              )}

              {selectedStatus !== "Todos" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-sm text-surface-card">
                  {selectedStatus}
                  <button
                    type="button"
                    className="text-surface-card/80 hover:text-white"
                    onClick={() => setSelectedStatus("Todos")}
                  >
                    x
                  </button>
                </span>
              )}

              {selectedYear !== "" && (
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

        <section>
          <header className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Animes da sua lista</h2>
              <p className="text-sm text-fg-muted">
                {sortedAnimes.length}{" "}
                {sortedAnimes.length === 1 ? "anime" : "animes"} exibidos de{" "}
                {totalAnimes}
              </p>
            </div>
          </header>

          {loading ? (
            <Loader />
          ) : totalAnimes === 0 ? (
            <p className="text-fg-muted">
              Você ainda não adicionou nenhum anime na sua lista.
            </p>
          ) : !hasResults ? (
            <p className="text-fg-muted">
              Nenhum anime encontrado com os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="hidden md:flex items-center justify-between font-semibold border-b border-gray-600 py-2 mb-3 px-2">
                <div className="flex items-center min-w-0">
                  <span className="text-left">Título</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 pr-2 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-center w-16">Score</span>
                  <span className="text-center w-28">Status</span>
                  <span className="text-center w-20">Editar</span>
                </div>
              </div>

              <div className="space-y-2">
                {sortedAnimes.map((anime) => (
                  <div
                    key={anime._id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-surface-card/5 hover:bg-surface-card/10 rounded-lg px-3 py-2 transition-colors min-h-[56px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                      />
                      <span className="text-base font-medium truncate">
                        {anime.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 pr-2 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-lg font-semibold text-yellow-400 md:w-16 text-center md:text-center">
                        {typeof anime.score === "number" ? anime.score : 0}
                      </div>
                      <div className="flex md:w-28 md:justify-center">
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-md ${
                            statusColors[anime.status]
                          } text-white`}
                        >
                          {anime.status}
                        </span>
                      </div>
                      <div className="flex md:w-20 md:justify-center">
                        <button
                          aria-label="Editar"
                          title="Editar"
                          className="p-2 rounded-md bg-brand-secondary hover:bg-brand-hover-secondary text-fg"
                          onClick={() => {
                            setEditingAnime(anime);
                            setEditStatus(anime.status);
                            setEditScore(
                              typeof anime.score === "number" ? anime.score : 0
                            );
                            setEditNotes(
                              typeof anime.notes === "string"
                                ? anime.notes!
                                : ""
                            );
                            setEditOpen(true);
                          }}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <Transition show={editOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setEditOpen(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-surface-card text-fg-inverse shadow-xl">
                    <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                      {editingAnime && (
                        <img
                          src={editingAnime.imageUrl}
                          alt={editingAnime.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <Dialog.Title className="text-lg font-semibold truncate">
                        {editingAnime?.title}
                      </Dialog.Title>
                      <button
                        className="ml-auto text-fg-inverse/70 hover:text-fg-inverse"
                        onClick={() => setEditOpen(false)}
                        aria-label="Fechar"
                        type="button"
                      >
                        X
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <label className="mb-1 text-sm">Status</label>
                        <div className="relative">
                          <Listbox value={editStatus} onChange={setEditStatus}>
                            <ListboxButton className="w-full text-left cursor-pointer border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse">
                              {editStatus}
                            </ListboxButton>
                            <ListboxOptions className="absolute z-20 mt-1 w-full bg-surface-card text-fg-inverse border border-fg-muted rounded-md shadow-lg max-h-40 overflow-auto">
                              {statuses.map((s) => (
                                <ListboxOption
                                  key={s}
                                  value={s}
                                  className="cursor-pointer px-3 py-2 hover:bg-fg-muted"
                                >
                                  {s}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </Listbox>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm">Score</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className="w-full border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse"
                          value={editScore}
                          onChange={(e) => setEditScore(Number(e.target.value))}
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-col">
                        <label className="mb-1 text-sm">Notes</label>
                        <textarea
                          className="w-full border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse min-h-24"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                        <button
                          className="px-4 py-2 rounded-md bg-danger hover:bg-danger-hover text-fg"
                          type="button"
                          onClick={() => {
                            if (!editingAnime?._id) {
                              return;
                            }
                            void handleDeleteAnime(editingAnime._id);
                          }}
                        >
                          Deletar
                        </button>
                        <button
                          className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-hover-primary text-fg"
                          type="button"
                          onClick={async () => {
                            if (!editingAnime?._id) {
                              setEditOpen(false);
                              return;
                            }
                            try {
                              const res = await api.put(
                                `/animes/${editingAnime._id}`,
                                {
                                  status: editStatus,
                                  score: editScore,
                                  notes: editNotes,
                                }
                              );
                              const updated = res.data;
                              setAnimes((prev) =>
                                prev.map((a) =>
                                  a._id === editingAnime._id
                                    ? {
                                        ...a,
                                        status: updated.status,
                                        score: updated.score,
                                        notes: updated.notes,
                                      }
                                    : a
                                )
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Erro ao salvar");
                              return;
                            }
                            setEditOpen(false);
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}
