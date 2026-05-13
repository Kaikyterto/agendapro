import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Plus, X } from "lucide-react";
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

    setTimeout(() => setToast(""), 2500);
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
    <div className="min-h-screen bg-[#07090d] text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {/* NAV (CORRIGIDO) */}
      <Nav
        logo={company?.logo}
        showCart={true}
        cartCount={cart.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* PRODUTOS */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl"
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-bold truncate">{product.name}</h3>

                <p className="text-white/50 text-sm mt-1 line-clamp-2 min-h-[40px]">
                  {product.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xl font-black">
                    <span className="text-sm text-white/40 mr-1">R$</span>
                    {Number(product.value).toFixed(2)}
                  </span>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-3 rounded-2xl bg-[var(--primary)] hover:brightness-110 transition active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-24 right-4 z-[999]">
          <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl">
            {toast}
          </div>
        </div>
      )}

      {/* CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />

          <aside className="relative w-full max-w-md h-full bg-[#0d0f14] border-l border-white/10 flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between">
              <div>
                <h2 className="text-xl font-bold">Carrinho</h2>
                <p className="text-white/40 text-sm">{cart.length} itens</p>
              </div>

              <button onClick={() => setIsCartOpen(false)}>
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30">
                  Carrinho vazio
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <img
                      src={item.image_url}
                      className="w-16 h-16 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-[var(--primary)] font-bold">
                        R$ {Number(item.value).toFixed(2)}
                      </p>
                    </div>

                    <button onClick={() => removeFromCart(index)}>
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-white/10">
              <div className="flex justify-between mb-4">
                <span>Total</span>
                <span className="text-xl font-black">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                className="w-full h-14 rounded-2xl bg-[var(--primary)] font-bold disabled:opacity-40"
              >
                Finalizar compra
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
