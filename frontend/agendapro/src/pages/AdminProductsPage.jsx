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
  const [uploadingImage, setUploadingImage] = useState(false);

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

        setSuccess("Produto atualizado com sucesso!");
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
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <Package size={30} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Produtos
              </h1>

              <p className="text-white/50 mt-1">
                Gerencie os produtos da sua empresa
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white h-14 px-6 rounded-2xl font-bold border-0 shadow-xl shadow-violet-500/20"
          >
            <Plus size={18} />
            Novo Produto
          </Button>
        </div>

        {/* DASHBOARD */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Faturamento"
            value={`R$ ${Number(dashboard?.revenue || 0).toFixed(2)}`}
            icon={<DollarSign size={22} />}
          />

          <DashboardCard
            title="Vendas"
            value={dashboard?.sales_count || 0}
            icon={<ShoppingCart size={22} />}
          />

          <DashboardCard
            title="Produtos Vendidos"
            value={dashboard?.products_sold || 0}
            icon={<Boxes size={22} />}
          />

          <DashboardCard
            title="Ticket Médio"
            value={`R$ ${Number(dashboard?.average_ticket || 0).toFixed(2)}`}
            icon={<TrendingUp size={22} />}
          />
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-3 mb-8 bg-[#111827] border border-violet-500/10 rounded-3xl px-5 h-16 backdrop-blur-xl shadow-lg">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        {/* PRODUCTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-[32px] overflow-hidden border border-violet-500/10 bg-[#111827] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30"
            >
              <div className="aspect-video bg-black/30 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                    <ImageIcon size={40} />
                    <span className="text-sm">Sem imagem</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black truncate">
                      {product.name}
                    </h3>

                    <p className="text-white/50 text-sm mt-1 line-clamp-2">
                      {product.description || "Sem descrição"}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${
                      product.active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/40 text-xs">Valor</p>

                    <h4 className="text-2xl font-black text-violet-300">
                      R$ {Number(product.value || 0).toFixed(2)}
                    </h4>
                  </div>

                  <div className="text-right">
                    <p className="text-white/40 text-xs">Vendidos</p>

                    <h4 className="text-lg font-bold">
                      {product?.sales?.total_quantity || 0}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleOpenEdit(product)}
                    className="h-12 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-2xl"
                  >
                    <Pencil size={16} />
                  </Button>

                  <Button
                    onClick={() => handleDelete(product.id)}
                    className="h-12 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-2xl"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-white/40">
            Nenhum produto encontrado.
          </div>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[32px] border border-violet-500/20 bg-[#0f172a] p-6 shadow-2xl shadow-violet-500/10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-black">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>

                  <p className="text-white/40 text-sm mt-1">
                    Preencha as informações abaixo
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="min-w-[44px] h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60 mb-2 block">
                      Nome
                    </label>

                    <input
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      className="w-full h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 outline-none focus:border-violet-400 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60 mb-2 block">
                      Descrição
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      rows={5}
                      className="w-full rounded-2xl bg-[#111827] border border-white/10 px-4 py-4 outline-none resize-none focus:border-violet-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Valor
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.value}
                      onChange={(e) => handleChange("value", e.target.value)}
                      required
                      className="w-full h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 outline-none focus:border-violet-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
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
                      className="w-full h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 py-3 outline-none"
                    />
                  </div>
                </div>

                {(imageFile || form.image_url) && (
                  <div className="rounded-3xl overflow-hidden border border-violet-500/20">
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : form.image_url
                      }
                      alt="Preview"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-2xl bg-[#111827] border border-white/10 px-4 h-14">
                  <span className="text-white/70">Produto ativo</span>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleChange("active", e.target.checked)}
                    className="w-5 h-5 accent-violet-500"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="w-full h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white rounded-2xl font-bold mt-2 disabled:opacity-60 border-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando...
                    </>
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
    <div className="rounded-[28px] border border-violet-500/10 bg-[#111827] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-300">
          {icon}
        </div>
      </div>

      <p className="text-sm text-white/50">{title}</p>

      <h3 className="text-3xl font-black mt-2 break-words text-white">
        {value}
      </h3>
    </div>
  );
};

export default AdminProductsPage;
