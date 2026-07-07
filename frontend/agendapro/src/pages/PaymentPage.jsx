import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { apiFetch } from "../services/api";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const savedPayment = JSON.parse(localStorage.getItem("@AgendaPro:payment"));

  const savedCompany = JSON.parse(localStorage.getItem("@AgendaPro:company"));

  const [payment, setPayment] = useState(
    location.state?.payment || savedPayment
  );

  const [company, setCompany] = useState(
    location.state?.company || savedCompany
  );

  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // ========================================================
  // SALVAR DADOS VINDOS DO LOGIN
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
  // GERAR PIX CASO NÃO TENHA
  // ========================================================
  useEffect(() => {
    const generatePix = async () => {
      if (payment) return;

      if (!company?.id) {
        console.error("Empresa não encontrada");

        navigate("/");

        return;
      }

      try {
        setLoadingPayment(true);

        const response = await apiFetch("/payments/pix", {
          method: "POST",
          body: JSON.stringify({
            company_id: company.id,
          }),
        });

        console.log("PIX GERADO:", response);

        setPayment(response);

        localStorage.setItem("@AgendaPro:payment", JSON.stringify(response));
      } catch (error) {
        console.error("Erro ao gerar PIX:", error);
      } finally {
        setLoadingPayment(false);
      }
    };

    generatePix();
  }, [company]);

  // ========================================================
  // COPIAR PIX
  // ========================================================
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payment.pix_code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  // ========================================================
  // VERIFICAR STATUS
  // ========================================================
  useEffect(() => {
    if (!company?.id) return;

    let interval;

    const checkStatus = async () => {
      try {
        const response = await apiFetch(`/payments/status/${company.id}`);

        if (response?.active) {
          clearInterval(interval);

          localStorage.removeItem("@AgendaPro:payment");

          localStorage.removeItem("@AgendaPro:payment_pending");

          localStorage.removeItem("@AgendaPro:company");

          navigate("/", {
            state: {
              success:
                "Pagamento aprovado com sucesso! Faça login para continuar.",
            },
          });
        }
      } catch (error) {
        console.log("Aguardando pagamento...");
      } finally {
        setCheckingPayment(false);
      }
    };

    checkStatus();

    interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [company, navigate]);

  // ========================================================
  // LOADING PIX
  // ========================================================
  if (loadingPayment) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" />
          Gerando PIX...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center p-6">
      <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2">Pagamento PIX</h1>

        <p className="text-slate-400 text-sm mb-6">
          Realize o pagamento para ativar sua assinatura.
        </p>

        {company && (
          <div className="mb-6 inline-flex bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
            Empresa:
            <span className="font-bold ml-1">{company.name}</span>
          </div>
        )}

        {payment && (
          <>
            <div className="bg-white rounded-2xl p-4 w-fit mx-auto">
              <img
                src={`data:image/png;base64,${payment.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            </div>

            <textarea
              readOnly
              value={payment.pix_code}
              className="w-full mt-6 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-xs text-slate-300 h-32 resize-none"
            />

            <button
              onClick={handleCopy}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={18} />
                  Código copiado!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copiar PIX
                </>
              )}
            </button>
          </>
        )}

        <div className="mt-6 text-slate-400 text-sm flex justify-center gap-2">
          {checkingPayment ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verificando pagamento...
            </>
          ) : (
            "Aguardando confirmação..."
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
