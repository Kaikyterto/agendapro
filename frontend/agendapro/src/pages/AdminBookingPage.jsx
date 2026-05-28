import { useEffect, useMemo, useState } from "react";
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

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("");

  // =========================================================
  // LOAD APPOINTMENTS
  // =========================================================

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/appointments?slug=${encodeURIComponent(slug)}`,
        {
          method: "GET",
          auth: true,
        }
      );

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError("Erro ao carregar agendamentos");

      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadAppointments();
    }
  }, [slug]);

  // =========================================================
  // ACTIONS
  // =========================================================

  const handleFinish = async (id) => {
    try {
      await apiFetch(`/appointments/${id}/finish`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "finished",
              }
            : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiFetch(`/appointments/${id}/cancel`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "cancelled",
              }
            : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filtered = useMemo(() => {
    return [...appointments]
      .filter((a) => {
        const matchesSearch = a.customer_name
          ?.toLowerCase()
          .includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ? true : a.status === statusFilter;

        let matchesDate = true;

        if (dateFilter && a.start) {
          const appointmentDate = new Date(a.start).toISOString().split("T")[0];

          matchesDate = appointmentDate === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (!a.start) return 1;

        if (!b.start) return -1;

        return new Date(a.start) - new Date(b.start);
      });
  }, [appointments, search, statusFilter, dateFilter]);

  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(() => {
    return {
      total: appointments.length,

      finished: appointments.filter((a) => a.status === "finished").length,

      pending: appointments.filter((a) => a.status === "pending").length,

      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin text-violet-400" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <CalendarDays size={30} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Agendamentos
              </h1>

              <p className="text-white/50 mt-1">
                Gerencie os horários da sua empresa
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
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

        {/* SEARCH */}

        <div className="flex items-center gap-3 mb-4 bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 backdrop-blur-xl shadow-lg">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* STATUS */}

          <div className="bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 flex items-center shadow-lg">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none w-full text-white"
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

          {/* DATE */}

          <div className="bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 flex items-center shadow-lg">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent outline-none w-full text-white"
            />
          </div>
        </div>

        {/* TABLE */}

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
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <User size={18} className="text-violet-300" />
                </div>

                <div>
                  <p className="font-semibold">{a.customer_name}</p>

                  <p className="text-xs text-white/40">{a.phone}</p>
                </div>
              </div>

              <div className="text-white/70">{a.service_name}</div>

              <div className="text-white/60 font-medium">
                {a.worker_name || "Não definido"}
              </div>

              <div className="text-sm text-white/60 flex items-center gap-2">
                <Clock size={15} />

                {a.start
                  ? new Date(a.start).toLocaleString("pt-BR")
                  : "Sem data"}
              </div>

              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={a.status} />

                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleFinish(a.id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 h-11 px-4 rounded-2xl"
                    >
                      <Check size={16} />
                    </Button>

                    <Button
                      onClick={() => handleCancel(a.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 h-11 px-4 rounded-2xl"
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
              className="rounded-[28px] border border-violet-500/10 bg-[#111827] p-5 shadow-xl shadow-black/20"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <User size={18} className="text-violet-300" />
                  </div>

                  <div>
                    <h3 className="font-bold">{a.customer_name}</h3>

                    <p className="text-sm text-white/40">{a.phone}</p>
                  </div>
                </div>

                <StatusBadge status={a.status} />
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-white/70 text-sm">
                  Serviço: {a.service_name}
                </p>

                <p className="text-white/60 text-sm">
                  Profissional: {a.worker_name || "Não definido"}
                </p>

                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Clock size={14} />

                  {a.start
                    ? new Date(a.start).toLocaleString("pt-BR")
                    : "Sem data"}
                </div>
              </div>

              {a.status === "pending" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleFinish(a.id)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 h-12 rounded-2xl"
                  >
                    <Check size={16} />
                  </Button>

                  <Button
                    onClick={() => handleCancel(a.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 h-12 rounded-2xl"
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center text-white/40 py-10">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>
      </div>
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
      className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-xl shadow-black/20 ${styles[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">{title}</p>

          <h3 className="text-3xl font-black mt-2 text-white">{value}</h3>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center">
          <Icon size={24} />
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
      className={`px-4 py-2 rounded-full text-xs font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default AdminBookingPage;
