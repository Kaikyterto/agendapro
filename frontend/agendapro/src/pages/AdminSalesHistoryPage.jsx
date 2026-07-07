import { useEffect, useMemo, useState } from "react";
import {
  History,
  Search,
  Loader2,
  Eye,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

import Button from "../components/Button";
import { getSalesHistory, getSaleHistoryById } from "../services/saleService";

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

export default function AdminSalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [search, setSearch] = useState("");

  const company = JSON.parse(localStorage.getItem("@AgendaPro:company"));
  const companyId = company?.id;

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
      setSelectedSale({ id });
      setLoadingDetails(true);

      const sale = await getSaleHistoryById(id);
      setSelectedSale(sale);
    } catch (error) {
      setSelectedSale(null);
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
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center p-4">
        <Loader2 size={40} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20 shrink-0">
              <History className="text-violet-300 w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Histórico de Vendas
              </h1>
              <p className="text-sm sm:text-base text-white/50">
                Todas as vendas realizadas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        <div className="bg-[#111827] rounded-2xl sm:rounded-3xl border border-violet-500/10 p-4 sm:p-5 flex items-center gap-3">
          <Search size={18} className="text-violet-300 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente ou pedido..."
            className="bg-transparent outline-none w-full text-sm sm:text-base placeholder:text-white/30"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-violet-500/10 bg-[#111827]">
          <table className="w-full min-w-[800px] table-auto">
            <thead>
              <tr className="border-b border-white/10 text-white/70 text-sm">
                <th className="text-left p-4 sm:p-5 font-semibold">Pedido</th>
                <th className="text-left p-4 sm:p-5 font-semibold">Cliente</th>
                <th className="text-left p-4 sm:p-5 font-semibold">Telefone</th>
                <th className="text-left p-4 sm:p-5 font-semibold">Valor</th>
                <th className="text-left p-4 sm:p-5 font-semibold">
                  Pagamento
                </th>
                <th className="text-left p-4 sm:p-5 font-semibold">Status</th>
                <th className="p-4 sm:p-5 w-16"></th>
              </tr>
            </thead>

            <tbody className="text-sm sm:text-base">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="p-4 sm:p-5 font-bold">#{sale.id}</td>
                  <td className="p-4 sm:p-5 text-white/90">
                    {sale.customer?.name}
                  </td>
                  <td className="p-4 sm:p-5 text-white/60 whitespace-nowrap">
                    {sale.customer?.phone}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-violet-300 whitespace-nowrap">
                    R${" "}
                    {Number(sale.total).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-4 sm:p-5 uppercase text-xs tracking-wider text-white/70">
                    {sale.payment_method}
                  </td>
                  <td className="p-4 sm:p-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-block whitespace-nowrap ${
                        statusColor[sale.status]
                      }`}
                    >
                      {statusLabel[sale.status]}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-right">
                    <Button
                      onClick={() => openSale(sale.id)}
                      className="bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl p-2 hover:bg-violet-500/20 transition"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-violet-500/20 p-5 sm:p-6 my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-6 shrink-0">
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-black truncate">
                  Pedido #{selectedSale.id}
                </h2>
                <p className="text-sm text-white/40 truncate">
                  {selectedSale.customer_name || "Carregando..."}
                </p>
              </div>

              <Button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl shrink-0"
              >
                Fechar
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-violet-400" size={32} />
                </div>
              ) : (
                selectedSale.products?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl sm:rounded-2xl border border-white/10 bg-[#111827] p-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center"
                  >
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base break-words">
                        {item.name}
                      </h3>
                      <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                        Quantidade: {item.quantity}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                      <span className="text-xs sm:text-sm text-white/40">
                        R${" "}
                        {Number(item.unit_price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        un
                      </span>
                      <strong className="text-sm sm:text-base text-violet-300">
                        R${" "}
                        {Number(item.total_price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
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

function Card({ title, value, icon, className = "" }) {
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border border-violet-500/10 bg-[#111827] p-4 sm:p-5 flex justify-between items-center gap-4 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-white/50 text-xs sm:text-sm font-medium truncate">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl font-black mt-1 truncate">
          {value}
        </h3>
      </div>

      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
        {icon}
      </div>
    </div>
  );
}
