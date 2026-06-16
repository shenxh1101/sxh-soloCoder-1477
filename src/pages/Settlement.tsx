import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { todayStr, formatDateFull } from "@/utils/date";
import { fmtMoney, round2 } from "@/utils/money";
import { cn } from "@/lib/utils";

interface ProductSummary {
  productId: string;
  productName: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cost: number;
  profit: number;
}

interface IngredientUsageWithStock {
    ingredientId: string;
    ingredientName: string;
    emoji: string;
    unit: string;
    used: number;
    avgCost: number;
    totalCost: number;
    remainingStock: number;
    minThreshold: number;
  }

export default function Settlement() {
  const sales = useAppStore((s) => s.sales);
  const ingredients = useAppStore((s) => s.ingredients);
  const getIngredientUsage = useAppStore((s) => s.getIngredientUsage);
  const today = todayStr();

  const todaySales = useMemo(
    () => sales.filter((s) => s.date === today),
    [sales, today]
  );

  const stats = useMemo(() => {
    const totalSales = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = todaySales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
    const grossMargin = totalSales > 0 ? round2((totalProfit / totalSales) * 100) : 0;
    return {
      totalSales: round2(totalSales),
      totalCost: round2(totalCost),
      totalProfit: round2(totalProfit),
      grossMargin,
    };
  }, [todaySales]);

  const productSummaries = useMemo(() => {
    const map = new Map<string, ProductSummary>();
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.subtotal = round2(existing.subtotal + item.subtotal);
          existing.cost = round2(existing.cost + item.cost);
          existing.profit = round2(existing.subtotal - existing.cost);
        } else {
          map.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            emoji: item.emoji,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            cost: item.cost,
            profit: round2(item.subtotal - item.cost),
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.subtotal - a.subtotal);
  }, [todaySales]);

  const summaryTotals = useMemo(() => {
    const totalQty = productSummaries.reduce((s, p) => s + p.quantity, 0);
    const totalSubtotal = productSummaries.reduce((s, p) => s + p.subtotal, 0);
    const totalCost = productSummaries.reduce((s, p) => s + p.cost, 0);
    const totalProfit = productSummaries.reduce((s, p) => s + p.profit, 0);
    return { totalQty, totalSubtotal, totalCost, totalProfit };
  }, [productSummaries]);

  const todayIngredientUsage = useMemo((): IngredientUsageWithStock[] => {
    const usage = getIngredientUsage([today, today]);
    return usage.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      return {
        ...item,
        remainingStock: ing?.stock ?? 0,
        minThreshold: ing?.minThreshold ?? 0,
      };
    });
  }, [getIngredientUsage, today, ingredients]);

  const totalIngredientCost = useMemo(
    () => round2(todayIngredientUsage.reduce((sum, item) => sum + item.totalCost, 0)),
    [todayIngredientUsage]
  );

  const sortedSales = useMemo(
    () => [...todaySales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [todaySales]
  );

  const getOrderSummary = (items: { productName: string; emoji: string; quantity: number }[]) => {
    return items.map((it) => `${it.productName}×${it.quantity}`).join(", ");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    const lines: string[] = [];
    lines.push("========== 早点管家 ==========");
    lines.push(`日期：${formatDateFull(today)}`);
    lines.push("--------------------------");
    productSummaries.forEach((p) => {
      const name = p.productName.padEnd(8, " ");
      const qty = `×${p.quantity}`.padEnd(4, " ");
      lines.push(`${name}${qty}${fmtMoney(p.subtotal)}`);
    });
    lines.push("--------------------------");
    lines.push(`合计：          ${fmtMoney(summaryTotals.totalSubtotal)}`);
    lines.push(`成本：          ${fmtMoney(summaryTotals.totalCost)}`);
    lines.push(`毛利：          ${fmtMoney(summaryTotals.totalProfit)}`);
    if (todayIngredientUsage.length > 0) {
      lines.push("--------------------------");
      lines.push("原料消耗：");
      todayIngredientUsage.forEach((item) => {
        const name = item.ingredientName.padEnd(8, " ");
        const qty = `${item.used}${item.unit}`.padEnd(6, " ");
        lines.push(`  ${name}${qty}${fmtMoney(item.totalCost)}`);
      });
      lines.push(`原料总成本：    ${fmtMoney(totalIngredientCost)}`);
    }
    lines.push("==========================");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `结算_${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "销售额",
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
      label: "毛利",
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

  if (todaySales.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">今日结算</h1>
            <span className="chip bg-brand-500/10 text-brand-600">
              {formatDateFull(today)}
            </span>
          </div>
          <div className="card flex h-64 items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="mb-2 text-4xl">📭</p>
              <p className="text-lg">今日暂无订单</p>
              <p className="text-sm">收银台结账后数据将自动同步</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          aside,
          header,
          .no-print {
            display: none !important;
          }
          .ml-60 {
            margin-left: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">今日结算</h1>
              <span className="chip bg-brand-500/10 text-brand-600">
                {formatDateFull(today)}
              </span>
            </div>
            <div className="no-print flex gap-3">
              <button onClick={handlePrint} className="btn-secondary text-sm">
                🖨️ 打印小票
              </button>
              <button onClick={handleExportText} className="btn-primary text-sm">
                📄 导出文本
              </button>
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

          <div className="card mb-6 p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">商品销售明细</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">商品</th>
                    <th className="pb-3 pr-4 font-medium text-right">销量(份)</th>
                    <th className="pb-3 pr-4 font-medium text-right">单价</th>
                    <th className="pb-3 pr-4 font-medium text-right">小计</th>
                    <th className="pb-3 pr-4 font-medium text-right">成本</th>
                    <th className="pb-3 font-medium text-right">毛利</th>
                  </tr>
                </thead>
                <tbody>
                  {productSummaries.map((p) => (
                    <tr key={p.productId} className="border-b border-gray-50">
                      <td className="py-3 pr-4">
                        <span className="mr-1.5">{p.emoji}</span>
                        {p.productName}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-700">{p.quantity}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{fmtMoney(p.unitPrice)}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{fmtMoney(p.subtotal)}</td>
                      <td className="py-3 pr-4 text-right text-gray-500">{fmtMoney(p.cost)}</td>
                      <td className="py-3 text-right font-medium text-success-600">
                        {fmtMoney(p.profit)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-3 pr-4 font-bold text-gray-800">合计</td>
                    <td className="py-3 pr-4 text-right font-bold text-gray-800">
                      {summaryTotals.totalQty}
                    </td>
                    <td className="py-3 pr-4" />
                    <td className="py-3 pr-4 text-right font-bold text-gray-800">
                      {fmtMoney(summaryTotals.totalSubtotal)}
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-gray-800">
                      {fmtMoney(summaryTotals.totalCost)}
                    </td>
                    <td className="py-3 text-right font-bold text-success-600">
                      {fmtMoney(summaryTotals.totalProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card mb-6 p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">今日原料消耗</h2>
            {todayIngredientUsage.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">原料</th>
                      <th className="pb-3 pr-4 font-medium text-right">今日消耗</th>
                      <th className="pb-3 pr-4 font-medium text-right">剩余库存</th>
                      <th className="pb-3 pr-4 font-medium text-right">单位</th>
                      <th className="pb-3 pr-4 font-medium text-right">消耗成本</th>
                      <th className="pb-3 font-medium text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayIngredientUsage.map((item) => {
                      const isLow = item.remainingStock <= item.minThreshold;
                      return (
                        <tr key={item.ingredientId} className="border-b border-gray-50">
                          <td className="py-3 pr-4">
                            <span className="mr-1.5">{item.emoji}</span>
                            {item.ingredientName}
                          </td>
                          <td className="py-3 pr-4 text-right font-medium text-gray-700">
                            {item.used}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700">
                            {item.remainingStock}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-500">
                            {item.unit}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700">
                            {fmtMoney(item.totalCost)}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={cn(
                                "chip",
                                isLow
                                  ? "bg-warn-500/10 text-warn-600"
                                  : "bg-success-500/10 text-success-600"
                              )}
                            >
                              {isLow ? "⚠️ 需补货" : "✅ 充足"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gray-200">
                      <td className="py-3 pr-4 font-bold text-gray-800" colSpan={4}>
                        合计
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-gray-800">
                        {fmtMoney(totalIngredientCost)}
                      </td>
                      <td className="py-3" />
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="mb-2 text-3xl">📭</p>
                  <p className="text-sm">今日暂无原料消耗</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">今日订单列表</h2>
            <div className="space-y-2">
              {sortedSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {sale.createdAt.split(" ")[1] || sale.createdAt}
                    </span>
                    <span className="text-sm text-gray-700">
                      {getOrderSummary(sale.items)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {fmtMoney(sale.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
