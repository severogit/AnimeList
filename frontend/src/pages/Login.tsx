import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/errors";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      login({ token: response.data.token, user: response.data.user });
      navigate("/newlist");
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao logar"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
      <form
        className="bg-surface-card p-8 rounded-lg shadow-md w-full max-w-sm"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="sr-only">Email</span>
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-fg-muted rounded focus:outline-none focus:ring-2 focus:ring-brand-hover-primary bg-transparent"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="sr-only">Senha</span>
          <input
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-fg-muted rounded focus:outline-none focus:ring-2 focus:ring-brand-hover-primary bg-transparent"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-primary text-fg p-3 rounded hover:bg-brand-hover-primary transition-colors disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-center text-surface-header">
          Nao tem conta?{" "}
          <Link className="text-brand-primary hover:underline" to="/register">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
