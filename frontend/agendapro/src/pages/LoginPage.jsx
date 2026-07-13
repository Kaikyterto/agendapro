import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, UserPlus, Mail, Lock } from "lucide-react";
import { loginService } from "../services/auth";

import AppLogo from "../assets/logo-kromis-transparente.png";

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

    if (!email || !password) {
      return setError("Preencha todos os campos.");
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. LIMPEZA PREVENTIVA: Remove dados antigos para não contaminar os Headers
      localStorage.removeItem("@AgendaPro:token");
      localStorage.removeItem("@AgendaPro:payment_pending");

      const data = await loginService({ email, password });

      // ========================================================
      // PAGAMENTO PENDENTE
      // ========================================================
      if (data?.payment_pending || data?.payment) {
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

      // ========================================================
      // SALVAR LOGIN COM SUCESSO
      // ========================================================
      localStorage.setItem("@AgendaPro:token", data.access_token);
      localStorage.setItem("@AgendaPro:user", JSON.stringify(data.user));

      const slug = data?.company?.slug || data?.user?.company?.slug || null;

      if (slug) {
        navigate(`/admin/${slug}`);
      } else {
        navigate("/admin");
      }
    } catch (err) {
      console.error("Erro capturado no Login:", err);
      setError(err?.msg || err?.message || "E-mail ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[400px] relative">
        <div className="text-center mb-10 flex flex-col items-center">
          <img
            src={AppLogo}
            alt="AgendaPro Logo"
            className="w-[120px] h-[120px] mb-8"
          />
          <h1 className="text-2xl font-black text-white tracking-tight">
            Agenda<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Gestão inteligente para seus horários
          </p>
        </div>

        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl">
          {successMessage && (
            <div className="mb-5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  placeholder="nome@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Senha</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? "Entrando..." : "Entrar"}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-slate-500 text-sm mb-4">Ainda não tem conta?</p>
            <button
              onClick={() => navigate("/register")}
              className="w-full border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Assine já
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
