import { useLocation } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();

  const payment = location.state?.payment;

  if (!payment) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Pagamento não encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center p-6">
      <div className="bg-[#16191f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-black text-white mb-2">Pagamento PIX</h1>

        <p className="text-slate-400 mb-6">
          Escaneie o QR Code abaixo para ativar sua assinatura.
        </p>

        <img
          src={`data:image/png;base64,${payment.qr_code_base64}`}
          alt="QR Code PIX"
          className="w-64 h-64 mx-auto rounded-2xl bg-white p-3"
        />

        <textarea
          readOnly
          value={payment.pix_code}
          className="w-full mt-6 bg-[#0f1115] border border-white/10 rounded-xl p-3 text-xs text-slate-300 h-32"
        />

        <button
          onClick={() => {
            navigator.clipboard.writeText(payment.pix_code);
          }}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
        >
          Copiar código PIX
        </button>

        <p className="text-xs text-slate-500 mt-6">
          Após o pagamento sua conta será ativada automaticamente.
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
