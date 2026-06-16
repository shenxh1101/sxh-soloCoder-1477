import { useState, useMemo } from "react";
import { Pencil, Plus, Check, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Ingredient } from "@/types";
import { fmtMoney } from "@/utils/money";
import { cn } from "@/lib/utils";
import Modal from "@/components/Modal";

export default function Inventory() {
  const ingredients = useAppStore((s) => s.ingredients);
  const suppliers = useAppStore((s) => s.suppliers);
  const addIngredientStock = useAppStore((s) => s.addIngredientStock);
  const updateIngredientThreshold = useAppStore((s) => s.updateIngredientThreshold);
  const getLastPurchasePrice = useAppStore((s) => s.getLastPurchasePrice);
  const getRestockSuggestion = useAppStore((s) => s.getRestockSuggestion);

  const restockSuggestions = getRestockSuggestion(7);
  const needRestockItems = restockSuggestions.filter((item) => item.needRestock);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const lastPrice = useMemo(() => {
    if (!selectedIngredientId || !selectedSupplierId) return null;
    return getLastPurchasePrice(selectedIngredientId, selectedSupplierId);
  }, [selectedIngredientId, selectedSupplierId, getLastPurchasePrice]);

  const priceDiff = useMemo(() => {
    const current = parseFloat(unitPrice);
    if (!lastPrice || isNaN(current) || current <= 0) return null;
    const diff = current - lastPrice;
    const pct = ((diff / lastPrice) * 100).toFixed(1);
    if (Math.abs(diff) < 0.005) return { direction: "same" as const, diff: 0, pct: "0" };
    if (diff > 0) return { direction: "up" as const, diff, pct };
    return { direction: "down" as const, diff: Math.abs(diff), pct };
  }, [lastPrice, unitPrice]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingThreshold, setEditingThreshold] = useState("");

  const resetModal = () => {
    setSelectedIngredientId("");
    setSelectedSupplierId("");
    setQuantity("");
    setUnitPrice("");
  };

  const handleSubmit = () => {
    if (!selectedIngredientId || !selectedSupplierId || !quantity || !unitPrice) return;
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return;

    addIngredientStock({
      ingredientId: selectedIngredientId,
      supplierId: selectedSupplierId,
      quantity: qty,
      unitPrice: price,
    });
    resetModal();
    setModalOpen(false);
  };

  const startEditThreshold = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditingThreshold(String(ing.minThreshold));
  };

  const saveThreshold = (id: string) => {
    const val = parseFloat(editingThreshold);
    if (!isNaN(val) && val >= 0) {
      updateIngredientThreshold(id, val);
    }
    setEditingId(null);
    setEditingThreshold("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingThreshold("");
  };

  const getProgressPercent = (stock: number, minThreshold: number) => {
    const base = Math.max(minThreshold * 3, 1);
    return Math.min(100, Math.round((stock / base) * 100));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">库存管理</h1>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            原料入库
          </button>
        </div>

        {needRestockItems.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              🧠 智能补货建议（基于最近7天销量）
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {needRestockItems.map((item) => (
                <div
                  key={item.ingredientId}
                  className="card p-5 border-2 border-warn-200 bg-warn-50/50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{item.emoji}</span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.ingredientName}
                      </h3>
                    </div>
                    <span className="chip bg-warn-500/10 text-warn-600">
                      需要补货
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">当前库存</span>
                      <span className="font-medium text-gray-800">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">日均用量</span>
                      <span className="font-medium text-gray-800">
                        {item.dailyUsage} {item.unit}/天
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">还能撑</span>
                      <span
                        className={cn(
                          "font-semibold",
                          item.daysLeft <= 3 ? "text-red-500" : "text-gray-800"
                        )}
                      >
                        {item.daysLeft >= 999 ? "∞" : item.daysLeft}天
                        {item.daysLeft <= 3 && " ⚠️"}
                      </span>
                    </div>
                    <div className="my-3 border-t border-warn-200" />
                    <div className="flex justify-between">
                      <span className="text-gray-500">建议补货</span>
                      <span className="font-bold text-brand-600">
                        {item.suggestQty} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">预计花费</span>
                      <span className="font-bold text-gray-800">
                        {fmtMoney(item.estimatedCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {restockSuggestions.length > 0 && needRestockItems.length === 0 && (
          <div className="mb-8 card p-6 bg-success-50/50 border-2 border-success-200">
            <div className="flex items-center justify-center gap-3 text-success-600">
              <span className="text-3xl">✅</span>
              <span className="text-lg font-semibold">所有原料库存充足</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {ingredients.map((ing) => {
            const isLow = ing.stock <= ing.minThreshold;
            const progress = getProgressPercent(ing.stock, ing.minThreshold);
            const isEditing = editingId === ing.id;

            return (
              <div
                key={ing.id}
                className={cn(
                  "card p-5 transition-all",
                  isLow && "bg-warn-50 animate-pulse-slow"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{ing.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">{ing.name}</h3>
                      {isLow && (
                        <span className="chip bg-warn-500/10 text-warn-600">
                          ⚠️ 库存不足
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <div className="text-xs text-gray-500">当前库存</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {ing.stock}
                          <span className="ml-1 text-sm font-normal text-gray-500">
                            {ing.unit}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">单位</div>
                        <div className="text-lg font-semibold text-gray-800">{ing.unit}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          最低阈值
                          {!isEditing && (
                            <button
                              onClick={() => startEditThreshold(ing)}
                              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editingThreshold}
                              onChange={(e) => setEditingThreshold(e.target.value)}
                              className="input h-8 w-20 px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => saveThreshold(ing.id)}
                              className="rounded p-1 text-success-600 hover:bg-success-500/10"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-lg font-semibold text-gray-800">
                            {ing.minThreshold}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">均价</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {fmtMoney(ing.avgCost)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isLow
                              ? "bg-warn-500"
                              : progress < 50
                              ? "bg-brand-400"
                              : "bg-success-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Modal
          open={modalOpen}
          onClose={() => {
            resetModal();
            setModalOpen(false);
          }}
          title="原料入库"
        >
          <div className="space-y-4">
            <div>
              <label className="label">选择原料</label>
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
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
            <div>
              <label className="label">选择供货商</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="input"
              >
                <option value="">请选择供货商</option>
                {suppliers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入数量"
                className="input"
                min="0"
                step="any"
              />
            </div>
            <div>
              <label className="label">单价（元）</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="请输入单价"
                className="input"
                min="0"
                step="any"
              />
              {lastPrice !== null && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs text-blue-500">
                    上次进价：¥{lastPrice.toFixed(2)}/单位
                  </p>
                  {priceDiff && (
                    <div
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-xs font-medium",
                        priceDiff.direction === "up" && "bg-red-50 text-red-600",
                        priceDiff.direction === "down" && "bg-green-50 text-green-600",
                        priceDiff.direction === "same" && "bg-gray-100 text-gray-500"
                      )}
                    >
                      {priceDiff.direction === "up" && (
                        <>⚠️ 比上次涨价 ¥{priceDiff.diff.toFixed(2)} (+{priceDiff.pct}%)</>
                      )}
                      {priceDiff.direction === "down" && (
                        <>📉 比上次降价 ¥{priceDiff.diff.toFixed(2)} (-{priceDiff.pct}%)</>
                      )}
                      {priceDiff.direction === "same" && <>与上次进价相同</>}
                    </div>
                  )}
                </div>
              )}
            </div>
            {quantity && unitPrice && !isNaN(parseFloat(quantity)) && !isNaN(parseFloat(unitPrice)) && (
              <div className="rounded-xl bg-brand-50 px-4 py-3 space-y-1">
                <div className="text-sm text-brand-600">
                  总金额：
                  <span className="text-lg font-semibold">
                    {fmtMoney(parseFloat(quantity) * parseFloat(unitPrice))}
                  </span>
                </div>
                {lastPrice !== null && (
                  <div className="text-xs text-brand-400">
                    上次总金额：{fmtMoney(parseFloat(quantity) * lastPrice)}
                    {priceDiff && priceDiff.direction !== "same" && (
                      <span
                        className={cn(
                          "ml-2",
                          priceDiff.direction === "up" && "text-red-500",
                          priceDiff.direction === "down" && "text-green-500"
                        )}
                      >
                        {priceDiff.direction === "up" ? "多" : "少"}付 ¥
                        {(Math.abs(parseFloat(quantity)) * priceDiff.diff).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => {
                  resetModal();
                  setModalOpen(false);
                }}
              >
                取消
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={
                  !selectedIngredientId ||
                  !selectedSupplierId ||
                  !quantity ||
                  !unitPrice ||
                  isNaN(parseFloat(quantity)) ||
                  isNaN(parseFloat(unitPrice)) ||
                  parseFloat(quantity) <= 0 ||
                  parseFloat(unitPrice) <= 0
                }
              >
                确认入库
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
