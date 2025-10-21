import { useEffect, useState } from "react";
import api from "../services/api";

interface Anime {
  _id: string;
  malId: number;
  title: string;
  status: string;
  imageUrl: string;
}

export default function MyList() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para acessar a lista!");
    window.location.href = "/";
  }

  const fetchAnimes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/animes");
      setAnimes(res.data);
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
          title: anime.title, // título completo
          url: anime.url, // link para MAL
          imageUrl: anime.images.jpg.image_url, // imagem
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

      const res = await api.post("/animes", animeData);

      setAnimes([...animes, res.data]);
      setNewTitle("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.msg || "Erro ao adicionar anime");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/animes/${id}`, { status: newStatus });
      setAnimes(animes.map((a) => (a._id === id ? res.data : a)));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este anime?")) return;
    try {
      await api.delete(`/animes/${id}`);
      setAnimes(animes.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao remover anime");
    }
  };

  return (
    <div>
      <h1>Minha Lista de Animes</h1>

      <div>
        <input
          placeholder="Nome do anime"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button onClick={handleAdd}>Adicionar</button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="flex align-center justify-center">
          {animes.map((anime) => (
            <li
              key={anime._id}
              className="flex items-center justify-center flex-col gap-2 ml-6"
            >
              <img src={anime.imageUrl} alt={anime.title} className="w-40 h-56 object-cover rounded-md"/>
              <div>
                <strong className="truncate w-20 block text-center ml-2" title={anime.title}>{anime.title}</strong>
                <select
                  value={anime.status}
                  onChange={(e) =>
                    handleUpdateStatus(anime._id, e.target.value)
                  }
                >
                  <option value="Assistindo">Assistindo</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Dropado">Dropado</option>
                  <option value="Planejo ver">Planejo ver</option>
                </select>
              </div>
              <button onClick={() => handleDelete(anime._id)} className="bg-buttonRed text-aWhite rounded-md p-2">Remover</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
