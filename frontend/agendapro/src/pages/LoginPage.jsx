import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { ArrowRight, KeyRound, UserPlus } from "lucide-react";

import { loginService } from "../services/auth";

const LoginPage = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const successMessage = location.state?.success;

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  // ========================================================
  // LOGIN
  // ========================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    setError("");

    try {
      const data = await loginService({
        email,
        password,
      });

      // ====================================================
      // PAGAMENTO PENDENTE
      // ====================================================
      if (data?.payment_pending) {
        navigate("/payment", {
          state: {
            payment: data.payment,
            company: data.company,
          },
        });

        return;
      }

      // ====================================================
      // LOGIN NORMAL
      // ====================================================
      localStorage.setItem("@AgendaPro:token", data.access_token);

      localStorage.setItem("@AgendaPro:user", JSON.stringify(data.user));

      navigate("/home");
    } catch (err) {
      console.error(err);

      // ====================================================
      // PAGAMENTO PENDENTE
      // ====================================================
      if (err?.payment_pending) {
        navigate("/payment", {
          state: {
            payment: err.payment,
            company: err.company,
          },
        });

        return;
      }

      // ====================================================
      // ERROR MESSAGE
      // ====================================================
      setError(err?.msg || err?.message || "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden">
      {/* ================================================= */}
      {/* GLOW BACKGROUND */}
      {/* ================================================= */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[400px] relative">
        {/* =============================================== */}
        {/* HEADER */}
        {/* =============================================== */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Agenda
            <span className="text-blue-500">Pro</span>
          </h1>

          <p className="text-slate-500 text-sm mt-2 text-center">
            Gestão inteligente para seus horários
          </p>
        </div>

        {/* =============================================== */}
        {/* CARD */}
        {/* =============================================== */}
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl">
          {/* ============================================= */}
          {/* SUCCESS */}
          {/* ============================================= */}
          {successMessage && (
            <div className="mb-5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* =========================================== */}
            {/* EMAIL */}
            {/* =========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                E-mail
              </label>

              <input
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* =========================================== */}
            {/* PASSWORD */}
            {/* =========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Senha</label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* =========================================== */}
            {/* FORGOT PASSWORD */}
            {/* =========================================== */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                <KeyRound size={16} />
                Esqueceu a senha?
              </button>
            </div>

            {/* =========================================== */}
            {/* ERROR */}
            {/* =========================================== */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            {/* =========================================== */}
            {/* LOGIN BUTTON */}
            {/* =========================================== */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ============================================= */}
          {/* REGISTER */}
          {/* ============================================= */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-slate-500 text-sm mb-4">
              Ainda não possui conta?
            </p>

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
