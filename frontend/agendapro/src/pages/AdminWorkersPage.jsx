import { useEffect, useMemo, useState } from "react";
import {
  User,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import Button from "../components/Button";
import { uploadImage } from "../services/upload";
import {
  getWorkers,
  getServices,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerSchedules,
  createWorkerSchedule,
  updateWorkerSchedule,
  deleteWorkerSchedule,
} from "../services/workers";

import {
  getCompanySlotInterval,
  updateCompanySlotInterval,
} from "../services/slotInterval";

const initialForm = {
  name: "",
  phone: "",
  avatar_url: "",
  is_active: true,
  service_ids: [],
};

const weekDays = [
  { value: 0, label: "Segunda" },
  { value: 1, label: "Terça" },
  { value: 2, label: "Quarta" },
  { value: 3, label: "Quinta" },
  { value: 4, label: "Sexta" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

const initialSchedule = {
  weekday: 0,
  start_time: "08:00",
  end_time: "18:00",
};

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState(initialSchedule);
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Slot Interval da Empresa
  const [companySlotInterval, setCompanySlotInterval] = useState(30);
  const [openIntervalModal, setOpenIntervalModal] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const [intervalSuccess, setIntervalSuccess] = useState("");
  const [intervalError, setIntervalError] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================
  const loadData = async () => {
    try {
      setLoading(true);

      const [workersRes, servicesRes, intervalRes] = await Promise.all([
        getWorkers(),
        getServices(),
        getCompanySlotInterval(),
      ]);

      setWorkers(Array.isArray(workersRes) ? workersRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      if (intervalRes?.slot_interval) {
        setCompanySlotInterval(intervalRes.slot_interval);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados");
      setWorkers([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================
  const filteredWorkers = useMemo(() => {
    return (workers || [])
      .filter((w) =>
        (w?.name || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.id - a.id);
  }, [workers, search]);

  // =========================================================
  // FORM HELPERS
  // =========================================================
  const resetForm = () => {
    setForm(initialForm);
    setAvatarFile(null);
    setSchedules([]);
    setNewSchedule(initialSchedule);
    setEditingWorker(null);
    setError("");
    setSuccess("");
    setScheduleSuccess("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = async (worker) => {
    try {
      setEditingWorker(worker);
      setAvatarFile(null);

      setForm({
        name: worker?.name || "",
        phone: worker?.phone || "",
        avatar_url: worker?.avatar_url || "",
        is_active: worker?.is_active ?? true,
        service_ids: worker?.services?.map((s) => s.id) || [],
      });

      const schedulesRes = await getWorkerSchedules(worker.id);
      setSchedules(Array.isArray(schedulesRes) ? schedulesRes : []);
      setOpenModal(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar horários");
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleService = (id) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter((x) => x !== id)
        : [...prev.service_ids, id],
    }));
  };

  // =========================================================
  // SCHEDULES
  // =========================================================
  const addSchedule = () => {
    if (!newSchedule.start_time || !newSchedule.end_time) {
      return;
    }

    setSchedules((prev) => [
      ...prev,
      {
        ...newSchedule,
        temp_id: Date.now(),
      },
    ]);

    setNewSchedule(initialSchedule);
    setScheduleSuccess("Horário adicionado");
    setTimeout(() => {
      setScheduleSuccess("");
    }, 2500);
  };

  const removeSchedule = async (schedule) => {
    try {
      if (schedule.id) {
        await deleteWorkerSchedule(schedule.id);
      }

      setSchedules((prev) =>
        prev.filter(
          (s) => (s.id || s.temp_id) !== (schedule.id || schedule.temp_id)
        )
      );
    } catch (err) {
      console.error(err);
      window.alert("Erro ao remover horário");
    }
  };

  const updateScheduleField = (index, field, value) => {
    setSchedules((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [field]: value,
            }
          : s
      )
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name?.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      let avatarUrl = form.avatar_url;

      if (avatarFile) {
        setUploadingImage(true);
        try {
          const upload = await uploadImage(avatarFile, "workers");
          avatarUrl = upload.url;
        } catch (err) {
          console.error(err);
          setError(err?.response?.data?.message || "Erro ao enviar imagem");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        avatar_url: avatarUrl || null,
        is_active: form.is_active,
        service_ids: form.service_ids || [],
      };

      let workerResponse;

      if (editingWorker) {
        await updateWorker(editingWorker.id, payload);
        workerResponse = editingWorker;
        setSuccess("Funcionário atualizado!");
      } else {
        workerResponse = await createWorker(payload);
        setSuccess("Funcionário criado!");
      }

      const workerId =
        workerResponse?.worker?.id || workerResponse?.id || editingWorker?.id;

      if (workerId) {
        for (const schedule of schedules) {
          const schedulePayload = {
            weekday: Number(schedule.weekday),
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_active: true,
          };

          if (schedule.id) {
            await updateWorkerSchedule(schedule.id, schedulePayload);
          } else {
            await createWorkerSchedule(workerId, schedulePayload);
          }
        }
      }

      await loadData();

      setTimeout(() => {
        handleCloseModal();
      }, 600);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao salvar funcionário"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (id) => {
    const ok = window.confirm("Deseja realmente remover este funcionário?");

    if (!ok) return;

    try {
      await deleteWorker(id);
      setWorkers((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error(err);
      window.alert(err?.message || "Erro ao deletar");
    }
  };

  // =========================================================
  // SLOT INTERVAL SUBMIT
  // =========================================================
  const handleSaveInterval = async (e) => {
    e.preventDefault();
    try {
      setSavingInterval(true);
      setIntervalError("");
      setIntervalSuccess("");

      const res = await updateCompanySlotInterval({
        slot_interval: Number(companySlotInterval),
      });

      if (res?.slot_interval) {
        setCompanySlotInterval(res.slot_interval);
      }

      setIntervalSuccess("Intervalo atualizado com sucesso!");
      setTimeout(() => {
        setOpenIntervalModal(false);
        setIntervalSuccess("");
      }, 1000);
    } catch (err) {
      console.error(err);
      setIntervalError(
        err?.response?.data?.error || "Erro ao atualizar intervalo"
      );
    } finally {
      setSavingInterval(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <User size={32} />
            <div>
              <h1 className="text-3xl font-black">Funcionários</h1>
              <p className="text-white/50">Gerencie sua equipe</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => {
                setIntervalError("");
                setIntervalSuccess("");
                setOpenIntervalModal(true);
              }}
              icon={Clock}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Gerar horário a cada ({companySlotInterval} min)
            </Button>

            <Button onClick={handleOpenCreate} icon={Plus}>
              Novo Funcionário
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-6 bg-[#111827] px-4 h-14 rounded-2xl">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent w-full outline-none"
          />
        </div>

        {/* LIST */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWorkers.map((worker) => (
            <div key={worker.id} className="bg-[#111827] rounded-3xl p-5">
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  {worker.avatar_url ? (
                    <img
                      src={worker.avatar_url}
                      alt={worker.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <User size={18} />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-lg">{worker.name}</h3>
                    <p className="text-white/50 text-sm">{worker.phone}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(worker)}>
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => handleDelete(worker.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(worker.services || []).map((s) => (
                  <span
                    key={s.id}
                    className="text-xs px-2 py-1 bg-violet-500/20 rounded-full"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* MODAL INTERVALO DA EMPRESA */}
        {openIntervalModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#0f172a] w-full max-w-md p-6 rounded-3xl">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Intervalo de horários</h2>
                <button onClick={() => setOpenIntervalModal(false)}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSaveInterval} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm text-white/70">
                    Selecione o intervalo padrão (minutos)
                  </label>
                  <select
                    value={companySlotInterval}
                    onChange={(e) =>
                      setCompanySlotInterval(Number(e.target.value))
                    }
                    className="w-full h-12 bg-[#111827] rounded-xl px-4 text-white outline-none"
                  >
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>

                {intervalError && (
                  <p className="text-red-400 text-sm">{intervalError}</p>
                )}
                {intervalSuccess && (
                  <p className="text-green-400 text-sm">{intervalSuccess}</p>
                )}

                <Button
                  type="submit"
                  disabled={savingInterval}
                  className="w-full"
                >
                  {savingInterval ? "Salvando..." : "Salvar Intervalo"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#0f172a] w-full max-w-2xl p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingWorker ? "Editar Funcionário" : "Novo Funcionário"}
                </h2>

                <button onClick={handleCloseModal}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full h-12 bg-[#111827] rounded-xl px-4"
                />

                <input
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full h-12 bg-[#111827] rounded-xl px-4"
                />

                <div>
                  <label className="block mb-2 text-sm">
                    Foto do Funcionário
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                      }
                    }}
                    className="w-full h-12 bg-[#111827] rounded-xl px-4 py-2"
                  />
                </div>

                {(avatarFile || form.avatar_url) && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={
                        avatarFile
                          ? URL.createObjectURL(avatarFile)
                          : form.avatar_url
                      }
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border border-white/10"
                    />
                  </div>
                )}

                {/* SERVICES */}
                <div className="bg-[#111827] rounded-2xl p-4">
                  <h3 className="font-bold mb-3">Serviços</h3>

                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`px-3 py-2 rounded-full text-sm transition ${
                          form.service_ids.includes(s.id)
                            ? "bg-violet-500"
                            : "bg-white/10"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SCHEDULES */}
                <div className="bg-[#111827] rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-bold">Seus horários</h3>

                    <div className="flex items-center gap-3">
                      {scheduleSuccess && (
                        <span className="text-green-400 text-xs font-medium whitespace-nowrap">
                          {scheduleSuccess}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={addSchedule}
                        className="bg-violet-500 px-3 py-2 rounded-xl text-sm whitespace-nowrap"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <select
                      value={newSchedule.weekday}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          weekday: Number(e.target.value),
                        }))
                      }
                      className="h-12 bg-[#0b1220] rounded-xl px-3"
                    >
                      {weekDays.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="h-12 bg-[#0b1220] rounded-xl px-3"
                    />

                    <input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="h-12 bg-[#0b1220] rounded-xl px-3"
                    />
                  </div>

                  <div className="space-y-3">
                    {schedules.map((schedule, index) => (
                      <div
                        key={schedule.id || schedule.temp_id}
                        className="bg-[#0b1220] rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex flex-col md:flex-row gap-3">
                          <select
                            value={schedule.weekday}
                            onChange={(e) =>
                              updateScheduleField(
                                index,
                                "weekday",
                                Number(e.target.value)
                              )
                            }
                            className="bg-[#111827] rounded-xl px-3 py-2"
                          >
                            {weekDays.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>

                          <input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) =>
                              updateScheduleField(
                                index,
                                "start_time",
                                e.target.value
                              )
                            }
                            className="bg-[#111827] rounded-xl px-3 py-2"
                          />

                          <input
                            type="time"
                            value={schedule.end_time}
                            onChange={(e) =>
                              updateScheduleField(
                                index,
                                "end_time",
                                e.target.value
                              )
                            }
                            className="bg-[#111827] rounded-xl px-3 py-2"
                          />
                        </div>

                        <div className="flex justify-end md:justify-center">
                          <button
                            type="button"
                            onClick={() => removeSchedule(schedule)}
                            className="text-red-400 p-2 -m-2 flex items-center justify-center"
                            aria-label="Remover horário"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400">{error}</p>}
                {success && <p className="text-green-400">{success}</p>}

                <Button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full"
                >
                  {uploadingImage
                    ? "Enviando imagem..."
                    : submitting
                    ? "Salvando..."
                    : "Salvar"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkersPage;
