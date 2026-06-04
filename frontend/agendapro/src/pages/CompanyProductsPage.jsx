import { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
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

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [showPixModal, setShowPixModal] = useState(false);

  // =========================
  // LOAD DATA
  // =========================
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
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // =========================
  // CART LOGIC
  // =========================
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      if (exists) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    setToast(`${product.name} adicionado`);
    setTimeout(() => setToast(""), 2000);
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const item = prev.find((p) => p.id === id);
      if (!item) return prev;

      if (item.quantity > 1) {
        return prev.map((p) =>
          p.id === id ? { ...p, quantity: p.quantity - 1 } : p
        );
      }

      return prev.filter((p) => p.id !== id);
    });
  };

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + Number(item.value || 0) * (item.quantity || 1),
      0
    );
  }, [cart]);

  // =========================
  // OPEN CHECKOUT MODAL
  // =========================
  const openCheckout = () => {
    if (!cart.length) {
      setError("Carrinho vazio");
      return;
    }

    setError("");
    setIsCartOpen(false);
    setShowCustomerModal(true);
  };

  // =========================
  // CHECKOUT
  // =========================
  const handleCheckout = async () => {
    try {
      if (!company?.id) {
        return setError("Empresa inválida");
      }

      if (!cart.length) {
        return setError("Carrinho vazio");
      }

      if (!customerName || !customerPhone) {
        return setError("Preencha nome e telefone");
      }

      setCheckoutLoading(true);
      setError("");

      const payload = {
        company_id: company.id,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity || 1,
        })),
        customer_name: customerName,
        phone: customerPhone,
        payment_method: "pix",
      };

      const res = await createSale(payload);

      console.log("PIX RESPONSE:", res);

      if (!res?.pix_code) {
        throw new Error("PIX não gerado");
      }

      setPixData({
        pixCode: res.pix_code,
        qrCodeBase64: res.qr_code_base64,
        paymentId: res.payment_id,
        orderId: res.order_id,
      });

      setShowCustomerModal(false);
      setShowPixModal(true);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao iniciar pagamento"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="animate-spin text-white/60" size={40} />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]" />
      </div>

      {showPixModal && pixData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#0d0f14] w-full max-w-md rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-center">
              Pagamento via PIX
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64 rounded-xl bg-white p-2"
              />
            </div>

            <textarea
              readOnly
              value={pixData.pixCode}
              rows={5}
              className="w-full p-3 rounded-xl bg-white/5 text-xs resize-none"
            />

            <button
              onClick={() => {
                navigator.clipboard.writeText(pixData.pixCode);
                setToast("Código PIX copiado!");
                setTimeout(() => setToast(""), 2000);
              }}
              className="w-full mt-3 h-11 rounded-xl font-bold bg-[var(--primary)]"
            >
              Copiar código PIX
            </button>

            <button
              onClick={() => setShowPixModal(false)}
              className="w-full mt-2 h-11 rounded-xl border border-white/10"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <Nav
        logo={company?.logo}
        showCart
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* PRODUCTS */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <img
                src={product.image_url}
                className="w-full aspect-square object-cover"
              />

              <div className="p-4">
                <h3 className="font-bold">{product.name}</h3>

                <div className="flex justify-between mt-3">
                  <span>R$ {Number(product.value).toFixed(2)}</span>

                  <button
                    onClick={() => addToCart(product)}
                    className="p-2 bg-[var(--primary)] rounded-xl"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsCartOpen(false)}
          />

          {/* SIDEBAR */}
          <aside
            className="relative z-10 w-full max-w-md bg-[#0d0f14] h-full p-5 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()} // 👈 impede fechar ao clicar dentro
          >
            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Carrinho</h2>
              <button onClick={() => setIsCartOpen(false)}>
                <X />
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-auto space-y-4">
              {cart.length === 0 ? (
                <p className="text-white/40">Carrinho vazio</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-white/5 p-3 rounded-xl"
                  >
                    <img
                      src={item.image_url}
                      className="w-14 h-14 rounded-lg object-cover"
                    />

                    <div className="flex-1">
                      <p>{item.name}</p>
                      <p className="text-[var(--primary)]">
                        R$ {(item.value * item.quantity).toFixed(2)}
                      </p>

                      <div className="flex gap-2 mt-2 items-center">
                        <button onClick={() => removeFromCart(item.id)}>
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button onClick={() => addToCart(item)}>+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TOTAL + CHECKOUT */}
            <div className="border-t border-white/10 pt-4">
              {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

              <div className="flex justify-between mb-3">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>

              <button
                onClick={openCheckout}
                className="w-full bg-[var(--primary)] h-12 rounded-xl font-bold"
              >
                Finalizar compra
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
          <div className="bg-[#0d0f14] p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Seus dados</h2>

            <input
              className="w-full mb-3 p-2 bg-white/5 rounded"
              placeholder="Nome"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <input
              className="w-full mb-4 p-2 bg-white/5 rounded"
              placeholder="Telefone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />

            <button
              disabled={checkoutLoading}
              onClick={handleCheckout}
              className="w-full bg-[var(--primary)] h-11 rounded-xl font-bold"
            >
              {checkoutLoading ? "Processando..." : "Comprar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
