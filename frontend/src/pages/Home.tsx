import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Logo from "../assets/animelist.png";

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  episodes: string;
}

export default function Home() {
  const { isLogged } = useAuth();
  const [topAnimes, setTopAnimes] = useState<Anime[]>([]);

  useEffect(() => {
    async function fetchTopAnimes() {
      try {
        const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=20");
        const data = await res.json();
        setTopAnimes(data.data);
      } catch (err) {
        console.error("Erro ao buscar top animes:", err);
      }
    }
    fetchTopAnimes();
  }, []);

  return (
    <div className="min-h-screen-minus-header bg-primary flex flex-col">
      <main className="flex-1 flex flex-col items-center mt-16 px-4">
        <section className="w-2/3 text-left">
          <img
            className="w-1/3 h-auto filter invert brightness-200"
            src={Logo}
            alt="AnimeList Logo"
          />

          <p className="mt-6 mb-12 text-aWhite max-w-md">
            AnimeList é um projeto pessoal onde você pode gerenciar sua lista de
            animes favoritos de maneira fácil e prática.
          </p>

          <Link
            to={isLogged ? "/mylist" : "/login"}
            className="bg-aWhite text-black px-6 py-2.5 rounded-full border-2 border-transparent font-semibold tracking-tight w-max hover:bg-lightGray transition-all"
          >
            {isLogged ? "Minha Lista" : "Comece Já"}
          </Link>
        </section>

        <section className="w-2/3 mt-12">
          <h2 className="text-aWhite text-2xl font-semibold mb-4 text-left">
            Top Animes
          </h2>

          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={3}
            spaceBetween={8}
            autoplay={{ delay: 4000 }}
            loop
            breakpoints={{
              320: { slidesPerView: 2 },
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 5 },
            }}
          >
            {topAnimes.map((anime) => (
              <SwiperSlide key={anime.mal_id}>
                <div className="relative overflow-hidden shadow-lg duration-300 flex flex-col items-center">
                  <img
                    src={anime.images.jpg.image_url}
                    alt={anime.title}
                    className="object-cover w-full h-80 rounded"
                  />
                  <div className="absolute bottom-0 left-0 w-full p-2 text-center text-white rounded bg-sliderGray">
                    <p className="text-sm font-semibold truncate">
                      {anime.title}
                    </p>
                    {anime.episodes && (
                      <p className="text-xs mt-1">{anime.episodes} Episódios</p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      </main>

      <footer className="bg-gray-200 text-aWhite p-4 text-center mt-12">
        &copy; {new Date().getFullYear()} AnimeList. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}
