import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/animelist.png";

export default function Home() {
  const { isLogged } = useAuth();

  return (
    <div className="min-h-screen-minus-header bg-primary flex flex-col">
      <main className="flex-1 flex justify-center items-start mt-16 px-4">
        <section className="max-w-3xl w-full text-left">
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
            className="bg-lightGray text-black px-6 py-2.5 rounded-full border-2 border-transparent font-semibold tracking-tight w-max hover:bg-aWhite transition-all"
          >
            {isLogged ? "Minha Lista" : "Comece Já"}
          </Link>
        </section>
      </main>

      <footer className="bg-gray-200 text-aWhite p-4 text-center">
        &copy; {new Date().getFullYear()} AnimeList. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}
