import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getDesignSettings } from "../services/design";

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

import {
  solicitarPermissaoDeNotificacao,
  ouvirMensagensEmPrimeiroPlano,
} from "../services/notificationService";

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    async function validateToken() {
      try {
        // 1. Verifica se a sessão/token existe no localStorage antes de chamar a API
        const token = localStorage.getItem("token");
        const tokenExpiration = localStorage.getItem("token_expiration");

        if (!token) {
          console.log("Nenhum token encontrado. Redirecionando...");
          navigate("/");
          return;
        }

        // 2. Se o seu app salva a data de expiração no client, valida aqui
        if (tokenExpiration && Date.now() > Number(tokenExpiration)) {
          console.log("O link/token de acesso expirou!");
          localStorage.removeItem("token");
          localStorage.removeItem("token_expiration");
          navigate("/");
          return;
        }

        // 3. Valida a empresa e o token no backend
        const data = await getDesignSettings();
        console.log("Empresa validada:", data);

        // ATIVAÇÃO E SALVAMENTO DAS NOTIFICAÇÕES
        const fcmToken = await solicitarPermissaoDeNotificacao();
        ouvirMensagensEmPrimeiroPlano();

        if (fcmToken && slug) {
          try {
            await apiFetch(`/companies/${slug}/save-fcm-token`, {
              method: "POST",
              body: JSON.stringify({ token: fcmToken }),
            });
            console.log("Token FCM enviado e salvo no banco de dados.");
          } catch (apiError) {
            console.error("Erro ao salvar o token FCM no backend:", apiError);
          }
        }
      } catch (error) {
        // 4. Se o backend responder com erro, limpa o lixo e manda pro login
        console.log("Sessão inválida ou link expirado:", error);
        localStorage.removeItem("token");
        if (localStorage.getItem("token_expiration")) {
          localStorage.removeItem("token_expiration");
        }
        navigate("/");
      }
    }

    validateToken();
  }, [navigate, slug]);

  const cards = [
    {
      title: "Agendamentos",
      description: "Controle seus horários e serviços agendados",
      icon: ReceiptText,
      path: `/admin/${slug}/agendamentos`,
    },
    {
      title: "Histórico de vendas",
      description: "Gerencie seu histórico de vendas de produtos",
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
