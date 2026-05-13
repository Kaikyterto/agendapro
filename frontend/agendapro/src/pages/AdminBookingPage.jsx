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
        { method: "GET", auth: true }
      );

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erro ao carregar agendamentos");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadAppointments();
  }, [slug]);

  const handleConfirm = async (id) => {
    await apiFetch(`/appointments/${id}/confirm`, {
      method: "PATCH",
      auth: true,
    });

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
    );
  };

  const handleCancel = async (id) => {
    await apiFetch(`/appointments/${id}/cancel`, {
      method: "PATCH",
      auth: true,
    });

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  };

  const filtered = useMemo(() => {
    return appointments.filter((a) =>
      a.customer_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [appointments, search]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
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
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays />
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 text-red-400 bg-red-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total" value={stats.total} color="blue" />
        <StatCard title="Pendentes" value={stats.pending} color="yellow" />
        <StatCard title="Confirmados" value={stats.confirmed} color="green" />
        <StatCard title="Cancelados" value={stats.cancelled} color="red" />
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <Search size={18} className="text-white/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="bg-transparent outline-none w-full"
        />
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 p-4 text-white/60 text-sm border-b border-white/10">
          <div>Cliente</div>
          <div>Serviço</div>
          <div>Data</div>
          <div>Status</div>
          <div>Ações</div>
        </div>

        {filtered.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-5 p-4 border-b border-white/5 hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <User size={16} />
              {a.customer_name}
            </div>

            <div className="text-white/70">{a.service_name}</div>

            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Clock size={14} />
              {a.start ? new Date(a.start).toLocaleString() : "Sem data"}
            </div>

            <StatusBadge status={a.status} />

            <div className="flex gap-2">
              <Button
                onClick={() => handleConfirm(a.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check size={16} />
              </Button>

              <Button
                onClick={() => handleCancel(a.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 font-semibold">
                <User size={16} />
                {a.customer_name}
              </div>

              <StatusBadge status={a.status} />
            </div>

            <p className="text-white/60 text-sm mb-2">{a.service_name}</p>

            <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
              <Clock size={14} />
              {a.start ? new Date(a.start).toLocaleString() : "Sem data"}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleConfirm(a.id)}
                className="bg-green-600 w-full"
              >
                <Check size={16} />
              </Button>

              <Button
                onClick={() => handleCancel(a.id)}
                className="bg-red-600 w-full"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= STATS =================
const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]}`}>
      <p className="text-xs opacity-70">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

// ================= STATUS =================
const StatusBadge = ({ status }) => {
  const base = "text-xs px-3 py-1 rounded-full inline-block";

  const styles = {
    confirmed: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
    pending: "bg-yellow-500/20 text-yellow-300",
  };

  return <span className={`${base} ${styles[status]}`}>{status}</span>;
};

export default AdminBookingPage;
