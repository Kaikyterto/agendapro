import { useEffect, useMemo, useState } from "react";
import {
  History,
  Search,
  Loader2,
  Eye,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import Button from "../components/Button";
import { getSalesHistory, getSaleHistoryById } from "../services/sales";

const statusColor = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabel = {
  paid: "Pago",
  pending: "Pendente",
  canceled: "Cancelado",
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [search, setSearch] = useState("");

  const companyId = localStorage.getItem("company_id");

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);

      const data = await getSalesHistory(companyId);

      setSales(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function openSale(id) {
    try {
      setLoadingDetails(true);

      const sale = await getSaleHistoryById(id);

      setSelectedSale(sale);
    } finally {
      setLoadingDetails(false);
    }
  }

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const customer = sale.customer?.name || "";

      return (
        customer.toLowerCase().includes(search.toLowerCase()) ||
        String(sale.id).includes(search)
      );
    });
  }, [sales, search]);

  const totalRevenue = sales
    .filter((s) => s.status === "paid")
    .reduce((acc, sale) => acc + Number(sale.total), 0);

  const totalSales = sales.length;

  const paidSales = sales.filter((s) => s.status === "paid").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
              <History className="text-violet-300" size={28} />
            </div>

            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Histórico de Vendas
              </h1>

              <p className="text-white/50">Todas as vendas realizadas</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <Card
            icon={<ShoppingCart size={20} />}
            title="Total de Vendas"
            value={totalSales}
          />

          <Card
            icon={<DollarSign size={20} />}
            title="Faturamento"
            value={`R$ ${totalRevenue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`}
          />

          <Card
            icon={<CheckCircle2 size={20} />}
            title="Pagas"
            value={paidSales}
          />
        </div>

        <div className="bg-[#111827] rounded-3xl border border-violet-500/10 p-5 mb-6 flex items-center gap-3">
          <Search size={18} className="text-violet-300" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente ou pedido..."
            className="bg-transparent outline-none w-full"
          />
        </div>

        <div className="overflow-x-auto rounded-3xl border border-violet-500/10 bg-[#111827]">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-5">Pedido</th>
                <th className="text-left p-5">Cliente</th>
                <th className="text-left p-5">Telefone</th>
                <th className="text-left p-5">Valor</th>
                <th className="text-left p-5">Pagamento</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5"></th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="p-5 font-bold">#{sale.id}</td>

                  <td className="p-5">{sale.customer.name}</td>

                  <td className="p-5">{sale.customer.phone}</td>

                  <td className="p-5 font-bold text-violet-300">
                    R${" "}
                    {Number(sale.total).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="p-5 uppercase">{sale.payment_method}</td>

                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${
                        statusColor[sale.status]
                      }`}
                    >
                      {statusLabel[sale.status]}
                    </span>
                  </td>

                  <td className="p-5">
                    <Button
                      onClick={() => openSale(sale.id)}
                      className="bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl"
                    >
                      <Eye size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0f172a] border border-violet-500/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black">
                  Pedido #{selectedSale.id}
                </h2>

                <p className="text-white/40">{selectedSale.customer_name}</p>
              </div>

              <Button onClick={() => setSelectedSale(null)}>Fechar</Button>
            </div>

            <div className="space-y-4">
              {loadingDetails ? (
                <Loader2 className="animate-spin" />
              ) : (
                selectedSale.products.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4 flex justify-between"
                  >
                    <div>
                      <h3 className="font-bold">{item.name}</h3>

                      <p className="text-white/50 text-sm">
                        Quantidade: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>R$ {item.unit_price.toLocaleString("pt-BR")}</p>

                      <strong>
                        R$ {item.total_price.toLocaleString("pt-BR")}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="rounded-3xl border border-violet-500/10 bg-[#111827] p-5 flex justify-between items-center">
      <div>
        <p className="text-white/50 text-sm">{title}</p>

        <h3 className="text-2xl font-black mt-1">{value}</h3>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-300">
        {icon}
      </div>
    </div>
  );
}
