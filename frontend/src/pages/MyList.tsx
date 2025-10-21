import { useEffect, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import api from "../services/api";

interface Anime {
  _id: string;
  malId: number;
  title: string;
  status: Status;
  imageUrl: string;
}

const statuses = ["Assistindo", "Concluído", "Dropado", "Planejo ver"] as const;

type Status = (typeof statuses)[number];

const statusColors: Record<Status, string> = {
  Assistindo: "bg-statusWatching",
  Concluído: "bg-statusCompleted",
  Dropado: "bg-gray",
  "Planejo ver": "bg-statusPlanToWatch",
};

export default function MyList() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para acessar a lista!");
    window.location.href = "/";
  }

  const fetchAnimes = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/animes?page=${page}&limit=16`);
      setAnimes(res.data.animes);
      setTotalPages(res.data.pagination.totalPages);
      setCurrentPage(res.data.pagination.page);
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

  const getAnimeData = async (title: string) => {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
      );
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const anime = data.data[0];
        return {
          malId: Number(anime.mal_id),
          title: anime.title,
          url: anime.url,
          imageUrl: anime.images.jpg.image_url,
        };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return alert("Digite o nome do anime!");

    setLoading(true);
    try {
      const animeData = await getAnimeData(newTitle);
      if (!animeData) {
        alert("Anime não encontrado!");
        setLoading(false);
        return;
      }

      await api.post("/animes", animeData);

      setNewTitle("");
      fetchAnimes(1);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.msg || "Erro ao adicionar anime");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/animes/${id}`, { status: newStatus });
      fetchAnimes(currentPage);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este anime?")) return;
    try {
      await api.delete(`/animes/${id}`);
      fetchAnimes(currentPage);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover anime");
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) fetchAnimes(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) fetchAnimes(currentPage + 1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Minha Lista de Animes
      </h1>

      <div className="flex gap-2 mb-6">
        <input
          placeholder="Nome do anime"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 flex-1"
        />
        <button
          className="bg-buttonBlue text-white px-4 py-2 rounded-md hover:bg-hoverBlue"
          onClick={handleAdd}
        >
          Adicionar
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-6 justify-center">
            {animes.map((anime) => (
              <li
                key={anime._id}
                className="flex flex-col items-center gap-2 bg-lightGray p-4 rounded-lg shadow-md w-40"
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-36 h-48 object-cover rounded-md"
                />
                <strong
                  className="truncate w-full text-center"
                  title={anime.title}
                >
                  {anime.title}
                </strong>

                <div className="relative w-full mt-1">
                  <Listbox
                    value={anime.status}
                    onChange={(value) => handleUpdateStatus(anime._id, value)}
                  >
                    <ListboxButton
                      className={`relative w-full text-left cursor-pointer border border-gray rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                        ${statusColors[anime.status]} text-aWhite`}
                    >
                      {anime.status}
                      <ChevronDownIcon
                        className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-aWhite/60 w-5"
                        aria-hidden="true"
                      />
                    </ListboxButton>

                    <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-gray rounded-md shadow-lg max-h-40 overflow-auto">
                      {statuses.map((status) => (
                        <ListboxOption
                          key={status}
                          value={status}
                          className="cursor-pointer px-4 py-2 ui-active:bg-blue-500 ui-active:text-aWhite ui-selected:font-bold hover:bg-lightGray"
                        >
                          {status}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Listbox>
                </div>
                <button
                  className="mt-2 bg-red-500 text-aWhite px-3 py-1 rounded-md hover:bg-buttonRed"
                  onClick={() => handleDelete(anime._id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-300 rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-300 rounded-md disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
