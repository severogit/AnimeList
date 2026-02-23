import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

interface AuthUser {
  id: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (session: { token: string; user?: AuthUser | null }) => void;
  logout: () => void;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "auth:user";

const readStoredSession = (): AuthState => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return {
      token,
      user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredSession());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === TOKEN_STORAGE_KEY ||
        event.key === USER_STORAGE_KEY ||
        event.key === null
      ) {
        setState(readStoredSession());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = useCallback(
    ({ token, user }: { token: string; user?: AuthUser | null }) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setState({ token, user: user ?? null });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setState({ token: null, user: null });
  }, []);

  const { token, user } = state;

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
}
