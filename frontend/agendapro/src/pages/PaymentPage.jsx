import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "../services/api";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Recupera dados do localStorage se não vierem no State do Router
  const savedPayment = JSON.parse(localStorage.getItem("@AgendaPro:payment"));
  const savedCompany = JSON.parse(localStorage.getItem("@AgendaPro:company"));

  const [payment, setPayment] = useState(
    location.state?.payment || savedPayment
  );
  const [company, setCompany] = useState(
    location.state?.company || savedCompany
  );

  // Estados da Interface
  const [activeTab, setActiveTab] = useState("pix"); // 'pix' ou 'card'
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [loadingPixGeneration, setLoadingPixGeneration] = useState(false);
  const [loadingCardProcessing, setLoadingCardProcessing] = useState(false);
  const [uiError, setUiError] = useState("");
  const [uiSuccess, setUiSuccess] = useState(false);

  // Estados do Formulário de Cartão
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardExpirationMonth: "",
    cardExpirationYear: "",
    securityCode: "",
    cardholderName: "",
    identificationType: "CPF",
    identificationNumber: "",
    installments: "1",
  });

  // ========================================================
  // 1. SALVAR DADOS VINDOS DO LOGIN NO LOCALSTORAGE
  // ========================================================
  useEffect(() => {
    if (location.state?.payment) {
      setPayment(location.state.payment);
      localStorage.setItem(
        "@AgendaPro:payment",
        JSON.stringify(location.state.payment)
      );
    }

    if (location.state?.company) {
      setCompany(location.state.company);
      localStorage.setItem(
        "@AgendaPro:company",
        JSON.stringify(location.state.company)
      );
    }
  }, [location.state]);

  // ========================================================
  // 2. SEGURANÇA: GARANTIR QUE HÁ EMPRESA NA SESSÃO
  // ========================================================
  useEffect(() => {
    if (!company?.id && !savedCompany?.id) {
      console.error("Sessão de pagamento inválida: Empresa não encontrada.");
      navigate("/");
    }
  }, [company, savedCompany, navigate]);

  // ========================================================
  // 3. FLUXO PIX: GERAR CASO NÃO TENHA PAGAMENTO ATIVO
  // ========================================================
  useEffect(() => {
    const generatePix = async () => {
      // Se já existe um pagamento pendente (Pix vindo do login/storage), não gera outro
      if (payment || !company?.id) return;

      try {
        setLoadingPixGeneration(true);
        setUiError("");

        const response = await apiFetch("/payments/pix", {
          method: "POST",
          body: JSON.stringify({ company_id: company.id }),
        });

        if (response?.pix_code) {
          setPayment(response);
          localStorage.setItem("@AgendaPro:payment", JSON.stringify(response));
        } else {
          throw new Error("Resposta inválida ao gerar PIX.");
        }
      } catch (error) {
        console.error("Erro ao gerar PIX automático:", error);
        setUiError(
          "Não foi possível gerar um código PIX. Tente usar Cartão ou recarregue."
        );
      } finally {
        setLoadingPixGeneration(false);
      }
    };

    generatePix();
  }, [company, payment]);

  // ========================================================
  // 4. FLUXO PIX: COPIAR CÓDIGO
  // ========================================================
  const handleCopyPix = async () => {
    if (!payment?.pix_code) return;
    try {
      await navigator.clipboard.writeText(payment.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Falha ao copiar:", error);
    }
  };

  // ========================================================
  // 5. FLUXO CARTÃO (CORRIGIDO PARA SDK V2): PROCESSAR PAGAMENTO
  // ========================================================
  const handleCardPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!company?.id) return;

    setLoadingCardProcessing(true);
    setUiError("");
    setUiSuccess(false);

    try {
      // A. Inicializa SDK do Mercado Pago v2 (confirmando que está carregado no index.html)
      if (!window.MercadoPago) {
        throw new Error(
          "SDK do Mercado Pago não carregado. Verifique sua conexão e o index.html."
        );
      }

      const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;
      if (!PUBLIC_KEY)
        throw new Error(
          "Chave Pública do Mercado Pago não configurada no .env como VITE_MP_PUBLIC_KEY"
        );

      const mp = new window.MercadoPago(PUBLIC_KEY);

      // B. Gera Token do Cartão Seguramente usando o SDK v2
      // IMPORTANTE: Garantimos os formatos de CPF e Ano antes de enviar
      const cardTokenResponse = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ""), // Limpa espaços
        cardholderName: cardData.cardholderName.trim(), // Nome do titular
        cardExpirationMonth: cardData.cardExpirationMonth.replace(/\D/g, ""), // Apenas números
        cardExpirationYear: parseInt(
          `20${cardData.cardExpirationYear.replace(/\D/g, "").slice(-2)}`,
          10
        ), // Ano como 4 dígitos (ex: 2026)
        securityCode: cardData.securityCode.replace(/\D/g, ""), // Apenas números
        identificationType: cardData.identificationType, // CPF ou CNPJ
        identificationNumber: cardData.identificationNumber.replace(/\D/g, ""), // CPF sem formatação
      });

      if (!cardTokenResponse?.id) {
        throw new Error(
          "Dados do cartão inválidos ou recusados pelo Mercado Pago."
        );
      }

      // C. Coleta Device ID (Antifraude gerado pelo security.js no index.html)
      const deviceId = window.MP_DEVICE_SESSION_ID || "";

      // D. Envia para o Backend para processar a Assinatura (Rota de repagamento/alteração)
      // O BACKEND deve receber o cardToken e o deviceId
      const response = await apiFetch(
        `/payments/card-subscription/${company.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            token: cardTokenResponse.id, // O token gerado acima
            deviceId: deviceId, // O DeviceId para antifraude
            installments: parseInt(cardData.installments), // Número de parcelas
            email: company.email || "", // E-mail usado no cadastro/login
            // Documentação opcional para revalidação no backend
            docType: cardData.identificationType,
            docNumber: cardData.identificationNumber.replace(/\D/g, ""),
          }),
        }
      );

      // E. Trata Resposta do Backend
      if (response?.status === "approved" || response?.status === "active") {
        setUiSuccess(true);
        // Limpa pendências do localStorage
        localStorage.removeItem("@AgendaPro:payment");
        localStorage.removeItem("@AgendaPro:payment_pending");

        setTimeout(() => {
          navigate("/", {
            state: {
              success:
                "Assinatura ativada com sucesso! Faça login para continuar.",
            },
          });
        }, 3000);
      } else {
        // Trata recusas controladas retornadas pelo seu backend (cc_rejected, etc)
        throw new Error(
          `Pagamento não autorizado: ${
            response?.status_detail || "Verifique os dados ou use outro cartão."
          }`
        );
      }
    } catch (err) {
      console.error("Erro no processamento do cartão:", err);
      // Exibe o erro retornado pelo seu backend ou pelo SDK
      setUiError(
        err?.message || "Erro inesperado ao processar pagamento com cartão."
      );
    } finally {
      setLoadingCardProcessing(false);
    }
  };

  // ========================================================
  // 6. MONITORAR STATUS (Websocket/Polling para PIX)
  // ========================================================
  useEffect(() => {
    if (!company?.id) return;

    let interval;

    const checkStatus = async () => {
      try {
        const response = await apiFetch(`/payments/status/${company.id}`);

        if (response?.active) {
          clearInterval(interval);
          setUiSuccess(true);
          localStorage.removeItem("@AgendaPro:payment");
          localStorage.removeItem("@AgendaPro:payment_pending");

          navigate("/", {
            state: { success: "Pagamento aprovado via PIX! Faça login." },
          });
        }
      } catch (error) {
        // Silencioso: Aguardando pagamento...
      } finally {
        setCheckingPayment(false);
      }
    };

    checkStatus(); // Verifica imediatamente
    interval = setInterval(checkStatus, 5000); // Polling a cada 5s

    return () => clearInterval(interval);
  }, [company, navigate]);

  // ========================================================
  // RENDERIZAÇÃO: LOADING PIX GERATION
  // ========================================================
  if (loadingPixGeneration) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white font-sans">
        <div className="flex items-center gap-3 bg-[#16191f] p-6 rounded-2xl border border-white/5">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          Gerando código PIX...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl relative z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm mb-6"
          >
            <ArrowLeft size={16} /> Voltar ao Login
          </button>

          <div className="text-center mb-6 relative">
            <h1 className="text-2xl font-black text-white relative">
              Ativar Assinatura
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Sua empresa{" "}
              <span className="font-bold text-blue-400">
                {company?.name || "Kromis"}
              </span>{" "}
              está com pagamento pendente.
            </p>
          </div>

          {/* TABS SELECTOR */}
          <div className="grid grid-cols-2 gap-3 mb-6 bg-[#0f1115] p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("pix")}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-2.5 font-bold transition-all text-sm ${
                activeTab === "pix"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode size={18} /> Via Pix
            </button>
            <button
              onClick={() => setActiveTab("card")}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-2.5 font-bold transition-all text-sm ${
                activeTab === "card"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard size={18} /> Via Cartão
            </button>
          </div>

          {/* GLOBAL MESSAGES */}
          {uiError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex gap-2.5 items-center">
              <AlertTriangle size={20} className="shrink-0" />
              <span>{uiError}</span>
            </div>
          )}

          {uiSuccess && (
            <div className="mb-5 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-5 rounded-xl text-center">
              <CheckCircle2
                size={40}
                className="mx-auto mb-2.5 text-green-500"
              />
              <h3 className="font-bold text-lg text-white">
                Pagamento Confirmado!
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Sua assinatura está ativa. Redirecionando...
              </p>
            </div>
          )}

          {!uiSuccess && (
            <>
              {/* CONTENT: PIX */}
              {activeTab === "pix" && payment && (
                <div className="space-y-5 text-center">
                  {payment.qr_code_base64 ? (
                    <div className="bg-white p-3.5 rounded-2xl inline-block mx-auto shadow-inner border border-slate-200">
                      <img
                        src={`data:image/jpeg;base64,${payment.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-56 h-56"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#0f1115] border border-white/5 py-12 rounded-2xl text-slate-500">
                      <QrCode size={48} className="mx-auto mb-2" />
                      Falha ao carregar imagem do QR Code.
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-slate-400 text-xs">
                      Ou pague copiando o código abaixo:
                    </p>
                    <textarea
                      readOnly
                      value={payment.pix_code}
                      className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-xs text-slate-300 h-24 resize-none font-mono outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      className={`w-full font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 size={18} /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} /> Copiar Código PIX
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* CONTENT: CARTÃO */}
              {activeTab === "card" && (
                <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
                  {/* Nome do Titular */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      Nome impresso no Cartão
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="JOAO S SILVA"
                      value={cardData.cardholderName}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cardholderName: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Número do Cartão */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.cardNumber}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cardNumber: e.target.value
                            .replace(/\D/g, "")
                            .replace(/(.{4})/g, "$1 ")
                            .trim(),
                        })
                      }
                      className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 text-sm font-mono"
                    />
                  </div>

                  {/* Vencimento e CVC */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        Mês Exp.
                      </label>
                      <input
                        type="text"
                        required
                        maxLength="2"
                        placeholder="MM"
                        value={cardData.cardExpirationMonth}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            cardExpirationMonth: e.target.value.replace(
                              /\D/g,
                              ""
                            ),
                          })
                        }
                        className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-center text-white outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        Ano Exp.
                      </label>
                      <input
                        type="text"
                        required
                        maxLength="4"
                        placeholder="AAAA"
                        value={cardData.cardExpirationYear}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            cardExpirationYear: e.target.value.replace(
                              /\D/g,
                              ""
                            ),
                          })
                        }
                        className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-center text-white outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        CVC
                      </label>
                      <input
                        type="password"
                        required
                        maxLength="4"
                        placeholder="123"
                        value={cardData.securityCode}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            securityCode: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-center text-white outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Documento */}
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={cardData.identificationType}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          identificationType: e.target.value,
                        })
                      }
                      className="bg-[#0f1115] border border-white/5 rounded-xl px-3 py-3.5 text-white outline-none focus:border-blue-500 text-sm h-[48px]"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="CPF/CNPJ (somente números)"
                      colSpan={2}
                      value={cardData.identificationNumber}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          identificationNumber: e.target.value.replace(
                            /\D/g,
                            ""
                          ),
                        })
                      }
                      className="col-span-2 w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingCardProcessing}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2.5 transition-all text-sm"
                  >
                    {loadingCardProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />{" "}
                        Processando Cartão...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} /> Pagar R$ 29,90 com Cartão
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* STATUS FOOTER (Apenas para PIX) */}
          {activeTab === "pix" && payment && !uiSuccess && (
            <div className="mt-8 text-slate-500 text-xs flex justify-center items-center gap-2 border-t border-white/5 pt-5">
              {checkingPayment ? (
                <>
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  Verificando pagamento automaticamente...
                </>
              ) : (
                "Aguardando confirmação do banco (Polling ativo)..."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
