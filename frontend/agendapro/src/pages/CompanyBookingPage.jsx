import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  User,
  MessageSquare,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
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

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Estado para controlar quais descrições de serviços estão expandidas (IDs)
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  // CORREÇÃO 1: Inicializa com a data local do navegador, evitando virada de dia precoce pelo ISO UTC
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  });

  const [showWorkersModal, setShowWorkersModal] = useState(false);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);

  const [loadingSlots, setLoadingSlots] = useState(false);

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
  // LOAD SLOTS
  // =========================================================

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedWorker || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);

        setError("");

        const response = await getCompanyAvailableSlotsByServiceAndWorker(
          slug,
          selectedService.id,
          selectedWorker.id,
          selectedDate
        );

        const slots = response?.slots || [];

        setAvailableSlots(slots);

        setSelectedSlot(null);
      } catch (err) {
        console.error(err);

        setAvailableSlots([]);

        setError("Erro ao carregar horários disponíveis");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [slug, selectedDate, selectedWorker, selectedService]);

  // =========================================================
  // TOGGLE DESCRIPTION
  // =========================================================

  const toggleDescription = (serviceId) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

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
    return availableSlots || [];
  }, [availableSlots]);

  // =========================================================
  // RESET
  // =========================================================

  const resetBookingState = () => {
    setSelectedWorker(null);

    setSelectedSlot(null);

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

    if (submitting) return;

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

    if (!selectedSlot) {
      setError("Selecione um horário");
      return;
    }

    if (!form.name?.trim()) {
      setError("Informe seu nome");
      return;
    }

    try {
      setSubmitting(true);

      const rawDateTime = selectedSlot.datetime || selectedSlot.start;
      // CORREÇÃO 2: Garante a remoção de 'Z' ou offsets residuais (+00:00) antes de enviar para a API
      const cleanDateTime =
        typeof rawDateTime === "string"
          ? rawDateTime.replace(/Z|[-+]\d{2}:\d{2}$/g, "")
          : rawDateTime;

      await createAppointment({
        service_id: selectedService.id,
        worker_id: selectedWorker.id,
        start_datetime: cleanDateTime,
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        notes: form.notes?.trim() || null,
      });

      setSuccess("Agendamento realizado com sucesso!");

      setAvailableSlots((prev) =>
        prev.filter((slot) => (slot.datetime || slot.start) !== rawDateTime)
      );

      setTimeout(() => {
        setShowBookingModal(false);
        resetBookingState();
      }, 1800);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
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
      <div className="min-h-screen flex items-center justify-center bg-[#07090d]">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, var(--primary) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, var(--accent) 0%, transparent 40%)
          `,
        }}
      />

      <Nav logo={company?.logo} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-5xl">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-white/10 backdrop-blur-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <CalendarDays size={18} />

            <span className="text-sm text-white/70">Agendamento Online</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-none tracking-tight mb-6">
            Agende seu
            <span
              className="block"
              style={{
                color: "var(--primary)",
              }}
            >
              horário
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl">
            Escolha um serviço e realize seu agendamento com a {company?.name}.
          </p>

          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Escolha um serviço</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {services.map((service) => {
                const isExpanded = expandedDescriptions.has(service.id);
                const hasDescription = Boolean(
                  service.description && service.description.trim() !== ""
                );

                return (
                  <div
                    key={service.id}
                    className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col justify-between"
                  >
                    <div>
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          loading="lazy"
                          className="w-full aspect-square object-cover"
                        />
                      )}

                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
                          {service.name}
                        </h3>

                        {/* Descrição com suporte a "Ler mais" */}
                        {hasDescription && (
                          <div className="mt-2 text-xs text-white/60">
                            <p
                              className={
                                isExpanded ? "" : "line-clamp-2 leading-relaxed"
                              }
                            >
                              {service.description}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleDescription(service.id)}
                              className="mt-1 font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                              style={{ color: "var(--primary)" }}
                            >
                              {isExpanded ? (
                                <>
                                  Ler menos <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  Ler mais <ChevronDown size={14} />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 pt-0 mt-auto">
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: "var(--primary)",
                          }}
                        >
                          {Number(service.price) === 0 ? (
                            <span className="text-[11px] text-white/70 font-normal">
                              Valor a ser consultado
                            </span>
                          ) : (
                            `R$ ${service.price}`
                          )}
                        </span>

                        <span className="text-[11px] text-white/50">
                          {service.duration} min
                        </span>
                      </div>

                      <Button
                        onClick={async () => {
                          try {
                            resetBookingState();

                            const workersData = await getServiceWorkers(
                              slug,
                              service.id
                            );

                            setSelectedService(service);
                            setWorkers(workersData);
                            setShowWorkersModal(true);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full mt-3 h-9 text-xs"
                        style={{
                          backgroundColor: "var(--primary)",
                        }}
                      >
                        Agendar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {showWorkersModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-10">
            <div className="w-full max-w-2xl bg-[#11151c] border border-white/10 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 relative">
              <button
                onClick={() => setShowWorkersModal(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl sm:text-3xl font-black mb-2 pr-12">
                Escolha um profissional
              </h2>

              <p className="text-white/60 mb-8">
                Serviço selecionado:{" "}
                <span style={{ color: "var(--primary)" }}>
                  {selectedService?.name}
                </span>
              </p>

              <div className="grid gap-4">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {worker.avatar_url ? (
                          <img
                            src={worker.avatar_url}
                            alt={worker.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={24} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate">
                          {worker.name}
                        </h3>

                        <p className="text-white/50 text-sm">
                          Profissional disponível
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowWorkersModal(false);
                        setShowBookingModal(true);
                      }}
                      className="w-full sm:w-auto"
                      style={{
                        backgroundColor: "var(--primary)",
                      }}
                    >
                      Escolher
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBookingModal && (
        <div className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-10">
            <div className="w-full max-w-2xl bg-[#11151c] border border-white/10 rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 relative">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setError("");
                  setSuccess("");
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl sm:text-3xl font-black mb-2 pr-12">
                Finalizar agendamento
              </h2>

              <p className="text-white/60 mb-8 leading-relaxed">
                <span style={{ color: "var(--primary)" }}>
                  {selectedService?.name}
                </span>{" "}
                com{" "}
                <span style={{ color: "var(--primary)" }}>
                  {selectedWorker?.name}
                </span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Seu nome
                  </label>

                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      size={18}
                    />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Digite seu nome"
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 outline-none focus:border-[var(--primary)] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Telefone{" "}
                    <span className="text-white/40 text-xs">(Opcional)</span>
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(81) 99999-9999"
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Escolha a data
                  </label>

                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-4 block">
                    Horários disponíveis
                  </label>

                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredSlots.map((slot) => {
                          const date = new Date(slot.datetime || slot.start);

                          return (
                            <button
                              type="button"
                              key={slot.datetime || slot.start}
                              onClick={() => setSelectedSlot(slot)}
                              className={`h-14 rounded-2xl border transition-all text-sm font-semibold px-2 ${
                                (selectedSlot?.datetime ||
                                  selectedSlot?.start) ===
                                (slot.datetime || slot.start)
                                  ? "border-transparent scale-[1.03]"
                                  : "border-white/10 bg-white/5 hover:border-white/20"
                              }`}
                              style={{
                                backgroundColor:
                                  (selectedSlot?.datetime ||
                                    selectedSlot?.start) ===
                                  (slot.datetime || slot.start)
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

                      {filteredSlots.length === 0 && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm">
                          Nenhum horário disponível para esta data.
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Observações
                  </label>

                  <div className="relative">
                    <MessageSquare
                      className="absolute left-4 top-5 text-white/40"
                      size={18}
                    />

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Digite alguma observação..."
                      rows={4}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-4 outline-none focus:border-[var(--primary)] transition-all resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl transition-transform hover:scale-[1.01]"
                  style={{
                    backgroundColor: "var(--primary)",
                  }}
                >
                  Confirmar Agendamento
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
