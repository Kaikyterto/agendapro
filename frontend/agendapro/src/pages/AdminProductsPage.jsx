import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Boxes,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

import Button from "../components/Button";
import { uploadImage } from "../services/upload";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsDashboard,
} from "../services/products";

const initialForm = {
  name: "",
  description: "",
  value: "",
  image_url: "",
  active: true,
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Gerencia o ciclo de vida do preview de imagem para evitar vazamento de memória no mobile
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsData, dashboardData] = await Promise.all([
        getProducts(),
        getProductsDashboard(),
      ]);

      const normalizedProducts = Array.isArray(productsData)
        ? productsData.map((product) => ({
            ...product,
            value: product.value ?? product.price ?? 0,
            active: typeof product.active === "boolean" ? product.active : true,
          }))
        : [];

      setProducts(normalizedProducts);
      setDashboard(dashboardData || null);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) =>
        product?.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.id - a.id);
  }, [products, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingProduct(null);
    setImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);

    setForm({
      name: product?.name || "",
      description: product?.description || "",
      value: product?.value || "",
      image_url: product?.image_url || "",
      active: typeof product?.active === "boolean" ? product.active : true,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("O nome do produto é obrigatório");
        return;
      }

      if (!form.value || Number(form.value) <= 0) {
        setError("Informe um valor válido");
        return;
      }

      let imageUrl = form.image_url;

      if (imageFile) {
        setUploadingImage(true);
        try {
          const upload = await uploadImage(imageFile, "products");
          imageUrl = upload.url;
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
        description: form.description.trim(),
        image_url: imageUrl || null,
        value: Number(form.value),
        active: form.active,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setSuccess("Produto actualizado com sucesso!");
      } else {
        await createProduct(payload);
        setSuccess("Produto criado com sucesso!");
      }

      await loadData();

      setTimeout(() => {
        handleCloseModal();
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Deseja realmente remover este produto?");
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Erro ao remover produto");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="animate-spin text-[#c084fc]" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* HEADER RESPONSIVO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10 shrink-0">
              <Package size={26} className="text-violet-300" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent truncate">
                Produtos
              </h1>
              <p className="text-white/50 text-xs sm:text-sm mt-1 truncate">
                Gerencie os produtos da sua empresa
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white h-12 sm:h-14 px-6 rounded-2xl font-bold border-0 shadow-xl shadow-violet-500/20 w-full sm:w-auto justify-center shrink-0"
          >
            <Plus size={18} />
            Novo Produto
          </Button>
        </div>

        {/* DASHBOARD RESPONSIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Faturamento"
            value={`R$ ${Number(dashboard?.revenue || 0).toFixed(2)}`}
            icon={<DollarSign size={20} />}
          />

          <DashboardCard
            title="Vendas"
            value={dashboard?.sales_count || 0}
            icon={<ShoppingCart size={20} />}
          />

          <DashboardCard
            title="Produtos Vendidos"
            value={dashboard?.products_sold || 0}
            icon={<Boxes size={20} />}
          />

          <DashboardCard
            title="Ticket Médio"
            value={`R$ ${Number(dashboard?.average_ticket || 0).toFixed(2)}`}
            icon={<TrendingUp size={20} />}
          />
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-8 bg-[#111827] border border-violet-500/10 rounded-3xl px-4 sm:px-5 h-14 sm:h-16 backdrop-blur-xl shadow-lg">
          <Search size={18} className="text-violet-300 shrink-0" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30 text-sm sm:text-base"
          />
        </div>

        {/* GRID DE PRODUTOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-[28px] sm:rounded-[32px] overflow-hidden border border-violet-500/10 bg-[#111827] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 flex flex-col h-full"
            >
              <div className="aspect-video bg-black/30 overflow-hidden relative w-full shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                    <ImageIcon size={36} />
                    <span className="text-xs">Sem imagem</span>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <h3 className="text-lg sm:text-xl font-black truncate flex-1">
                      {product.name}
                    </h3>

                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap border shrink-0 ${
                        product.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </div>
                  </div>

                  <p className="text-white/50 text-xs sm:text-sm mb-4 line-clamp-2 h-9 sm:h-10 overflow-hidden break-words">
                    {product.description || "Sem descrição"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 bg-black/10 p-3 rounded-2xl gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/40 text-[10px] uppercase font-semibold truncate">
                        Valor
                      </p>
                      <h4 className="text-lg sm:text-xl font-black text-violet-300 truncate">
                        R$ {Number(product.value || 0).toFixed(2)}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-white/40 text-[10px] uppercase font-semibold">
                        Vendidos
                      </p>
                      <h4 className="text-base font-bold">
                        {product?.sales_count ||
                          product?.sales?.total_quantity ||
                          0}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleOpenEdit(product)}
                      className="h-11 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-xl sm:rounded-2xl justify-center"
                    >
                      <Pencil size={15} />
                    </Button>

                    <Button
                      onClick={() => handleDelete(product.id)}
                      className="h-11 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-xl sm:rounded-2xl justify-center"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-white/40 text-sm">
            Nenhum produto encontrado.
          </div>
        )}

        {/* MODAL RESPONSIVO */}
        {openModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl my-auto rounded-[24px] sm:rounded-[32px] border border-violet-500/20 bg-[#0f172a] p-5 sm:p-6 shadow-2xl shadow-violet-500/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-start justify-between gap-4 mb-6 sticky top-0 bg-[#0f172a] pb-2 z-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>
                  <p className="text-white/40 text-xs sm:text-sm mt-1">
                    Preencha as informações abaixo
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs sm:text-sm text-white/60 mb-2 block font-medium">
                      Nome
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#111827] border border-white/10 px-4 outline-none focus:border-violet-400 transition-all text-sm text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs sm:text-sm text-white/60 mb-2 block font-medium">
                      Descrição
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-xl sm:rounded-2xl bg-[#111827] border border-white/10 px-4 py-3 sm:py-4 outline-none resize-none focus:border-violet-400 transition-all text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-white/60 mb-2 block font-medium">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.value}
                      onChange={(e) => handleChange("value", e.target.value)}
                      required
                      className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#111827] border border-white/10 px-4 outline-none focus:border-violet-400 transition-all text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-white/60 mb-2 block font-medium">
                      Imagem do Produto
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                        }
                      }}
                      className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#111827] border border-white/10 px-4 py-2 text-xs sm:text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-500/20 file:text-violet-300"
                    />
                  </div>
                </div>

                {(previewUrl || form.image_url) && (
                  <div className="rounded-2xl overflow-hidden border border-violet-500/20 max-h-48 w-full relative aspect-video bg-black/20">
                    <img
                      src={previewUrl || form.image_url}
                      alt="Preview"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-[#111827] border border-white/10 px-4 h-12 sm:h-14">
                  <span className="text-xs sm:text-sm text-white/70">
                    Produto ativo
                  </span>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleChange("active", e.target.checked)}
                    className="w-5 h-5 accent-violet-500 cursor-pointer"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white rounded-xl sm:rounded-2xl font-bold mt-2 disabled:opacity-60 border-0 justify-center text-sm sm:text-base text-center"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Salvando...
                    </span>
                  ) : editingProduct ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Produto"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon }) => {
  return (
    <div className="rounded-[24px] sm:rounded-[28px] border border-violet-500/10 bg-[#111827] p-4 sm:p-5 shadow-xl shadow-black/20 w-full min-w-0 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xs sm:text-sm text-white/50 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mt-1 text-white truncate">
          {value}
        </h3>
      </div>
    </div>
  );
};

export default AdminProductsPage;
