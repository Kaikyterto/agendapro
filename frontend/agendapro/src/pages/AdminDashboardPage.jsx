import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  CalendarDays,
  Users,
  Package,
  Brain,
  Target,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import {
  getDashboardOverview,
  getRevenueChart,
  getTopServices,
  getTopWorkers,
  getTopProducts,
  getOccupancy,
  getForecast,
  getInsights,
} from "../services/dashboardService";

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({});
  const [revenueChart, setRevenueChart] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [occupancy, setOccupancy] = useState({});
  const [forecast, setForecast] = useState({});
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [o, r, s, w, p, occ, f, i] = await Promise.all([
          getDashboardOverview(),
          getRevenueChart(),
          getTopServices(),
          getTopWorkers(),
          getTopProducts(),
          getOccupancy(),
          getForecast(),
          getInsights(),
        ]);

        setOverview(o || {});
        setRevenueChart(r || []);
        setTopServices(s || []);
        setTopWorkers(w || []);
        setTopProducts(p || []);
        setOccupancy(occ || {});
        setForecast(f || {});
        setInsights(i || []);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const occupancyPercent = useMemo(
    () => occupancy?.occupancy_rate || 0,
    [occupancy]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Business Intelligence</h1>
          <p className="text-white/50 mt-2">
            Métricas, previsões e insights do negócio.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Receita"
            value={`R$ ${overview.monthly_revenue || 0}`}
            icon={DollarSign}
          />
          <StatCard
            title="Crescimento"
            value={`${overview.revenue_growth || 0}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Agendamentos"
            value={overview.appointments || 0}
            icon={CalendarDays}
          />
          <StatCard
            title="Business Score"
            value={overview.business_score || 0}
            icon={Target}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-5 border border-white/10">
            <h3 className="font-bold mb-4">Receita últimos 30 dias</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="value" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
            <h3 className="font-bold mb-4">Ocupação</h3>
            <div className="text-5xl font-black">{occupancyPercent}%</div>
            <p className="text-white/50 mt-3">
              {occupancy.booked_minutes || 0} min reservados
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <RankingCard
            title="Top Serviços"
            data={topServices}
            field="appointments"
          />
          <RankingCard
            title="Top Produtos"
            data={topProducts}
            field="quantity"
          />
          <RankingCard
            title="Top Profissionais"
            data={topWorkers}
            field="appointments"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Brain />
              <h3 className="font-bold">Insights</h3>
            </div>

            <div className="space-y-3">
              {insights.map((item, index) => (
                <div key={index} className="p-4 rounded-2xl bg-white/5">
                  {item.message}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
            <h3 className="font-bold mb-4">Forecast</h3>

            <p className="text-white/50">Receita prevista</p>
            <h2 className="text-4xl font-black mt-2">
              R$ {forecast.predicted_revenue || 0}
            </h2>

            <p className="mt-4 text-white/60">
              Confiança: {forecast.confidence || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-white/50">{title}</p>
        <h3 className="text-3xl font-black mt-2">{value}</h3>
      </div>
      <Icon />
    </div>
  </div>
);

const RankingCard = ({ title, data, field }) => (
  <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
    <h3 className="font-bold mb-4">{title}</h3>

    {data.map((item) => (
      <div
        key={item.id}
        className="flex justify-between py-2 border-b border-white/5"
      >
        <span>{item.name}</span>
        <span>{item[field]}</span>
      </div>
    ))}

    <div className="h-40 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey={field} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AdminDashboardPage;
