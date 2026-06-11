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
    <div className="min-h-screen bg-[#07090d] text-white p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* HEADER */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent break-words">
            Business Intelligence
          </h1>
          <p className="text-white/50 mt-2 text-sm sm:text-base">
            Métricas, previsões e insights do negócio.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* CARDS RESPONSIVOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
            title="Score"
            value={overview.business_score || 0}
            icon={Target}
          />
        </div>

        {/* GRÁFICOS PRINCIPAIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* REVENUE */}
          <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-4 sm:p-5 border border-white/10 min-w-0">
            <h3 className="font-bold mb-4 text-base sm:text-lg">
              Receita últimos 30 dias
            </h3>

            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueChart}
                  margin={{ left: -20, right: 10, bottom: 0, top: 5 }}
                >
                  <defs>
                    <linearGradient id="violetFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  {/* Esconde os eixos no mobile puro se a tela for menor que 640px para evitar bagunça visual */}
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.4)"
                    tickLine={false}
                    fontSize={11}
                    hide={window.innerWidth < 480}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tickLine={false}
                    fontSize={11}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    fill="url(#violetFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OCUPAÇÃO */}
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 flex flex-col justify-center">
            <h3 className="font-bold mb-2 text-base sm:text-lg">Ocupação</h3>

            <div className="text-4xl sm:text-5xl font-black text-violet-300">
              {occupancyPercent}%
            </div>

            <p className="text-white/50 mt-2 text-sm">
              {occupancy.booked_minutes || 0} min reservados
            </p>
          </div>
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* INSIGHTS + FORECAST */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INSIGHTS */}
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={20} className="text-violet-300" />
              <h3 className="font-bold text-base sm:text-lg">Insights</h3>
            </div>

            <div className="space-y-3">
              {insights.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition text-sm sm:text-base"
                >
                  {item.message}
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-white/40 text-sm">
                  Nenhum insight disponível no momento.
                </p>
              )}
            </div>
          </div>

          {/* FORECAST */}
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="font-bold mb-4 text-base sm:text-lg">Forecast</h3>
              <p className="text-white/50 text-sm">Receita prevista</p>
              <h2 className="text-3xl sm:text-4xl font-black mt-2 text-violet-300 break-words">
                R$ {forecast.predicted_revenue || 0}
              </h2>
            </div>

            <p className="mt-4 text-white/60 text-xs sm:text-sm">
              Confiança: {forecast.confidence || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =======================
   COMPONENTS
======================= */

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 w-full min-w-0">
    <div className="flex justify-between items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-white/50 text-xs sm:text-sm uppercase tracking-wider font-semibold truncate">
          {title}
        </p>
        <h3 className="text-2xl sm:text-3xl font-black mt-1 break-words whitespace-normal">
          {value}
        </h3>
      </div>

      <div className="text-violet-300 bg-violet-500/10 p-3 rounded-2xl shrink-0">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const RankingCard = ({ title, data, field }) => (
  <div className="bg-[#111827] rounded-3xl p-4 sm:p-5 border border-white/10 w-full min-w-0">
    <h3 className="font-bold mb-4 text-base sm:text-lg truncate">{title}</h3>

    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {data.map((item, idx) => (
        <div
          key={item.id || idx}
          className="flex justify-between items-center py-2 px-2 rounded-xl hover:bg-white/5 transition text-sm gap-2"
        >
          <span className="text-white/80 truncate flex-1">{item.name}</span>
          <span className="text-violet-300 font-bold shrink-0">
            {item[field]}
          </span>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-white/30 text-xs text-center py-4">Sem dados</p>
      )}
    </div>

    <div className="h-36 mt-4 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ left: -35, right: 0, bottom: 0, top: 0 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <Bar
            dataKey={field}
            fill="#a855f7"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AdminDashboardPage;
