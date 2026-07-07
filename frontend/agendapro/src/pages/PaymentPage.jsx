import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { apiFetch } from "../services/api";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const payment = location.state?.payment;
  const company = location.state?.company;

  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // ========================================================
  // PAYMENT NOT FOUND
  // ========================================================
  useEffect(() => {
    if (!payment || !company) {
      navigate("/");
    }
  }, [payment, company, navigate]);

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
  // VERIFICA STATUS PAGAMENTO
  // ========================================================
  useEffect(() => {
    if (!company?.id) return;

    // Executa a primeira checagem imediatamente ao abrir a tela
    const checkStatus = async () => {
      try {
        const response = await apiFetch(`/payment/status/${company.id}`);
        console.log("Status do pagamento:", response);

        if (response?.active) {
          clearInterval(interval);

          // Limpa os estados de pendência do localStorage antes de voltar
          localStorage.removeItem("@AgendaPro:payment_pending");
          localStorage.removeItem("@AgendaPro:payment");

          navigate("/", {
            state: {
              success:
                "Pagamento aprovado com sucesso! Faça login para continuar.",
            },
          });
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Roda imediatamente
    checkStatus();

    // Cria o loop a cada 5 segundos
    const interval = setInterval(async () => {
      try {
        const response = await apiFetch(`/payment/status/${company.id}`);

        if (response?.active) {
          clearInterval(interval);

          localStorage.removeItem("@AgendaPro:payment_pending");
          localStorage.removeItem("@AgendaPro:payment");

          navigate("/", {
            state: {
              success:
                "Pagamento aprovado com sucesso! Faça login para continuar.",
            },
          });
        }
      } catch (error) {
        console.error("Erro no intervalo de verificação:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [company, navigate]);

  // ========================================================
  // RENDER SE NÃO HOUVER PAGAMENTO
  // ========================================================
  if (!payment) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-white flex items-center justify-center">
        <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">Pagamento não encontrado</h1>
          <p className="text-slate-400">
            Nenhuma informação de pagamento foi encontrada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center p-6">
      <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Pagamento PIX</h1>
          <p className="text-slate-400 text-sm">
            Escaneie o QR Code abaixo para ativar sua assinatura.
          </p>
          {company && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
              Empresa: <span className="font-semibold">{company.name}</span>
            </div>
          )}
        </div>

        {/* QR CODE */}
        <div className="bg-white rounded-2xl p-4 w-fit mx-auto">
          <img
            src={`data:image/png;base64,${payment.qr_code_base64}`}
            alt="QR Code PIX"
            className="w-64 h-64"
          />
        </div>

        {/* PIX CODE */}
        <textarea
          readOnly
          value={payment.pix_code}
          className="w-full mt-6 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-xs text-slate-300 h-32 resize-none outline-none"
        />

        {/* COPY BUTTON */}
        <button
          onClick={handleCopy}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 transition-all text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle2 size={18} /> Código copiado!
            </>
          ) : (
            <>
              <Copy size={18} /> Copiar código PIX
            </>
          )}
        </button>

        {/* PAYMENT STATUS */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          {checkingPayment ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verificando pagamento...
            </>
          ) : (
            <>Aguardando confirmação do pagamento...</>
          )}
        </div>

        {/* FOOTER */}
        <p className="text-xs text-slate-500 mt-6 leading-relaxed">
          Após o pagamento sua conta será ativada automaticamente. Você será
          redirecionado para o login assim que o pagamento for confirmado.
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
