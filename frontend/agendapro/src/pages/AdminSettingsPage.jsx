import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Settings,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  Unlink,
} from "lucide-react";

import { apiFetch } from "../services/api";

export default function AdminSettingsPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const [connected, setConnected] = useState(false);

  // =====================================================
  // CARREGAR STATUS
  // =====================================================
  const loadStatus = async () => {
    try {
      setLoading(true);

      const data = await apiFetch("/mercadopago/status", {
        auth: true,
      });

      setConnected(Boolean(data.connected));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // =====================================================
  // CONECTAR
  // =====================================================
  const handleConnect = async () => {
    try {
      setConnecting(true);

      const data = await apiFetch("/mercadopago/connect", {
        auth: true,
        params: {
          slug, // 👈 envia o slug
        },
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert(error?.message || "Erro ao conectar Mercado Pago");
    } finally {
      setConnecting(false);
    }
  };

  // =====================================================
  // DESCONECTAR
  // =====================================================
  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      "Deseja desconectar sua conta Mercado Pago?"
    );

    if (!confirmed) return;

    try {
      await apiFetch("/mercadopago/disconnect", {
        method: "DELETE",
        auth: true,
      });

      setConnected(false);
    } catch (error) {
      alert(error?.message || "Erro ao desconectar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* HEADER */}
        <div className="mb-10">
          <p className="text-blue-400 font-semibold mb-2">Configurações</p>

          <h1 className="text-4xl font-black">Integrações da Empresa</h1>
        </div>

        {/* MERCADO PAGO */}
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={28} className="text-blue-400" />

                <h2 className="text-2xl font-bold">Mercado Pago</h2>
              </div>

              <p className="text-slate-400 max-w-xl">
                Conecte sua conta Mercado Pago para receber pagamentos dos
                produtos vendidos na sua loja.
              </p>

              <div className="mt-6 space-y-2 text-sm">
                <div className="text-green-400">✓ Recebimento de produtos</div>

                <div className="text-slate-500">
                  • Serviços continuam independentes
                </div>

                <div className="text-slate-500">
                  • Agendamentos não dependem desta integração
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div>
              {connected ? (
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <CheckCircle2 size={20} />
                  Conectado
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <XCircle size={20} />
                  Não conectado
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="
                  flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  bg-red-500/15
                  text-red-400
                  hover:bg-red-500/25
                  transition
                "
              >
                <Unlink size={18} />
                Desconectar Mercado Pago
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="
                  flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  bg-blue-600
                  hover:bg-blue-500
                  transition
                  font-semibold
                "
              >
                {connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 size={18} />
                    Conectar Mercado Pago
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ASSINATURA */}
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={24} className="text-blue-400" />

            <h2 className="text-2xl font-bold">Assinatura</h2>
          </div>

          <p className="text-slate-400">
            Em breve você poderá gerenciar plano, cobrança e histórico de
            pagamentos por esta tela.
          </p>
        </div>
      </div>
    </div>
  );
}
