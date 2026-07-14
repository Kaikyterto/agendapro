import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, ShoppingBag } from "lucide-react";

import { getCompanyBySlug } from "../services/companyService";
import Button from "../components/Button";
import Nav from "../components/Nav";

import { setupPWA } from "../utils/pwa";

const HomePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (!slug || slug === "admin") return;

        const data = await getCompanyBySlug(slug);

        setCompany(data || null);

        if (data) {
          setupPWA(data);
        }

        if (data?.colors) {
          document.documentElement.style.setProperty(
            "--primary",
            data.colors.primary
          );
          document.documentElement.style.setProperty(
            "--accent",
            data.colors.secondary
          );
        }
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d]">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  // =====================================================
  // ERRO / NÃO ENCONTRADO
  // =====================================================
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#07090d]">
        Empresa não encontrada
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#07090d] relative overflow-hidden flex flex-col">
      {/* Background Aurora-like Gradients */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none mix-blend-screen"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, var(--primary) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, var(--accent) 0%, transparent 45%)
          `,
        }}
      />

      <Nav logo={company?.logo} />

      <main className="relative z-10 max-w-7xl mx-auto px-6 flex-1 flex items-center w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full py-12">
          {/* LEFT COLUMN - TEXTS & ACTIONS (Ocupa 7 colunas no desktop) */}
          <div className="lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6 bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              {company?.name}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-white/50 mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0">
              {company?.about ||
                "Bem-vindo à nossa plataforma de agendamentos e produtos."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start max-w-md mx-auto lg:max-w-none">
              <Button
                icon={Calendar}
                className="h-14 sm:h-16 px-8 text-base sm:text-lg font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "var(--primary)" }}
                onClick={() => navigate(`/${slug}/agendar`)}
              >
                Agendar Serviço
              </Button>

              <Button
                icon={ShoppingBag}
                className="h-14 sm:h-16 px-8 text-base sm:text-lg font-bold border border-white/10 bg-white/5 backdrop-blur-md transition-transform hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate(`/${slug}/produtos`)}
              >
                Ver Produtos
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN - HERO LOGO SHOWCASE (Ocupa 5 colunas no desktop) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square flex items-center justify-center group">
              {/* Glow Dinâmico de Fundo */}
              <div
                className="absolute inset-0 blur-[80px] opacity-35 group-hover:opacity-50 transition-opacity duration-700 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />

              {/* Moldura Premium com efeito Glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent border border-white/[0.08] backdrop-blur-xl rounded-[40px] sm:rounded-[48px] shadow-2xl p-8 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-[1.02]">
                {/* Container Interno da Logo */}
                <div className="w-full h-full flex items-center justify-center">
                  {company?.logo ? (
                    <img
                      src={company.logo}
                      alt={`Logo ${company?.name}`}
                      className="max-w-full max-h-full object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transform transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    // Caso a empresa não tenha logo configurada, exibe uma inicial estilizada elegante
                    <div
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, var(--primary), var(--accent))`,
                        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
                      }}
                    >
                      {company?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
