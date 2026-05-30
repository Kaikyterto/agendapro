import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Plus, X, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  getCompanyBySlug,
  getCompanyProducts,
} from "../services/companyService";

import { createSale } from "../services/saleService";
import Nav from "../components/Nav";

export default function CompanyProductsPage() {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [toast, setToast] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companyData, productsData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyProducts(slug),
        ]);

        setCompany(companyData);
        setProducts(productsData || []);

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
        console.error(error);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // =========================================================
  // CART (SEM DUPLICAR ITEM)
  // =========================================================
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });

    setToast(`${product.name} adicionado ao carrinho`);
    setTimeout(() => setToast(""), 2000);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.value || 0), 0);
  }, [cart]);

  // =========================================================
  // CHECKOUT
  // =========================================================
  const handleCheckout = async () => {
    if (!company?.id) {
      setError("Empresa inválida");
      return;
    }

    if (cart.length === 0) return;

    try {
      setCheckoutLoading(true);
      setError("");

      const payload = {
        company_id: company.id, // 🔥 importante (corrige backend)
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: 1,
        })),
        payment_method: "mercadopago",
      };

      const res = await createSale(payload);

      if (res?.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }

      throw new Error("Checkout inválido");
    } catch (err) {
      console.error(err);
      setError("Erro ao iniciar pagamento");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="animate-spin text-white/60" size={40} />
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {/* NAV */}
      <Nav
        logo={company?.logo}
        showCart
        cartCount={cart.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* PRODUCTS */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden hover:border-white/20 transition hover:-translate-y-1"
            >
              <div className="aspect-square">
                <img
                  src={product.image_url}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5">
                <h3 className="font-bold truncate">{product.name}</h3>

                <p className="text-white/50 text-sm mt-1 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex justify-between items-center mt-5">
                  <span className="font-black text-lg">
                    R$ {Number(product.value || 0).toFixed(2)}
                  </span>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-3 rounded-2xl bg-[var(--primary)] hover:brightness-110"
                  >
                    <Plus size={18} />
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

      {/* CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />

          <aside className="relative w-full max-w-md h-full bg-[#0d0f14] border-l border-white/10 flex flex-col">
            {/* HEADER */}
            <div className="p-5 border-b border-white/10 flex justify-between">
              <div>
                <h2 className="font-bold text-xl">Carrinho</h2>
                <p className="text-white/40 text-sm">{cart.length} itens</p>
              </div>

              <button onClick={() => setIsCartOpen(false)}>
                <X />
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30">
                  Carrinho vazio
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <img
                      src={item.image_url}
                      className="w-16 h-16 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-[var(--primary)] font-bold">
                        R$ {Number(item.value).toFixed(2)}
                      </p>
                    </div>

                    <button onClick={() => removeFromCart(item.id)}>
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-white/10">
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <div className="flex justify-between mb-4">
                <span>Total</span>
                <span className="font-black text-xl">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full h-14 rounded-2xl bg-[var(--primary)] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processando...
                  </>
                ) : (
                  "Finalizar compra"
                )}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
