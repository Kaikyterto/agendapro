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

  // =========================================================
  // LOAD
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
      .filter((a) =>
        a.customer_name?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (!a.start) return 1;

        if (!b.start) return -1;

        return new Date(a.start) - new Date(b.start);
      });
  }, [appointments, search]);

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

        <div className="flex items-center gap-3 mb-8 bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 backdrop-blur-xl shadow-lg">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        {/* LIST */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-[32px] overflow-hidden border border-violet-500/10 bg-[#111827] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30"
            >
              <div className="p-6">
                {/* TOP */}

                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
                      <User size={22} className="text-violet-300" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-black truncate">
                        {a.customer_name}
                      </h3>

                      <p className="text-white/40 text-sm truncate">
                        {a.phone || "Sem telefone"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={a.status} />
                </div>

                {/* INFO */}

                <div className="space-y-4 mb-6">
                  <div className="rounded-2xl bg-black/20 border border-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/40 mb-1">
                      Serviço
                    </p>

                    <p className="text-white font-semibold">
                      {a.service_name || "Não informado"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 border border-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/40 mb-1">
                      Profissional
                    </p>

                    <p className="text-white font-semibold">
                      {a.worker_name || "Não definido"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 border border-white/5 p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Clock size={18} className="text-violet-300" />
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/40">
                        Horário
                      </p>

                      <p className="text-white font-semibold">
                        {a.start
                          ? new Date(a.start).toLocaleString("pt-BR")
                          : "Sem data"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                {a.status === "pending" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleFinish(a.id)}
                      className="h-12 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-2xl"
                    >
                      <Check size={16} />
                    </Button>

                    <Button
                      onClick={() => handleCancel(a.id)}
                      className="h-12 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-2xl"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY */}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/40">
            Nenhum agendamento encontrado.
          </div>
        )}
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
    pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",

    finished: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",

    cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default AdminBookingPage;
