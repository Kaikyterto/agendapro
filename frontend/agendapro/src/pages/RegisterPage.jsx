import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerService } from "../services/auth";

import { ArrowRight, LogIn, Mail, Lock, User, Building2 } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ========================================================
  // REGISTER
  // ========================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.name ||
      !formData.companyName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return setError("Preencha todos os campos.");
    }

    if (formData.password.length < 6) {
      return setError("A senha deve possuir no mínimo 6 caracteres.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    try {
      setIsLoading(true);

      const data = await registerService({
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
      });

      navigate("/payment", {
        state: {
          payment: data.payment,
          company: data.company,
        },
      });
    } catch (err) {
      console.error(err);

      setError(err.message || "Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden">
      {/* ================================================ */}
      {/* GLOW */}
      {/* ================================================ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[460px] relative">
        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Assine <span className="text-blue-500">já</span>
          </h1>

          <p className="text-slate-500 text-sm mt-2 text-center max-w-sm leading-relaxed">
            Configure seu espaço no AgendaPro e personalize sua marca depois do
            cadastro.
          </p>
        </div>

        {/* ============================================== */}
        {/* CARD */}
        {/* ============================================== */}
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl">
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* ========================================== */}
            {/* NAME */}
            {/* ========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Seu nome
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  name="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* COMPANY */}
            {/* ========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Nome da empresa
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  name="companyName"
                  placeholder="Studio Beauty"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* EMAIL */}
            {/* ========================================== */}
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
                  name="email"
                  placeholder="nome@empresa.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* PASSWORD */}
            {/* ========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Senha</label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* CONFIRM PASSWORD */}
            {/* ========================================== */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Confirmar senha
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* ERROR */}
            {/* ========================================== */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            {/* ========================================== */}
            {/* SUBMIT */}
            {/* ========================================== */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Criando empresa..."
              ) : (
                <>
                  Continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ============================================ */}
          {/* FOOTER */}
          {/* ============================================ */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-slate-500 text-sm mb-4">Já possui uma conta?</p>

            <button
              onClick={() => navigate("/")}
              className="w-full border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
