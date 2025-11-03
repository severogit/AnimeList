import { useEffect, useState, Fragment } from "react";
import api from "../services/api";
import type { Anime, Status } from "../types/anime";
import { statuses } from "../types/anime";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Dialog, Transition } from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/20/solid";

const statusColors: Record<Status, string> = {
  Assistindo: "bg-status-watching",
  Concluído: "bg-status-completed",
  Dropado: "bg-status-dropped",
  "Planejo ver": "bg-status-plan",
};

export default function MyListView() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  
  type StatusFilter = "Todos" | Status;
  const [filter, setFilter] = useState<StatusFilter>("Todos");

  const [editOpen, setEditOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Planejo ver");
  const [editScore, setEditScore] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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

  const filtered = filter === "Todos" ? animes : animes.filter(a => a.status === filter);

  return (
    <div className="flex min-h-screen bg-surface-muted text-fg">
      <aside className="w-64 bg-surface-base p-6 border-r border-gray-700 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>
        <ul className="space-y-2">
          <li className="text-gray-300 hover:text-fg cursor-pointer" onClick={() => setFilter("Todos")}>Todos</li>
          <li className="text-gray-300 hover:text-fg cursor-pointer" onClick={() => setFilter("Assistindo")}>Assistindo</li>
          <li className="text-gray-300 hover:text-fg cursor-pointer" onClick={() => setFilter("Concluído")}>Concluídos</li>
          <li className="text-gray-300 hover:text-fg cursor-pointer" onClick={() => setFilter("Dropado")}>Dropados</li>
          <li className="text-gray-300 hover:text-fg cursor-pointer" onClick={() => setFilter("Planejo ver")}>Planejo ver</li>
        </ul>
      </aside>

      <main className="flex-1 p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Minha Lista</h1>

        {loading ? (
          <p>Carregando...</p>
        ) : animes.length === 0 ? (
          <p>Voc� ainda nao adicionou nenhum anime na sua lista.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between font-semibold border-b border-gray-600 py-2 mb-3 px-2">
              <div className="flex items-center min-w-0">
                <span className="text-left">Título</span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <span className="text-center w-16">Score</span>
                <span className="text-center w-28">Status</span>
                <span className="text-center w-20">Editar</span>
              </div> 
            </div>

            <div className="space-y-2">
              {filtered.map((anime) => (
                <div
                  key={anime._id}
                  className="flex items-center justify-between bg-surface-card/5 hover:bg-surface-card/10 rounded-lg px-2 py-1 transition-colors min-h-[56px]"
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

                  <div className="flex items-center gap-4 pr-2">
                    <div className="text-lg font-semibold text-yellow-400 w-16 text-center">{typeof anime.score === 'number' ? anime.score : 0}</div>
                    <div className="w-28 flex justify-center">
                      <span className={`text-sm font-semibold px-3 py-1 rounded-md ${statusColors[anime.status]} text-white`}>
                        {anime.status}
                      </span>
                    </div>
                    <div className="w-20 flex justify-center">
                      <button
                        aria-label="Editar"
                        title="Editar"
                        className="p-2 rounded-md bg-brand-secondary hover:bg-brand-hover-secondary text-fg"
                        onClick={() => {
                          setEditingAnime(anime);
                          setEditStatus(anime.status);
                          setEditScore(typeof anime.score === 'number' ? anime.score : 0);
                          setEditNotes(typeof anime.notes === 'string' ? anime.notes! : "");
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
          <Dialog as="div" className="relative z-50" onClose={() => setEditOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-surface-card text-fg-inverse shadow-xl">
                    <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                      {editingAnime && (
                        <img src={editingAnime.imageUrl} alt={editingAnime.title} className="w-12 h-16 object-cover rounded" />
                      )}
                      <Dialog.Title className="text-lg font-semibold truncate">{editingAnime?.title}</Dialog.Title>
                      <button className="ml-auto text-fg-inverse/70 hover:text-fg-inverse" onClick={() => setEditOpen(false)}>✕</button>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <label className="mb-1 text-sm">Status</label>
                        <div className="relative">
                          <Listbox value={editStatus} onChange={setEditStatus}>
                            <ListboxButton className="w-full text-left cursor-pointer border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse">{editStatus}</ListboxButton>
                            <ListboxOptions className="absolute z-20 mt-1 w-full bg-surface-card text-fg-inverse border border-fg-muted rounded-md shadow-lg max-h-40 overflow-auto">
                              {statuses.map((s) => (
                                <ListboxOption key={s} value={s} className="cursor-pointer px-3 py-2 hover:bg-fg-muted">
                                  {s}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </Listbox>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm">Score</label>
                        <input type="number" min={0} max={10} className="w-full border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse" value={editScore} onChange={(e) => setEditScore(Number(e.target.value))} />
                      </div>

                      <div className="md:col-span-3 flex flex-col">
                        <label className="mb-1 text-sm">Notes</label>
                        <textarea className="w-full border border-fg-muted rounded-md py-2 px-3 bg-surface-card text-fg-inverse min-h-24" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                      </div>

                      <div className="md:col-span-3 flex justify-end gap-2">
                        <button className="px-4 py-2 rounded-md bg-danger hover:bg-danger-hover text-fg" onClick={() => setEditOpen(false)}>Cancelar</button>
                        <button
                          className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-hover-primary text-fg"
                          onClick={async () => {
                            if (!editingAnime?._id) { setEditOpen(false); return; }
                            try {
                              const res = await api.put(`/animes/${editingAnime._id}`, { status: editStatus, score: editScore, notes: editNotes });
                              const updated = res.data;
                              setAnimes((prev) => prev.map(a => a._id === editingAnime._id ? { ...a, status: updated.status, score: updated.score, notes: updated.notes } : a));
                            } catch (err) {
                              console.error(err);
                              alert('Erro ao salvar');
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
