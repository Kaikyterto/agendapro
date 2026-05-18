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
  price: "",
  image_url: "",
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(initialForm);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.id - a.id);
  }, [products, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingProduct(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      image_url: product.image_url || "",
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...form,
          price: Number(form.price),
        });
      } else {
        await createProduct({
          ...form,
          price: Number(form.price),
        });
      }

      await loadData();

      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("Deseja realmente remover este produto?");

    if (!confirmed) return;

    try {
      await deleteProduct(id);

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090d] text-white">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
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
        <div className="flex items-center gap-3 mb-8 bg-white/5 border border-white/10 rounded-3xl px-5 h-16 backdrop-blur-xl">
          <Search size={18} className="text-white/40" />

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
                  <div>
                    <h3 className="text-xl font-black">{product.name}</h3>

                    <p className="text-white/50 text-sm mt-1 line-clamp-2">
                      {product.description || "Sem descrição"}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
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
                    <p className="text-white/40 text-xs">Preço</p>

                    <h4 className="text-2xl font-black">
                      R$ {Number(product.price).toFixed(2)}
                    </h4>
                  </div>

                  <div className="text-right">
                    <p className="text-white/40 text-xs">Vendidos</p>

                    <h4 className="text-lg font-bold">
                      {product.sales?.total_quantity || 0}
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

        {/* MODAL */}
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
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none"
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
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Preço
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    URL da imagem
                  </label>

                  <input
                    value={form.image_url}
                    onChange={(e) => handleChange("image_url", e.target.value)}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-bold mt-4"
                >
                  {editingProduct ? "Salvar Alterações" : "Criar Produto"}
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

      <h3 className="text-3xl font-black mt-2">{value}</h3>
    </div>
  );
};

export default AdminProductsPage;
