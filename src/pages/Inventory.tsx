import { useState } from "react";
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

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
            </div>
            {quantity && unitPrice && !isNaN(parseFloat(quantity)) && !isNaN(parseFloat(unitPrice)) && (
              <div className="rounded-xl bg-brand-50 px-4 py-3">
                <div className="text-sm text-brand-600">
                  总金额：
                  <span className="text-lg font-semibold">
                    {fmtMoney(parseFloat(quantity) * parseFloat(unitPrice))}
                  </span>
                </div>
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
