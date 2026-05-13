import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ShoppingBag, Palette, ArrowRight } from "lucide-react";

const cards = [
  {
    title: "Agendamentos",
    description: "Gerencie horários, clientes e serviços agendados.",
    icon: CalendarDays,
    path: "/admin/agendamentos",
  },
  {
    title: "Produtos",
    description: "Cadastre, edite e organize os produtos da sua empresa.",
    icon: ShoppingBag,
    path: "/admin/produtos",
  },
  {
    title: "Design",
    description: "Personalize cores, logo, aparência e identidade visual.",
    icon: Palette,
    path: "/admin/design",
  },
];

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-700/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-14">
          <p className="text-blue-400 font-semibold mb-3">
            Painel administrativo
          </p>

          <h1 className="text-5xl font-black tracking-tight mb-4">
            Gerencie sua empresa
          </h1>

          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            Controle agendamentos, produtos e personalize a aparência da sua
            plataforma em um só lugar.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group relative overflow-hidden bg-[#16191f]/80 border border-white/[0.06] hover:border-blue-500/30 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] hover:bg-[#1b1f27]"
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Icon size={30} className="text-blue-400" />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold mb-3">{card.title}</h2>

                <p className="text-slate-400 leading-relaxed mb-8">
                  {card.description}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  Acessar
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 bg-gradient-to-r from-blue-600/15 to-indigo-600/10 border border-blue-500/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-3">
            Seu espaço, sua identidade
          </h3>

          <p className="text-slate-400 max-w-3xl leading-relaxed">
            Personalize sua plataforma com as cores da sua marca, configure sua
            logo, organize seus produtos e acompanhe seus agendamentos em tempo
            real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
