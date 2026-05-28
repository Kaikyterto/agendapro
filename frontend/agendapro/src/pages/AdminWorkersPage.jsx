import { useEffect, useMemo, useState } from "react";

import {
  User,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Phone,
  Image as ImageIcon,
  Briefcase,
} from "lucide-react";

import Button from "../components/Button";

import {
  getWorkers,
  getServices,
  createWorker,
  updateWorker,
  deleteWorker,
} from "../services/workers";

const initialForm = {
  name: "",
  phone: "",
  avatar_url: "",
  is_active: true,
  service_ids: [],
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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================
  const loadData = async () => {
    try {
      setLoading(true);

      const [workersData, servicesData] = await Promise.all([
        getWorkers(),
        getServices(),
      ]);

      setWorkers(Array.isArray(workersData) ? workersData : []);

      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (err) {
      console.error(err);

      setError("Erro ao carregar funcionários");
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
    return [...workers]
      .filter((worker) =>
        worker?.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.id - a.id);
  }, [workers, search]);

  // =========================================================
  // FORM
  // =========================================================
  const resetForm = () => {
    setForm(initialForm);

    setEditingWorker(null);

    setError("");
    setSuccess("");
  };

  const handleOpenCreate = () => {
    resetForm();

    setOpenModal(true);
  };

  const handleOpenEdit = (worker) => {
    setEditingWorker(worker);

    setForm({
      name: worker?.name || "",
      phone: worker?.phone || "",
      avatar_url: worker?.avatar_url || "",

      is_active:
        typeof worker?.is_active === "boolean" ? worker.is_active : true,

      service_ids: worker?.services?.map((service) => service.id) || [],
    });

    setOpenModal(true);
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

  // =========================================================
  // SERVICES
  // =========================================================
  const toggleService = (serviceId) => {
    setForm((prev) => {
      const alreadySelected = prev.service_ids.includes(serviceId);

      return {
        ...prev,

        service_ids: alreadySelected
          ? prev.service_ids.filter((id) => id !== serviceId)
          : [...prev.service_ids, serviceId],
      };
    });
  };

  // =========================================================
  // SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Nome é obrigatório");
        return;
      }

      const payload = {
        name: form.name.trim(),

        phone: form.phone.trim(),

        avatar_url: form.avatar_url.trim(),

        is_active: form.is_active,

        service_ids: form.service_ids,
      };

      if (editingWorker) {
        await updateWorker(editingWorker.id, payload);

        setSuccess("Funcionário atualizado com sucesso!");
      } else {
        await createWorker(payload);

        setSuccess("Funcionário criado com sucesso!");
      }

      await loadData();

      setTimeout(() => {
        handleCloseModal();
      }, 700);
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
    const confirmed = window.confirm(
      "Deseja realmente remover este funcionário?"
    );

    if (!confirmed) return;

    try {
      await deleteWorker(id);

      setWorkers((prev) => prev.filter((worker) => worker.id !== id));
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao remover funcionário"
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin text-violet-400" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <User size={30} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Funcionários
              </h1>

              <p className="text-white/50 mt-1">Gerencie sua equipe</p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white h-14 px-6 rounded-2xl font-bold border-0 shadow-xl shadow-violet-500/20"
          >
            <Plus size={18} />
            Novo Funcionário
          </Button>
        </div>

        {/* SEARCH */}

        <div className="flex items-center gap-3 mb-8 bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 backdrop-blur-xl shadow-lg">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar funcionário..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        {/* WORKERS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-[32px] overflow-hidden border border-violet-500/10 bg-[#111827] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30"
            >
              <div className="h-52 bg-black/30 overflow-hidden">
                {worker.avatar_url ? (
                  <img
                    src={worker.avatar_url}
                    alt={worker.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                    <ImageIcon size={42} />

                    <span className="text-sm">Sem avatar</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black truncate">
                      {worker.name}
                    </h3>

                    <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
                      <Phone size={14} />

                      {worker.phone || "Sem telefone"}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${
                      worker.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {worker.is_active ? "Ativo" : "Inativo"}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase size={15} className="text-violet-300" />

                    <span className="text-sm text-white/50">Serviços</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(worker.services || []).slice(0, 4).map((service) => (
                      <span
                        key={service.id}
                        className="px-3 py-1 rounded-full text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      >
                        {service.name}
                      </span>
                    ))}

                    {worker?.services?.length > 4 && (
                      <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/50 border border-white/10">
                        +{worker.services.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleOpenEdit(worker)}
                    className="h-12 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-2xl"
                  >
                    <Pencil size={16} />
                  </Button>

                  <Button
                    onClick={() => handleDelete(worker.id)}
                    className="h-12 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-2xl"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredWorkers.length === 0 && (
          <div className="text-center py-20 text-white/40">
            Nenhum funcionário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkersPage;
