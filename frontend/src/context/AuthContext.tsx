import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
  isLogged: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogged(!!token);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setIsLogged(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
  };

  return (
    <AuthContext.Provider value={{ isLogged, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para facilitar o uso
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
}
