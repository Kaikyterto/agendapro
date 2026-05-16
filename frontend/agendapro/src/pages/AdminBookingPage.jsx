import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Check, X, Clock, Search, User } from "lucide-react";

import { apiFetch } from "../services/api";
import Button from "../components/Button";

const AdminBookingPage = () => {
  const { slug } = useParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <CalendarDays size={26} />
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black">Agendamentos</h1>

            <p className="text-white/50 mt-1">
              Gerencie os horários da sua empresa
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total" value={stats.total} color="blue" />

          <StatCard title="Pendentes" value={stats.pending} color="yellow" />

          <StatCard title="Finalizados" value={stats.finished} color="green" />

          <StatCard title="Cancelados" value={stats.cancelled} color="red" />
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-8 bg-white/5 border border-white/10 rounded-3xl px-5 h-16 backdrop-blur-xl">
          <Search size={18} className="text-white/40" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:block overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid grid-cols-5 px-6 py-5 border-b border-white/10 text-white/50 text-sm font-semibold">
            <div>Cliente</div>
            <div>Serviço</div>
            <div>Data</div>
            <div>Status</div>
            <div className="text-right">Ações</div>
          </div>

          {filtered.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/[0.03] transition-all items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <User size={18} />
                </div>

                <div>
                  <p className="font-semibold">{a.customer_name}</p>

                  <p className="text-xs text-white/40">{a.phone}</p>
                </div>
              </div>

              <div className="text-white/70">{a.service_name}</div>

              <div className="text-sm text-white/60 flex items-center gap-2">
                <Clock size={15} />

                {a.start
                  ? new Date(a.start).toLocaleString("pt-BR")
                  : "Sem data"}
              </div>

              <div>
                <StatusBadge status={a.status} />
              </div>

              <div className="flex justify-end gap-2">
                {a.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleFinish(a.id)}
                      className="bg-green-600 hover:bg-green-700 h-11 px-4"
                    >
                      <Check size={16} />
                    </Button>

                    <Button
                      onClick={() => handleCancel(a.id)}
                      className="bg-red-600 hover:bg-red-700 h-11 px-4"
                    >
                      <X size={16} />
                    </Button>
                  </>
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
              className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <User size={18} />
                  </div>

                  <div>
                    <h3 className="font-bold">{a.customer_name}</h3>

                    <p className="text-sm text-white/40">{a.phone}</p>
                  </div>
                </div>

                <StatusBadge status={a.status} />
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-white/70 text-sm">{a.service_name}</p>

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
                    className="bg-green-600 h-12"
                  >
                    <Check size={16} />
                  </Button>

                  <Button
                    onClick={() => handleCancel(a.id)}
                    className="bg-red-600 h-12"
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

const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div
      className={`rounded-[28px] border p-5 backdrop-blur-xl ${colors[color]}`}
    >
      <p className="text-sm opacity-70">{title}</p>

      <h3 className="text-3xl font-black mt-2">{value}</h3>
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
    finished: "bg-green-500/10 text-green-400 border border-green-500/20",
    cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
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
