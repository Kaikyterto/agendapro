import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Plus, X, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getCompanyBySlug,
  getCompanyProducts,
} from "../services/companyService";

import Nav from "../components/Nav";

export default function CompanyProductsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companyData, productsData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyProducts(slug),
        ]);

        setCompany(companyData);
        setProducts(productsData);

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
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);

    setToast(`${product.name} adicionado ao carrinho`);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.value), 0);
  }, [cart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white selection:bg-[var(--primary)]">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />

        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <Nav logo={company?.logo} />

      {/* TOP ACTIONS */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 pt-8 flex items-center justify-between">
        {/* VOLTAR */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3"
        >
          <div
            className="
              w-12 h-12 rounded-2xl
              border border-white/10
              bg-white/5
              backdrop-blur-xl
              flex items-center justify-center
              transition-all duration-300
              group-hover:scale-105
              group-hover:border-white/20
              group-hover:bg-white/10
            "
          >
            <ArrowLeft className="w-5 h-5" />
          </div>

          <div className="hidden sm:block">
            <p className=" font-semibold">Voltar</p>
          </div>
        </button>

        {/* CARRINHO */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            relative
            p-4
            rounded-3xl
            bg-white/5
            border border-white/10
            backdrop-blur-xl
            hover:bg-white/10
            hover:border-white/20
            transition-all duration-300
            hover:scale-105
          "
        >
          <ShoppingCart className="w-6 h-6" />

          {cart.length > 0 && (
            <span
              className="
                absolute -top-1 -right-1
                min-w-[24px] h-6 px-1
                rounded-full
                text-[10px]
                font-black
                flex items-center justify-center
                border-2 border-[#07090d]
                shadow-xl
              "
              style={{
                backgroundColor: "var(--primary)",
              }}
            >
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Lista de Produtos */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="
                group
                bg-white/5
                border border-white/10
                rounded-[32px]
                overflow-hidden
                hover:border-white/20
                transition-all duration-300
                hover:-translate-y-1
                backdrop-blur-xl
              "
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold truncate">{product.name}</h3>

                <p className="text-white/50 text-sm mt-1 line-clamp-2 min-h-[40px]">
                  {product.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-2xl font-black">
                    <span className="text-sm font-medium text-white/40 mr-1">
                      R$
                    </span>

                    {Number(product.value).toFixed(2)}
                  </span>

                  <button
                    onClick={() => addToCart(product)}
                    className="
                      p-3
                      rounded-2xl
                      bg-[var(--primary)]
                      hover:brightness-110
                      transition
                      active:scale-95
                    "
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      {/* TOAST */}
      {toast && (
        <div className="fixed top-28 right-6 z-[999] animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className="
        px-5 py-4
        rounded-2xl
        border border-white/10
        bg-white/10
        backdrop-blur-2xl
        shadow-2xl
        text-white
        font-medium
      "
          >
            {toast}
          </div>
        </div>
      )}
      {/* Modal Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <aside className="relative w-full max-w-md h-full bg-[#0d0f14] border-l border-white/10 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Seu Carrinho</h2>

                <p className="text-white/40 text-sm">
                  {cart.length} itens selecionados
                </p>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="
                      flex gap-4
                      p-3
                      rounded-2xl
                      bg-white/5
                      border border-white/5
                    "
                  >
                    <img
                      src={item.image_url}
                      className="w-20 h-20 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {item.name}
                      </h4>

                      <p className="text-[var(--primary)] font-bold mt-1">
                        R$ {Number(item.value).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-white/20 hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10">
              <div className="flex justify-between mb-6">
                <span className="text-white/60">Subtotal</span>

                <span className="text-2xl font-black">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                className="
                  w-full h-16 rounded-2xl
                  bg-[var(--primary)]
                  font-bold text-lg
                  hover:brightness-110
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  shadow-xl shadow-[var(--primary)]/20
                "
              >
                Finalizar Compra
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
