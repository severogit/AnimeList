import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Anime } from "../types/anime";

const statusColors: Record<string, string> = {
  Assistindo: "bg-statusWatching",
  Concluído: "bg-statusCompleted",
  Dropado: "bg-statusDropped",
  "Planejo ver": "bg-statusPlanToWatch",
};

export default function MyListView() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const { isLogged } = useAuth();

  if (!isLogged) {
    alert("Você precisa estar logado para acessar a lista!");
    window.location.href = "/";
  }

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

  return (
    <div className="flex min-h-screen bg-myListBg text-aWhite">
      <aside className="w-64 bg-primary p-6 border-r border-gray-700 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Filtros</h2>
        <ul className="space-y-2">
          <li className="text-gray-300 hover:text-aWhite cursor-pointer">Todos</li>
          <li className="text-gray-300 hover:text-aWhite cursor-pointer">Assistindo</li>
          <li className="text-gray-300 hover:text-aWhite cursor-pointer">Concluídos</li>
          <li className="text-gray-300 hover:text-aWhite cursor-pointer">Dropados</li>
          <li className="text-gray-300 hover:text-aWhite cursor-pointer">Planejo ver</li>
        </ul>
      </aside>

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Minha Lista</h1>

        {loading ? (
          <p>Carregando...</p>
        ) : animes.length === 0 ? (
          <p>Você ainda não adicionou nenhum anime à lista.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Cabeçalho da tabela: Título | (Score + Status) */}
            <div className="grid grid-cols-[minmax(300px,1fr)_220px] font-semibold border-b border-gray-600 pb-2 mb-3 px-2">
              <span className="text-left">Título</span>
              <div className="flex justify-end items-center gap-6 pr-2">
                <span className="text-center w-12">Score</span>
                <span className="text-center w-24">Status</span>
              </div>
            </div>

            {/* Linhas */}
            <div className="space-y-2">
              {animes.map((anime) => (
                <div
                  key={anime._id}
                  className="grid grid-cols-[minmax(300px,1fr)_220px] items-center bg-aWhite/5 hover:bg-aWhite/10 rounded-lg py-2 px-2 transition-colors"
                >
                  {/* Título */}
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

                  {/* Score + Status juntos, lado a lado, alinhados à direita */}
                  <div className="flex justify-end items-center gap-6 pr-2">
                    <div className="text-lg font-semibold text-yellow-400 w-12 text-center">
                      10
                    </div>
                    <div className="w-24 flex justify-center">
                      <span
                        className={`text-sm font-semibold px-3 py-1 rounded-md ${statusColors[anime.status]} text-white`}
                      >
                        {anime.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
