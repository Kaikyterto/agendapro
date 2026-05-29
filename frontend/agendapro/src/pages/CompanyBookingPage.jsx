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

        setError("Erro ao carregar empresa");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCompany();
    }
  }, [slug]);

  // =========================================================
  // LOAD SLOTS
  // =========================================================

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedWorker || !selectedService) {
        return;
      }

      try {
        setError("");

        const response = await getCompanyAvailableSlotsByServiceAndWorker(
          slug,
          selectedService.id,
          selectedWorker.id,
          selectedDate
        );

        setAvailableSlots(response?.slots || []);
      } catch (err) {
        console.error(err);

        setAvailableSlots([]);

        setError("Erro ao carregar horários");
      }
    };

    loadSlots();
  }, [slug, selectedDate, selectedWorker, selectedService]);

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
  // FORM
  // =========================================================

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetBookingState = () => {
    setSelectedWorker(null);

    setSelectedStartDateTime(null);

    setSelectedDate("");

    setAvailableSlots([]);

    setWorkers([]);

    setSuccess("");

    setError("");

    setForm({
      name: "",
      phone: "",
      notes: "",
    });
  };

  // =========================================================
  // SELECT SERVICE
  // =========================================================

  const handleSelectService = async (service) => {
    try {
      setError("");

      resetBookingState();

      setSelectedService(service);

      const workersData = await getServiceWorkers(slug, service.id);

      setWorkers(workersData);

      setShowWorkersModal(true);
    } catch (err) {
      console.error(err);

      setError("Erro ao carregar profissionais");
    }
  };

  // =========================================================
  // SELECT WORKER
  // =========================================================

  const handleSelectWorker = (worker) => {
    setSelectedWorker(worker);

    setShowWorkersModal(false);

    setShowBookingModal(true);
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

      setError(
        err?.message ||
          err?.response?.data?.error ||
          "Erro ao realizar agendamento"
      );
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
    <div className="min-h-screen bg-[#07090d] text-white">
      <Nav />

      {/* HERO */}
      <div className="relative h-[280px] overflow-hidden">
        {company?.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090dc9] to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-6xl mx-auto">
          <h1 className="text-4xl font-black mb-3">{company?.name}</h1>

          {company?.about && (
            <p className="text-white/70 max-w-2xl">{company.about}</p>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-300">
            {success}
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <CalendarDays size={28} />

          <div>
            <h2 className="text-2xl font-bold">Escolha um serviço</h2>

            <p className="text-white/60 text-sm">
              Selecione o serviço desejado para iniciar o agendamento
            </p>
          </div>
        </div>

        {/* SERVICES */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service)}
              className="group text-left rounded-3xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden"
            >
              {service.image_url && (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-52 object-cover"
                />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{service.name}</h3>

                    <p className="text-white/60 text-sm line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  <div
                    className="min-w-fit px-3 py-2 rounded-2xl text-sm font-bold"
                    style={{
                      backgroundColor: "var(--primary)",
                    }}
                  >
                    R$ {Number(service.price).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 text-white/60 text-sm">
                  <Clock3 size={16} />

                  <span>{service.duration} min</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* WORKERS MODAL */}
      {showWorkersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#10131a] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Escolha um profissional</h3>

                <p className="text-white/60 text-sm">{selectedService?.name}</p>
              </div>

              <button
                onClick={() => setShowWorkersModal(false)}
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              {workers.map((worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleSelectWorker(worker)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  {worker.avatar_url ? (
                    <img
                      src={worker.avatar_url}
                      alt={worker.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                      <User size={22} />
                    </div>
                  )}

                  <div className="text-left">
                    <h4 className="font-bold">{worker.name}</h4>

                    <p className="text-white/60 text-sm">
                      Profissional disponível
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-3xl bg-[#10131a] border border-white/10 p-6">
              {/* HEADER */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      setShowWorkersModal(true);
                    }}
                    className="flex items-center gap-2 text-white/60 hover:text-white mb-3"
                  >
                    <ArrowLeft size={18} />
                    Voltar
                  </button>

                  <h3 className="text-3xl font-black">Finalizar agendamento</h3>

                  <p className="text-white/60 mt-1">
                    {selectedService?.name} com {selectedWorker?.name}
                  </p>
                </div>

                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* DATE */}
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-2">Data</label>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);

                    setSelectedStartDateTime(null);
                  }}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30"
                />
              </div>

              {/* SLOTS */}
              {!!selectedDate && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock3 size={18} />

                    <h4 className="font-bold">Horários disponíveis</h4>
                  </div>

                  {filteredSlots.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60">
                      Nenhum horário disponível nesta data
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                              backgroundColor: isSelected
                                ? "var(--primary)"
                                : undefined,
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
                  )}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-white/60 mb-2 flex items-center gap-2">
                    <User size={16} />
                    Nome
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 flex items-center gap-2">
                    <User size={16} />
                    Telefone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Observações
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Digite alguma observação..."
                    rows={4}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 outline-none resize-none focus:border-white/30"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl text-base font-bold"
                >
                  Confirmar agendamento
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBookingPage;
