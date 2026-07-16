import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerService } from "../services/auth";
import { uploadImage } from "../services/upload";

import {
  ArrowRight,
  LogIn,
  Mail,
  Lock,
  User,
  Building2,
  XCircle,
} from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logoFile: null,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Crie sua conta | Kromis";
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ========================================================
  // SUBMIT: CRIA CONTA E REDIRECIONA PARA TELA DE PAGAMENTO
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
      return setError("Preencha todos os campos da conta.");
    }

    if (formData.password.length < 6) {
      return setError("A senha deve possuir no mínimo 6 caracteres.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    try {
      setIsLoading(true);

      // 1. Upload da logo (se houver)
      let uploadedLogoUrl = "";
      if (formData.logoFile) {
        const uploadResult = await uploadImage(formData.logoFile, "logos");
        uploadedLogoUrl = uploadResult?.url || uploadResult;
      }

      // 2. Registra o usuário no backend
      // IMPORTANTE: Ajuste os parâmetros de envio conforme a assinatura da sua api/auth.js
      const responseData = await registerService({
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        logo: uploadedLogoUrl,
      });

      // Se a resposta retornar a empresa criada com sucesso
      if (responseData?.company) {
        // Salvamos temporariamente os dados da empresa para uso na tela de pagamento
        localStorage.setItem(
          "@AgendaPro:company",
          JSON.stringify(responseData.company)
        );

        // Redireciona para a página de pagamento para o usuário escolher o método (PIX ou Cartão)
        navigate("/payment", {
          state: {
            company: responseData.company,
            payment: responseData.payment || null, // Se sua API já gerar um PIX pendente no registro
          },
        });
      } else {
        throw new Error("Erro ao identificar dados da empresa registrada.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden transform-gpu">
      {/* GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[480px] relative">
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Assine por apenas <span className="text-blue-500">29,90</span>
          </h1>

          <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
            Crie sua conta em segundos e escolha na próxima tela o método de
            pagamento ideal para você (PIX ou Cartão).
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-7 rounded-3xl shadow-2xl transition-all duration-300">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Building2 size={20} className="text-slate-500" />
            Dados da sua Conta
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* NAME */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">
                Seu nome completo
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* COMPANY & LOGO */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">
                Nome da empresa
              </label>
              <div className="relative mb-3">
                <Building2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="Studio Beauty"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <label className="group relative flex flex-col items-center justify-center w-full min-h-[90px] border border-dashed border-white/[0.1] hover:border-blue-500/50 bg-[#0f1115]/50 hover:bg-blue-500/[0.02] rounded-xl p-3.5 cursor-pointer transition-all text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      logoFile: e.target.files?.[0] || null,
                    }))
                  }
                />
                {formData.logoFile ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Building2 size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white max-w-[280px] truncate">
                        {formData.logoFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Clique para alterar a logo
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full group-hover:bg-blue-500/20 transition-all">
                      + Adicionar Logo
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Formatos aceitos: PNG, JPG ou SVG
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">
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
                  required
                  placeholder="nome@empresa.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </p>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? "Criando Conta..." : "Criar Conta & Ver Pagamento"}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] text-center transform-gpu">
            <p className="text-slate-500 text-sm mb-3.5 leading-relaxed max-w-xs mx-auto">
              Já possui uma conta configurada na Kromis?
            </p>

            <button
              onClick={() => navigate("/")}
              className="w-full border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <LogIn size={18} />
              Fazer login agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
