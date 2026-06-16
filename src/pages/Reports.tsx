import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  Cell,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import type { Sale } from "@/types";
import { getWeekDates, getLast7DaysDates, getMonthDates, getPrevMonth, getNextMonth, getDayLabel, formatDate, todayStr } from "@/utils/date";
import { fmtMoney, round2 } from "@/utils/money";

type TimeRange = "today" | "week" | "last7days" | "month";

interface HotProduct {
  productId: string;
  productName: string;
  emoji: string;
  quantity: number;
}

interface DailyTrend {
  date: string;
  label: string;
  totalAmount: number;
}

export default function Reports() {
  const sales = useAppStore((s) => s.sales);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range === "month") {
      const t = new Date();
      setViewYear(t.getFullYear());
      setViewMonth(t.getMonth() + 1);
    }
  };

  const handlePrevMonth = () => {
    const prev = getPrevMonth(viewYear, viewMonth);
    setViewYear(prev.year);
    setViewMonth(prev.month);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(viewYear, viewMonth);
    const t = new Date();
    if (next.year > t.getFullYear() || (next.year === t.getFullYear() && next.month > t.getMonth() + 1)) {
      return;
    }
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const canGoNextMonth = (() => {
    const t = new Date();
    const next = getNextMonth(viewYear, viewMonth);
    return !(next.year > t.getFullYear() || (next.year === t.getFullYear() && next.month > t.getMonth() + 1));
  })();

  const dateRange = useMemo(() => {
    const today = todayStr();
    switch (timeRange) {
      case "today":
        return [today];
      case "week":
        return getWeekDates();
      case "last7days":
        return getLast7DaysDates();
      case "month":
        return getMonthDates(viewYear, viewMonth);
    }
  }, [timeRange, viewYear, viewMonth]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => dateRange.includes(s.date));
  }, [sales, dateRange]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
    const grossMargin = totalSales > 0 ? round2((totalProfit / totalSales) * 100) : 0;
    return {
      totalSales: round2(totalSales),
      totalCost: round2(totalCost),
      totalProfit: round2(totalProfit),
      grossMargin,
    };
  }, [filteredSales]);

  const hotProducts = useMemo(() => {
    const map = new Map<string, HotProduct>();
    filteredSales.forEach((sale: Sale) => {
      sale.items.forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          map.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            emoji: item.emoji,
            quantity: item.quantity,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [filteredSales]);

  const maxHotQty = hotProducts.length > 0 ? hotProducts[0].quantity : 0;

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    filteredSales.forEach((sale) => {
      const existing = map.get(sale.date) || 0;
      map.set(sale.date, existing + sale.totalAmount);
    });
    return dateRange.map((date) => {
      let label: string;
      switch (timeRange) {
        case "today":
          label = getDayLabel(date);
          break;
        case "month":
          label = `${formatDate(date)}`;
          break;
        default:
          label = `${formatDate(date)} ${getDayLabel(date)}`;
      }
      return {
        date,
        label,
        totalAmount: round2(map.get(date) || 0),
      };
    });
  }, [filteredSales, dateRange, timeRange]);

  const maxDayAmount = useMemo(() => {
    if (dailyTrend.length === 0) return 0;
    return Math.max(...dailyTrend.map((d) => d.totalAmount));
  }, [dailyTrend]);

  const timeButtons: { key: TimeRange; label: string }[] = [
    { key: "today", label: "今日" },
    { key: "week", label: "本周" },
    { key: "last7days", label: "最近7天" },
    { key: "month", label: "本月" },
  ];

  const statCards = [
    {
      label: "总销售额",
      value: fmtMoney(stats.totalSales),
      gradient: "from-brand-500 to-brand-300",
      icon: "💰",
    },
    {
      label: "总成本",
      value: fmtMoney(stats.totalCost),
      gradient: "from-orange-500 to-orange-300",
      icon: "📦",
    },
    {
      label: "总毛利",
      value: fmtMoney(stats.totalProfit),
      gradient: "from-success-500 to-success-400",
      icon: "📈",
    },
    {
      label: "毛利率",
      value: `${stats.grossMargin}%`,
      gradient: "from-purple-500 to-purple-400",
      icon: "🎯",
    },
  ];

  const brandColors = [
    "#FF6B35",
    "#FF8F4A",
    "#FFB17A",
    "#FFD0AE",
    "#FFE8D6",
    "#ED511A",
    "#C43E10",
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">经营报表</h1>
          <div className="flex items-center gap-2">
            {timeButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleTimeRangeChange(btn.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  timeRange === btn.key
                    ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-soft"
                    : "bg-white text-gray-600 hover:bg-brand-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
            {timeRange === "month" && (
              <div className="ml-2 flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 transition-all hover:bg-brand-50 hover:text-brand-500"
                >
                  ◀
                </button>
                <span className="min-w-[90px] text-center text-sm font-semibold text-gray-700">
                  {viewYear}年{viewMonth}月
                </span>
                <button
                  onClick={handleNextMonth}
                  disabled={!canGoNextMonth}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    canGoNextMonth
                      ? "bg-white text-gray-600 hover:bg-brand-50 hover:text-brand-500"
                      : "cursor-not-allowed bg-gray-100 text-gray-300"
                  }`}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-soft`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">{card.label}</span>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{card.value}</div>
              <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">热销商品排行</h2>
              {hotProducts.length > 0 && (
                <span className="chip bg-brand-500/10 text-brand-600">
                  🏆 最热销: {hotProducts[0].emoji} {hotProducts[0].productName}
                </span>
              )}
            </div>
            {hotProducts.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                暂无销售数据
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hotProducts}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis
                      type="category"
                      dataKey={(d: HotProduct) => `${d.emoji} ${d.productName}`}
                      width={90}
                      tick={{ fontSize: 13, fill: "#333" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} 件`, "销量"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="quantity" radius={[0, 8, 8, 0]} barSize={28}>
                      {hotProducts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.quantity === maxHotQty ? brandColors[0] : brandColors[index % brandColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">每日销售趋势</h2>
              {timeRange !== "today" && dailyTrend.some((d) => d.totalAmount === maxDayAmount && maxDayAmount > 0) && (
                <span className="chip bg-warn-500/10 text-warn-600">
                  🔥 生意最旺:{" "}
                  {timeRange === "month"
                    ? (() => {
                        const found = dailyTrend.find((d) => d.totalAmount === maxDayAmount);
                        return found ? `${formatDate(found.date)} ${getDayLabel(found.date)}` : found?.label;
                      })()
                    : dailyTrend.find((d) => d.totalAmount === maxDayAmount)?.label}
                </span>
              )}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyTrend}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickFormatter={(value) => {
                      const parts = value.split(" ");
                      return parts.length > 1 ? `${parts[0]}\n${parts[1]}` : value;
                    }}
                    angle={timeRange === "month" ? -45 : 0}
                    textAnchor={timeRange === "month" ? "end" : "middle"}
                    height={timeRange === "month" ? 80 : 50}
                    interval={timeRange === "month" ? 0 : undefined}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [fmtMoney(value), "销售额"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="none"
                    fill="url(#colorAmount)"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#FF6B35"
                    strokeWidth={3}
                    dot={(props: { cx: number; cy: number; value: number }) => {
                      const isMax = props.value === maxDayAmount && maxDayAmount > 0;
                      return (
                        <g>
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isMax ? 8 : 5}
                            fill={isMax ? "#FF4757" : "#FF6B35"}
                            stroke="white"
                            strokeWidth={2}
                          />
                          <text
                            x={props.cx}
                            y={props.cy - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fill={isMax ? "#FF4757" : "#666"}
                            fontWeight="600"
                          >
                            ¥{props.value}
                          </text>
                        </g>
                      );
                    }}
                    activeDot={{ r: 8, fill: "#FF6B35", stroke: "white", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
