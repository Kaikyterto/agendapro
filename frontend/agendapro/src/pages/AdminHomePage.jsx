import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ShoppingBag,
  Palette,
  ArrowRight,
  Users,
  BarChart3,
} from "lucide-react";

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const cards = [
    {
      title: "Agendamentos",
      description: "Gerencie horários, clientes e serviços agendados.",
      icon: CalendarDays,
      path: `/admin/${slug}/agendamentos`,
    },
    {
      title: "Funcionários",
      description: "Cadastre funcionários e vincule serviços disponíveis.",
      icon: Users,
      path: `/admin/${slug}/funcionarios`,
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
  ];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-14">
          <p className="text-blue-400 font-semibold mb-3">
            Painel administrativo
          </p>

          <h1 className="text-5xl font-black mb-4">Gerencie sua empresa</h1>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group bg-[#16191f]/80 border border-white/10 rounded-3xl p-8 text-left hover:scale-[1.02] transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Icon size={26} className="text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold mb-2">{card.title}</h2>

                <p className="text-slate-400 mb-6">{card.description}</p>

                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  Acessar <ArrowRight size={18} />
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
