import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  User,
  MessageSquare,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import {
  createAppointment,
  getCompanyAvailableSlotsByServiceAndWorker,
} from "../services/appointmentService";

import {
  getCompanyBySlug,
  getCompanyServices,
  getServiceWorkers,
} from "../services/companyService";

import Nav from "../components/Nav";

export default function CompanyBookingPage() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const [company, setCompany] = useState(null);

  const [services, setServices] = useState([]);

  const [workers, setWorkers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);

  const [selectedWorker, setSelectedWorker] = useState(null);

  const [selectedDate, setSelectedDate] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
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

    loadData();
  }, [slug]);

  // =========================================================
  // SELECT SERVICE
  // =========================================================

  const handleSelectService = async (service) => {
    try {
      setSelectedService(service);

      setSelectedWorker(null);

      setSelectedDate("");

      setSelectedSlot(null);

      setAvailableSlots([]);

      const workersData = await getServiceWorkers(slug, service.id);

      setWorkers(workersData || []);

      setShowWorkerModal(true);
    } catch (err) {
      console.error(err);

      setError("Erro ao carregar profissionais");
    }
  };

  // =========================================================
  // LOAD SLOTS
  // =========================================================

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedService || !selectedWorker) {
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

        setAvailableSlots(Array.isArray(response?.slots) ? response.slots : []);
      } catch (err) {
        console.error(err);

        setAvailableSlots([]);

        setError(err?.message || "Erro ao carregar horários");
      }
    };

    loadSlots();
  }, [slug, selectedDate, selectedService, selectedWorker]);

  // =========================================================
  // FILTERED SLOTS
  // =========================================================

  const filteredSlots = useMemo(() => {
    return availableSlots || [];
  }, [availableSlots]);

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
  // SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!selectedService) {
      setError("Selecione um serviço");
      return;
    }

    if (!selectedWorker) {
      setError("Selecione um profissional");
      return;
    }

    if (!selectedSlot) {
      setError("Selecione um horário");
      return;
    }

    if (!form.name || !form.phone) {
      setError("Preencha nome e telefone");
      return;
    }

    try {
      setSubmitting(true);

      await createAppointment({
        service_id: selectedService.id,
        worker_id: selectedWorker.id,
        start_datetime: selectedSlot,
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      });

      setToast("Agendamento realizado com sucesso!");

      setShowBookingModal(false);

      setAvailableSlots((prev) =>
        prev.filter((slot) => slot.start !== selectedSlot)
      );

      setSelectedSlot(null);

      setForm({
        name: "",
        phone: "",
        notes: "",
      });

      setTimeout(() => {
        setToast("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          err?.response?.data?.error ||
          "Erro ao realizar agendamento"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />

        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {/* NAV */}
      <Nav logo={company?.logo} />

      {/* HEADER */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            Agende seu horário
          </h1>

          <p className="text-white/50 mt-4 text-lg">
            Escolha um serviço, profissional e horário.
          </p>
        </div>
      </section>

      {/* SERVICES */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service)}
              className={`group text-left overflow-hidden rounded-[30px] border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                selectedService?.id === service.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="aspect-[1.4] overflow-hidden">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{service.name}</h2>

                    <p className="text-white/50 text-sm mt-2 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {selectedService?.id === service.id && (
                    <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs">Preço</p>

                    <p className="text-2xl font-black">
                      R$ {Number(service.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-white/40 text-xs">Duração</p>

                    <p className="font-bold">{service.duration} min</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* BOOKING */}
        {selectedWorker && (
          <div className="mt-12 grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
            {/* SIDEBAR */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 h-fit backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <img
                  src={selectedWorker.avatar_url}
                  alt={selectedWorker.name}
                  className="w-20 h-20 rounded-3xl object-cover"
                />

                <div>
                  <h3 className="text-2xl font-black">{selectedWorker.name}</h3>

                  <p className="text-white/40">{selectedService?.name}</p>
                </div>
              </div>

              <div className="mt-8">
                <label className="text-sm text-white/50">Data</label>

                <div className="relative mt-2">
                  <CalendarDays className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowWorkerModal(true)}
                className="mt-5 w-full h-14 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 transition"
              >
                Trocar profissional
              </button>
            </div>

            {/* SLOTS */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center">
                  <Clock3 className="w-6 h-6 text-[var(--primary)]" />
                </div>

                <div>
                  <h3 className="text-2xl font-black">Horários disponíveis</h3>

                  <p className="text-white/40 text-sm">Escolha um horário</p>
                </div>
              </div>

              {!selectedDate ? (
                <div className="h-[250px] flex items-center justify-center text-white/30">
                  Selecione uma data
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-white/30">
                  Nenhum horário disponível
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSlots.map((slot) => {
                    const date = new Date(slot.start);

                    const isSelected = selectedSlot === slot.start;

                    return (
                      <button
                        key={slot.start}
                        onClick={() => {
                          setSelectedSlot(slot.start);

                          setShowBookingModal(true);
                        }}
                        className={`h-16 rounded-2xl border transition-all font-bold ${
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)] scale-[1.03]"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
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
          </div>
        )}
      </main>

      {/* WORKERS MODAL */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWorkerModal(false)}
          />

          <div className="relative w-full max-w-2xl rounded-[32px] bg-[#0d0f14] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black">Escolha o profissional</h2>

                <p className="text-white/40 mt-1">{selectedService?.name}</p>
              </div>

              <button
                onClick={() => setShowWorkerModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {workers.map((worker) => (
                <button
                  key={worker.id}
                  onClick={() => {
                    setSelectedWorker(worker);

                    setShowWorkerModal(false);
                  }}
                  className="p-5 rounded-[26px] bg-white/5 border border-white/10 hover:border-white/20 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={worker.avatar_url}
                      alt={worker.name}
                      className="w-20 h-20 rounded-3xl object-cover"
                    />

                    <div>
                      <h3 className="text-xl font-black">{worker.name}</h3>

                      <p className="text-white/40 text-sm mt-1">
                        Profissional disponível
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
          />

          <div className="relative w-full max-w-xl rounded-[32px] bg-[#0d0f14] border border-white/10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black">Confirmar agendamento</h2>

                <p className="text-white/40 mt-1">Finalize seu agendamento</p>
              </div>

              <button
                onClick={() => setShowBookingModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <X />
              </button>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-white/50">Nome</label>

                <div className="relative mt-2">
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50">Telefone</label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="mt-2 w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-sm text-white/50">Observações</label>

                <div className="relative mt-2">
                  <MessageSquare className="w-5 h-5 absolute left-4 top-5 text-white/40" />

                  <textarea
                    rows={4}
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Observações..."
                    className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-4 outline-none focus:border-[var(--primary)] resize-none"
                  />
                </div>
              </div>

              <button
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-[var(--primary)] font-black text-lg hover:brightness-110 transition disabled:opacity-50"
              >
                {submitting ? "Agendando..." : "Confirmar agendamento"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed top-24 right-4 z-[999]">
          <div className="px-5 py-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
