import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import {
  CalendarDays,
  Check,
  X,
  Clock,
  Search,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";

import { apiFetch } from "../services/api";
import Button from "../components/Button";

const AdminBookingPage = () => {
  const { slug } = useParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados dos Filtros Organizados
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [orderDirection, setOrderDirection] = useState("desc");

  const [actionLoading, setActionLoading] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);

  // Envolver loadAppointments em useCallback para evitar loops no useEffect
  const loadAppointments = useCallback(
    async (isBackground = false) => {
      if (!slug) return;
      try {
        if (!isBackground) setLoading(true);

        const data = await apiFetch(
          `/appointments?slug=${encodeURIComponent(slug)}`,
          {
            method: "GET",
            auth: true,
          }
        );

        // Garante uma nova referência de array estruturada
        setAppointments(Array.isArray(data) ? [...data] : []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar agendamentos");
        setAppointments([]);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [slug]
  );

  // POLLING AUTOMÁTICO Corrigido
  useEffect(() => {
    if (!slug) return;

    // Carregamento inicial
    loadAppointments(false);

    const interval = setInterval(() => {
      loadAppointments(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [slug, loadAppointments]);

  // ACTIONS
  const handleFinish = async (id) => {
    try {
      setActionLoading(id);

      await apiFetch(`/appointments/${id}/finish`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "finished" } : a))
      );
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao finalizar agendamento");
    } finally {
      setActionLoading(null);
    }
  };

  const promptCancel = (id) => {
    setCancelModalId(id);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;

    const id = cancelModalId;
    try {
      setActionLoading(id);
      await apiFetch(`/appointments/${id}/cancel`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
      setCancelModalId(null);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro ao cancelar agendamento");
    } finally {
      setActionLoading(null);
    }
  };

  // EXTRACT WORKERS
  const workersList = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      if (a.worker?.id && a.worker?.name) {
        map.set(String(a.worker.id), a.worker.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  // FILTER & SORT (Garante isolamento completo do array de estado original)
  const filtered = useMemo(() => {
    const filteredArray = appointments.filter((a) => {
      const matchesSearch = a.customer_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : a.status === statusFilter;

      const matchesWorker =
        workerFilter === "all" ? true : String(a.worker?.id) === workerFilter;

      let matchesDate = true;
      if (dateFilter && a.start) {
        const appointmentDate = new Date(a.start).toISOString().split("T")[0];
        matchesDate = appointmentDate === dateFilter;
      }

      return matchesSearch && matchesStatus && matchesWorker && matchesDate;
    });

    return filteredArray.sort((a, b) => {
      if (!a.start) return 1;
      if (!b.start) return -1;

      const dateA = new Date(a.start).getTime();
      const dateB = new Date(b.start).getTime();

      return orderDirection === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [
    appointments,
    search,
    statusFilter,
    workerFilter,
    dateFilter,
    orderDirection,
  ]);

  // STATS
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      finished: appointments.filter((a) => a.status === "finished").length,
      pending: appointments.filter((a) => a.status === "pending").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin text-violet-400" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10 shrink-0">
              <CalendarDays size={30} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Agendamentos
              </h1>
              <p className="text-white/50 mt-1 text-sm">
                Gerencie os horários da sua empresa (atualizado em tempo real)
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* STATS RESPONSIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={CalendarDays}
            color="violet"
          />

          <StatCard
            title="Pendentes"
            value={stats.pending}
            icon={CalendarClock}
            color="yellow"
          />

          <StatCard
            title="Finalizados"
            value={stats.finished}
            icon={CheckCircle2}
            color="green"
          />

          <StatCard
            title="Cancelados"
            value={stats.cancelled}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* PAINEL DE FILTROS ORGANIZADO */}
        <div className="bg-[#111827] border border-white/5 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl px-4 h-13">
            <Search size={18} className="text-violet-300 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do cliente..."
              className="bg-transparent outline-none w-full text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1">
                Filtrar por Status
              </label>
              <div className="bg-black/20 border border-white/10 rounded-xl px-3 h-11 flex items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent outline-none w-full text-white text-xs cursor-pointer"
                >
                  <option value="all" className="bg-[#111827]">
                    Todos os status
                  </option>
                  <option value="pending" className="bg-[#111827]">
                    Pendentes
                  </option>
                  <option value="finished" className="bg-[#111827]">
                    Finalizados
                  </option>
                  <option value="cancelled" className="bg-[#111827]">
                    Cancelados
                  </option>
                </select>
              </div>
            </div>

            {/* Profissional */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1">
                Filtrar por Profissional
              </label>
              <div className="bg-black/20 border border-white/10 rounded-xl px-3 h-11 flex items-center">
                <select
                  value={workerFilter}
                  onChange={(e) => setWorkerFilter(e.target.value)}
                  className="bg-transparent outline-none w-full text-white text-xs cursor-pointer"
                >
                  <option value="all" className="bg-[#111827]">
                    Todos os profissionais
                  </option>
                  {workersList.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#111827]">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Especifica */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1">
                Data do Agendamento
              </label>
              <div className="bg-black/20 border border-white/10 rounded-xl px-3 h-11 flex items-center">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent outline-none w-full text-white text-xs cursor-pointer invert-calendar-icon"
                />
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold px-1">
                Ordem Cronológica
              </label>
              <div className="bg-black/20 border border-white/10 rounded-xl px-3 h-11 flex items-center">
                <select
                  value={orderDirection}
                  onChange={(e) => setOrderDirection(e.target.value)}
                  className="bg-transparent outline-none w-full text-white text-xs cursor-pointer"
                >
                  <option value="desc" className="bg-[#111827]">
                    Mais recentes primeiro
                  </option>
                  <option value="asc" className="bg-[#111827]">
                    Mais antigos primeiro
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE (DESKTOP) */}
        <div className="hidden lg:block overflow-hidden rounded-[32px] border border-violet-500/10 bg-[#111827] shadow-xl shadow-black/20">
          <div className="grid grid-cols-5 px-6 py-5 border-b border-white/10 text-white/50 text-sm font-semibold">
            <div>Cliente</div>
            <div>Serviço</div>
            <div>Profissional</div>
            <div>Data</div>
            <div>Status</div>
          </div>

          {filtered.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/[0.03] transition-all items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <User size={18} className="text-violet-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{a.customer_name}</p>
                  <p className="text-xs text-white/40 truncate">{a.phone}</p>
                </div>
              </div>

              <div className="text-white/70 truncate">
                {a.service?.name || "Sem serviço"}
              </div>
              <div className="text-white/60 font-medium truncate">
                {a.worker?.name || "Não definido"}
              </div>

              <div className="text-sm text-white/60 flex items-center gap-2 whitespace-nowrap">
                <Clock size={15} className="shrink-0" />
                {a.start
                  ? new Date(a.start).toLocaleString("pt-BR")
                  : "Sem data"}
              </div>

              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={a.status} />

                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => handleFinish(a.id)}
                      disabled={actionLoading === a.id}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 h-11 px-4 rounded-2xl justify-center"
                    >
                      {actionLoading === a.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </Button>

                    <Button
                      onClick={() => promptCancel(a.id)}
                      disabled={actionLoading === a.id}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 h-11 px-4 rounded-2xl justify-center"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-10 text-center text-white/40">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>

        {/* MOBILE */}
        <div className="lg:hidden space-y-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-[24px] sm:rounded-[28px] border border-violet-500/10 bg-[#111827] p-5 shadow-xl shadow-black/20"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <User size={18} className="text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">
                      {a.customer_name}
                    </h3>
                    <p className="text-xs text-white/40 truncate">{a.phone}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={a.status} />
                </div>
              </div>

              <div className="space-y-2 mb-5 bg-black/10 p-3 rounded-2xl border border-white/5">
                <p className="text-white/70 text-sm truncate">
                  <span className="text-white/40 text-xs font-semibold uppercase block mb-0.5">
                    Serviço
                  </span>
                  {a.service?.name || "Sem serviço"}
                </p>
                <p className="text-white/60 text-sm truncate">
                  <span className="text-white/40 text-xs font-semibold uppercase block mb-0.5">
                    Profissional
                  </span>
                  {a.worker?.name || "Não definido"}
                </p>
                <div className="text-white/50 text-sm pt-1 border-t border-white/5 mt-1">
                  <span className="text-white/40 text-xs font-semibold uppercase block mb-1">
                    Horário
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-violet-400" />
                    {a.start
                      ? new Date(a.start).toLocaleString("pt-BR")
                      : "Sem data"}
                  </div>
                </div>
              </div>

              {a.status === "pending" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleFinish(a.id)}
                    disabled={actionLoading === a.id}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 h-12 rounded-xl justify-center"
                  >
                    {actionLoading === a.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                  </Button>

                  <Button
                    onClick={() => promptCancel(a.id)}
                    disabled={actionLoading === a.id}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 h-12 rounded-xl justify-center"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center text-white/40 py-10 text-sm">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Cancelar Agendamento
            </h3>
            <p className="text-white/60 text-sm">
              Deseja realmente cancelar este agendamento? Esta ação não poderá
              ser desfeita.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setCancelModalId(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 rounded-xl justify-center"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={actionLoading === cancelModalId}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 h-11 rounded-xl justify-center"
              >
                {actionLoading === cancelModalId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Sim, cancelar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const styles = {
    violet:
      "from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 text-violet-300",
    yellow:
      "from-yellow-500/10 to-amber-500/10 border-yellow-500/20 text-yellow-300",
    green:
      "from-emerald-500/10 to-green-500/10 border-emerald-500/20 text-emerald-300",
    red: "from-red-500/10 to-rose-500/10 border-red-500/20 text-red-300",
  };

  return (
    <div
      className={`rounded-[24px] sm:rounded-[28px] border bg-gradient-to-br p-5 shadow-xl shadow-black/20 ${styles[color]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm opacity-70 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black mt-2 text-white truncate">
            {value}
          </h3>
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center shrink-0">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const labels = {
    pending: "Pendente",
    finished: "Finalizado",
    cancelled: "Cancelado",
  };
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
    finished: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-300 border border-red-500/20",
  };

  return (
    <span
      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border whitespace-nowrap inline-block ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default AdminBookingPage;
