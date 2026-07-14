import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getDesignSettings } from "../services/designService";

import {
  ShoppingBag,
  Palette,
  ArrowRight,
  Users,
  BarChart3,
  Settings,
  Briefcase,
  ReceiptText,
} from "lucide-react";

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    async function validateToken() {
      try {
        const data = await getDesignSettings();

        console.log("Empresa validada:", data);
      } catch (error) {
        console.log("Sessão inválida:", error);

        navigate("/");
      }
    }

    validateToken();
  }, [navigate]);

  const cards = [
    {
      title: "Agendamentos",
      description: "Controle seus horários e serviços agendados",
      icon: ReceiptText,
      path: `/admin/${slug}/agendamentos`,
    },
    {
      title: "Histórico de vendas",
      description: "Gerencie seu hisórico de vendas de produtos",
      icon: ReceiptText,
      path: `/admin/${slug}/historico`,
    },

    {
      title: "Funcionários",
      description: "Cadastre funcionários e vincule serviços disponíveis.",
      icon: Users,
      path: `/admin/${slug}/funcionarios`,
    },

    {
      title: "Serviços",
      description: "Gerencie serviços, preços, duração e imagens.",
      icon: Briefcase,
      path: `/admin/${slug}/servicos`,
    },

    {
      title: "Produtos",
      description: "Cadastre, edite e organize os produtos da sua empresa.",
      icon: ShoppingBag,
      path: `/admin/${slug}/produtos`,
    },

    {
      title: "Vendas & Insights",
      description: "Acompanhe vendas, faturamento e métricas da empresa.",
      icon: BarChart3,
      path: `/admin/${slug}/vendas`,
    },

    {
      title: "Design",
      description: "Personalize cores, logo, aparência e identidade visual.",
      icon: Palette,
      path: `/admin/${slug}/design`,
    },

    {
      title: "Configurações",
      description:
        "Gerencie assinatura, integrações, Mercado Pago e dados da empresa.",
      icon: Settings,
      path: `/admin/${slug}/configuracoes`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 blur-[140px] rounded-full pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* HEADER */}
        <div className="mb-14">
          <p className="text-blue-400 font-semibold mb-3">
            Painel administrativo
          </p>

          <h1 className="text-5xl font-black mb-4">Gerencie sua empresa</h1>

          <p className="text-slate-400 max-w-2xl text-lg">
            Controle serviços, produtos, equipe, vendas, personalização e
            integrações da sua empresa em um único lugar.
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="
                  group
                  bg-[#16191f]/80
                  backdrop-blur-xl
                  border
                  border-white/10
                  rounded-3xl
                  p-8
                  text-left
                  transition-all
                  hover:border-blue-500/30
                  hover:bg-[#1b1f27]
                  hover:scale-[1.02]
                  hover:shadow-2xl
                  hover:shadow-blue-500/10
                "
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 transition-all group-hover:bg-blue-500/20">
                  <Icon size={26} className="text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold mb-2">{card.title}</h2>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  {card.description}
                </p>

                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  Acessar
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
