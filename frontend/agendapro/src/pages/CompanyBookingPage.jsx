import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  User,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

import {
  createAppointment,
  getCompanyAvailableSlots,
} from "../services/appointmentService";

import {
  getCompanyBySlug,
  getCompanyServices,
} from "../services/companyService";

import Button from "../components/Button";
import Nav from "../components/Nav";

const CompanyBookingPage = () => {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const [companyData, slotsData, servicesData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyAvailableSlots(slug),
          getCompanyServices(slug),
        ]);

        setCompany({
          ...companyData,
          available_slots: slotsData,
        });

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
        console.error("Erro ao carregar empresa:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCompany();
    }
  }, [slug]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const filteredSlots =
    company?.available_slots?.filter((slot) => {
      if (!selectedDate) return false;

      const date = new Date(slot.start);

      const slotDate =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");

      return slotDate === selectedDate;
    }) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedService) {
      setError("Selecione um serviço");
      return;
    }

    if (!selectedSlot) {
      setError("Selecione um horário");
      return;
    }

    try {
      await createAppointment({
        slot_id: selectedSlot.id,
        service_id: selectedService.id,
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      });

      setSuccess("Agendamento realizado com sucesso!");

      setForm({
        name: "",
        phone: "",
        notes: "",
      });

      setSelectedSlot(null);

      setCompany((prev) => ({
        ...prev,
        available_slots: prev.available_slots.filter(
          (slot) => slot.id !== selectedSlot.id
        ),
      }));
    } catch (err) {
      console.error(err);
      setError("Erro ao realizar agendamento");
    }
  };

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

      {/* TOP */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-3 text-white/70 hover:text-white transition-all"
        >
          <div
            className="
              w-11 h-11 rounded-2xl
              border border-white/10
              bg-white/5 backdrop-blur-xl
              flex items-center justify-center
              transition-all
              group-hover:scale-105
              group-hover:border-white/20
            "
          >
            <ArrowLeft size={18} />
          </div>

          <span className="font-medium">Voltar</span>
        </button>
      </div>

      {/* MAIN */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* LEFT */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-white/10 backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <CalendarDays size={18} />
              <span className="text-sm text-white/70">Agendamento Online</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              Agende seu
              <span className="block" style={{ color: "var(--primary)" }}>
                horário
              </span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed max-w-xl">
              Escolha um serviço e realize seu agendamento com a {company?.name}
              .
            </p>

            {/* SERVIÇOS */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Escolha um serviço</h2>

              <div className="grid gap-5">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`
                      rounded-[28px]
                      overflow-hidden
                      border transition-all duration-300
                      backdrop-blur-xl
                      ${
                        selectedService?.id === service.id
                          ? "border-transparent scale-[1.02]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }
                    `}
                    style={{
                      backgroundColor:
                        selectedService?.id === service.id
                          ? "rgba(255,255,255,0.08)"
                          : undefined,
                    }}
                  >
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-52 object-cover"
                      />
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold">{service.name}</h3>

                          <p className="text-white/60 mt-2">
                            {service.description}
                          </p>
                        </div>

                        <div
                          className="px-4 py-2 rounded-2xl text-sm font-semibold"
                          style={{
                            backgroundColor: "var(--primary)",
                          }}
                        >
                          R$ {service.price}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2 text-white/60">
                          <Clock3 size={16} />

                          <span>{service.duration} min</span>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedService(service);
                            setShowForm(true);

                            setTimeout(() => {
                              window.scrollTo({
                                top: document.body.scrollHeight,
                                behavior: "smooth",
                              });
                            }, 100);
                          }}
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

          {/* RIGHT */}
          {showForm && (
            <div className="relative">
              <div
                className="absolute inset-0 blur-[120px] opacity-30 z-50"
                style={{
                  backgroundColor: "var(--primary)",
                }}
              />

              <div className="relative backdrop-blur-2xl border border-white/10 bg-white/5 rounded-[32px] p-8 lg:p-10 shadow-2xl">
                <h2 className="text-3xl font-bold mb-2">Fazer agendamento</h2>

                {selectedService && (
                  <p className="text-white/60 mb-8">
                    Serviço selecionado:{" "}
                    <span
                      className="font-semibold"
                      style={{
                        color: "var(--primary)",
                      }}
                    >
                      {selectedService.name}
                    </span>
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* NOME */}
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
                        className="
                          w-full h-14 rounded-2xl
                          bg-white/5 border border-white/10
                          pl-12 pr-4 outline-none
                          focus:border-[var(--primary)]
                          transition-all
                        "
                      />
                    </div>
                  </div>

                  {/* TELEFONE */}
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Telefone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(81) 99999-9999"
                      className="
                        w-full h-14 rounded-2xl
                        bg-white/5 border border-white/10
                        px-4 outline-none
                        focus:border-[var(--primary)]
                        transition-all
                      "
                    />
                  </div>

                  {/* DATA */}
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Escolha a data
                    </label>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="
                        w-full h-14 rounded-2xl
                        bg-white/5 border border-white/10
                        px-4 outline-none
                        focus:border-[var(--primary)]
                        transition-all
                      "
                    />
                  </div>

                  {/* HORÁRIOS */}
                  <div>
                    <label className="text-sm text-white/60 mb-4 block">
                      Horários disponíveis
                    </label>

                    {!selectedDate ? (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-sm">
                        Selecione uma data para ver os horários disponíveis.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          {filteredSlots.map((slot) => {
                            const date = new Date(slot.start);

                            return (
                              <button
                                type="button"
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className={`
                                  h-14 rounded-2xl border
                                  transition-all text-sm font-semibold
                                  ${
                                    selectedSlot?.id === slot.id
                                      ? "border-transparent scale-[1.03]"
                                      : "border-white/10 bg-white/5 hover:border-white/20"
                                  }
                                `}
                                style={{
                                  backgroundColor:
                                    selectedSlot?.id === slot.id
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

                  {/* OBSERVAÇÕES */}
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
                        className="
                          w-full rounded-2xl
                          bg-white/5 border border-white/10
                          pl-12 pr-4 py-4
                          outline-none
                          focus:border-[var(--primary)]
                          transition-all resize-none
                        "
                      />
                    </div>
                  </div>

                  {/* ALERTAS */}
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

                  {/* BUTTON */}
                  <Button
                    type="submit"
                    className="
                      w-full h-16 text-lg font-bold
                      rounded-2xl transition-transform
                      hover:scale-[1.02]
                    "
                    style={{
                      backgroundColor: "var(--primary)",
                    }}
                  >
                    Confirmar Agendamento
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanyBookingPage;
