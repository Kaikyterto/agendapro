import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  User,
  MessageSquare,
  ArrowLeft,
  X,
} from "lucide-react";

import {
  createAppointment,
  getCompanyAvailableSlotsByServiceAndWorker,
} from "../services/appointmentService";

import {
  getCompanyBySlug,
  getCompanyServices,
  getServiceWorkers,
} from "../services/companyService";

import Button from "../components/Button";
import Nav from "../components/Nav";

const CompanyBookingPage = () => {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);

  const [services, setServices] = useState([]);

  const [workers, setWorkers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);

  const [selectedWorker, setSelectedWorker] = useState(null);

  const [selectedStartDateTime, setSelectedStartDateTime] = useState(null);

  const [selectedDate, setSelectedDate] = useState("");

  const [showWorkersModal, setShowWorkersModal] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  // =========================================================
  // LOAD COMPANY
  // =========================================================

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const [companyData, servicesData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyServices(slug),
        ]);

        setCompany(companyData);

        setServices(servicesData);

        if (companyData?.colors) {
          document.documentElement.style.setProperty(
            "--primary",
            companyData.colors.primary
          );

          document.documentElement.style.setProperty(
            "--accent",
            companyData.colors.secondary
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCompany();
    }
  }, [slug]);

  // =========================================================
  // LOAD AVAILABLE SLOTS
  // =========================================================

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedWorker || !selectedService) {
        return;
      }

      try {
        setError("");

        const slotsData = await getCompanyAvailableSlotsByServiceAndWorker(
          slug,
          selectedService.id,
          selectedWorker.id,
          selectedDate
        );

        setAvailableSlots(slotsData);
      } catch (err) {
        console.error(err);

        setError("Erro ao carregar horários disponíveis");
      }
    };

    loadSlots();
  }, [slug, selectedDate, selectedWorker, selectedService]);

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================================================
  // FILTERED SLOTS
  // =========================================================

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      if (!selectedDate) {
        return false;
      }

      const date = new Date(slot.start);

      const slotDate =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");

      return slotDate === selectedDate;
    });
  }, [availableSlots, selectedDate]);

  // =========================================================
  // RESET
  // =========================================================

  const resetBookingState = () => {
    setSelectedWorker(null);

    setSelectedStartDateTime(null);

    setSelectedDate("");

    setAvailableSlots([]);

    setError("");

    setSuccess("");

    setForm({
      name: "",
      phone: "",
      notes: "",
    });
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    setSuccess("");

    if (!selectedService) {
      setError("Selecione um serviço");
      return;
    }

    if (!selectedWorker) {
      setError("Selecione um profissional");
      return;
    }

    if (!selectedStartDateTime) {
      setError("Selecione um horário");
      return;
    }

    if (!form.name || !form.phone) {
      setError("Preencha nome e telefone");
      return;
    }

    try {
      await createAppointment({
        service_id: selectedService.id,

        worker_id: selectedWorker.id,

        start_datetime: selectedStartDateTime,

        name: form.name,

        phone: form.phone,

        notes: form.notes,
      });

      setSuccess("Agendamento realizado com sucesso!");

      setAvailableSlots((prev) =>
        prev.filter((slot) => slot.start !== selectedStartDateTime)
      );

      setTimeout(() => {
        setShowBookingModal(false);

        resetBookingState();
      }, 1800);
    } catch (err) {
      console.error(err);

      setError(err?.response?.data?.error || "Erro ao realizar agendamento");
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d]">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* resto do componente permanece igual */}

      {/* APENAS TROQUE O BLOCO DOS HORÁRIOS POR ESTE */}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredSlots.map((slot) => {
          const date = new Date(slot.start);

          const isSelected = selectedStartDateTime === slot.start;

          return (
            <button
              type="button"
              key={slot.start}
              onClick={() => setSelectedStartDateTime(slot.start)}
              className={`h-14 rounded-2xl border transition-all text-sm font-semibold px-2 ${
                isSelected
                  ? "border-transparent scale-[1.03]"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
              style={{
                backgroundColor: isSelected ? "var(--primary)" : undefined,
              }}
            >
              {date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyBookingPage;
