import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRightEndOnRectangleIcon,
  BookOpenIcon,
  HomeIcon,
} from "@heroicons/react/20/solid";

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

      <nav className="ml-auto flex items-center gap-4 w-1/3">
        <Link to="/" className="text-aWhite hover:text-lightGray flex items-center px-2 py-2 justify-center gap-1 bg-btnYellow rounded-full font-bold hover:bg-hoverYellow transition">
          Home
          <HomeIcon className="w-5 w-5"/>
        </Link>

        {isLogged && (
          <>
            <Link
              to="/mylist"
              className="flex items-center justify-center gap-1 bg-btnlBlue px-2 py-2 border-2 border-transparent rounded-full text-aWhite font-bold hover:bg-hoverBlue transition"
            >
              Lista
              <BookOpenIcon className="w-5 w-5"></BookOpenIcon>
            </Link>
            <div
              onClick={logout}
              className="flex items-center justify-center bg-buttonRed px-3 py-2 rounded-full gap-1 hover:bg-hoverRed border-2 border-transparent text-aWhite transition font-bold"
            >
              Logout
              <ArrowRightEndOnRectangleIcon className="w-5 h-5" />
            </div>
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
