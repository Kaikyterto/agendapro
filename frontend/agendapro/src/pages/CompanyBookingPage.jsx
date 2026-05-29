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

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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

        setAvailableSlots(response?.slots || []);

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

    if (!form.name || !form.phone) {
      setError("Preencha nome e telefone");
      return;
    }

    try {
      await createAppointment({
        service_id: selectedService.id,

        worker_id: selectedWorker.id,

        start_datetime: selectedSlot.start,

        name: form.name,

        phone: form.phone,

        notes: form.notes,
      });

      setSuccess("Agendamento realizado com sucesso!");

      setAvailableSlots((prev) =>
        prev.filter((slot) => slot.start !== selectedSlot.start)
      );

      setTimeout(() => {
        setShowBookingModal(false);

        resetBookingState();
      }, 1800);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
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
    <div className="min-h-screen bg-[#07090d] text-white relative overflow-hidden">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />

        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {/* NAV */}
      <Nav logo={company?.logo} />

      {/* BACK */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-3 text-white/70 hover:text-white transition-all"
        >
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-white/20">
            <ArrowLeft size={18} />
          </div>

          <span className="font-medium">Voltar</span>
        </button>
      </div>

      {/* CONTENT */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-white/10 bg-white/5 backdrop-blur-xl">
            <CalendarDays size={18} />

            <span className="text-sm text-white/70">Agendamento Online</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
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

          {/* SERVICES */}
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6">Escolha um serviço</h2>

            <div className="grid gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="group rounded-[30px] overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-xl"
                >
                  {service.image_url && (
                    <div className="overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-56 sm:h-72 object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black">{service.name}</h3>

                        <p className="text-white/60 mt-3 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div
                        className="px-5 py-3 rounded-2xl text-sm font-bold w-fit"
                        style={{
                          backgroundColor: "var(--primary)",
                        }}
                      >
                        R$ {Number(service.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mt-8">
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock3 size={16} />

                        <span>{service.duration} min</span>
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
                        className="w-full sm:w-auto"
                        style={{
                          backgroundColor: "var(--primary)",
                        }}
                      >
                        Agendar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* WORKERS MODAL */}
      {showWorkersModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-10">
            <div className="w-full max-w-2xl bg-[#11151c] border border-white/10 rounded-[32px] p-6 sm:p-8 relative">
              <button
                onClick={() => setShowWorkersModal(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>

              <h2 className="text-3xl font-black mb-2 pr-12">
                Escolha um profissional
              </h2>

              <div className="grid gap-4 mt-8">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                        {worker.avatar_url ? (
                          <img
                            src={worker.avatar_url}
                            alt={worker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={24} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-lg">{worker.name}</h3>

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

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-10">
            <div className="w-full max-w-2xl bg-[#11151c] border border-white/10 rounded-[32px] p-6 sm:p-8 relative">
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>

              <h2 className="text-3xl font-black mb-8">
                Finalizar agendamento
              </h2>

              {/* restante do modal continua igual */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBookingPage;
