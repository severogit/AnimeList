import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/mylist");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Erro ao logar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightGray">
      <div className="bg-aWhite p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-lightGray rounded focus:outline-none focus:ring-2 focus:ring-hoverBlue"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-4 border border-lightGray rounded focus:outline-none focus:ring-2 focus:ring-hoverBlue"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-buttonBlue text-aWhite p-3 rounded hover:bg-hoverBlue transition-colors"
        >
          Entrar
        </button>

        <p className="mt-4 text-center text-headerBg">
          Não tem conta? <Link className="text-buttonBlue hover:underline" to="/register">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
