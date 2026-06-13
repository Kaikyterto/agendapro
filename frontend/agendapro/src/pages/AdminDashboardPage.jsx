import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  CalendarDays,
  Target,
  Brain,
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

  // Estado para controlar responsividade dos eixos do Recharts sem quebrar o SSR/Hydration
  const [isMobile, setIsMobile] = useState(false);
  const [screenKey, setScreenKey] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      // Altera a key para forçar o Recharts a recalcular o container no mobile sem bugar
      setScreenKey((prev) => prev + 1);
    };

    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* HEADER */}
        <div className="text-left">
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent truncate">
            Business Intelligence
          </h1>
          <p className="text-white/50 mt-1 text-xs sm:text-sm">
            Métricas, previsões e insights do negócio.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* CARDS METRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Receita"
            value={`R$ ${Number(overview.monthly_revenue || 0).toLocaleString(
              "pt-BR",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`}
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

        {/* SEÇÃO GRÁFICO PRINCIPAL + OCUPAÇÃO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* REVENUE CHART */}
          <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-4 sm:p-6 border border-white/10 w-full min-w-0 overflow-hidden">
            <h3 className="font-bold mb-4 text-sm sm:text-base text-white/90">
              Receita últimos 30 dias
            </h3>

            <div className="h-60 sm:h-72 w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                key={`revenue-${screenKey}`}
              >
                <AreaChart
                  data={revenueChart}
                  margin={{
                    left: isMobile ? -35 : -25,
                    right: 5,
                    bottom: 0,
                    top: 10,
                  }}
                >
                  <defs>
                    <linearGradient id="violetFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.03)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    dy={10}
                    hide={isMobile}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    dx={-5}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
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
          <div className="bg-[#111827] rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col justify-center w-full min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-white/50 mb-1">
              Ocupação
            </h3>
            <div className="text-4xl sm:text-5xl font-black text-violet-300 tracking-tight truncate">
              {occupancyPercent}%
            </div>
            <p className="text-white/40 mt-1 text-xs sm:text-sm">
              {occupancy.booked_minutes || 0} min reservados
            </p>
          </div>
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RankingCard
            title="Top Serviços"
            data={topServices}
            field="appointments"
            screenKey={screenKey}
          />
          <RankingCard
            title="Top Produtos"
            data={topProducts}
            field="quantity"
            screenKey={screenKey}
          />
          <RankingCard
            title="Top Profissionais"
            data={topWorkers}
            field="appointments"
            screenKey={screenKey}
          />
        </div>

        {/* INSIGHTS + FORECAST */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INSIGHTS */}
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-violet-300 shrink-0" />
              <h3 className="font-bold text-sm sm:text-base">Insights</h3>
            </div>

            <div className="space-y-2.5">
              {insights.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition text-xs sm:text-sm leading-relaxed text-white/90 break-words"
                >
                  {item.message}
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-white/40 text-xs text-center py-4">
                  Nenhum insight disponível no momento.
                </p>
              )}
            </div>
          </div>

          {/* FORECAST */}
          <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 flex flex-col justify-between w-full min-w-0 gap-6">
            <div>
              <h3 className="font-bold mb-3 text-sm sm:text-base">Forecast</h3>
              <p className="text-white/50 text-xs sm:text-sm">
                Receita prevista
              </p>
              <h2 className="text-2xl sm:text-4xl font-black mt-1 text-violet-300 truncate">
                R${" "}
                {Number(forecast.predicted_revenue || 0).toLocaleString(
                  "pt-BR",
                  { minimumFractionDigits: 2 }
                )}
              </h2>
            </div>

            <p className="text-white/40 text-xs sm:text-sm bg-black/20 p-3 rounded-xl border border-white/5 w-fit">
              Confiança:{" "}
              <span className="text-emerald-400 font-bold">
                {forecast.confidence || 0}%
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =======================
    SUBCOMPONENTS
======================= */

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-[#111827] rounded-3xl p-5 border border-white/10 w-full min-w-0">
    <div className="flex justify-between items-center gap-3 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold truncate">
          {title}
        </p>
        <h3 className="text-lg sm:text-2xl font-black mt-1 text-white truncate">
          {value}
        </h3>
      </div>

      <div className="text-violet-300 bg-violet-500/10 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const RankingCard = ({ title, data, field, screenKey }) => (
  <div className="bg-[#111827] rounded-3xl p-4 sm:p-5 border border-white/10 w-full min-w-0 flex flex-col justify-between overflow-hidden">
    <div className="min-w-0 w-full">
      <h3 className="font-bold mb-3 text-sm sm:text-base truncate text-white/90">
        {title}
      </h3>

      <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
        {data.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex justify-between items-center py-1.5 px-2 rounded-xl hover:bg-white/5 transition text-xs gap-3 min-w-0"
          >
            <span className="text-white/70 truncate flex-1">{item.name}</span>
            <span className="text-violet-300 font-bold shrink-0">
              {item[field]}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-white/30 text-xs text-center py-4">Sem dados</p>
        )}
      </div>
    </div>

    {/* CONTAINER GRÁFICO OTIMIZADO PARA MOBILE */}
    <div className="h-28 mt-4 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer
        width="100%"
        height="100%"
        key={`ranking-${title}-${screenKey}`}
      >
        <BarChart
          data={data}
          margin={{ left: -45, right: 0, bottom: 0, top: 5 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
          <Bar
            dataKey={field}
            fill="#a855f7"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AdminDashboardPage;
