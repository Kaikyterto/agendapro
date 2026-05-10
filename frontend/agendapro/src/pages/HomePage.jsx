import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, ShoppingBag } from "lucide-react";

import { getCompanyBySlug } from "../services/companyService";
import Button from "../components/Button";
import Nav from "../components/Nav";

const HomePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await getCompanyBySlug(slug);
        setCompany(data);

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
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadCompany();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d]">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#07090d] relative overflow-hidden">
      {/* Background Dinâmico - Efeito de iluminação baseado nas cores da empresa */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, var(--primary) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, var(--accent) 0%, transparent 40%)
          `,
        }}
      />

      <Nav logo={company.logo}></Nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full py-12">
          {/* LADO ESQUERDO: TEXTOS E BOTÕES */}
          <div className="text-center lg:text-left">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
              {company?.name || "Carregando..."}
            </h1>

            <p className="text-lg lg:text-xl text-white/60 mb-10 max-w-lg leading-relaxed">
              {company?.about ||
                "Bem-vindo à nossa plataforma de agendamentos e produtos exclusivos."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Botão de Agendamento */}
              <Button
                icon={Calendar}
                className="h-16 px-8 text-lg font-bold transition-transform hover:scale-105"
                style={{ backgroundColor: "var(--primary)" }}
                onClick={() => navigate(`/${slug}/agendar`)}
              >
                Agendar Serviço
              </Button>

              {/* Botão de Loja */}
              <Button
                icon={ShoppingBag}
                className="h-16 px-8 text-lg font-bold border-2 border-white/10 backdrop-blur-md hover:bg-white/5 transition-transform hover:scale-105"
                onClick={() => navigate(`/${slug}/produtos`)}
              >
                Ver Produtos
              </Button>
            </div>
          </div>

          {/* LADO DIREITO: LOGO COM EFEITO GLASSMORPHISM */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              {/* Brilho atrás da logo */}
              <div
                className="absolute inset-0 blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity"
                style={{ backgroundColor: "var(--primary)" }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
