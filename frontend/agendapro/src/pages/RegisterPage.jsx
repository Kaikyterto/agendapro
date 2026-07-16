// RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerService } from "../services/auth";

// Ícones adicionados para a parte do cartão
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
} from "lucide-react";

import { uploadImage } from "../services/upload";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    logoFile: null,
  });

  // Novos estados para o Cartão de Crédito
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
    // Altera o título da página com base na etapa
    document.title =
      currentStep === 1
        ? "Crie sua conta | Kromis"
        : "Assinatura | Dados do Cartão | Kromis";
  }, [currentStep]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handler focado nos dados do cartão (apenas números para os campos de número/cvv)
  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{4})(?=\d)/g, "$1 "); // Adiciona espaços a cada 4 dígitos
    } else if (name === "expirationMonth" || name === "expirationYear") {
      formattedValue = value.replace(/\D/g, ""); // Apenas números
    } else if (name === "securityCode") {
      formattedValue = value.replace(/\D/g, ""); // Apenas números
    } else if (name === "docNumber") {
      formattedValue = value.replace(/\D/g, ""); // Apenas números
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

    // Avança para a etapa de pagamento
    setCurrentStep(2);
  };

  // ========================================================
  // STEP 2: FINALIZE REGISTER & PROCESS CARD PAYMENT (Checkout Transparente)
  // ========================================================
  const handleFinalizeRegisterAndPayment = async (e) => {
    e.preventDefault();
    setError("");
    setPaymentStatus(null);
    setPaymentMessage("");

    // 1. Validações básicas do cartão no front
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

    if (cardData.cardNumber.replace(/\s/g, "").length !== 16) {
      return setError("O número do cartão deve conter 16 dígitos.");
    }

    if (
      cardData.expirationMonth.length !== 2 ||
      parseInt(cardData.expirationMonth) > 12
    ) {
      return setError("Mês de validade inválido.");
    }

    if (cardData.expirationYear.length !== 2) {
      return setError("Ano de validade inválido.");
    }

    if (cardData.securityCode.length < 3) {
      return setError("CVV inválido.");
    }

    try {
      setIsLoading(true);

      // --- ETAPA A: UPLOAD DA LOGO ---
      let uploadedLogoUrl = "";
      if (formData.logoFile) {
        const uploadResult = await uploadImage(formData.logoFile, "logos");
        uploadedLogoUrl = uploadResult?.url || uploadResult;
      }

      // --- ETAPA B: GERAÇÃO DO TOKEN DO CARTÃO (Via API Direta) ---
      // Como não estamos usando iframes ("Fields"), fazemos uma requisição direta para a API do Mercado Pago
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

      const response = await fetch(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${publicKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            card_number: cardData.cardNumber.replace(/\s/g, ""), // Remove espaços
            cardholder: {
              name: cardData.cardholderName.toUpperCase(),
              identification: {
                type: cardData.docType,
                number: cardData.docNumber,
              },
            },
            expiration_month: parseInt(cardData.expirationMonth, 10),
            expiration_year: parseInt(`20${cardData.expirationYear}`, 10),
            security_code: cardData.securityCode,
          }),
        }
      );

      const tokenData = await response.json();

      if (!response.ok || !tokenData.id) {
        console.error("Erro MP API:", tokenData);
        throw new Error(
          tokenData.cause?.[0]?.description ||
            "Erro ao processar dados do cartão com o Mercado Pago."
        );
      }

      const cardToken = tokenData.id;

      // --- ETAPA C: ENVIA REGISTRO E PAGAMENTO AO BACKEND ---
      // Nosso serviço auth.js/registerService agora espera receber também o cardToken
      // No seu RegisterPage.jsx:
      const responseData = await registerService({
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        logo: uploadedLogoUrl,
        cardToken: cardToken,
        installments: 1,
        description: "Assinatura Mensal Kromis",
        docType: cardData.docType,
        docNumber: cardData.docNumber,
      });

      // --- ETAPA D: TRATA RESPOSTA DE PAGAMENTO ---
      const paymentStatusBackend = responseData.payment.status;
      setPaymentStatus(paymentStatusBackend);

      if (paymentStatusBackend === "approved") {
        // Se aprovado, limpamos os dados sensíveis do cartão do estado
        setCardData({
          cardholderName: "",
          cardNumber: "",
          securityCode: "",
          expirationMonth: "",
          expirationYear: "",
          docType: "CPF",
          docNumber: "",
        });

        // Redireciona para onde a empresa configurará o espaço
        setTimeout(() => {
          navigate("/configurar-espaco", {
            state: {
              company: responseData.company,
              subscription: responseData.subscription,
            },
          });
        }, 1500);
      } else {
        // Trata pagamentos rejeitados ou em análise
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
    } catch (err) {
      console.error(err);
      // Erro geral na criação da conta ou na rede
      setError(err.message || "Erro ao processar assinatura e criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] relative flex items-center justify-center p-4 font-sans text-slate-200 overflow-hidden transform-gpu">
      {/* ================================================ */}
      {/* GLOW */}
      {/* ================================================ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[480px] relative">
        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Assine por apenas <span className="text-blue-500">29,90</span>
          </h1>

          <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
            Configure seu espaço na Kromis e personalize sua marca depois do
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
        <div className="bg-[#16191f]/80 backdrop-blur-xl border border-white/[0.08] p-7 rounded-3xl shadow-2xl transition-all duration-300">
          {/* TÍTULO DA ETAPA ATUAL */}
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            {currentStep === 1 ? (
              <>
                <Building2 size={20} className="text-slate-500" />
                Passo 1: Seus Dados da Conta
              </>
            ) : (
              <>
                <CreditCard size={20} className="text-blue-500" />
                Passo 2: Dados de Pagamento (Assinatura Recorrente)
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
                    E-mail
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
            {/* STEP 2: DADOS DE PAGAMENTO (CARTÃO) */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <>
                {/* EXPLICATIVO SEGURANÇA */}
                <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 px-4 py-3 rounded-2xl text-slate-400 text-xs mb-6">
                  <QrCode size={20} className="text-blue-500" />
                  <div>
                    <strong>Cobrança recorrente de R$ 29,90 por mês.</strong>{" "}
                    Cancelamento fácil a qualquer momento. Os dados do seu
                    cartão são processados em ambiente seguro diretamente pelo
                    Mercado Pago.
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

            {/* ========================================== */}
            {/* ERROR & PAYMENT STATUS MESSAGES */}
            {/* ========================================== */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </p>
            )}

            {paymentStatus === "approved" && (
              <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={18} />
                Assinatura confirmada com sucesso! Redirecionando...
              </p>
            )}

            {paymentStatus &&
              paymentStatus !== "approved" &&
              paymentMessage && (
                <p
                  className={`text-sm px-4 py-3 rounded-xl flex items-start gap-2 ${
                    paymentStatus === "rejected"
                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                      : "text-slate-400 bg-slate-500/10 border border-slate-500/20"
                  }`}
                >
                  {paymentStatus === "rejected" ? (
                    <XCircle size={18} className="mt-0.5" />
                  ) : (
                    <QrCode size={18} className="mt-0.5 text-blue-500" />
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
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                  className="col-span-1 border border-white/[0.08] hover:border-slate-500/40 hover:bg-slate-500/10 disabled:opacity-70 text-slate-400 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleFinalizeRegisterAndPayment}
                  className="col-span-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    "Assinando..."
                  ) : (
                    <>
                      Ativar Assinatura (R$ 29,90)
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
                Já possui uma conta configurada na Kromis?
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
    </div>
  );
};

export default RegisterPage;
