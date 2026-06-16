import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { fmtMoney, round2 } from "@/utils/money";
import { formatDate } from "@/utils/date";
import { calcPurchasePriceDiff, type PriceDiff } from "@/utils/priceDiff";
import { cn } from "@/lib/utils";
import Empty from "@/components/Empty";
import type { Purchase } from "@/types";

const SUPPLIER_COLORS = [
  "#FF6B35",
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#FF9800",
  "#00BCD4",
  "#E91E63",
  "#607D8B",
];

export default function Purchases() {
  const purchases = useAppStore((s) => s.purchases);
  const ingredients = useAppStore((s) => s.ingredients);
  const suppliers = useAppStore((s) => s.suppliers);
  const [filterIngredientId, setFilterIngredientId] = useState("");

  const [trendExpanded, setTrendExpanded] = useState(true);
  const [trendIngredientId, setTrendIngredientId] = useState("");
  const [trendSupplierId, setTrendSupplierId] = useState("");

  const filteredPurchases = useMemo(() => {
    const list = filterIngredientId
      ? purchases.filter((p) => p.ingredientId === filterIngredientId)
      : purchases;
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, filterIngredientId]);

  const totalAmount = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  }, [filteredPurchases]);

  const ingredientById = useMemo(() => {
    const map = new Map<string, { emoji: string; name: string }>();
    ingredients.forEach((i) => map.set(i.id, { emoji: i.emoji, name: i.name }));
    return map;
  }, [ingredients]);

  const trendPurchases = useMemo(() => {
    if (!trendIngredientId) return [];
    let list = purchases.filter((p) => p.ingredientId === trendIngredientId);
    if (trendSupplierId) {
      list = list.filter((p) => p.supplierId === trendSupplierId);
    }
    return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [purchases, trendIngredientId, trendSupplierId]);

  const trendSupplierIds = useMemo(() => {
    const ids = new Set<string>();
    trendPurchases.forEach((p) => ids.add(p.supplierId));
    return Array.from(ids);
  }, [trendPurchases]);

  const supplierColorMap = useMemo(() => {
    const map = new Map<string, string>();
    trendSupplierIds.forEach((id, idx) => {
      map.set(id, SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length]);
    });
    return map;
  }, [trendSupplierIds]);

  const supplierById = useMemo(() => {
    const map = new Map<string, { name: string }>();
    suppliers.forEach((s) => map.set(s.id, { name: s.name }));
    return map;
  }, [suppliers]);

  const trendStats = useMemo(() => {
    if (trendPurchases.length === 0) return null;

    const prices = trendPurchases.map((p) => p.unitPrice);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const latestPrice = prices[prices.length - 1];

    let latestDiff: PriceDiff | null = null;
    if (trendPurchases.length >= 2) {
      const sortedDesc = [...trendPurchases].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      latestDiff = calcPurchasePriceDiff(purchases, sortedDesc[0]);
    }

    return { maxPrice, minPrice, latestPrice, latestDiff };
  }, [trendPurchases, purchases]);

  const chartData = useMemo(() => {
    if (trendPurchases.length === 0) return [];

    const dateMap = new Map<string, Record<string, number | string>>();

    trendPurchases.forEach((p) => {
      if (!dateMap.has(p.date)) {
        dateMap.set(p.date, { date: formatDate(p.date) });
      }
      const entry = dateMap.get(p.date)!;
      entry[p.supplierId] = p.unitPrice;
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      const dateA = new Date(String(a.date).replace(/(\d+)月(\d+)日/, `2024-$1-$2`)).getTime();
      const dateB = new Date(String(b.date).replace(/(\d+)月(\d+)日/, `2024-$1-$2`)).getTime();
      return dateA - dateB;
    });
  }, [trendPurchases]);

  const trendHistory = useMemo(() => {
    return [...trendPurchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [trendPurchases]);

  const availableSuppliersForTrend = useMemo(() => {
    if (!trendIngredientId) return [];
    const supplierIds = new Set<string>();
    purchases
      .filter((p) => p.ingredientId === trendIngredientId)
      .forEach((p) => supplierIds.add(p.supplierId));
    return suppliers.filter((s) => supplierIds.has(s.id));
  }, [trendIngredientId, purchases, suppliers]);

  const handleTrendIngredientChange = (value: string) => {
    setTrendIngredientId(value);
    setTrendSupplierId("");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">进货记录</h1>
          <div className="flex items-center gap-3">
            <div className="w-56">
              <select
                value={filterIngredientId}
                onChange={(e) => setFilterIngredientId(e.target.value)}
                className="input"
              >
                <option value="">全部原料</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.emoji} {ing.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-brand-50 px-4 py-2.5">
              <span className="text-sm text-brand-600">总进货金额：</span>
              <span className="text-lg font-bold text-brand-600">{fmtMoney(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 card overflow-hidden">
          <button
            onClick={() => setTrendExpanded(!trendExpanded)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-cream-50"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">价格趋势</h2>
            </div>
            {trendExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </button>

          {trendExpanded && (
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="w-56">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    选择原料 <span className="text-warn-500">*</span>
                  </label>
                  <select
                    value={trendIngredientId}
                    onChange={(e) => handleTrendIngredientChange(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择原料</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.emoji} {ing.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-56">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    选择供货商（选填）
                  </label>
                  <select
                    value={trendSupplierId}
                    onChange={(e) => setTrendSupplierId(e.target.value)}
                    className="input"
                    disabled={!trendIngredientId}
                  >
                    <option value="">全部供货商</option>
                    {availableSuppliersForTrend.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!trendIngredientId ? (
                <div className="flex h-60 items-center justify-center">
                  <p className="text-sm text-gray-400">请选择原料查看价格趋势</p>
                </div>
              ) : trendPurchases.length === 0 ? (
                <div className="flex h-60 items-center justify-center">
                  <Empty />
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">最高单价</p>
                      <p className="mt-1 text-lg font-bold text-gray-800">
                        {fmtMoney(trendStats!.maxPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">最低单价</p>
                      <p className="mt-1 text-lg font-bold text-gray-800">
                        {fmtMoney(trendStats!.minPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-3">
                      <p className="text-xs text-brand-600">最新单价</p>
                      <p className="mt-1 text-lg font-bold text-brand-600">
                        {fmtMoney(trendStats!.latestPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">最近涨跌</p>
                      {trendStats!.latestDiff ? (
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-0.5 text-sm font-bold",
                            trendStats!.latestDiff.type === "up"
                              ? "text-warn-500"
                              : trendStats!.latestDiff.type === "down"
                              ? "text-success-600"
                              : "text-gray-500"
                          )}
                        >
                          {trendStats!.latestDiff.type === "up" && <ArrowUp size={14} />}
                          {trendStats!.latestDiff.type === "down" && <ArrowDown size={14} />}
                          {trendStats!.latestDiff.type === "same" && <Minus size={14} />}
                          {trendStats!.latestDiff.type !== "same" && (
                            <>
                              {fmtMoney(trendStats!.latestDiff.diff)}
                              <span className="text-xs opacity-70">
                                ({trendStats!.latestDiff.percent}%)
                              </span>
                            </>
                          )}
                          {trendStats!.latestDiff.type === "same" && "持平"}
                        </span>
                      ) : (
                        <p className="mt-1 text-sm text-gray-300">—</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#9ca3af" }}
                          tickFormatter={(value) => `¥${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [fmtMoney(value), "单价"]}
                          labelFormatter={(label) => `日期: ${label}`}
                        />
                        {trendSupplierIds.length > 1 && <Legend />}
                        {trendSupplierIds.map((supplierId) => (
                          <Line
                            key={supplierId}
                            type="monotone"
                            dataKey={supplierId}
                            name={supplierById.get(supplierId)?.name || supplierId}
                            stroke={supplierColorMap.get(supplierId) || "#FF6B35"}
                            strokeWidth={2}
                            dot={{ r: 4, fill: supplierColorMap.get(supplierId) || "#FF6B35" }}
                            activeDot={{ r: 6 }}
                            label={{
                              position: "top",
                              fontSize: 10,
                              fill: supplierColorMap.get(supplierId) || "#FF6B35",
                              formatter: (value: number) => fmtMoney(value),
                            }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-600">历史记录</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-cream-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                              日期
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                              供货商
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                              单价
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                              涨跌
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                              总金额
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendHistory.map((p) => {
                            const diff = calcPurchasePriceDiff(purchases, p);
                            return (
                              <tr
                                key={p.id}
                                className="border-b border-gray-50 transition-colors last:border-none hover:bg-cream-50"
                              >
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {formatDate(p.date)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {p.supplierName}
                                </td>
                                <td className="px-3 py-2 text-right text-sm text-gray-700">
                                  {fmtMoney(p.unitPrice)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {diff ? (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                        diff.type === "up"
                                          ? "bg-warn-500/10 text-warn-500"
                                          : diff.type === "down"
                                          ? "bg-success-500/10 text-success-600"
                                          : "bg-gray-100 text-gray-500"
                                      )}
                                    >
                                      {diff.type === "up" && <ArrowUp size={10} />}
                                      {diff.type === "down" && <ArrowDown size={10} />}
                                      {diff.type === "same" && <Minus size={10} />}
                                      {diff.type !== "same" && (
                                        <>
                                          {fmtMoney(diff.diff)}
                                          <span className="opacity-70">({diff.percent}%)</span>
                                        </>
                                      )}
                                      {diff.type === "same" && "持平"}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-sm font-semibold text-brand-600">
                                    {fmtMoney(p.totalCost)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="h-80">
            <Empty />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-cream-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      日期
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      原料名称
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      供货商
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                      数量
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                      单价
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                      涨跌
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                      总金额
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p) => {
                    const ing = ingredientById.get(p.ingredientId);
                    const diff = calcPurchasePriceDiff(purchases, p);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 transition-colors last:border-none hover:bg-cream-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ing?.emoji}</span>
                            <span className="text-sm font-medium text-gray-800">
                              {p.ingredientName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.supplierName}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                          {p.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          {fmtMoney(p.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {diff ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                diff.type === "up"
                                  ? "bg-warn-500/10 text-warn-500"
                                  : diff.type === "down"
                                  ? "bg-success-500/10 text-success-600"
                                  : "bg-gray-100 text-gray-500"
                              )}
                            >
                              {diff.type === "up" && <ArrowUp size={12} />}
                              {diff.type === "down" && <ArrowDown size={12} />}
                              {diff.type === "same" && <Minus size={12} />}
                              {diff.type !== "same" && (
                                <>
                                  {fmtMoney(diff.diff)}
                                  <span className="opacity-70">({diff.percent}%)</span>
                                </>
                              )}
                              {diff.type === "same" && "持平"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-brand-600">
                            {fmtMoney(p.totalCost)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
