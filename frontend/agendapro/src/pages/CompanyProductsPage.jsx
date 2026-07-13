import { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  getCompanyBySlug,
  getCompanyProducts,
} from "../services/companyService";

import { createSale, getSaleStatus } from "../services/saleService";
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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [expandedDescriptions, setExpandedDescriptions] = useState({});

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

  useEffect(() => {
    if (!showPixModal || !pixData?.orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getSaleStatus(pixData.orderId);

        if (res.status === "paid") {
          clearInterval(interval);

          setPaymentConfirmed(true);
          setShowPixModal(false);

          setCart([]);
          setCustomerName("");
          setCustomerPhone("");
          setPixData(null);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showPixModal, pixData]);

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

  const openCheckout = () => {
    if (!cart.length) {
      setError("Carrinho vazio");
      return;
    }

    setError("");
    setIsCartOpen(false);
    setShowCustomerModal(true);
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
        amount: total,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="animate-spin text-white/60" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white transform-gpu">
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold z-[9999] shadow-2xl">
          {toast}
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none hidden sm:block">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-5 blur-[120px]" />
      </div>

      <Nav
        logo={company?.logo}
        showCart
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-3 py-6">
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#111827]/60 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between h-full shadow-lg transform-gpu"
            >
              <div className="w-full aspect-square bg-black/20 overflow-hidden relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-2 flex flex-col flex-1">
                <h3 className="font-semibold text-[11px] sm:text-xs line-clamp-2 leading-tight text-white/90 min-h-[28px] sm:min-h-[32px] break-words">
                  {product.name}
                </h3>

                {product.description && (
                  <div className="mt-1 mb-2">
                    <p
                      className={`text-[10px] sm:text-[11px] text-white/60 leading-relaxed break-words transition-all duration-300 ${
                        expandedDescriptions[product.id] ? "" : "line-clamp-3"
                      }`}
                    >
                      {product.description}
                    </p>

                    {product.description.length > 100 && (
                      <button
                        onClick={() => toggleDescription(product.id)}
                        className="mt-1 text-[10px] font-semibold text-[var(--primary)] hover:underline"
                      >
                        {expandedDescriptions[product.id]
                          ? "Ler menos"
                          : "Ler mais"}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 mt-auto">
                  <span className="text-[11px] sm:text-xs font-bold text-[var(--primary)] truncate">
                    R${" "}
                    {Number(product.value || 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>

                  <button
                    onClick={() => addToCart(product)}
                    className="h-7 sm:h-8 w-full flex items-center justify-center bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] transition-all rounded-lg text-white"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end transform-gpu">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsCartOpen(false)}
          />

          <aside
            className="relative z-10 w-full max-w-md bg-[#0d0f14] h-full p-5 flex flex-col shadow-2xl transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">Carrinho</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {cart.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-10">
                  Seu carrinho está vazio
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5"
                  >
                    <img
                      src={item.image_url}
                      className="w-12 h-12 rounded-lg object-cover bg-black/20 shrink-0"
                      alt={item.name}
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="text-xs font-medium text-white/90 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-semibold text-[var(--primary)]">
                        R${" "}
                        {(Number(item.value || 0) * item.quantity).toFixed(2)}
                      </p>

                      <div className="flex gap-3 mt-1 items-center bg-black/20 w-fit px-2 py-0.5 rounded-lg border border-white/5 text-xs">
                        <button
                          className="text-white/50 hover:text-white"
                          onClick={() => removeFromCart(item.id)}
                        >
                          -
                        </button>
                        <span className="font-bold text-[11px]">
                          {item.quantity}
                        </span>
                        <button
                          className="text-white/50 hover:text-white"
                          onClick={() => addToCart(item)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-white/60">Total</span>
                <span className="font-bold text-base">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={openCheckout}
                className="w-full bg-[var(--primary)] h-11 text-sm rounded-xl font-bold hover:opacity-90 transition-all"
              >
                Finalizar compra
              </button>
            </div>
          </aside>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4 transform-gpu">
          <div className="bg-[#0d0f14] p-5 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">
            <h2 className="text-base font-bold mb-3">Seus dados</h2>

            <div className="space-y-3">
              <input
                className="w-full p-2.5 bg-white/5 rounded-xl border border-white/5 outline-none text-xs focus:border-[var(--primary)] transition-all"
                placeholder="Nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="w-full p-2.5 bg-white/5 rounded-xl border border-white/5 outline-none text-xs focus:border-[var(--primary)] transition-all"
                placeholder="Telefone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-[11px] mt-2">{error}</p>}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="h-10 border border-white/10 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={checkoutLoading}
                onClick={handleCheckout}
                className="h-10 bg-[var(--primary)] rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
              >
                {checkoutLoading ? "Processando..." : "Comprar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentConfirmed && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1001] p-4">
          <div className="bg-[#0d0f14] w-full max-w-sm rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-5xl mb-3">✅</div>

            <h2 className="text-xl font-bold">Pagamento confirmado!</h2>

            <p className="text-white/60 mt-3 text-sm">
              Recebemos seu pagamento com sucesso.
              <br />
              Seu pedido foi confirmado e enviado para a empresa.
            </p>

            <button
              onClick={() => setPaymentConfirmed(false)}
              className="w-full mt-6 h-11 rounded-xl bg-[var(--primary)] font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showPixModal && pixData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4 transform-gpu">
          <div className="bg-[#0d0f14] w-full max-w-sm rounded-2xl p-5 border border-white/10 text-center shadow-2xl">
            <h2 className="text-base font-bold mb-4">Pagamento via PIX</h2>

            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-48 h-48 rounded-xl bg-white p-2"
              />
            </div>

            <textarea
              readOnly
              value={pixData.pixCode}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-white/5 text-[10px] resize-none outline-none border border-white/5 text-white/60 select-all"
            />

            <button
              onClick={() => {
                navigator.clipboard.writeText(pixData.pixCode);
                setToast("Código PIX copiado!");
                setTimeout(() => setToast(""), 2000);
              }}
              className="w-full mt-3 h-10 rounded-xl font-bold bg-[var(--primary)] text-xs hover:opacity-90"
            >
              Copiar código PIX
            </button>

            <button
              onClick={() => setShowPixModal(false)}
              className="w-full mt-2 h-10 rounded-xl border border-white/10 text-xs font-semibold text-white/60"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
