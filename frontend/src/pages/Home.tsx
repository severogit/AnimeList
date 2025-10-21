import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-semibold mb-4">Bem-vindo ao AnimeList!</h2>
        <p className="mb-6 text-gray-700 max-w-md">
          Aqui você pode adicionar, acompanhar e organizar seus animes favoritos de forma simples e prática.
        </p>

        <Link
          to="/login"
          className="bg-buttonBlue text-white px-6 py-3 rounded-md hover:bg-hoverBlue transition"
        >
          Faça o Login para organizar sua lista
        </Link>
      </main>

      <footer className="bg-gray-200 text-gray-700 p-4 text-center">
        &copy; {new Date().getFullYear()} AnimeList. Todos os direitos reservados.
      </footer>
    </div>
  );
}
