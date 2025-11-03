import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRightEndOnRectangleIcon,
  BookOpenIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

export default function Header() {
  const { isLogged, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-surface-header flex flex-col lg:flex-row items-center lg:h-20 px-4 py-2 relative">
      <div className="flex items-center gap-2 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
        <img
          src="https://i.pinimg.com/736x/a7/33/18/a7331835c2af4d608055f74ade5be191.jpg"
          alt="Anime List Logo"
          className="w-12 h-12 rounded-full object-cover"
        />
        <h1 className="text-fg text-2xl font-bold tracking-wide">
          Anime List
        </h1>
      </div>

      <button
        className="lg:hidden ml-auto text-fg"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      <nav
        className={`
           text-fg flex-col lg:flex-row items-center gap-2 lg:gap-4
          w-full lg:w-auto lg:ml-auto mt-2 lg:mt-0
          ${mobileMenuOpen ? "flex" : "hidden lg:flex"}
        `}
      >
        <Link
          to="/"
          className="flex items-center justify-center gap-1 bg-brand-warning px-3 py-2 rounded-full text-sm lg:text-base font-bold hover:bg-brand-hover-warning transition"
        >
          Home
          <HomeIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </Link>

        {isLogged && (
          <>
            <Link
              to="/newlist"
              className="flex items-center justify-center gap-1 bg-brand-secondary px-3 py-2 rounded-full text-sm lg:text-base font-bold hover:bg-brand-hover-secondary transition"
            >
              Lista
              <BookOpenIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </Link>

            <div
              onClick={logout}
              className="flex items-center justify-center gap-1 bg-danger px-3 py-2 rounded-full text-sm lg:text-base font-bold hover:bg-danger-hover transition cursor-pointer"
            >
              Logout
              <ArrowRightEndOnRectangleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </>
        )}

        {!isLogged && (
          <>
            <Link
              to="/login"
              className="text-fg hover:text-fg-muted px-3 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-fg hover:text-fg-muted px-3 py-2"
            >
              Registrar
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
