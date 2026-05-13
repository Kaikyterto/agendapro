import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Check, X, Clock } from "lucide-react";

import { apiFetch } from "../services/api";
import Button from "../components/Button";
import Nav from "../components/Nav";

const AdminBookingPage = () => {
  const { slug } = useParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD APPOINTMENTS
  // =====================================================
  const loadAppointments = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(`/appointments?slug=${slug}`, {
        method: "GET",
        auth: true,
      });

      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadAppointments();
  }, [slug]);

  // =====================================================
  // CONFIRMAR
  // =====================================================
  const handleConfirm = async (id) => {
    try {
      await apiFetch(`/appointments/${id}/confirm`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
      );
    } catch (err) {
      console.error(err);
      setError("Erro ao confirmar agendamento");
    }
  };

  // =====================================================
  // CANCELAR
  // =====================================================
  const handleCancel = async (id) => {
    try {
      await apiFetch(`/appointments/${id}/cancel`, {
        method: "PATCH",
        auth: true,
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (err) {
      console.error(err);
      setError("Erro ao cancelar agendamento");
    }
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      <Nav />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-10">
          <CalendarDays />
          <h1 className="text-3xl font-bold">Painel de Agendamentos</h1>
        </div>

        {/* ERROR */}
        {error && <div className="mb-6 text-red-400">{error}</div>}

        {/* LIST */}
        <div className="space-y-4">
          {appointments.length === 0 && (
            <div className="text-white/50">Nenhum agendamento encontrado</div>
          )}

          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between"
            >
              {/* INFO */}
              <div>
                <h3 className="text-lg font-bold">
                  {appointment.customer_name}
                </h3>

                <p className="text-white/60 text-sm">
                  {appointment.service_name}
                </p>

                <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">
                  <Clock size={14} />
                  {new Date(appointment.start).toLocaleString()}
                </div>

                <span
                  className={`text-xs mt-2 inline-block px-3 py-1 rounded-full ${
                    appointment.status === "confirmed"
                      ? "bg-green-500/20 text-green-300"
                      : appointment.status === "cancelled"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleConfirm(appointment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check size={16} />
                </Button>

                <Button
                  onClick={() => handleCancel(appointment.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingPage;
