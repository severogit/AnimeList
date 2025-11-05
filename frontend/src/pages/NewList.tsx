import { useEffect, useState, Fragment } from "react";
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

const statusColors: Record<Status, string> = {
  Assistindo: "bg-status-watching",
  Concluído: "bg-status-completed",
  Dropado: "bg-status-dropped",
  "Planejo ver": "bg-status-plan",
};

type StatusFilter = "Todos" | Status;

const statusOptions: StatusFilter[] = ["Todos", ...statuses];

export default function MyListView() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<StatusFilter>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Planejo ver");
  const [editScore, setEditScore] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
    }
  }, [token]);

  const fetchAnimes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/animes");
      setAnimes(res.data.animes);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar animes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimes();
  }, []);

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
    const matchesStatus = filter === "Todos" || anime.status === filter;
    const matchesQuery =
      normalizedQuery === "" ||
      anime.title.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
  const sortedAnimes = [...filtered].sort((a, b) => {
    const scoreA = a.score ?? Number.NEGATIVE_INFINITY;
    const scoreB = b.score ?? Number.NEGATIVE_INFINITY;

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
  });

  return (
    <div className="flex min-h-screen bg-surface-muted text-fg">
      <aside className="w-64 bg-surface-base p-6 border-r border-gray-700 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>
        <ul className="space-y-2">
          {statusOptions.map((option) => (
            <li
              key={option}
              onClick={() => setFilter(option)}
              className={`cursor-pointer rounded-md px-3 py-2 transition ${
                filter === option
                  ? "bg-brand-hover-primary text-fg font-semibold"
                  : "text-gray-300 hover:text-fg hover:bg-surface-card/10"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 w-full p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Minha Lista</h1>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-surface-card/10 px-3 py-2 w-72">
              <MagnifyingGlassIcon className="w-5 h-5 text-fg/70" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por título"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="md:hidden mb-6">
          <div className="rounded-2xl bg-surface-card/10 p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-lg bg-surface-card/20 px-3 py-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-fg/70" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por título"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-fg-muted mb-2">
                Status
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      filter === option
                        ? "border-brand-primary bg-brand-primary text-fg"
                        : "border-transparent bg-surface-card text-fg-muted hover:text-fg"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : animes.length === 0 ? (
          <p>Você ainda nao adicionou nenhum anime na sua lista.</p>
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
                            typeof anime.notes === "string" ? anime.notes! : ""
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
      </main>
    </div>
  );
}



