import { useEffect, useMemo, useState } from "react";

import {
  Briefcase,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Clock,
  DollarSign,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

import Button from "../components/Button";

import { uploadImage } from "../services/upload";

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../services/service";

const initialForm = {
  name: "",
  description: "",
  duration: "",
  value: "",
  image_url: "",
};

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================
  const loadData = async () => {
    try {
      setLoading(true);

      const response = await getServices();

      // Extrai os dados independentemente de virem puros ou envelopados em .data
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setServices(rawList);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar serviços");
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
  const filteredServices = useMemo(() => {
    if (!Array.isArray(services)) return [];
    return services
      .filter((s) =>
        s?.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.id - a.id);
  }, [services, search]);

  // =========================================================
  // FORM HANDLERS
  // =========================================================
  const resetForm = () => {
    setForm(initialForm);
    setEditingService(null);
    setImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);

    const imgUrl = service?.image_url || service?.imageUrl || "";

    setForm({
      name: service?.name || "",
      description: service?.description || "",
      duration: service?.duration || "",
      value: service?.price || service?.value || "",
      image_url: imgUrl,
    });

    setImageFile(null);
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

      if (!form.duration || Number(form.duration) <= 0) {
        setError("Duração inválida");
        return;
      }

      const valorFinal = form.value || form.price;
      if (!valorFinal || Number(valorFinal) <= 0) {
        setError("Valor inválido");
        return;
      }

      let imageUrl = form.image_url;

      if (imageFile) {
        setUploadingImage(true);

        try {
          const upload = await uploadImage(imageFile, "services");
          imageUrl = upload.url;
        } catch (err) {
          console.error(err);
          setError("Erro ao enviar imagem");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        duration: Number(form.duration),
        price: Number(valorFinal),
        image_url: imageUrl || null,
      };

      if (editingService) {
        await updateService(editingService.id, payload);
        setSuccess("Serviço atualizado com sucesso!");
      } else {
        await createService(payload);
        setSuccess("Serviço criado com sucesso!");
      }

      await loadData();

      setTimeout(() => {
        handleCloseModal();
      }, 600);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar serviço");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Deseja realmente remover este serviço?");
    if (!confirmed) return;

    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao remover serviço");
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
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center">
              <Briefcase size={30} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black">Serviços</h1>
              <p className="text-white/50">Gerencie seus serviços</p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-14 px-6 rounded-2xl font-bold"
          >
            <Plus size={18} />
            Novo Serviço
          </Button>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-8 bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar serviço..."
            className="bg-transparent outline-none w-full"
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            // Varre todas as variações de chaves possíveis vindas do banco
            const imgUrl =
              service?.image_url || service?.imageUrl || service?.image || "";

            // LOG DE DIAGNÓSTICO: Abra o F12 no navegador para checar o que está chegando aqui
            console.log(`Serviço: ${service?.name} | URL Detectada:`, imgUrl);

            return (
              <div
                key={service.id}
                className="rounded-[32px] border border-violet-500/10 bg-[#111827] overflow-hidden"
              >
                {/* Container sem crossOrigin para evitar bloqueios de CORS do Supabase */}
                <div className="aspect-video bg-black/30 overflow-hidden relative w-full shrink-0">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={service.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <ImageIcon size={40} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black">{service.name}</h3>

                  <p className="text-white/50 text-sm mt-1">
                    {service.description || "Sem descrição"}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-white/40 text-xs">Preço</p>
                      <h4 className="text-violet-300 font-bold">
                        R${" "}
                        {Number(service.price || service.value || 0).toFixed(2)}
                      </h4>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs">Duração</p>
                      <h4 className="font-bold">{service.duration} min</h4>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <Button
                      onClick={() => handleOpenEdit(service)}
                      className="flex-1 h-12 bg-violet-500/10 text-violet-300"
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 h-12 bg-red-500/10 text-red-300"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY */}
        {filteredServices.length === 0 && (
          <div className="text-center py-20 text-white/40">
            Nenhum serviço encontrado
          </div>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-[#0f172a] rounded-[32px] p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-2">
                <h2 className="text-2xl font-black">
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </h2>

                <button
                  onClick={handleCloseModal}
                  className="text-white/70 hover:text-white"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70 ml-1">
                    Nome do Serviço <span className="text-fuchsia-400">*</span>
                  </label>
                  <input
                    placeholder="Ex: Corte de Cabelo Masculino"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full h-14 bg-[#111827] border border-white/5 focus:border-violet-500/50 outline-none rounded-2xl px-4 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70 ml-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Conte um pouco mais sobre o que inclui este serviço..."
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className="w-full h-28 bg-[#111827] border border-white/5 focus:border-violet-500/50 outline-none rounded-2xl p-4 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/70 ml-1">
                      Duração (min) <span className="text-fuchsia-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 45"
                      value={form.duration}
                      onChange={(e) => handleChange("duration", e.target.value)}
                      className="w-full h-14 bg-[#111827] border border-white/5 focus:border-violet-500/50 outline-none rounded-2xl px-4 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/70 ml-1">
                      Valor (R$) <span className="text-fuchsia-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 50"
                      value={form.value || form.price || ""}
                      onChange={(e) => handleChange("value", e.target.value)}
                      className="w-full h-14 bg-[#111827] border border-white/5 focus:border-violet-500/50 outline-none rounded-2xl px-4 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70 ml-1">
                    Imagem de Capa
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-300 hover:file:bg-violet-500/20 file:cursor-pointer cursor-pointer"
                  />
                </div>

                {(imageFile || form.image_url) && (
                  <img
                    src={
                      imageFile
                        ? URL.createObjectURL(imageFile)
                        : form.image_url
                    }
                    className="w-full h-52 object-cover rounded-2xl border border-white/5"
                  />
                )}

                {error && (
                  <p className="text-red-400 text-sm pl-1 font-medium">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-emerald-400 text-sm pl-1 font-medium">
                    {success}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar Serviço"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServicesPage;
