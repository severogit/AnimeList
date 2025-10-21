import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { isLogged, logout } = useAuth();

  return (
    <header className="bg-headerBg h-20 relative flex items-center px-4">
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        <img
          src="https://i.pinimg.com/736x/a7/33/18/a7331835c2af4d608055f74ade5be191.jpg"
          alt="Anime List Logo"
          className="w-12 h-12 rounded-full object-cover"
        />
        <h1 className="text-aWhite text-2xl font-bold tracking-wide">
          Anime List
        </h1>
      </div>

      <nav className="ml-auto flex items-center gap-4">
        <Link to="/" className="text-aWhite hover:text-lightGray">
          Home
        </Link>

        {isLogged && (
          <>
            <Link to="/mylist" className="text-aWhite hover:text-lightGray">
              Minha Lista
            </Link>
            <button
              onClick={logout}
              className="text-aWhite hover:text-lightGray"
            >
              Logout
            </button>
          </>
        )}

        {!isLogged && (
          <>
            <Link to="/login" className="text-aWhite hover:text-lightGray">
              Login
            </Link>
            <Link to="/register" className="text-aWhite hover:text-lightGray">
              Registrar
            </Link>
          </>
        )}

      </nav>
    </header>
  );
}
