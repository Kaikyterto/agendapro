import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, UserPlus } from "lucide-react";
import { loginService } from "../services/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.success;

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

      // =========================
      // PAGAMENTO PENDENTE
      // =========================
      if (data?.payment_pending) {
        localStorage.setItem("@AgendaPro:payment_pending", "true");
        localStorage.setItem(
          "@AgendaPro:payment",
          JSON.stringify(data.payment)
        );

        navigate("/payment", {
          state: {
            payment: data.payment,
            company: data.company,
          },
        });

        return;
      }

      // =========================
      // SALVAR LOGIN
      // =========================
      localStorage.setItem("@AgendaPro:token", data.access_token);
      localStorage.setItem("@AgendaPro:user", JSON.stringify(data.user));

      // =========================
      // PEGAR SLUG CORRETO
      // =========================
      const slug = data?.company?.slug || data?.user?.company?.slug || null;

      // =========================
      // REDIRECIONAMENTO
      // =========================
      if (slug) {
        navigate(`/admin/${slug}`);
      } else {
        navigate("/admin"); // fallback seguro
      }
    } catch (err) {
      console.error(err);
      setError(err?.msg || err?.message || "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center p-4 text-slate-200">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white">
            Agenda<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Gestão inteligente para seus horários
          </p>
        </div>

        <div className="bg-[#16191f]/80 border border-white/10 p-8 rounded-3xl">
          {successMessage && (
            <div className="mb-5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold"
            >
              {isLoading ? "Entrando..." : "Entrar"}
              <ArrowRight className="inline ml-2" size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/register")}
              className="text-blue-400 text-sm flex items-center justify-center gap-2 w-full"
            >
              <UserPlus size={16} />
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
