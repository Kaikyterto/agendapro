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
  Phone,
  Plus,
  Trash2,
} from "lucide-react";

import { apiFetch } from "../services/api";
import {
  getCompanyPhones,
  createCompanyPhone,
  deleteCompanyPhone,
} from "../services/company_phone";

export default function AdminSettingsPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Estados para Telefones
  const [phones, setPhones] = useState([]);
  const [newPhone, setNewPhone] = useState({ number: "", owner: "" });

  // =====================================================
  // CARREGAR DADOS
  // =====================================================
  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar status do Mercado Pago
      const mpData = await apiFetch("/mercadopago/status", { auth: true });
      setConnected(Boolean(mpData.connected));

      // Carregar telefones
      const phonesData = await getCompanyPhones();
      setPhones(phonesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // GERENCIAMENTO DE TELEFONES
  // =====================================================
  const handleAddPhone = async () => {
    if (!newPhone.number || !newPhone.owner)
      return alert("Preencha todos os campos");

    try {
      await createCompanyPhone(newPhone);
      setNewPhone({ number: "", owner: "" });
      await loadData();
    } catch (error) {
      alert("Erro ao adicionar telefone");
    }
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm("Deseja remover este telefone?")) return;

    try {
      await deleteCompanyPhone(id);
      await loadData();
    } catch (error) {
      alert("Erro ao remover telefone");
    }
  };

  // =====================================================
  // MERCADO PAGO
  // =====================================================
  const handleConnect = async () => {
    try {
      setConnecting(true);
      const data = await apiFetch("/mercadopago/connect", {
        auth: true,
        params: { slug },
      });
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      alert(error?.message || "Erro ao conectar Mercado Pago");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Deseja desconectar sua conta Mercado Pago?")) return;

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

        {/* TELEFONES DA EMPRESA */}
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Phone size={28} className="text-blue-400" />
            <h2 className="text-2xl font-bold">Telefones</h2>
          </div>

          <div className="flex gap-3 mb-6">
            <input
              placeholder="Número (Ex: 81999999999)"
              className="bg-black/20 p-3 rounded-xl border border-white/10 flex-1 outline-none focus:border-blue-500"
              value={newPhone.number}
              onChange={(e) =>
                setNewPhone({ ...newPhone, number: e.target.value })
              }
            />
            <input
              placeholder="Proprietário (Ex: WhatsApp)"
              className="bg-black/20 p-3 rounded-xl border border-white/10 flex-1 outline-none focus:border-blue-500"
              value={newPhone.owner}
              onChange={(e) =>
                setNewPhone({ ...newPhone, owner: e.target.value })
              }
            />
            <button
              onClick={handleAddPhone}
              className="bg-blue-600 hover:bg-blue-500 p-3 px-5 rounded-xl transition font-semibold"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {phones.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5"
              >
                <div>
                  <span className="text-slate-400 text-sm block">
                    {p.owner}
                  </span>
                  <span className="font-mono text-lg">{p.number}</span>
                </div>
                <button
                  onClick={() => handleDeletePhone(p.id)}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
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
                produtos.
              </p>
            </div>

            <div>
              {connected ? (
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <CheckCircle2 size={20} /> Conectado
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <XCircle size={20} /> Não conectado
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition"
              >
                <Unlink size={18} /> Desconectar Mercado Pago
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
              >
                {connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Conectando...
                  </>
                ) : (
                  <>
                    <Link2 size={18} /> Conectar Mercado Pago
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
