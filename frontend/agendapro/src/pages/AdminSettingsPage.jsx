import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
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

  // =====================================================
  // TELEFONES
  // =====================================================
  const [phones, setPhones] = useState([]);
  const [newPhone, setNewPhone] = useState({
    number: "",
    owner: "",
  });

  // =====================================================
  // CARREGAR DADOS
  // =====================================================
  const loadData = async () => {
    try {
      setLoading(true);

      // Mercado Pago
      const mpData = await apiFetch("/mercadopago/status", {
        auth: true,
      });

      setConnected(Boolean(mpData.connected));

      // Telefones
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
  // ADICIONAR TELEFONE
  // =====================================================
  const handleAddPhone = async () => {
    if (!newPhone.number.trim() || !newPhone.owner.trim()) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await createCompanyPhone({
        number: newPhone.number.trim(),
        owner: newPhone.owner.trim(),
      });

      setNewPhone({
        number: "",
        owner: "",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao adicionar telefone:", error);
      alert("Erro ao adicionar telefone");
    }
  };

  // =====================================================
  // EXCLUIR TELEFONE
  // =====================================================
  const handleDeletePhone = async (id) => {
    if (!window.confirm("Deseja remover este telefone?")) {
      return;
    }

    try {
      await deleteCompanyPhone(id);
      await loadData();
    } catch (error) {
      console.error("Erro ao remover telefone:", error);
      alert("Erro ao remover telefone");
    }
  };

  // =====================================================
  // CONECTAR MERCADO PAGO
  // =====================================================
  const handleConnect = async () => {
    try {
      setConnecting(true);

      const data = await apiFetch("/mercadopago/connect", {
        auth: true,
        params: {
          slug,
        },
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert(
        error?.message || "Erro ao conectar Mercado Pago"
      );
    } finally {
      setConnecting(false);
    }
  };

  // =====================================================
  // DESCONECTAR MERCADO PAGO
  // =====================================================
  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Deseja desconectar sua conta Mercado Pago?"
      )
    ) {
      return;
    }

    try {
      await apiFetch("/mercadopago/disconnect", {
        method: "DELETE",
        auth: true,
      });

      setConnected(false);
    } catch (error) {
      alert(
        error?.message || "Erro ao desconectar"
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white">
        <Loader2
          size={28}
          className="animate-spin"
        />
      </div>
    );
  }

  // =====================================================
  // PÁGINA
  // =====================================================
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="mb-8 sm:mb-10">
          <p className="text-blue-400 font-semibold mb-2">
            Configurações
          </p>

          <h1 className="text-3xl sm:text-4xl font-black">
            Integrações da Empresa
          </h1>
        </div>

        {/* =====================================================
            TELEFONES DA EMPRESA
        ===================================================== */}
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-5 sm:p-8 mb-6">

          <div className="flex items-center gap-3 mb-6">
            <Phone
              size={26}
              className="text-blue-400 shrink-0"
            />

            <h2 className="text-xl sm:text-2xl font-bold">
              Telefones
            </h2>
          </div>

          {/* =====================================================
              FORMULÁRIO RESPONSIVO
          ===================================================== */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">

            {/* NÚMERO */}
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Número (Ex: 81999999999)"
              className="
                bg-black/20
                p-3
                rounded-xl
                border border-white/10
                w-full
                sm:flex-1
                min-w-0
                outline-none
                focus:border-blue-500
                transition
              "
              value={newPhone.number}
              onChange={(e) =>
                setNewPhone((prev) => ({
                  ...prev,
                  number: e.target.value,
                }))
              }
            />

            {/* PROPRIETÁRIO */}
            <input
              type="text"
              placeholder="Proprietário (Ex: WhatsApp)"
              className="
                bg-black/20
                p-3
                rounded-xl
                border border-white/10
                w-full
                sm:flex-1
                min-w-0
                outline-none
                focus:border-blue-500
                transition
              "
              value={newPhone.owner}
              onChange={(e) =>
                setNewPhone((prev) => ({
                  ...prev,
                  owner: e.target.value,
                }))
              }
            />

            {/* BOTÃO */}
            <button
              type="button"
              onClick={handleAddPhone}
              className="
                bg-blue-600
                hover:bg-blue-500
                active:bg-blue-700
                p-3
                px-5
                rounded-xl
                transition
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                w-full
                sm:w-auto
                shrink-0
              "
            >
              <Plus size={20} />

              <span className="sm:hidden">
                Adicionar
              </span>

              <span className="hidden sm:inline">
                Adicionar
              </span>
            </button>
          </div>

          {/* =====================================================
              LISTA DE TELEFONES
          ===================================================== */}
          <div className="space-y-3">

            {phones.map((p) => (
              <div
                key={p.id}
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  bg-black/30
                  p-4
                  rounded-xl
                  border border-white/5
                  min-w-0
                "
              >
                <div className="min-w-0 flex-1">

                  <span className="text-slate-400 text-sm block truncate">
                    {p.owner}
                  </span>

                  <span className="font-mono text-base sm:text-lg break-all">
                    {p.number}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDeletePhone(p.id)
                  }
                  className="
                    text-red-400
                    hover:text-red-300
                    p-2
                    shrink-0
                    rounded-lg
                    hover:bg-red-500/10
                    transition
                  "
                  aria-label={`Remover telefone ${p.number}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {phones.length === 0 && (
              <div className="text-center py-6 text-slate-500">
                Nenhum telefone cadastrado.
              </div>
            )}

          </div>
        </div>

        {/* =====================================================
            MERCADO PAGO
        ===================================================== */}
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-5 sm:p-8">

          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">

            <div className="min-w-0">

              <div className="flex items-center gap-3 mb-4">
                <CreditCard
                  size={28}
                  className="text-blue-400 shrink-0"
                />

                <h2 className="text-xl sm:text-2xl font-bold">
                  Mercado Pago
                </h2>
              </div>

              <p className="text-slate-400 max-w-xl">
                Conecte sua conta Mercado Pago para
                receber pagamentos dos produtos.
              </p>

            </div>

            <div className="shrink-0">

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

          {/* =====================================================
              AÇÕES MERCADO PAGO
          ===================================================== */}
          <div className="mt-8 border-t border-white/10 pt-8">

            {connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  bg-red-500/15
                  text-red-400
                  hover:bg-red-500/25
                  transition
                  w-full
                  sm:w-auto
                "
              >
                <Unlink size={18} />
                Desconectar Mercado Pago
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  bg-blue-600
                  hover:bg-blue-500
                  transition
                  font-semibold
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  w-full
                  sm:w-auto
                "
              >
                {connecting ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
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

      </div>
    </div>
  );
}
