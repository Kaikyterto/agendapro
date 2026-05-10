import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import { loginService } from "../services/auth";

const LoginPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await loginService({ email, password });

      localStorage.setItem("@AgendaPro:token", data.token);

      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[400px] relative">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-2xl font-bold text-white">
            Agenda<span className="text-blue-500">Pro</span>
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Gestão inteligente para seus horários
          </p>
        </div>

        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-4 py-3 text-white"
            />

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-4 py-3 text-white"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
