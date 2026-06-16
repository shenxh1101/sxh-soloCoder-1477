import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { fmtMoney } from "@/utils/money";
import { formatDate } from "@/utils/date";
import { calcPurchasePriceDiff } from "@/utils/priceDiff";
import { cn } from "@/lib/utils";
import Empty from "@/components/Empty";

export default function Purchases() {
  const purchases = useAppStore((s) => s.purchases);
  const ingredients = useAppStore((s) => s.ingredients);
  const [filterIngredientId, setFilterIngredientId] = useState("");

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
