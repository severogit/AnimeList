import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await api.post("/auth/register", { name, email, password });
      alert("Cadastro realizado! Faça login.");
      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Erro ao cadastrar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fg-muted">
      <div className="bg-surface-card p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastro</h1>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 border border-fg-muted rounded focus:outline-none focus:ring-2 focus:ring-brand-hover-primary"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-fg-muted rounded focus:outline-none focus:ring-2 focus:ring-brand-hover-primary"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 border border-fg-muted rounded focus:outline-none focus:ring-2 focus:ring-brand-hover-primary"
        />

        <button
          onClick={handleRegister}
          className="w-full bg-brand-primary text-fg p-3 rounded hover:bg-brand-hover-primary transition-colors"
        >
          Cadastrar
        </button>

        <p className="mt-4 text-center text-surface-header">
          Já tem conta?{" "}
          <Link className="text-brand-primary hover:underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
