import { useEffect, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import api from "../services/api";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../context/AuthContext";
import Typeahead from "../components/Typeahead";
import type { Anime, Status } from "../types/anime";
import { statuses } from "../types/anime";

const statusColors: Record<Status, string> = {
  Assistindo: "bg-statusWatching",
  Concluído: "bg-statusCompleted",
  Dropado: "bg-statusDropped",
  "Planejo ver": "bg-statusPlanToWatch",
};

export default function MyList() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isLogged } = useAuth();

  if (!isLogged) {
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

  const handleAdd = async () => {
    if (!selectedAnime) return alert("Selecione um anime!");
    setLoading(true);
    try {
      await api.post("/animes", selectedAnime);
      setSelectedAnime(null);
      fetchAnimes(1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Erro ao adicionar anime");
      }
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
    <div className="p-6 bg-myListBg">
      <h1 className="text-2xl font-bold mb-4 text-center text-aWhite">
        Minha Lista de Animes
      </h1>

      <div className="flex gap-2 mb-6">
        <Typeahead onSelect={(anime) => setSelectedAnime(anime)} />
        <button
          className="bg-buttonBlue text-aWhite px-4 py-2 rounded-md hover:bg-hoverBlue"
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
                className="flex flex-col items-center gap-2 bg-aWhite p-4 rounded-lg shadow-md w-40"
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-36 h-48 object-cover rounded-md"
                />
                <strong
                  className="truncate w-full text-center text-primary"
                  title={anime.title}
                >
                  {anime.title}
                </strong>

                <div className="relative w-full mt-1">
                  <Listbox
                    value={anime.status}
                    onChange={(value) => handleUpdateStatus(anime._id!, value)}
                  >
                    <ListboxButton
                      className={`relative w-full text-left cursor-pointer border border-lightGray rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-buttonBlue 
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
                          className="cursor-pointer px-4 py-2 ui-active:bg-hoverBlue ui-active:text-aWhite ui-selected:font-bold hover:bg-lightGray"
                        >
                          {status}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Listbox>
                </div>

                <button
                  className="mt-2 bg-buttonRed text-aWhite px-3 py-1 rounded-md hover:bg-hoverRed"
                  onClick={() => handleDelete(anime._id!)}
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
              className="px-3 py-1 bg-hoverBlue rounded-md text-aWhite"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-hoverBlue rounded-md text-aWhite"
            >
              Próximo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
