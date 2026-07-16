// RegisterPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { registerService, getSubscriptionStatus } from "../services/auth"; // Adicionado getSubscriptionStatus para polling

// Ícones atualizados
import {
  ArrowRight,
  LogIn,
  Mail,
  Lock,
  User,
  Building2,
  CreditCard,
  CalendarDays,
  Fingerprint,
  CheckCircle2,
  XCircle,
  QrCode,
  Loader2,
  Copy,
} from "lucide-react";

import { uploadImage } from "../services/upload";

/* 
  LEMBRETE: O script do Mercado Pago deve estar no index.html:
  <script src="https://sdk.mercadopago.com/js/v2"></script>
*/

const RegisterPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Conta, 2: Pagamento

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logoFile: null,
  });

  // Novos estados para seleção e dados de pagamento
  const [paymentMethod, setPaymentMethod] = useState("pix"); // 'pix' ou 'card'
  const [pixData, setPixData] = useState(null); // Armazena QR Code, código, paymentId, subscriptionId
  const [showPixModal, setShowPixModal] = useState(false);
  const [toast, setToast] = useState(""); // Para feedback de cópia

  const [cardData, setCardData] = useState({
    cardholderName: "",
    cardNumber: "",
    securityCode: "",
    expirationMonth: "",
    expirationYear: "",
    docType: "CPF",
    docNumber: "",
  });

  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null); // 'approved', 'rejected', 'in_process'
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    document.title =
      currentStep === 1
        ? "Crie sua conta | Kromis"
        : `Assinatura via ${
            paymentMethod === "pix" ? "Pix" : "Cartão"
          } | Kromis`;
  }, [currentStep, paymentMethod]);

  // ========================================================
  // POLLING DO PIX (Monitora pagamento da assinatura)
  // ========================================================
  useEffect(() => {
    // Só inicia o polling se o modal do Pix estiver aberto e tivermos o ID da assinatura
    if (!showPixModal || !pixData?.subscriptionId) return;

    const interval = setInterval(async () => {
      try {
        // Consulta o status da assinatura no backend (authService)
        const res = await getSubscriptionStatus(pixData.subscriptionId);

        // O backend deve retornar o status da assinatura do SaaS
        if (res.status === "active") {
          clearInterval(interval); // Pára o polling

          // Limpa estados e feedback visual
          setPixData(null);
          setShowPixModal(false);
          setPaymentStatus("approved");

          // Redireciona após confirmação
          setTimeout(() => {
            navigate("/configurar-espaco", {
              state: {
                company: res.company, // O backend deve retornar a empresa atualizada
                subscription: res.subscription, // O backend deve retornar a assinatura
              },
            });
          }, 1500);
        }
      } catch (err) {
        console.error("Erro no polling do Pix:", err);
      }
    }, 3000); // Consulta a cada 3 segundos

    // Função de limpeza: limpa o intervalo se o componente for desmontado ou modal fechar
    return () => clearInterval(interval);
  }, [showPixModal, pixData, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{4})(?=\d)/g, "$1 ");
    } else if (
      name === "expirationMonth" ||
      name === "expirationYear" ||
      name === "securityCode" ||
      name === "docNumber"
    ) {
      formattedValue = value.replace(/\D/g, "");
    }

    setCardData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  // ========================================================
  // STEP 1: VALIDATE ACCOUNT DATA
  // ========================================================
  const continueToPayment = (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.companyName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return setError("Preencha todos os campos da conta.");
    }

    if (formData.password.length < 6) {
      return setError("A senha deve possuir no mínimo 6 caracteres.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    setCurrentStep(2);
  };

  // ========================================================
  // STEP 2: FINALIZE REGISTER & PROCESS PAYMENT (PIX ou CARTÃO)
  // ========================================================
  const handleFinalizeRegisterAndPayment = async (e) => {
    e.preventDefault();
    setError("");
    setPaymentStatus(null);
    setPaymentMessage("");
    setPixData(null); // Limpa dados antigos de Pix

    try {
      setIsLoading(true);

      // --- ETAPA A: UPLOAD DA LOGO ---
      let uploadedLogoUrl = "";
      if (formData.logoFile) {
        const uploadResult = await uploadImage(formData.logoFile, "logos");
        uploadedLogoUrl = uploadResult?.url || uploadResult;
      }

      // Prepara os dados básicos para o backend
      const registerPayload = {
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        logo: uploadedLogoUrl,
        paymentMethod: paymentMethod, // Informa o método escolhido
        description: "Assinatura Mensal Kromis",
      };

      // --- ETAPA B: GERAÇÃO DO TOKEN (Se for Cartão) ---
      if (paymentMethod === "card") {
        // Validações do cartão
        if (
          !cardData.cardholderName ||
          !cardData.cardNumber ||
          !cardData.securityCode ||
          !cardData.expirationMonth ||
          !cardData.expirationYear ||
          !cardData.docNumber
        ) {
          return setError("Preencha todos os dados do cartão.");
        }

        // Inicializa e usa SDK do Mercado Pago no front (Checkout Transparente)
        const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

        const tokenData = {
          cardNumber: cardData.cardNumber.replace(/\s/g, ""),
          cardholderName: cardData.cardholderName,
          cardExpirationMonth: cardData.expirationMonth,
          cardExpirationYear: `20${cardData.expirationYear}`,
          securityCode: cardData.securityCode,
          identificationType: cardData.docType,
          identificationNumber: cardData.docNumber,
        };

        const tokenResponse = await mp.createToken(tokenData);
        const cardToken = tokenResponse.id;

        if (!cardToken) {
          throw new Error(
            "Erro ao processar dados do cartão com o Mercado Pago."
          );
        }

        // Adiciona o token seguro ao payload
        registerPayload.cardToken = cardToken;
        registerPayload.installments = 1;
      }

      // --- ETAPA C: ENVIA REGISTRO AO BACKEND ---
      // O backend deve lidar com a criação da empresa e a geração da cobrança (Pix ou Cartão)
      const responseData = await registerService(registerPayload);

      // --- ETAPA D: TRATA RESPOSTA DE PAGAMENTO ---

      // FLUXO DE CARTÃO DE CRÉDITO
      if (paymentMethod === "card") {
        const paymentStatusBackend = responseData.payment.status;
        setPaymentStatus(paymentStatusBackend);

        if (paymentStatusBackend === "approved") {
          setCardData({
            cardholderName: "",
            cardNumber: "",
            securityCode: "",
            expirationMonth: "",
            expirationYear: "",
            docType: "CPF",
            docNumber: "",
          });

          setTimeout(() => {
            navigate("/configurar-espaco", {
              state: {
                company: responseData.company,
                subscription: responseData.subscription,
              },
            });
          }, 1500);
        } else {
          if (paymentStatusBackend === "rejected") {
            setPaymentMessage(
              `O pagamento foi rejeitado: ${
                responseData.payment.status_detail ||
                "Verifique os dados ou contate seu banco."
              }`
            );
          } else if (paymentStatusBackend === "in_process") {
            setPaymentMessage(
              "O pagamento está em análise pelo Mercado Pago. Você receberá um e-mail com a confirmação."
            );
          }
        }
      }

      // FLUXO DE PIX
      else if (paymentMethod === "pix") {
        // O backend deve retornar os dados do Pix gerado para a assinatura
        if (!responseData.payment?.pix_code) {
          throw new Error("Erro ao gerar PIX para a assinatura.");
        }

        setPixData({
          pixCode: responseData.payment.pix_code,
          qrCodeBase64: responseData.payment.qr_code_base64,
          paymentId: responseData.payment.id,
          subscriptionId: responseData.subscription.id, // Necessário para o Polling
        });

        setShowPixModal(true); // Abre o modal para a empresa pagar
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao processar assinatura e criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden transform-gpu">
      {/* ================================================ */}
      {/* TOAST FEEDBACK (Cópia Pix) */}
      {/* ================================================ */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold z-[9999] shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-500" />
          {toast}
        </div>
      )}

      {/* ================================================ */}
      {/* GLOW */}
      {/* ================================================ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[500px] relative">
        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}
        <div className="flex flex-col items-center mb-8 transform-gpu transition-all duration-300">
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Assine por apenas <span className="text-blue-500">29,90</span>
          </h1>

          <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
            Configure seu espaço no Kromis e personalize sua marca depois do
            cadastro. Processamento seguro via Mercado Pago.
          </p>

          {/* STEP INDICATOR */}
          <div className="flex items-center gap-3 mt-6">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                currentStep >= 1 ? "bg-blue-600" : "bg-slate-700"
              }`}
            />
            <div
              className={`w-12 h-1 ${
                currentStep === 2 ? "bg-blue-600" : "bg-slate-700"
              }`}
            />
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                currentStep === 2 ? "bg-blue-600" : "bg-slate-700"
              }`}
            />
          </div>
        </div>

        {/* ============================================== */}
        {/* CARD */}
        {/* ============================================== */}
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-7 rounded-3xl shadow-2xl transition-all duration-300 transform-gpu relative">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            {currentStep === 1 ? (
              <>
                <Building2 size={20} className="text-slate-500" />
                Passo 1: Seus Dados da Conta
              </>
            ) : (
              <>
                <QrCode size={20} className="text-blue-500" />
                Passo 2: Pagamento da Assinatura
              </>
            )}
          </h2>

          <form className="space-y-4.5">
            {/* ======================================================== */}
            {/* STEP 1: DADOS DA CONTA */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <>
                {/* NAME */}
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">
                    Seu nome completo
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* COMPANY & LOGO */}
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">
                    Nome da empresa
                  </label>
                  <div className="relative mb-3">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Studio Beauty"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <label className="group relative flex flex-col items-center justify-center w-full min-h-[90px] border border-dashed border-white/[0.1] hover:border-blue-500/50 bg-[#0f1115]/50 hover:bg-blue-500/[0.02] rounded-xl p-3.5 cursor-pointer transition-all text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          logoFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    {formData.logoFile ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Building2 size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white max-w-[280px] truncate">
                            {formData.logoFile.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Clique para alterar a logo
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full group-hover:bg-blue-500/20 transition-all">
                          + Adicionar Logo
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Formatos aceitos: PNG, JPG ou SVG
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">
                    E-mail de acesso
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="nome@empresa.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">
                      Confirmar
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* CONTINUE BUTTON */}
                <button
                  type="submit"
                  onClick={continueToPayment}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                >
                  Continuar para Pagamento
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {/* ======================================================== */}
            {/* STEP 2: PAGAMENTO (SELEÇÃO, PIX E CARTÃO) */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <>
                {/* SELEÇÃO DO MÉTODO DE PAGAMENTO - NOVO FOCADO */}
                <div className="mt-2 mb-6">
                  <label className="text-xs text-white/60 mb-2.5 block">
                    Selecione como deseja pagar a assinatura:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`h-14 flex flex-col items-center justify-center border rounded-2xl gap-1 transition-all ${
                        paymentMethod === "pix"
                          ? "border-blue-600 bg-blue-600/10"
                          : "border-white/5 bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <QrCode
                        size={20}
                        className={
                          paymentMethod === "pix"
                            ? "text-blue-500"
                            : "text-white/60"
                        }
                      />
                      <span className="text-[11px] font-semibold">
                        PIX (R$ 29,90)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`h-14 flex flex-col items-center justify-center border rounded-2xl gap-1 transition-all ${
                        paymentMethod === "card"
                          ? "border-blue-600 bg-blue-600/10"
                          : "border-white/5 bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <CreditCard
                        size={20}
                        className={
                          paymentMethod === "card"
                            ? "text-blue-500"
                            : "text-white/60"
                        }
                      />
                      <span className="text-[11px] font-semibold">
                        Cartão (Recorrente)
                      </span>
                    </button>
                  </div>
                </div>

                {/* CONTEÚDO ESPECÍFICO DO PIX */}
                {paymentMethod === "pix" && (
                  <div className="flex items-center gap-3.5 bg-blue-500/5 border border-blue-500/10 px-4.5 py-3.5 rounded-2xl text-slate-400 text-xs mb-6 transform-gpu">
                    <QrCode size={24} className="text-blue-500 shrink-0" />
                    <div>
                      <strong>Pagamento único de R$ 29,90 via Pix.</strong>
                      <br />
                      Ao clicar em "Ativar Assinatura", geraremos o QR Code. A
                      empresa será ativada instantaneamente após o pagamento.
                      Você deverá renovar manualmente no próximo mês.
                    </div>
                  </div>
                )}

                {/* CONTEÚDO ESPECÍFICO DO CARTÃO */}
                {paymentMethod === "card" && (
                  <>
                    <div className="flex items-center gap-3.5 bg-blue-500/5 border border-blue-500/10 px-4.5 py-3.5 rounded-2xl text-slate-400 text-xs mb-6 transform-gpu">
                      <QrCode size={24} className="text-blue-500 shrink-0" />
                      <div>
                        <strong>
                          Cobrança recorrente de R$ 29,90 por mês.
                        </strong>
                        <br />
                        Os dados do cartão são processados em ambiente seguro
                        pelo Mercado Pago. Cancelamento fácil a qualquer momento
                        no painel.
                      </div>
                    </div>

                    {/* CARDHOLDER NAME */}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        Nome completo (como está no cartão)
                      </label>
                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type="text"
                          name="cardholderName"
                          placeholder="JOÃO A SILVA"
                          value={cardData.cardholderName}
                          onChange={handleCardChange}
                          className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* CARD NUMBER */}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        Número do Cartão de Crédito
                      </label>
                      <div className="relative">
                        <CreditCard
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={cardData.cardNumber}
                          onChange={handleCardChange}
                          className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* VALIDITY & CVV */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm text-slate-400 mb-1.5 block">
                            Val. (MM)
                          </label>
                          <div className="relative">
                            <CalendarDays
                              size={18}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                              type="text"
                              name="expirationMonth"
                              placeholder="01"
                              maxLength={2}
                              value={cardData.expirationMonth}
                              onChange={handleCardChange}
                              className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-11 pr-2 py-2.5 text-white outline-none focus:border-blue-500 transition-all text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-slate-400 mb-1.5 block">
                            Ano (AA)
                          </label>
                          <input
                            type="text"
                            name="expirationYear"
                            placeholder="24"
                            maxLength={2}
                            value={cardData.expirationYear}
                            onChange={handleCardChange}
                            className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-2 py-2.5 text-white outline-none focus:border-blue-500 transition-all text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">
                          CVV (Código Atrás)
                        </label>
                        <div className="relative">
                          <Fingerprint
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                          <input
                            type="text"
                            name="securityCode"
                            placeholder="123"
                            maxLength={4}
                            value={cardData.securityCode}
                            onChange={handleCardChange}
                            className="w-full bg-[#0f1115] border border-white/[0.05] rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DOC TYPE & NUMBER */}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        CPF ou CNPJ do Titular
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <select
                          name="docType"
                          value={cardData.docType}
                          onChange={handleCardChange}
                          className="col-span-1 bg-[#0f1115] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 transition-all text-xs font-semibold"
                        >
                          <option>CPF</option>
                          <option>CNPJ</option>
                        </select>
                        <input
                          type="text"
                          name="docNumber"
                          placeholder="Somente números"
                          maxLength={14}
                          value={cardData.docNumber}
                          onChange={handleCardChange}
                          className="col-span-3 w-full bg-[#0f1115] border border-white/[0.05] rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ========================================== */}
            {/* ERROR & PAYMENT STATUS MESSAGES */}
            {/* ========================================== */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2 transform-gpu">
                <XCircle size={18} />
                {error}
              </p>
            )}

            {paymentStatus === "approved" && (
              <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-xl flex items-center gap-2 transform-gpu">
                <CheckCircle2 size={18} />
                Assinatura confirmada! Redirecionando para o seu espaço...
              </p>
            )}

            {paymentStatus &&
              paymentStatus !== "approved" &&
              paymentMessage && (
                <p
                  className={`text-sm px-4 py-3 rounded-xl flex items-start gap-2 transform-gpu ${
                    paymentStatus === "rejected"
                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                      : "text-slate-400 bg-slate-500/10 border border-slate-500/20"
                  }`}
                >
                  {paymentStatus === "rejected" ? (
                    <XCircle size={18} className="mt-0.5shrink-0" />
                  ) : (
                    <QrCode
                      size={18}
                      className="mt-0.5 text-blue-500 shrink-0"
                    />
                  )}
                  <div>
                    <strong>
                      {paymentStatus === "rejected"
                        ? "Pagamento Recusado:"
                        : "Em Análise:"}
                    </strong>
                    <p>{paymentMessage}</p>
                  </div>
                </p>
              )}

            {/* ========================================== */}
            {/* SUBMIT BUTTON - STEP 2 */}
            {/* ========================================== */}
            {currentStep === 2 && (
              <div className="grid grid-cols-3 gap-2.5 pt-2 relative">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="col-span-1 border border-white/[0.08] hover:border-slate-500/40 hover:bg-slate-500/10 disabled:opacity-70 text-slate-400 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleFinalizeRegisterAndPayment}
                  className="col-span-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm relative overflow-hidden transform-gpu"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processando...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "card"
                        ? "Ativar Assinatura Recorrente"
                        : "Ativar Assinatura (Pix)"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* ============================================ */}
          {/* FOOTER */}
          {/* ============================================ */}
          {currentStep === 1 && (
            <div className="mt-7 pt-5 border-t border-white/[0.06] text-center transform-gpu">
              <p className="text-slate-500 text-sm mb-3.5 leading-relaxed max-w-xs mx-auto">
                Já possui uma conta configurada no Kromis?
              </p>

              <button
                onClick={() => navigate("/")}
                className="w-full border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/10 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <LogIn size={18} />
                Fazer login agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL PIX - NOVO FOCADO (Exibe QR Code de Assinatura) */}
      {/* ======================================================== */}
      {showPixModal && pixData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4 transform-gpu transition-all duration-300">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowPixModal(false)}
          />{" "}
          {/* Clica fora para fechar */}
          <div className="relative z-10 bg-[#16191f] w-full max-w-sm rounded-3xl p-6 border border-white/10 text-center shadow-2xl space-y-5">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <QrCode size={18} className="text-blue-500" />
                Assinatura via PIX
              </h2>
              <div className="text-[11px] font-semibold text-white bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                R$ 29,90
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Escaneie o QR Code abaixo no app do seu banco ou use o "Copia e
              Cola" para ativar sua conta instantaneamente.
            </p>

            {/* QR CODE BASE64 */}
            <div className="flex justify-center bg-white p-2 rounded-2xl border border-white/10 shadow-lg w-48 h-48 mx-auto relative overflow-hidden">
              {pixData.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX de Assinatura"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Loader2
                  className="animate-spin text-slate-500 mt-20"
                  size={24}
                />
              )}
            </div>

            {/* CÓPIA E COLA */}
            <textarea
              readOnly
              value={pixData.pixCode}
              rows={3}
              className="w-full p-3 rounded-xl bg-[#0f1115] text-[10px] resize-none outline-none border border-white/5 text-slate-500 select-all custom-scrollbar"
            />

            <div className="grid grid-cols-5 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowPixModal(false)}
                className="col-span-2 h-10 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:bg-white/5 transition-all"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixData.pixCode);
                  setToast("Código PIX de Assinatura copiado!");
                  setTimeout(() => setToast(""), 2500);
                }}
                className="col-span-3 h-10 rounded-xl font-bold bg-blue-600 text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={14} />
                Copiar código PIX
              </button>
            </div>

            {/* FEEDBACK AGUARDANDO */}
            <div className="flex items-center justify-center gap-2.5 text-slate-600 text-[11px] font-medium pt-2.5 border-t border-white/[0.06]">
              <Loader2 className="animate-spin" size={14} />
              Aguardando confirmação de pagamento...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
