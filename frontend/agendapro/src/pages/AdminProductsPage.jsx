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
} from "lucide-react";

import Button from "../components/Button";

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

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsData, dashboardData] = await Promise.all([
        getProducts(),
        getProductsDashboard(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);

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
    setError("");
    setSuccess("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);

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

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        value: Number(form.value),
        active: form.active,
      };

      if (editingProduct) {
        const updatedProduct = await updateProduct(editingProduct.id, payload);

        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProduct.id
              ? {
                  ...product,
                  ...updatedProduct,
                }
              : product
          )
        );

        setSuccess("Produto atualizado com sucesso!");
      } else {
        const createdProduct = await createProduct(payload);

        setProducts((prev) => [createdProduct, ...prev]);

        setSuccess("Produto criado com sucesso!");
      }

      await loadData();

      setTimeout(() => {
        handleCloseModal();
      }, 800);
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
        <Loader2 className="animate-spin" size={42} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center">
              <Package size={30} />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black">Produtos</h1>

              <p className="text-white/50 mt-1">
                Gerencie os produtos da sua empresa
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-white text-black hover:bg-white/90 h-14 px-6 rounded-2xl font-bold"
          >
            <Plus size={18} />
            Novo Produto
          </Button>
        </div>

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

        <div className="flex items-center gap-3 mb-8 bg-white/5 border border-white/10 rounded-3xl px-5 h-16 backdrop-blur-xl">
          <Search size={18} className="text-white/40" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-transparent outline-none w-full text-white placeholder:text-white/30"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-[32px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <div className="aspect-video bg-black/20 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Package size={42} />
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
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      product.active
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/40 text-xs">Valor</p>

                    <h4 className="text-2xl font-black">
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
                    className="h-12 bg-white/10 hover:bg-white/15"
                  >
                    <Pencil size={16} />
                  </Button>

                  <Button
                    onClick={() => handleDelete(product.id)}
                    className="h-12 bg-red-500/10 hover:bg-red-500/20 text-red-300"
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

        {openModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#101317] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>

                  <p className="text-white/40 text-sm mt-1">
                    Preencha as informações abaixo
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Nome
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Descrição
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 outline-none resize-none focus:border-white/30 transition-all"
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
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    URL da imagem
                  </label>

                  <input
                    value={form.image_url}
                    onChange={(e) => handleChange("image_url", e.target.value)}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 h-14">
                  <span className="text-white/70">Produto ativo</span>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleChange("active", e.target.checked)}
                    className="w-5 h-5"
                  />
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
                  disabled={submitting}
                  className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-bold mt-4 disabled:opacity-60"
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
    <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="text-sm text-white/50">{title}</p>

      <h3 className="text-3xl font-black mt-2 break-words">{value}</h3>
    </div>
  );
};

export default AdminProductsPage;
